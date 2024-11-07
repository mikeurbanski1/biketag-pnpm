export enum GameRoles {
    ADMIN = 'ADMIN',
    PLAYER = 'PLAYER'
}

export interface PlayerGame {
    userId: string;
    role: GameRoles;
}
