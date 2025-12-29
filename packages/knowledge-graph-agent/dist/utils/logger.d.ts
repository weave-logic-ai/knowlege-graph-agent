/**
 * Structured Logger
 *
 * Provides consistent logging with levels, context, and structured output.
 * Based on weaver logging patterns.
 *
 * @module utils/logger
 */
/**
 * Log levels
 */
export declare enum LogLevel {
    TRACE = 0,
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
    FATAL = 5,
    SILENT = 6
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
export declare function parseLogLevel(level: string): LogLevel;
/**
 * Logger class
 */
export declare class Logger {
    private level;
    private name?;
    private timestamps;
    private json;
    private colors;
    private output;
    constructor(options?: LoggerOptions);
    /**
     * Default output implementation
     */
    private defaultOutput;
    /**
     * Log at specified level
     */
    log(level: LogLevel, message: string, context?: Record<string, unknown>): void;
    /**
     * Log trace message
     */
    trace(message: string, context?: Record<string, unknown>): void;
    /**
     * Log debug message
     */
    debug(message: string, context?: Record<string, unknown>): void;
    /**
     * Log info message
     */
    info(message: string, context?: Record<string, unknown>): void;
    /**
     * Log warning message
     */
    warn(message: string, context?: Record<string, unknown>): void;
    /**
     * Log error message
     */
    error(message: string, error?: Error, context?: Record<string, unknown>): void;
    /**
     * Log fatal message
     */
    fatal(message: string, error?: Error, context?: Record<string, unknown>): void;
    /**
     * Create a child logger with additional context
     */
    child(name: string): Logger;
    /**
     * Set log level
     */
    setLevel(level: LogLevel): void;
    /**
     * Get current log level
     */
    getLevel(): LogLevel;
    /**
     * Check if level is enabled
     */
    isLevelEnabled(level: LogLevel): boolean;
}
/**
 * Get or create the default logger
 */
export declare function getLogger(): Logger;
/**
 * Create a named logger
 */
export declare function createLogger(name: string, options?: Omit<LoggerOptions, 'name'>): Logger;
/**
 * Set the default logger
 */
export declare function setDefaultLogger(logger: Logger): void;
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
export declare function createProgressLogger(logger?: Logger): ProgressLogger;
//# sourceMappingURL=logger.d.ts.map