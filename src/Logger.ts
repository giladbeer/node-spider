export type LogLevel = 'debug' | 'warn' | 'error' | 'supress';

export class Logger {
  level: LogLevel;
  private static instance?: Logger;

  private constructor(level: LogLevel) {
    this.level = level;
  }

  static getInstance(logLevel?: LogLevel) {
    if (!Logger.instance) {
      Logger.instance = new Logger(
        logLevel || (process.env.SPIDER_LOG_LEVEL as LogLevel) || 'warn'
      );
    }
    return Logger.instance;
  }

  public debug(message: string, data?: unknown) {
    if (this.level === 'debug') {
      if (data) {
        console.debug(message, data);
      } else {
        console.debug(message);
      }
    }
  }

  public warn(message: string, data?: unknown) {
    if (!['error', 'supress'].includes(this.level)) {
      if (data) {
        console.warn(message, data);
      } else {
        console.warn(message);
      }
    }
  }

  public error(message: string, data?: unknown) {
    if (this.level !== 'supress') {
      if (data) {
        console.error(message, data);
      } else {
        console.error(message);
      }
    }
  }
}
