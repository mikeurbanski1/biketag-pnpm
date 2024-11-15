import { UserApi } from './userApi';
import { GameApi } from './gameApi';
import { AbstractApi } from './abstractApi';
import { TagApi } from './tagApi';

export * from './userApi';

export type Apis = {
    usersApi: UserApi;
    gamesApi: GameApi;
};

export class ApiManager {
    public static userApi: UserApi;
    public static gameApi: GameApi;
    public static tagApi: TagApi;
    private static apisList: AbstractApi[];

    public static setUser({ userId, clientId }: { userId?: string | null; clientId?: string | null }) {
        this.apisList.forEach((api) => api.setUser({ userId, clientId }));
    }

    public static initialize({ clientId }: { clientId: string }) {
        this.userApi = new UserApi({ clientId });
        this.gameApi = new GameApi({ clientId });
        this.tagApi = new TagApi({ clientId });
        this.apisList = [this.userApi, this.gameApi, this.tagApi];
    }
}
