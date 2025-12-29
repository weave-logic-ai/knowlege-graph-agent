/**
 * Error Recovery System
 *
 * Provides intelligent retry strategies with exponential backoff,
 * jitter, and circuit breaker patterns. Based on weaver recovery patterns.
 *
 * @module utils/error-recovery
 */

import {
  classifyError,
  ErrorCategory,
  type ClassifiedError,
  isRetryableError,
  isRateLimitError,
} from './error-taxonomy.js';

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
export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
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
export class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failures = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private readonly options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      resetTimeout: options.resetTimeout ?? 30000,
      successThreshold: options.successThreshold ?? 2,
      trackByErrorType: options.trackByErrorType ?? false,
    };
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    // Check if we should transition from OPEN to HALF_OPEN
    if (
      this.state === CircuitState.OPEN &&
      Date.now() - this.lastFailureTime >= this.options.resetTimeout
    ) {
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }
    return this.state;
  }

  /**
   * Check if circuit allows execution
   */
  canExecute(): boolean {
    const state = this.getState();
    return state === CircuitState.CLOSED || state === CircuitState.HALF_OPEN;
  }

  /**
   * Record a successful execution
   */
  recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successCount = 0;
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failures on success
      this.failures = 0;
    }
  }

  /**
   * Record a failed execution
   */
  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open returns to open
      this.state = CircuitState.OPEN;
      this.successCount = 0;
    } else if (this.failures >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

/**
 * Calculate delay with exponential backoff
 *
 * @param attempt - The current attempt number (1-based)
 * @param options - Retry options
 * @returns Delay in milliseconds
 */
export function calculateBackoff(
  attempt: number,
  options: Pick<RetryOptions, 'initialDelay' | 'maxDelay' | 'backoffFactor' | 'jitter' | 'jitterFactor'> = {}
): number {
  const initialDelay = options.initialDelay ?? 1000;
  const maxDelay = options.maxDelay ?? 30000;
  const backoffFactor = options.backoffFactor ?? 2;
  const jitter = options.jitter ?? true;
  const jitterFactor = options.jitterFactor ?? 0.1;

  // Calculate exponential delay
  let delay = initialDelay * Math.pow(backoffFactor, attempt - 1);

  // Cap at maximum
  delay = Math.min(delay, maxDelay);

  // Add jitter if enabled
  if (jitter) {
    const jitterAmount = delay * jitterFactor;
    delay = delay + (Math.random() * 2 - 1) * jitterAmount;
  }

  return Math.round(delay);
}

/**
 * Sleep for specified duration
 *
 * @param ms - Duration in milliseconds
 * @param signal - Optional abort signal
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Aborted'));
      return;
    }

    const timeout = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(timeout);
      reject(new Error('Aborted'));
    });
  });
}

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
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const maxRetries = options.maxRetries ?? 3;
  const isRetryable = options.isRetryable ?? isRetryableError;

  const startTime = Date.now();
  let attempt = 0;
  let lastError: ClassifiedError | undefined;

  while (attempt <= maxRetries) {
    try {
      // Check for abort
      if (options.signal?.aborted) {
        throw new Error('Operation aborted');
      }

      const value = await operation();
      return {
        success: true,
        value,
        attempts: attempt + 1,
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      const classified = classifyError(error);
      lastError = classified;
      attempt++;

      // Don't retry if we've exhausted attempts
      if (attempt > maxRetries) {
        break;
      }

      // Don't retry non-retryable errors
      if (!isRetryable(error)) {
        break;
      }

      // Calculate delay
      let delay = calculateBackoff(attempt, options);

      // Use suggested delay for rate limits (often includes Retry-After header)
      if (isRateLimitError(error) && classified.suggestedDelay > delay) {
        delay = classified.suggestedDelay;
      }

      // Notify about retry
      options.onRetry?.(classified, attempt, delay);

      // Wait before retry
      try {
        await sleep(delay, options.signal);
      } catch {
        // Aborted during sleep
        break;
      }
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: attempt,
    totalTime: Date.now() - startTime,
  };
}

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
export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const result = await withRetry(operation, options);

  if (result.success) {
    return result.value as T;
  }

  // Throw the original error
  throw result.error?.original ?? new Error('Operation failed');
}

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
export async function withFallback<T>(
  operations: Array<() => Promise<T>>,
  options: FallbackOptions<T> = {}
): Promise<T> {
  if (operations.length === 0) {
    if (options.defaultValue !== undefined) {
      return options.defaultValue;
    }
    throw new Error('No fallback operations provided');
  }

  let lastError: ClassifiedError | undefined;

  for (let i = 0; i < operations.length; i++) {
    try {
      if (options.signal?.aborted) {
        throw new Error('Operation aborted');
      }

      return await operations[i]();
    } catch (error) {
      const classified = classifyError(error);
      lastError = classified;
      options.onFallback?.(classified, i);
    }
  }

  if (options.defaultValue !== undefined) {
    return options.defaultValue;
  }

  throw lastError?.original ?? new Error('All fallback operations failed');
}

/**
 * Execute with circuit breaker
 *
 * @param operation - The operation to execute
 * @param breaker - Circuit breaker instance
 * @returns The operation result
 * @throws If circuit is open or operation fails
 */
export async function withCircuitBreaker<T>(
  operation: () => Promise<T>,
  breaker: CircuitBreaker
): Promise<T> {
  if (!breaker.canExecute()) {
    throw new Error('Circuit breaker is open');
  }

  try {
    const result = await operation();
    breaker.recordSuccess();
    return result;
  } catch (error) {
    breaker.recordFailure();
    throw error;
  }
}

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
export function retryable<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => retry(() => fn(...args), options);
}

/**
 * Error class for retries exhausted
 */
export class RetriesExhaustedError extends Error {
  public readonly lastError: ClassifiedError;
  public readonly attempts: number;

  constructor(lastError: ClassifiedError, attempts: number) {
    super(`All ${attempts} retry attempts exhausted: ${lastError.message}`);
    this.name = 'RetriesExhaustedError';
    this.lastError = lastError;
    this.attempts = attempts;
  }
}

/**
 * Error class for circuit breaker open
 */
export class CircuitOpenError extends Error {
  constructor(message = 'Circuit breaker is open') {
    super(message);
    this.name = 'CircuitOpenError';
  }
}
