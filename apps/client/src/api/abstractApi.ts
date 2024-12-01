import axios from 'axios';

import { CLIENT_ID_HEADER, Logger, USER_ID_HEADER } from '@biketag/utils';

import { getUrl } from './config';

export class AbstractApi {
    protected readonly logger;
    protected readonly axiosInstance;
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
    }

    /**
     * Update or clear the user attribute headers. Pass null to delete the header. Pass undefined to leave it unchanged.
     */
    public setUser({ userId, clientId }: { userId?: string | null; clientId?: string | null }) {
        if (userId) {
            this.axiosInstance.defaults.headers[USER_ID_HEADER] = userId;
        } else if (userId === null) {
            delete this.axiosInstance.defaults.headers[USER_ID_HEADER];
        }

        if (clientId) {
            this.axiosInstance.defaults.headers[CLIENT_ID_HEADER] = clientId;
        } else if (clientId === null) {
            delete this.axiosInstance.defaults.headers[CLIENT_ID_HEADER];
        }
    }
}
