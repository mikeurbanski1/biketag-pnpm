import dayjs, { Dayjs } from 'dayjs';
import React from 'react';

import { CreateTagDto, GameDto, isFullTag, PendingTag as PendingTagType, TagDto, UserDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from '../../api';
import { Tag } from './tag';

import '../../styles/tag.css';

import { AddTag } from './addTag';

const logger = new Logger({ prefix: '[TagScroller]' });

type Position = 'topTag' | 'bottomTag' | 'rootTagLeftTag' | 'rootTagRightTag' | 'centerTag';

interface TagScrollerState {
    loadingTopTag: boolean;
    loadingBottomTag: boolean;
    loadingLeftTag: boolean;
    loadingRightTag: boolean;
    centerTag?: TagDto;
    rootTagLeftTag?: TagDto; // we will leave these set so we do not need to re-fetch them
    rootTagRightTag?: RightTag;
    topTag?: TagDto;
    bottomTag?: BottomTag;
    addRootTagIsActive: boolean;
    addSubtagIsActive: boolean;
    pendingTagIsActive: boolean;
    userCanAddRootTag: boolean;
    userCanAddSubtag: boolean;
}

interface TagScrollerProps {
    game: GameDto;
    user: UserDto;
    refreshScores: () => void;
    // general handler for notifying the parent component that a new tag was created, so it can refresh anything it needs to
    createNewTag: (tag: TagDto) => void;
    dateOverride: Dayjs;
}

type RightTag = TagDto | PendingTagType | 'addTag';
type BottomTag = TagDto | 'addTag';

export class TagScroller extends React.Component<TagScrollerProps, TagScrollerState> {
    constructor(props: TagScrollerProps) {
        super(props);
        logger.info(`[constructor]`, { props });

        const centerTag = this.props.game.latestRootTag;

        const bottomTagAddTag = !!centerTag && !centerTag.nextTagId;

        this.state = {
            loadingTopTag: false,
            loadingBottomTag: !bottomTagAddTag && !!centerTag?.nextTagId,
            loadingLeftTag: !!centerTag?.previousRootTagId,
            loadingRightTag: true, // we have to either get the pending tag or whether we can add a tag
            centerTag,
            addRootTagIsActive: !centerTag,
            addSubtagIsActive: false,
            pendingTagIsActive: false,
            bottomTag: bottomTagAddTag ? 'addTag' : undefined,
            userCanAddRootTag: !centerTag,
            userCanAddSubtag: bottomTagAddTag,
        };
    }

    componentDidMount() {
        const { centerTag } = this.state;
        if (centerTag && isFullTag(centerTag)) {
            const { previousRootTagId: leftTagId, nextTagId: bottomTagId } = centerTag;
            const pendingTagId = this.props.game.pendingRootTag?.id;
            const rootTagRightTag = this.state.rootTagRightTag === 'addTag' ? 'addTag' : undefined;

            Promise.all([
                bottomTagId ? ApiManager.tagApi.getTag({ id: bottomTagId }) : Promise.resolve(undefined),
                leftTagId ? ApiManager.tagApi.getTag({ id: leftTagId }) : Promise.resolve(undefined),
                ApiManager.tagApi.canUserAddSubtag({ userId: this.props.user.id, tagId: centerTag.id }),
                ApiManager.tagApi.canUserAddTag({ userId: this.props.user.id, gameId: this.props.game.id, dateOverride: this.props.dateOverride }),
            ]).then(([bottomTag, leftTag, userCanAddSubtag, userCanAddRootTag]) => {
                let bottomTagVal: BottomTag | undefined;
                if (!bottomTag && this.state.userCanAddSubtag) {
                    bottomTagVal = 'addTag';
                } else {
                    bottomTagVal = bottomTag as TagDto;
                }

                this.setState({
                    loadingBottomTag: false,
                    loadingLeftTag: false,
                    bottomTag: bottomTagVal,
                    rootTagLeftTag: leftTag as TagDto | undefined,
                    rootTagRightTag,
                    userCanAddSubtag,
                    userCanAddRootTag,
                });
            });

            if (!rootTagRightTag && pendingTagId) {
                logger.info(`[componentDidMount]`, { pendingTagId, rootTagRightTag });
                ApiManager.tagApi.getTag({ id: pendingTagId }).then((tag) => {
                    logger.info(`[componentDidMount] got tag`, { tag });
                    this.setState({
                        rootTagRightTag: tag,
                        loadingRightTag: false,
                    });
                });
            } else {
                this.setState({
                    loadingRightTag: false,
                });
            }
        }
    }

    getAndSetTagInPosition({ id, position }: { id?: string; position: Position }): void {
        const update = {} as TagScrollerState;
        if (position === 'rootTagRightTag') {
            update.loadingRightTag = false;
        } else if (position === 'bottomTag') {
            update.loadingBottomTag = false;
        } else if (position === 'rootTagLeftTag') {
            update.loadingLeftTag = false;
        } else if (position === 'topTag') {
            update.loadingTopTag = false;
        }
        if (id) {
            ApiManager.tagApi.getTag({ id }).then((tag) => {
                update[position] = tag as TagDto; // could be a pending tag if we are getting the right tag
                this.setState(update);
            });
        } else {
            update[position] = undefined;
            this.setState(update);
        }
    }

    setTag({ tag, fromPosition }: { tag: TagDto; fromPosition: Position }): void {
        logger.info(`[setTag]`);
        const { centerTag: oldCenterTag } = this.state;

        if (fromPosition === 'centerTag') {
            // it means we created a tag and are now setting it

            if (tag.isRoot) {
                this.setState({
                    centerTag: tag,
                    rootTagLeftTag: oldCenterTag, // we never actualy set this as not the center tag
                    bottomTag: undefined,
                    rootTagRightTag: undefined,
                    loadingBottomTag: false,
                    loadingRightTag: false,
                    loadingLeftTag: false,
                });
            } else {
                this.setState({
                    centerTag: tag,
                    topTag: oldCenterTag,
                    bottomTag: undefined,
                    loadingTopTag: false,
                    loadingBottomTag: false,
                });
                this.getAndSetTagInPosition({ id: tag.parentTagId, position: 'topTag' });
            }
        } else if (fromPosition === 'rootTagRightTag') {
            // we clicked the next root tag
            const loadingRightTag = !!tag.nextRootTagId;
            this.setState({
                rootTagLeftTag: oldCenterTag,
                centerTag: tag,
                loadingLeftTag: false,
                loadingTopTag: false,
                loadingBottomTag: true,
                loadingRightTag,
                rootTagRightTag: !loadingRightTag && this.state.userCanAddRootTag ? 'addTag' : undefined,
            });
            if (loadingRightTag) {
                this.getAndSetTagInPosition({ id: tag.nextRootTagId || this.props.game.pendingRootTag?.id, position: 'rootTagRightTag' });
            }
            this.getAndSetTagInPosition({ id: tag.nextTagId, position: 'bottomTag' });
        } else if (fromPosition === 'rootTagLeftTag') {
            if (this.state.pendingTagIsActive || this.state.addRootTagIsActive) {
                // we clicked the current tag shown as the left tag
                // just reset and render as normal
                this.setState({
                    pendingTagIsActive: false,
                    addRootTagIsActive: false,
                });
            } else {
                this.setState({
                    rootTagRightTag: oldCenterTag,
                    centerTag: tag,
                    loadingRightTag: false,
                    loadingTopTag: false,
                    loadingBottomTag: true,
                    loadingLeftTag: true,
                });
                this.getAndSetTagInPosition({ id: tag.previousRootTagId, position: 'rootTagLeftTag' });
                this.getAndSetTagInPosition({ id: tag.nextTagId, position: 'bottomTag' });
            }
        } else if (fromPosition === 'topTag') {
            // we clicked the previous tag, which could be a subtag or a root tag
            // we might be going back up from add a subtag
            if (this.state.addSubtagIsActive) {
                this.setState({
                    addSubtagIsActive: false,
                });
            } else if (tag.isRoot) {
                // we switched from a subtag to a root tag
                this.setState({
                    bottomTag: oldCenterTag,
                    centerTag: tag,
                    topTag: undefined,
                    loadingBottomTag: false,
                    loadingTopTag: false,
                });
            } else {
                // just scrolling subtags
                this.setState({
                    bottomTag: oldCenterTag,
                    centerTag: tag,
                    loadingBottomTag: false,
                    loadingTopTag: true,
                });
                this.getAndSetTagInPosition({ id: tag.parentTagId, position: 'topTag' });
            }
        } else if (fromPosition === 'bottomTag') {
            // we clicked the bottom tag, which could only be a subtag
            // just scrolling subtags - but we might display add subtag next
            const loadingBottomTag = !!tag.nextTagId;
            this.setState({
                topTag: oldCenterTag,
                centerTag: tag,
                loadingTopTag: false,
                loadingBottomTag,
                bottomTag: !loadingBottomTag && this.state.userCanAddSubtag ? 'addTag' : undefined,
            });
            if (loadingBottomTag) {
                this.getAndSetTagInPosition({ id: tag.nextTagId, position: 'bottomTag' });
            }
        }
    }

    getMinimalTag({ tag, position }: { tag?: TagDto; position: Position }): React.ReactNode {
        if (!tag) {
            return undefined;
        }

        return <Tag tag={tag} selectTag={() => this.setTag({ tag, fromPosition: position })} isActive={false} />;
    }

    saveNewTag({ imageUrl, isSubtag, rootTagId }: { imageUrl: string; isSubtag: boolean; rootTagId?: string }): void {
        logger.info(`[saveNewTag]`, { imageUrl, dateOverride: this.props.dateOverride });
        let tag: CreateTagDto;
        if (isSubtag) {
            tag = {
                gameId: this.props.game.id,
                isRoot: false,
                rootTagId,
                imageUrl,
                postedDate: this.props.dateOverride.toISOString(),
            };
        } else {
            tag = {
                gameId: this.props.game.id,
                isRoot: true,
                imageUrl,
                postedDate: this.props.dateOverride.toISOString(),
            };
        }
        ApiManager.tagApi.createTag(tag).then((newTag) => {
            this.setTag({ tag: newTag, fromPosition: 'centerTag' });
            this.props.createNewTag(newTag);
            this.props.refreshScores();
        });
    }

    render() {
        logger.info(`[render]`, { state: this.state, props: this.props });
        const className = 'tag-scroller';
        const { centerTag, rootTagLeftTag, rootTagRightTag, topTag, bottomTag, addRootTagIsActive, addSubtagIsActive, pendingTagIsActive } = this.state;

        // if (!centerTag) {
        //     return <div className={className}>Loading...</div>;
        // }

        // if these tags are 'addTag's, then there must be a center tag
        const addRootTagElement =
            rootTagRightTag === 'addTag' || addRootTagIsActive ? (
                <AddTag
                    isSubtag={false}
                    saveTag={({ imageUrl }) => {
                        this.saveNewTag({ imageUrl, isSubtag: false });
                    }}
                    previousRootTagDate={centerTag ? dayjs(centerTag.postedDate) : undefined}
                    dateOverride={this.props.dateOverride}
                    setAddTagAsActive={() => this.setState({ addRootTagIsActive: true })}
                    isActive={addRootTagIsActive}
                    isFirstTag={this.props.game.latestRootTag === undefined}
                />
            ) : undefined;

        const addSubtagElement =
            bottomTag === 'addTag' || addSubtagIsActive ? (
                <AddTag
                    isSubtag={true}
                    saveTag={({ imageUrl }) => {
                        this.saveNewTag({ imageUrl, isSubtag: true, rootTagId: topTag!.isRoot ? topTag!.id : topTag!.rootTagId });
                    }}
                    dateOverride={this.props.dateOverride}
                    setAddTagAsActive={() => this.setState({ addSubtagIsActive: true })}
                    isActive={addSubtagIsActive}
                    isFirstTag={centerTag!.isRoot}
                />
            ) : undefined;

        let centerTagElement: React.ReactNode | undefined = undefined;
        let leftTagElement: React.ReactNode | undefined = undefined;
        let topTagElement: React.ReactNode | undefined = undefined;
        let rightTagElement: React.ReactNode | undefined = undefined;
        let bottomTagElement: React.ReactNode | undefined = undefined;

        if (pendingTagIsActive || addRootTagIsActive) {
            // it means we are viewing a fake root tag - the left tag is the center tag, and hide subtags
            if (pendingTagIsActive) {
                centerTagElement = <Tag tag={rootTagRightTag as PendingTagType} isActive={true} />;
            } else {
                centerTagElement = addRootTagElement;
            }
            // handle case where there is no root tag, only add tag
            leftTagElement = this.getMinimalTag({ tag: centerTag, position: 'rootTagLeftTag' });
        } else if (addSubtagIsActive) {
            // we are viewing a subtags, so the side tags will remain hidden
            topTagElement = this.getMinimalTag({ tag: centerTag, position: 'topTag' });
            centerTagElement = addSubtagElement;
        } else if (centerTag) {
            logger.info(`[render] in centerTag`);
            centerTagElement = <Tag tag={centerTag} />;
            if (centerTag.isRoot) {
                logger.info(`[render] in isRoot`, { rootTagRightTag });
                if (rootTagRightTag === 'addTag') {
                    rightTagElement = addRootTagElement;
                } else if (rootTagRightTag && isFullTag(rootTagRightTag)) {
                    rightTagElement = this.getMinimalTag({ tag: rootTagRightTag, position: 'rootTagRightTag' });
                }
                leftTagElement = this.getMinimalTag({ tag: rootTagLeftTag, position: 'rootTagLeftTag' });
            }
            bottomTagElement = bottomTag === 'addTag' ? addSubtagElement : this.getMinimalTag({ tag: bottomTag, position: 'bottomTag' });
            topTagElement = this.getMinimalTag({ tag: topTag, position: 'topTag' });
        }

        // const centerTagElement = activeAddTag ?? <Tag tag={centerTag} />;

        // // these are the easy ones - we will never display a fake tag here
        // const leftTagElement = this.getMinimalTag(leftTag);
        // const topTagElement = this.getMinimalTag(topTag);

        // // we only rendered the right / bottom tag if it would be next or active, so we just need to check that it is not active
        // const rightTagElement = addRootTag && !addTagIsActive ? addRootTag : this.getMinimalTag(rightTag);
        // const bottomTagElement = addSubtag && !addTagIsActive ? addSubtag : this.getMinimalTag(bottomTag);

        return (
            <div className={className}>
                <div className="top-tag">{topTagElement}</div>
                <div className="left-tag">{leftTagElement}</div>
                <div className="center-tag">{centerTagElement}</div>
                <div className="right-tag">{rightTagElement}</div>
                <div className="bottom-tag">{bottomTagElement}</div>
            </div>
        );
    }

    // render() {
    //     const isSubtag = subtagCheck(this.props);
    //     const isRootTag = rootTagCheck(this.props);
    //     const className = `tag-scroller ${this.props.isMinimized ? 'minimized' : ''}`;

    //     logger.info(`[render]`, { isSubtag, state: this.state, props: this.props });

    //     if (this.state.loadingTag) {
    //         return <div className={className}>Loading...</div>;
    //     }

    //     const previousRootTagDate = isRootTag && this.props.game.latestRootTag?.postedDate ? dayjs(this.props.game.latestRootTag?.postedDate) : undefined;

    //     // dev mode code - handle re-rendering when changing the date override - only applies to new root tags
    //     const userCanAddTagWithDateOverride = isSubtag || !this.props.game.latestRootTag ? true : !isEarlierDate(this.props.dateOverride, this.props.game.latestRootTag.postedDate);
    //     // so we can actually add a tag only if the date override is true
    //     const canAddTagDateOverride = this.props.userCanAddTag && userCanAddTagWithDateOverride;

    //     // const canAddTag = canAddTagDateOverride && (isSubtag || (!isSubtag && this.props.game.latestRootTag?.id === this.state.currentTag?.id));

    //     const addTagPanel =
    //         canAddTagDateOverride && (isSubtag || (!isSubtag && this.props.game.latestRootTag?.id === this.state.currentTag?.id)) ? (
    //             <AddTag
    //                 isSubtag={isSubtag}
    //                 saveTag={({ imageUrl }) => {
    //                     this.saveNewTag({ imageUrl });
    //                 }}
    //                 previousRootTagDate={previousRootTagDate}
    //                 dateOverride={this.props.dateOverride}
    //                 setAddTagAsActive={() => this.setFakeTagIsActive(true)}
    //                 isActive={this.state.fakeTagIsActive}
    //                 isFirstTag={(isSubtag ? this.props.subtagRootTag.nextTag : this.props.game.latestRootTag) === undefined}
    //             />
    //         ) : undefined;
    //     logger.info(`[render]`, { addTagPanel: addTagPanel ? 'true' : 'false', isSubtag: isSubtag, userCanAddTag: this.props.userCanAddTag, userCanAddTagWithDateOverride });

    //     // start with the simple case of no tag to display
    //     if (!this.state.currentTag) {
    //         return (
    //             <div className={className}>
    //                 <div></div>
    //                 {addTagPanel}
    //             </div>
    //         );
    //     }

    //     // this will be the next tag, or undefined if there is no next tag
    //     // for a root tag, it means we will not render this and the button together (one will be undefined)
    //     let nextTagPanel: React.ReactNode = undefined;

    //     if (!this.state.fakeTagIsActive && !this.props.isMinimized) {
    //         if (isSubtag && this.state.currentTag.parentTag && this.state.currentTag.parentTag.id !== this.props.subtagRootTag.id) {
    //             // we start with the first tag, not the last like for root tags, so we will have them go from right to left for now (just for now.... ... ?)
    //             nextTagPanel = this.getMinimalTag(this.state.currentTag.parentTag);
    //         } else if (isRootTag && this.state.currentTag.id === this.props.game.latestRootTag?.id && this.props.game.pendingRootTag) {
    //             nextTagPanel = this.getMinimalTag(this.props.game.pendingRootTag);
    //         } else if (isRootTag && this.state.currentTag.nextRootTag) {
    //             nextTagPanel = this.getMinimalTag(this.state.currentTag.nextRootTag);
    //         }
    //     }

    //     let previousTag: TagDto | undefined;
    //     if (!this.props.isMinimized) {
    //         if (isSubtag && !this.state.fakeTagIsActive) {
    //             previousTag = this.state.currentTag.nextTag;
    //         } else if (!this.state.fakeTagIsActive) {
    //             previousTag = this.state.currentTag.previousRootTag;
    //         } else {
    //             previousTag = this.state.currentTag;
    //         }
    //     }

    //     let innerDiv: React.ReactNode;
    //     if (!this.state.fakeTagIsActive) {
    //         innerDiv = <Tag tag={this.state.currentTag} isMinimized={this.props.isMinimized} />;
    //     } else if (addTagPanel) {
    //         innerDiv = addTagPanel;
    //     } else if (this.state.fakeTagIsActive) {
    //         innerDiv = <Tag tag={this.props.game.pendingRootTag!} />;
    //     }

    //     // logger.info(`[render] before return`, {
    //     //     nextTagPanel: nextTagPanel ? 'true' : 'false',
    //     //     innerDivIsAddTag: innerDiv === addTagPanel,
    //     // });

    //     return (
    //         <div className={className}>
    //             <div>{this.getMinimalTag(previousTag)}</div>
    //             {innerDiv}
    //             {nextTagPanel}
    //             {innerDiv !== addTagPanel && addTagPanel}
    //         </div>
    //     );
    // }
}
