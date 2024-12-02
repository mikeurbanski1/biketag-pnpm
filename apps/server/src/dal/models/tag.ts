import { BaseEntity } from '.';

export interface TagEntity extends BaseEntity {
    name: string;
    creatorId: string;
    gameId: string;
    parentTagId?: string;
    nextTagId?: string;
    rootTagId?: string;
    lastTagInChainId?: string;
    isRoot: boolean;
    previousRootTagId?: string;
    nextRootTagId?: string;
    postedDate: string;
    contents: string;
    points: number;
}
