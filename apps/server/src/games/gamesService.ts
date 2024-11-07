import { GamesDalService } from '../dal/services/gamesDalService';
import { UsersService } from '../users/usersService';
import { CannotRemovePlayerError, gameServiceErrors, UserNotFoundError } from '../common/errors';
import { CreateGameParams, GameRoles, PlayerGame, UpdateGameParams } from '@biketag/models';
import { GameEntity } from 'src/dal/models';
import { BaseService } from '../common/baseService';
import { copyDefinedProperties } from '@biketag/utils';

export class GamesService extends BaseService<GameEntity, GamesDalService> {
    private usersService = new UsersService();

    constructor() {
        super({ prefix: 'GamesService', dalService: new GamesDalService(), serviceErrors: gameServiceErrors });
    }

    public override async create(params: CreateGameParams): Promise<GameEntity> {
        const { name, creator, players } = params;
        const user = await this.usersService.get({ id: creator });
        if (!user) {
            throw new UserNotFoundError(`User with ID ${creator} does not exist - cannot be game creator`);
        }

        const createGameParams = {
            name,
            creator,
            players: players || []
        };

        return await this.dalService.create(createGameParams);
    }

    public override async update({ id, updateParams }: { id: string; updateParams: UpdateGameParams }): Promise<GameEntity> {
        if (updateParams.creator) {
            await this.validateUserExists({ userId: updateParams.creator });
        }

        const game = await this.dalService.getByIdRequired({ id });

        let dalParams: Partial<GameEntity> = copyDefinedProperties(updateParams, ['name', 'creator', 'players']);
        if (updateParams.creator) {
            const players = updateParams.players || game.players;
            const creatorIndex = players.findIndex((p) => p.userId === updateParams.creator);
            if (creatorIndex !== -1) {
                players.splice(creatorIndex, 1);
                dalParams.players = players;
            }
        }
        const newGame = await this.dalService.update({ id, updateParams: dalParams });
        GamesService.sortPlayersByAdmins(newGame.players);
        return newGame;
    }

    public async addPlayerInGame({ gameId, userId, role }: { gameId: string; userId: string; role: string }): Promise<GameEntity> {
        await this.validateUserExists({ userId });
        if (role !== GameRoles.ADMIN && role != GameRoles.PLAYER) {
            throw new Error(`Invalid role name: ${role}`);
        }
        const game = await this.dalService.getByIdRequired({ id: gameId });
        this.setPlayerInGame({ game, userId, role: GameRoles[role] });

        return await this.dalService.update({ id: gameId, updateParams: { players: game.players } });
    }

    public async removePlayerFromGame({ gameId, userId }: { gameId: string; userId: string }): Promise<GameEntity> {
        await this.validateUserExists({ userId });
        const game = await this.dalService.getByIdRequired({ id: gameId });
        this.removePlayerInGame({ game, userId });

        return await this.dalService.update({ id: gameId, updateParams: { players: game.players } });
    }

    public async getGamesForPlayer({ userId }: { userId: string }): Promise<GameEntity[]> {
        return await this.dalService.getGamesForPlayer({ userId });
    }

    private setPlayerInGame({ game, userId, role }: { game: GameEntity; userId: string; role: GameRoles }): void {
        const { creator, players } = game;
        if (creator === userId) {
            this.logger.info('[setPlayerInGame] user to add is already creator', { userId });
            return;
        }
        const playerGame = players.find((p) => p.userId === userId);
        if (playerGame) {
            playerGame.role = role;
        } else {
            players.push({ userId, role });
        }

        GamesService.sortPlayersByAdmins(game.players);
    }

    private removePlayerInGame({ game, userId }: { game: GameEntity; userId: string }): void {
        const { creator, players } = game;
        if (creator === userId) {
            this.logger.error('[removePlayerInGame] user to remove is creator', { userId });
            throw new CannotRemovePlayerError('Cannot remove creator from game');
        }
        game.players = players.filter((p) => p.userId !== userId);
        GamesService.sortPlayersByAdmins(game.players);
    }

    private async validateUserExists({ userId }: { userId: string }) {
        if (!(await this.usersService.get({ id: userId }))) {
            throw new UserNotFoundError(`User with ID ${userId} does not exist`);
        }
    }

    private static sortPlayersByAdmins(players: PlayerGame[]): void {
        players.sort((a, b) => {
            if (a.role === GameRoles.ADMIN) {
                return -1;
            }
            if (b.role === GameRoles.ADMIN) {
                return 1;
            }
            return 0;
        });
    }
}
