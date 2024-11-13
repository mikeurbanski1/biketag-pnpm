import { GameRoles, UserDto } from '@biketag/models';

export interface UserBeingAdded {
    user: UserDto;
    role?: GameRoles;
}
