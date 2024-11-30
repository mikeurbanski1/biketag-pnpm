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
    selectTag: () => void;
}

export const TagDetails: React.FC<TagProps> = ({ tag, isSubtag }) => {
    const className = isSubtag ? 'subtag' : 'main-tag';
    const tagWinner = isSubtag || !tag.nextTag ? undefined : <span>Winner: {tag.nextTag.creator.name}</span>;
    return (
        <div className={className}>
            {!isSubtag && <span className={`tag-title`}>{tag.name}</span>}
            <span className={`tag-contents`}>{tag.contents}</span>
            <span>
                by <span className={`tag-creator`}>{tag.creator.name}</span>
            </span>
            <span className="tag-points">
                {tag.points} point{tag.points === 1 ? '' : 's'}
            </span>
            <span>{dayjs(tag.postedDate).format(DATE_FORMAT)}</span>
            {tagWinner}
        </div>
    );
};

export const MinimalTag: React.FC<MinimalTagProps> = ({ tag, isSubtag, selectTag }) => {
    logger.info(`[MinimalTag]`, { tag });
    return (
        <div className="minimal-tag flex-spread" onClick={selectTag}>
            <span className={isSubtag ? 'subtag-title' : 'tag-title'}>{isSubtag ? tag.contents : tag.name}</span>
            <span>
                by <span className="tag-creator">{tag.creator.name}</span>
            </span>
            <span>{dayjs(tag.postedDate).format(DATE_FORMAT)}</span>
        </div>
    );
};
