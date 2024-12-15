import React, { ChangeEvent, ReactNode } from 'react';

import { UserDto } from '@biketag/models';

import { ApiManager } from '../api';

interface LoginState {
    name: string;
    user?: UserDto;
    canLogin: boolean;
    canSignup: boolean;
    errorMessage?: string;
}

interface LoginProps {
    setUser: ({ name, id }: { name: string; id: string }) => void;
}

export class Login extends React.Component<LoginProps, LoginState> {
    constructor(props: LoginProps) {
        super(props);
        this.state = {
            name: '',
            canLogin: false,
            canSignup: false,
        };
        // this.handleNameChange = this.handleNameChange.bind(this);
        // this.handleIdChange = this.handleIdChange.bind(this);
        // this.login = this.login.bind(this);
        // this.signUp = this.signUp.bind(this);
    }

    private handleNameChange(event: ChangeEvent<HTMLInputElement>) {
        const newState: Partial<LoginState> = {
            name: event.target.value,
        };
        newState.canLogin = this.canLogin(newState);
        newState.canSignup = this.canSignup(newState);
        this.setState(newState as LoginState);
    }

    private canLogin(newState: Partial<LoginState>) {
        // const merged = Object.assign({}, this.state, newState);
        return newState.name !== '';
    }

    private canSignup(newState: Partial<LoginState>) {
        // const merged = Object.assign({}, this.state, newState);
        return newState.name !== '';
    }

    async login() {
        try {
            const { name } = this.state;
            const { id } = await ApiManager.userApi.login({ name });
            this.props.setUser({ name, id });
        } catch (err) {
            if (err instanceof Error) {
                this.setState({
                    errorMessage: err.message,
                });
            }
        }
    }

    async signUp() {
        try {
            const { name } = this.state;
            const { id } = await ApiManager.userApi.signup({ name });
            this.props.setUser({ name, id });
        } catch (err) {
            if (err instanceof Error) {
                this.setState({
                    errorMessage: err.message,
                });
            }
        }
    }

    render(): ReactNode {
        return (
            <div className="flex-column moderate-gap">
                <input className="login-text" placeholder="Name" type="text" onChange={(event) => this.handleNameChange(event)} value={this.state.name}></input>
                <div className="button-pair">
                    <button className="login-button" type="button" onClick={async () => await this.login()} disabled={!this.state.canSignup}>
                        Login
                    </button>
                    <button className="login-button" type="button" onClick={async () => await this.signUp()} disabled={!this.state.canSignup}>
                        Sign up
                    </button>
                </div>
                <h3>{this.state.errorMessage || ''}</h3>
            </div>
        );
    }
}
