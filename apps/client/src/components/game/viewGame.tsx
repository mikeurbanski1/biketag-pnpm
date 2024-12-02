import { Dayjs } from 'dayjs';
import React from 'react';

import { GameDto, GameRoles, TagDto, UserDto } from '@biketag/models';
import { PlayerScores } from '@biketag/models/src/api/score';
import { Logger } from '@biketag/utils';

import { ApiManager } from '../../api';
import { TagView } from './tagView';

const logger = new Logger({ prefix: '[ViewGame]' });

type PlayerTableRole = GameRoles | 'OWNER';

type PlayerDetailsTableRow = {
    id: string;
    name: string;
    role: PlayerTableRole;
    scores: PlayerScores;
};

interface ViewGameState {
    isCreator: boolean;
    playerDetailsTable: PlayerDetailsTableRow[];
    currentRootTag?: TagDto;
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

export class ViewGame extends React.Component<ViewGameProps, ViewGameState> {
    constructor(props: ViewGameProps) {
        super(props);
        this.state = {
            isCreator: this.props.game.creator.id === this.props.user.id,
            playerDetailsTable: this.getPlayerDetailsTable(),
            currentRootTag: this.props.game.latestRootTag,
        };
    }

    // setCurrentRootTag(tag: TagDto): void {
    //     this.setState({ currentRootTag: tag });
    // }

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
        return [{ id: game.creator.id, name: game.creator.name, role: 'OWNER' as PlayerTableRole, scores: game.gameScore.playerScores[game.creator.id] }].concat(
            game.players.map((player) => {
                return { id: player.user.id, name: player.user.name, role: player.role, scores: game.gameScore.playerScores[player.user.id] };
            })
        );
    }

    refreshScores(): void {
        ApiManager.gameApi.getGame({ id: this.props.game.id }).then((game) => {
            logger.info(`[refreshScores] got game`, { game });
            this.props.setGame(game);
            this.setState({ playerDetailsTable: this.getPlayerDetailsTable(game), currentRootTag: game.latestRootTag });
        });
    }

    // refreshGame(): void {
    //     this.refreshScores();
    // }

    render() {
        const { game } = this.props;

        const sortedPlayerDetails = this.state.playerDetailsTable.sort((a, b) => b.scores.points - a.scores.points);

        return (
            <div className="game-view">
                <div>
                    <h1>{game.name}</h1>
                </div>
                <div>Created by: {game.creator.name}</div>
                <div>
                    <input type="button" value="Refresh game" onClick={() => this.refreshScores()}></input>
                </div>
                <div>
                    <h2>Players</h2>
                </div>
                <div>
                    <table className="players-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Total points</th>
                                <th>Tags won</th>
                                <th>New tags posted</th>
                                <th>Tags posted on time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedPlayerDetails.map((player) => {
                                return (
                                    <tr key={player.id}>
                                        <td>{player.name}</td>
                                        <td>{player.scores.points}</td>
                                        <td>{player.scores.tagsWon}</td>
                                        <td>{player.scores.newTagsPosted}</td>
                                        <td>{player.scores.tagsPostedOnTime}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <TagView
                    key={`rootTagView-${game.latestRootTag?.id}`}
                    isSubtag={false}
                    game={game}
                    user={this.props.user}
                    createNewTag={(tag: TagDto) => this.createNewRootTag(tag)}
                    refreshScores={() => this.refreshScores()}
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
