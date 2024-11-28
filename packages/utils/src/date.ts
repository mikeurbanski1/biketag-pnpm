import dayjs, { Dayjs } from 'dayjs';

export function isSameDate(date1: Dayjs, date2: Dayjs): boolean;
export function isSameDate(date1: string, date2: string): boolean;
export function isSameDate(date1: Dayjs, date2: string): boolean;
export function isSameDate(date1: string, date2: Dayjs): boolean;
export function isSameDate(date1: Dayjs | string, date2: Dayjs | string): boolean {
    if (typeof date1 === 'string') {
        date1 = dayjs(date1);
    }
    if (typeof date2 === 'string') {
        date2 = dayjs(date2);
    }
    return date1.format('YYYY-MM-DD') === date2.format('YYYY-MM-DD');
}
