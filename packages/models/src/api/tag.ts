import { BaseDto } from '.';
import { TagStats } from '../common';
import { UserDto } from './user';

// export interface MinimalTag extends BaseDto {
//     // name: string;
//     creator: Pick<UserDto, 'id' | 'name'>;
//     imageUrl: string;
//     postedDate: string;
// }

export interface PendingTag extends BaseDto {
    creator: Pick<UserDto, 'id' | 'name'>;
    // imageData: string;
    // ownerImageUser: string;
}

export interface TagDto extends BaseDto {
    // name: string;
    creator: UserDto;
    gameId: string;
    parentTagId?: string;
    nextTagId?: string;
    rootTagId?: string;
    lastTagInChainId?: string; // only on root tag and only if there is a child
    isRoot: boolean;
    previousRootTagId?: string;
    nextRootTagId?: string;
    postedDate: string;
    imageUrl: string;
    stats: TagStats;
    isPending: boolean;
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
