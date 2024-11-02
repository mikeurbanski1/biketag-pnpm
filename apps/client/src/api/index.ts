import axios from 'axios';
import { UsersApi } from './usersApi';
import { GamesApi } from './gamesApi';

export * from './usersApi';

export const axiosInstance = axios.create({
    baseURL: 'http://localhost:3001'
});

export type Apis = {
    usersApi: UsersApi;
    gamesApi: GamesApi;
};
