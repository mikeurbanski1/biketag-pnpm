import { stringify } from '.';

export enum LogLevel {
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
}

export interface LogOptions {
    pretty: boolean;
}

const logDefaults: LogOptions = {
    pretty: false,
};

export class Logger {
    private readonly prefix: string;
    private readonly logLevel: LogLevel;
    private readonly logOptions: LogOptions;
    constructor({ prefix, logLevel = LogLevel.DEBUG, logOptions = logDefaults }: { prefix?: string; logLevel?: LogLevel; logOptions?: LogOptions }) {
        this.prefix = prefix || '';
        this.logLevel = logLevel;
        this.logOptions = Object.assign({}, logDefaults, logOptions);
    }

    private log({ level, message, context }: { level: LogLevel; message: string; context?: Record<string, unknown> }) {
        if (level < this.logLevel) {
            return;
        }

        const logFn = level === LogLevel.ERROR ? console.error : console.log;

        const levelName = LogLevel[level];

        let logStr = `[${levelName}] [${new Date().toISOString()}] ${this.prefix} ${message}`;
        if (context) {
            const contextStr = this.logOptions.pretty ? stringify(context, 2) : stringify(context);
            logStr += ` ${contextStr}`;
        }
        logFn(logStr);
    }

    public debug(message: string, context?: Record<string, unknown>) {
        this.log({ level: LogLevel.DEBUG, message, context });
    }

    public info(message: string, context?: Record<string, unknown>) {
        this.log({ level: LogLevel.INFO, message, context });
    }

    public warn(message: string, context?: Record<string, unknown>) {
        this.log({ level: LogLevel.WARN, message, context });
    }

    public error(message: string, context?: Record<string, unknown>) {
        this.log({ level: LogLevel.ERROR, message, context });
    }
}
