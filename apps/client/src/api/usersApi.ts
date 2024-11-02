import { AxiosError } from 'axios';
import { axiosInstance } from '.';
import { Logger } from '@biketag/utils';
import { CreateUserParams, UserEntity } from '@biketag/models';

export class LoginFailedError extends Error {}
export class SignupFailedError extends Error {}

const logger = new Logger({ prefix: '[UsersApi]' });

export class UsersApi {
    public async login({ name, id }: UserEntity) {
        try {
            const resp = await axiosInstance.request({
                method: 'post',
                url: '/users/login',
                data: {
                    id,
                    name
                }
            });
            if (resp.status !== 200) {
                throw new LoginFailedError(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            logger.info(`[login] login successful`);
        } catch (err) {
            logger.error(`[login] error`, { err });
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

    public async signup({ name }: CreateUserParams): Promise<UserEntity> {
        try {
            const resp = await axiosInstance.request({
                method: 'post',
                url: '/users',
                data: {
                    name
                }
            });
            if (resp.status !== 201) {
                throw new SignupFailedError(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            logger.info('[signup] got 201 response', { data: resp.data });
            return { name, id: resp.data.id };
        } catch (err) {
            logger.info(`[signup]`, { err });
            if (err instanceof AxiosError) {
                throw new SignupFailedError(err.message);
            }
            throw err;
        }
    }
}

