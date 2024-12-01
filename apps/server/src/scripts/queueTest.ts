import { QueueEvents } from 'bullmq';
import dayjs from 'dayjs';
import { QueueManager } from '../queue/manager';
import { PENDING_TAG_QUEUE_NAME } from '../queue/consts';

// const myQueue = new Queue<PendingTagJobData>(PENDING_TAG_QUEUE_NAME);

const queueEvents = new QueueEvents(PENDING_TAG_QUEUE_NAME);

queueEvents.on('waiting', ({ jobId }) => {
    console.log(`A job with ID ${jobId} is waiting`);
});

queueEvents.on('active', ({ jobId, prev }) => {
    console.log(`Job ${jobId} is now active; previous status was ${prev}`);
});

queueEvents.on('completed', ({ jobId, returnvalue }) => {
    console.log(`${jobId} has completed and returned ${returnvalue}`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
    console.log(`${jobId} has failed with reason ${failedReason}`);
});

const date = dayjs();
const date2 = date.add(10, 'seconds');
console.log(date.toISOString());
console.log(date.valueOf());

console.log(date2.toISOString());
console.log(date2.valueOf());

// async function addJobs() {
//     await myQueue.add('myJobName', { gameId: 'f4986655-84d7-4b7a-9c99-c98ebbd5071b' }, { delay: date2.valueOf() - date.valueOf() });
// }

(async () => {
    const queueManager = QueueManager.getInstance();
    const date = dayjs();
    const date2 = date.add(10, 'seconds');
    await queueManager.addPendingTagJob({ jobParams: { gameId: 'f4986655-84d7-4b7a-9c99-c98ebbd5071b' }, triggerTime: date2 });
})();
