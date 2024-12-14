import React from 'react';

import { CreateGameParams, GameDto, GameRoles, UserDto } from '@biketag/models';

import { ApiManager } from '../api';
import { UserBeingAdded } from '../models/user';
import UserSelection from './userSelection';

interface CreateEditGameState {
    gameName: string;
    isNewGame: boolean;
    canSaveGame: boolean;
    loadingUsers: boolean;
    selectedUsers: UserBeingAdded[];
}

interface CreateEditGameProps {
    user: UserDto;
    game?: GameDto;
    doneCreatingGame: (game?: GameDto) => void;
}

export class CreateEditGame extends React.Component<CreateEditGameProps, CreateEditGameState> {
    constructor(props: CreateEditGameProps) {
        super(props);
        const gameName = props.game?.name || '';
        const isNewGame = props.game === undefined;
        this.state = {
            gameName,
            isNewGame,
            canSaveGame: !isNewGame,
            loadingUsers: true,
            selectedUsers: [],
        };
    }

    createEditGame(): void {
        const game: CreateGameParams = {
            name: this.state.gameName,
            creatorId: this.props.user.id,
            players: this.state.selectedUsers
                .filter((user) => user.role !== undefined)
                .map((user) => ({
                    userId: user.user.id,
                    role: user.role!,
                })),
        };

        const callback = (game: GameDto) => {
            console.log('created game:', game);
            this.props.doneCreatingGame(game);
        };
        if (!this.props.game) {
            ApiManager.gameApi.createGame(game).then(callback);
        } else {
            ApiManager.gameApi.updateGame(this.props.game.id, game).then(callback);
        }
    }

    componentDidMount(): void {
        this.refreshUsers().then(() => this.setState({ loadingUsers: false }));
    }

    private getSelectedUsersForGame({ users, game }: { users: UserDto[]; game?: GameDto }): UserBeingAdded[] {
        return users.map((user) => {
            const player = game?.players.find((playerGame) => playerGame.user.id === user.id);
            return {
                user,
                role: player?.role,
            };
        });
    }

    private async refreshUsers(): Promise<void> {
        const users = (await ApiManager.userApi.getUsers()).filter((user) => user.id !== this.props.user.id);
        console.log('got (filtered) users:', users);
        const selectedUsers = this.getSelectedUsersForGame({ game: this.props.game, users }).sort((a, b) => a.user.name.localeCompare(b.user.name));
        this.setState({
            selectedUsers,
        });
    }

    handleNameChange(event: React.ChangeEvent<HTMLInputElement>): void {
        const canCreateGame = event.target.value !== '';
        this.setState({
            canSaveGame: canCreateGame,
            gameName: event.target.value,
        });
    }

    handleUserSelect(index: number, user: UserDto, role?: GameRoles): void {
        console.log(`selected user:`, user, role);
        const selectedUsers = this.state.selectedUsers;
        selectedUsers[index] = { user, role };
        this.setState({
            selectedUsers,
        });
    }

    render() {
        return (
            <div className="flex-column moderate-gap">
                <div className="title">{this.state.isNewGame ? 'Create' : 'Edit'} game</div>
                <input type="text" value={this.state.gameName} name="gameName" placeholder="Game name" onChange={(event) => this.handleNameChange(event)}></input>
                {this.state.loadingUsers ? (
                    <div>Loading users...</div>
                ) : (
                    <div className="user-grid">
                        {this.state.selectedUsers.map((user, index) => (
                            <UserSelection
                                key={user.user.id}
                                user={user.user}
                                gameRole={user.role}
                                index={index}
                                onSelect={(index: number, user: UserDto, role?: GameRoles) => this.handleUserSelect(index, user, role)}
                            />
                        ))}
                    </div>
                )}
                <div className="button-pair">
                    <button type="button" name="goBack" value="Go back" onClick={() => this.props.doneCreatingGame()}>
                        Go back
                    </button>
                    <button
                        type="button"
                        name="createGame"
                        value={`${this.state.isNewGame ? 'Create' : 'Save'} game`}
                        onClick={() => this.createEditGame()}
                        disabled={!this.state.canSaveGame}
                    >{`${this.state.isNewGame ? 'Create' : 'Save'} game`}</button>
                </div>
            </div>
        );
    }
}
