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
    imageUrl: string;
    stats: TagStats;
    isPending: boolean;
}
