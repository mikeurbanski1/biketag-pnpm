import { Dayjs } from 'dayjs';
import React from 'react';

import { GameDto, GameRoles, isFullTag, PendingTag, PlayerScores, TagDto, UserDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from '../../api';

import '../../styles/game.css';

import { Table } from '../common/table';
import { AddTag } from './addTag';
import { Tag } from './tag';

const logger = new Logger({ prefix: '[ViewGame]' });

type PlayerTableRole = GameRoles | 'OWNER';

type PlayerDetailsTableRow = PlayerScores & {
    id: string;
    name: string;
    role: string;
    [key: string]: string | number;
};

type Position = 'top' | 'right' | 'bottom' | 'left' | 'center';

interface ViewGameState {
    isCreator: boolean;
    playerDetailsTable: PlayerDetailsTableRow[];
    currentRootTag?: TagDto;
    currentTag?: TagDto;
    showingGameAdminButtons: boolean;
    userCanAddRootTag: boolean;
    userCanAddSubtag: boolean;
    viewingGameDetails: boolean;
    showingPendingTag: boolean;
    showingAddRootTag: boolean;
    showingAddSubtag: boolean;
}

interface ViewGameProps {
    user: UserDto;
    game: GameDto;
    updateGame: (updateParams: Partial<GameDto>) => void;
    setGame: (game: GameDto) => void;
    doneViewingGame: () => void;
    editGame: () => void;
    deleteGame: () => void;
    dateOverride: Dayjs;
}

export class Game extends React.Component<ViewGameProps, ViewGameState> {
    constructor(props: ViewGameProps) {
        super(props);
        const playerDetailsTable = this.getPlayerDetailsTable();
        // playerDetailsTable = this.sortPlayerDetailsTable({ column: 1, sortAscendingOverride: false, playerDetailsTable });
        const { latestRootTag } = this.props.game;
        this.state = {
            isCreator: this.props.game.creator.id === this.props.user.id,
            playerDetailsTable: playerDetailsTable,
            currentRootTag: this.props.game.latestRootTag,
            currentTag: this.props.game.latestRootTag,
            showingGameAdminButtons: false,
            viewingGameDetails: false,
            showingPendingTag: false,
            userCanAddRootTag: latestRootTag === undefined,
            userCanAddSubtag: latestRootTag !== undefined && !latestRootTag.nextTagId && latestRootTag.creator.id !== props.user.id,
            showingAddRootTag: latestRootTag === undefined,
            showingAddSubtag: false,
        };
    }

    async componentDidMount(): Promise<void> {
        const stateUpdates: Partial<ViewGameState> = {};
        if (!this.state.userCanAddRootTag) {
            const userCanAddRootTag = await ApiManager.tagApi.canUserAddTag({ userId: this.props.user.id, gameId: this.props.game.id, dateOverride: this.props.dateOverride });
            stateUpdates.userCanAddRootTag = userCanAddRootTag;
        }
        if (!this.state.userCanAddSubtag && this.state.currentRootTag) {
            const userCanAddSubtag = await ApiManager.tagApi.canUserAddSubtag({ userId: this.props.user.id, tagId: this.state.currentRootTag!.id });
            stateUpdates.userCanAddSubtag = userCanAddSubtag;
        }
        this.setState(stateUpdates as ViewGameState);
    }

    fetchAndSetUserCanAddRootTag(): void {
        ApiManager.tagApi.canUserAddTag({ userId: this.props.user.id, gameId: this.props.game.id, dateOverride: this.props.dateOverride }).then((userCanAddRootTag) => {
            this.setState({ userCanAddRootTag });
        });
    }

    fetchAndSetUserCanAddSubtag(tagOverride?: TagDto): void {
        if (!this.state.currentRootTag) {
            this.setState({ userCanAddSubtag: false });
        } else {
            ApiManager.tagApi.canUserAddSubtag({ userId: this.props.user.id, tagId: tagOverride?.id ?? this.state.currentRootTag.id }).then((userCanAddSubtag) => {
                this.setState({ userCanAddSubtag });
            });
        }
    }

    createNewRootTag({ imageUrl }: { imageUrl: string }): void {
        ApiManager.tagApi.createTag({ imageUrl, gameId: this.props.game.id, isRoot: true }).then((tag) => {
            const latestRootTag = tag;
            const updateParams = { latestRootTag };
            this.props.updateGame(updateParams);
            this.setState({
                userCanAddRootTag: false,
                userCanAddSubtag: false,
                currentRootTag: tag,
                currentTag: tag,
                showingAddRootTag: false,
            });
            ApiManager.tagApi.updateTagInCache({
                tagId: tag.previousRootTagId,
                update: { nextRootTagId: tag.id },
            });
        });
        // this.setState({ userCanAddRootTag: false });
        // this.setCurrentRootTag(tag);
    }

    createNewSubtag({ imageUrl }: { imageUrl: string }): void {
        ApiManager.tagApi.createTag({ imageUrl, gameId: this.props.game.id, isRoot: false, rootTagId: this.state.currentRootTag!.id }).then((tag) => {
            const updateParams = {
                userCanAddSubtag: false,
                currentTag: tag,
                showingAddSubtag: false,
            };
            if (tag.rootTagId! === this.props.game.latestRootTag!.id) {
                this.fetchAndSetUserCanAddRootTag();
            }
            this.setState(updateParams as ViewGameState);
            ApiManager.tagApi.updateTagInCache({
                tagId: tag.parentTagId,
                update: { nextTagId: tag.id },
            });
            ApiManager.tagApi.updateTagInCache({
                tagId: tag.rootTagId,
                update: { lastTagInChainId: tag.id },
            });
        });
        // this.setState({ userCanAddSubtag: false });
        // this.setUserCanAddRootTag();
    }

    // createNewSubtag(): void {
    //     this.setState({ userCanAddSubtag: false });
    //     this.setUserCanAddRootTag();
    // }

    // setCurrentRootTag(tag: TagDto): void {
    //     this.setState({ currentRootTag: tag });
    // }

    // setFakeRootTagActive(fakeRootTagActive: boolean): void {
    //     this.setState({ fakeRootTagActive });
    // }

    getPlayerDetailsTable(game?: GameDto): PlayerDetailsTableRow[] {
        if (!game) {
            game = this.props.game;
        }
        logger.info(`[getPlayerDetailsTable]`, { game });
        return [{ id: game.creator.id, name: game.creator.name, role: 'OWNER' as PlayerTableRole, ...game.gameScore.playerScores[game.creator.id] }].concat(
            game.players.map((player) => {
                return { id: player.user.id, name: player.user.name, role: player.role, ...game.gameScore.playerScores[player.user.id] };
            })
        );
    }

    refreshGame(): void {
        ApiManager.gameApi.getGame({ id: this.props.game.id }).then((game) => {
            logger.info(`[refreshScores] got game`, { game });
            this.props.setGame(game);
            const playerDetailsTable = this.getPlayerDetailsTable();
            this.setState({ playerDetailsTable, currentRootTag: game.latestRootTag });
        });
    }

    setCurrentTag(tag: TagDto | PendingTag): void {
        if (isFullTag(tag)) {
            if (tag.id === this.state.currentTag?.id) {
                this.setState({
                    showingAddRootTag: false,
                    showingAddSubtag: false,
                    showingPendingTag: false,
                });
            } else {
                let updateCanAddSubtag = false;
                const stateUpdate: Partial<ViewGameState> = { currentTag: tag, showingAddRootTag: false, showingAddSubtag: false };
                if (tag.isRoot) {
                    stateUpdate.currentRootTag = tag;
                    if (!tag.nextTagId) {
                        stateUpdate.userCanAddSubtag = true;
                    } else {
                        updateCanAddSubtag = true;
                    }
                }
                this.setState(stateUpdate as ViewGameState);
                if (updateCanAddSubtag) {
                    this.fetchAndSetUserCanAddSubtag(tag);
                }
            }
        } else {
            this.setState({ showingPendingTag: true });
        }
    }

    getTagKey({ tag }: { tag?: TagDto | PendingTag | string }): string {
        let tagKey: string;
        if (!tag) {
            tagKey = 'undefined';
        } else if (typeof tag === 'object') {
            tagKey = `tag-${tag.id}`;
        } else {
            tagKey = `id-${tag}`;
        }
        return tagKey;
    }

    getTagComponent({ tag, isActive, position }: { tag: TagDto | PendingTag | string; isActive: boolean; position: Position }): React.ReactNode {
        let selectTag: ((tag: TagDto | PendingTag) => void) | undefined;
        // if the tag is a real, not pending tag, then the callback actually selects it
        if (!isActive) {
            selectTag = (tag: TagDto | PendingTag) => this.setCurrentTag(tag);
        }
        return <Tag key={this.getTagKey({ tag })} tag={tag} isActive={isActive} selectTag={selectTag} position={position} />;
    }

    getTagScrollerGameBody(): React.ReactNode {
        const { game } = this.props;
        const { userCanAddRootTag, userCanAddSubtag, currentRootTag, currentTag, showingAddRootTag, showingAddSubtag, showingPendingTag } = this.state;

        let centerTagElement: React.ReactNode | undefined = undefined;
        let leftTagElement: React.ReactNode | undefined = undefined;
        let rightTagElement: React.ReactNode | undefined = undefined;
        let topTagElement: React.ReactNode | undefined = undefined;
        let bottomTagElement: React.ReactNode | undefined = undefined;

        const addRootTag = (
            <AddTag
                key="add-root-tag"
                saveTag={({ imageUrl: string }) => this.createNewRootTag({ imageUrl: string })}
                setAddTagAsActive={() => this.setState({ showingAddRootTag: true })}
                isSubtag={false}
                dateOverride={this.props.dateOverride}
                isActive={showingAddRootTag}
                isFirstTag={!game.latestRootTag}
            />
        );

        const addSubtag = (
            <AddTag
                key="add-subtag"
                saveTag={({ imageUrl: string }) => this.createNewSubtag({ imageUrl: string })}
                setAddTagAsActive={() => this.setState({ showingAddSubtag: true })}
                isSubtag={true}
                dateOverride={this.props.dateOverride}
                isActive={showingAddSubtag}
                isFirstTag={!currentRootTag?.nextTagId}
            />
        );

        if (showingAddRootTag) {
            centerTagElement = addRootTag;
            if (currentTag) {
                leftTagElement = this.getTagComponent({ tag: currentTag, isActive: false, position: 'left' });
            }
        } else if (showingAddSubtag) {
            centerTagElement = addSubtag;
            if (currentTag) {
                topTagElement = this.getTagComponent({ tag: currentTag, isActive: false, position: 'top' });
            }
        } else if (showingPendingTag) {
            centerTagElement = this.getTagComponent({ tag: game.pendingRootTag!, isActive: true, position: 'center' });
            if (currentTag) {
                leftTagElement = this.getTagComponent({ tag: currentTag, isActive: false, position: 'left' });
            }
        } else if (currentTag) {
            // showing an actual tag - this will always be true, but we have a type assertion now
            centerTagElement = this.getTagComponent({ tag: currentTag, isActive: true, position: 'center' });
            if (currentTag.isRoot) {
                if (currentTag.previousRootTagId) {
                    leftTagElement = this.getTagComponent({ tag: currentTag.previousRootTagId, isActive: false, position: 'left' });
                }
                if (currentTag.id === game.latestRootTag!.id) {
                    if (game.pendingRootTag) {
                        rightTagElement = this.getTagComponent({ tag: game.pendingRootTag, isActive: false, position: 'right' });
                    } else if (userCanAddRootTag) {
                        rightTagElement = addRootTag;
                    }
                } else if (currentTag.nextRootTagId) {
                    rightTagElement = this.getTagComponent({ tag: currentTag.nextRootTagId, isActive: false, position: 'right' });
                }
                if (currentTag.nextTagId) {
                    bottomTagElement = this.getTagComponent({ tag: currentTag.nextTagId, isActive: false, position: 'bottom' });
                } else if (userCanAddSubtag) {
                    bottomTagElement = addSubtag;
                }
            } else {
                if (currentTag.parentTagId) {
                    topTagElement = this.getTagComponent({ tag: currentTag.parentTagId, isActive: false, position: 'top' });
                }
                if (currentTag.nextTagId) {
                    bottomTagElement = this.getTagComponent({ tag: currentTag.nextTagId, isActive: false, position: 'bottom' });
                } else if (userCanAddSubtag) {
                    bottomTagElement = addSubtag;
                }
            }
        }

        return (
            <div className="tag-scroller">
                <div className="top-tag">{topTagElement}</div>
                <div className="left-tag">{leftTagElement}</div>
                <div className="center-tag">{centerTagElement}</div>
                <div className="right-tag">{rightTagElement}</div>
                <div className="bottom-tag">{bottomTagElement}</div>
            </div>
        );
    }

    getGameDetailsGameBody(): React.ReactNode {
        const { game } = this.props;
        const isCreator = game.creator.id === this.props.user.id;
        return (
            <div className="game-details">
                <div className={isCreator ? 'clickable-text' : ''} onClick={isCreator ? () => this.setState({ showingGameAdminButtons: !this.state.showingGameAdminButtons }) : undefined}>
                    Created by: {game.creator.name} {isCreator && (this.state.showingGameAdminButtons ? '▼' : '▶')}
                </div>
                <div className="game-admin-buttons button-pair" hidden={!isCreator || !this.state.showingGameAdminButtons}>
                    <button className="game-admin-button" onClick={() => this.props.editGame()}>
                        Edit game
                    </button>
                    <button className="game-admin-button" onClick={() => this.props.deleteGame()}>
                        Delete game
                    </button>
                </div>
                <div>Scoreboard</div>
                <Table<PlayerDetailsTableRow>
                    data={this.state.playerDetailsTable}
                    columnMapping={[
                        { attribute: 'name', header: 'Name' },
                        { attribute: 'points', header: 'Total points', defaultDescending: true },
                        { attribute: 'totalTagsPosted', header: 'Total tags posted', defaultDescending: true },
                        { attribute: 'tagsWon', header: 'Tags won', defaultDescending: true },
                        { attribute: 'newTagsPosted', header: 'New tags posted', defaultDescending: true },
                        { attribute: 'tagsPostedOnTime', header: 'Tags posted on time', defaultDescending: true },
                    ]}
                    initialSort={{ column: 'points', ascending: false }}
                    tableClassName="player-details-table"
                    numericColumns={[1, 2, 3, 4, 5]}
                />
            </div>
        );
    }

    render() {
        const { game } = this.props;
        const backText = this.state.viewingGameDetails ? '← Back to tags' : '← Back to games';
        const backOnClick = this.state.viewingGameDetails ? () => this.setState({ viewingGameDetails: false }) : () => this.props.doneViewingGame();

        return (
            <div className="game-view">
                <div className="game-header">
                    <span className="clickable-text" onClick={backOnClick}>
                        {backText}
                    </span>
                    <span className="title">
                        {game.name}
                        <span className="clickable-text" onClick={() => this.refreshGame()}>
                            ↻
                        </span>
                    </span>
                    <span>
                        {this.state.viewingGameDetails ? (
                            ''
                        ) : (
                            <span className="clickable-text" onClick={() => this.setState({ viewingGameDetails: true })}>
                                Game details →
                            </span>
                        )}
                    </span>
                </div>
                {this.state.viewingGameDetails ? this.getGameDetailsGameBody() : this.getTagScrollerGameBody()}
            </div>
        );
    }
}
