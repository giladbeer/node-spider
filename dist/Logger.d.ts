export declare type LogLevel = 'debug' | 'warn' | 'error' | 'supress';
export declare class Logger {
    level: LogLevel;
    private static instance?;
    private constructor();
    static getInstance(logLevel?: LogLevel): Logger;
    debug(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, data?: unknown): void;
}
