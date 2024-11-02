import { CreateGameParams, GameEntity, GameRoles, PlayerGameEntity } from '@biketag/models';
import { GameExistsError, GameNotFoundError } from '../../common/errors';

let nextId = 1;
const gameIdMap = new Map<string, GameEntity>();
const gameNameMap = new Map<string, GameEntity>();
const playerGameMap = new Map<string, PlayerGameEntity[]>();

export class GamesDalService {
    public getGames(): GameEntity[] {
        return Array.from(gameIdMap.values());
    }

    public createGame({ name, creator, adminIds = [], playerIds }: CreateGameParams): GameEntity {
        this.validateCreateGameParams({ name });

        const uniqueAdminIds = new Set(adminIds.concat([creator]));
        const uniquePlayerIds = playerIds ? new Set(playerIds.filter((id) => !uniqueAdminIds.has(id))) : new Set<string>();

        const game: GameEntity = {
            id: (nextId++).toString(),
            name,
            creator,
            adminIds: uniqueAdminIds,
            playerIds: uniquePlayerIds
        };

        gameIdMap.set(game.id, game);
        gameNameMap.set(name, game);

        for (const adminId of uniqueAdminIds) {
            const currentGames = this.getGamesForPlayerOrInit({ userId: adminId });
            currentGames.push({ ...game, role: GameRoles.ADMIN });
        }

        for (const player of uniquePlayerIds) {
            const currentGames = this.getGamesForPlayerOrInit({ userId: player });
            currentGames.push({ ...game, role: GameRoles.PLAYER });
        }

        return game;
    }

    private getGamesForPlayerOrInit({ userId }: { userId: string }): PlayerGameEntity[] {
        const games = playerGameMap.get(userId);
        if (games) {
            return games;
        }
        const newGames: PlayerGameEntity[] = [];
        playerGameMap.set(userId, newGames);
        return newGames;
    }

    public setPlayerInGame({ gameId, userId, role }: { gameId: string; userId: string; role: GameRoles }): PlayerGameEntity {
        const game = this.getGameRequired({ id: gameId });
        if (role === GameRoles.ADMIN) {
            game.playerIds.delete(userId);
            game.adminIds.add(userId);
        } else {
            game.adminIds.delete(userId);
            game.playerIds.add(userId);
        }
        const playerGames = this.getGamesForPlayerOrInit({ userId });
        let playerGame = playerGames.find((g) => g.id === game.id);
        if (!playerGame) {
            playerGame = { ...game, role };
            playerGames.push(playerGame);
        }
        return playerGame;
    }

    public removePlayerFromGame({ gameId, userId }: { gameId: string; userId: string }) {
        const game = this.getGameRequired({ id: gameId });
        game.playerIds.delete(userId);
        game.adminIds.delete(userId);
        if (playerGameMap.has(userId)) {
            playerGameMap.set(
                userId,
                playerGameMap.get(userId)!.filter((g) => g.id !== game.id)
            );
        }
    }

    public getGamesForPlayer({ userId }: { userId: string }): PlayerGameEntity[] {
        return playerGameMap.get(userId) || [];
    }

    private getGameRequired({ id }: { id: string }): GameEntity {
        this.validateGameIdExists({ id });
        return gameIdMap.get(id)!;
    }

    public getGame({ id }: { id: string }): GameEntity | undefined {
        return gameIdMap.get(id);
    }

    private validateCreateGameParams({ name }: Pick<CreateGameParams, 'name'>): void {
        if (gameNameMap.has(name)) {
            throw new GameExistsError(`Game ${name} already exists`);
        }
    }

    private validateGameIdExists({ id }: { id: string }): void {
        if (!gameIdMap.has(id)) {
            throw new GameNotFoundError(`Game with ID ${id} does not exist`);
        }
    }
}
