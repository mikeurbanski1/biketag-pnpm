import { GameRoles } from '@biketag/models';
import { BaseEntity } from '.';

export interface GameEntity extends BaseEntity {
    name: string;
    creator: string;
    players: PlayerGameEntity[];
}

export interface PlayerGameEntity {
    userId: string;
    role: GameRoles;
}
