import { WithId } from 'mongodb';

export type UserEntity = WithId<{
    name: string;
}>;
