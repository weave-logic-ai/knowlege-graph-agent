/**
 * Automatic Retry Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RetryManager, DEFAULT_RETRY_POLICY } from '../../../../src/mcp-server/performance/retry.js';

describe('RetryManager', () => {
  let retry: RetryManager;

  beforeEach(() => {
    retry = new RetryManager({
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 1000,
      backoffMultiplier: 2,
      jitter: false, // Disable for predictable testing
      enabled: true,
    });
  });

  describe('Retry Behavior', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn(async () => 'success');

      const result = await retry.execute(operation);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toHaveLength(0);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient failures', async () => {
      let attemptCount = 0;
      const operation = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          const error: any = new Error('Network timeout');
          error.code = 'ETIMEDOUT';
          throw error;
        }
        return 'success';
      });

      const result = await retry.execute(operation, DEFAULT_RETRY_POLICY);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toHaveLength(2);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max attempts', async () => {
      const operation = vi.fn(async () => {
        const error: any = new Error('Network timeout');
        error.code = 'ETIMEDOUT';
        throw error;
      });

      const result = await retry.execute(operation, DEFAULT_RETRY_POLICY);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.attempts).toHaveLength(2); // 2 retries after initial attempt
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn(async () => {
        throw new Error('Invalid parameters');
      });

      const result = await retry.execute(operation, DEFAULT_RETRY_POLICY);

      expect(result.success).toBe(false);
      expect(result.attempts).toHaveLength(0); // No retries
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Exponential Backoff', () => {
    it('should use exponential backoff delays', async () => {
      let attemptCount = 0;
      const operation = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 4) {
          const error: any = new Error('Timeout');
          error.code = 'ETIMEDOUT';
          throw error;
        }
        return 'success';
      });

      const result = await retry.execute(operation, DEFAULT_RETRY_POLICY);

      // Delays should be: 100ms, 200ms, 400ms
      expect(result.attempts[0].delay).toBe(100);
      expect(result.attempts[1].delay).toBe(200);
      expect(result.attempts[2].delay).toBe(400);
    });

    it('should cap delay at maxDelayMs', async () => {
      const shortRetry = new RetryManager({
        initialDelayMs: 500,
        maxDelayMs: 600,
        backoffMultiplier: 2,
        maxAttempts: 5,
        jitter: false,
      });

      let attemptCount = 0;
      const operation = vi.fn(async () => {
        attemptCount++;
        const error: any = new Error('Timeout');
        error.code = 'ETIMEDOUT';
        throw error;
      });

      const result = await shortRetry.execute(operation, DEFAULT_RETRY_POLICY);

      // All delays after first should be capped at 600ms
      const cappedDelays = result.attempts.filter((a) => a.delay === 600);
      expect(cappedDelays.length).toBeGreaterThan(0);
    });
  });

  describe('Retry Policies', () => {
    it('should use custom error code policy', async () => {
      const policy = RetryManager.createErrorCodePolicy(['CUSTOM_ERROR']);

      let attemptCount = 0;
      const operation = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          const error: any = new Error('Custom error');
          error.code = 'CUSTOM_ERROR';
          throw error;
        }
        return 'success';
      });

      const result = await retry.execute(operation, policy);

      expect(result.success).toBe(true);
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should use custom message policy', async () => {
      const policy = RetryManager.createMessagePolicy([/database connection/i]);

      let attemptCount = 0;
      const operation = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Database connection failed');
        }
        return 'success';
      });

      const result = await retry.execute(operation, policy);

      expect(result.success).toBe(true);
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should support always retry policy', async () => {
      const policy = RetryManager.createAlwaysRetryPolicy();

      let attemptCount = 0;
      const operation = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Any error');
        }
        return 'success';
      });

      const result = await retry.execute(operation, policy);

      expect(result.success).toBe(true);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should support never retry policy', async () => {
      const policy = RetryManager.createNeverRetryPolicy();

      const operation = vi.fn(async () => {
        throw new Error('Error');
      });

      const result = await retry.execute(operation, policy);

      expect(result.success).toBe(false);
      expect(result.attempts).toHaveLength(0);
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Configuration', () => {
    it('should bypass retry when disabled', async () => {
      const disabledRetry = new RetryManager({ enabled: false });

      const operation = vi.fn(async () => {
        throw new Error('Error');
      });

      const result = await disabledRetry.execute(operation);

      expect(result.success).toBe(false);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should update configuration', () => {
      retry.updateConfig({ maxAttempts: 5 });

      const config = retry.getConfig();
      expect(config.maxAttempts).toBe(5);
    });
  });

  describe('Statistics', () => {
    it('should track total time', async () => {
      let attemptCount = 0;
      const operation = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          const error: any = new Error('Timeout');
          error.code = 'ETIMEDOUT';
          throw error;
        }
        return 'success';
      });

      const result = await retry.execute(operation, DEFAULT_RETRY_POLICY);

      expect(result.totalTime).toBeGreaterThan(0);
      expect(result.totalTime).toBeGreaterThan(100); // At least initial delay
    });

    it('should track attempt timestamps', async () => {
      let attemptCount = 0;
      const operation = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          const error: any = new Error('Timeout');
          error.code = 'ETIMEDOUT';
          throw error;
        }
        return 'success';
      });

      const result = await retry.execute(operation, DEFAULT_RETRY_POLICY);

      expect(result.attempts[0].timestamp).toBeGreaterThan(0);
      expect(result.attempts[0].error).toBeDefined();
    });
  });
});
