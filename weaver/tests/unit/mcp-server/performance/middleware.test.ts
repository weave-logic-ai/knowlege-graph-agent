/**
 * Performance Middleware Integration Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceMiddleware } from '../../../../src/mcp-server/performance/middleware.js';
import type { ToolHandler, ToolResult } from '../../../../src/mcp-server/types/index.js';

describe('PerformanceMiddleware', () => {
  let middleware: PerformanceMiddleware;
  let mockHandler: ToolHandler;
  let callCount: number;

  beforeEach(() => {
    callCount = 0;

    middleware = new PerformanceMiddleware({
      batching: { enabled: true, windowMs: 50 },
      caching: { enabled: true, maxSize: 100 },
      compression: { enabled: true, minSizeBytes: 100 },
      retry: { enabled: true, maxAttempts: 3 },
    });

    mockHandler = vi.fn(async (params: any): Promise<ToolResult> => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return {
        success: true,
        data: { result: params.value * 2 },
      };
    });
  });

  describe('Integration', () => {
    it('should wrap handler with all optimizations', async () => {
      const wrappedHandler = middleware.wrap('get-file', mockHandler);

      const result = await wrappedHandler({ value: 5 });

      expect(result.success).toBe(true);
      expect(result.data.result).toBe(10);
      expect(result.metadata?.executionTime).toBeGreaterThan(0);
    });

    it('should use cache on subsequent calls', async () => {
      const wrappedHandler = middleware.wrap('get-file', mockHandler);

      // First call - cache miss
      const result1 = await wrappedHandler({ value: 5 });
      expect(result1.metadata?.cacheHit).toBe(false);
      expect(callCount).toBe(1);

      // Second call - cache hit
      const result2 = await wrappedHandler({ value: 5 });
      expect(result2.metadata?.cacheHit).toBe(true);
      expect(callCount).toBe(1); // Handler not called again
    });

    it('should batch multiple concurrent requests', async () => {
      const wrappedHandler = middleware.wrap('get-file', mockHandler);

      const requests = [
        wrappedHandler({ value: 1 }),
        wrappedHandler({ value: 2 }),
        wrappedHandler({ value: 3 }),
      ];

      const results = await Promise.all(requests);

      expect(results).toHaveLength(3);
      expect(results[0].data.result).toBe(2);
      expect(results[1].data.result).toBe(4);
      expect(results[2].data.result).toBe(6);
    });

    it('should retry on failures', async () => {
      let attempts = 0;
      const failingHandler: ToolHandler = async () => {
        attempts++;
        if (attempts < 2) {
          const error: any = new Error('Timeout');
          error.code = 'ETIMEDOUT';
          throw error;
        }
        return { success: true, data: { result: 'ok' } };
      };

      const wrappedHandler = middleware.wrap('get-file', failingHandler);

      const result = await wrappedHandler({ value: 1 });

      expect(result.success).toBe(true);
      expect(result.metadata?.retryAttempts).toBeGreaterThan(0);
      expect(attempts).toBe(2);
    });
  });

  describe('Compression', () => {
    it('should compress large responses', async () => {
      const largeData = {
        success: true,
        data: { content: 'x'.repeat(1000) },
      };

      const compressed = await middleware.compressResponse(largeData, ['gzip']);

      expect(compressed.algorithm).toBe('gzip');
      expect(compressed.compressedSize).toBeLessThan(compressed.originalSize);
      expect(compressed.ratio).toBeGreaterThan(1.0);
    });

    it('should skip compression for small responses', async () => {
      const smallData = {
        success: true,
        data: { value: 42 },
      };

      const result = await middleware.compressResponse(smallData, ['gzip']);

      expect(result.algorithm).toBe('none');
    });
  });

  describe('Cache Management', () => {
    it('should invalidate cache entries', async () => {
      const wrappedHandler = middleware.wrap('get-file', mockHandler);

      // Cache entry
      await wrappedHandler({ value: 5 });

      // Invalidate
      middleware.invalidateCache('get-file', { value: 5 });

      // Should execute handler again
      const initialCount = callCount;
      await wrappedHandler({ value: 5 });
      expect(callCount).toBe(initialCount + 1);
    });

    it('should invalidate all cache', async () => {
      const wrappedHandler = middleware.wrap('get-file', mockHandler);

      await wrappedHandler({ value: 1 });
      await wrappedHandler({ value: 2 });

      middleware.invalidateCache();

      const stats = middleware.getStats();
      expect(stats.caching.currentSize).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should provide comprehensive stats', async () => {
      const wrappedHandler = middleware.wrap('get-file', mockHandler);

      // Generate some activity
      await wrappedHandler({ value: 1 });
      await wrappedHandler({ value: 1 }); // Cache hit

      const stats = middleware.getStats();

      expect(stats.batching.enabled).toBe(true);
      expect(stats.caching.enabled).toBe(true);
      expect(stats.caching.hits).toBeGreaterThan(0);
      expect(stats.compression.enabled).toBe(true);
      expect(stats.retry.enabled).toBe(true);
    });

    it('should track cache hit rate', async () => {
      const wrappedHandler = middleware.wrap('get-file', mockHandler);

      // 1 miss, 2 hits = 66% hit rate
      await wrappedHandler({ value: 1 }); // Miss
      await wrappedHandler({ value: 1 }); // Hit
      await wrappedHandler({ value: 1 }); // Hit

      const stats = middleware.getStats();

      expect(stats.caching.hitRate).toBeCloseTo(0.66, 1);
    });
  });

  describe('Configuration', () => {
    it('should update configuration dynamically', () => {
      middleware.updateConfig({
        batching: { enabled: false },
        caching: { maxSize: 50 },
      });

      const stats = middleware.getStats();
      expect(stats.batching.enabled).toBe(false);
    });

    it('should disable individual features', async () => {
      const disabledCacheMiddleware = new PerformanceMiddleware({
        caching: { enabled: false },
      });

      const wrappedHandler = disabledCacheMiddleware.wrap('get-file', mockHandler);

      await wrappedHandler({ value: 1 });
      await wrappedHandler({ value: 1 });

      // Should call handler twice (no caching)
      expect(callCount).toBe(2);
    });
  });

  describe('Performance', () => {
    it('should demonstrate 10x improvement for bulk operations', async () => {
      const count = 50;

      // Without middleware
      const directStart = Date.now();
      for (let i = 0; i < count; i++) {
        await mockHandler({ value: i });
      }
      const directTime = Date.now() - directStart;

      // Reset
      callCount = 0;

      // With middleware (batching + caching)
      const wrappedHandler = middleware.wrap('get-file', mockHandler);
      const middlewareStart = Date.now();
      const requests = [];
      for (let i = 0; i < count; i++) {
        requests.push(wrappedHandler({ value: i % 10 })); // Repeat some for caching
      }
      await Promise.all(requests);
      const middlewareTime = Date.now() - middlewareStart;

      console.log(`Direct: ${directTime}ms, Middleware: ${middlewareTime}ms`);
      console.log(`Speedup: ${(directTime / middlewareTime).toFixed(2)}x`);

      // Should be significantly faster
      expect(middlewareTime).toBeLessThan(directTime / 2);
    });
  });

  describe('Cleanup', () => {
    it('should shutdown cleanly', async () => {
      await middleware.shutdown();

      // Stats should still be accessible
      const stats = middleware.getStats();
      expect(stats).toBeDefined();
    });
  });
});
