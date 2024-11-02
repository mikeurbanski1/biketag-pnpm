import { Logger } from '@biketag/utils';
import { UserExistsError, UserNotFoundError } from '../../common/errors';
import { CreateUserParams, UserEntity } from '@biketag/models';

let nextId = 1;
const userIdMap = new Map<string, UserEntity>();
const userNameMap = new Map<string, UserEntity>();

const logger = new Logger({ prefix: 'UsersDalService' });

export class UsersDalService {
    public getUsers(): UserEntity[] {
        return Array.from(userIdMap.values());
    }

    public createUser({ name }: CreateUserParams): UserEntity {
        this.validateCreateUserParams({ name });

        const user: UserEntity = {
            id: (nextId++).toString(),
            name
        };

        userIdMap.set(user.id, user);
        userNameMap.set(name, user);

        return user;
    }

    public getUser({ id }: { id: string }): UserEntity | undefined {
        logger.info(`[getUser] `, { id });
        return userIdMap.get(id);
    }

    public updateUser({ id, params }: { id: string; params: CreateUserParams }): UserEntity {
        logger.info(`[updateUser] `, { params, id });
        const { name } = params;
        this.validateCreateUserParams({ name });
        this.validateUserIdExists({ id });

        const user = userIdMap.get(id)!;
        const { name: oldName } = user;

        userNameMap.delete(oldName);
        user.name = name;
        userNameMap.set(name, user);
        return user;
    }

    public deleteUser({ id }: { id: string }): void {
        logger.info(`[deleteUser] `, { id });
        this.validateUserIdExists({ id });

        const user = userIdMap.get(id)!;

        userNameMap.delete(user.name);
        userIdMap.delete(id);
    }

    private validateCreateUserParams({ name }: CreateUserParams): void {
        if (userNameMap.has(name)) {
            throw new UserExistsError(`User ${name} already exists`);
        }
    }

    private validateUserIdExists({ id }: { id: string }): void {
        if (!userIdMap.has(id)) {
            throw new UserNotFoundError(`User with ID ${id} does not exist`);
        }
    }
}
