import { Logger } from '@biketag/utils';
import { MongoDbProvider } from './providers/mongoProvider';
import { UserService } from '../services/users/userService';
import { GameService } from '../services/games/gamesService';
import { GameRoles } from '@biketag/models';

const logger = new Logger({ prefix: '[PersistenceService]' });

export const initializePersistence = async () => {
    const provider = await MongoDbProvider.getInstance();

    provider.getCollection('users');
    provider.getCollection('games');
};

export const bootstrapData = async () => {
    const provider = await MongoDbProvider.getInstance();

    let usersCollection = provider.getCollection('users');
    logger.info(`[bootstrapData] dropping users collection: ${await usersCollection.drop()}`);

    usersCollection = provider.getCollection('users');
    await usersCollection.createIndex({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

    let gamesCollection = provider.getCollection('games');
    logger.info(`[bootstrapData] dropping games collection: ${await gamesCollection.drop()}`);
    gamesCollection = provider.getCollection('games');
    await gamesCollection.createIndex({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

    logger.info('[bootstrapData] dropped and recreated collections');

    logger.info(`[bootstrapData] creating users`);

    const usersService = new UserService();
    const gamesService = new GameService();

    const names = ['Mike', 'Jenny', 'Katie', 'Henry'];
    const users = await Promise.all(names.map((name) => usersService.create({ name })));

    logger.info(`[bootstrapData] created users`, { users });
    logger.info(`[bootstrapData] creating games`);

    const games = [
        await gamesService.create({
            name: "Jenny's bike tag!",
            creatorId: users[1].id,
            players: [
                { userId: users[0].id, role: GameRoles.ADMIN },
                { userId: users[2].id, role: GameRoles.PLAYER }
            ]
        }),
        await gamesService.create({
            name: "Mike's bike tag!",
            creatorId: users[0].id,
            players: [
                { userId: users[2].id, role: GameRoles.ADMIN },
                { userId: users[0].id, role: GameRoles.PLAYER },
                { userId: users[3].id, role: GameRoles.PLAYER }
            ]
        }),
        await gamesService.create({
            name: "Katie's bike tag!",
            creatorId: users[2].id,
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
