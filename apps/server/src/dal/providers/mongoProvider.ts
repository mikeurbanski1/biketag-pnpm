import * as dotenv from 'dotenv';
import { Collection, Db, Document, MongoClient } from 'mongodb';

import { Logger } from '@biketag/utils';

const logger = new Logger({ prefix: '[MongoDbProvider]' });

dotenv.config();

export const collectionNames = ['users', 'games', 'tags'] as const;
export type CollectionName = (typeof collectionNames)[number];

export class MongoDbProvider {
    private static instance: MongoDbProvider;
    private client: MongoClient;
    private db: Db;

    constructor({ db, client }: { db: Db; client: MongoClient }) {
        this.db = db;
        this.client = client;
    }

    public getCollection<E extends Document>(collectionName: CollectionName): Collection<E> {
        logger.info(`[getCollection]`);
        return this.db.collection(collectionName);
    }

    public async close() {
        await this.client.close();
    }

    public static async getInstance(): Promise<MongoDbProvider> {
        if (!MongoDbProvider.instance) {
            logger.info('[getInstance] initializing Mongo connection');
            const client = new MongoClient(process.env.DB_CONN_STRING!);
            const db: Db = client.db(process.env.DB_NAME);
            logger.info('[getInstance] Successfully connected to database');
            MongoDbProvider.instance = new MongoDbProvider({ db, client });
        }
        return MongoDbProvider.instance;
    }
}
