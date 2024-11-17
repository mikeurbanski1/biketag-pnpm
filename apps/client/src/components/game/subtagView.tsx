import React from 'react';
// import { ApiManager } from '../../api';
import { GameDto, MinimalTag as MinimalTagType, TagDto } from '@biketag/models';
import { MinimalTag, TagDetails } from './tagDetails';
import { ApiManager } from '../../api';

interface SubtagViewState {
    loading: boolean;
    rootTag: TagDto;
    currentTag?: TagDto;
}

interface SubtagViewProps {
    game: GameDto;
}

export class SubtagView extends React.Component<SubtagViewProps, SubtagViewState> {
    constructor(props: SubtagViewProps) {
        super(props);
        this.state = {
            loading: true,
            rootTag: this.props.game.latestRootTag!
        };
    }

    componentDidMount(): void {
        if (this.state.rootTag.nextTag) {
            ApiManager.tagApi.getTag({ id: this.state.rootTag.nextTag.id }).then((tag) => {
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
        const tagElement = <MinimalTag tag={tag} isSubtag={true} />;
        const button = <input type="button" className="root-scroller-button" name={tag.id} value={previous ? '^^' : 'vv'} onClick={() => this.setTag(tag.id)}></input>;
        return previous ? [tagElement, <br></br>, button] : [button, <br></br>, tagElement];
    }

    render() {
        if (this.state.loading) {
            return <div className="subtag-scroller">Loading...</div>;
        } else if (this.state.currentTag) {
            const { currentTag } = this.state;
            return (
                <div className="subtag-scroller">
                    {currentTag.parentTag && currentTag.parentTag.id !== this.state.rootTag.id && this.getMinimalTagAndButton(currentTag.parentTag, true)}
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
