import { PlayerGame } from '@biketag/models';
import { GameScore } from '@biketag/models/src/api/score';

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
