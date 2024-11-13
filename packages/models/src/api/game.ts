import { BaseDto, TagDto } from '.';
import { GameRoles, PlayerGame, PlayerGameDto } from '../common/game';
import { UserDto } from './user';

export interface GameDto extends BaseDto {
    id: string;
    name: string;
    creator: UserDto;
    players: PlayerGameDto[];
    rootTag?: TagDto;
    latestTag?: TagDto;
}

export interface CreateGameParams extends Pick<GameDto, 'name'> {
    creatorId: string;
    players: PlayerGame[];
    rootTagId?: string;
    latestTagId?: string;
}

export interface RoleDto {
    role: GameRoles;
}

export type AddPlayerInGameParams = RoleDto;
