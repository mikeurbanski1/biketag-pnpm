import { GameDalService } from '../../dal/services/gameDalService';
import { UserService } from '../users/userService';
import { CannotRemovePlayerError, gameServiceErrors, UserNotFoundError } from '../../common/errors';
import { CreateGameParams, GameDto, GameRoles, PlayerGame } from '@biketag/models';
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
        const { gameScore, players } = entity;

        const playerScores = players.reduce(
            (scores, player) => {
                scores[player.userId] = gameScore.playerScores[player.userId] ?? 0;
                return scores;
            },
            {} as Record<string, number>
        );
        playerScores[entity.creatorId] = gameScore.playerScores[entity.creatorId] ?? 0;

        return {
            id: entity.id,
            name: entity.name,
            creator: await this.usersService.getRequired({ id: entity.creatorId }),
            players: await Promise.all(entity.players.map(async (p) => ({ ...p, user: await this.usersService.getRequired({ id: p.userId }) }))),
            firstRootTag: entity.firstRootTagId ? await this.tagsService.getRequired({ id: entity.firstRootTagId }) : undefined,
            latestRootTag: entity.latestRootTagId ? await this.tagsService.getRequired({ id: entity.latestRootTagId }) : undefined,
            pendingRootTag: entity.pendingRootTagId ? await this.tagsService.getPendingTag({ id: entity.pendingRootTagId }) : undefined,
            gameScore: { playerScores }
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

    public async updatePendingTag({ gameId }: { gameId: string }): Promise<GameDto> {
        const game = await this.getRequiredAsEntity({ id: gameId });
        if (!game.pendingRootTagId) {
            this.logger.info(`[updatePendingTag] there is no pending tag to update`);
            return await this.convertToDto(game);
        }

        const pendingTag = await this.tagsService.getRequired({ id: game.pendingRootTagId });
        const latestRootTag = await this.tagsService.getRequired({ id: game.latestRootTagId! });

        // the pending tag will have been created with the previous tag link, but we did not yet
        // link the latest root tag to the pending one.
        await this.tagsService.updateTagLinks({ tagIdToUpdate: latestRootTag.id, tagIdToSet: pendingTag.id, fields: ['nextRootTagId'] });

        const newGame = await this.dalService.update({ id: gameId, updateParams: { latestRootTagId: game.pendingRootTagId, pendingRootTagId: undefined } });
        return await this.convertToDto(newGame);
    }

    public async setTagInGame({ gameId, tagId, root = false, isPending }: { gameId: string; tagId: string; root?: boolean; isPending: boolean }): Promise<void> {
        this.logger.info(`[setTagInGame]`, { gameId, tagId, root, isPending });
        if (root) {
            const game = await this.dalService.getByIdRequired({ id: gameId });

            if (!game.firstRootTagId && isPending) {
                throw new Error('Cannot set pending tag as first root tag');
            }

            // if isPending is true, set it. Otherwise, we know that this tag is the latest root tag
            const updateParams: Partial<GameEntity> = isPending ? { pendingRootTagId: tagId } : { latestRootTagId: tagId };

            // but if this is the pending tag for the game (previously set), then we should unset set
            if (game.pendingRootTagId === tagId) {
                updateParams.pendingRootTagId = undefined;
            }

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
