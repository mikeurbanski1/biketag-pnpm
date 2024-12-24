import { Dayjs } from 'dayjs';
import React from 'react';

import { GameDto, GameRoles, isFullTag, PendingTag, PlayerScores, TagDto, UserDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from '../../api';

import '../../styles/game.css';

import { NavHeader } from '../common/navHeader';
import { CreateEditGame } from '../createEditGame';
import { GameDetails } from './gameDetails';
import { GameTagView } from './gameTagView';

const logger = new Logger({ prefix: '[ViewGame]' });

type PlayerTableRole = GameRoles | 'OWNER';

type PlayerDetailsTableRow = PlayerScores & {
    id: string;
    name: string;
    role: string;
    [key: string]: string | number;
};

interface ViewGameState {
    game?: GameDto;
    editingGame: boolean;
    loadingGame: boolean;
    isCreator: boolean;
    playerDetailsTable: PlayerDetailsTableRow[];
    currentRootTag?: TagDto;
    currentTag?: TagDto;
    showingGameAdminButtons: boolean;
    userCanAddRootTag: boolean;
    userCanAddSubtag: boolean;
    viewingGameDetails: boolean;
    showingPendingTag: boolean;
    showingAddRootTag: boolean;
    showingAddSubtag: boolean;
}

interface ViewGameProps {
    user: UserDto;
    gameId: string;
    gameName: string;
    doneViewingGame: () => void;
    deleteGame: () => void;
    dateOverride: Dayjs;
}

export class Game extends React.Component<ViewGameProps, ViewGameState> {
    constructor(props: ViewGameProps) {
        super(props);
        this.state = {
            isCreator: false,
            editingGame: false,
            loadingGame: true,
            playerDetailsTable: [],
            showingGameAdminButtons: false,
            viewingGameDetails: false,
            showingPendingTag: false,
            userCanAddRootTag: false,
            userCanAddSubtag: false,
            showingAddRootTag: false,
            showingAddSubtag: false,
        };
    }

    public componentDidMount(): void {
        this.fetchAndSetUserCanAddRootTag();
        this.fetchAndSetGame();
    }

    private fetchAndSetGame(): void {
        ApiManager.gameApi.getGame({ id: this.props.gameId, convertPendingTagForOwner: true }).then((game) => {
            const { latestRootTag } = game;
            const playerDetailsTable = this.getPlayerDetailsTable(game);
            this.setState({
                game,
                loadingGame: false,
                isCreator: game.creator.id === this.props.user.id,
                playerDetailsTable,
                currentRootTag: latestRootTag,
                currentTag: latestRootTag,
                showingAddRootTag: latestRootTag === undefined,
            });
            if (latestRootTag) {
                logger.info(`[fetchAndSetGame]`, { latestRootTag });
                this.fetchAndSetUserCanAddSubtag(latestRootTag);
            }
        });
    }

    private refreshPlayerScores(): void {
        const { game } = this.state;
        if (!game) {
            return;
        }
        ApiManager.gameApi.getGame({ id: game.id, convertPendingTagForOwner: true }).then((game) => {
            const playerDetailsTable = this.getPlayerDetailsTable(game);
            this.setState({ playerDetailsTable });
        });
    }

    private fetchAndSetUserCanAddRootTag(): void {
        ApiManager.tagApi.canUserAddTag({ userId: this.props.user.id, gameId: this.props.gameId, dateOverride: this.props.dateOverride }).then((userCanAddRootTag) => {
            this.setState({ userCanAddRootTag });
        });
    }

    private fetchAndSetUserCanAddSubtag(tagOverride?: TagDto): void {
        if (!tagOverride && !this.state.currentRootTag) {
            this.setState({ userCanAddSubtag: false });
        } else {
            ApiManager.tagApi.canUserAddSubtag({ userId: this.props.user.id, tagId: tagOverride?.id ?? this.state.currentRootTag!.id }).then((userCanAddSubtag) => {
                this.setState({ userCanAddSubtag });
            });
        }
    }

    private setAddTagAsActive(isSubtag: boolean): void {
        if (isSubtag) {
            this.setState({ showingAddSubtag: true });
        } else {
            this.setState({ showingAddRootTag: true });
        }
    }

    private async createNewTag({ imageUrl, isSubtag }: { imageUrl: string; isSubtag: boolean }): Promise<void> {
        if (isSubtag) {
            await this.createNewSubtag({ imageUrl });
        } else {
            await this.createNewRootTag({ imageUrl });
        }
        this.refreshPlayerScores();
    }

    private async createNewRootTag({ imageUrl }: { imageUrl: string }): Promise<void> {
        const tag = await ApiManager.tagApi.createTag({ imageUrl, gameId: this.props.gameId, isRoot: true });
        // const latestRootTag = tag;
        // const updateParams = { latestRootTag };
        // this.props.updateGame(updateParams);
        this.setState({
            userCanAddRootTag: false,
            userCanAddSubtag: false,
            currentRootTag: tag,
            currentTag: tag,
            showingAddRootTag: false,
            game: { ...this.state.game!, latestRootTag: tag },
        });
        ApiManager.tagApi.updateTagInCache({
            tagId: tag.previousRootTagId,
            update: { nextRootTagId: tag.id },
        });
    }

    private async createNewSubtag({ imageUrl }: { imageUrl: string }): Promise<void> {
        const tag = await ApiManager.tagApi.createTag({ imageUrl, gameId: this.props.gameId, isRoot: false, rootTagId: this.state.currentRootTag!.id });

        const updateParams = {
            userCanAddSubtag: false,
            currentTag: tag,
            showingAddSubtag: false,
        };
        if (tag.rootTagId! === this.state.game!.latestRootTag!.id) {
            this.fetchAndSetUserCanAddRootTag();
        }
        this.setState(updateParams as ViewGameState);
        ApiManager.tagApi.updateTagInCache({
            tagId: tag.parentTagId,
            update: { nextTagId: tag.id },
        });
        ApiManager.tagApi.updateTagInCache({
            tagId: tag.rootTagId,
            update: { lastTagInChainId: tag.id },
        });
    }

    private getPlayerDetailsTable(game?: GameDto): PlayerDetailsTableRow[] {
        if (!game) {
            game = this.state.game!;
        }
        logger.info(`[getPlayerDetailsTable]`, { game });
        return [{ id: game.creator.id, name: game.creator.name, role: 'OWNER' as PlayerTableRole, ...game.gameScore.playerScores[game.creator.id] }].concat(
            game.players.map((player) => {
                return { id: player.user.id, name: player.user.name, role: player.role, ...game.gameScore.playerScores[player.user.id] };
            })
        );
    }

    private refreshGame(): void {
        this.setState({
            loadingGame: true,
            userCanAddRootTag: false,
            userCanAddSubtag: false,
        });
        this.fetchAndSetGame();
        this.fetchAndSetUserCanAddRootTag();
    }

    private setCurrentTag(tag: TagDto | PendingTag): void {
        if (isFullTag(tag)) {
            if (tag.id === this.state.currentTag?.id) {
                this.setState({
                    showingAddRootTag: false,
                    showingAddSubtag: false,
                    showingPendingTag: false,
                });
            } else {
                const stateUpdate: Partial<ViewGameState> = { currentTag: tag, showingAddRootTag: false, showingAddSubtag: false };
                if (tag.isRoot) {
                    stateUpdate.currentRootTag = tag;
                    if (!tag.nextTagId && !tag.isPending && tag.creator.id !== this.props.user.id) {
                        // if there is a chance it could be us, we will check and see
                        this.fetchAndSetUserCanAddSubtag(tag);
                    } else {
                        stateUpdate.userCanAddSubtag = false;
                    }
                }
                this.setState(stateUpdate as ViewGameState);
            }
        } else {
            this.setState({ showingPendingTag: true });
        }
    }

    public render() {
        const { game } = this.state;

        if (this.state.editingGame) {
            return <CreateEditGame user={this.props.user} doneCreatingGame={() => this.setState({ editingGame: false })} game={this.state.game!} />;
        }

        let innerDiv: React.ReactNode;
        if (!game || this.state.loadingGame) {
            innerDiv = <div className="game-details">Loading...</div>;
        } else if (this.state.viewingGameDetails) {
            innerDiv = (
                <GameDetails
                    game={game}
                    user={this.props.user}
                    playerDetailsTable={this.state.playerDetailsTable}
                    showingGameAdminButtons={this.state.showingGameAdminButtons}
                    setShowingGameAdminButtons={(value) => this.setState({ showingGameAdminButtons: value })}
                    setEditingGame={() => this.setState({ editingGame: true })}
                    deleteGame={() => this.props.deleteGame()}
                />
            );
        } else {
            innerDiv = (
                <GameTagView
                    game={game}
                    dateOverride={this.props.dateOverride}
                    currentRootTag={this.state.currentRootTag}
                    currentTag={this.state.currentTag}
                    userCanAddRootTag={this.state.userCanAddRootTag}
                    userCanAddSubtag={this.state.userCanAddSubtag}
                    showingAddRootTag={this.state.showingAddRootTag}
                    showingAddSubtag={this.state.showingAddSubtag}
                    showingPendingTag={this.state.showingPendingTag}
                    createNewTag={({ imageUrl, isSubtag }: { imageUrl: string; isSubtag: boolean }) => this.createNewTag({ imageUrl, isSubtag })}
                    setAddTagAsActive={(isSubtag: boolean) => this.setAddTagAsActive(isSubtag)}
                    selectTag={(tag: TagDto | PendingTag) => this.setCurrentTag(tag)}
                />
            );
        }

        const backText = this.state.viewingGameDetails ? '← Back to tags' : '← Back to games';
        const backOnClick = this.state.viewingGameDetails ? () => this.setState({ viewingGameDetails: false }) : () => this.props.doneViewingGame();

        return (
            <div className="game-view">
                <NavHeader
                    leftText={backText}
                    leftOnClick={backOnClick}
                    centerText={`${this.props.gameName} ↻`}
                    centerOnClick={() => this.refreshGame()}
                    rightText={!this.state.viewingGameDetails && !this.state.loadingGame ? 'Game details →' : undefined}
                    rightOnClick={() => this.setState({ viewingGameDetails: true })}
                />
                {innerDiv}
            </div>
        );
    }
}
