export interface UserDto {
    name: string;
    id: string;
}

export type CreateUserParams = Omit<UserDto, 'id'>;
