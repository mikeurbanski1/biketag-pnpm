import { parseArgs } from 'node:util';

import { Queue } from 'bullmq';
import dayjs from 'dayjs';

import { Logger } from '@biketag/utils';

import { MongoDbProvider } from '../dal/providers/mongoProvider';
import { PENDING_TAG_QUEUE_NAME } from '../queue/consts';
import { PendingTagJobData } from '../queue/models';

const logger = new Logger({ prefix: `[QueueReport]` });

let provider: MongoDbProvider;
let jobQueue: Queue;

const queueToJobMap: Record<string, (queue: Queue) => Promise<void>> = {
    [PENDING_TAG_QUEUE_NAME]: async (queue: Queue<PendingTagJobData>) => {
        logger.info(`job count summary`, { jobCounts: await queue.getJobCounts() });
        const jobs = await queue.getJobs();
        jobs.forEach((job) => {
            logger.info(`Job`, { job, startTime: dayjs(job.timestamp).add(job.delay, 'milliseconds').toISOString() });
        });
    },
};

const run = async () => {
    provider = await MongoDbProvider.getInstance();

    const {
        values: { queue },
    } = parseArgs({
        options: {
            queue: {
                type: 'string',
                short: 'q',
                default: PENDING_TAG_QUEUE_NAME,
            },
        },
    });
    if (!queue) {
        throw new Error('Queue to check not provided');
    }
    logger.info(`[run] got queue: ${queue}`);
    jobQueue = new Queue(queue);
    await queueToJobMap[queue](jobQueue);
};

run()
    .then(() => {
        logger.info('Finished');
    })
    .catch((err) => {
        logger.error(`An error occurred ${err}`);
    })
    .finally(() => {
        if (provider) {
            provider.close().then(() => logger.info('closed connection'));
        }
        if (jobQueue) {
            jobQueue.close().then(() => logger.info('closed queue'));
        }
    });
