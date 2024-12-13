import dayjs, { Dayjs } from 'dayjs';
import React from 'react';

import { CreateTagDto, GameDto, MinimalTag as MinimalTagType, PendingTag as PendingTagType, TagDto, UserDto } from '@biketag/models';
import { isEarlierDate, Logger } from '@biketag/utils';

import { ApiManager } from '../../api';
import { AddTag } from './addTag';
import { MinimalTag, PendingTag, Tag } from './tag';

const logger = new Logger({ prefix: '[TagScroller]' });

interface TagScrollerState {
    loadingTag: boolean;
    currentTag?: TagDto;
    userCanAddTag: boolean;
    fakeTagIsActive: boolean;
}

interface TagScrollerProps {
    game: GameDto;
    user: UserDto;
    subtagRootTag?: TagDto;
    isSubtag: boolean;
    refreshScores: () => void;
    // general handler for notifying the parent component that a new tag was created, so it can refresh anything it needs to
    createNewTag: (tag: TagDto) => void;
    // setCurrentRootTag?: (tag: TagDto) => void;
    dateOverride: Dayjs;
}

export class TagScroller extends React.Component<TagScrollerProps, TagScrollerState> {
    constructor(props: TagScrollerProps) {
        super(props);
        logger.info(`[constructor]`, { props });

        let userCanAddTag;
        if (props.isSubtag) {
            if (!props.subtagRootTag) {
                throw new Error('Subtag view must have a root tag');
            }
            // if the root tag was not created by us and has no children, we can add a tag
            // otherwise, we do not know, so set to false for now
            userCanAddTag = !props.subtagRootTag.nextTag && props.subtagRootTag.creator.id !== props.user.id;
        } else {
            // if (!props.setCurrentRootTag) {
            //     throw new Error('Root tag view must have a setCurrentRootTag function');
            // }
            // if the game has no tags, we can add a tag
            // otherwise, we do not know, so set to false for now
            userCanAddTag = props.game.latestRootTag === undefined;
        }

        // we have to load the next tag if we are a subtag
        const currentTag = props.isSubtag ? undefined : this.props.game.latestRootTag;
        logger.info(`[constructor]`, { currentTag: currentTag ?? 'undefined' });

        this.state = {
            loadingTag: props.isSubtag,
            currentTag,
            userCanAddTag,
            fakeTagIsActive: false,
        };
    }

    componentDidMount(): void {
        this.fetchAndSetCanUserAddTag();
        if (this.props.isSubtag) {
            this.setTagById(this.props.subtagRootTag!.nextTag?.id);
        } else {
            this.setState({ loadingTag: false });
        }
    }

    fetchAndSetCanUserAddTag(): void {
        if (this.props.isSubtag) {
            const tagId = this.props.subtagRootTag!.id;
            ApiManager.tagApi.canUserAddSubtag({ tagId, userId: this.props.user.id }).then((userCanAddTag) => {
                logger.info(`[fetchAndSetCanUserAddTag] result`, { userCanAddTag });
                this.setState({ userCanAddTag });
            });
        } else {
            ApiManager.tagApi.canUserAddTag({ userId: this.props.user.id, gameId: this.props.game.id, dateOverride: this.props.dateOverride }).then((userCanAddTag) => {
                this.setState({ userCanAddTag });
            });
        }
    }

    setTagById(id?: string): void {
        if (!id) {
            this.setState({ currentTag: undefined, loadingTag: false, userCanAddTag: true });
        } else if (id !== this.state.currentTag?.id) {
            ApiManager.tagApi.getTag({ id }).then((tag) => {
                this.setTag({ tag });
            });
        } else {
            this.setState({ fakeTagIsActive: false });
        }
    }

    setTag({ tag, userCanAddTagOverride }: { tag?: TagDto; userCanAddTagOverride?: boolean }): void {
        if (tag && tag.id === this.state.currentTag?.id) {
            this.setState({ fakeTagIsActive: false });
        } else {
            const userCanAddTagUpdate = userCanAddTagOverride !== undefined ? { userCanAddTag: userCanAddTagOverride } : ({} as TagScrollerState);
            this.setState({ currentTag: tag, loadingTag: false, ...userCanAddTagUpdate, fakeTagIsActive: false });
        }
    }

