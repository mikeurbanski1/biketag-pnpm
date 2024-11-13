import { BaseDto } from '.';

export interface UserDto extends BaseDto {
    name: string;
}

export type CreateUserParams = Omit<UserDto, 'id'>;
