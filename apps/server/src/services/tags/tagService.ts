import { CreateTagParams, TagDto, MinimalTag, tagFields } from '@biketag/models';
import { BaseService } from '../../common/baseService';
import { TagEntity } from '../../dal/models/tag';
import { TagDalService } from '../../dal/services/tagDalService';
import { BaseEntityWithoutId } from '../../dal/models';
import { GameService } from '../games/gamesService';
import { UserService } from '../users/userService';
import { validateExists } from '../../common/entityValidators';
import { tagServiceErrors } from '../../common/errors';
import { UUID } from 'mongodb';

export class TagService extends BaseService<TagDto, CreateTagParams, TagEntity, TagDalService> {
    private readonly usersService: UserService;
    private readonly gamesService: GameService;

    constructor({ usersService, gamesService }: { usersService?: UserService; gamesService?: GameService } = {}) {
        super({ prefix: 'TagService', dalService: new TagDalService(), serviceErrors: tagServiceErrors });
        this.usersService = usersService ?? new UserService();
        this.gamesService = gamesService ?? new GameService({ tagsService: this });
    }

    protected convertToEntity(dto: CreateTagParams): BaseEntityWithoutId<TagEntity> {
        this.logger.info(`[convertToEntity]`, { dto });
        return {
            ...dto,
            postedDate: dto.postedDate ?? new Date().toISOString()
        };
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
            contents: entity.contents
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
            creatorName: (await this.usersService.getRequired({ id: tag.creatorId })).name,
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
            await this.validateRootTagLinks(params);
        }

        // create a new tag object id now so we can update references with fewer calls / cleaner flow
        const tagUUID = new UUID().toString();

        const createParams: TagEntity = { ...params, id: tagUUID, postedDate: params.postedDate ?? new Date().toISOString() };

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
