/**
 * Structured Logger
 *
 * Provides consistent logging with levels, context, and structured output.
 * Based on weaver logging patterns.
 *
 * @module utils/logger
 */

import chalk from 'chalk';

/**
 * Log levels
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
  SILENT = 6,
}

/**
 * Log level names
 */
const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
  [LogLevel.SILENT]: 'SILENT',
};

/**
 * Log level colors
 */
const LOG_LEVEL_COLORS: Record<LogLevel, (text: string) => string> = {
  [LogLevel.TRACE]: chalk.gray,
  [LogLevel.DEBUG]: chalk.blue,
  [LogLevel.INFO]: chalk.green,
  [LogLevel.WARN]: chalk.yellow,
  [LogLevel.ERROR]: chalk.red,
  [LogLevel.FATAL]: chalk.bgRed.white,
  [LogLevel.SILENT]: (s: string) => s,
};

/**
 * Sanitize stack traces for production to remove/anonymize full file paths.
 * In development, returns the stack unchanged for debugging convenience.
 *
 * @param stack - The stack trace string to sanitize
 * @returns Sanitized stack trace (production) or original (development)
 */
function sanitizeStackTrace(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  if (process.env.NODE_ENV !== 'production') return stack;
  // Replace full paths with just file:line:column for security
  return stack.replace(/\(\/[^)]+\/([^/]+:\d+:\d+)\)/g, '($1)');
}

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  name?: string;
  error?: Error;
}

/**
 * Logger configuration
 */
export interface LoggerOptions {
  /** Minimum level to log (default: INFO) */
  level?: LogLevel;

  /** Logger name/prefix */
  name?: string;

  /** Whether to include timestamps (default: true) */
  timestamps?: boolean;

  /** Whether to output as JSON (default: false) */
  json?: boolean;

  /** Whether to use colors (default: true) */
  colors?: boolean;

  /** Custom output function */
  output?: (entry: LogEntry) => void;
}

/**
 * Parse log level from string
 */
export function parseLogLevel(level: string): LogLevel {
  const upper = level.toUpperCase();
  switch (upper) {
    case 'TRACE':
      return LogLevel.TRACE;
    case 'DEBUG':
      return LogLevel.DEBUG;
    case 'INFO':
      return LogLevel.INFO;
    case 'WARN':
    case 'WARNING':
      return LogLevel.WARN;
    case 'ERROR':
      return LogLevel.ERROR;
    case 'FATAL':
      return LogLevel.FATAL;
    case 'SILENT':
    case 'NONE':
      return LogLevel.SILENT;
    default:
      return LogLevel.INFO;
  }
}

/**
 * Logger class
 */
export class Logger {
  private level: LogLevel;
  private name?: string;
  private timestamps: boolean;
  private json: boolean;
  private colors: boolean;
  private output: (entry: LogEntry) => void;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.name = options.name;
    this.timestamps = options.timestamps ?? true;
    this.json = options.json ?? false;
    this.colors = options.colors ?? true;
    this.output = options.output ?? this.defaultOutput.bind(this);
  }

  /**
   * Default output implementation
   */
  private defaultOutput(entry: LogEntry): void {
    if (this.json) {
      console.log(JSON.stringify({
        level: LOG_LEVEL_NAMES[entry.level],
        message: entry.message,
        timestamp: entry.timestamp.toISOString(),
        name: entry.name,
        ...entry.context,
        error: entry.error ? {
          name: entry.error.name,
          message: entry.error.message,
          stack: sanitizeStackTrace(entry.error.stack),
        } : undefined,
      }));
      return;
    }

    const parts: string[] = [];

    // Timestamp
    if (this.timestamps) {
      const time = entry.timestamp.toISOString().slice(11, 23);
      parts.push(this.colors ? chalk.gray(`[${time}]`) : `[${time}]`);
    }

    // Level
    const levelName = LOG_LEVEL_NAMES[entry.level].padEnd(5);
    const colorFn = LOG_LEVEL_COLORS[entry.level];
    parts.push(this.colors ? colorFn(levelName) : levelName);

    // Name
    if (entry.name) {
      parts.push(this.colors ? chalk.cyan(`[${entry.name}]`) : `[${entry.name}]`);
    }

    // Message
    parts.push(entry.message);

    // Context
    if (entry.context && Object.keys(entry.context).length > 0) {
      const contextStr = JSON.stringify(entry.context);
      parts.push(this.colors ? chalk.gray(contextStr) : contextStr);
    }

    // Output
    const line = parts.join(' ');
    if (entry.level >= LogLevel.ERROR) {
      console.error(line);
      if (entry.error?.stack) {
        console.error(this.colors ? chalk.gray(entry.error.stack) : entry.error.stack);
      }
    } else {
      console.log(line);
    }
  }

  /**
   * Log at specified level
   */
  log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (level < this.level) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      name: this.name,
      context,
    };

    this.output(entry);
  }

  /**
   * Log trace message
   */
  trace(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.TRACE, message, context);
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      timestamp: new Date(),
      name: this.name,
      context,
      error,
    };

    if (LogLevel.ERROR >= this.level) {
      this.output(entry);
    }
  }

  /**
   * Log fatal message
   */
  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: LogLevel.FATAL,
      message,
      timestamp: new Date(),
      name: this.name,
      context,
      error,
    };

    if (LogLevel.FATAL >= this.level) {
      this.output(entry);
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(name: string): Logger {
    const childName = this.name ? `${this.name}:${name}` : name;
    return new Logger({
      level: this.level,
      name: childName,
      timestamps: this.timestamps,
      json: this.json,
      colors: this.colors,
      output: this.output,
    });
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Check if level is enabled
   */
  isLevelEnabled(level: LogLevel): boolean {
    return level >= this.level;
  }
}

/**
 * Default logger instance
 */
let defaultLogger: Logger | null = null;

/**
 * Get or create the default logger
 */
export function getLogger(): Logger {
  if (!defaultLogger) {
    const level = parseLogLevel(process.env.LOG_LEVEL ?? 'info');
    defaultLogger = new Logger({
      level,
      name: 'kg',
      colors: process.stdout.isTTY ?? true,
    });
  }
  return defaultLogger;
}

/**
 * Create a named logger
 */
export function createLogger(name: string, options: Omit<LoggerOptions, 'name'> = {}): Logger {
  return new Logger({ ...options, name });
}

/**
 * Set the default logger
 */
export function setDefaultLogger(logger: Logger): void {
  defaultLogger = logger;
}

/**
 * Progress indicator for long-running operations
 */
export interface ProgressLogger {
  start(message: string): void;
  update(message: string): void;
  succeed(message?: string): void;
  fail(message?: string): void;
  stop(): void;
}

/**
 * Create a simple progress logger
 */
export function createProgressLogger(logger: Logger = getLogger()): ProgressLogger {
  let currentMessage = '';

  return {
    start(message: string) {
      currentMessage = message;
      logger.info(`⏳ ${message}`);
    },
    update(message: string) {
      currentMessage = message;
      logger.debug(`   ${message}`);
    },
    succeed(message?: string) {
      logger.info(`✅ ${message ?? currentMessage}`);
    },
    fail(message?: string) {
      logger.error(`❌ ${message ?? currentMessage}`);
    },
    stop() {
      // No-op for simple logger
    },
  };
}
