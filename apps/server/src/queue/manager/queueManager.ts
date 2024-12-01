import { Job, Queue } from 'bullmq';
import dayjs, { Dayjs } from 'dayjs';
import IORedis from 'ioredis';

import { Logger } from '@biketag/utils';

import { PENDING_TAG_JOB_NAME, PENDING_TAG_QUEUE_NAME } from '../consts';
import { PendingTagJobData } from '../models';

export class QueueManager {
    private readonly logger: Logger = new Logger({ prefix: '[QueueManager]' });
    private static instance: QueueManager;
    private readonly pendingTagQueue: Queue<PendingTagJobData>;
    public readonly connection: IORedis;

    private constructor() {
        this.pendingTagQueue = this.createQueue<PendingTagJobData>(PENDING_TAG_QUEUE_NAME);
        this.connection = new IORedis({ maxRetriesPerRequest: null });
    }

    private createQueue<T>(queueName: string): Queue<T> {
        const queue = new Queue<T>(queueName);
        return queue;
    }

    public async close(): Promise<void> {
        await this.pendingTagQueue.close();
        this.connection.quit();
    }

    public static getInstance(): QueueManager {
        if (!QueueManager.instance) {
            QueueManager.instance = new QueueManager();
        }

        return QueueManager.instance;
    }

    public getPendingTagQueue(): Queue<PendingTagJobData> {
        return this.pendingTagQueue;
    }

    public async addPendingTagJob({ jobParams, triggerTime }: { jobParams: PendingTagJobData; triggerTime: Dayjs }): Promise<Job<PendingTagJobData>> {
        this.logger.info(`[addPendingTagJob]`, { jobParams, triggerTime });
        const job = await this.pendingTagQueue.add(PENDING_TAG_JOB_NAME, jobParams, { delay: triggerTime.diff(dayjs(), 'milliseconds') });
        this.logger.info(`[addPendingTagJob] submitted job`, { job });
        return job;
    }
}
