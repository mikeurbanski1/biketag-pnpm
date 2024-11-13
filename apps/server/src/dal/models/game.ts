import { PlayerGame } from '@biketag/models';
import { BaseEntity } from '.';

export interface GameEntity extends BaseEntity {
    name: string;
    creatorId: string;
    players: PlayerGame[];
    rootTagId?: string;
    latestTagId?: string;
}
