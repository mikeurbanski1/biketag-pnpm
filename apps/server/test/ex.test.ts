import { mapToRecord } from '@biketag/utils';
import { describe, it, expect } from 'vitest';

describe('server test hello', () => {
    it('should run the right utils', () => {
        expect(
            mapToRecord(
                new Map([
                    ['a', 1],
                    ['b', 2]
                ])
            )
        ).toEqual({ a: 1, b: 2 });
    });
});
