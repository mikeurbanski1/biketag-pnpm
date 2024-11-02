import { GameRoles } from '@biketag/models';
import { ObjectId, WithId } from 'mongodb';

export type GameEntity = WithId<{
    name: string;
    creator: string;
    players: PlayerGameEntity[];
}>;

export interface PlayerGameEntity {
    userId: ObjectId;
    role: GameRoles;
}
