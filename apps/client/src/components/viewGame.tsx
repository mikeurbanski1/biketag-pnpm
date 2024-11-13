import { GameDto, UserDto } from '@biketag/models';
import React from 'react';

interface ViewGameState {
    isCreator: boolean;
}

interface ViewGameProps {
    user: UserDto;
    game: GameDto;
    doneViewingGame: () => void;
    editGame: () => void;
    deleteGame: () => void;
}

export class ViewGame extends React.Component<ViewGameProps, ViewGameState> {
    constructor(props: ViewGameProps) {
        super(props);
        this.state = {
            isCreator: this.props.game.creator.id === this.props.user.id
        };
    }

    render() {
        const { game } = this.props;
        return (
            <div>
                <h1>{game.name}</h1>
                <p>Created by: {game.creator.name}</p>
                <h2>Players</h2>
                <ul>
                    {game.players.map((player) => (
                        <li key={player.user.id}>
                            {player.user.name} - {player.role}
                        </li>
                    ))}
                </ul>
                {this.state.isCreator && <input type="button" name="editGame" value="Edit game" onClick={() => this.props.editGame()}></input>}
                {this.state.isCreator && <input type="button" name="deleteGame" value="Delete game" onClick={() => this.props.deleteGame()}></input>}
                <input type="button" name="goBack" value="Go back" onClick={() => this.props.doneViewingGame()}></input>
            </div>
        );
    }
}
