import dayjs, { Dayjs } from 'dayjs';
import React, { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { UserDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from './api';
import { Landing } from './components/landing';
import { Login } from './components/login';

const logger = new Logger({});

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AppProps {}

enum AppState {
    HOME,
    LOGGED_IN,
    POLL_RESULTS,
}

interface AppComponentState {
    state: AppState;
    name?: string;
    loggedIn: boolean;
    clientId: string;
    userId?: string;
    user?: UserDto;
    dateOverride: Dayjs;
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
            loggedIn: false,
            dateOverride: dayjs(),
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
            state: AppState.LOGGED_IN,
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
            user: undefined,
        });
        ApiManager.setUser({ userId: null });
    }

    handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target['validity'].valid || !dayjs(event.target.value).isValid()) return;
        this.setState({ dateOverride: dayjs(event.target.value) });
    };

    render(): ReactNode {
        let inner: ReactNode;

        if (this.state.state === AppState.HOME) {
            inner = <Login key="login" setUser={({ name, id }: { name: string; id: string }) => this.setUser({ name, id })}></Login>;
        } else if (this.state.state === AppState.LOGGED_IN) {
            inner = [<br key="br1"></br>, <Landing key="landing" user={this.state.user!} dateOverride={this.state.dateOverride}></Landing>, <br key="br2"></br>];
        }

        const loggedIn = this.state.user ? (
            <span className="logged-in-text">
                Logged in as {this.state.user.name}{' '}
                <button name="login" value="Log out" onClick={() => this.handleLogOut()}>
                    Log out
                </button>
            </span>
        ) : undefined;

        return (
            <div className="App">
                <div>Bike Tag! {loggedIn}</div>
                <div>
                    Date override: <input aria-label="Date" type="date" defaultValue={this.state.dateOverride.format('YYYY-MM-DD')} onChange={(event) => this.handleDateChange(event)} />
                </div>
                <hr></hr>
                {inner}
                {/* <input type="button" name="reset-client-button" value="Reset local client ID" onClick={this.handleResetClient}></input> */}
            </div>
        );
    }
}
