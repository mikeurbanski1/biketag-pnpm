import { Dayjs } from 'dayjs';
import React, { ReactNode } from 'react';

import { GameDto, GameSummary, UserDto } from '@biketag/models';

import { ApiManager } from '../api';
import { CreateEditGame } from './createEditGame';
import { Game } from './game/game';

import '../styles/landing.css';

interface LandingState {
    loadingGames: boolean;
    selectedGame?: GameSummary;
    games: GameSummary[];
    creatingGame: boolean;
}

interface LandingProps {
    user: UserDto;
    dateOverride: Dayjs;
}

export class Landing extends React.Component<LandingProps, LandingState> {
    constructor(props: LandingProps) {
        super(props);
        this.state = {
            loadingGames: true,
            games: [],
            creatingGame: false,
        };
        this.doneCreatingGame = this.doneCreatingGame.bind(this);
        // this.editGame = this.editGame.bind(this);
    }

    public componentDidMount(): void {
        this.refreshGames().then(() => this.setState({ loadingGames: false }));
    }

    private async refreshGames(): Promise<void> {
        const games = await ApiManager.gameApi.getGameSummaryForPlayer({ userId: this.props.user.id });
        console.log('got games:', games);
        this.setState({
            games,
        });
    }

    private doneCreatingGame(game?: GameDto): void {
        this.setState({
            loadingGames: true,
        });
        this.refreshGames().then(() => {
            if (game) {
                this.setState({
                    selectedGame: game,
                    creatingGame: false,
                    loadingGames: false,
                });
            } else {
                this.setState({
                    creatingGame: false,
                    loadingGames: false,
                });
            }
        });
    }

    private setGame(game: GameSummary): void {
        this.setState({
            selectedGame: game,
            games: this.state.games.map((g) => (g.id === game.id ? game : g)),
        });
    }

    // updateGame(updateParams: Partial<GameDto>): void {
    //     const game = this.state.game!;
    //     this.setState({
    //         game: {
    //             ...game,
    //             ...updateParams,
    //         },
    //         games: this.state.games.map((g) => (g.id === game.id ? { ...g, ...updateParams } : g)),
    //     });
    // }

    private deleteGame(): void {
        this.setState({
            selectedGame: undefined,
            loadingGames: true,
        });
        ApiManager.gameApi.deleteGame({ gameId: this.state.selectedGame!.id }).then(() => this.refreshGames().then(() => this.setState({ loadingGames: false })));
    }

    private doneViewingGame(): void {
        this.setState({
            selectedGame: undefined,
        });
        this.refreshGames().then(() => this.setState({ loadingGames: false }));
    }

    public render(): ReactNode {
        if (!this.state.creatingGame && !this.state.selectedGame) {
            return (
                <div className="landing">
                    <div className="title">
                        Your games{' '}
                        <span className="clickable-text" onClick={() => this.refreshGames()}>
                            ↻
                        </span>
                    </div>
                    {this.state.loadingGames ? (
                        <div>Loading games...</div>
                    ) : (
                        <div className="game-list">
                            {this.state.games.map((game) => (
                                <div className="clickable-text" key={'a' + game.id} onClick={() => this.setState({ selectedGame: game })}>
                                    {game.name}
                                </div>
                            ))}
                        </div>
                    )}

                    <button onClick={() => this.setState({ creatingGame: true })}>Create game</button>
                </div>
            );
        }

        if (!this.state.creatingGame && this.state.selectedGame) {
            return (
                <Game
                    gameId={this.state.selectedGame.id}
                    user={this.props.user}
                    deleteGame={() => this.deleteGame()}
                    doneViewingGame={() => this.doneViewingGame()}
                    dateOverride={this.props.dateOverride}
                />
            );
        }

        return <CreateEditGame user={this.props.user} doneCreatingGame={this.doneCreatingGame} />;
    }
}