    getMinimalTag(tag?: PendingTagType): React.ReactNode;
    getMinimalTag(tag?: MinimalTagType): React.ReactNode;
    getMinimalTag(tag?: MinimalTagType | PendingTagType): React.ReactNode {
        if (!tag) {
            return undefined;
        } else if ('isPendingTagView' in tag) {
            return <PendingTag tag={tag} selectTag={() => this.setState({ fakeTagIsActive: true })} />;
        } else {
            return <MinimalTag tag={tag} isSubtag={this.props.isSubtag} selectTag={() => this.setTagById(tag.id)} />;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createNewSubtag(_tag: TagDto): void {
        this.fetchAndSetCanUserAddTag();
    }

    saveNewTag({ imageUrl }: { imageUrl: string }): void {
        logger.info(`[saveNewTag]`, { imageUrl, dateOverride: this.props.dateOverride });
        let tag: CreateTagDto;
        if (this.props.isSubtag) {
            tag = {
                gameId: this.props.game.id,
                isRoot: false,
                rootTagId: this.props.subtagRootTag!.id,
                imageUrl,
                postedDate: this.props.dateOverride.toISOString(),
            };
        } else {
            tag = {
                gameId: this.props.game.id,
                isRoot: true,
                imageUrl,
                postedDate: this.props.dateOverride.toISOString(),
            };
        }
        ApiManager.tagApi.createTag(tag).then((newTag) => {
            this.setTag({ tag: newTag, userCanAddTagOverride: false });
            this.props.createNewTag(newTag);
            this.props.refreshScores();
        });
    }

    setAddTagAsActive(): void {
        this.setState({ fakeTagIsActive: true });
    }

    render() {
        const classType = this.props.isSubtag ? 'subtag' : 'root-tag';
        const className = `${classType}-scroller`;

        logger.info(`[render]`, { isSubtag: this.props.isSubtag, state: this.state, props: this.props });

        if (this.state.loadingTag) {
            return <div className={className}>Loading...</div>;
        }

        const previousRootTagDate = !this.props.isSubtag && this.props.game.latestRootTag?.postedDate ? dayjs(this.props.game.latestRootTag?.postedDate) : undefined;

        // dev mode code - handle re-rendering when changing the date override - only applies to new root tags
        const userCanAddTagWithDateOverride = this.props.isSubtag || !this.props.game.latestRootTag ? true : !isEarlierDate(this.props.dateOverride, this.props.game.latestRootTag.postedDate);
        // so we can actually add a tag only if the date override is true
        const canAddTagDateOverride = this.state.userCanAddTag && userCanAddTagWithDateOverride;

        // const canAddTag = canAddTagDateOverride && (this.props.isSubtag || (!this.props.isSubtag && this.props.game.latestRootTag?.id === this.state.currentTag?.id));

        const addTagPanel =
            canAddTagDateOverride && (this.props.isSubtag || (!this.props.isSubtag && this.props.game.latestRootTag?.id === this.state.currentTag?.id)) ? (
                <AddTag
                    isSubtag={this.props.isSubtag}
                    saveTag={({ imageUrl }) => {
                        this.saveNewTag({ imageUrl });
                    }}
                    previousRootTagDate={previousRootTagDate}
                    dateOverride={this.props.dateOverride}
                    setAddTagAsActive={() => this.setAddTagAsActive()}
                    isActive={this.state.fakeTagIsActive}
                />
            ) : undefined;
        logger.info(`[render]`, { addTagPanel: addTagPanel ? 'true' : 'false' });

        // start with the simple case of no tag to display
        if (!this.state.currentTag) {
            return (
                <div className={className}>
                    <div>{this.props.isSubtag ? 'Nobody else has been here yet!' : 'Nobody has gone anywhere!'}</div>
                    {addTagPanel}
                </div>
            );
        }

        // this will be the next tag, or undefined if there is no next tag
        // for a root tag, it means we will not render this and the button together (one will be undefined)
        let nextTagPanel: React.ReactNode = undefined;

        if (!this.state.fakeTagIsActive) {
            if (this.props.isSubtag && this.state.currentTag.nextTag) {
                nextTagPanel = this.getMinimalTag(this.state.currentTag.nextTag);
            } else if (!this.props.isSubtag && this.props.game.pendingRootTag) {
                nextTagPanel = this.getMinimalTag(this.props.game.pendingRootTag);
            } else if (!this.props.isSubtag && this.state.currentTag.nextRootTag) {
                nextTagPanel = this.getMinimalTag(this.state.currentTag.nextRootTag);
            }
        }

        let previousTag: MinimalTagType | undefined;
        if (this.props.isSubtag) {
            // if the previous tag of the subtag is the root tag, then we do not want to show it
            logger.info(`[render] this.state.currentTag.parentTag?.id ${this.state.currentTag.parentTag?.id}`);
            logger.info(`[render] this.props.subtagRootTag!.id ${this.props.subtagRootTag!.id}`);
            previousTag = this.state.currentTag.parentTag?.id !== this.props.subtagRootTag!.id ? this.state.currentTag.parentTag : undefined;
        } else if (!this.state.fakeTagIsActive) {
            previousTag = this.state.currentTag.previousRootTag;
        } else {
            previousTag = this.state.currentTag;
        }

        let innerDiv: React.ReactNode;
        if (this.props.isSubtag) {
            innerDiv = <Tag tag={this.state.currentTag} isSubtag={this.props.isSubtag} />;
        } else if (!this.state.fakeTagIsActive) {
            innerDiv = (
                <div className="latest-tag-column">
                    <Tag tag={this.state.currentTag} isSubtag={this.props.isSubtag} />
                    <div style={{ border: '1px solid #00ffee' }}>{this.state.currentTag.nextTag ? 'Other tags:' : ' '}</div>
                    <TagScroller
                        key={`subtag-${this.state.currentTag.id}`}
                        isSubtag={true}
                        game={this.props.game}
                        user={this.props.user}
                        subtagRootTag={this.state.currentTag}
                        refreshScores={this.props.refreshScores}
                        createNewTag={(tag: TagDto) => this.createNewSubtag(tag)}
                        dateOverride={this.props.dateOverride}
                    />
                </div>
            );
        } else if (addTagPanel) {
            innerDiv = addTagPanel;
        } else if (this.state.fakeTagIsActive) {
            innerDiv = <PendingTag isActive={true} tag={this.props.game.pendingRootTag!} />;
        }

        return (
            <div className={className}>
                <div>{this.getMinimalTag(previousTag)}</div>
                {innerDiv}
                <div>
                    {nextTagPanel}
                    {innerDiv !== addTagPanel && addTagPanel}
                </div>
            </div>
        );
    }
}
