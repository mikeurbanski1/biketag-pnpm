import { UsersDalService } from '../dal/services/usersDalService';
import { userServiceErrors } from '../common/errors';
import { BaseService } from '../common/baseService';
import { CreateUserParams, UserDto } from '@biketag/models';
import { UserEntity } from '../dal/models';

export class UsersService extends BaseService<UserDto, CreateUserParams, UserEntity, UsersDalService> {
    constructor() {
        super({ prefix: 'UsersService', dalService: new UsersDalService(), serviceErrors: userServiceErrors });
    }

    protected convertToEntity(dto: CreateUserParams): CreateUserParams {
        return dto;
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
            name: entity.name
        };
    }

    public async getUserByName({ name }: { name: string }): Promise<UserEntity | null> {
        const res = await this.dalService.findOne({ filter: { name } });
        this.logger.info(`[getUserByName] result`, { res });
        return res;
    }
}
