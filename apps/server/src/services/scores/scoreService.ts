import dayjs from 'dayjs';

import { CreateTagDto, GameEntity, TagEntity, TagStats } from '@biketag/models';
import { isSameDate, Logger } from '@biketag/utils';

// Not actually an entity service
export class ScoreService {
    private readonly logger = new Logger({ prefix: '[ScoreService]' });

    public calculateStatsForTag({ tag, rootTag, game }: { tag: TagEntity | CreateTagDto; rootTag?: TagEntity; game: GameEntity }): TagStats {
        this.logger.info(`[calculateScoreForTag]`, { tag, rootTag, game });
        if (tag.isRoot) {
            return {
                points: 5,
                newTag: true,
                postedOnTime: true,
                wonTag: false,
            };
        }
        if (!rootTag) {
            throw new Error('Must provide root tag with non-root tag');
        }

        const postedDate = dayjs(tag.postedDate);
        const sameDate = isSameDate(postedDate, rootTag.postedDate);
        this.logger.info(`[calculateNewTagPoints] is same date: ${sameDate}`);
        return {
            points: sameDate ? 5 : 1,
            newTag: false,
            postedOnTime: sameDate,
            wonTag: rootTag.nextTagId === undefined,
        };
    }
}
