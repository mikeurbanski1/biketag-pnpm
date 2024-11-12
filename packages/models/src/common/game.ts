import { UserDto } from '../api';

export enum GameRoles {
    ADMIN = 'ADMIN',
    PLAYER = 'PLAYER'
}

export interface PlayerGame {
    userId: string;
    role: GameRoles;
}

export interface PlayerGameDto extends Omit<PlayerGame, 'userId'> {
    user: UserDto;
}
