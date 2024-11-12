import { Collection, Filter, ObjectId, OptionalUnlessRequiredId, WithId } from 'mongodb';
import { Logger } from '@biketag/utils';
import { CollectionName, MongoDbProvider } from '../providers/mongoProvider';
import { ServiceErrors } from 'src/common/errors';
import { BaseEntity, BaseEntityWithoutId } from '../models';

export abstract class BaseDalService<E extends BaseEntity> {
    protected readonly logger: Logger;
    private readonly collectionName: CollectionName;
    private readonly serviceErrors: ServiceErrors;

    constructor({ prefix, collectionName, serviceErrors }: { prefix: string; collectionName: CollectionName; serviceErrors: ServiceErrors }) {
        this.logger = new Logger({ prefix: `[BaseDalService][${prefix}]` });
        this.collectionName = collectionName;
        this.serviceErrors = serviceErrors;
    }

    public async create(params: BaseEntityWithoutId<E>): Promise<E> {
        this.logger.info(`[create]`, { params });
        const collection = await this.getCollection();
        this.logger.info(`[create] got collection`);
        const entity = this.convertToDalEntity(params);
        await collection.insertOne(entity as OptionalUnlessRequiredId<E>);
        return this.convertFromDalEntity(entity);
    }

    public async update({ id, updateParams }: { id: string; updateParams: Partial<E> }): Promise<E> {
        this.logger.info(`[update] `, { updateParams, id });

        const objectId = new ObjectId(id);

        const collection = await this.getCollection();
        const oldEntity = await this.validateId({ id });
        this.logger.info(`[update] updating entity`, { oldEntity });

        await collection.updateOne(this.getIdFilter(objectId), { $set: updateParams });
        return (await this.getByIdRequired({ id })) as E;
    }

    protected async getCollection(): Promise<Collection<E>> {
        return (await MongoDbProvider.getInstance()).getCollection<E>(this.collectionName);
    }

    protected async validateId({ id, checkExists = true }: { id: string; checkExists?: boolean }): Promise<E> {
        let entity: E | null = null;
        if (!ObjectId.isValid(id) || (checkExists && !(entity = await this.getById({ id }))) || entity === null) {
            throw new this.serviceErrors.notFoundErrorClass(`Object with ID ${id} does not exist`);
        }
        return entity;
    }

    protected convertFromDalEntity(entity: WithId<E>): E {
        const { _id, ...rest } = entity;
        return { ...rest, id: _id.toString() } as unknown as E;
    }

    protected convertToDalEntity(entity: E | BaseEntityWithoutId<E>): WithId<E> {
        const { id, ...rest } = 'id' in entity ? entity : { ...entity, id: undefined };
        const _id = id ? new ObjectId(id) : new ObjectId();
        return { ...rest, _id } as unknown as WithId<E>;
    }

    public async getAll(): Promise<E[]> {
        this.logger.info('[getAll]');
        const collection = await this.getCollection();
        return (await collection.find().toArray()).map(this.convertFromDalEntity);
    }

    public async findOne({ filter, ignoreId }: { filter: Filter<E>; ignoreId?: string }): Promise<E | null> {
        this.logger.info('[findOne]', { filter, ignoreId });
        const searchFilter = ignoreId ? { ...filter, _id: { $ne: new ObjectId(ignoreId) } } : filter;
        const collection = await this.getCollection();
        const res = await collection.findOne(searchFilter);
        return res ? this.convertFromDalEntity(res) : null;
    }

    public async findAll({ filter, ignoreId }: { filter: Filter<E>; ignoreId?: string }): Promise<E[]> {
        this.logger.info(`[findAll] `, { filter, ignoreId });
        const searchFilter = ignoreId ? { ...filter, _id: { $ne: new ObjectId(ignoreId) } } : filter;
        const collection = await this.getCollection();
        return (await collection.find(searchFilter).toArray()).map(this.convertFromDalEntity);
    }

    public async delete({ id }: { id: string }) {
        this.logger.info('[delete]', { id });
        const collection = await this.getCollection();
        await this.validateId({ id });

        await collection.deleteOne(this.getIdFilter(id));
    }

    public async getById({ id }: { id: string }): Promise<E | null> {
        this.logger.info(`[getById] `, { id });
        if (!ObjectId.isValid(id)) {
            this.logger.info(`[getById] ID is not a valid object ID: ${id}`);
            return null;
        }
        const collection = await this.getCollection();
        const entity = await collection.findOne(this.getIdFilter(id));
        return entity ? this.convertFromDalEntity(entity) : null;
    }

    public async getByIdRequired({ id }: { id: string }): Promise<E> {
        this.logger.info(`[getByIdRequired] `, { id });
        return await this.validateId({ id });
    }

    // there seems to be a TS bug where generic filters do not match type checks
    // but if we were to put this in a subclass and replace the generic type, it would work
    private getIdFilter(id: string | ObjectId): Filter<E> {
        const _id = typeof id === 'string' ? new ObjectId(id) : id;
        return { _id } as Filter<E>;
    }

    public getFilter(filter: Partial<E>): Filter<E> {
        return filter as Filter<E>;
    }
}
