import { parseArgs } from 'node:util';

import { Logger } from '@biketag/utils';

import { MongoDbProvider } from '../dal/providers/mongoProvider';
import { GameService } from '../services/games/gameService';

const logger = new Logger({ prefix: '[UpdatePendingGame]' });

let provider: MongoDbProvider;

const run = async () => {
    provider = await MongoDbProvider.getInstance();

    const {
        values: { gameId },
    } = parseArgs({
        options: {
            gameId: {
                type: 'string',
                short: 'g',
            },
        },
    });
    if (!gameId) {
        throw new Error('Game ID not provided');
    }
    logger.info(`[run] got gameId ${gameId}`);

    const gameService = new GameService();
    const game = await gameService.getRequiredAsEntity({ id: gameId });
    logger.info(`[run] got game`, { game });
    if (!game.pendingRootTagId) {
        logger.info(`[run] game ${gameId} has no pending tag`);
        return;
    }

    const newGame = await gameService.updatePendingTag({ gameId });
    logger.info(`[run] updated game`, { newGame });
};

run()
    .then(() => {
        logger.info('Finished');
    })
    .catch((err) => {
        logger.error(`An error occurred updating the game ${err}`);
    })
    .finally(() => {
        if (provider) {
            provider.close().then(() => logger.info('closed connection'));
        }
    });
