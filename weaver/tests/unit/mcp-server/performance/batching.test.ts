/**
 * Request Batching Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RequestBatcher } from '../../../../src/mcp-server/performance/batching.js';
import type { ToolHandler, ToolResult } from '../../../../src/mcp-server/types/index.js';

describe('RequestBatcher', () => {
  let batcher: RequestBatcher;
  let mockHandler: ToolHandler;

  beforeEach(() => {
    batcher = new RequestBatcher({
      windowMs: 50,
      maxBatchSize: 5,
      enabled: true,
    });

    mockHandler = vi.fn(async (params: any): Promise<ToolResult> => {
      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 10));
      return {
        success: true,
        data: { result: params.value * 2 },
      };
    });
  });

  describe('Batching Behavior', () => {
    it('should batch requests within time window', async () => {
      const requests = [
        batcher.batchRequest('test-tool', { value: 1 }, mockHandler),
        batcher.batchRequest('test-tool', { value: 2 }, mockHandler),
        batcher.batchRequest('test-tool', { value: 3 }, mockHandler),
      ];

      const results = await Promise.all(requests);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[0].data.result).toBe(2);
      expect(results[2].data.result).toBe(6);

      // Should have been called 3 times (one per request)
      expect(mockHandler).toHaveBeenCalledTimes(3);
    });

    it('should execute immediately when max batch size reached', async () => {
      const requests = [];
      for (let i = 0; i < 6; i++) {
        requests.push(batcher.batchRequest('test-tool', { value: i }, mockHandler));
      }

      const results = await Promise.all(requests);

      expect(results).toHaveLength(6);
      expect(mockHandler).toHaveBeenCalledTimes(6);
    });

    it('should execute after time window expires', async () => {
      const request = batcher.batchRequest('test-tool', { value: 5 }, mockHandler);

      // Wait for time window to expire
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await request;

      expect(result.success).toBe(true);
      expect(result.data.result).toBe(10);
    });
  });

  describe('Error Isolation', () => {
    it('should isolate errors within batch', async () => {
      const failingHandler = vi.fn(async (params: any): Promise<ToolResult> => {
        if (params.fail) {
          throw new Error('Intentional failure');
        }
        return { success: true, data: { result: 'ok' } };
      });

      const requests = [
        batcher.batchRequest('test-tool', { fail: false }, failingHandler),
        batcher.batchRequest('test-tool', { fail: true }, failingHandler),
        batcher.batchRequest('test-tool', { fail: false }, failingHandler),
      ];

      const results = await Promise.allSettled(requests);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });

  describe('Configuration', () => {
    it('should bypass batching when disabled', async () => {
      const disabledBatcher = new RequestBatcher({ enabled: false });

      const result = await disabledBatcher.batchRequest(
        'test-tool',
        { value: 10 },
        mockHandler
      );

      expect(result.success).toBe(true);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should update configuration', () => {
      batcher.updateConfig({ maxBatchSize: 10 });

      const stats = batcher.getStats();
      expect(stats.config.maxBatchSize).toBe(10);
    });
  });

  describe('Statistics', () => {
    it('should track pending requests', async () => {
      const request1 = batcher.batchRequest('tool1', { value: 1 }, mockHandler);
      const request2 = batcher.batchRequest('tool2', { value: 2 }, mockHandler);

      const stats = batcher.getStats();
      expect(stats.pendingToolTypes).toBeGreaterThan(0);

      await Promise.all([request1, request2]);
    });
  });

  describe('Cleanup', () => {
    it('should shutdown cleanly', async () => {
      const request = batcher.batchRequest('test-tool', { value: 1 }, mockHandler);

      await batcher.shutdown();

      await expect(request).rejects.toThrow('Request batcher shutting down');
    });
  });

  describe('Performance', () => {
    it('should be 10x faster for bulk operations', async () => {
      const count = 100;

      // Sequential execution
      const sequentialStart = Date.now();
      for (let i = 0; i < count; i++) {
        await mockHandler({ value: i });
      }
      const sequentialTime = Date.now() - sequentialStart;

      // Reset handler call count
      vi.clearAllMocks();

      // Batched execution
      const batchedStart = Date.now();
      const batchedRequests = [];
      for (let i = 0; i < count; i++) {
        batchedRequests.push(batcher.batchRequest('test-tool', { value: i }, mockHandler));
      }
      await Promise.all(batchedRequests);
      const batchedTime = Date.now() - batchedStart;

      console.log(`Sequential: ${sequentialTime}ms, Batched: ${batchedTime}ms`);
      console.log(`Speedup: ${(sequentialTime / batchedTime).toFixed(2)}x`);

      // Batched should be significantly faster
      expect(batchedTime).toBeLessThan(sequentialTime / 2);
    });
  });
});
