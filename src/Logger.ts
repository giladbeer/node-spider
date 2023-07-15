export type LogLevel = 'debug' | 'warn' | 'error' | 'supress';
import { appendFileSync } from 'fs';

const ColorDict = {
  debug: '[32m', // green
  warn: '[33m', // yellow
  error: '[31m' // red
};

export class Logger {
  level: LogLevel;
  private static instance?: Logger;
  private outputFilePath?: string;

  private constructor(
    level: LogLevel,
    path = `spider_output_${new Date().toISOString()}.log`
  ) {
    this.level = level;
    this.outputFilePath = path;
  }

  static getInstance({
    logLevel,
    outputFilePath
  }: {
    logLevel?: LogLevel;
    outputFilePath?: string;
  }) {
    if (!Logger.instance) {
      Logger.instance = new Logger(
        logLevel || (process.env.SPIDER_LOG_LEVEL as LogLevel) || 'warn',
        outputFilePath
      );
    }
    return Logger.instance;
  }

  private formatted(message: string, level: LogLevel) {
    return `\x1b${
      ColorDict[level as keyof typeof ColorDict]
    } [${new Date().toISOString()}] [${level.toUpperCase()}] ${message}\x1b[0m`;
  }

  private writeLog(
    message: string,
    level: 'debug' | 'warn' | 'error',
    data?: unknown
  ) {
    if (data) {
      console[level](this.formatted(message, level), data);
      if (this.outputFilePath) {
        appendFileSync(
          this.outputFilePath,
          `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}` +
            '    ' +
            (typeof data === 'object' ? JSON.stringify(data) : data) +
            '\n'
        );
      }
    } else {
      console[level](this.formatted(message, level));
      if (this.outputFilePath) {
        appendFileSync(
          this.outputFilePath,
          `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}\n`
        );
      }
    }
  }

  public debug(message: string, data?: unknown) {
    if (this.level === 'debug') {
      this.writeLog(message, 'debug', data);
    }
  }

  public warn(message: string, data?: unknown) {
    if (!['error', 'supress'].includes(this.level)) {
      this.writeLog(message, 'warn', data);
    }
  }

  public error(message: string, data?: unknown) {
    if (this.level !== 'supress') {
      this.writeLog(message, 'warn', data);
    }
  }
}
