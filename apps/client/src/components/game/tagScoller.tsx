import dayjs, { Dayjs } from 'dayjs';
import React from 'react';

import { CreateTagDto, GameDto, MinimalTag as MinimalTagType, PendingTag as PendingTagType, TagDto, UserDto } from '@biketag/models';
import { isEarlierDate, Logger } from '@biketag/utils';

import { ApiManager } from '../../api';
import { AddTag } from './addTag';
import { MinimalTag, PendingTag, Tag } from './tag';

import '../../styles/tag.css';

const logger = new Logger({ prefix: '[TagScroller]' });

interface TagScrollerState {
    loadingTag: boolean;
    currentTag?: TagDto;
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
    setCurrentRootTag?: (tag: TagDto) => void;
    dateOverride: Dayjs;
    userCanAddTag: boolean;
    minimized: boolean;
}

export class TagScroller extends React.Component<TagScrollerProps, TagScrollerState> {
    constructor(props: TagScrollerProps) {
        super(props);
        logger.info(`[constructor]`, { props });

        // we have to load the next tag if we are a subtag
        const currentTag = props.isSubtag ? undefined : this.props.game.latestRootTag;
        logger.info(`[constructor]`, { currentTag: currentTag ?? 'undefined' });

        this.state = {
            // we have to load the subtag, because the game's tag only contains a minimal link
            loadingTag: props.isSubtag,
            currentTag,
            fakeTagIsActive: props.game.latestRootTag === undefined,
        };
    }

    componentDidMount(): void {
        if (this.props.isSubtag) {
            this.setTagById(this.props.subtagRootTag!.nextTag?.id);
        } else {
            this.setState({ loadingTag: false });
        }
    }

    setTagById(id?: string): void {
        if (!id) {
            this.setState({ currentTag: undefined, loadingTag: false });
        } else if (id !== this.state.currentTag?.id) {
            ApiManager.tagApi.getTag({ id }).then((tag) => {
                this.setTag({ tag });
            });
        } else {
            this.setState({ fakeTagIsActive: false });
        }
    }

    setTag({ tag }: { tag?: TagDto }): void {
        if (tag && tag.id === this.state.currentTag?.id) {
            this.setState({ fakeTagIsActive: false });
        } else {
            this.setState({ currentTag: tag, loadingTag: false, fakeTagIsActive: false });
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
            this.setTag({ tag: newTag });
            this.props.createNewTag(newTag);
            this.props.refreshScores();
        });
    }

    setAddTagAsActive(): void {
        this.setState({ fakeTagIsActive: true });
    }

    render() {
        const className = `tag-scroller ${this.props.minimized ? 'minimized' : ''}`;

        logger.info(`[render]`, { isSubtag: this.props.isSubtag, state: this.state, props: this.props });

        if (this.state.loadingTag) {
            return <div className={className}>Loading...</div>;
        }

        const previousRootTagDate = !this.props.isSubtag && this.props.game.latestRootTag?.postedDate ? dayjs(this.props.game.latestRootTag?.postedDate) : undefined;

        // dev mode code - handle re-rendering when changing the date override - only applies to new root tags
        const userCanAddTagWithDateOverride = this.props.isSubtag || !this.props.game.latestRootTag ? true : !isEarlierDate(this.props.dateOverride, this.props.game.latestRootTag.postedDate);
        // so we can actually add a tag only if the date override is true
        const canAddTagDateOverride = this.props.userCanAddTag && userCanAddTagWithDateOverride;

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
                    isFirstTag={(this.props.isSubtag ? this.props.subtagRootTag!.nextTag : this.props.game.latestRootTag) === undefined}
                />
            ) : undefined;
        logger.info(`[render]`, { addTagPanel: addTagPanel ? 'true' : 'false', isSubtag: this.props.isSubtag, userCanAddTag: this.props.userCanAddTag, userCanAddTagWithDateOverride });

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
            innerDiv = <Tag tag={this.state.currentTag} isSubtag={this.props.isSubtag} />;
        } else if (addTagPanel) {
            innerDiv = addTagPanel;
        } else if (this.state.fakeTagIsActive) {
            innerDiv = <PendingTag isActive={true} tag={this.props.game.pendingRootTag!} />;
        }

        logger.info(`[render] before return`, {
            nextTagPanel: nextTagPanel ? 'true' : 'false',
            innerDivIsAddTag: innerDiv === addTagPanel,
        });

        return (
            <div className={className}>
                <div>{this.getMinimalTag(previousTag)}</div>
                {innerDiv}
                {nextTagPanel}
                {innerDiv !== addTagPanel && addTagPanel}
            </div>
        );
    }
}
