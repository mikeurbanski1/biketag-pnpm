import { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@biketag/utils';
import React from 'react';
import { Login } from './components/login';
import { ApiManager } from './api';
import { Landing } from './components/landing';
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

        ApiManager.initialize({ clientId: this.state.clientId });

        logger.info('Client UUID:', { uuid: this.state.clientId });
        localStorage.setItem('clientId', this.state.clientId);
    }

    // componentDidMount(): void {}

    async setUser({ name, id }: { name: string; id: string }) {
        this.setState({
            user: { name, id },
            userId: id,
            state: AppState.LOGGED_IN
        });
        ApiManager.setUser({ userId: id });
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
        ApiManager.setUser({ userId: null });
    }

    render(): ReactNode {
        let inner: ReactNode;

        if (this.state.state === AppState.HOME) {
            inner = <Login key="landing" setUser={({ name, id }: { name: string; id: string }) => this.setUser({ name, id })}></Login>;
        } else if (this.state.state === AppState.LOGGED_IN) {
            inner = [<br></br>, <Landing key="landing" user={this.state.user!}></Landing>, <br></br>];
        }

        return (
            <div className="App">
                <header className="App-header">
                    <h1 key="h1">Bike Tag</h1>
                    {this.state.user && (
                        <p>
                            Logged in as {this.state.user.name} ({this.state.userId})
                        </p>
                    )}
                    <hr></hr>
                    {inner}
                    <hr></hr>
                    {this.state.user && [<input type="button" name="login" value="Log out" onClick={() => this.handleLogOut()}></input>, <br></br>]}
                    <input type="button" name="reset-client-button" value="Reset local client ID" onClick={this.handleResetClient}></input>
                </header>
            </div>
        );
    }
}
