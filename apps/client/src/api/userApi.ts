import { AxiosError } from 'axios';

import { CreateUserParams, UserDto } from '@biketag/models';

import { AbstractApi } from './abstractApi';

export class LoginFailedError extends Error {}
export class SignupFailedError extends Error {}

export class UserApi extends AbstractApi {
    constructor({ clientId }: { clientId: string }) {
        super({ clientId, logPrefix: '[UserApi]' });
    }

    public async login({ name }: CreateUserParams): Promise<UserDto> {
        try {
            const resp = await this.axiosInstance.request<UserDto>({
                method: 'post',
                url: '/users/login',
                data: {
                    name,
                },
            });
            if (resp.status !== 200) {
                throw new LoginFailedError(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info(`[login] login successful`, { data: resp.data });
            return resp.data;
        } catch (err) {
            this.logger.error(`[login] error`, { err });
            if (err instanceof AxiosError) {
                if (err.status === 404) {
                    throw new LoginFailedError('User does not exist');
                } else if (err.status === 400) {
                    throw new LoginFailedError('Invalid user details entered');
                } else {
                    throw new LoginFailedError(err.message);
                }
            }
            throw err;
        }
    }

    public async signup({ name }: CreateUserParams): Promise<UserDto> {
        try {
            const resp = await this.axiosInstance.request<{ id: string }>({
                method: 'post',
                url: '/users',
                data: {
                    name,
                },
            });
            if (resp.status !== 201) {
                throw new SignupFailedError(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[signup] got 201 response', { data: resp.data });
            return { name, id: resp.data.id };
        } catch (err) {
            this.logger.info(`[signup]`, { err });
            if (err instanceof AxiosError) {
                throw new SignupFailedError(err.message);
            }
            throw err;
        }
    }

    public async getUsers(): Promise<UserDto[]> {
        try {
            const resp = await this.axiosInstance.request<UserDto[]>({
                method: 'get',
                url: '/users',
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[getUsers] got users', { data: resp.data });
            return resp.data;
        } catch (err) {
            this.logger.error(`[getUsers] got an error response`, { err });
            throw err;
        }
    }
}
