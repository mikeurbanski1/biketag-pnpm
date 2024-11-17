import { Logger } from '@biketag/utils';
import { GameRoles, TagDto, CreateTagParams } from '@biketag/models';
import { MongoDbProvider } from './dal/providers/mongoProvider';
import { GameService } from './services/games/gamesService';
import { TagService } from './services/tags/tagService';
import { UserService } from './services/users/userService';

const logger = new Logger({ prefix: '[Bootstrap]' });

const bootstrapData = async () => {
    const provider = await MongoDbProvider.getInstance();

    let usersCollection = provider.getCollection('users');
    logger.info(`[bootstrapData] dropping users collection: ${await usersCollection.drop()}`);

    usersCollection = provider.getCollection('users');
    await usersCollection.createIndex({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

    let gamesCollection = provider.getCollection('games');
    logger.info(`[bootstrapData] dropping games collection: ${await gamesCollection.drop()}`);
    gamesCollection = provider.getCollection('games');
    await gamesCollection.createIndex({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

    let tagsCollection = provider.getCollection('tags');
    logger.info(`[bootstrapData] dropping tags collection: ${await tagsCollection.drop()}`);
    tagsCollection = provider.getCollection('tags');
    await tagsCollection.createIndex({ gameId: 1, isRoot: 1 });
    await tagsCollection.createIndex({ gameId: 1, rootTagId: 1 });

    logger.info('[bootstrapData] dropped and recreated collections');

    logger.info(`[bootstrapData] creating users`);

    const userService = new UserService();
    const gameService = new GameService();
    const tagService = new TagService();

    const names = ['Mike', 'Jenny', 'Katie', 'Henry', 'Hung', 'Breanne'];
    const users = await Promise.all(names.map((name) => userService.create({ name })));

    logger.info(`[bootstrapData] created users`, { users });
    logger.info(`[bootstrapData] creating games`);

    const games = [
        await gameService.create({
            name: "Jenny's bike tag!",
            creatorId: users[1].id,
            players: [
                { userId: users[0].id, role: GameRoles.ADMIN },
                { userId: users[2].id, role: GameRoles.ADMIN },
                { userId: users[3].id, role: GameRoles.PLAYER },
                { userId: users[4].id, role: GameRoles.PLAYER },
                { userId: users[5].id, role: GameRoles.PLAYER }
            ]
        }),
        await gameService.create({
            name: "Mike's bike tag!",
            creatorId: users[0].id,
            players: [
                { userId: users[1].id, role: GameRoles.ADMIN },
                { userId: users[2].id, role: GameRoles.ADMIN },
                { userId: users[3].id, role: GameRoles.PLAYER },
                { userId: users[4].id, role: GameRoles.PLAYER },
                { userId: users[5].id, role: GameRoles.PLAYER }
            ]
        }),
        await gameService.create({
            name: "Katie's bike tag!",
            creatorId: users[2].id,
            players: [
                { userId: users[0].id, role: GameRoles.ADMIN },
                { userId: users[1].id, role: GameRoles.ADMIN },
                { userId: users[3].id, role: GameRoles.PLAYER }
            ]
        })
    ];

    logger.info(`[bootstrapData] created games`, { games });
    logger.info(`[bootstrapData] creating tags`);

    const tags: TagDto[] = [];

    let obj: CreateTagParams = { name: 'China', creatorId: users[0].id, gameId: games[0].id, contents: 'I got here fast!', isRoot: true };
    let tag1a = await tagService.create(obj);

    obj = { name: 'China', creatorId: users[1].id, gameId: games[0].id, contents: 'Me too, almost', isRoot: false, parentTagId: tag1a.id, rootTagId: tag1a.id };
    let tag1b = await tagService.create(obj);

    obj = { name: 'China', creatorId: users[2].id, gameId: games[0].id, contents: 'I got there eventually', isRoot: false, parentTagId: tag1b.id, rootTagId: tag1a.id };
    let tag1c = await tagService.create(obj);

    obj = { name: 'China', creatorId: users[3].id, gameId: games[0].id, contents: 'I got there eventually', isRoot: false, parentTagId: tag1c.id, rootTagId: tag1a.id };
    let tag1d = await tagService.create(obj);

    obj = { name: 'China', creatorId: users[4].id, gameId: games[0].id, contents: 'I got there eventually', isRoot: false, parentTagId: tag1d.id, rootTagId: tag1a.id };
    let tag1e = await tagService.create(obj);

    obj = { name: 'China', creatorId: users[5].id, gameId: games[0].id, contents: 'I got there eventually', isRoot: false, parentTagId: tag1e.id, rootTagId: tag1a.id };
    let tag1f = await tagService.create(obj);

    obj = { name: 'Brazil', creatorId: users[5].id, gameId: games[0].id, contents: 'Wet and wild', isRoot: true };
    let tag2a = await tagService.create(obj);

    obj = { name: 'Brazil', creatorId: users[1].id, gameId: games[0].id, contents: 'Eat by snek', isRoot: false, parentTagId: tag2a.id, rootTagId: tag2a.id };
    let tag2b = await tagService.create(obj);

    obj = { name: 'Brazil', creatorId: users[3].id, gameId: games[0].id, contents: 'Snek eat by mongose', isRoot: false, parentTagId: tag2b.id, rootTagId: tag2a.id };
    let tag2c = await tagService.create(obj);

    obj = { name: 'Brazil', creatorId: users[0].id, gameId: games[0].id, contents: 'mongose rules', isRoot: false, parentTagId: tag2c.id, rootTagId: tag2a.id };
    let tag2d = await tagService.create(obj);

    obj = { name: 'Italy', creatorId: users[0].id, gameId: games[0].id, contents: 'Et tu, Brute?', isRoot: true };
    let tag3a = await tagService.create(obj);

    obj = { name: 'Italy', creatorId: users[1].id, gameId: games[0].id, contents: 'Giro is fun', isRoot: false, parentTagId: tag3a.id, rootTagId: tag3a.id };
    let tag3b = await tagService.create(obj);

    obj = { name: 'Italy', creatorId: users[0].id, gameId: games[0].id, contents: 'I cannot ski', isRoot: false, parentTagId: tag3b.id, rootTagId: tag3a.id };
    let tag3c = await tagService.create(obj);

    obj = { name: 'Italy', creatorId: users[4].id, gameId: games[0].id, contents: 'Fucking tourists...', isRoot: false, parentTagId: tag3c.id, rootTagId: tag3a.id };
    let tag3d = await tagService.create(obj);

    obj = { name: 'Italy', creatorId: users[5].id, gameId: games[0].id, contents: 'Giro is fun', isRoot: false, parentTagId: tag3d.id, rootTagId: tag3a.id };
    let tag3e = await tagService.create(obj);

    obj = { name: 'Canada', creatorId: users[1].id, gameId: games[0].id, contents: 'OH CAH-NAH-DA', isRoot: true };
    let tag4a = await tagService.create(obj);

    obj = { name: 'Canada', creatorId: users[0].id, gameId: games[0].id, contents: 'Our home and sacred land', isRoot: false, parentTagId: tag4a.id, rootTagId: tag4a.id };
    let tag4b = await tagService.create(obj);

    obj = { name: 'Canada', creatorId: users[4].id, gameId: games[0].id, contents: 'Something something', isRoot: false, parentTagId: tag4b.id, rootTagId: tag4a.id };
    let tag4c = await tagService.create(obj);

    obj = { name: 'Canada', creatorId: users[5].id, gameId: games[0].id, contents: 'Something something command', isRoot: false, parentTagId: tag4c.id, rootTagId: tag4a.id };
    let tag4d = await tagService.create(obj);

    obj = { name: 'Canada', creatorId: users[2].id, gameId: games[0].id, contents: "Tim Horton's rules!", isRoot: false, parentTagId: tag4d.id, rootTagId: tag4a.id };
    let tag4e = await tagService.create(obj);

    obj = { name: 'Orange Crush', creatorId: users[2].id, gameId: games[1].id, contents: 'DRINK IT MOTHERFUCKER', isRoot: true };
    let tag5a = await tagService.create(obj);

    obj = { name: 'Orange Crush', creatorId: users[3].id, gameId: games[1].id, contents: 'And lemon! And lime!', isRoot: false, parentTagId: tag5a.id, rootTagId: tag5a.id };
    let tag5b = await tagService.create(obj);

    obj = { name: 'Orange Crush', creatorId: users[4].id, gameId: games[1].id, contents: 'You are not drinking it...', isRoot: false, parentTagId: tag5b.id, rootTagId: tag5a.id };
    let tag5c = await tagService.create(obj);

    obj = { name: 'Orange Crush', creatorId: users[5].id, gameId: games[1].id, contents: 'Nor lemon! Nor lime!', isRoot: false, parentTagId: tag5c.id, rootTagId: tag5a.id };
    let tag5d = await tagService.create(obj);

    obj = { name: 'Orange Crush', creatorId: users[0].id, gameId: games[1].id, contents: 'And lemon! And lime!', isRoot: false, parentTagId: tag5d.id, rootTagId: tag5a.id };
    let tag5e = await tagService.create(obj);

    obj = { name: 'High Bridge', creatorId: users[2].id, gameId: games[1].id, contents: 'High bridge is high', isRoot: true };
    let tag6a = await tagService.create(obj);

    obj = { name: 'High Bridge', creatorId: users[3].id, gameId: games[1].id, contents: 'High bridge is not low', isRoot: false, parentTagId: tag6a.id, rootTagId: tag6a.id };
    let tag6b = await tagService.create(obj);

    obj = { name: 'High Bridge', creatorId: users[1].id, gameId: games[1].id, contents: 'So up high bridge to the clouds I go', isRoot: false, parentTagId: tag6b.id, rootTagId: tag6a.id };
    let tag6c = await tagService.create(obj);

    obj = { name: 'High Bridge', creatorId: users[0].id, gameId: games[1].id, contents: 'Hi am I too late for the poem?', isRoot: false, parentTagId: tag6c.id, rootTagId: tag6a.id };
    let tag6d = await tagService.create(obj);

    tags.push(
        tag1a,
        tag1b,
        tag1c,
        tag2a,
        tag2b,
        tag3a,
        tag3b,
        tag4a,
        tag4b,
        tag5a,
        tag5b,
        tag6a,
        tag6b,
        tag6c,
        tag5c,
        tag5d,
        tag5e,
        tag6d,
        tag4c,
        tag4d,
        tag4e,
        tag3c,
        tag3d,
        tag3e,
        tag2c,
        tag1d,
        tag1e,
        tag1f,
        tag2d
    );

    // logger.info(`[bootstrapData] created tags`, { tags });

    await provider.close();
    logger.info('[bootstrapData] closed connection');
};

bootstrapData().then(() => {
    logger.info('Finished bootstrapping new data');
});
