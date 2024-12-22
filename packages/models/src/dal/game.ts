import { BaseEntity } from '.';
import { GameScore, PlayerGame } from '../common';

export interface GameEntity extends BaseEntity {
    name: string;
    creatorId: string;
    players: PlayerGame[];
    firstRootTagId?: string;
    latestRootTagId?: string;
    pendingRootTagId?: string;
    gameScore: GameScore;
}
