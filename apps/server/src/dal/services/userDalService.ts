import { userServiceErrors } from '../../common/errors';
import { UserEntity } from '../models';
import { BaseDalService } from './baseDalService';

export class UserDalService extends BaseDalService<UserEntity> {
    constructor() {
        super({ prefix: 'UsersDalService', collectionName: 'users', serviceErrors: userServiceErrors });
    }
}
