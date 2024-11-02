import { GamesDalService } from '../dal/services/gamesDalService';
import { UsersService } from '../users/usersService';
import { UserNotFoundError } from '../common/errors';
import { CreateGameParams, GameEntity, GameRoles, PlayerGameEntity } from '@biketag/models';

export class GamesService {
    private gamesDalService = new GamesDalService();
    private usersService = new UsersService();

    public getGames(): GameEntity[] {
        return this.gamesDalService.getGames();
    }

    public getGame({ id }: { id: string }): GameEntity | undefined {
        const game = this.gamesDalService.getGame({ id });
        return game;
    }

    public createGame(params: CreateGameParams): GameEntity {
        const { name, creator } = params;
        const user = this.usersService.getUser({ id: creator })!;
        if (!user) {
            throw new UserNotFoundError(`User with ID ${creator} does not exist - cannot be game creator`);
        }

        const validAdmins = params.adminIds?.filter((id) => this.usersService.getUser({ id })) || [];
        const validPlayers = params.playerIds?.filter((id) => this.usersService.getUser({ id })) || [];

        const createGameParams: CreateGameParams = {
            name,
            creator,
            adminIds: validAdmins,
            playerIds: validPlayers
        };

        return this.gamesDalService.createGame(createGameParams);
    }

    public addPlayerInGame({ gameId, userId, role }: { gameId: string; userId: string; role: string }): PlayerGameEntity {
        this.validateUserExists({ userId });
        if (role !== GameRoles.ADMIN && role != GameRoles.PLAYER) {
            throw new Error(`Invalid role name: ${role}`);
        }
        return this.gamesDalService.setPlayerInGame({ gameId, userId, role: GameRoles[role] });
    }

    public removePlayerFromGame({ gameId, userId }: { gameId: string; userId: string }): void {
        this.gamesDalService.removePlayerFromGame({ gameId, userId });
    }

    public getGamesForPlayer({ userId }: { userId: string }): PlayerGameEntity[] {
        return this.gamesDalService.getGamesForPlayer({ userId });
    }

    private validateUserExists({ userId }: { userId: string }) {
        if (!this.usersService.getUser({ id: userId })) {
            throw new UserNotFoundError(`User with ID ${userId} does not exist`);
        }
    }
}
