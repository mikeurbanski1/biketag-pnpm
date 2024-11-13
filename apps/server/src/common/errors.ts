export abstract class BaseExistsCheckError extends Error {
    public static entityName: string;
}

export class UserExistsError extends BaseExistsCheckError {
    public static entityName = 'User';
}
export class UserNotFoundError extends BaseExistsCheckError {
    public static entityName = 'User';
}

export class GameExistsError extends BaseExistsCheckError {
    public static entityName = 'Game';
}
export class GameNotFoundError extends BaseExistsCheckError {
    public static entityName = 'Game';
}
export class CannotRemovePlayerError extends Error {}
export class CannotRemoveCreatorError extends Error {}

export class TagNotFoundError extends BaseExistsCheckError {
    public static entityName = 'Tag';
}
export class TagExistsError extends BaseExistsCheckError {
    public static entityName = 'Tag';
}

export interface IError<E extends Error> {
    new (message: string): E;
}

export interface IExistsError<E extends BaseExistsCheckError> {
    entityName: string;
    new (message: string): E;
}

export interface ServiceErrors {
    notFoundErrorClass: IExistsError<BaseExistsCheckError>;
    existsErrorClass: IExistsError<BaseExistsCheckError>;
}

export const userServiceErrors: ServiceErrors = {
    notFoundErrorClass: UserNotFoundError,
    existsErrorClass: UserExistsError
};

export const gameServiceErrors: ServiceErrors = {
    notFoundErrorClass: GameNotFoundError,
    existsErrorClass: GameExistsError
};

export const tagServiceErrors: ServiceErrors = {
    notFoundErrorClass: TagNotFoundError,
    existsErrorClass: TagExistsError
};
