import { Dayjs } from 'dayjs';

import { PendingTag, TagDto } from '../api';
import { TagEntity } from '../dal';

export type RequiredExceptFor<T, K extends keyof T> = Partial<Pick<T, K>> & Required<Omit<T, K>>;

export type Combine<A, B> = Partial<Omit<A, keyof B>> & // possibly items in A that aren't in B
    Partial<Omit<B, keyof A>> & { [K in keyof A & keyof B]: A[K] | B[K] }; // possibly items in B that aren't in A

export type KeyOfType<T, V> = keyof {
    [P in keyof T as T[P] extends V ? P : never]: any;
};

export const isFullTag = (tag: TagDto | PendingTag): tag is TagDto => {
    return 'imageUrl' in tag;
};

interface SubtagDefinedFields {
    subtagRootTag: TagDto;
}

interface RootTagDefinedFields {
    setCurrentRootTag: (tag: TagDto) => void;
    setFakeRootTagActive: (fakeRootTagActive: boolean) => void;
    dateOverride: Dayjs;
    userCanAddRootTag: boolean;
    userCanAddSubtag: boolean;
}

export const subtagCheck = <E extends TagDto | TagEntity>(tag: E): tag is E & SubtagDefinedFields => !tag.isRoot;
export const rootTagCheck = <E extends TagDto | TagEntity>(tag: E): tag is E & RootTagDefinedFields => tag.isRoot;
