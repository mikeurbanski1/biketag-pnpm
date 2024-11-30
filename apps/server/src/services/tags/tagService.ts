import { CreateTagParams, TagDto, MinimalTag, tagFields } from '@biketag/models';
import { BaseService } from '../../common/baseService';
import { TagEntity } from '../../dal/models/tag';
import { TagDalService } from '../../dal/services/tagDalService';
import { BaseEntityWithoutId } from '../../dal/models';
import { GameService } from '../games/gamesService';
import { UserService } from '../users/userService';
import { validateExists } from '../../common/entityValidators';
import { CannotPostTagError, tagServiceErrors } from '../../common/errors';
import { UUID } from 'mongodb';
import dayjs, { Dayjs } from 'dayjs';
import { isSameDate } from '@biketag/utils';

export class TagService extends BaseService<TagDto, CreateTagParams, TagEntity, TagDalService> {
    private readonly usersService: UserService;
    private readonly gamesService: GameService;

    constructor({ usersService, gamesService }: { usersService?: UserService; gamesService?: GameService } = {}) {
        super({ prefix: 'TagService', dalService: new TagDalService(), serviceErrors: tagServiceErrors });
        this.usersService = usersService ?? new UserService();
        this.gamesService = gamesService ?? new GameService({ tagsService: this });
    }

    protected async convertToUpsertEntity(dto: CreateTagParams): Promise<BaseEntityWithoutId<TagEntity>> {
        return await this.convertToNewEntity(dto);
    }

    protected async convertToNewEntity(dto: CreateTagParams): Promise<BaseEntityWithoutId<TagEntity>> {
        const postedDate = dto.postedDate ?? new Date().toISOString();
        this.logger.info(`[convertToEntity]`, { dto });
        return {
            ...dto,
            postedDate,
            points: await this.calculateNewTagPoints(dto)
        };
    }

    private async calculateNewTagPoints(dto: CreateTagParams): Promise<number> {
        if (dto.isRoot) {
            return 5;
        }
        this.logger.info(`[calculateNewTagPoints] for non-root tag`, { postedDate: dto.postedDate ?? 'undefined' });
        const postedDate = dayjs(dto.postedDate);
        const rootTag = await this.dalService.getByIdRequired({ id: dto.rootTagId! });
        const sameDate = isSameDate(postedDate, rootTag.postedDate);
        this.logger.info(`[calculateNewTagPoints] is same date: ${sameDate}`);
        return sameDate ? 5 : 1;
    }

    protected async convertToDto(entity: TagEntity): Promise<TagDto>;
    protected async convertToDto(entity: null): Promise<null>;
    protected async convertToDto(entity: TagEntity | null): Promise<TagDto | null> {
        if (!entity) {
            return null;
        }
        return {
            id: entity.id,
            name: entity.name,
            creator: await this.usersService.getRequired({ id: entity.creatorId }),
            gameId: entity.gameId,
            parentTag: entity.parentTagId ? await this.getMinimalTag({ id: entity.parentTagId }) : undefined,
            nextTag: entity.nextTagId ? await this.getMinimalTag({ id: entity.nextTagId }) : undefined,
            rootTag: entity.rootTagId ? await this.getMinimalTag({ id: entity.rootTagId }) : undefined,
            isRoot: entity.isRoot,
            previousRootTag: entity.previousRootTagId ? await this.getMinimalTag({ id: entity.previousRootTagId }) : undefined,
            nextRootTag: entity.nextRootTagId ? await this.getMinimalTag({ id: entity.nextRootTagId }) : undefined,
            postedDate: entity.postedDate,
            contents: entity.contents,
            points: entity.points
        };
    }

    protected async getMinimalTag({ id }: { id: string }): Promise<MinimalTag> {
        this.logger.info(`[getMinimalTag]`, { id });
        // must go straight to the DAL service to avoid infinite loop
        const tag = await this.dalService.getByIdRequired({ id });
        return {
            id: tag.id,
            name: tag.name,
            postedDate: tag.postedDate,
            creator: await this.usersService.getRequired({ id: tag.creatorId }),
            contents: tag.contents
        };
    }

    private async updateTagLinks({ tagIdToUpdate, tagIdToSet, fields }: { tagIdToUpdate: string; tagIdToSet: string; fields: (typeof tagFields)[number][] }): Promise<TagEntity> {
        this.logger.info('[updateTagLink]', { tagIdToUpdate, tagIdToSet, fields });
        const updateFields = fields.reduce((params, field) => {
            params[field] = tagIdToSet;
            return params;
        }, {} as Partial<TagEntity>);
        return await this.dalService.update({ id: tagIdToUpdate, updateParams: updateFields });
    }

