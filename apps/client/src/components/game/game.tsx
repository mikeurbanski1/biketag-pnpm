import { Dayjs } from 'dayjs';
import React from 'react';

import { GameDto, GameRoles, TagDto, UserDto } from '@biketag/models';
import { PlayerScores } from '@biketag/models/src/api/score';
import { Logger } from '@biketag/utils';

import { ApiManager } from '../../api';
import { TagScroller } from './tagScoller';

import '../../styles/game.css';

import { Table } from '../common/table';

const logger = new Logger({ prefix: '[ViewGame]' });

type PlayerTableRole = GameRoles | 'OWNER';

type PlayerDetailsTableRow = PlayerScores & {
    id: string;
    name: string;
    role: string;
    [key: string]: string | number;
};

interface ViewGameState {
    isCreator: boolean;
    playerDetailsTable: PlayerDetailsTableRow[];
    currentRootTag?: TagDto;
    sortColumn: number;
    sortedAscending: boolean;
    scoresCollapsed: boolean;
    showingGameAdminButtons: boolean;
    userCanAddRootTag: boolean;
    userCanAddSubtag: boolean;
    viewingGameDetails: boolean;
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
            sortColumn: 1, // points column
            sortedAscending: false,
            scoresCollapsed: true,
            showingGameAdminButtons: false,
            // these are the two conditions we for sure know are true
            userCanAddRootTag: latestRootTag === undefined,
            // a root tag exists, and there is no next tag, and we did not post it
            userCanAddSubtag: latestRootTag ? !latestRootTag.nextTag && latestRootTag.creator.id !== this.props.user.id : false,
            viewingGameDetails: false,
        };
    }

    componentDidMount(): void {
        this.setUserCanAddRootTag();
        this.setUserCanAddSubtag();
    }

    setUserCanAddRootTag(): void {
        ApiManager.tagApi.canUserAddTag({ userId: this.props.user.id, gameId: this.props.game.id, dateOverride: this.props.dateOverride }).then((userCanAddRootTag) => {
            logger.info(`[createNewSubtag] userCanAddRootTag result`, { userCanAddRootTag });
            this.setState({ userCanAddRootTag });
        });
    }

    setUserCanAddSubtag(): void {
        if (this.state.currentRootTag) {
            ApiManager.tagApi.canUserAddSubtag({ userId: this.props.user.id, tagId: this.state.currentRootTag.id }).then((userCanAddSubtag) => {
                logger.info(`[createNewSubtag] userCanAddSubtag result`, { userCanAddSubtag });
                this.setState({ userCanAddSubtag });
            });
        }
    }

    // private sortPlayerDetailsTable({
    //     column,
    //     sortAscendingOverride,
    //     playerDetailsTable,
    //     setState = false,
    // }: {
    //     column: number;
    //     sortAscendingOverride?: boolean;
    //     playerDetailsTable?: PlayerDetailsTableRow[];
    //     setState?: boolean;
    // }): PlayerDetailsTableRow[] {
    //     logger.info(`[sortPlayerDetailsTable]`, { column, sortAscendingOverride, playerDetailsTable, setState });
    //     let field: keyof PlayerScores | 'name';
    //     switch (column) {
    //         case 0:
    //             field = 'name';
    //             break;
    //         case 1:
    //             field = 'points';
    //             break;
    //         case 2:
    //             field = 'totalTagsPosted';
    //             break;
    //         case 3:
    //             field = 'tagsWon';
    //             break;
    //         case 4:
    //             field = 'newTagsPosted';
    //             break;
    //         default:
    //             field = 'tagsPostedOnTime';
    //     }
    //     logger.info(`[sortPlayerDetailsTable] field`, { field });

    //     // sort the name column ascending the first time, but the others descending
    //     const sortAscending = sortAscendingOverride ?? (this.state.sortColumn === column ? !this.state.sortedAscending : field === 'name');

    //     logger.info(`[sortPlayerDetailsTable] sortAscending`, { sortAscending });
    //     const valToSort = playerDetailsTable ?? this.state.playerDetailsTable;
    //     const sortedPlayerDetails = [...valToSort].sort((a, b) => {
    //         const aVal = field === 'name' ? a.name : a[field];
    //         const bVal = field === 'name' ? b.name : b[field];

    //         logger.info(`[sortPlayerDetailsTable] comparing`, { aVal, bVal });

    //         let compVal: number;
    //         if (typeof aVal === 'string' && typeof bVal === 'string') {
    //             compVal = aVal.localeCompare(bVal);
    //         } else {
    //             compVal = (aVal as number) - (bVal as number);
    //         }

    //         if (sortAscending) {
    //             return compVal;
    //         } else {
    //             return -compVal;
    //         }
    //     });
    //     logger.info(`[sortPlayerDetailsTable] result`, { sortedPlayerDetails });
    //     if (setState) {
    //         this.setState({ playerDetailsTable: sortedPlayerDetails, sortColumn: column, sortedAscending: sortAscending });
    //     }
    //     return sortedPlayerDetails;
    // }

    createNewRootTag(tag: TagDto): void {
        const latestRootTag = tag;
        const updateParams = { latestRootTag };
        this.props.updateGame(updateParams);
        this.setState({ userCanAddRootTag: false });
        this.setCurrentRootTag(tag);
    }

    createNewSubtag(): void {
        this.setState({ userCanAddSubtag: false });
        this.setUserCanAddRootTag();
    }

    setCurrentRootTag(tag: TagDto): void {
        this.setState({ currentRootTag: tag });
    }

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
            // playerDetailsTable = this.sortPlayerDetailsTable({ column: this.state.sortColumn, sortAscendingOverride: this.state.sortedAscending, playerDetailsTable });
            this.setState({ playerDetailsTable, currentRootTag: game.latestRootTag });
        });
    }

    getTagScrollerGameBody(): React.ReactNode {
        const { game } = this.props;
        return (
            <div className="tag-view">
                <TagScroller
                    key={`rootTagView-${game.latestRootTag?.id}`}
                    isSubtag={false}
                    game={game}
                    user={this.props.user}
                    createNewTag={(tag: TagDto) => this.createNewRootTag(tag)}
                    refreshScores={() => this.refreshGame()}
                    dateOverride={this.props.dateOverride}
                    userCanAddTag={this.state.userCanAddRootTag}
                    setCurrentRootTag={(tag: TagDto) => this.setCurrentRootTag(tag)}
                    isMinimized={false}
                />
                {this.state.currentRootTag && (
                    <TagScroller
                        key={`subtag-${this.state.currentRootTag.id}`}
                        isSubtag={true}
                        game={this.props.game}
                        user={this.props.user}
                        subtagRootTag={this.state.currentRootTag}
                        refreshScores={() => this.refreshGame()}
                        createNewTag={() => this.createNewSubtag()}
                        dateOverride={this.props.dateOverride}
                        userCanAddTag={this.state.userCanAddSubtag}
                        isMinimized={true}
                    />
                )}
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
