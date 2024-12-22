import { Dayjs } from 'dayjs';

import { GameDto, PendingTag, TagDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { AddTag } from '../tag/addTag';
import { Tag } from '../tag/tag';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = new Logger({});

interface TagViewProps {
    game: GameDto;
    dateOverride: Dayjs;
    currentRootTag?: TagDto;
    currentTag?: TagDto;
    userCanAddRootTag: boolean;
    userCanAddSubtag: boolean;
    showingAddRootTag: boolean;
    showingAddSubtag: boolean;
    showingPendingTag: boolean;
    createNewTag: ({ imageUrl, isSubtag }: { imageUrl: string; isSubtag: boolean }) => void;
    setAddTagAsActive: (isSubtag: boolean) => void;
    selectTag: (tag: TagDto | PendingTag) => void;
}

const getTagComponent = ({ tag, isActive, selectTag }: { tag: TagDto | PendingTag | string; isActive: boolean; selectTag: (tag: TagDto | PendingTag) => void }): React.ReactNode => {
    let tagKey: string;
    if (!tag) {
        tagKey = 'undefined';
    } else if (typeof tag === 'object') {
        tagKey = `tag-${tag.id}`;
    } else {
        tagKey = `id-${tag}`;
    }

    let selectThisTag: ((tag: TagDto | PendingTag) => void) | undefined;

    // if the tag is a real, not pending tag, then the callback actually selects it
    if (!isActive) {
        selectThisTag = (tag: TagDto | PendingTag) => selectTag(tag);
    }
    return <Tag key={tagKey} tag={tag} isActive={isActive} selectTag={selectThisTag} />;
};

export const GameTagView: React.FC<TagViewProps> = ({
    game,
    dateOverride,
    currentRootTag,
    currentTag,
    userCanAddRootTag,
    userCanAddSubtag,
    showingAddRootTag,
    showingAddSubtag,
    showingPendingTag,
    createNewTag,
    setAddTagAsActive,
    selectTag,
}: TagViewProps): React.ReactNode => {
    let centerTagElement: React.ReactNode | undefined = undefined;
    let leftTagElement: React.ReactNode | undefined = undefined;
    let rightTagElement: React.ReactNode | undefined = undefined;
    let topTagElement: React.ReactNode | undefined = undefined;
    let bottomTagElement: React.ReactNode | undefined = undefined;

    const addRootTag = (
        <AddTag
            key="add-root-tag"
            saveTag={({ imageUrl: string }) => createNewTag({ imageUrl: string, isSubtag: false })}
            setAddTagAsActive={() => setAddTagAsActive(false)}
            isSubtag={false}
            dateOverride={dateOverride}
            isActive={showingAddRootTag}
            isFirstTag={!game.latestRootTag}
        />
    );

    const addSubtag = (
        <AddTag
            key="add-subtag"
            saveTag={({ imageUrl: string }) => createNewTag({ imageUrl: string, isSubtag: true })}
            setAddTagAsActive={() => setAddTagAsActive(true)}
            isSubtag={true}
            dateOverride={dateOverride}
            isActive={showingAddSubtag}
            isFirstTag={!currentRootTag?.nextTagId}
        />
    );

    if (showingAddRootTag) {
        centerTagElement = addRootTag;
        if (currentTag) {
            leftTagElement = getTagComponent({ tag: currentTag, isActive: false, selectTag });
        }
    } else if (showingAddSubtag) {
        centerTagElement = addSubtag;
        if (currentTag) {
            topTagElement = getTagComponent({ tag: currentTag, isActive: false, selectTag });
        }
    } else if (showingPendingTag) {
        centerTagElement = getTagComponent({ tag: game.pendingRootTag!, isActive: true, selectTag });
        if (currentTag) {
            leftTagElement = getTagComponent({ tag: currentTag, isActive: false, selectTag });
        }
    } else if (currentTag) {
        // showing an actual tag - this will always be true, but we have a type assertion now
        centerTagElement = getTagComponent({ tag: currentTag, isActive: true, selectTag });
        if (currentTag.isRoot) {
            if (currentTag.previousRootTagId) {
                leftTagElement = getTagComponent({ tag: currentTag.previousRootTagId, isActive: false, selectTag });
            }
            if (currentTag.id === game.latestRootTag!.id) {
                if (game.pendingRootTag) {
                    rightTagElement = getTagComponent({ tag: game.pendingRootTag, isActive: false, selectTag });
                } else if (userCanAddRootTag) {
                    rightTagElement = addRootTag;
                }
            } else if (currentTag.nextRootTagId) {
                rightTagElement = getTagComponent({ tag: currentTag.nextRootTagId, isActive: false, selectTag });
            }
            if (currentTag.nextTagId) {
                bottomTagElement = getTagComponent({ tag: currentTag.nextTagId, isActive: false, selectTag });
            } else if (userCanAddSubtag) {
                bottomTagElement = addSubtag;
            }
        } else {
            if (currentTag.parentTagId) {
                topTagElement = getTagComponent({ tag: currentTag.parentTagId, isActive: false, selectTag });
            }
            if (currentTag.nextTagId) {
                bottomTagElement = getTagComponent({ tag: currentTag.nextTagId, isActive: false, selectTag });
            } else if (userCanAddSubtag) {
                bottomTagElement = addSubtag;
            }
        }
    }

    return (
        <div className="tag-scroller">
            <div className="top-tag">{topTagElement}</div>
            <div className="left-tag">{leftTagElement}</div>
            <div className="center-tag">{centerTagElement}</div>
            <div className="right-tag">{rightTagElement}</div>
            <div className="bottom-tag">{bottomTagElement}</div>
        </div>
    );
};
