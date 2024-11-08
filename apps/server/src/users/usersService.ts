import { UsersDalService } from '../dal/services/usersDalService';
import { UserEntity } from 'src/dal/models';
import { userServiceErrors } from '../common/errors';
import { BaseService } from '../common/baseService';

export class UsersService extends BaseService<UserEntity, UsersDalService> {
    constructor() {
        super({ prefix: 'UsersService', dalService: new UsersDalService(), serviceErrors: userServiceErrors });
    }

    public async getUserByName({ name }: { name: string }): Promise<UserEntity | null> {
        const res = await this.dalService.findOne({ filter: { name } });
        this.logger.info(`[getUserByName] result`, { res });
        return res;
    }
}
