import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

import { isFullTag, PendingTag, TagDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { TIME_FORMAT } from '../../utils/consts';

import '../../styles/tag.css';

import { ApiManager } from '../../api';
import { convertDateToRelativeDate } from '../../utils/utils';

const logger = new Logger({});

// export interface AddTagProps {
//     saveTag: ({ imageUrl }: { imageUrl: string }) => void;
//     isSubtag: boolean;
//     isFirstTag: boolean;
//     dateOverride: Dayjs;
//     previousRootTagDate?: Dayjs;
// }

// type AddTagTypes = 'addRootTag' | 'addSubtag';
type TagType = TagDto | PendingTag;
type TagTypeWithId = TagType | string;

interface TagProps {
    tag: TagTypeWithId; // string is a tagId
    isActive: boolean;
    selectTag?: (tag: TagType) => void;
    isMinimized?: boolean;
}

interface LoadingTagDefinedProps {
    tag: string;
}

// interface AddTagDefinedProps {
//     tag: AddTagTypes;
//     addTagProps: AddTagProps;
//     selectTag: (tag: TagType) => void;
// }

interface RealActiveTagDefinedProps {
    tag: TagDto | PendingTag;
}

interface RealInactiveTagDefinedProps extends RealActiveTagDefinedProps {
    selectTag: (tag: TagType) => void;
}

// interface LoadingAndTagType {
//     loading: boolean;
//     tag?: TagType;
// }

const isTagToLoad = (props: TagProps): props is TagProps & LoadingTagDefinedProps => typeof props.tag === 'string';
// const isAddTag = (tag?: TagTypeWithId): tag is AddTagProps => typeof tag === 'object' && !('tagId' in tag);
const isLoadedTag = (tag?: TagTypeWithId): tag is TagDto | PendingTag => typeof tag === 'object';
const isInactiveTag = (props: TagProps): props is TagProps & RealInactiveTagDefinedProps => !props.isActive;

export const Tag: React.FC<TagProps> = (props: TagProps): React.ReactNode => {
    logger.info(`[Tag] public public render()`, { props });
    // we are only displaying loading if we know we are getting a tag
    // if isLoading is true, tagToRender will be undefined, and vice versa
    // if we have a tag ID, we can also skip loading if we have the cached tag
    const tagToUse = isLoadedTag(props.tag) ? props.tag : ApiManager.tagApi.getTagFromCache({ id: props.tag as string });
    const [isLoading, setIsLoading] = useState<boolean>(!tagToUse && isTagToLoad(props));
    const [tagToRender, setTagToRender] = useState<TagTypeWithId | undefined>(tagToUse);

    useEffect(() => {
        if (isLoading) {
            ApiManager.tagApi.getTag({ id: props.tag as string }).then((tag) => {
                setIsLoading(false);
                setTagToRender(tag);
            });
        }
    });

    if (isLoading) {
        return <div className="tag loading">Loading...</div>;
        // } else if (isAddTag(tagToRender)) {
        //     if (!props.selectTag) {
        //         throw new Error('selectTag is required when isActive is false');
        //     }
        //     return <AddTag {...tagToRender} isActive={props.isActive} setAddTagAsActive={() => props.selectTag!(tagToRender)} />;
    } else if (isLoadedTag(tagToRender)) {
        const classes: string[] = ['tag'];
        let onClick: (() => void) | undefined = undefined;

        if (isInactiveTag(props)) {
            onClick = () => props.selectTag(tagToRender);
            classes.push('clickable-tag');
        }

        const className = classes.join(' ');

        if (isFullTag(tagToRender)) {
            const relativeDate = convertDateToRelativeDate(dayjs(tagToRender.postedDate));
            const timeFormat = dayjs(tagToRender.postedDate).format(TIME_FORMAT);

            const footer = (
                <div className="tag-footer">
                    <div>{tagToRender.creator.name}</div>
                    <div>
                        {relativeDate} — {timeFormat}
                    </div>
                    {/* <div>{tagWinner}</div> */}
                </div>
            );

            return (
                <div className={className} onClick={onClick}>
                    <div className="tag-image-container">
                        <img className="tag-image" src={tagToRender.imageUrl}></img>
                    </div>
                    {footer}
                </div>
            );
        } else {
            // pending tag
            return (
                <div className={`tag ${className}`} onClick={onClick}>
                    <div className="tag-details">
                        The next tag posted by <span className="tag-creator">{tagToRender.creator.name}</span> will go live at midnight!
                    </div>
                </div>
            );
        }
    }
};
