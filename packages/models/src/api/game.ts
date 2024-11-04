import { GameRoles } from '../common/game';

export interface GameDto {
    id: string;
    name: string;
    creator: string;
    adminIds: string[];
    playerIds: string[];
}

export interface CreateGameParams extends Omit<GameDto, 'id' | 'adminIds' | 'playerIds'> {
    adminIds?: string[];
    playerIds?: string[];
}

export type UpdateGameParams = Partial<Omit<GameDto, 'id'>>;

export interface RoleDto {
    role: GameRoles;
}

export type AddPlayerInGameParams = RoleDto;
