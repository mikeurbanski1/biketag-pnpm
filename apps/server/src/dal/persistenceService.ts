import { Logger } from '@biketag/utils';
import { MongoDbProvider } from './providers/mongoProvider';
import { UsersService } from '../users/usersService';
import { GamesService } from '../games/gamesService';
import { GameRoles } from '@biketag/models';

const logger = new Logger({ prefix: '[PersistenceService]' });

export const initializePersistence = async () => {
    const provider = await MongoDbProvider.getInstance();

    const usersCollection = provider.getCollection('users');
    usersCollection.createIndex({ name: 1 }, { unique: true });

    const gamesCollection = provider.getCollection('games');
    gamesCollection.createIndex({ name: 1 }, { unique: true });
};

export const bootstrapData = async () => {
    const provider = await MongoDbProvider.getInstance();

    let usersCollection = provider.getCollection('users');
    await usersCollection.drop();
    usersCollection = provider.getCollection('users');
    await usersCollection.createIndex({ name: 1 }, { unique: true });

    let gamesCollection = provider.getCollection('games');
    await gamesCollection.drop();
    gamesCollection = provider.getCollection('games');
    await gamesCollection.createIndex({ name: 1 }, { unique: true });

    logger.info('[bootstrapData] dropped and recreated collections');

    logger.info(`[bootstrapData] creating users`);

    const usersService = new UsersService();
    const gamesService = new GamesService();

    const names = ['Mike', 'Jenny', 'Katie', 'Henry'];
    const users = await Promise.all(names.map((name) => usersService.create({ name })));

    logger.info(`[bootstrapData] created users`, { users });
    logger.info(`[bootstrapData] creating games`);

    const games = [
        await gamesService.create({
            name: "Jenny's bike tag!",
            creator: users[1].id,
            players: [
                { userId: users[0].id, role: GameRoles.ADMIN },
                { userId: users[2].id, role: GameRoles.PLAYER }
            ]
        }),
        await gamesService.create({
            name: "Mike's bike tag!",
            creator: users[0].id,
            players: [
                { userId: users[2].id, role: GameRoles.ADMIN },
                { userId: users[0].id, role: GameRoles.PLAYER },
                { userId: users[3].id, role: GameRoles.PLAYER }
            ]
        }),
        await gamesService.create({
            name: "Katie's bike tag!",
            creator: users[2].id,
            players: [
                { userId: users[0].id, role: GameRoles.ADMIN },
                { userId: users[2].id, role: GameRoles.ADMIN },
                { userId: users[3].id, role: GameRoles.PLAYER }
            ]
        })
    ];

    logger.info(`[bootstrapData] created games`, { games });

    await provider.close();
    logger.info('[bootstrapData] closed connection');
};
