import { Collection, Db, MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { Logger } from '@biketag/utils';
import { Entity } from '../models';

const logger = new Logger({ prefix: '[MongoDbProvider]' });

dotenv.config();

export const collectionNames = ['users', 'games'] as const;
export type CollectionName = (typeof collectionNames)[number];

export class MongoDbProvider {
    private static instance: MongoDbProvider;
    private db: Db;

    constructor({ db }: { db: Db }) {
        this.db = db;
    }

    public getCollection<E extends Entity>(collectionName: CollectionName): Collection<E> {
        return this.db.collection(collectionName);
    }

    public static async getInstance(): Promise<MongoDbProvider> {
        if (!MongoDbProvider.instance) {
            logger.info('[getInstance] initializing Mongo connection');
            const client: MongoClient = new MongoClient(process.env.DB_CONN_STRING!);
            await client.connect();
            const db: Db = client.db(process.env.DB_NAME);
            logger.info('[getInstance] Successfully connected to database');
            MongoDbProvider.instance = new MongoDbProvider({ db });
        }
        return MongoDbProvider.instance;
    }
}
