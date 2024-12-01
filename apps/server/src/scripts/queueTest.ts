import { Queue, QueueEvents } from 'bullmq';
import dayjs from 'dayjs';

const myQueue = new Queue('foo');

const queueEvents = new QueueEvents('foo');

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
const date2 = date.add(5, 'seconds');
console.log(date.toISOString());
console.log(date.valueOf());

console.log(date2.toISOString());
console.log(date2.valueOf());

async function addJobs() {
    await myQueue.add('myJobName', { foo: 'bar' }, { delay: date2.valueOf() - date.valueOf() });
}

(async () => {
    await addJobs();
    console.log(await myQueue.getJobCounts());
})();
