import { Collection, Filter, ObjectId, WithId } from 'mongodb';
import { Logger } from '@biketag/utils';
import { CollectionName, MongoDbProvider } from './providers/mongoProvider';

const logger = new Logger({ prefix: 'BaseDalService' });

export interface IError<E extends Error> {
    new (message: string): E;
}

export abstract class BaseDalService<T extends { _id: ObjectId }, NotFoundError extends Error> {
    private readonly collectionName: CollectionName;
    private readonly notFoundErrorClass: IError<NotFoundError>;
    constructor({ collectionName, notFoundErrorClass }: { collectionName: CollectionName; notFoundErrorClass: IError<NotFoundError> }) {
        this.collectionName = collectionName;
        this.notFoundErrorClass = notFoundErrorClass;
    }

    protected async getCollection(): Promise<Collection<T>> {
        return (await MongoDbProvider.getInstance()).getCollection<T>(this.collectionName);
    }

    protected async validateId({ id, checkExists = true }: { id: string; checkExists?: boolean }) {
        if (!ObjectId.isValid(id) || (checkExists && !(await this.getById({ id })))) {
            throw new this.notFoundErrorClass(`Object with ID ${id} does not exist`);
        }
    }

    public async getAll(): Promise<WithId<T>[]> {
        logger.info('[getAll]');
        const collection = await this.getCollection();
        return await collection.find().toArray();
    }

    public async findOne(filter: Filter<T>): Promise<WithId<T> | null> {
        logger.info('[findOne]', { filter });
        const collection = await this.getCollection();
        return await collection.findOne(filter);
    }

    public async findAll(filter: Filter<T>): Promise<WithId<T>[]> {
        logger.info(`[findAll] `, { filter });
        const collection = await this.getCollection();
        return await collection.find(filter).toArray();
    }

    public async delete({ id }: { id: string }) {
        logger.info('[delete]', { id });
        const collection = await this.getCollection();
        await this.validateId({ id });

        await collection.deleteOne(this.getIdFilter(id));
    }

    public async getById({ id }: { id: string }): Promise<WithId<T> | null> {
        logger.info(`[getById] `, { id });
        if (!ObjectId.isValid(id)) {
            logger.info(`[getById] ID is not a valid object ID: ${id}`);
            return null;
        }
        const collection = await this.getCollection();
        return await collection.findOne(this.getIdFilter(id));
    }

    public async getByIdRequired({ id }: { id: string }): Promise<WithId<T>> {
        logger.info(`[getByIdRequired] `, { id });
        await this.validateId({ id });
        return (await this.getById({ id }))!;
    }

    private getIdFilter(id: string): Filter<T> {
        return { _id: new ObjectId(id) } as Filter<T>;
    }
}
