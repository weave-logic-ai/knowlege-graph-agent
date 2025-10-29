/**
 * Error Recovery - Retry logic with exponential backoff
 *
 * Provides robust retry mechanisms with intelligent backoff strategies,
 * jitter to prevent thundering herd, and per-error-type configuration.
 */

import pRetry, { type Options as PRetryOptions, AbortError } from 'p-retry';
import pTimeout from 'p-timeout';
import { logger } from './logger.js';
import {
  type ErrorCategory,
  type ErrorClassification,
  classifyError,
  isRetryable,
  getRetryCount,
  getBaseDelay,
} from './error-taxonomy.js';

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts?: number;

  /** Initial delay in milliseconds */
  initialDelay?: number;

  /** Maximum delay between retries */
  maxDelay?: number;

  /** Backoff multiplier (exponential growth factor) */
  backoffMultiplier?: number;

  /** Add random jitter to prevent thundering herd */
  jitter?: boolean;

  /** Timeout for each individual attempt (ms) */
  attemptTimeout?: number;

  /** Custom error classifier */
  errorClassifier?: (error: Error) => ErrorClassification;

  /** Callback on each retry */
  onRetry?: (error: Error, attempt: number) => void | Promise<void>;

  /** Callback when giving up */
  onFailure?: (error: Error) => void | Promise<void>;
}

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG: Required<Omit<RetryConfig, 'errorClassifier' | 'onRetry' | 'onFailure' | 'attemptTimeout'>> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
};

/**
 * Retry an operation with exponential backoff
 *
 * @param operation - Async operation to retry
 * @param config - Retry configuration
 * @returns Result of successful operation
 * @throws Last error if all retries exhausted
 */
export async function withRetry<T>(
  operation: (attemptNumber: number) => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const classifier = config.errorClassifier ?? classifyError;

  let lastClassification: ErrorClassification | null = null;

  const pRetryOptions: PRetryOptions = {
    retries: mergedConfig.maxAttempts,
    factor: mergedConfig.backoffMultiplier,
    minTimeout: mergedConfig.initialDelay,
    maxTimeout: mergedConfig.maxDelay,
    randomize: mergedConfig.jitter,

    onFailedAttempt: async (error) => {
      // Ensure we have an Error object
      const actualError = error instanceof Error ? error : new Error(String(error));

      // Classify the error
      lastClassification = classifier(actualError);

      // Check if error is retryable
      if (!lastClassification.retryable) {
        logger.error('Non-retryable error encountered', actualError, {
          category: lastClassification.category,
          attempt: error.attemptNumber,
        });
        throw new AbortError(actualError);
      }

      // Log retry attempt
      logger.warn('Operation failed, retrying', {
        category: lastClassification.category,
        attempt: error.attemptNumber,
        retriesLeft: error.retriesLeft,
        errorMessage: actualError.message,
      });

      // Call retry callback
      if (config.onRetry) {
        await config.onRetry(actualError, error.attemptNumber);
      }
    },
  };

  try {
    // Wrap operation with timeout if configured
    const wrappedOperation = (attemptNumber: number) => {
      if (config.attemptTimeout) {
        return pTimeout(operation(attemptNumber), {
          milliseconds: config.attemptTimeout,
          message: `Operation timed out after ${config.attemptTimeout}ms`,
        });
      }
      return operation(attemptNumber);
    };

    const result = await pRetry(wrappedOperation, pRetryOptions);

    logger.info('Operation succeeded after retries');
    return result;
  } catch (error) {
    const finalError = error as Error;

    logger.error('Operation failed after all retries', finalError, {
      category: lastClassification?.category ?? 'unknown',
      maxAttempts: mergedConfig.maxAttempts,
    });

    // Call failure callback
    if (config.onFailure) {
      await config.onFailure(finalError);
    }

    throw finalError;
  }
}

/**
 * Retry with automatic error classification
 *
 * Automatically determines retry strategy based on error type
 */
export async function withSmartRetry<T>(
  operation: (attemptNumber: number) => Promise<T>,
  context?: string
): Promise<T> {
  return withRetry(operation, {
    errorClassifier: (error: Error) => {
      const classification = classifyError(error);

      logger.debug('Error classified', {
        context,
        category: classification.category,
        retryable: classification.retryable,
        maxRetries: classification.maxRetries,
      });

      return classification;
    },

    onRetry: async (error, attempt) => {
      const classification = classifyError(error);

      logger.info('Retrying operation', {
        context,
        attempt,
        category: classification.category,
        suggestions: classification.suggestions,
      });
    },

    onFailure: async (error) => {
      const classification = classifyError(error);

      logger.error('Operation failed permanently', error, {
        context,
        category: classification.category,
        suggestions: classification.suggestions,
      });
    },
  });
}

/**
 * Retry with per-category configuration
 */
export async function withCategorizedRetry<T>(
  operation: (attemptNumber: number) => Promise<T>,
  categoryConfig: Partial<Record<ErrorCategory, RetryConfig>> = {}
): Promise<T> {
  let currentCategory: ErrorCategory | null = null;

  return withRetry(operation, {
    errorClassifier: (error: Error) => {
      const classification = classifyError(error);
      currentCategory = classification.category;
      return classification;
    },

    maxAttempts: 3, // Default

    onRetry: async (error, attempt) => {
      if (currentCategory && categoryConfig[currentCategory]?.onRetry) {
        await categoryConfig[currentCategory]!.onRetry!(error, attempt);
      }
    },
  });
}

/**
 * Batch retry with individual error handling
 *
 * Retries a batch of operations, continuing on individual failures
 */
export async function withBatchRetry<T>(
  operations: Array<() => Promise<T>>,
  config: RetryConfig = {}
): Promise<Array<{ success: boolean; result?: T; error?: Error }>> {
  const results = await Promise.allSettled(
    operations.map((op) => withRetry(op, config))
  );

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return { success: true, result: result.value };
    } else {
      return { success: false, error: result.reason };
    }
  });
}

/**
 * Retry with circuit breaker pattern
 *
 * Prevents overwhelming failing services with requests
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private config: {
      failureThreshold: number;
      resetTimeout: number;
      halfOpenAttempts: number;
    } = {
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenAttempts: 1,
    }
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;

      if (timeSinceLastFailure >= this.config.resetTimeout) {
        this.state = 'half-open';
        logger.info('Circuit breaker transitioning to half-open');
      } else {
        throw new Error('Circuit breaker is open - service unavailable');
      }
    }

    try {
      const result = await operation();

      if (this.state === 'half-open') {
        this.reset();
        logger.info('Circuit breaker reset to closed');
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
      logger.warn('Circuit breaker opened', {
        failures: this.failures,
        threshold: this.config.failureThreshold,
      });
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  getState(): string {
    return this.state;
  }
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoff(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  multiplier: number = 2,
  jitter: boolean = true
): number {
  const exponentialDelay = Math.min(
    baseDelay * Math.pow(multiplier, attempt),
    maxDelay
  );

  if (jitter) {
    // Add random jitter (0-50% of delay)
    const jitterAmount = exponentialDelay * 0.5 * Math.random();
    return exponentialDelay + jitterAmount;
  }

  return exponentialDelay;
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
