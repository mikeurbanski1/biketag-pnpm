import { UsersDalService } from '../dal/services/usersDalService';
import { UserEntity } from 'src/dal/models';
import { userServiceErrors } from '../common/errors';
import { BaseService } from '../common/baseService';

export class UsersService extends BaseService<UserEntity, UsersDalService> {
    constructor() {
        super({ prefix: 'UsersService', dalService: new UsersDalService(), serviceErrors: userServiceErrors });
    }

    public async getUserByName({ name }: { name: string }): Promise<UserEntity | null> {
        return await this.dalService.findOne({ filter: { name } });
    }
}
