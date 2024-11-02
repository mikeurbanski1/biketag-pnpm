import { Logger } from '@biketag/utils';
import { UserExistsError, UserNotFoundError } from '../../common/errors';
import { UserEntity } from '../models';
import { ObjectId, WithoutId } from 'mongodb';
import { BaseDalService } from '..';

const logger = new Logger({ prefix: 'UsersDalService' });

export class UsersDalService extends BaseDalService<UserEntity, UserNotFoundError> {
    constructor() {
        super({ collectionName: 'users', notFoundErrorClass: UserNotFoundError });
    }

    public async createUser(params: WithoutId<UserEntity>): Promise<UserEntity> {
        const collection = await this.getCollection();
        await this.validateCreateUserParams({ params });

        const user: UserEntity = {
            _id: new ObjectId(),
            ...params
        };

        await collection.insertOne(user);

        return user;
    }

    public async updateUser({ id, params }: { id: string; params: WithoutId<UserEntity> }): Promise<UserEntity> {
        logger.info(`[updateUser] `, { params, id });

        await this.validateId({ id });

        const objectId = new ObjectId(id);
        const collection = await this.getCollection();
        await this.validateCreateUserParams({ params, ignoreId: objectId });

        await collection.updateOne({ _id: objectId }, { params });
        return { _id: new ObjectId(id), ...params };
    }

    public async deleteUser({ id }: { id: string }) {
        logger.info(`[deleteUser] `, { id });
        const collection = await this.getCollection();
        await this.validateId({ id });

        await collection.deleteOne({ _id: new ObjectId(id) });
    }

    private async validateCreateUserParams({ params, ignoreId }: { params: WithoutId<UserEntity>; ignoreId?: ObjectId }) {
        const filter = ignoreId ? { ...params, _id: { $ne: ignoreId } } : params;
        if (await this.findOne(filter)) {
            throw new UserExistsError(`User with name ${params.name} already exists`);
        }
    }
}
