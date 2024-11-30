import { BaseDto, PendingTag, TagDto } from '.';
import { GameRoles, PlayerGame, PlayerGameDto } from '../common/game';
import { UserDto } from './user';

export interface GameDto extends BaseDto {
    id: string;
    name: string;
    creator: UserDto;
    players: PlayerGameDto[];
    firstRootTag?: TagDto;
    latestRootTag?: TagDto;
    pendingRootTag?: PendingTag;
    gameScore: GameScoreDto;
}

export interface GameScoreDto {
    playerScores: Record<string, number>;
}

export interface CreateGameDto {
    name: string;
    players: PlayerGame[];
    firstRootTagId?: string;
    latestRootTagId?: string;
}

export interface CreateGameParams extends CreateGameDto {
    creatorId: string;
}

export interface RoleDto {
    role: GameRoles;
}

export type AddPlayerInGameParams = RoleDto;
