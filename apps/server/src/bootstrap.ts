import { Logger } from '@biketag/utils';
import { bootstrapData } from './dal/persistenceService';

const logger = new Logger({ prefix: '[Bootstrap]' });

bootstrapData().then(() => {
    logger.info('Finished bootstrapping new data');
});
