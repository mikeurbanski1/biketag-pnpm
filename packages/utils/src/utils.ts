import { User } from '@biketag/models';

export function getUserName(user: User): string {
    return user.name;
}

