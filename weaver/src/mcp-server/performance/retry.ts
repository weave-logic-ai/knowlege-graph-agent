/**
 * Automatic Retry with Exponential Backoff
 *
 * Provides automatic retry logic for failed MCP requests with exponential backoff,
 * jitter, and configurable retry policies.
 */

import { logger } from '../../utils/logger.js';
import type { ToolResult } from '../types/index.js';

/**
 * Retry configuration
 */
export interface RetryConfig {
  /**
   * Maximum retry attempts (default: 3)
   */
  maxAttempts: number;

  /**
   * Initial delay in milliseconds (default: 1000)
   */
  initialDelayMs: number;

  /**
   * Maximum delay in milliseconds (default: 30000)
   */
  maxDelayMs: number;

  /**
   * Backoff multiplier (default: 2)
   */
  backoffMultiplier: number;

  /**
   * Add jitter to prevent thundering herd (default: true)
   */
  jitter: boolean;

  /**
   * Enable/disable retry
   */
  enabled: boolean;
}

/**
 * Retry policy - determines if an error should be retried
 */
export type RetryPolicy = (error: Error, attempt: number) => boolean;

/**
 * Retry attempt info
 */
export interface RetryAttempt {
  attempt: number;
  delay: number;
  error: Error;
  timestamp: number;
}

/**
 * Retry result
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: RetryAttempt[];
  totalTime: number;
}

/**
 * Default retry policy - retry on network/timeout errors
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = (error: Error, attempt: number) => {
  const retryableErrors = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
    'EAI_AGAIN',
  ];

  const errorCode = (error as any).code;
  const isRetryable = retryableErrors.includes(errorCode) ||
    error.message.includes('timeout') ||
    error.message.includes('network');

  return isRetryable;
};

/**
 * Retry Manager
 *
 * Manages automatic retry logic with exponential backoff.
 */
export class RetryManager {
  private config: RetryConfig;

  /**
   * Create a new retry manager
   *
   * @param config - Retry configuration
   */
  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: config.maxAttempts || 3,
      initialDelayMs: config.initialDelayMs || 1000,
      maxDelayMs: config.maxDelayMs || 30000,
      backoffMultiplier: config.backoffMultiplier || 2,
      jitter: config.jitter !== false,
      enabled: config.enabled !== false,
    };

    logger.debug('RetryManager initialized', this.config as unknown as Record<string, unknown>);
  }

  /**
   * Execute operation with automatic retry
   *
   * @param operation - Operation to execute
   * @param policy - Retry policy (optional)
   * @returns Retry result
   */
  async execute<T>(
    operation: () => Promise<T>,
    policy: RetryPolicy = DEFAULT_RETRY_POLICY
  ): Promise<RetryResult<T>> {
    if (!this.config.enabled) {
      // Retry disabled, execute once
      try {
        const result = await operation();
        return {
          success: true,
          result,
          attempts: [],
          totalTime: 0,
        };
      } catch (error) {
        return {
          success: false,
          error: error as Error,
          attempts: [],
          totalTime: 0,
        };
      }
    }

    const startTime = Date.now();
    const attempts: RetryAttempt[] = [];
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        logger.debug('Executing operation', { attempt, maxAttempts: this.config.maxAttempts });

        const result = await operation();

        const totalTime = Date.now() - startTime;

        logger.info('Operation succeeded', {
          attempt,
          totalTime: `${totalTime}ms`,
        });

        return {
          success: true,
          result,
          attempts,
          totalTime,
        };
      } catch (error) {
        lastError = error as Error;

        logger.warn('Operation failed', {
          attempt,
          error: lastError.message,
        });

        // Check if we should retry
        if (attempt >= this.config.maxAttempts) {
          break;
        }

        if (!policy(lastError, attempt)) {
          logger.debug('Error not retryable, aborting', {
            error: lastError.message,
          });
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt);

        attempts.push({
          attempt,
          delay,
          error: lastError,
          timestamp: Date.now(),
        });

        logger.info('Retrying after delay', {
          attempt,
          delay: `${delay}ms`,
          nextAttempt: attempt + 1,
        });

        // Wait before retry
        await this.sleep(delay);
      }
    }

    const totalTime = Date.now() - startTime;

    logger.error('Operation failed after all retries', lastError!, {
      attempts: this.config.maxAttempts,
      totalTime: `${totalTime}ms`,
    });

    return {
      success: false,
      error: lastError,
      attempts,
      totalTime,
    };
  }

  /**
   * Calculate delay for retry attempt with exponential backoff
   *
   * @param attempt - Attempt number (1-based)
   * @returns Delay in milliseconds
   */
  private calculateDelay(attempt: number): number {
    // Exponential backoff: initialDelay * (multiplier ^ (attempt - 1))
    let delay = this.config.initialDelayMs * Math.pow(
      this.config.backoffMultiplier,
      attempt - 1
    );

    // Cap at max delay
    delay = Math.min(delay, this.config.maxDelayMs);

    // Add jitter to prevent thundering herd
    if (this.config.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += Math.random() * jitterAmount - jitterAmount / 2;
    }

    return Math.floor(delay);
  }

  /**
   * Sleep for specified duration
   *
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create a retry policy that retries on specific error codes
   *
   * @param errorCodes - Array of error codes to retry
   * @returns Retry policy
   */
  static createErrorCodePolicy(errorCodes: string[]): RetryPolicy {
    return (error: Error) => {
      const code = (error as any).code;
      return errorCodes.includes(code);
    };
  }

  /**
   * Create a retry policy that retries on specific error messages
   *
   * @param patterns - Array of error message patterns (regex or string)
   * @returns Retry policy
   */
  static createMessagePolicy(patterns: (string | RegExp)[]): RetryPolicy {
    return (error: Error) => {
      const message = error.message;
      return patterns.some((pattern) => {
        if (typeof pattern === 'string') {
          return message.includes(pattern);
        }
        return pattern.test(message);
      });
    };
  }

  /**
   * Create a retry policy that always retries
   *
   * @returns Retry policy
   */
  static createAlwaysRetryPolicy(): RetryPolicy {
    return () => true;
  }

  /**
   * Create a retry policy that never retries
   *
   * @returns Retry policy
   */
  static createNeverRetryPolicy(): RetryPolicy {
    return () => false;
  }

  /**
   * Update retry configuration
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Retry configuration updated', this.config as unknown as Record<string, unknown>);
  }

  /**
   * Get retry configuration
   *
   * @returns Current configuration
   */
  getConfig(): RetryConfig {
    return { ...this.config };
  }
}

/**
 * Decorator for automatic retry
 *
 * @param config - Retry configuration
 * @param policy - Retry policy
 */
export function withRetry<T extends any[], R>(
  config?: Partial<RetryConfig>,
  policy?: RetryPolicy
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const retryManager = new RetryManager(config);

    descriptor.value = async function (...args: T): Promise<R> {
      const result = await retryManager.execute(
        () => originalMethod.apply(this, args),
        policy
      );

      if (!result.success) {
        throw result.error;
      }

      return result.result! as R;
    };

    return descriptor;
  };
}
