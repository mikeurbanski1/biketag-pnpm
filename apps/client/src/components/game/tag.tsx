import { MinimalTag as MinimalTagType, TagDto } from '@biketag/models';
import React from 'react';

import { Logger } from '@biketag/utils';

const logger = new Logger({});

interface TagProps {
    tag: TagDto;
}
interface MinimalTagProps {
    tag: MinimalTagType;
}

export const TagDetails: React.FC<TagProps> = ({ tag }) => {
    return (
        <div>
            <h2>{tag.name}</h2>
            <p>
                <strong>{tag.contents}</strong>
            </p>
            <p>
                by <strong>{tag.creator.name}</strong>
            </p>
            <p>{new Date(tag.postedDate).toLocaleDateString()}</p>
        </div>
    );
};

export const MinimalTag: React.FC<MinimalTagProps> = ({ tag }) => {
    logger.info(`[MinimalTag]`, { tag });
    return (
        <div>
            <p>
                <strong>{tag.name}</strong>
            </p>
            <p>by {tag.creatorName}</p>
            <p>{new Date(tag.postedDate).toLocaleDateString()}</p>
        </div>
    );
};
