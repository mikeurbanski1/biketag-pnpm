// import { Logger } from '@biketag/utils';
import { MongoDbProvider } from './providers/mongoProvider';

// const logger = new Logger({ prefix: '[PersistenceService]' });

export const initializePersistence = async () => {
    const provider = await MongoDbProvider.getInstance();

    provider.getCollection('users');
    provider.getCollection('games');
};
