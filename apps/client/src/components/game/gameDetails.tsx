import React from 'react';

import { GameDto, PlayerScores, UserDto } from '@biketag/models';

import { Table } from '../common/table';

type PlayerDetailsTableRow = PlayerScores & {
    id: string;
    name: string;
    role: string;
    [key: string]: string | number;
};

interface GameDetailsProps {
    game: GameDto; // Define the type for game if available
    user: UserDto; // Define the type for user if available
    playerDetailsTable: PlayerDetailsTableRow[];
    showingGameAdminButtons: boolean;
    setShowingGameAdminButtons: (value: boolean) => void;
    setEditingGame: () => void;
    deleteGame: () => void;
}

export const GameDetails: React.FC<GameDetailsProps> = ({ game, user, playerDetailsTable, showingGameAdminButtons, setShowingGameAdminButtons, setEditingGame, deleteGame }) => {
    const isCreator = game.creator.id === user.id;

    return (
        <div className="game-details">
            <div className={isCreator ? 'clickable-text' : ''} onClick={isCreator ? () => setShowingGameAdminButtons(!showingGameAdminButtons) : undefined}>
                Created by: {game.creator.name} {isCreator && (showingGameAdminButtons ? '▼' : '▶')}
            </div>
            <div className="game-admin-buttons button-pair" hidden={!isCreator || !showingGameAdminButtons}>
                <button className="game-admin-button" onClick={() => setEditingGame()}>
                    Edit game
                </button>
                <button className="game-admin-button" onClick={deleteGame}>
                    Delete game
                </button>
            </div>
            <div>Scoreboard</div>
            <Table<PlayerDetailsTableRow>
                data={playerDetailsTable}
                columnMapping={[
                    { attribute: 'name', header: 'Name' },
                    { attribute: 'points', header: 'Total points', defaultDescending: true },
                    { attribute: 'totalTagsPosted', header: 'Total tags posted', defaultDescending: true },
                    { attribute: 'tagsWon', header: 'Tags won', defaultDescending: true },
                    { attribute: 'newTagsPosted', header: 'New tags posted', defaultDescending: true },
                    { attribute: 'tagsPostedOnTime', header: 'Tags posted on time', defaultDescending: true },
                ]}
                initialSort={{ column: 'points', ascending: false }}
                tableClassName="player-details-table"
                numericColumns={[1, 2, 3, 4, 5]}
            />
        </div>
    );
};
