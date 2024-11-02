import { GameRoles } from '../common/games';

export interface GameDto {
    id: string;
    name: string;
    creator: string;
    adminIds: string[];
    playerIds: string[];
}

export type CreateGameParams = Omit<GameDto, 'id' | 'adminIds' | 'playerIds'> & {
    adminIds?: string[];
    playerIds?: string[];
};

export interface RoleDto {
    role: GameRoles;
}

export type AddPlayerInGameParams = RoleDto;

export interface PlayerGameDto extends GameDto, RoleDto {}
