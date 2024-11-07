import { GameRoles, PlayerGame } from '../common/game';

export interface GameDto {
    id: string;
    name: string;
    creator: string;
    players: PlayerGame[];
}

export interface CreateGameParams extends Omit<GameDto, 'id' | 'players'> {
    players?: PlayerGame[];
}

export type UpdateGameParams = Partial<Omit<GameDto, 'id'>>;

export interface RoleDto {
    role: GameRoles;
}

export type AddPlayerInGameParams = RoleDto;
