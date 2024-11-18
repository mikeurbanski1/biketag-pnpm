import { CreateTagParams, TagDto } from '@biketag/models';
import { AbstractApi } from './abstractApi';
import { AxiosError } from 'axios';

export class TagNotFoundError extends Error {}

export class TagApi extends AbstractApi {
    constructor({ clientId }: { clientId: string }) {
        super({ clientId, logPrefix: '[TagApi]' });
    }

    public async getTag({ id }: { id: string }): Promise<TagDto> {
        try {
            const resp = await this.axiosInstance.request<TagDto>({
                method: 'get',
                url: `/tags/${id}`
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

    public async getMultipleTags({ id }: { id: string }): Promise<Record<string, TagDto>> {
        try {
            const resp = await this.axiosInstance.request<Record<string, TagDto>>({
                method: 'get',
                url: `/tags/${id}`
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

    public async canUserAddSubtag({ userId, tagId }: { userId: string; tagId: string }): Promise<boolean> {
        try {
            const resp = await this.axiosInstance.request<boolean>({
                method: 'get',
                url: `/tags/user/${userId}/in-chain/${tagId}`
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[canUserAddTag] got response', { data: resp.data });
            return !resp.data; // if the user is in the chain than we cannot add a tag
        } catch (err) {
            this.logger.error(`[canUserAddTag] got an error response`, { err });
            throw err;
        }
    }

    public async createTag(params: CreateTagParams): Promise<TagDto> {
        try {
            const resp = await this.axiosInstance.request<TagDto>({
                method: 'post',
                url: '/tags',
                data: params
            });
            if (resp.status !== 201) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[createTag] got 201 response', { data: resp.data });
            return resp.data;
        } catch (err) {
            this.logger.error(`[createTag] got an error response`, { err });
            throw err;
        }
    }
}
