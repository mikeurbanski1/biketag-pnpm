import { AxiosError } from 'axios';
import { Dayjs } from 'dayjs';

import { CreateTagDto, PendingTag, TagDto } from '@biketag/models';

import { AbstractApi } from './abstractApi';

export class TagNotFoundError extends Error {}

export class TagApi extends AbstractApi {
    private tagCache: Record<string, TagDto | PendingTag> = {};

    constructor({ clientId }: { clientId: string }) {
        super({ clientId, logPrefix: '[TagApi]' });
    }

    public clearCache(): void {
        this.tagCache = {};
    }

    public getTagFromCache({ id }: { id: string }): TagDto | PendingTag | undefined {
        return this.tagCache[id];
    }

    public updateTagInCache({ tagId, update }: { tagId?: string; update: Partial<TagDto | PendingTag> }): void {
        if (!tagId) {
            return;
        }
        const tag = this.tagCache[tagId];
        if (!tag) {
            return;
        }
        this.tagCache[tag.id] = { ...tag, ...update };
    }

    public async getTag({ id }: { id?: string }): Promise<TagDto | PendingTag | undefined> {
        if (!id) {
            return undefined;
        }

        const cachedTag = this.tagCache[id];
        this.logger.info(`[getTag] cached tag`, { cachedTag });

        // get from the cache if tag links are already set;
        // if not, they might be updated, so we will re-fetch it
        if (cachedTag) {
            return this.tagCache[id];
        }

        try {
            const resp = await this.axiosInstance.request<TagDto>({
                method: 'get',
                url: `/tags/${id}`,
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[getTag] got tag', { data: resp.data });
            const tag = resp.data;
            this.tagCache[id] = tag;
            return tag;
        } catch (err) {
            this.logger.error(`[getTag] got an error response`, { err });
            if (err instanceof AxiosError) {
                if (err.status === 404) {
                    throw new TagNotFoundError(err.message);
                }
            }
            throw err;
        }
    }

    public async getMultipleTags({ ids }: { ids: string[] }): Promise<Record<string, TagDto | PendingTag>> {
        try {
            const resp = await this.axiosInstance.request<Record<string, TagDto | PendingTag>>({
                method: 'post',
                url: `/tags/multi`,
                data: ids,
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[getTag] got tag', { data: resp.data });
            return resp.data;
        } catch (err) {
            this.logger.error(`[getTag] got an error response`, { err });
            if (err instanceof AxiosError) {
                if (err.status === 404) {
                    throw new TagNotFoundError(err.message);
                }
            }
            throw err;
        }
    }

    public async canUserAddTag({ userId, gameId, dateOverride }: { userId: string; gameId: string; dateOverride?: Dayjs }): Promise<boolean> {
        try {
            const resp = await this.axiosInstance.request<{ result: boolean }>({
                method: 'get',
                url: `/tags/user/${userId}/game/${gameId}/can-post-new-tag`,
                params: dateOverride ? { dateOverride: dateOverride.toISOString() } : {},
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            const { result } = resp.data;
            this.logger.info('[canUserAddTag] got response', { data: resp.data });
            return result;
        } catch (err) {
            this.logger.error(`[canUserAddTag] got an error response`, { err });
            throw err;
        }
    }

    public async canUserAddSubtag({ userId, tagId }: { userId: string; tagId: string }): Promise<boolean> {
        try {
            const resp = await this.axiosInstance.request<boolean>({
                method: 'get',
                url: `/tags/user/${userId}/in-chain/${tagId}`,
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[canUserAddSubtag] got response', { data: resp.data });
            return !resp.data; // if the user is in the chain than we cannot add a tag
        } catch (err) {
            this.logger.error(`[canUserAddSubtag] got an error response`, { err });
            throw err;
        }
    }

    public async createTag(params: CreateTagDto): Promise<TagDto> {
        try {
            const resp = await this.axiosInstance.request<TagDto>({
                method: 'post',
                url: '/tags',
                data: params,
            });
            if (resp.status !== 201) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[createTag] got 201 response', { data: resp.data });
            this.tagCache[resp.data.id] = resp.data;
            return resp.data;
        } catch (err) {
            this.logger.error(`[createTag] got an error response`, { err });
            throw err;
        }
    }
}
