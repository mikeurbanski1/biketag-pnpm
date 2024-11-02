import { CreateUserParams, UserEntity } from '@biketag/models';
import { UsersDalService } from '../dal/services/usersDalService';

export class UsersService {
    private usersDalService = new UsersDalService();

    public getUsers(): UserEntity[] {
        return this.usersDalService.getUsers();
    }

    public getUser({ id }: { id: string }): UserEntity | undefined {
        return this.usersDalService.getUser({ id });
    }

    public createUser(params: CreateUserParams): UserEntity {
        return this.usersDalService.createUser(params);
    }

    public updateUser({ id, params }: { id: string; params: CreateUserParams }): UserEntity {
        return this.usersDalService.updateUser({ id, params });
    }

    public deleteUser({ id }: { id: string }): void {
        this.usersDalService.deleteUser({ id });
    }
}
