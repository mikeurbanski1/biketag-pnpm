import { GameDto, GameRoles, TagDto, UserDto } from '@biketag/models';
import React from 'react';
// import { Logger } from '@biketag/utils';
import { ApiManager } from '../../api';
import { TagView } from './tagView';

// const logger = new Logger({ prefix: '[ViewGame]' });

type PlayerTableRole = GameRoles | 'OWNER';

interface ViewGameState {
    isCreator: boolean;
    playerDetails: { id: string; name: string; role: PlayerTableRole }[];
    currentRootTag?: TagDto;
}

interface ViewGameProps {
    user: UserDto;
    game: GameDto;
    updateGame: (updateParams: Partial<GameDto>) => void;
    doneViewingGame: () => void;
    editGame: () => void;
    deleteGame: () => void;
}

export class ViewGame extends React.Component<ViewGameProps, ViewGameState> {
    constructor(props: ViewGameProps) {
        super(props);
        this.state = {
            isCreator: this.props.game.creator.id === this.props.user.id,
            playerDetails: this.getPlayerDetails(),
            currentRootTag: this.props.game.latestRootTag
        };
    }

    setCurrentRootTag(tag: TagDto): void {
        this.setState({ currentRootTag: tag });
    }

    createNewRootTag(tag: TagDto): void {
        const latestRootTag = tag;
        const updateParams = { latestRootTag };
        this.props.updateGame(updateParams);
    }

    getPlayerDetails(game?: GameDto): { id: string; name: string; role: PlayerTableRole }[] {
        if (!game) {
            game = this.props.game;
        }
        return game.gameScore.playerScores.map((playerScore) => {
            const role: PlayerTableRole = game.creator.id === playerScore.player.id ? 'OWNER' : game.players.find((p) => p.user.id === playerScore.player.id)!.role;
            return {
                id: playerScore.player.id,
                name: playerScore.player.name,
                role
            };
        });
    }

    refreshScores(): void {
        ApiManager.gameApi.getGame({ id: this.props.game.id }).then((game) => {
            this.props.updateGame(game);
            this.setState({ playerDetails: this.getPlayerDetails(game) });
        });
    }

    render() {
        const { game } = this.props;

        game.gameScore.playerScores.sort((a, b) => b.score - a.score);

        return (
            <div className="game-view">
                <div>
                    <h1>{game.name}</h1>
                </div>
                <div>Created by: {game.creator.name}</div>
                <div>
                    <h2>Players</h2>
                </div>
                <div>
                    <table className="players-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {game.gameScore.playerScores.map((playerScore) => {
                                const role: PlayerTableRole = this.state.playerDetails.find((pd) => pd.id === playerScore.player.id)!.role;
                                return (
                                    <tr key={playerScore.player.id}>
                                        <td>{playerScore.player.name}</td>
                                        <td>{role}</td>
                                        <td>{playerScore.score}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <TagView
                    isSubtag={false}
                    game={game}
                    user={this.props.user}
                    createNewRootTag={(tag: TagDto) => this.createNewRootTag(tag)}
                    refreshScores={() => this.refreshScores()}
                    setCurrentRootTag={(tag: TagDto) => this.setCurrentRootTag(tag)}
                />
                {this.state.currentRootTag && (
                    <TagView
                        key={this.state.currentRootTag.id}
                        isSubtag={true}
                        game={game}
                        user={this.props.user}
                        subtagRootTag={this.state.currentRootTag}
                        refreshScores={() => this.refreshScores()}
                    />
                )}
                {this.state.isCreator && <input type="button" name="editGame" value="Edit game" onClick={() => this.props.editGame()}></input>}
                {this.state.isCreator && <input type="button" name="deleteGame" value="Delete game" onClick={() => this.props.deleteGame()}></input>}
                <br></br>
                <input type="button" name="goBack" value="Go back" onClick={() => this.props.doneViewingGame()}></input>
            </div>
        );
    }
}
