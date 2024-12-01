import { describe, expect, it } from 'vitest';

import { mapToRecord } from '../src';

describe('utils tests', () => {
    it('should convert a map to a record', () => {
        expect(
            mapToRecord(
                new Map([
                    ['a', 1],
                    ['b', 2],
                ])
            )
        ).toEqual({ a: 1, b: 2 });
    });
});
