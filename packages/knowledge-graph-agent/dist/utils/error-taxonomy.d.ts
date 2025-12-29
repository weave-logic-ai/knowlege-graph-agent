/**
 * Error Taxonomy System
 *
 * Provides structured error classification for intelligent retry strategies
 * and graceful degradation. Based on weaver error handling patterns.
 *
 * @module utils/error-taxonomy
 */
/**
 * Error categories for classification and recovery strategy selection
 */
export declare enum ErrorCategory {
    /** Transient errors that may succeed on retry (network hiccups, temporary failures) */
    TRANSIENT = "transient",
    /** Permanent errors that won't succeed on retry (invalid input, missing resources) */
    PERMANENT = "permanent",
    /** Rate limit errors requiring backoff (429 responses) */
    RATE_LIMIT = "rate_limit",
    /** Network connectivity errors (DNS, connection refused) */
    NETWORK = "network",
    /** Input validation errors (schema violations, type mismatches) */
    VALIDATION = "validation",
    /** Resource errors (file not found, permissions) */
    RESOURCE = "resource",
    /** Configuration errors (missing config, invalid settings) */
    CONFIGURATION = "configuration",
    /** Timeout errors (operation exceeded time limit) */
    TIMEOUT = "timeout",
    /** Unknown errors that couldn't be classified */
    UNKNOWN = "unknown"
}
/**
 * Error severity levels
 */
export declare enum ErrorSeverity {
    /** Informational - operation can continue */
    INFO = "info",
    /** Warning - operation continues with degraded functionality */
    WARNING = "warning",
    /** Error - operation failed but system stable */
    ERROR = "error",
    /** Critical - operation failed, may affect system stability */
    CRITICAL = "critical",
    /** Fatal - system cannot continue */
    FATAL = "fatal"
}
/**
 * Classified error with metadata
 */
export interface ClassifiedError {
    /** Original error */
    original: Error | unknown;
    /** Classified category */
    category: ErrorCategory;
    /** Error severity */
    severity: ErrorSeverity;
    /** Whether retry is recommended */
    retryable: boolean;
    /** Suggested delay before retry (milliseconds) */
    suggestedDelay: number;
    /** Error message */
    message: string;
    /** Error code if available */
    code?: string;
    /** HTTP status code if applicable */
    statusCode?: number;
    /** Additional context */
    context?: Record<string, unknown>;
}
/**
 * Classify an error into a category with recovery metadata
 *
 * @param error - The error to classify
 * @returns Classified error with recovery recommendations
 *
 * @example
 * ```typescript
 * try {
 *   await fetchData();
 * } catch (error) {
 *   const classified = classifyError(error);
 *   if (classified.retryable) {
 *     await delay(classified.suggestedDelay);
 *     return retry();
 *   }
 *   throw error;
 * }
 * ```
 */
export declare function classifyError(error: unknown): ClassifiedError;
/**
 * Check if an error is retryable
 *
 * @param error - The error to check
 * @returns Whether the error is retryable
 */
export declare function isRetryableError(error: unknown): boolean;
/**
 * Check if an error is transient (temporary failure)
 *
 * @param error - The error to check
 * @returns Whether the error is transient
 */
export declare function isTransientError(error: unknown): boolean;
/**
 * Check if an error is a rate limit error
 *
 * @param error - The error to check
 * @returns Whether the error is a rate limit error
 */
export declare function isRateLimitError(error: unknown): boolean;
/**
 * Check if an error is permanent (won't succeed on retry)
 *
 * @param error - The error to check
 * @returns Whether the error is permanent
 */
export declare function isPermanentError(error: unknown): boolean;
/**
 * Custom error class for knowledge graph operations
 */
export declare class KnowledgeGraphError extends Error {
    readonly category: ErrorCategory;
    readonly severity: ErrorSeverity;
    readonly retryable: boolean;
    readonly code?: string;
    readonly context?: Record<string, unknown>;
    constructor(message: string, options?: {
        category?: ErrorCategory;
        severity?: ErrorSeverity;
        retryable?: boolean;
        code?: string;
        context?: Record<string, unknown>;
        cause?: Error;
    });
}
/**
 * Create a validation error
 */
export declare function createValidationError(message: string, context?: Record<string, unknown>): KnowledgeGraphError;
/**
 * Create a configuration error
 */
export declare function createConfigurationError(message: string, context?: Record<string, unknown>): KnowledgeGraphError;
/**
 * Create a resource error
 */
export declare function createResourceError(message: string, context?: Record<string, unknown>): KnowledgeGraphError;
//# sourceMappingURL=error-taxonomy.d.ts.map