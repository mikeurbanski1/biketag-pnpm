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

        // it is much faster to get and update the whole object than to update the nested values
        const playerScoreAttr = `gameScore.playerScores.${playerId}`;
        const game = await this.getByIdRequired({ id: gameId });

        const currentStats = game.gameScore.playerScores[playerId];
        const newStats = {
            points: currentStats.points + stats.points,
            newTagsPosted: currentStats.newTagsPosted + (stats.newTag ? 1 : 0),
            tagsPostedOnTime: currentStats.tagsPostedOnTime + (stats.postedOnTime ? 1 : 0),
            tagsWon: currentStats.tagsWon + (stats.wonTag ? 1 : 0),
        };

        const update = {
            [playerScoreAttr]: newStats,
        };

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
