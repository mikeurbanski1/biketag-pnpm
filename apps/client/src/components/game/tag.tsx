import dayjs from 'dayjs';
import React from 'react';

import { isFullTag, PendingTag as PendingTagType, TagDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { TIME_FORMAT } from '../../utils/consts';

import '../../styles/tag.css';

import { convertDateToRelativeDate } from '../../utils/utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = new Logger({});

interface TagProps {
    tag: TagDto | PendingTagType;
    isActive?: boolean;
    selectTag?: () => void;
    isMinimized?: boolean;
}

// interface MinimalTagProps {
//     tag: MinimalTagType;
//     isSubtag: boolean;
//     selectTag: () => void;
// }

// interface PendingTagProps {
//     tag: PendingTagType;
//     isActive?: boolean;
//     selectTag?: () => void;
// }

export const Tag: React.FC<TagProps> = ({ tag, isActive = true, selectTag }) => {
    const classes = ['tag'];
    if (!isActive) {
        classes.push('clickable-tag');
    }

    const className = classes.join(' ');

    if (isFullTag(tag)) {
        const relativeDate = convertDateToRelativeDate(dayjs(tag.postedDate));
        const timeFormat = dayjs(tag.postedDate).format(TIME_FORMAT);

        const footer = (
            <div className="tag-footer">
                <div>{tag.creator.name}</div>
                <div>
                    {relativeDate} — {timeFormat}
                </div>
                {/* <div>{tagWinner}</div> */}
            </div>
        );

        return (
            <div className={className} onClick={selectTag}>
                <div className="tag-image-container">
                    <img className="tag-image" src={tag.imageUrl}></img>
                </div>
                {footer}
            </div>
        );
    } else {
        // pending tag
        return (
            <div className={`tag ${className}`} onClick={selectTag}>
                <div className="tag-details">
                    The next tag posted by <span className="tag-creator">{tag.creator.name}</span> will go live at midnight!
                </div>
            </div>
        );
    }
};

// export const MinimalTag: React.FC<MinimalTagProps> = ({ tag, selectTag }) => {
//     return (
//         <div className="tag clickable-tag" onClick={selectTag}>
//             <img className="tag-image image-hover-highlight" src={tag.imageUrl}></img>
//             <div className="tag-details">
//                 <span>
//                     by <span className="tag-creator">{tag.creator.name}</span>
//                 </span>
//                 <span>{dayjs(tag.postedDate).format(DATE_FORMAT)}</span>
//             </div>
//         </div>
//     );
// };

// export const PendingTag: React.FC<PendingTagProps> = ({ tag, selectTag, isActive }) => {
//     const className = isActive ? '' : 'clickable-tag';
//     return (
//         <div className={`tag ${className}`} onClick={selectTag}>
//             <div className="tag-details">
//                 The next tag posted by <span className="tag-creator">{tag.creator.name}</span> will go live at midnight!
//             </div>
//         </div>
//     );
// };
