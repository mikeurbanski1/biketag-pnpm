import dayjs, { Dayjs } from 'dayjs';
import { UUID } from 'mongodb';

import { CreateTagParams, MinimalTag, PendingTag, TagDto, tagFields } from '@biketag/models';
import { getDateOnly, isEarlierDate, isSameDate } from '@biketag/utils';

import { BaseService } from '../../common/baseService';
import { validateExists } from '../../common/entityValidators';
import { CannotPostTagError, tagServiceErrors } from '../../common/errors';
import { BaseEntityWithoutId } from '../../dal/models';
import { TagEntity } from '../../dal/models/tag';
import { TagDalService } from '../../dal/services/tagDalService';
import { QueueManager } from '../../queue/manager';
import { GameService } from '../games/gameService';
import { ScoreService } from '../scores/scoreService';
import { UserService } from '../users/userService';

export class TagService extends BaseService<TagDto, CreateTagParams, TagEntity, TagDalService> {
    private readonly usersService: UserService;
    private readonly gamesService: GameService;
    private readonly scoreService: ScoreService;

    constructor({ usersService, gamesService }: { usersService?: UserService; gamesService?: GameService } = {}) {
        super({ prefix: 'TagService', dalService: new TagDalService(), serviceErrors: tagServiceErrors });
        this.usersService = usersService ?? new UserService();
        this.gamesService = gamesService ?? new GameService({ tagsService: this });
        this.scoreService = new ScoreService();
    }

    /**
     * Gets the tag by ID, but returns a pending tag if the tag state is pending and the requesting user is not the creator (i.e., others cannot see it before it goes live)
     */
    public async getWithPendingCheck({ tagId, userId }: { tagId: string; userId: string }): Promise<TagDto | PendingTag | null> {
        const tag = await this.dalService.getById({ id: tagId });
        if (!tag) {
            return null;
        }
        if (tag.creatorId !== userId && (await this.gamesService.getRequiredAsEntity({ id: tag.gameId })).pendingRootTagId === tagId) {
            return {
                id: tag.id,
                creator: await this.usersService.getRequired({ id: tag.creatorId }),
                isPendingTagView: true,
            };
        }
        return await this.convertToDto(tag);
    }

    public async getPendingTag({ id }: { id: string }): Promise<PendingTag> {
        const tag = await this.dalService.getByIdRequired({ id });
        return {
            id: tag.id,
            creator: await this.usersService.getRequired({ id: tag.creatorId }),
            isPendingTagView: true,
        };
    }

    protected async convertToUpsertEntity(dto: CreateTagParams): Promise<BaseEntityWithoutId<TagEntity>> {
        return await this.convertToNewEntity(dto);
    }

    protected async convertToNewEntity(dto: CreateTagParams): Promise<BaseEntityWithoutId<TagEntity>> {
        const postedDate = dto.postedDate ?? dayjs().toISOString();
        this.logger.info(`[convertToEntity]`, { dto });
        // @ts-ignore this method will not be used because we have our own create method - TODO fix this
        return {
            ...dto,
            postedDate,
        };
    }

    protected async convertToDto(entity: TagEntity): Promise<TagDto>;
    protected async convertToDto(entity: null): Promise<null>;
    protected async convertToDto(entity: TagEntity | null): Promise<TagDto | null> {
        if (!entity) {
            return null;
        }
        const { parentTagId, nextTagId, rootTagId, previousRootTagId, nextRootTagId, lastTagInChainId } = entity;
        const parentTag = parentTagId ? await this.getMinimalTag({ id: parentTagId }) : undefined;
        const nextTag = nextTagId ? await this.getMinimalTag({ id: nextTagId }) : undefined;
        const rootTag = rootTagId ? (rootTagId === parentTagId ? parentTag : await this.getMinimalTag({ id: rootTagId })) : undefined;
        const previousRootTag = previousRootTagId ? await this.getMinimalTag({ id: previousRootTagId }) : undefined;
        const nextRootTag = nextRootTagId ? await this.getMinimalTag({ id: nextRootTagId }) : undefined;
        const lastTagInChain = lastTagInChainId ? (lastTagInChainId === nextTagId ? nextTag : await this.getMinimalTag({ id: lastTagInChainId })) : undefined;
        return {
            id: entity.id,
            // name: entity.name,
            creator: await this.usersService.getRequired({ id: entity.creatorId }),
            gameId: entity.gameId,
            parentTag,
            nextTag,
            rootTag,
            lastTagInChain,
            isRoot: entity.isRoot,
            previousRootTag,
            nextRootTag,
            postedDate: entity.postedDate,
            imageUrl: entity.imageUrl,
            stats: entity.stats,
        };
    }

