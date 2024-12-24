import { BaseEntity } from '.';
import { TagStats } from '../common';

export interface TagEntity extends BaseEntity {
    // name: string;
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
    forDate: string; // YYYY/MM/DD
    imageUrl: string;
    stats: TagStats;
    isPending: boolean;
}
