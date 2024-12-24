import { Filter, UUID } from 'mongodb';

import { BaseDto, BaseEntity, BaseEntityWithoutId } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ServiceErrors } from '../common/errors';
import { BaseDalService } from '../dal/services/baseDalService';

export abstract class BaseService<ResponseDto extends BaseDto, UpsertDTO, EntityType extends BaseEntity, DalType extends BaseDalService<EntityType>> {
    protected readonly logger: Logger;
    protected readonly dalService: DalType;
    private readonly serviceErrors: ServiceErrors;

    constructor({ prefix, dalService, serviceErrors }: { prefix: string; dalService: DalType; serviceErrors: ServiceErrors }) {
        this.logger = new Logger({ prefix: `[BaseService][${prefix}]` });
        this.dalService = dalService;
        this.serviceErrors = serviceErrors;
    }

    protected async failIfNotExists({ id }: { id: string }) {
        this.logger.info(`[failIfNotExists]`, { id });
        if (!(await this.dalService.getById({ id }))) {
            throw new this.serviceErrors.notFoundErrorClass(`Object with ID ${id} does not exist`);
        }
    }

    protected async failIfExists({ id }: { id: string }) {
        this.logger.info(`[failIfNotExists]`, { id });
        if (await this.dalService.getById({ id })) {
            throw new this.serviceErrors.existsErrorClass(`Object with ID ${id} already exists`);
        }
    }

    protected async checkIfAttributeExists({ attribute, value, ignoreId }: { attribute: keyof EntityType; value: EntityType[typeof attribute]; ignoreId?: string }) {
        const filter = { [attribute]: value } as Partial<EntityType>;
        if (await this.dalService.findOne({ filter: this.dalService.getFilter(filter), ignoreId })) {
            throw new this.serviceErrors.existsErrorClass(`Object with with ${attribute.toString()} ${value} already exists`);
        }
    }

    public async getAll(): Promise<ResponseDto[]> {
        this.logger.info('[getAll]');
        const res = await this.dalService.getAll();
        this.logger.info(`[getAll] result`, { res });
        return (await Promise.all(res.map((entity) => this.convertToDto(entity)))) as ResponseDto[];
    }

    public async get({ id }: { id: string }): Promise<ResponseDto | null> {
        this.logger.info('[get]', { id });
        const res = await this.dalService.getById({ id });
        this.logger.info(`[get] result`, { res });
        return await this.convertToDto(res);
    }

    public async getMultiple({ ids }: { ids: string[] }): Promise<ResponseDto[]> {
        this.logger.info('[getMultiple]', { ids });
        const res = await this.dalService.findAll({ filter: { _id: { $in: ids.map((id) => new UUID(id)) } } as Filter<EntityType> });
        this.logger.info(`[getMultiple] result`, { res });
        return await this.convertToDtoList(res);
    }

    public async getAsEntity({ id }: { id: string }): Promise<EntityType | null> {
        this.logger.info('[getAsEntity]', { id });
        const res = await this.dalService.getById({ id });
        this.logger.info(`[getAsEntity] result`, { res });
        return res;
    }

    public async getRequired({ id }: { id: string }): Promise<ResponseDto> {
        this.logger.info('[get]', { id });
        const res = await this.dalService.getByIdRequired({ id });
        this.logger.info(`[get] result`, { res });
        return (await this.convertToDto(res))!;
    }

    public async getRequiredAsEntity({ id }: { id: string }): Promise<EntityType> {
        this.logger.info('[getRequiredAsEntity]', { id });
        const res = await this.dalService.getByIdRequired({ id });
        this.logger.info(`[getRequiredAsEntity] result`, { res });
        return res;
    }

    public async create(params: UpsertDTO): Promise<ResponseDto> {
        this.logger.info('[create]', { params });
        const entity = await this.convertToNewEntity(params);
        const res = await this.dalService.create(entity);
        this.logger.info(`[create] result`, { res });
        return (await this.convertToDto(res))!;
    }

    public async update({ id, updateParams }: { id: string; updateParams: UpsertDTO }): Promise<ResponseDto> {
        this.logger.info('[update]', { id, updateParams });
        await this.dalService.getByIdRequired({ id });
        const updateEntity = await this.convertToUpsertEntity(updateParams);
        const res = await this.dalService.update({ id, updateParams: updateEntity });
        this.logger.info(`[update] result`, { res });
        return (await this.convertToDto(res))!;
    }

    public async delete({ id }: { id: string }) {
        this.logger.info('[delete]', { id });
        const res = await this.dalService.delete({ id });
        this.logger.info(`[delete] result`, { res });
        return res;
    }

    protected async convertToDtoList(entity: EntityType[]): Promise<ResponseDto[]> {
        return (await Promise.all(entity.map((e) => this.convertToDto(e)))) as ResponseDto[];
    }

    protected abstract convertToUpsertEntity(dto: UpsertDTO): Promise<Partial<BaseEntityWithoutId<EntityType>>>;
    protected abstract convertToNewEntity(dto: UpsertDTO): Promise<BaseEntityWithoutId<EntityType>>;
    protected abstract convertToDto(entity: EntityType | null): Promise<ResponseDto | null>;
}
