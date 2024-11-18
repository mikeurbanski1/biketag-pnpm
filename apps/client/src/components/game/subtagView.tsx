import React from 'react';
import { MinimalTag as MinimalTagType, TagDto, UserDto } from '@biketag/models';
import { MinimalTag, TagDetails } from './tagDetails';
import { ApiManager } from '../../api';
import { AddSubtag } from './addTag';

interface SubtagViewState {
    loading: boolean;
    currentTag?: TagDto;
    userCanAddTag: boolean;
    addingTag: boolean;
}

interface SubtagViewProps {
    user: UserDto;
    rootTag: TagDto;
    saveNewSubtag: ({ contents }: { contents: string }) => Promise<TagDto>;
}

export class SubtagView extends React.Component<SubtagViewProps, SubtagViewState> {
    constructor(props: SubtagViewProps) {
        super(props);
        this.state = {
            loading: true,
            userCanAddTag: false,
            addingTag: false
        };
    }

    setCanUserAddtag(tag: TagDto): void {
        ApiManager.tagApi.canUserAddSubtag({ tagId: tag.id, userId: this.props.user.id }).then((canEdit) => {
            this.setState({ userCanAddTag: canEdit });
        });
    }

    componentDidMount(): void {
        if (this.props.rootTag.nextTag) {
            this.setCanUserAddtag(this.props.rootTag);
            ApiManager.tagApi.getTag({ id: this.props.rootTag.nextTag.id }).then((tag) => {
                this.setState({ loading: false, currentTag: tag });
            });
        } else {
            this.setState({ loading: false, userCanAddTag: true });
        }
    }

    setTagById(id: string): void {
        ApiManager.tagApi.getTag({ id }).then((tag) => {
            this.setState({ currentTag: tag, addingTag: false });
        });
    }

    setTag({ tag, setUserCanAddTag }: { tag: TagDto; setUserCanAddTag?: boolean }): void {
        if (setUserCanAddTag) {
            this.setCanUserAddtag(tag);
        }
        this.setState({ currentTag: tag, addingTag: false });
    }

    setAddingTag(): void {
        this.setState({ addingTag: true });
    }

    getMinimalTagAndButton(tag: MinimalTagType, previous: boolean): React.ReactNode[] {
        const tagElement = <MinimalTag key={`${previous ? 'prev' : 'next'}-tag-${tag.id}`} tag={tag} isSubtag={true} />;
        const button = (
            <input
                key={`${previous ? 'prev' : 'next'}-tag-button-${tag.id}`}
                type="button"
                className="root-scroller-button"
                name={tag.id}
                value={previous ? '^^' : 'vv'}
                onClick={() => this.setTagById(tag.id)}
            ></input>
        );
        const br = <br key={`${previous ? 'prev' : 'next'}-br-${tag.id}`}></br>;
        return previous ? [tagElement, br, button] : [button, br, tagElement];
    }

    saveNewTag({ contents }: { contents: string }): void {
        this.props.saveNewSubtag({ contents }).then((tag) => {
            // user just added a tag, so we know this
            this.setTag({ tag, setUserCanAddTag: false });
        });
    }

    render() {
        if (this.state.loading) {
            return <div className="subtag-scroller">Loading...</div>;
        }

        let addTagSection: React.ReactNode | undefined;

        const addTagButton = !this.state.addingTag && this.state.userCanAddTag ? <input type="button" name="add-tag" value="Add a new tag!" onClick={() => this.setAddingTag()}></input> : undefined;

        if (this.state.addingTag) {
            addTagSection = (
                <AddSubtag
                    saveTag={({ contents }) => {
                        this.saveNewTag({ contents });
                    }}
                />
            );
        } else {
            addTagSection = addTagButton;
        }

        if (!this.state.currentTag) {
            return (
                <div className="subtag-scroller">
                    Nobody has been here yet!<br></br>
                    {addTagButton}
                </div>
            );
        }

        if (this.state.loading) {
            return <div className="subtag-scroller">Loading...</div>;
        } else if (this.state.currentTag) {
            const { currentTag } = this.state;
            return (
                <div className="subtag-scroller">
                    {currentTag.parentTag && currentTag.parentTag.id !== this.props.rootTag.id && this.getMinimalTagAndButton(currentTag.parentTag, true)}
                    <div className="subtag">
                        <TagDetails tag={this.state.currentTag} isSubtag={true} />
                    </div>
                    {currentTag.nextTag && this.getMinimalTagAndButton(currentTag.nextTag, false)}
                    {addTagSection ? (
                        <div>
                            <hr></hr>
                            {addTagSection}
                        </div>
                    ) : undefined}
                </div>
            );
        } else {
            return <div className="subtag-scroller">Nobody has been here yet!</div>;
        }
    }
}
