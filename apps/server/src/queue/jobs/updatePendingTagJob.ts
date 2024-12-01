import { Job } from 'bullmq';

import { Logger } from '@biketag/utils';

import { GameService } from '../../services/games/gamesService';
import { PENDING_TAG_QUEUE_NAME } from '../consts';
import { PendingTagJobData } from '../models';
import { startWorker } from './workerGenerator';

const logger = new Logger({ prefix: '[UpdatePendingTagWorker]' });

const updatePendingTagJobWorker = async (job: Job<PendingTagJobData>) => {
    logger.info('start job to update pending tag', { job });
    const gameService = new GameService();
    const game = await gameService.updatePendingTag({ gameId: job.data.gameId });
    logger.info('updated pending tag', { game });
};

startWorker<PendingTagJobData>({ queueName: PENDING_TAG_QUEUE_NAME, fn: updatePendingTagJobWorker });
