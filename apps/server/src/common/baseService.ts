import { BaseDto } from '@biketag/models';
import { Logger } from '@biketag/utils';
import { ServiceErrors } from 'src/common/errors';
import { BaseEntity, BaseEntityWithoutId } from 'src/dal/models';
import { BaseDalService } from 'src/dal/services/baseDalService';

export abstract class BaseService<ResponseDto extends BaseDto, UpsertDTO, E extends BaseEntity, D extends BaseDalService<E>> {
    protected readonly logger: Logger;
    protected readonly dalService: D;
    private readonly serviceErrors: ServiceErrors;

    constructor({ prefix, dalService, serviceErrors }: { prefix: string; dalService: D; serviceErrors: ServiceErrors }) {
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

    protected async checkIfAttributeExists({ attribute, value, ignoreId }: { attribute: keyof E; value: E[typeof attribute]; ignoreId?: string }) {
        const filter = { [attribute]: value } as Partial<E>;
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

    public async getAsEntity({ id }: { id: string }): Promise<E | null> {
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

    public async getRequiredAsEntity({ id }: { id: string }): Promise<E> {
        this.logger.info('[getRequiredAsEntity]', { id });
        const res = await this.dalService.getByIdRequired({ id });
        this.logger.info(`[getRequiredAsEntity] result`, { res });
        return res;
    }

    public async create(params: UpsertDTO): Promise<ResponseDto> {
        this.logger.info('[create]', { params });
        const entity = await this.convertToEntity(params);
        const res = await this.dalService.create(entity);
        this.logger.info(`[create] result`, { res });
        return (await this.convertToDto(res))!;
    }

    public async update({ id, updateParams }: { id: string; updateParams: UpsertDTO }): Promise<ResponseDto> {
        this.logger.info('[update]', { id, updateParams });
        await this.dalService.getByIdRequired({ id });
        const updateEntity = await this.convertToEntity(updateParams);
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

    protected async convertToDtoList(entity: E[]): Promise<ResponseDto[]> {
        return (await Promise.all(entity.map((e) => this.convertToDto(e)))) as ResponseDto[];
    }

    protected abstract convertToEntity(dto: UpsertDTO): BaseEntityWithoutId<E>;
    protected abstract convertToDto(entity: E | null): Promise<ResponseDto | null>;
}
