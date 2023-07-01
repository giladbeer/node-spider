export type LogLevel = 'debug' | 'warn' | 'error' | 'supress';

const ColorDict = {
  debug: '[32m',
  warn: '[33m',
  error: '[31m'
};

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

  private formatted(message: string, level: LogLevel) {
    return `\x1b${
      ColorDict[level as keyof typeof ColorDict]
    } [${new Date().toISOString()}] [${level.toUpperCase()}] ${message}\x1b[0m`;
  }

  public debug(message: string, data?: unknown) {
    if (this.level === 'debug') {
      if (data) {
        console.debug(this.formatted(message, 'debug'), data);
      } else {
        console.debug(this.formatted(message, 'debug'));
      }
    }
  }

  public warn(message: string, data?: unknown) {
    if (!['error', 'supress'].includes(this.level)) {
      if (data) {
        console.warn(this.formatted(message, 'warn'), data);
      } else {
        console.warn(this.formatted(message, 'warn'));
      }
    }
  }

  public error(message: string, data?: unknown) {
    if (this.level !== 'supress') {
      if (data) {
        console.error(this.formatted(message, 'error'), data);
      } else {
        console.error(this.formatted(message, 'error'));
      }
    }
  }
}
