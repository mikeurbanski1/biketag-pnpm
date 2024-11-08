import React, { ChangeEvent, ReactNode } from 'react';
import { parseIfInteger } from '@biketag/utils';
import { Apis } from '../api';

interface LoginState {
    name: string;
    id: string;
    canLogin: boolean;
    canSignup: boolean;
    errorMessage?: string;
}

interface LoginProps {
    setUser: ({ name, id }: { name: string; id: string }) => void;
    apis: Apis;
}

export class Login extends React.Component<LoginProps, LoginState> {
    constructor(props: LoginProps) {
        super(props);
        this.state = {
            name: '',
            id: '',
            canLogin: false,
            canSignup: false
        };
        // this.handleNameChange = this.handleNameChange.bind(this);
        // this.handleIdChange = this.handleIdChange.bind(this);
        // this.login = this.login.bind(this);
        // this.signUp = this.signUp.bind(this);
    }

    private handleNameChange(event: ChangeEvent<HTMLInputElement>) {
        const newState: Partial<LoginState> = {
            name: event.target.value
        };
        newState.canLogin = this.canLogin(newState);
        newState.canSignup = this.canSignup(newState);
        this.setState(newState as LoginState);
    }

    private handleIdChange(event: ChangeEvent<HTMLInputElement>) {
        const newState: Partial<LoginState> = {
            id: event.target.value === '' ? '' : parseIfInteger(event.target.value)?.toString() || this.state.id
        };
        newState.canLogin = this.canLogin(newState);
        newState.canSignup = this.canSignup(newState);
        this.setState(newState as LoginState);
    }

    private canLogin(newState: Partial<LoginState>) {
        const merged = Object.assign({}, this.state, newState);
        return merged.name !== '' && merged.id !== '';
    }

    private canSignup(newState: Partial<LoginState>) {
        const merged = Object.assign({}, this.state, newState);
        return merged.name !== '' && merged.id === '';
    }

    async login() {
        try {
            const { name } = this.state;
            const { id } = await this.props.apis.usersApi.login({ name });
            this.props.setUser({ name, id });
        } catch (err) {
            if (err instanceof Error) {
                this.setState({
                    errorMessage: err.message
                });
            }
        }
    }

    async signUp() {
        try {
            const { name } = this.state;
            const { id } = await this.props.apis.usersApi.signup({ name });
            this.props.setUser({ name, id });
        } catch (err) {
            if (err instanceof Error) {
                this.setState({
                    errorMessage: err.message
                });
            }
        }
    }

    render(): ReactNode {
        return (
            <div>
                <span>
                    {/* <label htmlFor="id">User ID: </label>
                    <input type="text" name="id" onChange={(event) => this.handleIdChange(event)} value={this.state.id}></input> */}
                    <label htmlFor="name">Your name: </label>
                    <input type="text" name="name" onChange={(event) => this.handleNameChange(event)} value={this.state.name}></input>
                    <br></br>
                    <input type="button" name="login" value="Login" onClick={async () => await this.login()} disabled={!this.state.canSignup}></input>
                    <input type="button" name="signup" value="Sign Up" onClick={async () => await this.signUp()} disabled={!this.state.canSignup}></input>
                    <br></br>
                    <h3>{this.state.errorMessage || ''}</h3>
                </span>
            </div>
        );
    }
}
