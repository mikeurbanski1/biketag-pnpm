import { Logger } from '@biketag/utils';

import { app } from './app';
import { initializePersistence } from './dal/persistenceService';
import { QueueManager } from './queue/manager';

// import { UsersService } from './users/usersService';
// import { GamesService } from './games/gamesService';
// import { GameRoles } from '@biketag/models';

const port = process.env.PORT || 3001;

const logger = new Logger({ prefix: '[Server]' });

initializePersistence().then(() => {
    logger.info('Initialized persistence');
    app.listen(port, () => {
        logger.info(`Example app listening at http://localhost:${port}`);
        QueueManager.getInstance();
        logger.info(`Initialized queue manager`);
    });
});

// if (process.env.BOOTSTRAP_DATA === 'true') {
//     logger.info('bootstrapping data');
//     const usersService = new UsersService();
//     const gamesService = new GamesService();

//     const mike = usersService.createUser({
//         name: 'Mike'
//     });

//     const jenny = usersService.createUser({
//         name: 'Jenny'
//     });

//     const katie = usersService.createUser({
//         name: 'Katie'
//     });

//     const users = [mike, jenny, katie];

//     logger.info(`created users`, { users });

//     const jennyGame = gamesService.createGame({
//         name: "Jenny's bike tag!",
//         creator: jenny.id
//     });

//     const mikeGame = gamesService.createGame({
//         name: "Mike's Bikes Bike Mike'",
//         creator: mike.id
//     });

//     gamesService.addPlayerInGame({
//         gameId: mikeGame.id,
//         userId: katie.id,
//         role: GameRoles.PLAYER
//     });

//     const games = [jennyGame, mikeGame];

//     logger.info(`created games`, { games });
// }
