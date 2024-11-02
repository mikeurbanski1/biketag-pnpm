import { AxiosError } from 'axios';
import { axiosInstance } from '.';
import { Logger } from '@biketag/utils';
import { GameDto, PlayerGameDto } from '@biketag/models';

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

    public async createGame({ name, creator, adminIds, playerIds }: { name: string; creator: string; adminIds?: string[]; playerIds?: string[] }): Promise<GameDto> {
        try {
            const resp = await axiosInstance.request({
                method: 'post',
                url: '/games',
                data: { name, creator, adminIds, playerIds }
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
            return resp.data as PlayerGameDto[];
        } catch (err) {
            logger.error(`[getGamesForPlayer] got an error response`, { err });
            throw err;
        }
    }
}
