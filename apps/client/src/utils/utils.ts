import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const convertDateToRelativeDate = (d: Dayjs): string => {
    const now = dayjs().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0);
    const date = dayjs(d).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0);
    const diff = now.diff(date, 'day');
    if (diff === 0) {
        return 'Today';
    }
    if (diff === 1) {
        return 'Yesterday';
    }
    if (diff < 5) {
        return date.format('dddd');
    }
    return date.format('MM/DD/YYYY');
};
