import dayjs from 'dayjs';

import { CreateTagDto } from '@biketag/models';
import { isSameDate, Logger } from '@biketag/utils';

import { GameEntity } from '../../dal/models';
import { TagEntity } from '../../dal/models/tag';

// Not actually an entity service
export class ScoreService {
    private readonly logger = new Logger({ prefix: '[ScoreService]' });

    public calculateScoreForTag({ tag, rootTag, game }: { tag: TagEntity | CreateTagDto; rootTag?: TagEntity; game: GameEntity }): number {
        this.logger.info(`[calculateScoreForTag]`, { tag, rootTag, game });
        if (tag.isRoot) {
            return 5;
        }
        if (!rootTag) {
            throw new Error('Must provide root tag with non-root tag');
        }

        const postedDate = dayjs(tag.postedDate);
        const sameDate = isSameDate(postedDate, rootTag.postedDate);
        this.logger.info(`[calculateNewTagPoints] is same date: ${sameDate}`);
        return sameDate ? 5 : 1;
    }
}
