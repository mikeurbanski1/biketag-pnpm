export type RequiredExceptFor<T, K extends keyof T> = Partial<Pick<T, K>> & Required<Omit<T, K>>;

export type Combine<A, B> = Partial<Omit<A, keyof B>> & // possibly items in A that aren't in B
    Partial<Omit<B, keyof A>> & { [K in keyof A & keyof B]: A[K] | B[K] }; // possibly items in B that aren't in A

export type KeyOfType<T, V> = keyof {
    [P in keyof T as T[P] extends V ? P : never]: any;
};
