import React, { ReactNode } from 'react';
import { Apis } from '../api';

interface LandingState {
    loadingGames: boolean;
    games: string[];
}

interface LandingProps {
    id: string;
    name: string;
    apis: Apis;
}

export class Landing extends React.Component<LandingProps, LandingState> {
    constructor(props: LandingProps) {
        super(props);
        this.state = {
            loadingGames: true,
            games: []
        };
    }

    componentDidMount(): void {
        this.props.apis.gamesApi.getGamesForPlayer({ userId: this.props.id }).then((games) => {
            this.setState({
                loadingGames: false,
                games: games.map((game) => game.name)
            });
        });
    }

    render(): ReactNode {
        return (
            <div>
                <h1>{this.state.loadingGames ? 'Loading games...' : `Your games: ${this.state.games.join(', ')}`}</h1>
            </div>
        );
    }
}
