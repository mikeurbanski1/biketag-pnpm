export class UserExistsError extends Error {}
export class UserNotFoundError extends Error {}

export class GameExistsError extends Error {}
export class GameNotFoundError extends Error {}
export class CannotRemovePlayerError extends Error {}

export interface IError<E extends Error> {
    new (message: string): E;
}

export interface ServiceErrors {
    notFoundErrorClass: IError<Error>;
    existsErrorClass: IError<Error>;
}

export const userServiceErrors: ServiceErrors = {
    notFoundErrorClass: UserNotFoundError,
    existsErrorClass: UserExistsError
};

export const gameServiceErrors: ServiceErrors = {
    notFoundErrorClass: GameNotFoundError,
    existsErrorClass: GameExistsError
};
