import { MockDalService, MockService, mockServiceErrors, MockType } from '../testUtils/mockTypes';
import { Mock, vitest, describe, it, beforeAll, beforeEach, afterAll, afterEach, expect, vi } from 'vitest';

describe('BaseService tests', () => {
    // beforeEach(() => {
    //     vitest.spyOn(MockDalService.prototype, 'getAll').mockResolvedValue([{ id: '1', name: 'test', phone: '1234' }]);
    // });

    it('should get all', async () => {
        vitest.spyOn(MockDalService.prototype, 'getAll').mockResolvedValue([{ id: '1', name: 'test', phone: '1234' }]);
        const service = new MockService();
        expect(await service.getAll()).toEqual([{ id: '1', name: 'test', phone: '1234' }]);
    });
});
