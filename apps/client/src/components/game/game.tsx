import { Dayjs } from 'dayjs';
import React from 'react';

import { GameDto, GameRoles, TagDto, UserDto } from '@biketag/models';
import { PlayerScores } from '@biketag/models/src/api/score';
import { Logger } from '@biketag/utils';

import { ApiManager } from '../../api';
import { Table } from '../common/table';
import { TagScroller } from './tagScoller';

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
        let playerDetailsTable = this.getPlayerDetailsTable();
        playerDetailsTable = this.sortPlayerDetailsTable({ column: 1, sortAscendingOverride: false, playerDetailsTable });
        this.state = {
            isCreator: this.props.game.creator.id === this.props.user.id,
            playerDetailsTable: playerDetailsTable,
            currentRootTag: this.props.game.latestRootTag,
            sortColumn: 1, // points column
            sortedAscending: false,
            scoresCollapsed: true,
        };
    }

    sortPlayerDetailsTable({
        column,
        sortAscendingOverride,
        playerDetailsTable,
        setState = false,
    }: {
        column: number;
        sortAscendingOverride?: boolean;
        playerDetailsTable?: PlayerDetailsTableRow[];
        setState?: boolean;
    }): PlayerDetailsTableRow[] {
        logger.info(`[sortPlayerDetailsTable]`, { column, sortAscendingOverride, playerDetailsTable, setState });
        let field: keyof PlayerScores | 'name';
        switch (column) {
            case 0:
                field = 'name';
                break;
            case 1:
                field = 'points';
                break;
            case 2:
                field = 'totalTagsPosted';
                break;
            case 3:
                field = 'tagsWon';
                break;
            case 4:
                field = 'newTagsPosted';
                break;
            default:
                field = 'tagsPostedOnTime';
        }
        logger.info(`[sortPlayerDetailsTable] field`, { field });

        // sort the name column ascending the first time, but the others descending
        const sortAscending = sortAscendingOverride ?? (this.state.sortColumn === column ? !this.state.sortedAscending : field === 'name');

        logger.info(`[sortPlayerDetailsTable] sortAscending`, { sortAscending });
        const valToSort = playerDetailsTable ?? this.state.playerDetailsTable;
        const sortedPlayerDetails = [...valToSort].sort((a, b) => {
            const aVal = field === 'name' ? a.name : a[field];
            const bVal = field === 'name' ? b.name : b[field];

            logger.info(`[sortPlayerDetailsTable] comparing`, { aVal, bVal });

            let compVal: number;
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                compVal = aVal.localeCompare(bVal);
            } else {
                compVal = (aVal as number) - (bVal as number);
            }

            if (sortAscending) {
                return compVal;
            } else {
                return -compVal;
            }
        });
        logger.info(`[sortPlayerDetailsTable] result`, { sortedPlayerDetails });
        if (setState) {
            this.setState({ playerDetailsTable: sortedPlayerDetails, sortColumn: column, sortedAscending: sortAscending });
        }
        return sortedPlayerDetails;
    }

    createNewRootTag(tag: TagDto): void {
        const latestRootTag = tag;
        const updateParams = { latestRootTag };
        this.props.updateGame(updateParams);
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
            let playerDetailsTable = this.getPlayerDetailsTable();
            playerDetailsTable = this.sortPlayerDetailsTable({ column: this.state.sortColumn, sortAscendingOverride: this.state.sortedAscending, playerDetailsTable });
            this.setState({ playerDetailsTable, currentRootTag: game.latestRootTag });
        });
    }

    render() {
        const { game } = this.props;

        // const headers = ['Name', 'Total points', 'Total tags posted', 'Tags won', 'New tags posted', 'Tags posted on time'];
        // const tableHeaders = headers.map((header, index) => {
        //     return (
        //         <th key={index} className="clickable-text" onClick={() => this.sortPlayerDetailsTable({ column: index, setState: true })}>
        //             {header}
        //             {this.state.sortColumn === index ? (this.state.sortedAscending ? '▲' : '▼') : ''}
        //         </th>
        //     );
        // });

        return (
            <div className="game-view">
                <div>
                    <h1>{game.name}</h1>
                </div>
                <div>Created by: {game.creator.name}</div>
                <div>
                    <input type="button" value="Refresh game" onClick={() => this.refreshGame()}></input>
                </div>
                <div>
                    <h2 className="clickable-text" onClick={() => this.setState({ scoresCollapsed: !this.state.scoresCollapsed })}>
                        {this.state.scoresCollapsed ? '▶' : '▼'}Scoreboard
                    </h2>
                </div>
                <div hidden={this.state.scoresCollapsed}>
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
                    />
                </div>
                <TagScroller
                    key={`rootTagView-${game.latestRootTag?.id}`}
                    isSubtag={false}
                    game={game}
                    user={this.props.user}
                    createNewTag={(tag: TagDto) => this.createNewRootTag(tag)}
                    refreshScores={() => this.refreshGame()}
                    dateOverride={this.props.dateOverride}
                    // setCurrentRootTag={(tag: TagDto) => this.setCurrentRootTag(tag)}
                />
                {/* {this.state.currentRootTag && (
                    <TagView
                        key={this.state.currentRootTag.id}
                        isSubtag={true}
                        game={game}
                        user={this.props.user}
                        subtagRootTag={this.state.currentRootTag}
                        refreshScores={() => this.refreshScores()}
                    />
                )} */}
                {this.state.isCreator && <input type="button" name="editGame" value="Edit game" onClick={() => this.props.editGame()}></input>}
                {this.state.isCreator && <input type="button" name="deleteGame" value="Delete game" onClick={() => this.props.deleteGame()}></input>}
                <br></br>
                <input type="button" name="goBack" value="Go back" onClick={() => this.props.doneViewingGame()}></input>
            </div>
        );
    }
}
