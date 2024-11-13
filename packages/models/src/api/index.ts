export * from './user';
export * from './game';

export interface BaseDto {
    id: string;
}

export type BaseDtoWithoutId<E extends BaseDto> = Omit<E, 'id'>;
