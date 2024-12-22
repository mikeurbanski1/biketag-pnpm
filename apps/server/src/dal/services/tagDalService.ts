import { TagEntity } from '@biketag/models';

import { tagServiceErrors } from '../../common/errors';
import { BaseDalService } from './baseDalService';

export class TagDalService extends BaseDalService<TagEntity> {
    constructor() {
        super({ prefix: 'TagDalService', collectionName: 'tags', serviceErrors: tagServiceErrors });
    }
}
