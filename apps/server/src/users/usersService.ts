// src/users/usersService.ts
import { User } from '@biketag/models';

// A post request should not contain an id.
export type UserCreationParams = { name: string };

const users: User[] = [];

export class UsersService {
    public get(id: number): User | undefined {
        return users.find((user) => user.id === id);
    }

    public getAll(): User[] {
        return users;
    }

    public create(userCreationParams: UserCreationParams): User {
        const user = {
            id: Math.floor(Math.random() * 10000), // Random
            ...userCreationParams
        };
        users.push(user);
        return user;
    }
}

