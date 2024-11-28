import React from 'react';
import { MinimalTag as MinimalTagType, TagDto, UserDto } from '@biketag/models';
import { MinimalTag, TagDetails } from './tagDetails';
import { ApiManager } from '../../api';
import { Logger } from '@biketag/utils';
import { AddTag } from './addTag';

const logger = new Logger({ prefix: '[SubtagView]' });

interface SubtagViewState {
    loading: boolean;
    currentTag?: TagDto;
    userCanAddTag: boolean;
    addingTag: boolean;
}

interface SubtagViewProps {
    user: UserDto;
    rootTag: TagDto;
    saveNewSubtag: ({ contents, date }: { contents: string; date: string }) => Promise<TagDto>;
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

    /**
     * Set the value either based on the tag value (will call the API to check) or the known value (override)
     * Exactly one should be specified; behavior undefined if both or neither are specified
     */
    setCanUserAddtag({ tag, override }: { tag?: TagDto; override?: boolean }): void {
        if (tag) {
            ApiManager.tagApi.canUserAddSubtag({ tagId: tag.id, userId: this.props.user.id }).then((canEdit) => {
                this.setState({ userCanAddTag: canEdit });
            });
        } else {
            this.setState({ userCanAddTag: override! });
        }
    }

    async getUserCanAddTag(tag: TagDto): Promise<boolean> {
        return await ApiManager.tagApi.canUserAddSubtag({ tagId: tag.id, userId: this.props.user.id });
    }

    componentDidMount(): void {
        if (this.props.rootTag.nextTag) {
            ApiManager.tagApi.getTag({ id: this.props.rootTag.nextTag.id }).then((tag) => {
                this.setCanUserAddtag({ tag: this.props.rootTag });
                this.setState({ loading: false, currentTag: tag });
            });
        } else {
            this.setCanUserAddtag({ tag: this.props.rootTag });
            this.setState({ loading: false, userCanAddTag: true });
        }
    }

    setTagById(id: string): void {
        ApiManager.tagApi.getTag({ id }).then((tag) => {
            this.setState({ currentTag: tag, addingTag: false });
        });
    }

    setTag({ tag, userCanAddTagOverride }: { tag: TagDto; userCanAddTagOverride?: boolean }): void {
        if (userCanAddTagOverride !== undefined) {
            this.setCanUserAddtag({ override: userCanAddTagOverride });
        }
        this.setState({ currentTag: tag, addingTag: false });
    }

    setAddingTag(): void {
        this.setState({ addingTag: true });
    }

    getMinimalTag(tag: MinimalTagType): React.ReactNode {
        const tagElement = <MinimalTag key={tag.id} tag={tag} isSubtag={true} selectTag={() => this.setTagById(tag.id)} />;
        // const button = (
        //     <input
        //         key={`${previous ? 'prev' : 'next'}-tag-button-${tag.id}`}
        //         type="button"
        //         className="root-scroller-button"
        //         name={tag.id}
        //         value={previous ? '^^' : 'vv'}
        //         onClick={() => this.setTagById(tag.id)}
        //     ></input>
        // );
        // const br = <br key={`${previous ? 'prev' : 'next'}-br-${tag.id}`}></br>;
        // return previous ? [tagElement, br, button] : [button, br, tagElement];
        return tagElement;
    }

    saveNewTag({ contents, date }: { contents: string; date: string }): void {
        this.props.saveNewSubtag({ contents, date }).then((tag) => {
            // user just added a tag, so we know this
            this.setTag({ tag, userCanAddTagOverride: false });
        });
    }

    render() {
        if (this.state.loading) {
            return <div className="subtag-scroller">Loading...</div>;
        }

        logger.info(`[render]`, { state: JSON.parse(JSON.stringify(this.state)) });

        let addTagSection: React.ReactNode | undefined;

        const addTagButton = !this.state.addingTag && this.state.userCanAddTag ? <input type="button" name="add-tag" value="Add a new tag!" onClick={() => this.setAddingTag()}></input> : undefined;

        if (this.state.addingTag) {
            addTagSection = (
                <AddTag
                    isRootTag={false}
                    saveTag={({ contents, date }) => {
                        this.saveNewTag({ contents, date });
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
                    {addTagSection}
                </div>
            );
        }

        if (this.state.loading) {
            return <div className="subtag-scroller">Loading...</div>;
        } else {
            const { currentTag } = this.state;
            return (
                <div className="subtag-scroller">
                    {currentTag.parentTag && currentTag.parentTag.id !== this.props.rootTag.id && this.getMinimalTag(currentTag.parentTag)}
                    <div className="subtag">
                        <TagDetails tag={this.state.currentTag} isSubtag={true} />
                    </div>
                    {currentTag.nextTag && this.getMinimalTag(currentTag.nextTag)}
                    {addTagSection ? (
                        <div>
                            <hr></hr>
                            {addTagSection}
                        </div>
                    ) : undefined}
                </div>
            );
        }
    }
}
