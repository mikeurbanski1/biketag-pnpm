import { TagDto } from '@biketag/models';
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
}
