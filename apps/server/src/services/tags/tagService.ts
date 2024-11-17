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

    private async updateTagLinks({ tagIdToUpdate, tagIdToSet, fields }: { tagIdToUpdate: string; tagIdToSet: string; fields: (typeof tagFields)[number][] }) {
        this.logger.info('[updateTagLink]', { tagIdToUpdate, tagIdToSet, fields });
        const updateFields = fields.reduce((params, field) => {
            params[field] = tagIdToSet;
            return params;
        }, {} as Partial<TagEntity>);
        await this.dalService.update({ id: tagIdToUpdate, updateParams: updateFields });
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
            const { parentTagId } = params;
            // if this is not a root tag, we need to update the parent tag to point to this, and copy the previous and next roots
            await this.updateTagLinks({ tagIdToUpdate: parentTagId!, tagIdToSet: tagUUID, fields: ['nextTagId'] });
            const parentTag = await this.dalService.getByIdRequired({ id: parentTagId! });
            createParams.nextRootTagId = parentTag.nextRootTagId;
            createParams.previousRootTagId = parentTag.previousRootTagId;
        }

        const tag = await this.dalService.create(createParams);

        await this.gamesService.setTagInGame({ gameId, tagId: tagUUID, root: isRoot });

        return await this.convertToDto(tag);
    }

    /**
     * Validates the links for a new tag: creator, game, and parent and root tags
     */
    private async validateRootTagLinks(tag: CreateTagParams): Promise<void> {
        const promises = [validateExists(tag.creatorId, this.usersService), validateExists(tag.gameId, this.gamesService)];

        if (tag.parentTagId) {
            promises.push(validateExists(tag.parentTagId, this));
            if (tag.rootTagId && tag.rootTagId !== tag.parentTagId) {
                promises.push(validateExists(tag.rootTagId, this));
            }
        }

        await Promise.all(promises);
    }
}
