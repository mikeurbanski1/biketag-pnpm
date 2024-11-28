import React from 'react';
import { CreateTagDto, GameDto, MinimalTag as MinimalTagType, TagDto, UserDto } from '@biketag/models';
import { MinimalTag, TagDetails } from './tagDetails';
import { ApiManager } from '../../api';
import { AddTag } from './addTag';
import dayjs from 'dayjs';

interface TagView2State {
    loadingTag: boolean;
    currentTag?: TagDto;
    userCanAddTag: boolean;
    addingTag: boolean;
}

interface TagView2Props {
    game: GameDto;
    user: UserDto;
    subtagRootTag?: TagDto;
    isSubtag: boolean;
    refreshScores: () => void;
    createNewRootTag?: (tag: TagDto) => void;
    setCurrentRootTag?: (tag: TagDto) => void;
}

export class TagView extends React.Component<TagView2Props, TagView2State> {
    constructor(props: TagView2Props) {
        super(props);

        let userCanAddTag;
        if (props.isSubtag) {
            if (!props.subtagRootTag) {
                throw new Error('Subtag view must have a root tag');
            }
            // if the root tag was not created by us and has no children (that might be ours), we can add a tag
            // otherwise, we do not know, so set to false for now
            userCanAddTag = !props.subtagRootTag.nextTag && props.subtagRootTag.creator.id !== props.user.id;
        } else {
            if (!props.setCurrentRootTag) {
                throw new Error('Root tag view must have a setCurrentRootTag function');
            }
            // if the game has no tags, we can add a tag
            // otherwise, we do not know, so set to false for now
            userCanAddTag = props.game.latestRootTag === undefined;
        }

        // we have to load the next tag if we are a subtag
        const currentTag = props.isSubtag ? undefined : this.props.game.latestRootTag;

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
            ApiManager.tagApi.canUserAddTag({ userId: this.props.user.id, gameId: this.props.game.id }).then((userCanAddTag) => {
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
        const userCanAddTagUpdate = userCanAddTagOverride !== undefined ? { userCanAddTag: userCanAddTagOverride } : ({} as TagView2State);
        this.setState({ currentTag: tag, loadingTag: false, addingTag: false, ...userCanAddTagUpdate });
        if (!this.props.isSubtag && tag) {
            this.props.setCurrentRootTag!(tag);
        }
    }

    getMinimalTag(tag?: MinimalTagType): React.ReactNode {
        return tag ? <MinimalTag tag={tag} isSubtag={this.props.isSubtag} selectTag={() => this.setTagById(tag.id)} /> : undefined;
    }

    saveNewTag({ name, contents, date }: { name?: string; contents: string; date: string }): void {
        console.log(`saving new tag, date: ${date}`);
        let tag: CreateTagDto;
        if (this.props.isSubtag) {
            tag = {
                name: this.props.subtagRootTag!.name,
                gameId: this.props.game.id,
                isRoot: false,
                rootTagId: this.props.subtagRootTag!.id,
                contents,
                postedDate: dayjs(date).toISOString()
            };
        } else {
            tag = {
                name: name!,
                gameId: this.props.game.id,
                isRoot: true,
                contents,
                postedDate: dayjs(date).toISOString()
            };
        }
        ApiManager.tagApi.createTag(tag).then((newTag) => {
            this.setTag({ tag: newTag, userCanAddTagOverride: false });
            if (!this.props.isSubtag) {
                this.props.createNewRootTag!(newTag);
            }
            this.props.refreshScores();
        });
    }

    render() {
        const classType = this.props.isSubtag ? 'subtag' : 'root-tag';
        const className = `${classType}-scroller`;

        if (this.state.loadingTag) {
            return <div className={className}>Loading...</div>;
        }

        let addTagSection: React.ReactNode | undefined;

        if (this.state.addingTag) {
            addTagSection = (
                <AddTag
                    isRootTag={!this.props.isSubtag}
                    saveTag={({ name, contents, date }) => {
                        this.saveNewTag({ name, contents, date });
                    }}
                />
            );
        } else if (!this.state.addingTag && this.state.userCanAddTag) {
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

        return (
            <div className={className}>
                {this.getMinimalTag(previousTag)}
                <TagDetails tag={this.state.currentTag} isSubtag={this.props.isSubtag} />
                {this.getMinimalTag(nextTag)}
                {addTagSection}
            </div>
        );
    }
}
