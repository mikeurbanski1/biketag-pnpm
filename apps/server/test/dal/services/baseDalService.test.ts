import { Collection, Db, MongoClient, ObjectId } from 'mongodb';
import { Mock, vitest, describe, it, beforeAll, beforeEach, afterAll, afterEach, expect, vi } from 'vitest';
import { ServiceErrors } from '../../../src/common/errors';
import { BaseEntity } from '../../../src/dal/models';
import { MongoDbProvider } from '../../../src/dal/providers/mongoProvider';
import { BaseDalService } from '../../../src/dal/services/baseDalService';
import { MockDalService } from '../../testUtils/mockTypes';

describe('baseDalService tests', () => {
    let getInstanceSpy: Mock;
    let instance: MockDalService;
    let mongoDbProvider;
    let collection = {} as Collection;

    beforeAll(() => {
        // vitest.spyOn(MongoDbProvider, 'getInstance').mockResolvedValue(mongoDbProvider);
        mongoDbProvider = new MongoDbProvider({ db: {} as Db, client: {} as MongoClient });
        getInstanceSpy = vitest.fn().mockResolvedValue(mongoDbProvider);
        MongoDbProvider.getInstance = getInstanceSpy;
        vitest.spyOn(MongoDbProvider.prototype, 'getCollection').mockResolvedValue(collection);
    });

    beforeEach(() => {
        instance = new MockDalService();
    });

    describe('create tests', async () => {
        it('should create a new entity', async () => {
            collection.insertOne = vitest.fn().mockResolvedValue({ insertedId: '1' });
            const obj = { name: 'test', phone: '1234' };
            const res = await instance.create(obj);
            expect(res).toHaveProperty('id');
            const { id, ...rest } = res;
            expect(rest).toEqual(obj);
        });
    });

    describe('getById tests', async () => {
        beforeEach(() => {
            collection.findOne = vitest.fn().mockResolvedValue({ _id: '1', name: 'test', phone: '1234' });
        });

        it('should get an entity by ID', async () => {
            const objectId = new ObjectId();
            const objectIdStr = objectId.toString();
            collection.findOne = vitest.fn().mockResolvedValue({ _id: objectId, name: 'test', phone: '1234' });
            const obj = { name: 'test', phone: '1234' };
            let res = (await instance.getById({ id: objectIdStr }))!;
            expect(res).toBeDefined();
            expect(res.id).toEqual(objectIdStr);
            const { id, ...rest } = res;
            expect(rest).toEqual(obj);
            expect(collection.findOne).toHaveBeenCalledWith({ _id: objectId });
        });

        it('should return null if the object ID is not valid', async () => {
            collection.findOne = vitest.fn();
            let res = (await instance.getById({ id: '1' }))!;
            expect(res).toBeNull();
            expect(collection.findOne).toHaveBeenCalledTimes(0);
        });

        it('should return null if the object is not found', async () => {
            collection.findOne = vitest.fn().mockResolvedValue(null);
            let res = (await instance.getById({ id: '1' }))!;
            expect(res).toBeNull();
            expect(collection.findOne).toHaveBeenCalledTimes(0);
        });
    });

    describe('getByIdRequired tests', async () => {
        beforeEach(() => {
            collection.findOne = vitest.fn().mockResolvedValue({ _id: '1', name: 'test', phone: '1234' });
        });

        it('should get a required entity by ID', async () => {
            const objectId = new ObjectId();
            const objectIdStr = objectId.toString();
            collection.findOne = vitest.fn().mockResolvedValue({ _id: objectId, name: 'test', phone: '1234' });
            const obj = { name: 'test', phone: '1234' };
            let res = (await instance.getByIdRequired({ id: objectIdStr }))!;
            expect(res).toBeDefined();
            expect(res.id).toEqual(objectIdStr);
            const { id, ...rest } = res;
            expect(rest).toEqual(obj);
        });

        it('should throw an error if the object is not found', async () => {
            const id = new ObjectId().toString();
            collection.findOne = vitest.fn().mockResolvedValue(null);
            await expect(instance.getByIdRequired({ id })).rejects.toThrow(`Object with ID ${id} does not exist`);
            expect(collection.findOne).toHaveBeenCalledTimes(1);
        });
    });

    describe('update tests', async () => {
        it('should update an entity', async () => {
            const obj = { name: 'test', phone: '5678' };
            const id = new ObjectId().toString();

            collection.findOne = vitest.fn().mockResolvedValueOnce({ _id: id, name: 'test', phone: '1234' }).mockResolvedValueOnce({ _id: id, name: 'test', phone: '5678' });
            collection.updateOne = vitest.fn();
            expect(await instance.update({ id, updateParams: obj })).toEqual({ id, ...obj });
            expect(collection.updateOne).toHaveBeenCalledWith({ _id: new ObjectId(id) }, { $set: obj });
        });
    });
});
