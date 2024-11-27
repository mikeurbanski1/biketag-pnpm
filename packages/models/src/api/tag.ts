import { BaseDto } from '.';
import { UserDto } from './user';

export interface MinimalTag extends BaseDto {
    name: string;
    creatorName: string;
    contents: string;
    postedDate: string;
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
    points: number;
}

export interface CreateTagDto {
    name: string;
    gameId: string;
    rootTagId?: string;
    isRoot: boolean;
    contents: string;
    postedDate?: string; // used for bootstrapping
}

export interface CreateTagParams extends CreateTagDto {
    creatorId: string;
}

export const tagFields = ['parentTagId', 'nextTagId', 'rootTagId', 'previousRootTagId', 'nextRootTagId'] as const;
