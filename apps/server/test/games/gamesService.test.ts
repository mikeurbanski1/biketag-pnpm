// @ts-ignore
import { afterEach, beforeEach, describe, expect, it, vitest } from 'vitest';

import { GameRoles } from '@biketag/models';

import { GameDalService } from '../../src/dal/services/gameDalService';
import { GameService } from '../../src/services/games/gameService';
import { UserService } from '../../src/services/users/userService';

describe('GamesService tests', () => {
    describe('create tests', async () => {
        beforeEach(() => {
            vitest.spyOn(UserService.prototype, 'get').mockResolvedValue({ id: '1', name: 'test' });
            vitest.spyOn(UserService.prototype, 'getRequired').mockImplementation(async ({ id }) => ({ id, name: 'test' }));
            vitest.spyOn(GameDalService.prototype, 'create').mockResolvedValue({ id: '1', name: 'test', creatorId: '1', players: [{ userId: '2', role: GameRoles.ADMIN }] });
        });
        afterEach(() => {
            vitest.restoreAllMocks();
        });

        it('should create a new game', async () => {
            const service = new GameService();
            const obj = { name: 'test', creatorId: '1', players: [{ userId: '2', role: GameRoles.ADMIN }] };
            const res = await service.create(obj);
            expect(res).toHaveProperty('id');
            const { id, ...rest } = res;
            expect(rest).toEqual({
                name: 'test',
                creator: { id: '1', name: 'test' },
                players: [{ userId: '2', role: GameRoles.ADMIN, user: { id: '2', name: 'test' } }],
                firstRootTag: undefined,
                latestRootTag: undefined,
            });
        });
    });
});
