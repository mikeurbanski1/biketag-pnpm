import dayjs, { Dayjs } from 'dayjs';

import { CreateTagParams, GameRoles, TagDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { MongoDbProvider } from '../dal/providers/mongoProvider';
import { QueueManager } from '../queue/manager';
import { GameService } from '../services/games/gameService';
import { TagService } from '../services/tags/tagService';
import { UserService } from '../services/users/userService';

const logger = new Logger({ prefix: '[Bootstrap]' });

let provider: MongoDbProvider;
let queueManager: QueueManager;

let rootCounter = 0;
let chainCounter = 0;

// let now = dayjs();

let startDate: Dayjs = dayjs(`${dayjs().format('YYYY-MM-DD')} 06:44`).subtract(6, 'days');
const newRootDate = () => {
    logger.info(`[newRootDate] rootCounter: ${rootCounter}`);
    rootCounter++;
    chainCounter = 0;
    return startDate
        .add(rootCounter, 'days')
        .add(rootCounter * 2, 'hours')
        .add(rootCounter * 3, 'minutes')
        .toISOString();
};

const newChainDate = () => {
    chainCounter++;
    // starting at 4th item, consider them late tags
    const lateDays = chainCounter > 3 ? 2 + (chainCounter - 3) : 0;
    return startDate
        .add(rootCounter + lateDays, 'days')
        .add(rootCounter * 2, 'hours')
        .add(rootCounter * 3, 'minutes')
        .add(chainCounter * 2, 'hours')
        .add(chainCounter * 3, 'minutes')
        .toISOString();
};

const imageUrls = [
    // China
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlkqPspclrT2BLgJ4llZyk8gamvshONSOX_Q&s',
    'https://cdn.techinasia.com/wp-content/uploads/2014/07/flying-pidgeon-bike-china-720x480.jpg',
    'https://foreignpolicy.com/wp-content/uploads/2018/12/GettyImages-668015204.jpg',
    'https://gdb.voanews.com/79A3DA72-028F-4578-A5F9-29139A0A1599_w1080_h608_s.jpg',
    'https://global.unitednations.entermediadb.net/assets/mediadb/services/module/asset/downloads/preset/assets/2019/06/03-06-2019-hangzhou-bike2.jpg/image1440x560cropped.jpg',
    'https://flatbike.com/wp-content/uploads/2020/12/beijingbikes.jpg',
    // Brazil
    'https://bikepacking.com/wp-content/uploads/2020/08/green-brazil-axel-carion_2.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFxki8B0fo47IqUmz7JVgagwAsVCEyB32Lcg&s',
    'https://bikepacking.com/wp-content/uploads/2020/08/green-brazil-axel-carion_share_1.jpg',
    'https://preview.redd.it/brazilian-bike-saddle-v0-3275mxkjykmc1.jpg?width=1080&crop=smart&auto=webp&s=73487db7a8001e39a648c222f2a297e7a09458c8',
    // Italy
    'https://www.italiarail.com/sites/default/files/inline-images/bike_0.jpg',
    'https://italiantribune.com/wp-content/uploads/2021/03/030421-Italy-_-Bicycles-Tour-Florence.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCazKIZ32K5BQ174_f3-LVGi-HjwsTE7TwzA&s',
    'https://kristensraw.com/blog/wp-content/uploads/2019/05/IMG_1414.jpg',
    'https://wanderyourway.com/wp-content/uploads/2014/05/12Italy1343A.jpg',
    // Canada
    'https://cyclingmagazine.ca/wp-content/uploads/2018/02/Best_In_Show_altruiste_nahbs2018-feature.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQflxOMqXEqNpbBIiVgcfLcB9-3HSAnzTQWOA&s',
    'https://i.ebayimg.com/images/g/~UIAAOSwUW9ikq~r/s-l400.jpg',
    'https://ebikebc.com/cdn/shop/articles/Rebate_News_CA.jpg?v=1678476431',
    'https://www.greatcanadiantrails.com/croppedImages/North-America/Canada/NS-HubbardsBike-990122-500px.jpg',
    // Orange Crush
    'https://tandempalooza.com/wp-content/uploads/2021/05/b107942c-da32-499e-a244-a99eeac15a44.jpeg?w=1024',
    'https://i.etsystatic.com/48296140/r/il/fc2daa/5979724119/il_fullxfull.5979724119_904m.jpg',
    'https://bloximages.newyork1.vip.townnews.com/ehextra.com/content/tncms/assets/v3/editorial/7/71/77125796-eb93-11ee-b641-4f0a51778b48/660302762d327.image.jpg?resize=400%2C323',
    'https://revvedupbanners.com/cdn/shop/products/ORANGE_CRUSH_OLD_SCHOOL_SIGN_REMAKE_BANNER_2_X_4_PROOF_REVISED_1024x1024.jpg?v=1522594926',
    'https://live.staticflickr.com/3395/3189942292_7b797e43e9_b.jpg',
    // High Bridge
    'https://saintpaulhistorical.com/files/fullsize/459e3f7d76ee763d9ef95ef7e5badcdd.jpg',
    'https://live.staticflickr.com/65535/52133893699_bd9b4735c7_h.jpg',
    'https://lh5.googleusercontent.com/proxy/71qXVx_Ohh6QDTEWMfdIzum2ZwH6JTINNHjAAwWODz1Y-rjaYR1DWvSdt2yHVWAvphpubVZF5Wu3M1n85056lSDOX8sYcg',
    'https://lh6.googleusercontent.com/proxy/cpwJfqkTMdPtn_9m9iSjCM5s6IoQoR20hwz02aWw4kAXzIZt_BybKE8V7y0JUqTXQIxh-KWqmBUcLpwYQzMHcFITuz40uA',
    // MIA
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSb-_oeMsy2qTfCQwyMmsHpI6ehDETSxHm9_g&s',
];

const bootstrapData = async () => {
    provider = await MongoDbProvider.getInstance();
    queueManager = QueueManager.getInstance();

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
                { userId: users[5].id, role: GameRoles.PLAYER },
            ],
        }),
        await gameService.create({
            name: "Mike's bike tag!",
            creatorId: users[0].id,
            players: [
                { userId: users[1].id, role: GameRoles.ADMIN },
                { userId: users[2].id, role: GameRoles.ADMIN },
                { userId: users[3].id, role: GameRoles.PLAYER },
                { userId: users[4].id, role: GameRoles.PLAYER },
                { userId: users[5].id, role: GameRoles.PLAYER },
            ],
        }),
        await gameService.create({
            name: "Katie's bike tag!",
            creatorId: users[2].id,
            players: [
                { userId: users[0].id, role: GameRoles.ADMIN },
                { userId: users[1].id, role: GameRoles.ADMIN },
                { userId: users[3].id, role: GameRoles.PLAYER },
            ],
        }),
    ];

    logger.info(`[bootstrapData] created games`, { games });
    logger.info(`[bootstrapData] creating tags`);

    const tags: TagDto[] = [];
    let nextImage = 0;

    let obj: CreateTagParams = { imageUrl: imageUrls[nextImage++], creatorId: users[0].id, gameId: games[0].id, isRoot: true, postedDate: newRootDate() };
    let tag1a = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[1].id, gameId: games[0].id, isRoot: false, postedDate: newChainDate(), rootTagId: tag1a.id };
    let tag1b = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[2].id, gameId: games[0].id, isRoot: false, postedDate: newChainDate(), rootTagId: tag1a.id };
    let tag1c = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[3].id, gameId: games[0].id, isRoot: false, postedDate: newChainDate(), rootTagId: tag1a.id };
    let tag1d = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[4].id, gameId: games[0].id, isRoot: false, postedDate: newChainDate(), rootTagId: tag1a.id };
    let tag1e = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[5].id, gameId: games[0].id, isRoot: false, postedDate: newChainDate(), rootTagId: tag1a.id };
    let tag1f = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[1].id, gameId: games[0].id, isRoot: true, postedDate: newRootDate() };
    let tag2a = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[5].id, gameId: games[0].id, isRoot: false, postedDate: newChainDate(), rootTagId: tag2a.id };
    let tag2b = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[3].id, gameId: games[0].id, isRoot: false, postedDate: newChainDate(), rootTagId: tag2a.id };
    let tag2c = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[0].id, gameId: games[0].id, isRoot: false, postedDate: newChainDate(), rootTagId: tag2a.id };
    let tag2d = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[5].id, gameId: games[0].id, isRoot: true, postedDate: newRootDate() };
    let tag3a = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[1].id, gameId: games[0].id, isRoot: false, postedDate: newChainDate(), rootTagId: tag3a.id };
    let tag3b = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[2].id, gameId: games[0].id, isRoot: false, postedDate: newChainDate(), rootTagId: tag3a.id };
    let tag3c = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[4].id, gameId: games[0].id, isRoot: false, postedDate: newChainDate(), rootTagId: tag3a.id };
    let tag3d = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[3].id, gameId: games[0].id, isRoot: false, postedDate: newChainDate(), rootTagId: tag3a.id };
    let tag3e = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[1].id, gameId: games[0].id, isRoot: true, postedDate: newRootDate() };
    let tag4a = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[0].id, gameId: games[0].id, isRoot: false, postedDate: newChainDate(), rootTagId: tag4a.id };
    let tag4b = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[4].id, gameId: games[0].id, isRoot: false, postedDate: newChainDate(), rootTagId: tag4a.id };
    let tag4c = await tagService.create(obj);

    obj = {
        imageUrl: imageUrls[nextImage++],
        creatorId: users[5].id,
        gameId: games[0].id,

        isRoot: false,
        postedDate: newChainDate(),

        rootTagId: tag4a.id,
    };
    let tag4d = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[2].id, gameId: games[0].id, isRoot: false, postedDate: newChainDate(), rootTagId: tag4a.id };
    let tag4e = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[2].id, gameId: games[1].id, isRoot: true, postedDate: newRootDate() };
    let tag5a = await tagService.create(obj);

    obj = {
        imageUrl: imageUrls[nextImage++],
        creatorId: users[3].id,
        gameId: games[1].id,

        isRoot: false,
        postedDate: newChainDate(),

        rootTagId: tag5a.id,
    };
    let tag5b = await tagService.create(obj);

    obj = {
        imageUrl: imageUrls[nextImage++],
        creatorId: users[4].id,
        gameId: games[1].id,
        isRoot: false,
        postedDate: newChainDate(),

        rootTagId: tag5a.id,
    };
    let tag5c = await tagService.create(obj);

    obj = {
        imageUrl: imageUrls[nextImage++],
        creatorId: users[5].id,
        gameId: games[1].id,

        isRoot: false,
        postedDate: newChainDate(),

        rootTagId: tag5a.id,
    };
    let tag5d = await tagService.create(obj);

    obj = {
        imageUrl: imageUrls[nextImage++],
        creatorId: users[0].id,
        gameId: games[1].id,

        isRoot: false,
        postedDate: newChainDate(),

        rootTagId: tag5a.id,
    };
    let tag5e = await tagService.create(obj);

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[3].id, gameId: games[1].id, isRoot: true, postedDate: newRootDate() };
    let tag6a = await tagService.create(obj);

    obj = {
        imageUrl: imageUrls[nextImage++],
        creatorId: users[1].id,
        gameId: games[1].id,

        isRoot: false,
        postedDate: newChainDate(),

        rootTagId: tag6a.id,
    };
    let tag6b = await tagService.create(obj);

    obj = {
        imageUrl: imageUrls[nextImage++],
        creatorId: users[2].id,
        gameId: games[1].id,

        isRoot: false,
        postedDate: newChainDate(),

        rootTagId: tag6a.id,
    };
    let tag6c = await tagService.create(obj);

    obj = {
        imageUrl: imageUrls[nextImage++],
        creatorId: users[0].id,
        gameId: games[1].id,

        isRoot: false,
        postedDate: newChainDate(),

        rootTagId: tag6a.id,
    };
    let tag6d = await tagService.create(obj);

    // get a same day tag post
    rootCounter--;

    obj = { imageUrl: imageUrls[nextImage++], creatorId: users[1].id, gameId: games[1].id, isRoot: true, postedDate: newRootDate() };
    let tag7a = await tagService.create(obj);

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
        tag2d,
        tag7a
    );

    tags.filter((tag) => tag.isRoot).forEach((tag) => {
        logger.info(`[bootstrapData] root tag local creation time`, { imageUrl: tag.imageUrl, postedDate: dayjs(tag.postedDate).format('YYYY/MM/DD') });
    });

    // logger.info(`[bootstrapData] created tags`, { tags });
};

bootstrapData()
    .then(() => {
        logger.info('Finished bootstrapping new data');
    })
    .catch((err) => {
        logger.error(`Error bootstrapping data ${err}`, { err });
    })
    .finally(() => {
        if (provider) {
            provider.close().then(() => logger.info('closed connection'));
        }
        if (queueManager) {
            queueManager.close().then(() => logger.info('closed queue'));
        }
    });
