import React from 'react';
import { CreateTagDto, GameDto, MinimalTag as MinimalTagType, TagDto, UserDto } from '@biketag/models';
import { MinimalTag, TagDetails } from './tagDetails';
import { ApiManager } from '../../api';
import { AddTag } from './addTag';
import dayjs, { Dayjs } from 'dayjs';
import { isSameDate, Logger } from '@biketag/utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            // if the root tag was not created by us and has no children (that might be ours), we can add a tag
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
            addingTag: false
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
                postedDate: this.props.dateOverride.toISOString()
            };
        } else {
            tag = {
                name: name!,
                gameId: this.props.game.id,
                isRoot: true,
                contents,
                postedDate: this.props.dateOverride.toISOString()
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

        logger.info(`[render]`, { state: this.state });

        if (this.state.loadingTag) {
            return <div className={className}>Loading...</div>;
        }

        let addTagSection: React.ReactNode | undefined;

        const previousRootTagDate = !this.props.isSubtag && this.props.game.latestRootTag?.postedDate ? dayjs(this.props.game.latestRootTag?.postedDate) : undefined;

        // handle re-rendering when changing the date override - only applies to new root tags
        const userCanAddTagWithDateOverride = this.props.isSubtag || !this.props.game.latestRootTag ? true : !isSameDate(this.props.dateOverride, this.props.game.latestRootTag.postedDate);

        if (this.state.addingTag) {
            addTagSection = (
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
        } else if (!this.state.addingTag && this.state.userCanAddTag && userCanAddTagWithDateOverride) {
            addTagSection = <input type="button" name="add-tag" value="Add a new tag!" onClick={() => this.setAddingTag()}></input>;
        } else {
            addTagSection = undefined;
        }

        addTagSection = <div>{addTagSection}</div>;

        if (!this.state.currentTag) {
            return (
                <div className={className}>
                    <div>
                        {this.props.isSubtag ? 'Nobody else has been here yet!' : 'Nobody has gone anywhere!'}
                        <br></br>
                        {addTagSection}
                    </div>
                </div>
            );
        }

        // we will not show the add tag for a new root tag unless viewing the most recent root
        if (!this.props.isSubtag && this.state.currentTag.id !== this.props.game.latestRootTag?.id) {
            addTagSection = undefined;
        }

        let previousTag: MinimalTagType | undefined;
        if (this.props.isSubtag) {
            // if the previous tag of the subtag is the root tag, then we do not want to show it
            previousTag = this.state.currentTag.parentTag?.id !== this.props.subtagRootTag!.id ? this.state.currentTag.parentTag : undefined;
        } else {
            previousTag = this.state.currentTag.previousRootTag;
        }

        const nextTag = this.props.isSubtag ? this.state.currentTag.nextTag : this.state.currentTag.nextRootTag;

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
                {this.getMinimalTag(nextTag)}
                {addTagSection}
            </div>
        );
    }
}
