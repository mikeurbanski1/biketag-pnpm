import React, { ReactNode } from 'react';
import { GameDto, UserDto } from '@biketag/models';
import { CreateEditGame } from './createEditGame';
import { ViewGame } from './viewGame';
import { ApiManager } from '../api';

interface LandingState {
    loadingGames: boolean;
    games: GameDto[];
    game?: GameDto;
    creatingGame: boolean;
}

interface LandingProps {
    user: UserDto;
}

export class Landing extends React.Component<LandingProps, LandingState> {
    constructor(props: LandingProps) {
        super(props);
        this.state = {
            loadingGames: true,
            games: [],
            creatingGame: false
        };
        this.doneCreatingGame = this.doneCreatingGame.bind(this);
        // this.editGame = this.editGame.bind(this);
    }

    componentDidMount(): void {
        this.refreshGames().then(() => this.setState({ loadingGames: false }));
    }

    private async refreshGames(): Promise<void> {
        const games = await ApiManager.gameApi.getGamesForPlayer({ userId: this.props.user.id });
        console.log('got games:', games);
        this.setState({
            games
        });
    }

    doneCreatingGame(game?: GameDto): void {
        this.setState({
            loadingGames: true
        });
        this.refreshGames().then(() => {
            if (game) {
                this.setState({
                    game,
                    creatingGame: false,
                    loadingGames: false
                });
            } else {
                this.setState({
                    creatingGame: false,
                    loadingGames: false
                });
            }
        });
    }

    editGame(): void {
        this.setState({
            creatingGame: true
        });
    }

    deleteGame(): void {
        this.setState({
            game: undefined,
            loadingGames: true
        });
        ApiManager.gameApi.deleteGame({ gameId: this.state.game!.id }).then(() => this.refreshGames().then(() => this.setState({ loadingGames: false })));
    }

    doneViewingGame(): void {
        this.setState({
            game: undefined
        });
    }

    render(): ReactNode {
        if (this.state.loadingGames) {
            return <h1>Loading games...</h1>;
        }

        if (!this.state.creatingGame && !this.state.game) {
            return (
                <div>
                    <div>
                        <h1>Your games:</h1>
                        <ul>
                            {this.state.games.map((game) => (
                                <a onClick={() => this.setState({ game })}>
                                    <li id={game.id} key={game.id}>
                                        {game.name}
                                    </li>
                                </a>
                            ))}
                        </ul>
                    </div>
                    <input type="button" name="createGame" value="Create game" onClick={() => this.setState({ creatingGame: true })}></input>
                </div>
            );
        }

        if (!this.state.creatingGame && this.state.game) {
            return <ViewGame game={this.state.game} user={this.props.user} deleteGame={() => this.deleteGame()} editGame={() => this.editGame()} doneViewingGame={() => this.doneViewingGame()} />;
        }

        return <CreateEditGame user={this.props.user} doneCreatingGame={this.doneCreatingGame} game={this.state.game} />;
    }
}
