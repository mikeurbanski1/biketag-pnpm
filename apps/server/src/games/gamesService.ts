import { GamesDalService } from '../dal/services/gamesDalService';
import { UsersService } from '../users/usersService';
import { UserNotFoundError } from '../common/errors';
import { CreateGameParams, GameRoles } from '@biketag/models';
import { GameEntity, PlayerGameEntity } from 'src/dal/models';
import { ObjectId } from 'mongodb';

export class GamesService {
    private gamesDalService = new GamesDalService();
    private usersService = new UsersService();

    public async getGames(): Promise<GameEntity[]> {
        return await this.gamesDalService.getAll();
    }

    public async getGame({ id }: { id: string }): Promise<GameEntity | null> {
        return await this.gamesDalService.getById({ id });
    }

    public async createGame(params: CreateGameParams): Promise<GameEntity> {
        const { name, creator } = params;
        const user = this.usersService.getUser({ id: creator })!;
        if (!user) {
            throw new UserNotFoundError(`User with ID ${creator} does not exist - cannot be game creator`);
        }

        const validAdmins = params.adminIds?.filter((id) => this.usersService.getUser({ id })) || [];
        const validPlayers = params.playerIds?.filter((id) => this.usersService.getUser({ id })) || [];

        const createGameParams = {
            name,
            creator,
            players: this.combinePlayerLists({ playerIds: validPlayers, adminIds: validAdmins })
        };

        return await this.gamesDalService.createGame(createGameParams);
    }

    public async addPlayerInGame({ gameId, userId, role }: { gameId: string; userId: string; role: string }): Promise<GameEntity> {
        this.validateUserExists({ userId });
        if (role !== GameRoles.ADMIN && role != GameRoles.PLAYER) {
            throw new Error(`Invalid role name: ${role}`);
        }
        const game = await this.gamesDalService.getByIdRequired({ id: gameId });
        this.setPlayerInGame({ players: game.players, userId, role: GameRoles[role] });

        return game;
    }

    public async removePlayerFromGame({ gameId, userId, role }: { gameId: string; userId: string; role: string }): Promise<GameEntity> {
        this.validateUserExists({ userId });
        if (role !== GameRoles.ADMIN && role != GameRoles.PLAYER) {
            throw new Error(`Invalid role name: ${role}`);
        }
        const game = await this.gamesDalService.getByIdRequired({ id: gameId });
        this.removePlayerInGame({ players: game.players, userId });

        return game;
    }

    public async getGamesForPlayer({ userId }: { userId: string }): Promise<GameEntity[]> {
        return await this.gamesDalService.getGamesForPlayer({ userId });
    }

    private setPlayerInGame({ players, userId, role }: { players: PlayerGameEntity[]; userId: string; role: GameRoles }): PlayerGameEntity[] {
        const playerGame = players.find((p) => p.userId === new ObjectId(userId));
        if (playerGame) {
            playerGame.role = role;
        } else {
            players.push({ userId: new ObjectId(userId), role });
        }
        return players;
    }

    private removePlayerInGame({ players, userId }: { players: PlayerGameEntity[]; userId: string }): PlayerGameEntity[] {
        return players.filter((p) => p.userId !== new ObjectId(userId));
    }

    private combinePlayerLists({ playerIds, adminIds }: { playerIds: string[]; adminIds: string[] }): PlayerGameEntity[] {
        const players: PlayerGameEntity[] = adminIds.map((adminId) => ({ userId: new ObjectId(adminId), role: GameRoles.ADMIN }));

        const nonAdmins = playerIds.filter((playerId) => !adminIds.includes(playerId));

        return players.concat(nonAdmins.map((playerId) => ({ userId: new ObjectId(playerId), role: GameRoles.PLAYER })));
    }

    private validateUserExists({ userId }: { userId: string }) {
        if (!this.usersService.getUser({ id: userId })) {
            throw new UserNotFoundError(`User with ID ${userId} does not exist`);
        }
    }
}