    public async getMinimalTag({ id }: { id: string }): Promise<MinimalTag> {
        this.logger.info(`[getMinimalTag]`, { id });
        // must go straight to the DAL service to avoid infinite loop
        const tag = await this.dalService.getByIdRequired({ id });
        return {
            id: tag.id,
            // name: tag.name,
            postedDate: tag.postedDate,
            creator: await this.usersService.getRequired({ id: tag.creatorId }),
            imageUrl: tag.imageUrl,
        };
    }

    public async updateTagLinks({ tagIdToUpdate, tagIdToSet, fields }: { tagIdToUpdate: string; tagIdToSet: string; fields: (typeof tagFields)[number][] }): Promise<TagEntity> {
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
        const game = await this.gamesService.getRequiredAsEntity({ id: gameId });
        if (!params.postedDate) {
            params.postedDate = dayjs().toISOString();
        }

        // create a new tag object id now so we can update references with fewer calls / cleaner flow
        const tagUuid = new UUID().toString();

        let isPending = false;
        let rootTag: TagEntity | undefined;
        if (isRoot) {
            isPending = await this.checkIfTagShouldBePending({ params, gameId, dateOverride: dayjs(params.postedDate) });
            if (isPending && game.pendingRootTagId) {
                throw new CannotPostTagError('There is already a pending tag for this game');
            }
            const { result, reason } = await this.canPostNewTag({ userId: params.creatorId, gameId, dateOverride: dayjs(params.postedDate) });
            if (!result) {
                throw new CannotPostTagError(reason);
            }
            await this.validateRootTagLinks(params);
        } else {
            if (await this.userInTagChain({ userId: params.creatorId, tagId: params.rootTagId! })) {
                throw new CannotPostTagError(`User ${params.creatorId} has already posted a tag for ${params.rootTagId}`);
            }
            rootTag = await this.dalService.getByIdRequired({ id: params.rootTagId! });
        }

        const stats = this.scoreService.calculateStatsForTag({ tag: params, rootTag: isRoot ? undefined : rootTag, game });

        const createParams: TagEntity = { ...params, id: tagUuid, postedDate: params.postedDate, stats };

        if (isRoot) {
            // before we update the game, get the current latest root tag, and point it to this as the next root
            // then point this back to it
            const { latestRootTagId } = game;
            if (latestRootTagId) {
                // if this is a pending tag, we will update the tag links once it goes live
                if (!isPending) {
                    await this.updateTagLinks({ tagIdToUpdate: latestRootTagId, tagIdToSet: tagUuid, fields: ['nextRootTagId'] });
                    // await this.dalService.updateMany({ filter: { gameId, rootTagId: latestRootTagId }, updateParams: { nextRootTagId: tagUUID } });
                }
                createParams.previousRootTagId = latestRootTagId;
            }
        } else {
            const parentTag = await this.setLastTagInChain({ tagId: tagUuid, rootTag: rootTag! }); // definitely defined above
            createParams.parentTagId = parentTag.id;
        }

        const tag = await this.dalService.create(createParams);

        await this.gamesService.setTagInGame({ gameId, tagId: tagUuid, root: isRoot, isPending });

        if (!isPending) {
            await this.gamesService.addScoreForPlayer({ gameId, playerId: tag.creatorId, stats: tag.stats });
        } else {
            await QueueManager.getInstance().addPendingTagJob({ jobParams: { gameId }, triggerTime: getDateOnly(createParams.postedDate) });
        }

        return await this.convertToDto(tag);
    }

