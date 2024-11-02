import { GameRoles } from '../common/game';

export interface GameDto {
    id: string;
    name: string;
    creator: string;
    adminIds: string[];
    playerIds: string[];
}

export type CreateGameParams = Omit<GameDto, 'id'>;

export interface RoleDto {
    role: GameRoles;
}

export type AddPlayerInGameParams = RoleDto;
