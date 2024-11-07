import { PlayerGame } from '@biketag/models';
import { BaseEntity } from '.';

export interface GameEntity extends BaseEntity {
    name: string;
    creator: string;
    players: PlayerGame[];
}
