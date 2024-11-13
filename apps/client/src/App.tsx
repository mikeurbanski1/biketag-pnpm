import { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@biketag/utils';
import './App.css';
import React from 'react';
import { Login } from './components/login';
import { Apis, UsersApi } from './api';
import { Landing } from './components/landing';
import { GamesApi } from './api/gamesApi';
import { UserDto } from '@biketag/models';

const logger = new Logger({});

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AppProps {}

enum AppState {
    HOME,
    LOGGED_IN,
    POLL_RESULTS
}

interface AppComponentState {
    state: AppState;
    name?: string;
    loggedIn: boolean;
    clientId: string;
    userId?: string;
    user?: UserDto;
}

export default class App extends React.Component<AppProps, AppComponentState> {
    private readonly usersApi = new UsersApi();
    private readonly gamesApi = new GamesApi();
    private readonly apis: Apis = { usersApi: this.usersApi, gamesApi: this.gamesApi };

    constructor(props: AppProps) {
        super(props);

        const clientId = localStorage.getItem('clientId');
        const name = localStorage.getItem('userName') || undefined;

        logger.info('clientId and userName from local storage:', { clientId, name });

        this.state = {
            state: AppState.HOME,
            name,
            clientId: clientId || uuidv4(),
            loggedIn: false
        };

        logger.info('Client UUID:', { uuid: this.state.clientId });
        localStorage.setItem('clientId', this.state.clientId);
    }

    // componentDidMount(): void {}

    async setUser({ name, id }: { name: string; id: string }) {
        await this.usersApi.login({ name });
        this.setState({
            user: { name, id },
            userId: id,
            state: AppState.LOGGED_IN
        });
    }

    handleResetClient() {
        localStorage.removeItem('clientId');
        window.location.reload();
    }

    handleLogOut() {
        this.setState({
            state: AppState.HOME,
            userId: undefined,
            loggedIn: false,
            user: undefined
        });
    }

    render(): ReactNode {
        let inner;

        if (this.state.state === AppState.HOME) {
            inner = [<Login key="landing" setUser={({ name, id }: { name: string; id: string }) => this.setUser({ name, id })} apis={this.apis}></Login>];
        } else if (this.state.state === AppState.LOGGED_IN) {
            inner = [
                <h1 key="k1">
                    Logged in as {this.state.name} ({this.state.userId})
                </h1>,
                <br></br>,
                <Landing key="landing" user={this.state.user!} apis={this.apis}></Landing>,
                <br></br>,
                <input type="button" name="login" value="Log out" onClick={() => this.handleLogOut()}></input>
            ];
        }

        return (
            <div className="App">
                <header className="App-header">
                    <h1 key="h1">Bike Tag</h1>
                    {inner}
                    <br></br>
                    <input type="button" name="reset-client-button" value="Reset local client ID" onClick={this.handleResetClient}></input>
                </header>
            </div>
        );
    }
}
