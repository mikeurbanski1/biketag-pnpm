import axios, { AxiosError } from 'axios';

import { CreateGameDto, GameDto, GameSummary, PlayerGame } from '@biketag/models';

import { ApiManager } from '.';
import { AbstractApi } from './abstractApi';

export class GameNotFoundError extends Error {}
export class CreateGameFailedError extends Error {}

export class GameApi extends AbstractApi {
    constructor({ clientId }: { clientId: string }) {
        super({ clientId, logPrefix: '[GameApi]' });
    }

    public async getGame({ id, convertPendingTagForOwner }: { id: string; convertPendingTagForOwner: boolean }): Promise<GameDto> {
        try {
            const resp = await this.axiosInstance.request<GameDto>({
                method: 'get',
                url: `/games/${id}`,
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            const game = resp.data;
            this.logger.info('[getGame] got game', { game });
            if (convertPendingTagForOwner && game.pendingRootTag && game.pendingRootTag.creator.id === this.getUserIdRequired()) {
                this.logger.info(`[getGame] convert for owner`);
                return {
                    ...game,
                    // the API will tell us what we actually get, but it should be a real tag
                    pendingRootTag: await ApiManager.tagApi.getTag({ id: game.pendingRootTag.id }),
                };
            }

            return game;
        } catch (err) {
            this.logger.error(`[getGame] got an error response`, { err });
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
            const resp = await this.axiosInstance.request<GameDto[]>({
                method: 'get',
                url: `/games`,
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[getGame] got games', { data: resp.data });
            return resp.data;
        } catch (err) {
            this.logger.error(`[getGame] got an error response`, { err });
            throw err;
        }
    }

    public async getGameSummaryForPlayer({ userId }: { userId: string }): Promise<GameSummary[]> {
        try {
            const resp = await this.axiosInstance.request<GameDto[]>({
                method: 'get',
                url: `/games/player/${userId}/summary`,
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[getGameSummaryForPlayer] got games', { data: resp.data });
            return resp.data;
        } catch (err) {
            this.logger.error(`[getGameSummaryForPlayer] got an error response`, { err });
            throw err;
        }
    }

    public async createGame({ name, players }: { name: string; players: PlayerGame[] }): Promise<GameDto> {
        try {
            const resp = await this.axiosInstance.request<GameDto>({
                method: 'post',
                url: '/games',
                data: { name, players },
            });
            if (resp.status !== 201) {
                throw new CreateGameFailedError(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[createGame] got 201 response', { data: resp.data });
            return resp.data;
        } catch (err) {
            this.logger.error(`[createGame] got an error response`, { err });
            if (err instanceof AxiosError) {
                throw new CreateGameFailedError(err.message);
            }
            throw err;
        }
    }

    public async getGamesForPlayer({ userId }: { userId: string }): Promise<GameDto[]> {
        try {
            const resp = await this.axiosInstance.request<GameDto[]>({
                method: 'get',
                url: `/games/player/${userId}`,
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[getGamesForPlayer] got games', { data: resp.data });
            return resp.data;
        } catch (err) {
            this.logger.error(`[getGamesForPlayer] got an error response`, { err });
            throw err;
        }
    }

    public async updateGame({ id, game }: { id: string; game: CreateGameDto }): Promise<GameDto> {
        const { name, players } = game;
        try {
            const resp = await this.axiosInstance.request<GameDto>({
                method: 'patch',
                url: `/games/${id}`,
                data: { name, players },
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[updateGame] updated game', { data: resp.data });
            return resp.data;
        } catch (err) {
            this.logger.error(`[updateGame] got an error response`, { err });
            if (axios.isAxiosError(err)) {
                const { status, data } = err.response ?? {};
                this.logger.info(`[getGamesForPlayer] axios error details`, { status, data });
            }
            throw err;
        }
    }

    public async deleteGame({ gameId }: { gameId: string }) {
        try {
            const resp = await this.axiosInstance.request({
                method: 'delete',
                url: `/games/${gameId}`,
            });
            if (resp.status !== 204) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[deleteGame] game deleted', { gameId });
        } catch (err) {
            this.logger.error(`[deleteGame] got an error response`, { err });
            throw err;
        }
    }

    public async canAddNewTag({ userId, gameId }: { userId: string; gameId: string }): Promise<boolean> {
        try {
            const resp = await this.axiosInstance.request<boolean>({
                method: 'get',
                url: `/games/${gameId}/user/${userId}/can-add-tag`,
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[canAddNewTag] got response', { data: resp.data });
            return resp.data;
        } catch (err) {
            this.logger.error(`[canAddNewTag] got an error response`, { err });
            throw err;
        }
    }
}
