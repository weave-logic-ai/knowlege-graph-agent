/**
 * Error Recovery Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withRetry,
  retry,
  withFallback,
  withCircuitBreaker,
  retryable,
  calculateBackoff,
  sleep,
  CircuitBreaker,
  CircuitState,
  RetriesExhaustedError,
  CircuitOpenError,
} from '../../src/utils/error-recovery.js';
import { ErrorCategory } from '../../src/utils/error-taxonomy.js';

describe('ErrorRecovery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateBackoff', () => {
    it('should calculate exponential backoff', () => {
      // With jitter disabled for predictable tests
      const delay1 = calculateBackoff(1, { initialDelay: 1000, jitter: false });
      const delay2 = calculateBackoff(2, { initialDelay: 1000, jitter: false });
      const delay3 = calculateBackoff(3, { initialDelay: 1000, jitter: false });

      expect(delay1).toBe(1000); // 1000 * 2^0
      expect(delay2).toBe(2000); // 1000 * 2^1
      expect(delay3).toBe(4000); // 1000 * 2^2
    });

    it('should respect maxDelay cap', () => {
      const delay = calculateBackoff(10, {
        initialDelay: 1000,
        maxDelay: 5000,
        jitter: false,
      });

      expect(delay).toBe(5000);
    });

    it('should apply jitter when enabled', () => {
      const delays = new Set<number>();
      for (let i = 0; i < 10; i++) {
        delays.add(calculateBackoff(1, { initialDelay: 1000, jitter: true }));
      }
      // With jitter, we should get varied delays
      expect(delays.size).toBeGreaterThan(1);
    });

    it('should use custom backoff factor', () => {
      const delay = calculateBackoff(3, {
        initialDelay: 100,
        backoffFactor: 3,
        jitter: false,
      });

      expect(delay).toBe(900); // 100 * 3^2
    });
  });

  describe('sleep', () => {
    it('should sleep for specified duration', async () => {
      const promise = sleep(1000);
      vi.advanceTimersByTime(1000);
      await expect(promise).resolves.toBeUndefined();
    });

    it('should reject on abort', async () => {
      const controller = new AbortController();
      const promise = sleep(10000, controller.signal);

      controller.abort();

      await expect(promise).rejects.toThrow('Aborted');
    });

    it('should reject immediately if already aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(sleep(1000, controller.signal)).rejects.toThrow('Aborted');
    });
  });

  describe('withRetry', () => {
    beforeEach(() => {
      vi.useRealTimers();
    });

    it('should return success on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await withRetry(operation);

      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry transient errors', async () => {
      let attempts = 0;
      const operation = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw { status: 503, message: 'Service Unavailable' };
        }
        return 'success';
      });

      const result = await withRetry(operation, {
        maxRetries: 5,
        initialDelay: 10,
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
      expect(result.attempts).toBe(3);
    });

    it('should not retry permanent errors', async () => {
      const operation = vi.fn().mockRejectedValue({ status: 400, message: 'Bad Request' });

      const result = await withRetry(operation, { maxRetries: 5 });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(result.error?.category).toBe(ErrorCategory.PERMANENT);
    });

    it('should exhaust retries for persistent failures', async () => {
      const operation = vi.fn().mockRejectedValue({ status: 503 });

      const result = await withRetry(operation, {
        maxRetries: 3,
        initialDelay: 10,
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(4); // 1 initial + 3 retries
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      let attempts = 0;
      const operation = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw { status: 503 };
        }
        return 'success';
      });

      await withRetry(operation, {
        maxRetries: 5,
        initialDelay: 10,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry.mock.calls[0][1]).toBe(1); // First retry
      expect(onRetry.mock.calls[1][1]).toBe(2); // Second retry
    });

    it('should use custom isRetryable function', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Custom error'));
      const isRetryable = vi.fn().mockReturnValue(false);

      const result = await withRetry(operation, {
        maxRetries: 5,
        isRetryable,
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(isRetryable).toHaveBeenCalled();
    });

    it('should abort on signal', async () => {
      const controller = new AbortController();
      const operation = vi.fn().mockImplementation(async () => {
        controller.abort();
        throw { status: 503 };
      });

      const result = await withRetry(operation, {
        maxRetries: 5,
        signal: controller.signal,
        initialDelay: 10,
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBeLessThanOrEqual(2);
    });
  });

  describe('retry', () => {
    beforeEach(() => {
      vi.useRealTimers();
    });

    it('should return value on success', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await retry(operation);
      expect(result).toBe('success');
    });

    it('should throw on exhausted retries', async () => {
      const operation = vi.fn().mockRejectedValue({ status: 503 });

      await expect(
        retry(operation, { maxRetries: 1, initialDelay: 1 })
      ).rejects.toEqual({ status: 503 });
    });
  });

  describe('withFallback', () => {
    it('should return first successful operation', async () => {
      const result = await withFallback([
        () => Promise.resolve('first'),
        () => Promise.resolve('second'),
      ]);

      expect(result).toBe('first');
    });

    it('should fall back to next operation on failure', async () => {
      const result = await withFallback([
        () => Promise.reject(new Error('first failed')),
        () => Promise.resolve('second'),
      ]);

      expect(result).toBe('second');
    });

    it('should try all operations', async () => {
      const result = await withFallback([
        () => Promise.reject(new Error('first failed')),
        () => Promise.reject(new Error('second failed')),
        () => Promise.resolve('third'),
      ]);

      expect(result).toBe('third');
    });

    it('should call onFallback callback', async () => {
      const onFallback = vi.fn();

      await withFallback(
        [
          () => Promise.reject(new Error('first failed')),
          () => Promise.resolve('second'),
        ],
        { onFallback }
      );

      expect(onFallback).toHaveBeenCalledTimes(1);
      expect(onFallback.mock.calls[0][1]).toBe(0); // First operation index
    });

    it('should return default value if all fail', async () => {
      const result = await withFallback(
        [
          () => Promise.reject(new Error('first')),
          () => Promise.reject(new Error('second')),
        ],
        { defaultValue: 'default' }
      );

      expect(result).toBe('default');
    });

    it('should throw if all fail and no default', async () => {
      await expect(
        withFallback([
          () => Promise.reject(new Error('first')),
          () => Promise.reject(new Error('second')),
        ])
      ).rejects.toThrow('second');
    });

    it('should handle empty operations array with default', async () => {
      const result = await withFallback([], { defaultValue: 'empty' });
      expect(result).toBe('empty');
    });

    it('should throw for empty operations without default', async () => {
      await expect(withFallback([])).rejects.toThrow(
        'No fallback operations provided'
      );
    });
  });

  describe('CircuitBreaker', () => {
    it('should start in closed state', () => {
      const breaker = new CircuitBreaker();
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(breaker.canExecute()).toBe(true);
    });

    it('should open after failure threshold', () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3 });

      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      breaker.recordFailure();
      expect(breaker.getState()).toBe(CircuitState.OPEN);
      expect(breaker.canExecute()).toBe(false);
    });

    it('should reset failures on success', () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3 });

      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordSuccess();
      breaker.recordFailure();
      breaker.recordFailure();

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should transition to half-open after reset timeout', async () => {
      vi.useRealTimers();
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 50,
      });

      breaker.recordFailure();
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
      expect(breaker.canExecute()).toBe(true);
    });

    it('should close after success threshold in half-open', async () => {
      vi.useRealTimers();
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 50,
        successThreshold: 2,
      });

      breaker.recordFailure();
      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      breaker.recordSuccess();
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      breaker.recordSuccess();
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should return to open on failure in half-open', async () => {
      vi.useRealTimers();
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 50,
      });

      breaker.recordFailure();
      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      breaker.recordFailure();
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should reset completely', () => {
      const breaker = new CircuitBreaker({ failureThreshold: 1 });

      breaker.recordFailure();
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      breaker.reset();
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(breaker.canExecute()).toBe(true);
    });
  });

  describe('withCircuitBreaker', () => {
    it('should execute and record success', async () => {
      const breaker = new CircuitBreaker();
      const operation = vi.fn().mockResolvedValue('result');

      const result = await withCircuitBreaker(operation, breaker);

      expect(result).toBe('result');
      expect(operation).toHaveBeenCalled();
    });

    it('should throw when circuit is open', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 1 });
      breaker.recordFailure();

      await expect(
        withCircuitBreaker(() => Promise.resolve(), breaker)
      ).rejects.toThrow('Circuit breaker is open');
    });

    it('should record failure on operation error', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 2 });

      try {
        await withCircuitBreaker(() => Promise.reject(new Error('fail')), breaker);
      } catch {
        // Expected
      }

      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      try {
        await withCircuitBreaker(() => Promise.reject(new Error('fail')), breaker);
      } catch {
        // Expected
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('retryable', () => {
    beforeEach(() => {
      vi.useRealTimers();
    });

    it('should create retryable function', async () => {
      let attempts = 0;
      const fn = async (value: string) => {
        attempts++;
        if (attempts < 2) {
          throw { status: 503 };
        }
        return `result: ${value}`;
      };

      const retryableFn = retryable(fn, { maxRetries: 3, initialDelay: 1 });
      const result = await retryableFn('test');

      expect(result).toBe('result: test');
      expect(attempts).toBe(2);
    });
  });
});
