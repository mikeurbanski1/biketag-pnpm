import { userServiceErrors } from '../../common/errors';
import { UserEntity } from '../models';
import { BaseDalService } from './baseDalService';

export class UsersDalService extends BaseDalService<UserEntity> {
    constructor() {
        super({ prefix: 'UsersDalService', collectionName: 'users', serviceErrors: userServiceErrors });
    }

    // public async createUser(params: WithoutId<UserEntity>): Promise<UserEntity> {
    //     const collection = await this.getCollection();

    //     const user = this.convertToDalEntity(params);

    //     await collection.insertOne(user);

    //     return user;
    // }

    // public async updateUser({ id, params }: { id: string; params: WithoutId<UserEntity> }): Promise<UserEntity> {
    //     logger.info(`[updateUser] `, { params, id });

    //     const objectId = new ObjectId(id);
    //     const collection = await this.getCollection();

    //     await collection.updateOne({ _id: objectId }, { params });
    //     return this.convertFromDalEntity({ _id: new ObjectId(id), ...params });
    // }
}
