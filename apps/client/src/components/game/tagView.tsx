import React from 'react';
// import { ApiManager } from '../../api';
import { GameDto, MinimalTag as MinimalTagType, TagDto } from '@biketag/models';
import { MinimalTag, TagDetails } from './tag';
import { ApiManager } from '../../api';

interface TagViewState {
    loading: boolean;
    rootTag?: TagDto;
}

interface TagViewProps {
    game: GameDto;
}

export class TagView extends React.Component<TagViewProps, TagViewState> {
    constructor(props: TagViewProps) {
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
        const tagElement = <MinimalTag tag={tag} />;
        const button = <input type="button" name={tag.id} value={previous ? 'Previous' : 'Next'} onClick={() => this.setTag(tag.id)}></input>;
        return previous ? [tagElement, <br></br>, button] : [button, <br></br>, tagElement];
    }

    render() {
        if (this.state.loading) {
            return <div>Loading...</div>;
        }
        if (!this.state.rootTag) {
            return <div>No tags yet!</div>;
        }
        return (
            <div>
                {this.state.rootTag.previousRootTag && this.getMinimalTagAndButton(this.state.rootTag.previousRootTag, true)}
                <TagDetails tag={this.state.rootTag} />
                {this.state.rootTag.nextRootTag && this.getMinimalTagAndButton(this.state.rootTag.nextRootTag, false)}
            </div>
        );
    }
}
