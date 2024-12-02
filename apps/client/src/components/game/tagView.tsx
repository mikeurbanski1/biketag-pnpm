import dayjs, { Dayjs } from 'dayjs';
import React from 'react';

import { CreateTagDto, GameDto, MinimalTag as MinimalTagType, TagDto, UserDto } from '@biketag/models';
import { isEarlierDate, isSameDate, Logger } from '@biketag/utils';

import { ApiManager } from '../../api';
import { AddTag } from './addTag';
import { MinimalTag, TagDetails } from './tagDetails';

const logger = new Logger({ prefix: '[TagView]' });

interface TagViewState {
    loadingTag: boolean;
    currentTag?: TagDto;
    userCanAddTag: boolean;
    addingTag: boolean;
}

interface TagViewProps {
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

export class TagView extends React.Component<TagViewProps, TagViewState> {
    constructor(props: TagViewProps) {
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
            addingTag: false,
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

    setAddingTag(addingTag = true): void {
        this.setState({ addingTag });
    }

    setTagById(id?: string): void {
        if (!id) {
            this.setState({ currentTag: undefined, addingTag: false, loadingTag: false, userCanAddTag: true });
        } else if (id !== this.state.currentTag?.id) {
            // make sure we did not somehow view the same tag
            ApiManager.tagApi.getTag({ id }).then((tag) => {
                this.setTag({ tag });
            });
        }
    }

    // setTag(tag: TagDto): void {
    //     this.setState({ currentTag: tag, addingTag: false, loadingTag: false, loadingCanAddTag: false, userCanAddTag: false });
    //     if (!this.props.isSubtag) {
    //         this.props.setCurrentRootTag!(tag);
    //     }
    // }

    setTag({ tag, userCanAddTagOverride }: { tag?: TagDto; userCanAddTagOverride?: boolean }): void {
        const userCanAddTagUpdate = userCanAddTagOverride !== undefined ? { userCanAddTag: userCanAddTagOverride } : ({} as TagViewState);
        // if (!this.props.isSubtag && tag && this.props.game.latestRootTag) {
        //     // reset the tag preview based on whether this is the latest tag
        //     if (tag.id === this.props.game.latestRootTag.id )
        // }
        this.setState({ currentTag: tag, loadingTag: false, addingTag: false, ...userCanAddTagUpdate });
        // if (!this.props.isSubtag && tag) {
        //     this.props.setCurrentRootTag!(tag);
        // }
    }

    getMinimalTag(tag?: MinimalTagType): React.ReactNode {
        return tag ? <MinimalTag tag={tag} isSubtag={this.props.isSubtag} selectTag={() => this.setTagById(tag.id)} /> : undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createNewSubtag(_tag: TagDto): void {
        this.fetchAndSetCanUserAddTag();
    }

    saveNewTag({ name, contents }: { name?: string; contents: string }): void {
        logger.info(`[saveNewTag]`, { name, contents, dateOverride: this.props.dateOverride });
        let tag: CreateTagDto;
        if (this.props.isSubtag) {
            tag = {
                name: this.props.subtagRootTag!.name,
                gameId: this.props.game.id,
                isRoot: false,
                rootTagId: this.props.subtagRootTag!.id,
                contents,
                postedDate: this.props.dateOverride.toISOString(),
            };
        } else {
            tag = {
                name: name!,
                gameId: this.props.game.id,
                isRoot: true,
                contents,
                postedDate: this.props.dateOverride.toISOString(),
            };
        }
        ApiManager.tagApi.createTag(tag).then((newTag) => {
            this.setTag({ tag: newTag, userCanAddTagOverride: false });
            this.props.createNewTag(newTag);
            this.props.refreshScores();
        });
    }

    render() {
        const classType = this.props.isSubtag ? 'subtag' : 'root-tag';
        const className = `${classType}-scroller`;

        logger.info(`[render]`, { isSubtag: this.props.isSubtag, state: this.state, props: this.props });

        if (this.state.loadingTag) {
            return <div className={className}>Loading...</div>;
        }

        const previousRootTagDate = !this.props.isSubtag && this.props.game.latestRootTag?.postedDate ? dayjs(this.props.game.latestRootTag?.postedDate) : undefined;

        // handle re-rendering when changing the date override - only applies to new root tags
        const userCanAddTagWithDateOverride = this.props.isSubtag || !this.props.game.latestRootTag ? true : !isEarlierDate(this.props.dateOverride, this.props.game.latestRootTag.postedDate);
        const actualCanAddTag = !this.state.addingTag && this.state.userCanAddTag && userCanAddTagWithDateOverride;

        // we have a bit of a circular mess here, so until we fix that (I love that I write "we"), we will generate some elements that may or may not be used
        let text;
        if (this.props.isSubtag) {
            text = 'Tag this spot!';
        } else {
            if (!this.props.game.latestRootTag) {
                text = 'Add the first tag!';
            } else if (isSameDate(this.props.dateOverride, this.props.game.latestRootTag!.postedDate)) {
                text = 'Add your new tag for tomorrow';
            } else {
                text = 'Add the next new tag!';
            }
        }
        const addTagButton = <input type="button" name="add-tag" value={text} onClick={() => this.setAddingTag()}></input>;
        const addTagPanel = (
            <AddTag
                isRootTag={!this.props.isSubtag}
                saveTag={({ name, contents }) => {
                    this.saveNewTag({ name, contents });
                }}
                cancelAddTag={() => this.setAddingTag(false)}
                previousRootTagDate={previousRootTagDate}
                dateOverride={this.props.dateOverride}
            />
        );

        // start with the simple case of no tag to display
        if (!this.state.currentTag) {
            const addTagSection = this.state.addingTag ? addTagPanel : addTagButton;
            return (
                <div className={className}>
                    <div>
                        {this.props.isSubtag ? 'Nobody else has been here yet!' : 'Nobody has gone anywhere!'}
                        <br></br>
                        {this.state.userCanAddTag && addTagSection}
                    </div>
                </div>
            );
        }

        // this could be the next root tag, or the add tag button, or the add tag form, or the preview of a pending tag as the poster, or the preview as someone else
        let nextTagPanel;

        if (this.state.addingTag) {
            nextTagPanel = addTagPanel;
        } else if (actualCanAddTag) {
            nextTagPanel = addTagButton;
        } else if (this.props.game.latestRootTag?.id === this.state.currentTag.id && this.props.game.pendingRootTag) {
            // if we are viewing a root tag, and there is a pending tag, show the preview
            nextTagPanel = `The next tag posted by ${this.props.game.pendingRootTag.creator.name} will go live at midnight!`;
        } else {
            const nextTag = this.props.isSubtag ? this.state.currentTag.nextTag : this.state.currentTag.nextRootTag;
            logger.info(`[render] nextTag`, { nextTag });
            nextTagPanel = this.getMinimalTag(nextTag);
        }

        const nextTagSection = <div>{nextTagPanel}</div>;

        let previousTag: MinimalTagType | undefined;
        if (this.props.isSubtag) {
            // if the previous tag of the subtag is the root tag, then we do not want to show it
            logger.info(`[render] this.state.currentTag.parentTag?.id ${this.state.currentTag.parentTag?.id}`);
            logger.info(`[render] this.props.subtagRootTag!.id ${this.props.subtagRootTag!.id}`);
            previousTag = this.state.currentTag.parentTag?.id !== this.props.subtagRootTag!.id ? this.state.currentTag.parentTag : undefined;
        } else {
            previousTag = this.state.currentTag.previousRootTag;
        }

        logger.info(`[render] previous tag`, { previousTag });

        const innerDiv = this.props.isSubtag ? (
            <TagDetails tag={this.state.currentTag} isSubtag={this.props.isSubtag} />
        ) : (
            <div>
                <TagDetails tag={this.state.currentTag} isSubtag={this.props.isSubtag} />
                <div>Other tags:</div>
                <TagView
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

        return (
            <div className={className}>
                {this.getMinimalTag(previousTag)}
                {innerDiv}
                {nextTagSection}
            </div>
        );
    }
}