    /**
     * Checks if the given tag should be a pending tag, which means it was posted the same day as the latest root tag in the game.
     * If so, then set the posted date to be the next day, and return true. Else, return false.
     */
    private async checkIfTagShouldBePending({ params, gameId, dateOverride = dayjs() }: { params: CreateTagParams; gameId: string; dateOverride?: Dayjs }): Promise<boolean> {
        const game = await this.gamesService.getRequiredAsEntity({ id: gameId });
        if (game.latestRootTagId) {
            const latestGameTag = await this.dalService.getByIdRequired({ id: game.latestRootTagId });
            const sameDate = isSameDate(dateOverride, latestGameTag.postedDate);
            if (sameDate) {
                this.logger.info(`[checkForPendingTag] found pending tag, setting date to tomorrow`);
                params.postedDate = dateOverride.add(1, 'day').toISOString();
                return true;
            }
        }
        return false;
    }

    private async setLastTagInChain({ tagId, rootTag }: { tagId: string; rootTag: TagEntity }): Promise<TagEntity> {
        // this.logger.info(`[setLastTagInChain]`, { tag });

        if (rootTag.lastTagInChainId) {
            const lastTagInChain = await this.dalService.getByIdRequired({ id: rootTag.lastTagInChainId });
            await this.updateTagLinks({ tagIdToUpdate: lastTagInChain.id, tagIdToSet: tagId, fields: ['nextTagId'] });
            await this.updateTagLinks({ tagIdToUpdate: rootTag.id, tagIdToSet: tagId, fields: ['lastTagInChainId'] });
            return lastTagInChain;
        } else {
            // also means it has no next tag ID; we could've checked for either
            await this.updateTagLinks({ tagIdToUpdate: rootTag.id, tagIdToSet: tagId, fields: ['nextTagId', 'lastTagInChainId'] });
            return rootTag;
        }
    }

    /**
     * Sets the tag ID to be the next tag of the current last tag in the chain. Returns that tag.
     *
     * OLD VERSION before adding lastTagInChain link
     */
    // private async setLastTagInChain({ tag, tagId, rootTag }: { tag: CreateTagParams; tagId: string; rootTag: TagEntity }): Promise<TagEntity> {
    //     this.logger.info(`[setLastTagInChain]`, { tag });
    //     const rootTagId = tag.rootTagId!;
    //     // find the tag that is in this game,
    //     // and, either:
    //     // - has the same root tag as the tag we are adding, or
    //     // - is the rootTag of this chain (meaning we are adding the first subtag)
    //     // and has no next tag (is the last in the chain)
    //     const filter = {
    //         $and: [
    //             {
    //                 gameId: tag.gameId,
    //             },
    //             {
    //                 $or: [
    //                     {
    //                         rootTagId,
    //                     },
    //                     {
    //                         $and: [
    //                             {
    //                                 ...this.dalService.getIdFilter(rootTagId),
    //                                 isRoot: true,
    //                             },
    //                         ],
    //                     },
    //                 ],
    //             },
    //             {
    //                 nextTagId: { $exists: false },
    //             },
    //         ],
    //     };
    //     const parentTag = (await this.dalService.findOne({ filter }))!;
    //     await this.updateTagLinks({ tagIdToUpdate: parentTag.id, tagIdToSet: tagId, fields: ['nextTagId'] });
    //     await this.updateTagLinks({ tagIdToUpdate: parentTag.id, tagIdToSet: tagId, fields: ['nextTagId'] });
    //     return parentTag;
    // }

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
     * - Date must be same or later than the previous tag
     */
    public async canPostNewTag({ userId, gameId, dateOverride = dayjs() }: { userId?: string; gameId: string; dateOverride?: Dayjs }): Promise<{ result: boolean; reason?: string }> {
        const game = await this.gamesService.getRequiredAsEntity({ id: gameId });
        if (!game.latestRootTagId) {
            return { result: true };
        }
        if (game.pendingRootTagId) {
            return { result: false, reason: 'There is already a pending tag for this game' };
        }
        const latestRootTag = await this.getRequired({ id: game.latestRootTagId });
        const tagWinner = latestRootTag.nextTag?.creator.id;
        if (isEarlierDate(dateOverride, latestRootTag.postedDate)) {
            return { result: false, reason: 'This date is older than the current tag' };
        }
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
