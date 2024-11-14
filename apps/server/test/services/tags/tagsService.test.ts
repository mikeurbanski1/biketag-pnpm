// @ts-ignore
import { Mock, vitest, describe, it, beforeAll, beforeEach, afterAll, afterEach, expect, vi } from 'vitest';
import { TagDalService } from '../../../src/dal/services/tagDalService';
import { TagEntity } from '../../../src/dal/models/tag';
import { BaseEntityWithoutId, GameEntity, UserEntity } from '../../../src/dal/models';
import { Filter, UUID } from 'mongodb';
import { GameDalService } from '../../../src/dal/services/gameDalService';
import { CreateTagParams, GameRoles } from '@biketag/models';
import { UserDalService } from '../../../src/dal/services/userDalService';
import { TagService } from '../../../src/services/tags/tagService';

const MOCK_USER: UserEntity = { id: '1', name: 'testUser' };

describe('TagService tests', () => {
    describe('create tests', () => {
        let tagDb: Record<string, TagEntity>;
        let mockGame: GameEntity;

        beforeEach(() => {
            mockGame = { id: '1', name: 'testGame', creatorId: '1', players: [{ userId: '2', role: GameRoles.ADMIN }] };
            tagDb = {};
            vitest.spyOn(TagDalService.prototype, 'create').mockImplementation(async (params: TagEntity | BaseEntityWithoutId<TagEntity>): Promise<TagEntity> => {
                const entity = 'id' in params ? params : { ...params, id: new UUID().toString() };
                tagDb[entity.id] = entity;
                return entity;
            });
            vitest.spyOn(TagDalService.prototype, 'update').mockImplementation(async (params: { id: string; updateParams: Partial<TagEntity> }): Promise<TagEntity> => {
                const { id, updateParams } = params;
                const entity = tagDb[id]!;
                Object.assign(entity, updateParams);
                return entity;
            });
            vitest.spyOn(TagDalService.prototype, 'updateMany').mockImplementation(async ({ filter, updateParams }: { filter: Filter<TagEntity>; updateParams: Partial<TagEntity> }): Promise<void> => {
                // we know the filter is going to be a gameId and rootTagId
                const gameId = filter.gameId!;
                const rootTagId = filter.rootTagId!;
                Object.values(tagDb).forEach((tag) => {
                    if (tag.gameId === gameId && tag.rootTagId === rootTagId) {
                        Object.assign(tag, updateParams);
                    }
                });
            });
            vitest.spyOn(TagDalService.prototype, 'getById').mockImplementation(async (params: { id: string }): Promise<TagEntity> => {
                return tagDb[params.id]!;
            });
            vitest.spyOn(TagDalService.prototype, 'getByIdRequired').mockImplementation(async (params: { id: string }): Promise<TagEntity> => {
                return tagDb[params.id]!;
            });
            vitest.spyOn(GameDalService.prototype, 'getByIdRequired').mockResolvedValue(mockGame);
            vitest.spyOn(GameDalService.prototype, 'update').mockImplementation(async (params: { id: string; updateParams: Partial<GameEntity> }): Promise<GameEntity> => {
                Object.assign(mockGame, params.updateParams);
                return mockGame;
            });
            vitest.spyOn(UserDalService.prototype, 'getByIdRequired').mockResolvedValue(MOCK_USER);
        });

        it('should create a new tag in different iterations', async () => {
            const service = new TagService();
            let obj: CreateTagParams = { name: 'Chain 1', creatorId: '1', gameId: '1', contents: 'tag 1A', isRoot: true };
            let tag1a = await service.create(obj);
            expect(tag1a).toHaveProperty('id');
            const { id: tag1aId } = tag1a;
            expect(tag1a).toEqual({
                id: expect.any(String),
                name: 'Chain 1',
                creator: { id: '1', name: 'testUser' },
                gameId: '1',
                parentTag: undefined,
                nextTag: undefined,
                rootTag: undefined,
                isRoot: true,
                previousRootTag: undefined,
                nextRootTag: undefined,
                postedDate: expect.any(String),
                contents: 'tag 1A'
            });

            expect(tagDb[tag1a.id]).toEqual({ ...obj, id: tag1aId, postedDate: tag1a.postedDate }); // test the system
            expect(mockGame.latestRootTagId).toEqual(tag1aId);
            expect(mockGame.firstRootTagId).toEqual(tag1aId);

            obj = { name: 'Chain 1', creatorId: '1', gameId: '1', contents: 'tag 1B', isRoot: false, parentTagId: tag1aId, rootTagId: tag1aId };
            let tag1b = await service.create(obj);
            const { id: tag1bId } = tag1b;
            expect(tag1b).toEqual({
                id: expect.any(String),
                name: 'Chain 1',
                creator: { id: '1', name: 'testUser' },
                gameId: '1',
                parentTag: { id: tag1aId, creatorName: 'testUser', contents: tag1a.contents },
                nextTag: undefined,
                rootTag: { id: tag1aId, creatorName: 'testUser', contents: tag1a.contents },
                isRoot: false,
                previousRootTag: undefined,
                nextRootTag: undefined,
                postedDate: expect.any(String),
                contents: 'tag 1B'
            });

            expect(mockGame.latestRootTagId).toEqual(tag1aId); // unchanged

            tag1a = await service.getRequired({ id: tag1aId });
            expect(tag1a.nextTag).toBeDefined();
            expect(tag1a.nextTag!.id).toEqual(tag1bId);

            obj = { name: 'Chain 1', creatorId: '1', gameId: '1', contents: 'tag 1C', isRoot: false, parentTagId: tag1bId, rootTagId: tag1aId };
            let tag1c = await service.create(obj);
            const { id: tag1cId } = tag1c;
            expect(tag1c).toEqual({
                id: expect.any(String),
                name: 'Chain 1',
                creator: { id: '1', name: 'testUser' },
                gameId: '1',
                parentTag: { id: tag1bId, creatorName: 'testUser', contents: tag1b.contents },
                nextTag: undefined,
                rootTag: { id: tag1aId, creatorName: 'testUser', contents: tag1a.contents },
                isRoot: false,
                previousRootTag: undefined,
                nextRootTag: undefined,
                postedDate: expect.any(String),
                contents: 'tag 1C'
            });

            tag1b = await service.getRequired({ id: tag1bId });
            expect(tag1b.nextTag).toBeDefined();
            expect(tag1b.nextTag!.id).toEqual(tag1cId);

            obj = { name: 'Chain 2', creatorId: '1', gameId: '1', contents: 'tag 2A', isRoot: true };
            let tag2a = await service.create(obj);
            const { id: tag2aId } = tag2a;
            expect(tag2a).toEqual({
                id: expect.any(String),
                name: 'Chain 2',
                creator: { id: '1', name: 'testUser' },
                gameId: '1',
                parentTag: undefined,
                nextTag: undefined,
                rootTag: undefined,
                isRoot: true,
                previousRootTag: { id: tag1aId, creatorName: 'testUser', contents: tag1a.contents },
                nextRootTag: undefined,
                postedDate: expect.any(String),
                contents: 'tag 2A'
            });

            tag1a = await service.getRequired({ id: tag1aId });
            tag1b = await service.getRequired({ id: tag1bId });
            tag1c = await service.getRequired({ id: tag1cId });
            expect(tag1a.nextRootTag!.id).toEqual(tag2aId);
            expect(tag1b.nextRootTag!.id).toEqual(tag2aId);
            expect(tag1c.nextRootTag!.id).toEqual(tag2aId);

            obj = { name: 'Chain 2', creatorId: '1', gameId: '1', contents: 'tag 2B', isRoot: false, parentTagId: tag2aId, rootTagId: tag2aId };
            let tag2b = await service.create(obj);
            const { id: _tag2bId } = tag2b;
            expect(tag2b).toEqual({
                id: expect.any(String),
                name: 'Chain 2',
                creator: { id: '1', name: 'testUser' },
                gameId: '1',
                parentTag: { id: tag2aId, creatorName: 'testUser', contents: tag2a.contents },
                nextTag: undefined,
                rootTag: { id: tag2aId, creatorName: 'testUser', contents: tag2a.contents },
                isRoot: false,
                previousRootTag: { id: tag1aId, creatorName: 'testUser', contents: tag1a.contents },
                nextRootTag: undefined,
                postedDate: expect.any(String),
                contents: 'tag 2B'
            });
        });
    });
});
