import React from 'react';
// import { ApiManager } from '../../api';
import { GameDto, MinimalTag as MinimalTagType, TagDto } from '@biketag/models';
import { MinimalTag, TagDetails } from './tagDetails';
import { ApiManager } from '../../api';
import { SubtagView } from './subtagView';

interface TagViewState {
    loading: boolean;
    rootTag?: TagDto;
}

interface TagViewProps {
    game: GameDto;
}

export class TagView extends React.Component<TagViewProps, TagViewState> {
    constructor(props: TagViewProps) {
        console.log('in tag view constructor');
        super(props);
        this.state = {
            loading: false,
            rootTag: this.props.game.latestRootTag
        };
    }

    componentDidMount(): void {
        // const { latestRootTag } = this.props.game;
        // if (latestRootTag) {
        // } else {
        //     this.setState({ loading: false });
        // }
    }

    setTag(id: string): void {
        ApiManager.tagApi.getTag({ id }).then((tag) => {
            this.setState({ rootTag: tag });
        });
    }

    getMinimalTagAndButton(tag: MinimalTagType, previous: boolean): React.ReactNode {
        const tagElement = <MinimalTag tag={tag} isSubtag={false} />;
        const button = <input type="button" className="root-scroller-button" name={tag.id} value={previous ? '<<' : '>>'} onClick={() => this.setTag(tag.id)}></input>;
        return previous ? [tagElement, <br></br>, button] : [button, <br></br>, tagElement];
    }

    render() {
        console.error('in render for tag view');
        console.error('state:', JSON.stringify(this.state, null, 2));
        if (this.state.loading) {
            return <div>Loading...</div>;
        }
        if (!this.state.rootTag) {
            return <div>No tags yet!</div>;
        }

        return (
            <div className="root-tag-scroller">
                {this.state.rootTag.previousRootTag && this.getMinimalTagAndButton(this.state.rootTag.previousRootTag, true)}
                <div className="root-tag">
                    <TagDetails tag={this.state.rootTag} isSubtag={false} />
                    <hr></hr>
                    <SubtagView key={this.state.rootTag.id} rootTag={this.state.rootTag} />
                </div>
                {this.state.rootTag.nextRootTag && this.getMinimalTagAndButton(this.state.rootTag.nextRootTag, false)}
            </div>
        );
    }
}
