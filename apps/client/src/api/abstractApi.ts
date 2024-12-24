import axios from 'axios';

import { CLIENT_ID_HEADER, Logger, USER_ID_HEADER } from '@biketag/utils';

import { getUrl } from './config';

export class AbstractApi {
    protected readonly logger;
    protected readonly axiosInstance;
    private userId: string | null;
    constructor({ clientId, logPrefix }: { clientId: string; logPrefix: string }) {
        this.axiosInstance = axios.create({
            baseURL: getUrl(),
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                [CLIENT_ID_HEADER]: clientId,
            },
        });
        this.logger = new Logger({ prefix: logPrefix });
        this.userId = null;
    }

    /**
     * Update or clear the user attribute headers. Pass null to delete the header. Pass undefined to leave it unchanged.
     */
    public setUser({ userId, clientId }: { userId?: string | null; clientId?: string | null }) {
        if (userId) {
            this.axiosInstance.defaults.headers[USER_ID_HEADER] = userId;
            this.userId = userId;
        } else if (userId === null) {
            this.userId = null;
            delete this.axiosInstance.defaults.headers[USER_ID_HEADER];
        }

        if (clientId) {
            this.axiosInstance.defaults.headers[CLIENT_ID_HEADER] = clientId;
        } else if (clientId === null) {
            delete this.axiosInstance.defaults.headers[CLIENT_ID_HEADER];
        }
    }

    public getUserIdRequired(): string {
        if (!this.userId) {
            throw new Error('User ID not set');
        }
        return this.userId;
    }
}
