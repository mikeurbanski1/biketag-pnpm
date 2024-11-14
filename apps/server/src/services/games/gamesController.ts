// src/users/usersController.ts
import { Body, Controller, Delete, Get, Patch, Path, Post, Put, Res, Route, SuccessResponse, TsoaResponse } from 'tsoa';
import { Logger } from '@biketag/utils';
import { GameService } from './gamesService';
import { CreateGameParams, GameDto, AddPlayerInGameParams } from '@biketag/models';
import { GameNotFoundError, UserNotFoundError } from '../../common/errors';

const logger = new Logger({ prefix: '[GameController]' });

@Route('games')
export class GameController extends Controller {
    private gamesService = new GameService();

    @Get('/')
    @SuccessResponse('200', 'ok')
    public async getGames(): Promise<GameDto[]> {
        return await this.gamesService.getAll();
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
        return game;
    }

    @Get('/player/{userId}')
    @SuccessResponse('200', 'ok')
    public async getGamesForPlayer(@Path() userId: string): Promise<GameDto[]> {
        logger.info(`[getGamesForPlayer] player id: ${userId}`);
        const playerGames = await this.gamesService.getGamesForPlayer({ userId });
        logger.info(`[getGamesForPlayer] result ${playerGames}`);
        return playerGames;
    }

    @Post()
    @SuccessResponse('201', 'Created')
    public async createGame(@Body() requestBody: CreateGameParams, @Res() notFoundResponse: TsoaResponse<404, { reason: string }>): Promise<GameDto> {
        logger.info(`[createGame]`, { requestBody });
        try {
            const game = await this.gamesService.create(requestBody);
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
    public async updateGame(@Path() id: string, @Body() requestBody: CreateGameParams, @Res() notFoundResponse: TsoaResponse<404, { reason: string }>): Promise<GameDto> {
        logger.info(`[updateGame]`, { id, requestBody });
        try {
            const game = await this.gamesService.update({ id, updateParams: requestBody });
            logger.info(`[updateGame] updated game`, { game });
            return game;
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
            return game;
        } catch (err) {
            if (err instanceof UserNotFoundError || err instanceof GameNotFoundError) {
                return notFoundResponse(404, { reason: err.message });
            }
            throw err;
        }
    }

    @Delete('/{gameId}/player/{userId}')
    @SuccessResponse('204', 'deleted')
    public async removePlayerFromGame(@Path() gameId: string, @Path() userId: string, @Res() notFoundResponse: TsoaResponse<404, { reason: string }>): Promise<GameDto> {
        logger.info(`[removePlayerFromGame]`, { gameId, userId });
        try {
            const game = await this.gamesService.removePlayerFromGame({ gameId, userId });
            return game;
        } catch (err) {
            if (err instanceof GameNotFoundError) {
                return notFoundResponse(404, { reason: err.message });
            }
            throw err;
        }
    }

    @Delete('/{id}')
    @SuccessResponse('204', 'deleted')
    public async deleteGame(@Path() id: string, @Res() notFoundResponse: TsoaResponse<404, { reason: string }>): Promise<void> {
        logger.info(`[deleteGame] id: ${id}`);
        try {
            await this.gamesService.delete({ id });
        } catch (err) {
            if (err instanceof GameNotFoundError) {
                return notFoundResponse(404, { reason: err.message });
            }
            throw err;
        }
    }
}
