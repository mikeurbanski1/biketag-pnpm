import { Logger } from '@biketag/utils';
import { GameExistsError, GameNotFoundError } from '../../common/errors';
import { GameEntity } from '../models';
import { ObjectId, WithoutId } from 'mongodb';
import { BaseDalService } from '..';

const logger = new Logger({ prefix: 'GamesDalService' });

export class GamesDalService extends BaseDalService<GameEntity, GameNotFoundError> {
    constructor() {
        super({ collectionName: 'games', notFoundErrorClass: GameNotFoundError });
    }

    public async createGame({ name, creator, players }: WithoutId<GameEntity>): Promise<GameEntity> {
        this.validateCreateGameParams({ params: { name, creator, players } });
        const collection = await this.getCollection();

        const game: GameEntity = {
            _id: new ObjectId(),
            name,
            creator,
            players
        };

        await collection.insertOne(game);

        return game;
    }

    public async updateGame({ id, params }: { id: string; params: WithoutId<GameEntity> }): Promise<GameEntity> {
        logger.info(`[updateGame] `, { params, id });

        await this.validateId({ id });

        const objectId = new ObjectId(id);
        const collection = await this.getCollection();
        await this.validateCreateGameParams({ params, ignoreId: objectId });

        await collection.updateOne({ _id: objectId }, { params });
        return { _id: new ObjectId(id), ...params };
    }

    public async getGamesForPlayer({ userId }: { userId: string }): Promise<GameEntity[]> {
        logger.info('[getGamesForPlayer]', { userId });
        return await this.findAll({ 'players.userId': new ObjectId(userId) });
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

    private async validateCreateGameParams({ params, ignoreId }: { params: WithoutId<GameEntity>; ignoreId?: ObjectId }) {
        const baseFilter = { name: params.name };
        const filter = ignoreId ? { ...baseFilter, _id: { $ne: ignoreId } } : baseFilter;
        if (await this.findOne(filter)) {
            throw new GameExistsError(`Game with name ${params.name} already exists`);
        }
    }
}
