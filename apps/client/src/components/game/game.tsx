import { Dayjs } from 'dayjs';
import React from 'react';

import { GameDto, GameRoles, isFullTag, PendingTag, PlayerScores, TagDto, UserDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from '../../api';

import '../../styles/game.css';

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
    // updateGame: (updateParams: Partial<GameDto>) => void;
    setGame: (game: GameDto) => void;
    doneViewingGame: () => void;
    // editGame: () => void;
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
        this.fetchAndSetUserCanAddSubtag();
        this.fetchAndSetGame();
    }

    private fetchAndSetGame(): void {
        ApiManager.gameApi.getGame({ id: this.props.gameId }).then((game) => {
            const { latestRootTag } = game;
            const playerDetailsTable = this.getPlayerDetailsTable(game);
            this.setState({
                game,
                loadingGame: false,
                isCreator: game.creator.id === this.props.user.id,
                playerDetailsTable: playerDetailsTable,
                currentRootTag: latestRootTag,
                currentTag: latestRootTag,
                showingAddRootTag: latestRootTag === undefined,
            });
            if (latestRootTag) {
                this.fetchAndSetUserCanAddSubtag(latestRootTag);
            }
        });
    }

    private fetchAndSetUserCanAddRootTag(): void {
        ApiManager.tagApi.canUserAddTag({ userId: this.props.user.id, gameId: this.props.gameId, dateOverride: this.props.dateOverride }).then((userCanAddRootTag) => {
            this.setState({ userCanAddRootTag });
        });
    }

    private fetchAndSetUserCanAddSubtag(tagOverride?: TagDto): void {
        if (!this.state.currentRootTag) {
            this.setState({ userCanAddSubtag: false });
        } else {
            ApiManager.tagApi.canUserAddSubtag({ userId: this.props.user.id, tagId: tagOverride?.id ?? this.state.currentRootTag.id }).then((userCanAddSubtag) => {
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

    private createNewTag({ imageUrl, isSubtag }: { imageUrl: string; isSubtag: boolean }): void {
        if (isSubtag) {
            this.createNewSubtag({ imageUrl });
        } else {
            this.createNewRootTag({ imageUrl });
        }
    }

    private createNewRootTag({ imageUrl }: { imageUrl: string }): void {
        ApiManager.tagApi.createTag({ imageUrl, gameId: this.props.gameId, isRoot: true }).then((tag) => {
            // const latestRootTag = tag;
            // const updateParams = { latestRootTag };
            // this.props.updateGame(updateParams);
            this.setState({
                userCanAddRootTag: false,
                userCanAddSubtag: false,
                playerDetailsTable: this.getPlayerDetailsTable(),
                currentRootTag: tag,
                currentTag: tag,
                showingAddRootTag: false,
            });
            ApiManager.tagApi.updateTagInCache({
                tagId: tag.previousRootTagId,
                update: { nextRootTagId: tag.id },
            });
        });
    }

    private createNewSubtag({ imageUrl }: { imageUrl: string }): void {
        ApiManager.tagApi.createTag({ imageUrl, gameId: this.props.gameId, isRoot: false, rootTagId: this.state.currentRootTag!.id }).then((tag) => {
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
        ApiManager.gameApi.getGame({ id: this.props.gameId }).then((game) => {
            logger.info(`[refreshScores] got game`, { game });
            this.props.setGame(game);
            const playerDetailsTable = this.getPlayerDetailsTable();
            this.setState({ playerDetailsTable, currentRootTag: game.latestRootTag });
        });
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
                let updateCanAddSubtag = false;
                const stateUpdate: Partial<ViewGameState> = { currentTag: tag, showingAddRootTag: false, showingAddSubtag: false };
                if (tag.isRoot) {
                    stateUpdate.currentRootTag = tag;
                    if (!tag.nextTagId) {
                        stateUpdate.userCanAddSubtag = true;
                    } else {
                        updateCanAddSubtag = true;
                    }
                }
                this.setState(stateUpdate as ViewGameState);
                if (updateCanAddSubtag) {
                    this.fetchAndSetUserCanAddSubtag(tag);
                }
            }
        } else {
            this.setState({ showingPendingTag: true });
        }
    }

    public render() {
        const { game } = this.state;

        if (!game || this.state.loadingGame) {
            return <div>Loading...</div>;
        }

        if (this.state.editingGame) {
            return <CreateEditGame user={this.props.user} doneCreatingGame={() => this.setState({ editingGame: false })} game={this.state.game!} />;
        }

        const backText = this.state.viewingGameDetails ? '← Back to tags' : '← Back to games';
        const backOnClick = this.state.viewingGameDetails ? () => this.setState({ viewingGameDetails: false }) : () => this.props.doneViewingGame();

        return (
            <div className="game-view">
                <div className="game-header">
                    <span className="clickable-text" onClick={backOnClick}>
                        {backText}
                    </span>
                    <span className="title">
                        {game.name}
                        <span className="clickable-text" onClick={() => this.refreshGame()}>
                            ↻
                        </span>
                    </span>
                    <span>
                        {this.state.viewingGameDetails ? (
                            ''
                        ) : (
                            <span className="clickable-text" onClick={() => this.setState({ viewingGameDetails: true })}>
                                Game details →
                            </span>
                        )}
                    </span>
                </div>
                {this.state.viewingGameDetails ? (
                    <GameDetails
                        game={game}
                        user={this.props.user}
                        playerDetailsTable={this.state.playerDetailsTable}
                        showingGameAdminButtons={this.state.showingGameAdminButtons}
                        setShowingGameAdminButtons={(value) => this.setState({ showingGameAdminButtons: value })}
                        setEditingGame={() => this.setState({ editingGame: true })}
                        deleteGame={() => this.props.deleteGame()}
                    />
                ) : (
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
                )}
            </div>
        );
    }
}
