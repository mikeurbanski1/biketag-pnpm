import { BaseDto } from '.';
import { GameRoles, PlayerGame, PlayerGameDto } from '../common/game';
import { UserDto } from './user';

export interface GameDto extends BaseDto {
    id: string;
    name: string;
    creator: UserDto;
    players: PlayerGameDto[];
}

export interface CreateGameParams extends Omit<GameDto, 'id' | 'creator' | 'players'> {
    creator: string;
    players: PlayerGame[];
}

export interface RoleDto {
    role: GameRoles;
}

export type AddPlayerInGameParams = RoleDto;
