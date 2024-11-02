// src/users/usersController.ts
import { Body, Controller, Delete, Get, Path, Post, Put, Res, Route, SuccessResponse, TsoaResponse } from 'tsoa';
import { Logger } from '@biketag/utils';
import { GamesService } from './gamesService';
import { CreateGameParams, GameDto, PlayerGameDto, GameEntity, AddPlayerInGameParams, PlayerGameEntity } from '@biketag/models';
import { GameNotFoundError, UserNotFoundError } from '../common/errors';

const logger = new Logger({ prefix: '[GamesController]' });

@Route('games')
export class GamesController extends Controller {
    private gamesService = new GamesService();

    @Get('/')
    @SuccessResponse('200', 'ok')
    public async getGames(): Promise<GameDto[]> {
        return this.gamesService.getGames().map((game) => this.convertGameToDto(game));
    }

    @Get('/{id}')
    @SuccessResponse('200', 'ok')
    public async getGame(@Path() id: string, @Res() notFoundResponse: TsoaResponse<404, { reason: string }>): Promise<GameDto> {
        logger.info(`[getGame] id: ${id}`);
        const game = this.gamesService.getGame({ id });
        if (!game) {
            return notFoundResponse(404, { reason: 'Game not found' });
        }
        logger.info(`[getGame] result ${game}`);
        return this.convertGameToDto(game);
    }

    @Get('/player/{userId}')
    @SuccessResponse('200', 'ok')
    public async getGamesForPlayer(@Path() userId: string): Promise<PlayerGameDto[]> {
        logger.info(`[getGamesForPlayer] player id: ${userId}`);
        const playerGames = this.gamesService.getGamesForPlayer({ userId });
        logger.info(`[getGamesForPlayer] result ${playerGames}`);
        return playerGames.map((playerGame) => this.convertPlayerGameToDto(playerGame));
    }

    @Post()
    public async createGame(@Body() requestBody: CreateGameParams, @Res() notFoundResponse: TsoaResponse<404, { reason: string }>): Promise<GameDto> {
        logger.info(`[createGame]`, { requestBody });
        try {
            const game = this.convertGameToDto(this.gamesService.createGame(requestBody));
            return game;
        } catch (err) {
            if (err instanceof UserNotFoundError) {
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
    ): Promise<PlayerGameDto> {
        logger.info(`[addPlayerInGame]`, { gameId, userId, requestBody });
        try {
            const playerGame = this.gamesService.addPlayerInGame({ gameId, userId, role: requestBody.role });
            logger.info('[addPlayerInGame] result', { playerGame });
            return this.convertPlayerGameToDto(playerGame);
        } catch (err) {
            if (err instanceof UserNotFoundError || err instanceof GameNotFoundError) {
                return notFoundResponse(404, { reason: err.message });
            }
            throw err;
        }
    }

    @Delete('/{gameId}/player/{userId}')
    @SuccessResponse('200', 'ok')
    public async removePlayerFromGame(@Path() gameId: string, @Path() userId: string, @Res() notFoundResponse: TsoaResponse<404, { reason: string }>) {
        logger.info(`[removePlayerFromGame]`, { gameId, userId });
        try {
            this.gamesService.removePlayerFromGame({ gameId, userId });
        } catch (err) {
            if (err instanceof GameNotFoundError) {
                return notFoundResponse(404, { reason: err.message });
            }
            throw err;
        }
    }

    private convertGameToDto(game: GameEntity): GameDto {
        return {
            id: game.id,
            name: game.name,
            creator: game.creator,
            adminIds: Array.from(game.adminIds),
            playerIds: Array.from(game.playerIds)
        };
    }

    private convertPlayerGameToDto(playerGame: PlayerGameEntity): PlayerGameDto {
        return {
            ...this.convertGameToDto(playerGame),
            role: playerGame.role
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