    public override async create(params: CreateTagParams): Promise<TagDto> {
        this.logger.info(`[create]`, { params });
        const { isRoot, gameId } = params;
        if (isRoot) {
            const { result, reason } = await this.canPostNewTag({ userId: params.creatorId, gameId, dateOverride: params.postedDate ? dayjs(params.postedDate) : undefined });
            if (!result) {
                throw new CannotPostTagError(reason);
            }
            await this.validateRootTagLinks(params);
        } else {
            if (await this.userInTagChain({ userId: params.creatorId, tagId: params.rootTagId! })) {
                throw new CannotPostTagError(`User ${params.creatorId} has already posted a tag for ${params.rootTagId}`);
            }
        }

        // create a new tag object id now so we can update references with fewer calls / cleaner flow
        const tagUUID = new UUID().toString();
        const points = await this.calculateNewTagPoints(params);

        const createParams: TagEntity = { ...params, id: tagUUID, postedDate: params.postedDate ?? new Date().toISOString(), points };

        if (isRoot) {
            // before we update the game, get the current latest root tag, and point it to this as the next root
            // then point this back to it
            const game = await this.gamesService.getRequiredAsEntity({ id: gameId });
            const { latestRootTagId } = game;
            if (latestRootTagId) {
                await this.updateTagLinks({ tagIdToUpdate: latestRootTagId, tagIdToSet: tagUUID, fields: ['nextRootTagId'] });
                await this.dalService.updateMany({ filter: { gameId, rootTagId: latestRootTagId }, updateParams: { nextRootTagId: tagUUID } });
                createParams.previousRootTagId = latestRootTagId;
            }
        } else {
            const parentTag = await this.setLastTagInChain({ tag: createParams, tagId: tagUUID });

            createParams.nextRootTagId = parentTag.nextRootTagId;
            createParams.previousRootTagId = parentTag.previousRootTagId;
            createParams.parentTagId = parentTag.id;
        }

        const tag = await this.dalService.create(createParams);

        await this.gamesService.setTagInGame({ gameId, tagId: tagUUID, root: isRoot });
        await this.gamesService.addScoreForPlayer({ gameId, playerId: tag.creatorId, score: tag.points });

        return await this.convertToDto(tag);
    }

    /**
     * Sets the tag ID to be the next tag of the current last tag in the chain. Returns that tag.
     */
    private async setLastTagInChain({ tag, tagId }: { tag: CreateTagParams; tagId: string }): Promise<TagEntity> {
        this.logger.info(`[setLastTagInChain]`, { tag });
        const rootTagId = tag.rootTagId!;
        // find the tag that is in this game,
        // and, either:
        // - has the same root tag as the tag we are adding, or
        // - is the rootTag of this chain (meaning we are adding the first subtag)
        // and has no next tag (is the last in the chain)
        const filter = {
            $and: [
                {
                    gameId: tag.gameId
                },
                {
                    $or: [
                        {
                            rootTagId
                        },
                        {
                            $and: [
                                {
                                    ...this.dalService.getIdFilter(rootTagId),
                                    isRoot: true
                                }
                            ]
                        }
                    ]
                },
                {
                    nextTagId: { $exists: false }
                }
            ]
        };
        const parentTag = (await this.dalService.findOne({ filter }))!;
        await this.updateTagLinks({ tagIdToUpdate: parentTag.id, tagIdToSet: tagId, fields: ['nextTagId'] });
        return parentTag;
    }

    /**
     * Returns whether the given user is the creator of this tag or any tag in the chain below this one (should generally be called with the root tag)
     */
    public async userInTagChain({ userId, tagId }: { userId: string; tagId: string }): Promise<boolean> {
        this.logger.info(`[userInTagChain]`, { userId, tagId });
        const tag = await this.dalService.getByIdRequired({ id: tagId });
        if (tag.creatorId === userId) {
            return true;
        }
        if (tag.nextTagId) {
            return this.userInTagChain({ userId, tagId: tag.nextTagId });
        }
        return false;
    }

    /**
     * Returns whether a user can post a new tag for the given game
     * - Must be the winner of the previous tag
     */
    public async canPostNewTag({ userId, gameId, dateOverride = dayjs() }: { userId?: string; gameId: string; dateOverride?: Dayjs }): Promise<{ result: boolean; reason?: string }> {
        const game = await this.gamesService.getRequiredAsEntity({ id: gameId });
        if (!game.latestRootTagId) {
            return { result: true };
        }
        const latestRootTag = await this.getRequired({ id: game.latestRootTagId });
        if (isSameDate(dateOverride, latestRootTag.postedDate)) {
            return { result: false, reason: 'A tag has already been posted today' };
        }
        const tagWinner = latestRootTag.nextTag?.creator.id;
        if (tagWinner !== userId) {
            return { result: false, reason: 'User did not win the previous tag' };
        }
        return { result: true };
    }

    /**
     * Validates the links for a new tag: creator, game, and parent and root tags
     */
    private async validateRootTagLinks(tag: CreateTagParams): Promise<void> {
        const promises = [validateExists(tag.creatorId, this.usersService), validateExists(tag.gameId, this.gamesService)];

        if (tag.rootTagId) {
            promises.push(validateExists(tag.rootTagId, this));
        }

        await Promise.all(promises);
    }
}
