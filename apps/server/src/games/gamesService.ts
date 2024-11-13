import { GamesDalService } from '../dal/services/gamesDalService';
import { UsersService } from '../users/usersService';
import { CannotRemovePlayerError, gameServiceErrors, UserNotFoundError } from '../common/errors';
import { CreateGameParams, GameDto, GameRoles, PlayerGame } from '@biketag/models';
import { BaseEntityWithoutId, GameEntity } from 'src/dal/models';
import { BaseService } from '../common/baseService';
import { copyDefinedProperties } from '@biketag/utils';

export class GamesService extends BaseService<GameDto, CreateGameParams, GameEntity, GamesDalService> {
    private usersService = new UsersService();

    constructor() {
        super({ prefix: 'GamesService', dalService: new GamesDalService(), serviceErrors: gameServiceErrors });
    }

    protected async convertToDtoList(entity: GameEntity[]): Promise<GameDto[]> {
        return (await Promise.all(entity.map((e) => this.convertToDto(e)))) as GameDto[];
    }

    protected async convertToDto(entity: GameEntity): Promise<GameDto>;
    protected async convertToDto(entity: null): Promise<null>;
    protected async convertToDto(entity: GameEntity | null): Promise<GameDto | null> {
        if (!entity) {
            return null;
        }
        return {
            id: entity.id,
            name: entity.name,
            creator: await this.usersService.getRequired({ id: entity.creator }),
            players: await Promise.all(entity.players.map(async (p) => ({ ...p, user: await this.usersService.getRequired({ id: p.userId }) })))
        };
    }

    protected convertToEntity(dto: CreateGameParams): BaseEntityWithoutId<GameEntity> {
        return {
            name: dto.name,
            creator: dto.creator,
            players: dto.players
        };
    }

    public override async create(params: CreateGameParams): Promise<GameDto> {
        const { creator, players } = params;
        const user = await this.usersService.get({ id: creator });
        if (!user) {
            throw new UserNotFoundError(`User with ID ${creator} does not exist - cannot be game creator`);
        }

        GamesService.sortPlayersByAdmins(players);

        const game = await this.dalService.create(params);
        return await this.convertToDto(game);
    }

    public override async update({ id, updateParams }: { id: string; updateParams: CreateGameParams }): Promise<GameDto> {
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
        return await this.convertToDto(newGame);
    }

    public async addPlayerInGame({ gameId, userId, role }: { gameId: string; userId: string; role: string }): Promise<GameDto> {
        await this.validateUserExists({ userId });
        if (role !== GameRoles.ADMIN && role != GameRoles.PLAYER) {
            throw new Error(`Invalid role name: ${role}`);
        }
        const game = await this.dalService.getByIdRequired({ id: gameId });
        this.setPlayerInGame({ game, userId, role: GameRoles[role] });

        const newGame = await this.dalService.update({ id: gameId, updateParams: { players: game.players } });

        return await this.convertToDto(newGame);
    }

    public async removePlayerFromGame({ gameId, userId }: { gameId: string; userId: string }): Promise<GameDto> {
        await this.validateUserExists({ userId });
        const game = await this.dalService.getByIdRequired({ id: gameId });
        this.removePlayerInGame({ game, userId });

        const newGame = await this.dalService.update({ id: gameId, updateParams: { players: game.players } });
        return await this.convertToDto(newGame);
    }

    public async getGamesForPlayer({ userId }: { userId: string }): Promise<GameDto[]> {
        const games = await this.dalService.getGamesForPlayer({ userId });
        return await this.convertToDtoList(games);
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
