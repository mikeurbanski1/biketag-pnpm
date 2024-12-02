import { TagStats } from '@biketag/models/src/api/score';

import { gameServiceErrors } from '../../common/errors';
import { GameEntity } from '../models';
import { BaseDalService } from './baseDalService';

export class GameDalService extends BaseDalService<GameEntity> {
    constructor() {
        super({ prefix: 'GameDalService', collectionName: 'games', serviceErrors: gameServiceErrors });
    }

    // public async updateGame({ id, params }: { id: string; params: Partial<WithoutId<GameEntity>> }): Promise<GameEntity> {
    //     this.logger.info(`[updateGame] `, { params, id });

    //     const objectId = new UUID(id);

    //     const collection = await this.getCollection();
    //     const oldGame = await this.getByIdRequired({ id });
    //     this.logger.info(`[updateGame] updating game`, { oldGame });
    //     if (params.name) {
    //         await this.checkIfAttributeExists({ attribute: 'name', value: params.name, ignoreId: objectId });
    //     }

    //     await collection.updateOne({ _id: objectId }, { $set: params });
    //     return await this.getByIdRequired({ id });
    // }

    public async getGamesForPlayer({ userId }: { userId: string }): Promise<GameEntity[]> {
        this.logger.info('[getGamesForPlayer]', { userId });
        const result = await this.findAll({
            filter: { $or: [{ 'players.userId': userId }, { creatorId: userId }] },
        });
        this.logger.info(`[getGamesForPlayer] result`, { result });
        return result;
    }

    public async addScoreForPlayer({ gameId, playerId, stats }: { gameId: string; playerId: string; stats: TagStats }): Promise<void> {
        this.logger.info(`[addScoreForPlayer]`, { gameId, playerId, stats });

        const collection = await this.getCollection();

        const playerScoreAttr = `gameScore.playerScores.${playerId}`;

        const update = {
            $inc: { [`${playerScoreAttr}.points`]: stats.points },
        };

        if (stats.newTag) {
            update.$inc[`${playerScoreAttr}.newTagsPosted`] = 1;
        }
        if (stats.postedOnTime) {
            update.$inc[`${playerScoreAttr}.tagsPostedOnTime`] = 1;
        }
        if (stats.wonTag) {
            update.$inc[`${playerScoreAttr}.tagsWon`] = 1;
        }

        await collection.updateOne(this.getIdFilter(gameId), update);
    }

    // public setPlayerInGame({ gameId, userId, role }: { gameId: string; userId: string; role: GameRoles }): PlayerGameEntity {
    //     const game = this.getByIdRequired({ id: gameId });
    //     if (role === GameRoles.ADMIN) {
    //         game.playerIds.delete(userId);
    //         game.adminIds.add(userId);
    //     } else {
    //         game.adminIds.delete(userId);
    //         game.playerIds.add(userId);
    //     }
    //     const playerGames = this.getGamesForPlayerOrInit({ userId });
    //     let playerGame = playerGames.find((g) => g.id === game.id);
    //     if (!playerGame) {
    //         playerGame = { ...game, role };
    //         playerGames.push(playerGame);
    //     }
    //     return playerGame;
    // }

    // public removePlayerFromGame({ gameId, userId }: { gameId: string; userId: string }) {
    //     const game = this.getGameRequired({ id: gameId });
    //     game.playerIds.delete(userId);
    //     game.adminIds.delete(userId);
    //     if (playerGameMap.has(userId)) {
    //         playerGameMap.set(
    //             userId,
    //             playerGameMap.get(userId)!.filter((g) => g.id !== game.id)
    //         );
    //     }
    // }
}
