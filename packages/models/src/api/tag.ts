import { BaseDto } from '.';
import { TagStats } from './score';
import { UserDto } from './user';

export interface MinimalTag extends BaseDto {
    // name: string;
    creator: Pick<UserDto, 'id' | 'name'>;
    imageUrl: string;
    postedDate: string;
}

export interface PendingTag extends BaseDto {
    creator: Pick<UserDto, 'id' | 'name'>;
}

export interface TagDto extends BaseDto {
    // name: string;
    creator: UserDto;
    gameId: string;
    parentTag?: MinimalTag;
    nextTag?: MinimalTag;
    rootTag?: MinimalTag;
    lastTagInChain?: MinimalTag; // only on root tag and only if there is a child
    isRoot: boolean;
    previousRootTag?: MinimalTag;
    nextRootTag?: MinimalTag;
    postedDate: string;
    imageUrl: string;
    stats: TagStats;
}

export interface CreateTagDto {
    // name: string;
    gameId: string;
    rootTagId?: string;
    isRoot: boolean;
    imageUrl: string;
    postedDate?: string; // used for bootstrapping
}

export interface CreateTagParams extends CreateTagDto {
    creatorId: string;
}

export const tagFields = ['parentTagId', 'nextTagId', 'rootTagId', 'previousRootTagId', 'nextRootTagId', 'lastTagInChainId'] as const;
