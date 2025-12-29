/**
 * Error Recovery System
 *
 * Provides intelligent retry strategies with exponential backoff,
 * jitter, and circuit breaker patterns. Based on weaver recovery patterns.
 *
 * @module utils/error-recovery
 */
import { type ClassifiedError } from './error-taxonomy.js';
/**
 * Retry configuration options
 */
export interface RetryOptions {
    /** Maximum number of retry attempts (default: 3) */
    maxRetries?: number;
    /** Initial delay in milliseconds (default: 1000) */
    initialDelay?: number;
    /** Maximum delay in milliseconds (default: 30000) */
    maxDelay?: number;
    /** Backoff factor for exponential backoff (default: 2) */
    backoffFactor?: number;
    /** Whether to add random jitter (default: true) */
    jitter?: boolean;
    /** Jitter factor (0-1, default: 0.1) */
    jitterFactor?: number;
    /** Custom function to determine if error is retryable */
    isRetryable?: (error: unknown) => boolean;
    /** Called before each retry attempt */
    onRetry?: (error: ClassifiedError, attempt: number, delay: number) => void;
    /** Abort signal for cancellation */
    signal?: AbortSignal;
}
/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
    /** Whether the operation succeeded */
    success: boolean;
    /** The result value (if successful) */
    value?: T;
    /** The final error (if failed) */
    error?: ClassifiedError;
    /** Number of attempts made */
    attempts: number;
    /** Total time spent in milliseconds */
    totalTime: number;
}
/**
 * Circuit breaker state
 */
export declare enum CircuitState {
    CLOSED = "closed",
    OPEN = "open",
    HALF_OPEN = "half_open"
}
/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerOptions {
    /** Number of failures before opening circuit (default: 5) */
    failureThreshold?: number;
    /** Time in ms before testing circuit again (default: 30000) */
    resetTimeout?: number;
    /** Number of successful tests before fully closing (default: 2) */
    successThreshold?: number;
    /** Whether to track errors by type (default: false) */
    trackByErrorType?: boolean;
}
/**
 * Circuit breaker for protecting against cascading failures
 */
export declare class CircuitBreaker {
    private state;
    private failures;
    private successCount;
    private lastFailureTime;
    private readonly options;
    constructor(options?: CircuitBreakerOptions);
    /**
     * Get current circuit state
     */
    getState(): CircuitState;
    /**
     * Check if circuit allows execution
     */
    canExecute(): boolean;
    /**
     * Record a successful execution
     */
    recordSuccess(): void;
    /**
     * Record a failed execution
     */
    recordFailure(): void;
    /**
     * Reset the circuit breaker
     */
    reset(): void;
}
/**
 * Calculate delay with exponential backoff
 *
 * @param attempt - The current attempt number (1-based)
 * @param options - Retry options
 * @returns Delay in milliseconds
 */
export declare function calculateBackoff(attempt: number, options?: Pick<RetryOptions, 'initialDelay' | 'maxDelay' | 'backoffFactor' | 'jitter' | 'jitterFactor'>): number;
/**
 * Sleep for specified duration
 *
 * @param ms - Duration in milliseconds
 * @param signal - Optional abort signal
 */
export declare function sleep(ms: number, signal?: AbortSignal): Promise<void>;
/**
 * Execute operation with automatic retry
 *
 * @param operation - The async operation to execute
 * @param options - Retry configuration
 * @returns Result containing value or error
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetchData(),
 *   { maxRetries: 5, onRetry: (err, attempt) => console.log(`Retry ${attempt}`) }
 * );
 *
 * if (result.success) {
 *   console.log('Data:', result.value);
 * } else {
 *   console.error('Failed after', result.attempts, 'attempts');
 * }
 * ```
 */
export declare function withRetry<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
/**
 * Execute operation with automatic retry (throws on failure)
 *
 * @param operation - The async operation to execute
 * @param options - Retry configuration
 * @returns The operation result
 * @throws The last error if all retries fail
 *
 * @example
 * ```typescript
 * try {
 *   const data = await retry(() => fetchData(), { maxRetries: 3 });
 *   console.log('Data:', data);
 * } catch (error) {
 *   console.error('All retries failed:', error);
 * }
 * ```
 */
export declare function retry<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T>;
/**
 * Fallback chain options
 */
export interface FallbackOptions<T> {
    /** Called when primary operation fails */
    onFallback?: (error: ClassifiedError, index: number) => void;
    /** Abort signal */
    signal?: AbortSignal;
    /** Default value if all operations fail */
    defaultValue?: T;
}
/**
 * Execute with fallback chain
 *
 * Tries each operation in sequence until one succeeds.
 *
 * @param operations - Array of fallback operations
 * @param options - Fallback configuration
 * @returns The first successful result or default value
 *
 * @example
 * ```typescript
 * const data = await withFallback(
 *   [
 *     () => fetchFromPrimary(),
 *     () => fetchFromSecondary(),
 *     () => fetchFromCache(),
 *   ],
 *   { defaultValue: { cached: true, data: [] } }
 * );
 * ```
 */
export declare function withFallback<T>(operations: Array<() => Promise<T>>, options?: FallbackOptions<T>): Promise<T>;
/**
 * Execute with circuit breaker
 *
 * @param operation - The operation to execute
 * @param breaker - Circuit breaker instance
 * @returns The operation result
 * @throws If circuit is open or operation fails
 */
export declare function withCircuitBreaker<T>(operation: () => Promise<T>, breaker: CircuitBreaker): Promise<T>;
/**
 * Create a retryable version of an async function
 *
 * @param fn - The async function to wrap
 * @param options - Default retry options
 * @returns A new function that automatically retries on failure
 *
 * @example
 * ```typescript
 * const fetchWithRetry = retryable(
 *   (url: string) => fetch(url),
 *   { maxRetries: 3 }
 * );
 *
 * const response = await fetchWithRetry('https://api.example.com/data');
 * ```
 */
export declare function retryable<TArgs extends unknown[], TResult>(fn: (...args: TArgs) => Promise<TResult>, options?: RetryOptions): (...args: TArgs) => Promise<TResult>;
/**
 * Error class for retries exhausted
 */
export declare class RetriesExhaustedError extends Error {
    readonly lastError: ClassifiedError;
    readonly attempts: number;
    constructor(lastError: ClassifiedError, attempts: number);
}
/**
 * Error class for circuit breaker open
 */
export declare class CircuitOpenError extends Error {
    constructor(message?: string);
}
//# sourceMappingURL=error-recovery.d.ts.map