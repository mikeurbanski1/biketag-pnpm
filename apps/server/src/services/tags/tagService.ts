import { CreateTagParams, TagDto, MinimalTag, tagFields } from '@biketag/models';
import { BaseService } from '../../common/baseService';
import { TagEntity } from '../../dal/models/tag';
import { TagDalService } from '../../dal/services/tagDalService';
import { BaseEntityWithoutId } from '../../dal/models';
import { GameService } from '../games/gamesService';
import { UserService } from '../users/userService';
import { validateExists } from '../../common/entityValidators';
import { tagServiceErrors } from '../../common/errors';

export class TagService extends BaseService<TagDto, CreateTagParams, TagEntity, TagDalService> {
    private readonly usersService: UserService;
    private readonly gamesService: GameService;

    constructor({ usersService, gamesService }: { usersService?: UserService; gamesService?: GameService } = {}) {
        super({ prefix: 'TagService', dalService: new TagDalService(), serviceErrors: tagServiceErrors });
        this.usersService = usersService ?? new UserService();
        this.gamesService = gamesService ?? new GameService({ tagsService: this });
    }

    protected convertToEntity(dto: CreateTagParams): BaseEntityWithoutId<TagEntity> {
        return {
            ...dto,
            postedDate: new Date().toISOString()
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
            creatorName: (await this.usersService.getRequired({ id: tag.creatorId })).name,
            contents: tag.contents
        };
    }

    public override async create(params: CreateTagParams): Promise<TagDto> {
        const requiredTagFields: (typeof tagFields)[number][] = params.isRoot ? [] : ['parentTagId', 'rootTagId'];
        await this.validateTagLinks({ tag: params, requiredTagFields });

        const tag = await this.dalService.create({ ...params, postedDate: new Date().toISOString() });

        await this.gamesService.setTagInGame({ gameId: tag.gameId, tagId: tag.id, root: params.isRoot });

        return await this.convertToDto(tag);
    }

    private async validateTagLinks({ tag, requiredTagFields = [] }: { tag: CreateTagParams; requiredTagFields?: (typeof tagFields)[number][] }) {
        const promises = [validateExists(tag.creatorId, this.usersService), validateExists(tag.gameId, this.gamesService)];

        for (const field of tagFields) {
            if (requiredTagFields.includes(field) || tag[field]) {
                promises.push(validateExists(tag[field] ?? '', this));
            }
        }

        await Promise.all(promises);
    }
}
