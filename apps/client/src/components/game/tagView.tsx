import React from 'react';
// import { ApiManager } from '../../api';
import { CreateTagParams, GameDto, MinimalTag as MinimalTagType, TagDto, UserDto } from '@biketag/models';
import { MinimalTag, TagDetails } from './tagDetails';
import { ApiManager } from '../../api';
import { SubtagView } from './subtagView';
import { AddRootTag } from './addTag';

interface TagViewState {
    loading: boolean;
    rootTag?: TagDto;
    userCanAddTag: boolean;
    addingTag: boolean;
}

interface TagViewProps {
    game: GameDto;
    user: UserDto;
    setNewLatestTag: (tag: TagDto) => void;
}

export class TagView extends React.Component<TagViewProps, TagViewState> {
    constructor(props: TagViewProps) {
        console.log('in tag view constructor');
        super(props);
        this.state = {
            loading: false,
            rootTag: this.props.game.latestRootTag,
            userCanAddTag: true,
            addingTag: false
        };
    }

    // setCanUserAddtag(): void {
    //     // TODO check if game allows a new tag (from this user)
    //     this.setState({ userCanAddTag: true });
    // }

    // componentDidMount(): void {
    //     this.setCanUserAddtag();
    // }

    setTagById(id: string): void {
        if (id === this.state.rootTag?.id) {
            return;
        }
        ApiManager.tagApi.getTag({ id }).then((tag) => {
            this.setTag(tag);
        });
    }

    setTag(tag: TagDto): void {
        // this.setCanUserAddtag();
        this.setState({ rootTag: tag, addingTag: false });
    }

    getMinimalTag(tag: MinimalTagType): React.ReactNode {
        return <MinimalTag tag={tag} isSubtag={false} />;
    }

    getMinimalTagAndButton(tag: MinimalTagType, previous: boolean): React.ReactNode {
        const tagElement = <MinimalTag tag={tag} isSubtag={false} />;
        const button = <input type="button" className="root-scroller-button" name={tag.id} value={previous ? '<<' : '>>'} onClick={() => this.setTagById(tag.id)}></input>;
        return previous ? [<div key={tag.id}>{tagElement}</div>, <div key={`${previous}`}>{button}</div>] : [<div key={tag.id}>{button}</div>, <div key={`${previous}`}>{tagElement}</div>];
    }

    setAddingTag(): void {
        this.setState({ addingTag: true });
    }

    saveNewTag({ name, contents }: { name: string; contents: string }): void {
        const tag: CreateTagParams = {
            name: name!,
            creatorId: this.props.user.id,
            gameId: this.props.game.id,
            isRoot: true,
            contents
        };
        ApiManager.tagApi.createTag(tag).then((newTag) => {
            this.setTag(newTag);
            this.props.setNewLatestTag(newTag);
        });
    }

    async saveNewSubtag({ contents }: { contents: string }): Promise<TagDto> {
        const tag: CreateTagParams = {
            name: this.state.rootTag!.name,
            creatorId: this.props.user.id,
            gameId: this.props.game.id,
            isRoot: false,
            rootTagId: this.state.rootTag!.id,
            contents
        };
        return await ApiManager.tagApi.createTag(tag);
    }

    render() {
        if (this.state.loading) {
            return <div>Loading...</div>;
        }

        let addTagSection: React.ReactNode | undefined;

        const addTagButton = !this.state.addingTag && this.state.userCanAddTag ? <input type="button" name="add-tag" value="Add a new tag!" onClick={() => this.setAddingTag()}></input> : undefined;

        if (this.state.addingTag) {
            addTagSection = (
                <AddRootTag
                    saveTag={({ name, contents }) => {
                        this.saveNewTag({ name, contents });
                    }}
                />
            );
        } else {
            addTagSection = addTagButton;
        }

        if (!this.state.rootTag) {
            return (
                <div>
                    No tags yet!<br></br>
                    {addTagSection}
                </div>
            );
        }

        return (
            <div className="root-tag-scroller">
                {this.state.rootTag.previousRootTag && this.getMinimalTagAndButton(this.state.rootTag.previousRootTag, true)}
                <div className="root-tag">
                    {this.state.rootTag ? <TagDetails tag={this.state.rootTag} isSubtag={false} /> : 'No tags yet!'}

                    <hr></hr>
                    <SubtagView key={this.state.rootTag.id} rootTag={this.state.rootTag} user={this.props.user} saveNewSubtag={({ contents }) => this.saveNewSubtag({ contents })} />
                </div>
                {addTagSection && this.state.rootTag && !this.state.rootTag.nextRootTag ? <div>{addTagSection}</div> : undefined}
                {this.state.rootTag.nextRootTag && this.getMinimalTagAndButton(this.state.rootTag.nextRootTag, false)}
            </div>
        );
    }
}
