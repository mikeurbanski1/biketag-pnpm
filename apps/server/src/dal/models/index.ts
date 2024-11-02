import { ObjectId } from 'mongodb';

export * from './user';
export * from './game';

export interface Entity {
    _id: ObjectId;
}
