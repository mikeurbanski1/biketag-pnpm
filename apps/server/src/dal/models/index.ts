import { EnhancedOmit, WithId } from 'mongodb';

export * from './user';
export * from './game';

export interface BaseEntity {
    id: string;
}

export type BaseEntityWithoutId<E extends BaseEntity> = EnhancedOmit<E, 'id'>;

export type DalEntity<E extends BaseEntity> = EnhancedOmit<WithId<E>, 'id'>;
