import dayjs from 'dayjs';
import React from 'react';

import { isImageTag, MinimalTag as MinimalTagType, PendingTag as PendingTagType, TagDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { TIME_FORMAT } from '../../utils/consts';

import '../../styles/tag.css';

import { convertDateToRelativeDate } from '../../utils/utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = new Logger({});

interface TagProps {
    tag: TagDto | MinimalTagType | PendingTagType;
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

    if (isImageTag(tag)) {
        // const points = undefined;
        // const tagWinner = undefined;

        // if (isFullTag(tag) && !isMinimized) {
        //     // points = (
        //     //     <span className="tag-points">
        //     //         {tag.stats.points} point{tag.stats.points === 1 ? '' : 's'}
        //     //     </span>
        //     // );
        //     // tagWinner = tag.isRoot && tag.nextTag ? `Won by ${tag.nextTag.creator.name}` : <i>Nobody!</i>;
        // }

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
                {/* <div className="tag-details">
                    <span>
                        by <span className={`tag-creator`}>{tag.creator.name}</span>
                    </span>
                    {points}
                    <span>{dayjs(tag.postedDate).format(DATE_FORMAT)}</span>
                    {tagWinner}
                </div> */}
            </div>
        );
    }

    return (
        <div className={`tag ${className}`} onClick={selectTag}>
            <div className="tag-details">
                The next tag posted by <span className="tag-creator">{tag.creator.name}</span> will go live at midnight!
            </div>
        </div>
    );
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
