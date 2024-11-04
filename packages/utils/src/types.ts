export type RequiredExceptFor<T, K extends keyof T> = Partial<Pick<T, K>> & Required<Omit<T, K>>;
