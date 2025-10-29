/**
 * Error Recovery System Tests
 *
 * Comprehensive test suite for retry logic, error classification,
 * fallback chains, and error monitoring.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withRetry,
  withSmartRetry,
  CircuitBreaker,
  calculateBackoff,
} from '../../../src/utils/error-recovery.js';
import {
  classifyError,
  ErrorCategory,
  isRetryable,
} from '../../../src/utils/error-taxonomy.js';
import {
  withFallbackChain,
  createSmartOperation,
} from '../../../src/utils/alternative-approaches.js';
import { errorPatternDB } from '../../../src/utils/error-patterns.js';
import { ErrorMonitor } from '../../../src/utils/error-monitoring.js';

describe('Error Recovery System', () => {
  describe('Error Classification', () => {
    it('should classify network errors correctly', () => {
      const error = new Error('ECONNREFUSED connection refused');
      const classification = classifyError(error);

      expect(classification.category).toBe(ErrorCategory.NETWORK);
      expect(classification.retryable).toBe(true);
      expect(classification.maxRetries).toBeGreaterThan(0);
    });

    it('should classify rate limit errors correctly', () => {
      const error = new Error('Rate limit exceeded: 429 Too Many Requests');
      const classification = classifyError(error);

      expect(classification.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(classification.retryable).toBe(true);
      expect(classification.baseDelay).toBeGreaterThan(1000);
    });

    it('should classify authentication errors as non-retryable', () => {
      const error = new Error('401 Unauthorized: Invalid API key');
      const classification = classifyError(error);

      expect(classification.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(classification.retryable).toBe(false);
      expect(classification.maxRetries).toBe(0);
    });

    it('should classify validation errors as non-retryable', () => {
      const error = new Error('Validation failed: Invalid input format');
      const classification = classifyError(error);

      expect(classification.category).toBe(ErrorCategory.VALIDATION);
      expect(classification.retryable).toBe(false);
    });

    it('should classify timeout errors as transient', () => {
      const error = new Error('Request timeout exceeded');
      const classification = classifyError(error);

      expect(classification.category).toBe(ErrorCategory.TRANSIENT);
      expect(classification.retryable).toBe(true);
    });

    it('should provide helpful suggestions', () => {
      const error = new Error('503 Service Unavailable');
      const classification = classifyError(error);

      expect(classification.suggestions.length).toBeGreaterThan(0);
      expect(classification.suggestions.some(s =>
        s.toLowerCase().includes('retry') || s.toLowerCase().includes('wait')
      )).toBe(true);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;

      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('ETIMEDOUT timeout');
        }
        return 'success';
      });

      const result = await withRetry(operation, {
        maxAttempts: 3,
        initialDelay: 10,
        jitter: false,
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should respect max retry attempts', async () => {
      const operation = vi.fn(async () => {
        throw new Error('Permanent failure');
      });

      await expect(
        withRetry(operation, {
          maxAttempts: 2,
          initialDelay: 10,
        })
      ).rejects.toThrow('Permanent failure');

      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn(async () => {
        throw new Error('401 Unauthorized: Invalid API key');
      });

      await expect(
        withSmartRetry(operation, 'test')
      ).rejects.toThrow();

      // Should fail immediately without retries (1 attempt, no retries)
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should apply exponential backoff', () => {
      const delay1 = calculateBackoff(0, 1000, 10000, 2, false);
      const delay2 = calculateBackoff(1, 1000, 10000, 2, false);
      const delay3 = calculateBackoff(2, 1000, 10000, 2, false);

      expect(delay1).toBe(1000);
      expect(delay2).toBe(2000);
      expect(delay3).toBe(4000);
    });

    it('should respect max delay', () => {
      const delay = calculateBackoff(10, 1000, 5000, 2, false);
      expect(delay).toBeLessThanOrEqual(5000);
    });

    it('should add jitter when enabled', () => {
      const delay1 = calculateBackoff(1, 1000, 10000, 2, true);
      const delay2 = calculateBackoff(1, 1000, 10000, 2, true);

      // With jitter, delays should vary
      expect(delay1).not.toBe(delay2);
      expect(delay1).toBeGreaterThan(2000);
      expect(delay1).toBeLessThanOrEqual(3000);
    });

    it('should call onRetry callback', async () => {
      let retryCount = 0;
      const onRetry = vi.fn((error, attempt) => {
        retryCount = attempt;
      });

      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('ETIMEDOUT timeout'))
        .mockResolvedValueOnce('success');

      await withRetry(operation, {
        maxAttempts: 3,
        initialDelay: 10,
        jitter: false,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(retryCount).toBe(1);
    });

    it('should call onFailure callback when all retries exhausted', async () => {
      const onFailure = vi.fn();

      const operation = vi.fn(async () => {
        throw new Error('Persistent failure');
      });

      await expect(
        withRetry(operation, {
          maxAttempts: 2,
          initialDelay: 10,
          onFailure,
        })
      ).rejects.toThrow();

      expect(onFailure).toHaveBeenCalledTimes(1);
    });
  });

  describe('Fallback Chains', () => {
    it('should try fallbacks in order when primary fails', async () => {
      const primaryFn = vi.fn(async () => {
        throw new Error('Primary failed');
      });

      const fallback1Fn = vi.fn(async () => {
        throw new Error('Fallback 1 failed');
      });

      const fallback2Fn = vi.fn(async () => 'fallback2-success');

      const result = await withFallbackChain({
        primary: {
          name: 'primary',
          description: 'Primary approach',
          priority: 1,
          execute: primaryFn,
        },
        fallbacks: [
          {
            name: 'fallback1',
            description: 'Fallback 1',
            priority: 2,
            execute: fallback1Fn,
          },
          {
            name: 'fallback2',
            description: 'Fallback 2',
            priority: 3,
            execute: fallback2Fn,
          },
        ],
      });

      expect(result).toBe('fallback2-success');
      expect(primaryFn).toHaveBeenCalledTimes(1);
      expect(fallback1Fn).toHaveBeenCalledTimes(1);
      expect(fallback2Fn).toHaveBeenCalledTimes(1);
    });

    it('should use graceful degradation when all approaches fail', async () => {
      const gracefulDegradation = vi.fn(async () => 'degraded-result');

      const result = await withFallbackChain({
        primary: {
          name: 'primary',
          description: 'Primary',
          priority: 1,
          execute: async () => {
            throw new Error('Failed');
          },
        },
        fallbacks: [],
        gracefulDegradation,
      });

      expect(result).toBe('degraded-result');
      expect(gracefulDegradation).toHaveBeenCalledTimes(1);
    });

    it('should skip approaches with unmet conditions', async () => {
      const skippedFn = vi.fn(async () => 'skipped');
      const executedFn = vi.fn(async () => 'executed');

      const result = await withFallbackChain({
        primary: {
          name: 'primary',
          description: 'Should be skipped',
          priority: 1,
          execute: async () => {
            throw new Error('Primary failed');
          },
        },
        fallbacks: [
          {
            name: 'skipped',
            description: 'Should skip',
            priority: 2,
            execute: skippedFn,
            requiresConditions: () => false, // Condition not met
          },
          {
            name: 'executed',
            description: 'Should execute',
            priority: 3,
            execute: executedFn,
            requiresConditions: () => true,
          },
        ],
      });

      expect(result).toBe('executed');
      expect(skippedFn).not.toHaveBeenCalled();
      expect(executedFn).toHaveBeenCalledTimes(1);
    });

    it('should call onApproachSwitch callback', async () => {
      const onApproachSwitch = vi.fn();

      await withFallbackChain({
        primary: {
          name: 'primary',
          description: 'Primary',
          priority: 1,
          execute: async () => {
            throw new Error('Failed');
          },
        },
        fallbacks: [
          {
            name: 'fallback',
            description: 'Fallback',
            priority: 2,
            execute: async () => 'success',
          },
        ],
        onApproachSwitch,
      });

      expect(onApproachSwitch).toHaveBeenCalledWith(
        'primary',
        'fallback',
        expect.any(Error)
      );
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit after threshold failures', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
        halfOpenAttempts: 1,
      });

      const failingOperation = async () => {
        throw new Error('Service unavailable');
      };

      // Fail 3 times to open circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingOperation)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe('open');

      // Next call should fail immediately with circuit breaker error
      await expect(breaker.execute(failingOperation)).rejects.toThrow('Circuit breaker is open');
    });

    it('should reset circuit after successful operation in half-open state', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 100, // Short timeout for testing
        halfOpenAttempts: 1,
      });

      // Open circuit
      for (let i = 0; i < 2; i++) {
        await expect(
          breaker.execute(async () => {
            throw new Error('Fail');
          })
        ).rejects.toThrow();
      }

      expect(breaker.getState()).toBe('open');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Successful operation should close circuit
      await breaker.execute(async () => 'success');

      expect(breaker.getState()).toBe('closed');
    });
  });

  describe('Error Pattern Database', () => {
    beforeEach(() => {
      // Use a fresh database for each test
      errorPatternDB['patterns'].clear();
      errorPatternDB['history'] = [];
    });

    it('should match error patterns', () => {
      const error = new Error('Rate limit exceeded: 429');
      const pattern = errorPatternDB.findPattern(error);

      expect(pattern).toBeDefined();
      expect(pattern?.category).toBe(ErrorCategory.RATE_LIMIT);
    });

    it('should provide solutions for matched patterns', () => {
      const error = new Error('ETIMEDOUT connection timeout');
      const solutions = errorPatternDB.getSolutions(error);

      expect(solutions.length).toBeGreaterThan(0);
      expect(solutions[0].description).toBeTruthy();
    });

    it('should record error occurrences', () => {
      const error = new Error('Network timeout');
      errorPatternDB.recordOccurrence(error, { context: 'test' }, false);

      const history = errorPatternDB.getRecentHistory(1);
      expect(history.length).toBe(1);
      expect(history[0].message).toBe('Network timeout');
    });

    it('should update solution success rates', () => {
      const error = new Error('Rate limit exceeded');
      const pattern = errorPatternDB.findPattern(error);

      expect(pattern).toBeDefined();

      const initialSuccessRate = pattern!.solutions[0].successRate;

      // Record successful resolution
      errorPatternDB.recordOccurrence(
        error,
        { context: 'test' },
        true,
        pattern!.solutions[0].description
      );

      const updatedPattern = errorPatternDB.findPattern(error);
      expect(updatedPattern!.solutions[0].attemptCount).toBeGreaterThan(0);
    });
  });

  describe('Error Monitoring', () => {
    let monitor: ErrorMonitor;

    beforeEach(() => {
      monitor = new ErrorMonitor({
        errorRateThreshold: 5,
        minRecoveryRate: 0.5,
      });
    });

    afterEach(() => {
      monitor.stop();
      monitor.clear();
    });

    it('should record error events', () => {
      monitor.recordError({
        category: ErrorCategory.NETWORK,
        message: 'Connection failed',
        context: 'test',
        recovered: false,
        retryAttempts: 3,
      });

      const history = monitor.getRecentErrors(1);
      expect(history.length).toBe(1);
      expect(history[0].category).toBe(ErrorCategory.NETWORK);
    });

    it('should calculate error metrics', () => {
      // Record some errors
      for (let i = 0; i < 10; i++) {
        monitor.recordError({
          category: ErrorCategory.NETWORK,
          message: 'Error',
          context: 'test',
          recovered: i % 2 === 0, // 50% recovery rate
          retryAttempts: 2,
        });
      }

      const metrics = monitor.getMetrics();

      expect(metrics.totalErrors).toBe(10);
      expect(metrics.recoveryRate).toBeCloseTo(0.5, 1);
      expect(metrics.avgRetryAttempts).toBe(2);
    });

    it('should track errors by category', () => {
      monitor.recordError({
        category: ErrorCategory.NETWORK,
        message: 'Network error',
        context: 'test',
        recovered: true,
        retryAttempts: 1,
      });

      monitor.recordError({
        category: ErrorCategory.RATE_LIMIT,
        message: 'Rate limit',
        context: 'test',
        recovered: false,
        retryAttempts: 3,
      });

      const metrics = monitor.getMetrics();

      expect(metrics.byCategory[ErrorCategory.NETWORK]).toBe(1);
      expect(metrics.byCategory[ErrorCategory.RATE_LIMIT]).toBe(1);
    });

    it('should generate error reports', () => {
      monitor.recordError({
        category: ErrorCategory.SERVICE,
        message: 'Service unavailable',
        context: 'test',
        recovered: false,
        retryAttempts: 2,
      });

      const report = monitor.generateReport();

      expect(report).toContain('ERROR MONITORING REPORT');
      expect(report).toContain('SUMMARY');
      expect(report).toContain('ERRORS BY CATEGORY');
      expect(report).toContain('service');
    });
  });

  describe('Smart Operation Creation', () => {
    it('should create operation with automatic retry and fallbacks', async () => {
      let primaryAttempts = 0;

      const smartOp = createSmartOperation({
        primaryOperation: async () => {
          primaryAttempts++;
          if (primaryAttempts < 2) {
            throw new Error('ETIMEDOUT');
          }
          return 'primary-success';
        },
        retryPrimary: true,
      });

      const result = await smartOp();

      expect(result).toBe('primary-success');
      expect(primaryAttempts).toBeGreaterThan(1);
    });

    it('should fall back to alternative operations', async () => {
      const smartOp = createSmartOperation({
        primaryOperation: async () => {
          throw new Error('Primary failed');
        },
        fallbackOperations: [
          async () => {
            throw new Error('Fallback 1 failed');
          },
          async () => 'fallback2-success',
        ],
        retryPrimary: false,
      });

      const result = await smartOp();

      expect(result).toBe('fallback2-success');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete error recovery workflow', async () => {
      let attempts = 0;

      const operation = createSmartOperation({
        primaryOperation: async () => {
          attempts++;

          // First attempt: transient error (will retry)
          if (attempts === 1) {
            throw new Error('ETIMEDOUT timeout');
          }

          // Second attempt: rate limit (will retry with longer backoff)
          if (attempts === 2) {
            throw new Error('429 Rate limit exceeded');
          }

          // Third attempt: success
          return 'success';
        },
        retryPrimary: true,
      });

      const result = await operation();

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should record and learn from error patterns', async () => {
      const monitor = new ErrorMonitor();

      const operation = async () => {
        try {
          const result = await withSmartRetry(async (attempt) => {
            if (attempt === 0) {
              throw new Error('503 Service Unavailable');
            }
            return 'recovered';
          }, 'test-operation');

          monitor.recordError({
            category: ErrorCategory.SERVICE,
            message: '503 Service Unavailable',
            context: 'test-operation',
            recovered: true,
            retryAttempts: 1,
          });

          return result;
        } catch (error) {
          monitor.recordError({
            category: ErrorCategory.SERVICE,
            message: (error as Error).message,
            context: 'test-operation',
            recovered: false,
            retryAttempts: 3,
          });
          throw error;
        }
      };

      const result = await operation();

      expect(result).toBe('recovered');

      const metrics = monitor.getMetrics();
      expect(metrics.totalErrors).toBeGreaterThan(0);
      expect(metrics.recoveryRate).toBeGreaterThan(0);

      monitor.stop();
    });
  });
});
