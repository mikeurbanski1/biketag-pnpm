import { UserEntity } from '@biketag/models';

import { userServiceErrors } from '../../common/errors';
import { BaseDalService } from './baseDalService';

export class UserDalService extends BaseDalService<UserEntity> {
    constructor() {
        super({ prefix: 'UsersDalService', collectionName: 'users', serviceErrors: userServiceErrors });
    }
}
