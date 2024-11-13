import { Mock, vitest, describe, it, beforeAll, beforeEach, afterAll, afterEach, expect, vi } from 'vitest';
import { UserService } from '../../src/services/users/userService';
import { GameService } from '../../src/services/games/gamesService';
import { GameDalService } from '../../src/dal/services/gameDalService';
import { GameRoles } from '@biketag/models';

describe('GamesService tests', () => {
    describe('create tests', async () => {
        beforeEach(() => {
            vitest.spyOn(UserService.prototype, 'get').mockResolvedValue({ id: '1', name: 'test' });
            vitest.spyOn(GameDalService.prototype, 'create').mockResolvedValue({ id: '1', name: 'test', creatorId: '1', players: [{ userId: '2', role: GameRoles.ADMIN }] });
        });
        it('should create a new game', async () => {
            const service = new GameService();
            const obj = { name: 'test', creatorId: '1', players: [{ userId: '2', role: GameRoles.ADMIN }] };
            const res = await service.create(obj);
            expect(res).toHaveProperty('id');
            const { id, ...rest } = res;
            expect(rest).toEqual(obj);
        });
    });
});
