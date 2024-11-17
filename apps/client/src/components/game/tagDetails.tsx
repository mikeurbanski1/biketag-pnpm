import { MinimalTag as MinimalTagType, TagDto } from '@biketag/models';
import { Logger } from '@biketag/utils';
import React from 'react';
import dayjs from 'dayjs';
import { DATE_FORMAT } from '../../utils/consts';

const logger = new Logger({});

interface TagProps {
    tag: TagDto;
    isSubtag: boolean;
}
interface MinimalTagProps {
    tag: MinimalTagType;
    isSubtag: boolean;
}

export const TagDetails: React.FC<TagProps> = ({ tag, isSubtag }) => {
    const prefix = isSubtag ? 'sub' : 'main';
    return (
        <div className={`${prefix}-tag`}>
            {!isSubtag && <span className={`tag-title`}>{tag.name}</span>}
            <span className={`tag-contents`}>{tag.contents}</span>
            <span>
                by <span className={`tag-creator`}>{tag.creator.name}</span>
            </span>
            <span>{dayjs(tag.postedDate).format(DATE_FORMAT)}</span>
        </div>
    );
};

export const MinimalTag: React.FC<MinimalTagProps> = ({ tag, isSubtag }) => {
    logger.info(`[MinimalTag]`, { tag });
    return (
        <div className="minimal-tag">
            {!isSubtag && <span className="tag-title">{tag.name}</span>}
            <span>
                by <span className="tag-creator">{tag.creatorName}</span>
            </span>
            <span>{dayjs(tag.postedDate).format(DATE_FORMAT)}</span>
        </div>
    );
};
