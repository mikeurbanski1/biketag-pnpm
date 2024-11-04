import { GamesDalService } from '../dal/services/gamesDalService';
import { UsersService } from '../users/usersService';
import { CannotRemovePlayerError, gameServiceErrors, UserNotFoundError } from '../common/errors';
import { CreateGameParams, GameRoles, UpdateGameParams } from '@biketag/models';
import { GameEntity, PlayerGameEntity } from 'src/dal/models';
import { WithoutId } from 'mongodb';
import { BaseService } from '../common/baseService';

export class GamesService extends BaseService<GameEntity, GamesDalService> {
    private usersService = new UsersService();

    constructor() {
        super({ prefix: 'GamesService', dalService: new GamesDalService(), serviceErrors: gameServiceErrors });
    }

    public override async create(params: CreateGameParams): Promise<GameEntity> {
        const { name, creator } = params;
        const user = await this.usersService.get({ id: creator });
        if (!user) {
            throw new UserNotFoundError(`User with ID ${creator} does not exist - cannot be game creator`);
        }

        const validAdmins = params.adminIds?.filter((id) => this.usersService.get({ id })) || [];
        const validPlayers = params.playerIds?.filter((id) => this.usersService.get({ id })) || [];

        const createGameParams = {
            name,
            creator,
            players: this.combinePlayerLists({ playerIds: validPlayers, adminIds: validAdmins })
        };

        return await this.dalService.create(createGameParams);
    }

    public override async update({ id, updateParams }: { id: string; updateParams: UpdateGameParams }): Promise<GameEntity> {
        if (updateParams.creator) {
            await this.validateUserExists({ userId: updateParams.creator });
        }
        let newPlayers: PlayerGameEntity[] | undefined = undefined;
        if (updateParams.creator || updateParams.adminIds || updateParams.playerIds) {
            newPlayers = this.combinePlayerLists({ creator: updateParams.creator, adminIds: updateParams.adminIds || [], playerIds: updateParams.playerIds || [] });
        }
        const dalParams: Partial<WithoutId<GameEntity>> = { name: updateParams.name, creator: updateParams.creator, players: newPlayers };
        return await this.dalService.update({ id, updateParams: dalParams });
    }

    public async addPlayerInGame({ gameId, userId, role }: { gameId: string; userId: string; role: string }): Promise<GameEntity> {
        await this.validateUserExists({ userId });
        if (role !== GameRoles.ADMIN && role != GameRoles.PLAYER) {
            throw new Error(`Invalid role name: ${role}`);
        }
        const game = await this.dalService.getByIdRequired({ id: gameId });
        this.setPlayerInGame({ game, userId, role: GameRoles[role] });

        return game;
    }

    public async removePlayerFromGame({ gameId, userId }: { gameId: string; userId: string }): Promise<GameEntity> {
        await this.validateUserExists({ userId });
        const game = await this.dalService.getByIdRequired({ id: gameId });
        this.removePlayerInGame({ game, userId });

        return game;
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
    }

    private removePlayerInGame({ game, userId }: { game: GameEntity; userId: string }): void {
        const { creator, players } = game;
        if (creator === userId) {
            this.logger.error('[removePlayerInGame] user to remove is creator', { userId });
            throw new CannotRemovePlayerError('Cannot remove creator from game');
        }
        game.players = players.filter((p) => p.userId !== userId);
    }

    private combinePlayerLists({ creator, playerIds, adminIds }: { creator?: string; playerIds: string[]; adminIds: string[] }): PlayerGameEntity[] {
        const players: PlayerGameEntity[] = adminIds.filter((adminId) => adminId !== creator).map((adminId) => ({ userId: adminId, role: GameRoles.ADMIN }));

        const nonAdmins = playerIds.filter((playerId) => !adminIds.includes(playerId) && playerId !== creator);

        return players.concat(nonAdmins.map((playerId) => ({ userId: playerId, role: GameRoles.PLAYER })));
    }

    private async validateUserExists({ userId }: { userId: string }) {
        if (!(await this.usersService.get({ id: userId }))) {
            throw new UserNotFoundError(`User with ID ${userId} does not exist`);
        }
    }
}
