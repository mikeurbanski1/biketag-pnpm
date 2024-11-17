import React from 'react';
// import { ApiManager } from '../../api';
import { MinimalTag as MinimalTagType, TagDto } from '@biketag/models';
import { MinimalTag, TagDetails } from './tagDetails';
import { ApiManager } from '../../api';

interface SubtagViewState {
    loading: boolean;
    currentTag?: TagDto;
}

interface SubtagViewProps {
    rootTag: TagDto;
}

export class SubtagView extends React.Component<SubtagViewProps, SubtagViewState> {
    constructor(props: SubtagViewProps) {
        super(props);
        this.state = {
            loading: true
        };
    }

    componentDidMount(): void {
        if (this.props.rootTag.nextTag) {
            ApiManager.tagApi.getTag({ id: this.props.rootTag.nextTag.id }).then((tag) => {
                this.setState({ currentTag: tag, loading: false });
            });
        } else {
            this.setState({ loading: false });
        }
    }

    setTag(id: string): void {
        ApiManager.tagApi.getTag({ id }).then((tag) => {
            this.setState({ currentTag: tag });
        });
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
                onClick={() => this.setTag(tag.id)}
            ></input>
        );
        const br = <br key={`${previous ? 'prev' : 'next'}-br-${tag.id}`}></br>;
        return previous ? [tagElement, br, button] : [button, br, tagElement];
    }

    render() {
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
                </div>
            );
        } else {
            return <div className="subtag-scroller">Nobody has been here yet!</div>;
        }
    }
}
