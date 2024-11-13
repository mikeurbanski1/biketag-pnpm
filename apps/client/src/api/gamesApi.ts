import { AxiosError } from 'axios';
import { axiosInstance } from '.';
import { Logger } from '@biketag/utils';
import { CreateGameParams, GameDto, PlayerGame } from '@biketag/models';

export class GameNotFoundError extends Error {}
export class CreateGameFailedError extends Error {}

const logger = new Logger({ prefix: '[UsersApi]' });

export class GamesApi {
    public async getGame({ id }: { id: string }): Promise<GameDto> {
        try {
            const resp = await axiosInstance.request({
                method: 'get',
                url: `/games/${id}`
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            logger.info('[getGame] got game', { data: resp.data });
            return resp.data as GameDto;
        } catch (err) {
            logger.error(`[getGame] got an error response`, { err });
            if (err instanceof AxiosError) {
                if (err.status === 404) {
                    throw new GameNotFoundError(err.message);
                }
            }
            throw err;
        }
    }

    public async getGames(): Promise<GameDto[]> {
        try {
            const resp = await axiosInstance.request({
                method: 'get',
                url: `/games`
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            logger.info('[getGame] got games', { data: resp.data });
            return resp.data as GameDto[];
        } catch (err) {
            logger.error(`[getGame] got an error response`, { err });
            throw err;
        }
    }

    public async createGame({ name, creatorId, players }: { name: string; creatorId: string; players: PlayerGame[] }): Promise<GameDto> {
        try {
            const resp = await axiosInstance.request({
                method: 'post',
                url: '/games',
                data: { name, creatorId, players }
            });
            if (resp.status !== 201) {
                throw new CreateGameFailedError(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            logger.info('[createGame] got 201 response', { data: resp.data });
            return resp.data as GameDto;
        } catch (err) {
            logger.error(`[createGame] got an error response`, { err });
            if (err instanceof AxiosError) {
                throw new CreateGameFailedError(err.message);
            }
            throw err;
        }
    }

    public async getGamesForPlayer({ userId }: { userId: string }): Promise<GameDto[]> {
        try {
            const resp = await axiosInstance.request({
                method: 'get',
                url: `/games/player/${userId}`
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            logger.info('[getGamesForPlayer] got games', { data: resp.data });
            return resp.data as GameDto[];
        } catch (err) {
            logger.error(`[getGamesForPlayer] got an error response`, { err });
            throw err;
        }
    }

    public async updateGame(id: string, game: CreateGameParams): Promise<GameDto> {
        const { name, creatorId: creator, players } = game;
        try {
            const resp = await axiosInstance.request({
                method: 'patch',
                url: `/games/${id}`,
                data: { name, creator, players }
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            logger.info('[updateGame] updated game', { data: resp.data });
            return resp.data as GameDto;
        } catch (err) {
            logger.error(`[updateGame] got an error response`, { err });
            throw err;
        }
    }

    public async deleteGame({ gameId }: { gameId: string }) {
        try {
            const resp = await axiosInstance.request({
                method: 'delete',
                url: `/games/${gameId}`
            });
            if (resp.status !== 204) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            logger.info('[deleteGame] game deleted', { gameId });
        } catch (err) {
            logger.error(`[deleteGame] got an error response`, { err });
            throw err;
        }
    }
}
