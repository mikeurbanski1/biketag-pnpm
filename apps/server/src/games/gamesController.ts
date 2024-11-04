// src/users/usersController.ts
import { Body, Controller, Delete, Get, Patch, Path, Post, Put, Res, Route, SuccessResponse, TsoaResponse } from 'tsoa';
import { Logger } from '@biketag/utils';
import { GamesService } from './gamesService';
import { CreateGameParams, GameDto, AddPlayerInGameParams, GameRoles } from '@biketag/models';
import { GameNotFoundError, UserNotFoundError } from '../common/errors';
import { GameEntity } from 'src/dal/models';

const logger = new Logger({ prefix: '[GamesController]' });

@Route('games')
export class GamesController extends Controller {
    private gamesService = new GamesService();

    @Get('/')
    @SuccessResponse('200', 'ok')
    public async getGames(): Promise<GameDto[]> {
        return (await this.gamesService.getAll()).map((game) => this.convertGameToDto(game));
    }

    @Get('/{id}')
    @SuccessResponse('200', 'ok')
    public async getGame(@Path() id: string, @Res() notFoundResponse: TsoaResponse<404, { reason: string }>): Promise<GameDto> {
        logger.info(`[getGame] id: ${id}`);
        const game = await this.gamesService.get({ id });
        if (!game) {
            return notFoundResponse(404, { reason: 'Game not found' });
        }
        logger.info(`[getGame] result ${game}`);
        return this.convertGameToDto(game);
    }

    @Get('/player/{userId}')
    @SuccessResponse('200', 'ok')
    public async getGamesForPlayer(@Path() userId: string): Promise<GameDto[]> {
        logger.info(`[getGamesForPlayer] player id: ${userId}`);
        const playerGames = await this.gamesService.getGamesForPlayer({ userId });
        logger.info(`[getGamesForPlayer] result ${playerGames}`);
        return playerGames.map((playerGame) => this.convertGameToDto(playerGame));
    }

    @Post()
    public async createGame(@Body() requestBody: CreateGameParams, @Res() notFoundResponse: TsoaResponse<404, { reason: string }>): Promise<GameDto> {
        logger.info(`[createGame]`, { requestBody });
        try {
            const game = this.convertGameToDto(await this.gamesService.create(requestBody));
            return game;
        } catch (err) {
            if (err instanceof UserNotFoundError) {
                return notFoundResponse(404, { reason: err.message });
            }
            throw err;
        }
    }

    @Patch('/{id}')
    @SuccessResponse('200', 'ok')
    public async updateGame(@Path() id: string, @Body() requestBody: Partial<CreateGameParams>, @Res() notFoundResponse: TsoaResponse<404, { reason: string }>): Promise<GameDto> {
        logger.info(`[updateGame]`, { id, requestBody });
        try {
            const game = await this.gamesService.update({ id, updateParams: requestBody });
            logger.info(`[updateGame] updated game`, { game });
            return this.convertGameToDto(game);
        } catch (err) {
            if (err instanceof GameNotFoundError) {
                return notFoundResponse(404, { reason: err.message });
            }
            throw err;
        }
    }

    @Put('/{gameId}/player/{userId}')
    @SuccessResponse('200', 'ok')
    public async addPlayerInGame(
        @Path() gameId: string,
        @Path() userId: string,
        @Body() requestBody: AddPlayerInGameParams,
        @Res() notFoundResponse: TsoaResponse<404, { reason: string }>
    ): Promise<GameDto> {
        logger.info(`[addPlayerInGame]`, { gameId, userId, requestBody });
        try {
            const game = await this.gamesService.addPlayerInGame({ gameId, userId, role: requestBody.role });
            logger.info('[addPlayerInGame] result', { game });
            return this.convertGameToDto(game);
        } catch (err) {
            if (err instanceof UserNotFoundError || err instanceof GameNotFoundError) {
                return notFoundResponse(404, { reason: err.message });
            }
            throw err;
        }
    }

    @Delete('/{gameId}/player/{userId}')
    @SuccessResponse('200', 'ok')
    public async removePlayerFromGame(@Path() gameId: string, @Path() userId: string, @Res() notFoundResponse: TsoaResponse<404, { reason: string }>): Promise<GameDto> {
        logger.info(`[removePlayerFromGame]`, { gameId, userId });
        try {
            const game = await this.gamesService.removePlayerFromGame({ gameId, userId });
            return this.convertGameToDto(game);
        } catch (err) {
            if (err instanceof GameNotFoundError) {
                return notFoundResponse(404, { reason: err.message });
            }
            throw err;
        }
    }

    private convertGameToDto(game: GameEntity): GameDto {
        const { id, name, creator } = game;
        return {
            id,
            name,
            creator,
            adminIds: game.players.filter((p) => p.role === GameRoles.ADMIN).map((p) => p.userId.toString()),
            playerIds: game.players.filter((p) => p.role === GameRoles.PLAYER).map((p) => p.userId.toString())
        };
    }

    // private convertDtoToGame(game: CreateGameParams): GameEntity {
    //     return {
    //         id: game.id,
    //         name: game.name,
    //         creator: game.creator,
    //         adminIds: new Set(game.adminIds),
    //         playerIds: new Set(game.playerIds)
    //     };
    // }
}
