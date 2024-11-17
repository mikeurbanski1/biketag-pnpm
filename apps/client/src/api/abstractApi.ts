import axios from 'axios';
import { getUrl } from './config';
import { Logger } from '@biketag/utils';

export class AbstractApi {
    protected readonly logger;
    protected readonly axiosInstance;
    constructor({ clientId, logPrefix }: { clientId: string; logPrefix: string }) {
        this.axiosInstance = axios.create({
            baseURL: getUrl(),
            headers: {
                'Content-Type': 'application/json',
                'X-Accept': 'application/json',
                'X-Client-Id': clientId
            }
        });
        this.logger = new Logger({ prefix: logPrefix });
    }

    /**
     * Update or clear the user attribute headers. Pass null to delete the header. Pass undefined to leave it unchanged.
     */
    public setUser({ userId, clientId }: { userId?: string | null; clientId?: string | null }) {
        if (userId) {
            this.axiosInstance.defaults.headers['X-User-Id'] = userId;
        } else if (userId === null) {
            delete this.axiosInstance.defaults.headers['X-User-Id'];
        }

        if (clientId) {
            this.axiosInstance.defaults.headers['X-Client-Id'] = clientId;
        } else if (clientId === null) {
            delete this.axiosInstance.defaults.headers['X-Client-Id'];
        }
    }
}
