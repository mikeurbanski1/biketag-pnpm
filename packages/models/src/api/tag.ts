import { BaseDto } from '.';
import { UserDto } from './user';

export interface MinimalTag extends BaseDto {
    creatorName: string;
    contents: string;
}

export interface TagDto extends BaseDto {
    name: string;
    creator: UserDto;
    gameId: string;
    parentTag?: MinimalTag;
    nextTag?: MinimalTag;
    rootTag?: MinimalTag;
    isRoot: boolean;
    previousRootTag?: MinimalTag;
    nextRootTag?: MinimalTag;
    postedDate: string;
    contents: string;
}

export interface CreateTagParams {
    name: string;
    creatorId: string;
    gameId: string;
    parentTagId?: string;
    nextTagId?: string;
    rootTagId?: string;
    isRoot: boolean;
    previousRootTagId?: string;
    nextRootTagId?: string;
    contents: string;
}

export const tagFields = ['parentTagId', 'nextTagId', 'rootTagId', 'previousRootTagId', 'nextRootTagId'] as const;
