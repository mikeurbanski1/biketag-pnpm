import { Dayjs } from 'dayjs';
import React from 'react';

import { CreateTagDto, GameDto, isFullTag, PendingTag, TagDto, UserDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from '../../api';
import { Tag } from './tag';

import '../../styles/tag.css';

const logger = new Logger({ prefix: '[TagScroller]' });

type Position = 'topTag' | 'bottomTag' | 'rootTagLeftTag' | 'rootTagRightTag' | 'centerTag';

type RealTag = TagDto | PendingTag;
type TagOrId = RealTag | string;
type RightTag = TagOrId;
type BottomTag = TagOrId;
type CenterTag = RealTag | RightTag | BottomTag;

interface TagScrollerState {
    centerTag: CenterTag;
    rootTagLeftTag?: TagOrId; // we will leave these set so we do not need to re-fetch them
    rootTagRightTag?: RightTag;
    topTag?: TagOrId;
    bottomTag?: BottomTag;
    // we will use these to calculate on demand if we can add tags, and then show the add tag panels when needed
    userCanAddRootTagInGame: boolean;
    userCanAddSubtagInChain: boolean;
}

interface TagScrollerProps {
    game: GameDto;
    user: UserDto;
    refreshScores: () => void;
    // general handler for notifying the parent component that a new tag was created, so it can refresh anything it needs to
    createNewTag: (tag: TagDto) => void;
    dateOverride: Dayjs;
}

const isTag = (tag: CenterTag): tag is TagDto | PendingTag => typeof tag !== 'string';

export class TagScroller extends React.Component<TagScrollerProps, TagScrollerState> {
    constructor(props: TagScrollerProps) {
        super(props);
        logger.info(`[constructor]`, { props });

        const { latestRootTag, pendingRootTag } = this.props.game;

        // we will set the canAddTag values if we can determine them with certainty

        const userCanAddRootTagInGame = !latestRootTag;
        const centerTag = latestRootTag!;

        const userCanAddSubtagInChain = latestRootTag !== undefined && !latestRootTag.nextTagId && latestRootTag.creator.id !== this.props.user.id;
        const bottomTag = latestRootTag?.nextTagId;

        const rootTagRightTag = pendingRootTag;
        const rootTagLeftTag = latestRootTag?.previousRootTagId;

        this.state = {
            centerTag,
            bottomTag,
            rootTagRightTag,
            rootTagLeftTag,
            userCanAddRootTagInGame,
            userCanAddSubtagInChain,
        };
    }

    componentDidMount() {
        const { latestRootTag, pendingRootTag } = this.props.game;
        const { centerTag, userCanAddRootTagInGame, userCanAddSubtagInChain } = this.state;

        // our job here is to determine if the right tag should be add tag, which is true if:
        // - we did not already determine we can add a root tag (because the game has no tags)
        // - we are viewing the latest root tag (this will always be true if the tag exists when we load the component)
        // - there is no pending tag
        // - the user can add a tag as determined by the API
        if (!userCanAddRootTagInGame && isTag(centerTag) && isFullTag(centerTag) && latestRootTag && !pendingRootTag) {
            ApiManager.tagApi.canUserAddTag({ userId: this.props.user.id, gameId: this.props.game.id, dateOverride: this.props.dateOverride }).then((canAdd) => {
                this.setState({ userCanAddRootTagInGame: canAdd, rootTagRightTag: canAdd ? 'addRootTag' : undefined });
            });
        }

        // here we need to determine if we can add a subtag in this chain, which will not necessarily be equivalent to rendering it now
        if (!userCanAddSubtagInChain) {
            this.calculateCanAddSubtag();
        }

        // we do not need to load canAddSubtag at this time - in the constructor, we checked if the bottom tag should be

        // if (!bottomTag) {
        //     ApiManager.tagApi.canUserAddSubtag({ userId: this.props.user.id, tagId: centerTag.id }).then((canAdd) => {
        //         this.setState({ userCanAddSubtag: canAdd });
        //     });
        // }

        // const { centerTag } = this.state;
        // if (centerTag && isFullTag(centerTag)) {
        //     const { previousRootTagId: leftTagId, nextTagId: bottomTagId } = centerTag;
        //     // const pendingTagId = this.props.game.pendingRootTag?.id;
        //     // const rootTagRightTag = this.state.rootTagRightTag === 'addTag' && !pendingTagId ? 'addTag' : undefined;

        //     Promise.all([
        //         bottomTagId ? ApiManager.tagApi.getTag({ id: bottomTagId }) : Promise.resolve(undefined),
        //         leftTagId ? ApiManager.tagApi.getTag({ id: leftTagId }) : Promise.resolve(undefined),
        //         ApiManager.tagApi.canUserAddSubtag({ userId: this.props.user.id, tagId: centerTag.id }),
        //         ApiManager.tagApi.canUserAddTag({ userId: this.props.user.id, gameId: this.props.game.id, dateOverride: this.props.dateOverride }),
        //     ]).then(([bottomTag, leftTag, userCanAddSubtag, userCanAddRootTag]) => {
        //         let bottomTagVal: BottomTag | undefined;
        //         if (!bottomTag && this.state.userCanAddSubtag) {
        //             bottomTagVal = 'addTag';
        //         } else {
        //             bottomTagVal = bottomTag as TagDto;
        //         }

        //         this.setState({
        //             loadingBottomTag: false,
        //             loadingLeftTag: false,
        //             bottomTag: bottomTagVal,
        //             rootTagLeftTag: leftTag as TagDto | undefined,
        //             userCanAddSubtag,
        //             userCanAddRootTag,
        //         });
        //     });

        // if (!rootTagRightTag && pendingTagId) {
        //     logger.info(`[componentDidMount]`, { pendingTagId, rootTagRightTag });
        //     ApiManager.tagApi.getTag({ id: pendingTagId }).then((tag) => {
        //         logger.info(`[componentDidMount] got tag`, { tag });
        //         this.setState({
        //             rootTagRightTag: tag,
        //             loadingRightTag: false,
        //         });
        //     });
        // } else if (rootTagRightTag) {
        //     this.setState({
        //         rootTagRightTag,
        //         loadingRightTag: false,
        //     });
        // } else {
        //     this.setState({
        //         loadingRightTag: false,
        //     });
        // }
        // }
    }

    // recalculate canAddSubtag when the center tag changes - will do nothing if the value is already true - this should only be called
    // if we need to know whether to set it to true
    calculateCanAddSubtag(): void {
        if (this.state.userCanAddSubtagInChain) {
            return;
        }
        const { centerTag } = this.state;
        if (centerTag && isTag(centerTag) && isFullTag(centerTag)) {
            ApiManager.tagApi.canUserAddSubtag({ userId: this.props.user.id, tagId: centerTag.id }).then((canAdd) => {
                if (canAdd) {
                    this.setState({ userCanAddSubtagInChain: canAdd });
                }
            });
        }
    }

    // getAndSetTagInPosition({ id, position }: { id?: string; position: Position }): void {
    //     const update = {} as TagScrollerState;
    //     if (position === 'rootTagRightTag') {
    //         update.loadingRightTag = false;
    //     } else if (position === 'bottomTag') {
    //         update.loadingBottomTag = false;
    //     } else if (position === 'rootTagLeftTag') {
    //         update.loadingLeftTag = false;
    //     } else if (position === 'topTag') {
    //         update.loadingTopTag = false;
    //     }
    //     if (id) {
    //         ApiManager.tagApi.getTag({ id }).then((tag) => {
    //             update[position] = tag as TagDto; // could be a pending tag if we are getting the right tag
    //             this.setState(update);
    //         });
    //     } else {
    //         update[position] = undefined;
    //         this.setState(update);
    //     }
    // }

    setTag({ tag, fromPosition }: { tag: CenterTag; fromPosition: Position }): void {
        logger.info(`[setTag]`, { tag, fromPosition });
        const { centerTag: oldCenterTag } = this.state;

        if (fromPosition === 'centerTag' && isTag(tag) && isFullTag(tag)) {
            // it means we created a tag and are now setting it, so we can make some assumptions
            if (tag.isRoot) {
                // the left tag will stay the same (it was already the current latest tag, if we were able to add a root tag)
                this.setState({
                    centerTag: tag,
                    userCanAddRootTagInGame: false,
                    userCanAddSubtagInChain: false,
                });
            } else {
                // the top tag will stay the same (it was already the last tag in the chain, if we were able to add a subtag)
                this.setState({
                    centerTag: tag,
                    userCanAddSubtagInChain: false,
                });
            }
        } else if (fromPosition === 'rootTagRightTag') {
            // we clicked a right tag that is a real, non-pending tag, so scroll and then figure out what is on the right and bottom
            if (isTag(tag) && isFullTag(tag)) {
                const userCanAddSubtagInChain = !tag.nextTagId && tag.creator.id !== this.props.user.id;
                this.setState({
                    centerTag: tag,
                    rootTagLeftTag: oldCenterTag as TagOrId,
                    rootTagRightTag: tag.nextRootTagId,
                    userCanAddSubtagInChain,
                    bottomTag: userCanAddSubtagInChain ? 'addSubtag' : tag.nextTagId,
                });
                this.calculateCanAddSubtag(); // calculate for later
            } else if (isTag(tag) && !isFullTag(tag)) {
                // we clicked a pending tag, so we will set it as the center tag, and we know we cannot add a root tag or subtag
                this.setState({
                    centerTag: tag,
                    rootTagLeftTag: oldCenterTag as TagOrId,
                    rootTagRightTag: undefined,
                    bottomTag: undefined,
                    userCanAddRootTagInGame: false,
                    userCanAddSubtagInChain: false,
                });
            } else {
                // we clicked the add tag, so we will set it as the center tag, and we know we cannot add a root tag or subtag
                this.setState({
                    centerTag: tag,
                    rootTagLeftTag: oldCenterTag as TagOrId,
                    rootTagRightTag: undefined,
                    bottomTag: undefined,
                    userCanAddRootTagInGame: false,
                    userCanAddSubtagInChain: false,
                });
            }
        } else if (fromPosition === 'rootTagLeftTag') {
            // we clicked a left tag, which will always be a real, non-pending tag - this is just a type guard
            if (isTag(tag) && isFullTag(tag)) {
                const userCanAddSubtagInChain = !tag.nextTagId && tag.creator.id !== this.props.user.id;
                this.setState({
                    centerTag: tag,
                    rootTagLeftTag: tag.previousRootTagId,
                    rootTagRightTag: oldCenterTag,
                    userCanAddSubtagInChain,
                    bottomTag: userCanAddSubtagInChain ? 'addSubtag' : tag.nextTagId,
                });
                this.calculateCanAddSubtag(); // calculate for later
            }
        } else if (fromPosition === 'topTag') {
            // we clicked the previous tag, which could be a subtag or a root tag, but it will always be real (not pending or add)
            if (isTag(tag) && isFullTag(tag)) {
                this.setState({
                    topTag: tag.parentTagId,
                    centerTag: tag,
                    bottomTag: oldCenterTag,
                });
            }
        } else if (fromPosition === 'bottomTag') {
            // we clicked the bottom tag, which will be a subtag or subtag add tag
            if (isTag(tag) && isFullTag(tag)) {
                // we clicked a real tag that is a subtag
                this.setState({
                    topTag: oldCenterTag as TagOrId,
                    centerTag: tag,
                    bottomTag: tag.nextTagId ?? (this.state.userCanAddSubtagInChain ? 'addSubtag' : undefined),
                });
            } else {
                // we clicked the add subtag
                this.setState({
                    topTag: oldCenterTag as TagOrId,
                    centerTag: tag,
                    bottomTag: undefined,
                });
            }
        }
    }

    // getClickableTag({ tag, position }: { tag?: RealTag | RightTag | BottomTag; position: Position }): React.ReactNode {
    //     if (!tag) {
    //         return undefined;
    //     }

    //     return <Tag tag={tag} selectTag={(tag: RealTag | RightTag | BottomTag) => this.setTag({ tag, fromPosition: position })} isActive={false} />;
    // }

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

    getTagKey({ tag, position }: { tag?: CenterTag; position: Position }): string {
        let tagKey: string;
        if (!tag) {
            tagKey = 'undefined';
        } else if (isTag(tag)) {
            tagKey = tag.id;
        } else {
            // if (typeof tag === 'string') {
            // tag ID
            tagKey = tag;
            // } else {
            //     tagKey = `add-tag-${tag.isSubtag ? 'subtag' : 'root'}`;
        }
        return `${tagKey}-${position}`;
    }

    // getAddTagProps({ isSubtag, subtagRootTag }: { isSubtag: boolean; subtagRootTag: CenterTag }): AddTagProps {
    //     const { latestRootTag } = this.props.game;
    //     let isFirstTag: boolean;
    //     if (isSubtag) {
    //         isFirstTag = isTag(rootTag) && isFullTag(rootTag) && !rootTag.isRoot;
    //     } else {
    //         isFirstTag = latestRootTag === undefined;
    //     }
    //     return {
    //         saveTag: ({ imageUrl }) => {
    //             this.saveNewTag({ imageUrl, isSubtag });
    //         },
    //         isSubtag,
    //         dateOverride: this.props.dateOverride,
    //         isFirstTag,
    //     };
    // }

    render() {
        logger.info(`[render]`, { state: this.state, props: this.props });
        const className = 'tag-scroller';
        const { centerTag, rootTagLeftTag, rootTagRightTag, topTag, bottomTag } = this.state;

        const centerTagElement = <Tag key={this.getTagKey({ tag: centerTag, position: 'centerTag' })} tag={centerTag} isActive={true} position="centerTag" />;
        // const leftTagElement = this.getClickableTag({ tag: rootTagLeftTag, position: 'rootTagLeftTag' });
        const topTagElement = (
            <Tag
                key={this.getTagKey({ tag: topTag, position: 'topTag' })}
                tag={topTag}
                selectTag={(tag: RealTag | RightTag | BottomTag) => this.setTag({ tag, fromPosition: 'topTag' })}
                isActive={false}
                position="topTag"
            />
        );

        // we will hide these if we are not viewing a root tag
        let rightTagElement: React.ReactNode | undefined = undefined;
        let leftTagElement: React.ReactNode | undefined = undefined;
        if (centerTag === 'addSubtag' || (isTag(centerTag) && isFullTag(centerTag) && !centerTag.isRoot)) {
            rightTagElement = undefined;
            leftTagElement = undefined;
        } else {
            rightTagElement = (
                <Tag
                    key={this.getTagKey({ tag: rootTagRightTag, position: 'rootTagRightTag' })}
                    tag={rootTagRightTag}
                    selectTag={(tag: RealTag | RightTag | BottomTag) => this.setTag({ tag, fromPosition: 'rootTagRightTag' })}
                    isActive={false}
                    position="rootTagRightTag"
                />
            );
            leftTagElement = (
                <Tag
                    key={this.getTagKey({ tag: rootTagLeftTag, position: 'rootTagLeftTag' })}
                    tag={rootTagLeftTag}
                    selectTag={(tag: RealTag | RightTag | BottomTag) => this.setTag({ tag, fromPosition: 'rootTagLeftTag' })}
                    isActive={false}
                    position="rootTagLeftTag"
                />
            );
        }

        const bottomTagElement = (
            <Tag
                key={this.getTagKey({ tag: bottomTag, position: 'bottomTag' })}
                tag={bottomTag}
                selectTag={(tag: RealTag | RightTag | BottomTag) => this.setTag({ tag, fromPosition: 'rootTagLeftTag' })}
                isActive={false}
                position="bottomTag"
            />
        );

        return (
            <div className={className}>
                <div className="top-tag">{topTagElement}</div>
                <div className="left-tag">{leftTagElement}</div>
                <div className="center-tag">{centerTagElement}</div>
                <div className="right-tag">{rightTagElement}</div>
                <div className="bottom-tag">{bottomTagElement}</div>
            </div>
        );

        // const rightTagElement = this.getClickableTag({ tag: rootTagRightTag, position: 'rootTagRightTag' });
    }

    // render() {
    //     logger.info(`[render]`, { state: this.state, props: this.props });
    //     const className = 'tag-scroller';
    //     const { centerTag, rootTagLeftTag, rootTagRightTag, topTag, bottomTag, addRootTagIsActive, addSubtagIsActive, pendingTagIsActive } = this.state;

    //     // if (!centerTag) {
    //     //     return <div className={className}>Loading...</div>;
    //     // }

    //     // if these tags are 'addTag', then there must be a center tag
    //     const addRootTagElement =
    //         rootTagRightTag === 'addTag' || addRootTagIsActive ? (
    //             <AddTag
    //                 isSubtag={false}
    //                 saveTag={({ imageUrl }) => {
    //                     this.saveNewTag({ imageUrl, isSubtag: false });
    //                 }}
    //                 previousRootTagDate={centerTag ? dayjs(centerTag.postedDate) : undefined}
    //                 dateOverride={this.props.dateOverride}
    //                 setAddTagAsActive={() => this.setState({ addRootTagIsActive: true })}
    //                 isActive={addRootTagIsActive}
    //                 isFirstTag={this.props.game.latestRootTag === undefined}
    //             />
    //         ) : undefined;

    //     const addSubtagElement =
    //         bottomTag === 'addTag' || addSubtagIsActive ? (
    //             <AddTag
    //                 isSubtag={true}
    //                 saveTag={({ imageUrl }) => {
    //                     this.saveNewTag({ imageUrl, isSubtag: true, rootTagId: topTag!.isRoot ? topTag!.id : topTag!.rootTagId });
    //                 }}
    //                 dateOverride={this.props.dateOverride}
    //                 setAddTagAsActive={() => this.setState({ addSubtagIsActive: true })}
    //                 isActive={addSubtagIsActive}
    //                 isFirstTag={centerTag!.isRoot}
    //             />
    //         ) : undefined;

    //     let centerTagElement: React.ReactNode | undefined = undefined;
    //     let leftTagElement: React.ReactNode | undefined = undefined;
    //     let topTagElement: React.ReactNode | undefined = undefined;
    //     let rightTagElement: React.ReactNode | undefined = undefined;
    //     let bottomTagElement: React.ReactNode | undefined = undefined;

    //     if (pendingTagIsActive || addRootTagIsActive) {
    //         // it means we are viewing a fake root tag - the left tag is the center tag, and hide subtags
    //         if (pendingTagIsActive) {
    //             centerTagElement = <Tag tag={rootTagRightTag as PendingTagType} isActive={true} />;
    //         } else {
    //             centerTagElement = addRootTagElement;
    //         }
    //         // handle case where there is no root tag, only add tag
    //         leftTagElement = this.getMinimalTag({ tag: centerTag, position: 'rootTagLeftTag' });
    //     } else if (addSubtagIsActive) {
    //         // we are viewing a subtags, so the side tags will remain hidden
    //         topTagElement = this.getMinimalTag({ tag: centerTag, position: 'topTag' });
    //         centerTagElement = addSubtagElement;
    //     } else if (centerTag) {
    //         logger.info(`[render] in centerTag`);
    //         centerTagElement = <Tag tag={centerTag} />;
    //         if (centerTag.isRoot) {
    //             logger.info(`[render] in isRoot`, { rootTagRightTag });
    //             if (rootTagRightTag === 'addTag') {
    //                 rightTagElement = addRootTagElement;
    //             } else if (rootTagRightTag && isFullTag(rootTagRightTag)) {
    //                 rightTagElement = this.getMinimalTag({ tag: rootTagRightTag, position: 'rootTagRightTag' });
    //             }
    //             leftTagElement = this.getMinimalTag({ tag: rootTagLeftTag, position: 'rootTagLeftTag' });
    //         }
    //         bottomTagElement = bottomTag === 'addTag' ? addSubtagElement : this.getMinimalTag({ tag: bottomTag, position: 'bottomTag' });
    //         topTagElement = this.getMinimalTag({ tag: topTag, position: 'topTag' });
    //     }

    //     // const centerTagElement = activeAddTag ?? <Tag tag={centerTag} />;

    //     // // these are the easy ones - we will never display a fake tag here
    //     // const leftTagElement = this.getMinimalTag(leftTag);
    //     // const topTagElement = this.getMinimalTag(topTag);

    //     // // we only rendered the right / bottom tag if it would be next or active, so we just need to check that it is not active
    //     // const rightTagElement = addRootTag && !addTagIsActive ? addRootTag : this.getMinimalTag(rightTag);
    //     // const bottomTagElement = addSubtag && !addTagIsActive ? addSubtag : this.getMinimalTag(bottomTag);

    //     return (
    //         <div className={className}>
    //             <div className="top-tag">{topTagElement}</div>
    //             <div className="left-tag">{leftTagElement}</div>
    //             <div className="center-tag">{centerTagElement}</div>
    //             <div className="right-tag">{rightTagElement}</div>
    //             <div className="bottom-tag">{bottomTagElement}</div>
    //         </div>
    //     );
    // }

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
