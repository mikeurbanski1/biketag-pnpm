import { PlayerGame } from '@biketag/models';

import { BaseEntity } from '.';

export interface GameEntity extends BaseEntity {
    name: string;
    creatorId: string;
    players: PlayerGame[];
    firstRootTagId?: string;
    latestRootTagId?: string;
    pendingRootTagId?: string;
    gameScore: GameScore;
}

export interface GameScore {
    playerScores: Record<string, number>;
}
