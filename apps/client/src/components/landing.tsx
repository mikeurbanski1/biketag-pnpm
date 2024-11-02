import React, { ChangeEvent, ReactNode } from 'react';

interface LandingState {
    name: string;
    prompt: string;
    maxVotes: string;
    canStart: boolean;
    pollId: string;
    canJoin: boolean;
    maxTime: string;
}

interface LandingProps {
    startPoll: ({ name, prompt, maxVotes, time }: { name: string; prompt: string; maxVotes?: number; time?: number }) => void;
    joinPoll: ({ name, pollId }: { name: string; pollId: string }) => void;
    handleNameChange: (name: string) => void;
    invalidPoll: boolean;
    name?: string;
}

export class Landing extends React.Component<LandingProps, LandingState> {
    constructor(props: LandingProps) {
        super(props);
        this.state = {
            name: props.name || '',
            prompt: '',
            maxVotes: '2',
            maxTime: '',
            canStart: false,
            pollId: '',
            canJoin: false
        };
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handlePromptChange = this.handlePromptChange.bind(this);
        this.handleNumVotesChange = this.handleNumVotesChange.bind(this);
        this.handlePollIdChange = this.handlePollIdChange.bind(this);
        this.handleMaxTimeChange = this.handleMaxTimeChange.bind(this);
        this.canStart = this.canStart.bind(this);
        this.joinPoll = this.joinPoll.bind(this);
        this.canJoinPoll = this.canJoinPoll.bind(this);
    }

    private canStart(newState: Partial<LandingState>) {
        const merged = Object.assign({}, this.state, newState);
        return merged.prompt !== '' && merged.name !== '';
    }

    private canJoinPoll(newState: Partial<LandingState>) {
        const merged = Object.assign({}, this.state, newState);
        return merged.pollId !== '' && merged.name !== '';
    }

    private handleNameChange(event: ChangeEvent<HTMLInputElement>) {
        const newState: Partial<LandingState> = {
            name: event.target.value
        };
        newState.canStart = this.canStart(newState);
        newState.canJoin = this.canJoinPoll(newState);
        this.setState(newState as LandingState);
        this.props.handleNameChange(newState.name!);
    }

    private handlePromptChange(event: ChangeEvent<HTMLInputElement>) {
        const newState: Partial<LandingState> = {
            prompt: event.target.value
        };
        newState.canStart = this.canStart(newState);
        this.setState(newState as LandingState);
    }

    private handleMaxTimeChange(event: ChangeEvent<HTMLInputElement>) {
        const value = parseInt(event.target.value);

        const defaultState = {
            maxTime: ''
        };

        if (isNaN(value)) {
            this.setState(defaultState);
            return;
        }

        const newState: Partial<LandingState> = {
            maxTime: event.target.value
        };
        this.setState(newState as LandingState);
    }

    private handleNumVotesChange(event: ChangeEvent<HTMLInputElement>) {
        const defaultState = {
            maxVotes: '',
            canStart: this.canStart({})
        };

        if (event.target.value === '') {
            this.setState(defaultState);
            return;
        }

        const value = parseInt(event.target.value);

        if (isNaN(value)) {
            this.setState(defaultState);
            return;
        }

        const newState: Partial<LandingState> = {
            maxVotes: value.toString()
        };
        newState.canStart = this.canStart(newState);
        this.setState(newState as LandingState);
    }

    private handlePollIdChange(event: ChangeEvent<HTMLInputElement>) {
        const newState: Partial<LandingState> = {
            pollId: event.target.value.toUpperCase()
        };
        newState.canJoin = this.canJoinPoll(newState);
        this.setState(newState as LandingState);
    }

    startPoll() {
        this.props.startPoll({
            name: this.state.name,
            prompt: this.state.prompt,
            maxVotes: this.state.maxVotes === '' ? undefined : parseInt(this.state.maxVotes),
            time: this.state.maxTime === '' ? undefined : parseInt(this.state.maxTime)
        });
    }

    joinPoll() {
        this.props.joinPoll({
            name: this.state.name,
            pollId: this.state.pollId
        });
    }

    render(): ReactNode {
        return (
            <div>
                <span>
                    <label htmlFor="name">Your name: </label>
                    <input type="text" name="name" onChange={this.handleNameChange} value={this.state.name}></input>
                    <hr></hr>
                    <label htmlFor="prompt">Poll prompt: </label>
                    <input type="text" name="prompt" onChange={this.handlePromptChange} value={this.state.prompt}></input>
                    <br></br>
                    <label htmlFor="num-votes">Max votes: </label>
                    <input type="text" name="num-votes" onChange={this.handleNumVotesChange} value={this.state.maxVotes}></input>
                    <br></br>
                    <label htmlFor="max-time">Max time (s): </label>
                    <input type="text" name="max-time" onChange={this.handleMaxTimeChange} value={this.state.maxTime}></input>
                    <br></br>
                    <input type="button" name="start-poll" value="Start a poll" onClick={() => this.startPoll()} disabled={!this.state.canStart}></input>
                    <hr></hr>
                    <label htmlFor="poll-id">Join poll: </label>
                    <input type="text" name="poll-id" onChange={this.handlePollIdChange} value={this.state.pollId}></input>
                    <br></br>
                    <input type="button" name="join-poll" value="Join a poll" onClick={() => this.joinPoll()} disabled={!this.state.canJoin}></input>
                    <br></br>
                    <h3>{this.props.invalidPoll ? 'Invalid poll' : ''}</h3>
                </span>
            </div>
        );
    }
}
