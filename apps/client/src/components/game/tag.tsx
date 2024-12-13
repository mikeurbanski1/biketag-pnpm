import dayjs from 'dayjs';
import React from 'react';

import { MinimalTag as MinimalTagType, PendingTag as PendingTagType, TagDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { DATE_FORMAT } from '../../utils/consts';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

interface PendingTagProps {
    tag: PendingTagType;
    isActive?: boolean;
    selectTag?: () => void;
}

export const Tag: React.FC<TagProps> = ({ tag, isSubtag }) => {
    const className = isSubtag ? 'subtag' : 'main-tag';
    const tagWinner = isSubtag || !tag.nextTag ? undefined : <span>Winner: {tag.nextTag.creator.name}</span>;
    return (
        <div className={className}>
            <img className="tag-image" src={tag.imageUrl}></img>
            <span>
                by <span className={`tag-creator`}>{tag.creator.name}</span>
            </span>
            <span className="tag-points">
                {tag.stats.points} point{tag.stats.points === 1 ? '' : 's'}
            </span>
            <span>{dayjs(tag.postedDate).format(DATE_FORMAT)}</span>
            {tagWinner}
        </div>
    );
};

export const MinimalTag: React.FC<MinimalTagProps> = ({ tag, selectTag, isSubtag }) => {
    return (
        <div className={`minimal-tag flex-spread ${isSubtag ? 'subtag' : 'root-tag'}`} onClick={selectTag}>
            <img className="tag-image" src={tag.imageUrl}></img>
            <span>
                by <span className="tag-creator">{tag.creator.name}</span>
            </span>
            <span>{dayjs(tag.postedDate).format(DATE_FORMAT)}</span>
        </div>
    );
};

export const PendingTag: React.FC<PendingTagProps> = ({ tag, selectTag, isActive }) => {
    const className = isActive ? 'main-tag' : 'minimal-tag flex-spread root-tag';
    return (
        <div className={className} onClick={selectTag}>
            The next tag posted by <span className="tag-creator">{tag.creator.name}</span> will go live at midnight!
        </div>
    );
};
