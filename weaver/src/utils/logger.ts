/**
 * Weaver Logger Utility
 *
 * Simple, structured logging with support for different log levels
 * and JSON output for production environments.
 */

import { config } from '../config/index.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: number;
  private isProduction: boolean;

  constructor(minLevel: LogLevel = 'info') {
    this.minLevel = LOG_LEVELS[minLevel];
    this.isProduction = config.server.nodeEnv === 'production';
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= this.minLevel;
  }

  /**
   * Format log entry for output
   */
  private formatLog(entry: LogEntry): string {
    if (this.isProduction) {
      // JSON format for production (easier to parse)
      return JSON.stringify(entry);
    }

    // Human-readable format for development
    const timestamp = entry.timestamp;
    const level = entry.level.toUpperCase().padEnd(5);
    const message = entry.message;
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const error = entry.error
      ? `\n  Error: ${entry.error.name}: ${entry.error.message}\n  ${entry.error.stack}`
      : '';

    return `[${timestamp}] ${level} ${message}${context}${error}`;
  }

  /**
   * Log a message at the specified level
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };

    const formatted = this.formatLog(entry);

    // Output to appropriate stream
    if (level === 'error') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, context, error);
  }

  /**
   * Create a child logger with additional context
   */
  child(defaultContext: Record<string, unknown>): Logger {
    const childLogger = new Logger(config.server.logLevel);

    // Override log method to include default context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) => {
      const mergedContext = { ...defaultContext, ...context };
      originalLog(level, message, mergedContext, error);
    };

    return childLogger;
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger(config.server.logLevel);

/**
 * Create a logger for a specific module
 */
export function createLogger(module: string): Logger {
  return logger.child({ module });
}
