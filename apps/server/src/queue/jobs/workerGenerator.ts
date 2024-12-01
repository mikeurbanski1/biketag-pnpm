import { Logger } from '@biketag/utils';
import IORedis from 'ioredis';
import { Processor, Queue, Worker } from 'bullmq';
import { MongoDbProvider } from '../../dal/providers/mongoProvider';

export const startWorker = async <T>({ queueName, fn }: { queueName: string; fn: Processor<T, any, string> }) => {
    const logger = new Logger({ prefix: `[startWorker][${queueName}]` });
    logger.info(`entering`, { queueName });
    const provider = await MongoDbProvider.getInstance();
    const queue = new Queue<T>(queueName);
    const connection = new IORedis({ maxRetriesPerRequest: null });
    queue.getJobCounts().then((counts) => {
        logger.info(`job counts`, { counts });
    });

    const worker = new Worker<T>(queueName, fn, { connection });

    worker.on('completed', (job) => {
        logger.info(`${job.id} has completed`);
    });

    worker.on('failed', (job, err) => {
        logger.info(`${job?.id || 'unknown job ID'} has failed with ${err.message}`);
    });

    const gracefulShutdown = async (signal: string) => {
        logger.info(`Received ${signal}, closing worker...`);
        await worker.close();
        await queue.close();
        await connection.quit();
        await provider.close();
        logger.info(`Worker closed`);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    logger.info(`worker is initialized`);
};
