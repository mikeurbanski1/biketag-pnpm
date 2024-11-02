import { GameRoles } from '../common/games';

export interface GameEntity {
    id: string;
    name: string;
    creator: string;
    adminIds: Set<string>;
    playerIds: Set<string>;
}

export interface RoleEntity {
    role: GameRoles;
}

export interface PlayerGameEntity extends GameEntity, RoleEntity {}
