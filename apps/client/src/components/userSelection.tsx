import { GameRoles } from '@biketag/models';
import React, { useState } from 'react';

interface UserDto {
    id: string;
    name: string;
}

interface UserSelectionProps {
    user: UserDto;
    index: number;
    onSelect: (index: number, user: UserDto, role?: GameRoles) => void;
    gameRole?: GameRoles;
}

const UserSelection: React.FC<UserSelectionProps> = ({ user, index, onSelect, gameRole }) => {
    const [isSelected, setIsSelected] = useState(gameRole !== undefined);
    const [role, setRole] = useState<GameRoles | undefined>(gameRole);

    const handleSelectClick = () => {
        setIsSelected(!isSelected);
        const newRole = role || gameRole || GameRoles.PLAYER;
        // if no role set, this is the first time the user is being selected
        if (!role) {
            setRole(newRole); // Default role when selected
        }
        onSelect(index, user, !isSelected ? newRole : undefined);
    };

    const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = event.target.value as GameRoles;
        setRole(newRole);
        onSelect(index, user, newRole);
    };

    return (
        <tr>
            <td>{user.name}</td>
            <td>
                <button onClick={handleSelectClick}>{isSelected ? 'Remove' : 'Add'}</button>
            </td>
            {isSelected && (
                <td>
                    <select value={role || ''} onChange={handleRoleChange}>
                        <option value={GameRoles.PLAYER}>Player</option>
                        <option value={GameRoles.ADMIN}>Admin</option>
                    </select>
                </td>
            )}
        </tr>
    );
};

export default UserSelection;
