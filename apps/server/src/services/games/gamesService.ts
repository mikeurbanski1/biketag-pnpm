import { GameDalService } from '../../dal/services/gameDalService';
import { UserService } from '../users/userService';
import { CannotRemovePlayerError, gameServiceErrors, UserNotFoundError } from '../../common/errors';
import { CreateGameParams, GameDto, GameRoles, GameScoreDto, PlayerGame } from '@biketag/models';
import { BaseEntityWithoutId, GameEntity } from '../../dal/models';
import { BaseService } from '../../common/baseService';
import { copyDefinedProperties } from '@biketag/utils';
import { TagService } from '../tags/tagService';
import { validateExists } from '../../common/entityValidators';

export class GameService extends BaseService<GameDto, CreateGameParams, GameEntity, GameDalService> {
    private readonly usersService: UserService;
    private readonly tagsService: TagService;

    constructor({ usersService, tagsService }: { usersService?: UserService; tagsService?: TagService } = {}) {
        super({ prefix: 'GameService', dalService: new GameDalService(), serviceErrors: gameServiceErrors });
        this.usersService = usersService ?? new UserService();
        this.tagsService = tagsService ?? new TagService({ gamesService: this });
    }

    protected async convertToDto(entity: GameEntity): Promise<GameDto>;
    protected async convertToDto(entity: null): Promise<null>;
    protected async convertToDto(entity: GameEntity | null): Promise<GameDto | null> {
        if (!entity) {
            return null;
        }
        const { gameScore } = entity;

        let gameScoreDto: GameScoreDto = { playerScores: [] };

        for (const [playerId, score] of Object.entries(gameScore.playerScores)) {
            const { name: userName } = await this.usersService.getRequired({ id: playerId });
            gameScoreDto.playerScores.push({ player: { id: playerId, name: userName }, score });
        }

        return {
            id: entity.id,
            name: entity.name,
            creator: await this.usersService.getRequired({ id: entity.creatorId }),
            players: await Promise.all(entity.players.map(async (p) => ({ ...p, user: await this.usersService.getRequired({ id: p.userId }) }))),
            firstRootTag: entity.firstRootTagId ? await this.tagsService.getRequired({ id: entity.firstRootTagId }) : undefined,
            latestRootTag: entity.latestRootTagId ? await this.tagsService.getRequired({ id: entity.latestRootTagId }) : undefined,
            gameScore: gameScoreDto
        };
    }

    protected convertToUpsertEntity(dto: CreateGameParams): Promise<Partial<BaseEntityWithoutId<GameEntity>>> {
        return Promise.resolve({
            name: dto.name,
            creatorId: dto.creatorId,
            players: dto.players
        });
    }

    protected convertToNewEntity(dto: CreateGameParams): Promise<BaseEntityWithoutId<GameEntity>> {
        return Promise.resolve({
            name: dto.name,
            creatorId: dto.creatorId,
            players: dto.players,
            gameScore: { playerScores: {} }
        });
    }

    public override async create(params: CreateGameParams): Promise<GameDto> {
        const { creatorId: creator, players } = params;
        const user = await this.usersService.get({ id: creator });
        if (!user) {
            throw new UserNotFoundError(`User with ID ${creator} does not exist - cannot be game creator`);
        }

        GameService.sortPlayersByAdmins(players);

        const game = await this.dalService.create({ ...params, gameScore: { playerScores: {} } });
        return await this.convertToDto(game);
    }

    public override async update({ id, updateParams }: { id: string; updateParams: Partial<CreateGameParams> }): Promise<GameDto> {
        if (updateParams.creatorId) {
            await validateExists(updateParams.creatorId, this.usersService);
        }

        const game = await this.dalService.getByIdRequired({ id });

        let dalParams: Partial<GameEntity> = copyDefinedProperties(updateParams, ['name', 'creatorId', 'players', 'latestRootTagId', 'firstRootTagId']);
        if (updateParams.creatorId) {
            const players = updateParams.players || game.players;
            const creatorIndex = players.findIndex((p) => p.userId === updateParams.creatorId);
            if (creatorIndex !== -1) {
                players.splice(creatorIndex, 1);
                dalParams.players = players;
            }
        }
        const newGame = await this.dalService.update({ id, updateParams: dalParams });
        GameService.sortPlayersByAdmins(newGame.players);
        return await this.convertToDto(newGame);
    }

    public async setTagInGame({ gameId, tagId, root = false }: { gameId: string; tagId: string; root?: boolean }): Promise<void> {
        this.logger.info(`[setTagInGame]`, { gameId, tagId, root });
        if (root) {
            const game = await this.dalService.getByIdRequired({ id: gameId });

            const updateParams: Partial<GameEntity> = { latestRootTagId: tagId };
            if (!game.firstRootTagId) {
                updateParams.firstRootTagId = tagId;
            }
            await this.dalService.update({ id: gameId, updateParams });
        }
    }

    public async addScoreForPlayer({ gameId, playerId, score }: { gameId: string; playerId: string; score: number }): Promise<GameDto> {
        await this.dalService.addScoreForPlayer({ gameId, playerId, score });
        return await this.getRequired({ id: gameId });
    }

    public async addPlayerInGame({ gameId, userId, role }: { gameId: string; userId: string; role: string }): Promise<GameDto> {
        await validateExists(userId, this.usersService);
        if (role !== GameRoles.ADMIN && role != GameRoles.PLAYER) {
            throw new Error(`Invalid role name: ${role}`);
        }
        const game = await this.dalService.getByIdRequired({ id: gameId });
        this.setPlayerInGame({ game, userId, role: GameRoles[role] });

        const newGame = await this.dalService.update({ id: gameId, updateParams: { players: game.players } });

        return await this.convertToDto(newGame);
    }

    public async removePlayerFromGame({ gameId, userId }: { gameId: string; userId: string }): Promise<GameDto> {
        await validateExists(userId, this.usersService);
        const game = await this.dalService.getByIdRequired({ id: gameId });
        this.removePlayerInGame({ game, userId });

        const newGame = await this.dalService.update({ id: gameId, updateParams: { players: game.players } });
        return await this.convertToDto(newGame);
    }

    public async getGamesForPlayer({ userId }: { userId: string }): Promise<GameDto[]> {
        this.logger.info(`[getGamesForPlayer]`, { userId });
        const games = await this.dalService.getGamesForPlayer({ userId });
        return await this.convertToDtoList(games);
    }

    private setPlayerInGame({ game, userId, role }: { game: GameEntity; userId: string; role: GameRoles }): void {
        const { creatorId, players } = game;
        if (creatorId === userId) {
            this.logger.info('[setPlayerInGame] user to add is already creator', { userId });
            return;
        }
        const playerGame = players.find((p) => p.userId === userId);
        if (playerGame) {
            playerGame.role = role;
        } else {
            players.push({ userId, role });
        }

        GameService.sortPlayersByAdmins(game.players);
    }

    private removePlayerInGame({ game, userId }: { game: GameEntity; userId: string }): void {
        const { creatorId, players } = game;
        if (creatorId === userId) {
            this.logger.error('[removePlayerInGame] user to remove is creator', { userId });
            throw new CannotRemovePlayerError('Cannot remove creator from game');
        }
        game.players = players.filter((p) => p.userId !== userId);
        GameService.sortPlayersByAdmins(game.players);
    }

    // private async validateUserExists({ userId }: { userId: string }) {
    //     if (!(await this.usersService.get({ id: userId }))) {
    //         throw new UserNotFoundError(`User with ID ${userId} does not exist`);
    //     }
    // }

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
