/**
 * Response Cache Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResponseCache } from '../../../../src/mcp-server/performance/cache.js';
import type { ToolResult } from '../../../../src/mcp-server/types/index.js';

describe('ResponseCache', () => {
  let cache: ResponseCache;

  beforeEach(() => {
    cache = new ResponseCache({
      maxSize: 100,
      defaultTTL: 5000, // 5 seconds
      enabled: true,
    });
  });

  describe('Caching Behavior', () => {
    it('should cache and retrieve results', () => {
      const result: ToolResult = {
        success: true,
        data: { value: 42 },
      };

      cache.set('get-file', { path: '/test.md' }, result);

      const cached = cache.get('get-file', { path: '/test.md' });

      expect(cached).toEqual(result);
    });

    it('should return null for cache miss', () => {
      const cached = cache.get('get-file', { path: '/missing.md' });

      expect(cached).toBeNull();
    });

    it('should respect TTL', async () => {
      const shortTTLCache = new ResponseCache({
        defaultTTL: 100, // 100ms
        enabled: true,
      });

      const result: ToolResult = {
        success: true,
        data: { value: 42 },
      };

      shortTTLCache.set('get-file', { path: '/test.md' }, result);

      // Should be cached initially
      let cached = shortTTLCache.get('get-file', { path: '/test.md' });
      expect(cached).toEqual(result);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be expired
      cached = shortTTLCache.get('get-file', { path: '/test.md' });
      expect(cached).toBeNull();
    });

    it('should support custom TTL per entry', async () => {
      const result: ToolResult = {
        success: true,
        data: { value: 42 },
      };

      cache.set('get-file', { path: '/test.md' }, result, 100); // 100ms TTL

      await new Promise((resolve) => setTimeout(resolve, 150));

      const cached = cache.get('get-file', { path: '/test.md' });
      expect(cached).toBeNull();
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate specific entry', () => {
      const result: ToolResult = {
        success: true,
        data: { value: 42 },
      };

      cache.set('get-file', { path: '/test.md' }, result);
      cache.invalidate('get-file', { path: '/test.md' });

      const cached = cache.get('get-file', { path: '/test.md' });
      expect(cached).toBeNull();
    });

    it('should invalidate all entries for a tool', () => {
      const result1: ToolResult = { success: true, data: { value: 1 } };
      const result2: ToolResult = { success: true, data: { value: 2 } };

      cache.set('get-file', { path: '/test1.md' }, result1);
      cache.set('get-file', { path: '/test2.md' }, result2);

      cache.invalidate('get-file');

      expect(cache.get('get-file', { path: '/test1.md' })).toBeNull();
      expect(cache.get('get-file', { path: '/test2.md' })).toBeNull();
    });

    it('should invalidate all cache', () => {
      cache.set('get-file', { path: '/test1.md' }, { success: true, data: {} });
      cache.set('query-files', { pattern: '*.md' }, { success: true, data: {} });

      cache.invalidate();

      expect(cache.get('get-file', { path: '/test1.md' })).toBeNull();
      expect(cache.get('query-files', { pattern: '*.md' })).toBeNull();
    });
  });

  describe('LRU Eviction', () => {
    it('should evict oldest entry when max size reached', () => {
      const smallCache = new ResponseCache({ maxSize: 3, enabled: true });

      for (let i = 0; i < 4; i++) {
        smallCache.set(`tool-${i}`, { id: i }, { success: true, data: { value: i } });
      }

      // First entry should be evicted
      expect(smallCache.get('tool-0', { id: 0 })).toBeNull();

      // Other entries should still be cached
      expect(smallCache.get('tool-1', { id: 1 })).not.toBeNull();
      expect(smallCache.get('tool-2', { id: 2 })).not.toBeNull();
      expect(smallCache.get('tool-3', { id: 3 })).not.toBeNull();
    });

    it('should update LRU on access', () => {
      const smallCache = new ResponseCache({ maxSize: 3, enabled: true });

      smallCache.set('tool-1', {}, { success: true, data: { value: 1 } });
      smallCache.set('tool-2', {}, { success: true, data: { value: 2 } });
      smallCache.set('tool-3', {}, { success: true, data: { value: 3 } });

      // Access first entry to make it most recently used
      smallCache.get('tool-1', {});

      // Add new entry, should evict tool-2 (least recently used)
      smallCache.set('tool-4', {}, { success: true, data: { value: 4 } });

      expect(smallCache.get('tool-1', {})).not.toBeNull();
      expect(smallCache.get('tool-2', {})).toBeNull(); // Evicted
      expect(smallCache.get('tool-3', {})).not.toBeNull();
      expect(smallCache.get('tool-4', {})).not.toBeNull();
    });
  });

  describe('Cacheable Operations', () => {
    it('should only cache idempotent operations', () => {
      const result: ToolResult = { success: true, data: {} };

      // Cacheable operation
      cache.set('get-file', {}, result);
      expect(cache.get('get-file', {})).not.toBeNull();

      // Non-cacheable operation (mutations)
      cache.set('trigger-workflow', {}, result);
      expect(cache.get('trigger-workflow', {})).toBeNull();
    });

    it('should allow adding custom cacheable operations', () => {
      const result: ToolResult = { success: true, data: {} };

      cache.addCacheableOperation('custom-tool');
      cache.set('custom-tool', {}, result);

      expect(cache.get('custom-tool', {})).not.toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should track cache hits and misses', () => {
      const result: ToolResult = { success: true, data: {} };

      cache.set('get-file', { path: '/test.md' }, result);

      // Hit
      cache.get('get-file', { path: '/test.md' });

      // Miss
      cache.get('get-file', { path: '/missing.md' });

      const stats = cache.getStats();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should track cache size and memory', () => {
      const result: ToolResult = {
        success: true,
        data: { large: 'x'.repeat(1000) },
      };

      cache.set('get-file', { path: '/test.md' }, result);

      const stats = cache.getStats();

      expect(stats.currentSize).toBe(1);
      expect(stats.totalMemoryBytes).toBeGreaterThan(0);
    });
  });

  describe('Configuration', () => {
    it('should bypass caching when disabled', () => {
      const disabledCache = new ResponseCache({ enabled: false });

      const result: ToolResult = { success: true, data: {} };

      disabledCache.set('get-file', {}, result);

      expect(disabledCache.get('get-file', {})).toBeNull();
    });

    it('should update configuration dynamically', () => {
      cache.updateConfig({ maxSize: 50 });

      const stats = cache.getStats();
      expect(stats.maxSize).toBe(50);
    });
  });
});
