import { CreateUserParams } from '@biketag/models';
import { UsersDalService } from '../dal/services/usersDalService';
import { UserEntity } from 'src/dal/models';
import { Logger } from '@biketag/utils';

const logger = new Logger({ prefix: '[UsersService]' });

export class UsersService {
    private readonly usersDalService = new UsersDalService();

    public async getUsers(): Promise<UserEntity[]> {
        logger.info(`[getUsers]`);
        return await this.usersDalService.getAll();
    }

    public async getUser({ id }: { id: string }): Promise<UserEntity | null> {
        return await this.usersDalService.getById({ id });
    }

    public async getUserByName({ name }: { name: string }): Promise<UserEntity | null> {
        return await this.usersDalService.findOne({ name });
    }

    public async createUser(params: CreateUserParams): Promise<UserEntity> {
        return await this.usersDalService.createUser(params);
    }

    public async updateUser({ id, params }: { id: string; params: CreateUserParams }): Promise<UserEntity> {
        return this.usersDalService.updateUser({ id, params });
    }

    public async deleteUser({ id }: { id: string }) {
        await this.usersDalService.deleteUser({ id });
    }
}
