import { Logger, LogLevel } from './logger';

export const mapToRecord = <T>(map: Map<string, T>): Record<string, T> => {
    const retVal: Record<string, T> = {};

    for (const [key, val] of map.entries()) {
        retVal[key] = val;
    }

    return retVal;
};

export const shuffleArray = <E>(array: E[]): E[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
};

export const parseIfInteger = (n: string) => (parseInt(n).toString() === n ? parseInt(n) : undefined);

export const deleteArrayPrimitive = <T>(arr: T[], item: T): boolean => {
    const index = arr.indexOf(item);
    if (index !== -1) {
        arr.splice(index, 1);
        return true;
    }
    return false;
};

export const addIfMissing = <T>(arr: T[], item: T): boolean => {
    const index = arr.indexOf(item);
    if (index === -1) {
        arr.push(item);
        return true;
    }
    return false;
};

export const jsonReplacer = (_: unknown, value: unknown) => {
    if (value instanceof Map) {
        return mapToRecord(value);
    } else if (value instanceof Set) {
        return Array.from(value);
    } else {
        return value;
    }
};

export const stringify = (value: unknown, space?: string | number) => JSON.stringify(value, jsonReplacer, space);

export const copyDefinedProperties = <T>(source: T, filters?: (keyof T)[]): Partial<T> => {
    const retVal: Partial<T> = {};

    for (const key in source) {
        if (source[key] && (!filters || filters.includes(key))) {
            retVal[key] = source[key];
        }
    }

    return retVal;
};

export { Logger, LogLevel };
export * from './consts';
