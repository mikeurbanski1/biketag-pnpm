import { GameRoles } from '@biketag/models';
import { GameEntity } from '../../src/dal/models';
import { UUID } from 'mongodb';

export const generateGameEntity = ({
    id = new UUID().toString(),
    creatorId = '1',
    adminIds = ['2'],
    playerIds = ['3']
}: {
    id?: string;
    creatorId?: string;
    adminIds?: string[];
    playerIds?: string[];
}): GameEntity => {
    return {
        id,
        name: `game ${id}`,
        creatorId,
        players: adminIds.map((userId) => ({ userId, role: GameRoles.ADMIN })).concat(playerIds.map((userId) => ({ userId, role: GameRoles.PLAYER }))),
        gameScore: {
            playerScores: {}
        }
    };
};
