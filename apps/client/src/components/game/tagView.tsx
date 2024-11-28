import React from 'react';
import { CreateTagDto, GameDto, MinimalTag as MinimalTagType, TagDto, UserDto } from '@biketag/models';
import { MinimalTag, TagDetails } from './tagDetails';
import { ApiManager } from '../../api';
import { SubtagView } from './subtagView';
import { AddTag } from './addTag';
import dayjs from 'dayjs';

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
    refreshScores: () => void;
}

export class TagView extends React.Component<TagViewProps, TagViewState> {
    constructor(props: TagViewProps) {
        console.log('in tag view constructor');
        super(props);
        this.state = {
            loading: false,
            rootTag: this.props.game.latestRootTag,
            userCanAddTag: props.game.latestRootTag === undefined,
            addingTag: false
        };
    }

    setCanUserAddtag(): void {
        ApiManager.tagApi.canUserAddTag({ userId: this.props.user.id, gameId: this.props.game.id }).then((userCanAddTag) => {
            this.setState({ userCanAddTag });
        });
    }

    componentDidMount(): void {
        this.setCanUserAddtag();
    }

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

    saveNewTag({ name, contents, date }: { name: string; contents: string; date: string }): void {
        console.log(`saving new tag, date: ${date}`);
        const tag: CreateTagDto = {
            name: name!,
            gameId: this.props.game.id,
            isRoot: true,
            contents,
            postedDate: dayjs(date).toISOString()
        };
        ApiManager.tagApi.createTag(tag).then((newTag) => {
            this.setTag(newTag);
            this.props.setNewLatestTag(newTag);
            this.props.refreshScores();
        });
    }

    async saveNewSubtag({ contents, date }: { contents: string; date: string }): Promise<TagDto> {
        console.log(`saving new subtag, date: ${date}`);
        const tag: CreateTagDto = {
            name: this.state.rootTag!.name,
            gameId: this.props.game.id,
            isRoot: false,
            rootTagId: this.state.rootTag!.id,
            contents,
            postedDate: dayjs(date).toISOString()
        };
        const newTag = await ApiManager.tagApi.createTag(tag);
        this.props.refreshScores();
        return newTag;
    }

    render() {
        if (this.state.loading) {
            return <div>Loading...</div>;
        }

        let addTagSection: React.ReactNode | undefined;

        const addTagButton = !this.state.addingTag && this.state.userCanAddTag ? <input type="button" name="add-tag" value="Add a new tag!" onClick={() => this.setAddingTag()}></input> : undefined;

        if (this.state.addingTag) {
            addTagSection = (
                <AddTag
                    isRootTag={true}
                    saveTag={({ name, contents, date }) => {
                        this.saveNewTag({ name, contents, date });
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
                    <SubtagView key={this.state.rootTag.id} rootTag={this.state.rootTag} user={this.props.user} saveNewSubtag={({ contents, date }) => this.saveNewSubtag({ contents, date })} />
                </div>
                {addTagSection && this.state.rootTag && !this.state.rootTag.nextRootTag ? <div>{addTagSection}</div> : undefined}
                {this.state.rootTag.nextRootTag && this.getMinimalTagAndButton(this.state.rootTag.nextRootTag, false)}
            </div>
        );
    }
}
