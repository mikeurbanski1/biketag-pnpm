import { Mock, vitest, describe, it, beforeAll, beforeEach, afterAll, afterEach, expect, vi } from 'vitest';
import { UsersService } from '../../src/users/usersService';
import { GamesService } from '../../src/games/gamesService';
import { GamesDalService } from '../../src/dal/services/gamesDalService';
import { GameRoles } from '@biketag/models';

describe('GamesService tests', () => {
    describe('create tests', async () => {
        beforeEach(() => {
            vitest.spyOn(UsersService.prototype, 'get').mockResolvedValue({ id: '1', name: 'test' });
            vitest.spyOn(GamesDalService.prototype, 'create').mockResolvedValue({ id: '1', name: 'test', creator: '1', players: [{ userId: '2', role: GameRoles.ADMIN }] });
        });
        it('should create a new game', async () => {
            const service = new GamesService();
            const obj = { name: 'test', creator: '1', players: [{ userId: '2', role: GameRoles.ADMIN }] };
            const res = await service.create(obj);
            expect(res).toHaveProperty('id');
            const { id, ...rest } = res;
            expect(rest).toEqual(obj);
        });
    });
});
