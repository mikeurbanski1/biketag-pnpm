import { CreateUserParams, UserDto } from '@biketag/models';

import { BaseService } from '../../common/baseService';
import { userServiceErrors } from '../../common/errors';
import { UserEntity } from '../../dal/models';
import { UserDalService } from '../../dal/services/userDalService';

export class UserService extends BaseService<UserDto, CreateUserParams, UserEntity, UserDalService> {
    constructor() {
        super({ prefix: 'UserService', dalService: new UserDalService(), serviceErrors: userServiceErrors });
    }

    protected convertToUpsertEntity(dto: CreateUserParams): Promise<CreateUserParams> {
        return Promise.resolve(dto);
    }

    protected convertToNewEntity(dto: CreateUserParams): Promise<CreateUserParams> {
        return Promise.resolve(dto);
    }

    protected async convertToDtoList(entity: UserEntity[]): Promise<UserDto[]> {
        return (await Promise.all(entity.map((e) => this.convertToDto(e)))) as UserDto[];
    }

    protected async convertToDto(entity: UserEntity | null): Promise<UserDto | null> {
        if (!entity) {
            return null;
        }
        return {
            id: entity.id,
            name: entity.name,
        };
    }

    public async getUserByName({ name }: { name: string }): Promise<UserEntity | null> {
        const res = await this.dalService.findOne({ filter: { name } });
        this.logger.info(`[getUserByName] result`, { res });
        return res;
    }
}
