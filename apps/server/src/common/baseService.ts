import { Logger } from '@biketag/utils';
import { ServiceErrors } from 'src/common/errors';
import { BaseEntity, BaseEntityWithoutId } from 'src/dal/models';
import { BaseDalService } from 'src/dal/services/baseDalService';

export abstract class BaseService<E extends BaseEntity, D extends BaseDalService<E>> {
    protected readonly logger: Logger;
    protected readonly dalService: D;
    private readonly serviceErrors: ServiceErrors;

    constructor({ prefix, dalService, serviceErrors }: { prefix: string; dalService: D; serviceErrors: ServiceErrors }) {
        this.logger = new Logger({ prefix: `[BaseService][${prefix}]` });
        this.dalService = dalService;
        this.serviceErrors = serviceErrors;
    }

    protected async failIfNotExists({ id }: { id: string }) {
        if (!(await this.dalService.getById({ id }))) {
            throw new this.serviceErrors.notFoundErrorClass(`Object with ID ${id} does not exist`);
        }
    }

    protected async failIfExists({ id }: { id: string }) {
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

    public async getAll(): Promise<E[]> {
        this.logger.info('[getAll]');
        return await this.dalService.getAll();
    }

    public async get({ id }: { id: string }): Promise<E | null> {
        this.logger.info('[get]', { id });
        return await this.dalService.getById({ id });
    }

    public async create(params: BaseEntityWithoutId<E>): Promise<E> {
        this.logger.info('[create]', { params });
        return await this.dalService.create(params);
    }

    public async update({ id, updateParams }: { id: string; updateParams: BaseEntityWithoutId<E> }): Promise<E> {
        this.logger.info('[update]', { id, updateParams });
        await this.dalService.getByIdRequired({ id });
        return this.dalService.update({ id, updateParams });
    }

    public async deleteUser({ id }: { id: string }) {
        this.logger.info('[deleteUser]', { id });
        await this.dalService.delete({ id });
    }
}
