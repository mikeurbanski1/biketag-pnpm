import { tagServiceErrors } from '../../common/errors';
import { TagEntity } from '../models/tag';
import { BaseDalService } from './baseDalService';

export class TagDalService extends BaseDalService<TagEntity> {
    constructor() {
        super({ prefix: 'TagDalService', collectionName: 'tags', serviceErrors: tagServiceErrors });
    }
}
