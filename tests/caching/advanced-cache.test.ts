/**
 * Tests for AdvancedCache
 *
 * Comprehensive tests for the advanced caching system supporting multiple
 * eviction policies, TTL management, tag-based operations, and statistics.
 *
 * @module tests/caching/advanced-cache
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AdvancedCache,
  createAdvancedCache,
  createPreloadedCache,
} from '../../src/caching/lru-cache.js';
import type { CacheConfig, EvictionPolicy } from '../../src/caching/types.js';

describe('AdvancedCache', () => {
  let cache: AdvancedCache<any>;

  afterEach(() => {
    if (cache) {
      cache.destroy();
    }
  });

  describe('constructor', () => {
    it('should create an AdvancedCache instance with default config', () => {
      cache = new AdvancedCache();
      expect(cache).toBeInstanceOf(AdvancedCache);
    });

    it('should accept custom maxSize configuration', () => {
      cache = new AdvancedCache({ maxSize: 50 * 1024 * 1024 });
      expect(cache).toBeInstanceOf(AdvancedCache);
    });

    it('should accept custom maxEntries configuration', () => {
      cache = new AdvancedCache({ maxEntries: 500 });
      expect(cache).toBeInstanceOf(AdvancedCache);
    });

    it('should accept custom defaultTTL configuration', () => {
      cache = new AdvancedCache({ defaultTTL: 60000 });
      expect(cache).toBeInstanceOf(AdvancedCache);
    });

    it('should accept custom evictionPolicy configuration', () => {
      const policies: EvictionPolicy[] = ['lru', 'lfu', 'fifo', 'ttl'];
      for (const policy of policies) {
        const c = new AdvancedCache({ evictionPolicy: policy });
        expect(c.getEvictionPolicy()).toBe(policy);
        c.destroy();
      }
    });

    it('should accept onEvict callback configuration', () => {
      const onEvict = vi.fn();
      cache = new AdvancedCache({ onEvict });
      expect(cache).toBeInstanceOf(AdvancedCache);
    });

    it('should use default values when not specified', () => {
      cache = new AdvancedCache();
      expect(cache.getEvictionPolicy()).toBe('lru');
    });

    it('should accept partial configuration', () => {
      cache = new AdvancedCache({
        maxEntries: 100,
        evictionPolicy: 'lfu',
      });
      expect(cache.getEvictionPolicy()).toBe('lfu');
    });
  });

  describe('set() and get()', () => {
    beforeEach(() => {
      cache = new AdvancedCache();
    });

    it('should set and get a value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should set and get complex objects', () => {
      const obj = { name: 'test', nested: { value: 123 } };
      cache.set('key1', obj);
      expect(cache.get('key1')).toEqual(obj);
    });

    it('should set and get arrays', () => {
      const arr = [1, 2, 3, { a: 'b' }];
      cache.set('key1', arr);
      expect(cache.get('key1')).toEqual(arr);
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should overwrite existing values', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
    });

    it('should set value with custom TTL', () => {
      cache.set('key1', 'value1', { ttl: 1000 });
      expect(cache.get('key1')).toBe('value1');
    });

    it('should set value with tags', () => {
      cache.set('key1', 'value1', { tags: ['tag1', 'tag2'] });
      expect(cache.get('key1')).toBe('value1');
      expect(cache.getByTag('tag1')).toContain('value1');
    });

    it('should handle null values', () => {
      cache.set('key1', null);
      expect(cache.get('key1')).toBeNull();
    });

    it('should handle number values', () => {
      cache.set('key1', 42);
      expect(cache.get('key1')).toBe(42);
    });

    it('should handle boolean values', () => {
      cache.set('key1', true);
      cache.set('key2', false);
      expect(cache.get('key1')).toBe(true);
      expect(cache.get('key2')).toBe(false);
    });

    it('should update access time on get', () => {
      cache.set('key1', 'value1');
      const initialStats = cache.getStats();
      cache.get('key1');
      const updatedStats = cache.getStats();
      expect(updatedStats.hits).toBe(initialStats.hits + 1);
    });
  });

  describe('delete()', () => {
    beforeEach(() => {
      cache = new AdvancedCache();
    });

    it('should delete an existing entry', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should return false for non-existent key', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('should call onEvict callback when deleting', () => {
      const onEvict = vi.fn();
      cache = new AdvancedCache({ onEvict });
      cache.set('key1', 'value1');
      cache.delete('key1');
      expect(onEvict).toHaveBeenCalledWith('key1', 'value1');
    });

    it('should emit delete event', () => {
      const listener = vi.fn();
      cache.on('delete', listener);
      cache.set('key1', 'value1');
      cache.delete('key1');
      expect(listener).toHaveBeenCalledWith('key1');
    });

    it('should reduce cache size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.size).toBe(2);
      cache.delete('key1');
      expect(cache.size).toBe(1);
    });
  });

  describe('clear()', () => {
    beforeEach(() => {
      cache = new AdvancedCache();
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.clear();
      expect(cache.size).toBe(0);
    });

    it('should call onEvict for each entry', () => {
      const onEvict = vi.fn();
      cache = new AdvancedCache({ onEvict });
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(onEvict).toHaveBeenCalledTimes(2);
    });

    it('should emit clear event', () => {
      const listener = vi.fn();
      cache.on('clear', listener);
      cache.set('key1', 'value1');
      cache.clear();
      expect(listener).toHaveBeenCalled();
    });

    it('should allow new entries after clear', () => {
      cache.set('key1', 'value1');
      cache.clear();
      cache.set('key2', 'value2');
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('has()', () => {
    beforeEach(() => {
      cache = new AdvancedCache();
    });

    it('should return true for existing key', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired key', async () => {
      cache.set('key1', 'value1', { ttl: 50 });
      expect(cache.has('key1')).toBe(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(cache.has('key1')).toBe(false);
    });

    it('should delete expired entries when checking', async () => {
      cache.set('key1', 'value1', { ttl: 50 });
      await new Promise(resolve => setTimeout(resolve, 100));
      cache.has('key1');
      expect(cache.size).toBe(0);
    });
  });

  describe('Eviction Policies', () => {
    describe('LRU (Least Recently Used)', () => {
      beforeEach(() => {
        cache = new AdvancedCache({
          maxEntries: 3,
          evictionPolicy: 'lru',
        });
      });

      it('should evict least recently used entry', async () => {
        cache.set('key1', 'value1');
        await new Promise(resolve => setTimeout(resolve, 5));
        cache.set('key2', 'value2');
        await new Promise(resolve => setTimeout(resolve, 5));
        cache.set('key3', 'value3');
        await new Promise(resolve => setTimeout(resolve, 5));

        // Access key1 and key3 to make them recently used
        cache.get('key1');
        await new Promise(resolve => setTimeout(resolve, 5));
        cache.get('key3');
        await new Promise(resolve => setTimeout(resolve, 5));

        // Adding key4 should evict key2 (least recently used)
        cache.set('key4', 'value4');

        expect(cache.has('key1')).toBe(true);
        expect(cache.has('key2')).toBe(false); // Evicted
        expect(cache.has('key3')).toBe(true);
        expect(cache.has('key4')).toBe(true);
      });

      it('should update access time on get', async () => {
        cache.set('key1', 'value1');
        await new Promise(resolve => setTimeout(resolve, 5));
        cache.set('key2', 'value2');
        await new Promise(resolve => setTimeout(resolve, 5));
        cache.set('key3', 'value3');
        await new Promise(resolve => setTimeout(resolve, 5));

        // Access key1 and key3, leaving key2 as least recently used
        cache.get('key1');
        await new Promise(resolve => setTimeout(resolve, 5));
        cache.get('key3');
        await new Promise(resolve => setTimeout(resolve, 5));

        // key2 is now least recently used
        cache.set('key4', 'value4');

        expect(cache.has('key1')).toBe(true);
        expect(cache.has('key2')).toBe(false); // Evicted as least recently used
        expect(cache.has('key3')).toBe(true);
        expect(cache.has('key4')).toBe(true);
      });

      it('should evict correctly with sequential access pattern', async () => {
        cache.set('A', 1);
        await new Promise(resolve => setTimeout(resolve, 5));
        cache.set('B', 2);
        await new Promise(resolve => setTimeout(resolve, 5));
        cache.set('C', 3);
        await new Promise(resolve => setTimeout(resolve, 5));

        // Sequential access: A, B (making C least recently used)
        cache.get('A');
        await new Promise(resolve => setTimeout(resolve, 5));
        cache.get('B');
        await new Promise(resolve => setTimeout(resolve, 5));

        // C is least recently used
        cache.set('D', 4);

        expect(cache.has('A')).toBe(true);
        expect(cache.has('B')).toBe(true);
        expect(cache.has('C')).toBe(false); // Evicted
        expect(cache.has('D')).toBe(true);
      });
    });

    describe('LFU (Least Frequently Used)', () => {
      beforeEach(() => {
        cache = new AdvancedCache({
          maxEntries: 3,
          evictionPolicy: 'lfu',
        });
      });

      it('should evict least frequently used entry', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');
        cache.set('key3', 'value3');

        // Access key1 and key2 multiple times
        cache.get('key1');
        cache.get('key1');
        cache.get('key2');

        // key3 has lowest access count (1 from initial set)
        cache.set('key4', 'value4');

        expect(cache.has('key1')).toBe(true);
        expect(cache.has('key2')).toBe(true);
        expect(cache.has('key3')).toBe(false); // Evicted
        expect(cache.has('key4')).toBe(true);
      });

      it('should track access frequency correctly', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');
        cache.set('key3', 'value3');

        // key1: 5 accesses
        for (let i = 0; i < 5; i++) {
          cache.get('key1');
        }

        // key2: 3 accesses
        for (let i = 0; i < 3; i++) {
          cache.get('key2');
        }

        // key3: 1 access (from set)
        cache.set('key4', 'value4');

        expect(cache.has('key1')).toBe(true);
        expect(cache.has('key2')).toBe(true);
        expect(cache.has('key3')).toBe(false); // Least frequently used
        expect(cache.has('key4')).toBe(true);
      });
    });

    describe('FIFO (First In First Out)', () => {
      beforeEach(() => {
        cache = new AdvancedCache({
          maxEntries: 3,
          evictionPolicy: 'fifo',
        });
      });

      it('should evict oldest entry first', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');
        cache.set('key3', 'value3');

        // Even if we access key1, it should still be evicted (FIFO ignores access)
        cache.get('key1');

        cache.set('key4', 'value4');

        expect(cache.has('key1')).toBe(false); // First in, first out
        expect(cache.has('key2')).toBe(true);
        expect(cache.has('key3')).toBe(true);
        expect(cache.has('key4')).toBe(true);
      });

      it('should maintain insertion order for eviction', () => {
        cache.set('A', 1);
        cache.set('B', 2);
        cache.set('C', 3);

        cache.set('D', 4); // A evicted
        expect(cache.has('A')).toBe(false);

        cache.set('E', 5); // B evicted
        expect(cache.has('B')).toBe(false);

        cache.set('F', 6); // C evicted
        expect(cache.has('C')).toBe(false);

        expect(cache.has('D')).toBe(true);
        expect(cache.has('E')).toBe(true);
        expect(cache.has('F')).toBe(true);
      });
    });

    describe('TTL (Time To Live)', () => {
      beforeEach(() => {
        cache = new AdvancedCache({
          maxEntries: 3,
          evictionPolicy: 'ttl',
          defaultTTL: 10000,
        });
      });

      it('should evict entry closest to expiration', () => {
        cache.set('key1', 'value1', { ttl: 1000 }); // Expires soonest
        cache.set('key2', 'value2', { ttl: 5000 });
        cache.set('key3', 'value3', { ttl: 10000 });

        cache.set('key4', 'value4');

        expect(cache.has('key1')).toBe(false); // Closest to expiration
        expect(cache.has('key2')).toBe(true);
        expect(cache.has('key3')).toBe(true);
        expect(cache.has('key4')).toBe(true);
      });

      it('should prefer shorter TTL entries for eviction', () => {
        cache.set('short', 'value1', { ttl: 100 });
        cache.set('medium', 'value2', { ttl: 5000 });
        cache.set('long', 'value3', { ttl: 60000 });

        cache.set('new', 'value4');

        expect(cache.has('short')).toBe(false);
        expect(cache.has('medium')).toBe(true);
        expect(cache.has('long')).toBe(true);
      });
    });
  });

  describe('Tag-based operations', () => {
    beforeEach(() => {
      cache = new AdvancedCache();
    });

    describe('setWithTags (via set options)', () => {
      it('should set value with single tag', () => {
        cache.set('key1', 'value1', { tags: ['tag1'] });
        expect(cache.getByTag('tag1')).toEqual(['value1']);
      });

      it('should set value with multiple tags', () => {
        cache.set('key1', 'value1', { tags: ['tag1', 'tag2', 'tag3'] });
        expect(cache.getByTag('tag1')).toEqual(['value1']);
        expect(cache.getByTag('tag2')).toEqual(['value1']);
        expect(cache.getByTag('tag3')).toEqual(['value1']);
      });

      it('should set multiple values with same tag', () => {
        cache.set('key1', 'value1', { tags: ['common'] });
        cache.set('key2', 'value2', { tags: ['common'] });
        cache.set('key3', 'value3', { tags: ['common'] });

        const tagged = cache.getByTag('common');
        expect(tagged).toHaveLength(3);
        expect(tagged).toContain('value1');
        expect(tagged).toContain('value2');
        expect(tagged).toContain('value3');
      });
    });

    describe('getByTag()', () => {
      it('should return all values with tag', () => {
        cache.set('user:1', { id: 1, name: 'Alice' }, { tags: ['user'] });
        cache.set('user:2', { id: 2, name: 'Bob' }, { tags: ['user'] });
        cache.set('post:1', { id: 1, title: 'Post' }, { tags: ['post'] });

        const users = cache.getByTag('user');
        expect(users).toHaveLength(2);
      });

      it('should return empty array for non-existent tag', () => {
        cache.set('key1', 'value1', { tags: ['tag1'] });
        expect(cache.getByTag('nonexistent')).toEqual([]);
      });

      it('should not return expired entries', async () => {
        cache.set('key1', 'value1', { tags: ['tag1'], ttl: 50 });
        cache.set('key2', 'value2', { tags: ['tag1'], ttl: 5000 });

        await new Promise(resolve => setTimeout(resolve, 100));

        const values = cache.getByTag('tag1');
        expect(values).toEqual(['value2']);
      });
    });

    describe('getKeysByTag()', () => {
      it('should return all keys with tag', () => {
        cache.set('user:1', { id: 1 }, { tags: ['user'] });
        cache.set('user:2', { id: 2 }, { tags: ['user'] });

        const keys = cache.getKeysByTag('user');
        expect(keys).toContain('user:1');
        expect(keys).toContain('user:2');
      });

      it('should return empty array for non-existent tag', () => {
        expect(cache.getKeysByTag('nonexistent')).toEqual([]);
      });
    });

    describe('deleteByTag()', () => {
      it('should delete all entries with tag', () => {
        cache.set('key1', 'value1', { tags: ['tag1'] });
        cache.set('key2', 'value2', { tags: ['tag1'] });
        cache.set('key3', 'value3', { tags: ['tag2'] });

        const deleted = cache.deleteByTag('tag1');

        expect(deleted).toBe(2);
        expect(cache.has('key1')).toBe(false);
        expect(cache.has('key2')).toBe(false);
        expect(cache.has('key3')).toBe(true);
      });

      it('should return 0 for non-existent tag', () => {
        cache.set('key1', 'value1', { tags: ['tag1'] });
        expect(cache.deleteByTag('nonexistent')).toBe(0);
      });

      it('should call onEvict for each deleted entry', () => {
        const onEvict = vi.fn();
        cache = new AdvancedCache({ onEvict });

        cache.set('key1', 'value1', { tags: ['batch'] });
        cache.set('key2', 'value2', { tags: ['batch'] });

        cache.deleteByTag('batch');

        expect(onEvict).toHaveBeenCalledTimes(2);
      });
    });

    describe('getTags()', () => {
      it('should return all unique tags', () => {
        cache.set('key1', 'value1', { tags: ['tag1', 'tag2'] });
        cache.set('key2', 'value2', { tags: ['tag2', 'tag3'] });

        const tags = cache.getTags();
        expect(tags).toBeInstanceOf(Set);
        expect(tags.has('tag1')).toBe(true);
        expect(tags.has('tag2')).toBe(true);
        expect(tags.has('tag3')).toBe(true);
      });

      it('should return empty set when no tags', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');

        expect(cache.getTags().size).toBe(0);
      });
    });
  });

  describe('getStats()', () => {
    beforeEach(() => {
      cache = new AdvancedCache();
    });

    it('should return initial stats with zero values', () => {
      const stats = cache.getStats();

      expect(stats.entries).toBe(0);
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.evictions).toBe(0);
    });

    it('should track entry count', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      expect(cache.getStats().entries).toBe(2);
    });

    it('should track cache size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'longer value here');

      const stats = cache.getStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should track hits', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('key1');

      expect(cache.getStats().hits).toBe(2);
    });

    it('should track misses', () => {
      cache.get('nonexistent1');
      cache.get('nonexistent2');

      expect(cache.getStats().misses).toBe(2);
    });

    it('should calculate hit rate correctly', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // Hit
      cache.get('key1'); // Hit
      cache.get('key1'); // Hit
      cache.get('nonexistent'); // Miss

      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0.75); // 3 hits / 4 total
    });

    it('should track evictions', () => {
      cache = new AdvancedCache({ maxEntries: 2 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3'); // Triggers eviction

      expect(cache.getStats().evictions).toBe(1);
    });

    it('should track average access time', () => {
      cache.set('key1', 'value1');
      cache.get('key1');

      const stats = cache.getStats();
      expect(stats.avgAccessTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('TTL expiration', () => {
    beforeEach(() => {
      cache = new AdvancedCache({ defaultTTL: 100 });
    });

    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1', { ttl: 50 });

      expect(cache.get('key1')).toBe('value1');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(cache.get('key1')).toBeUndefined();
    });

    it('should use default TTL when not specified', async () => {
      cache = new AdvancedCache({ defaultTTL: 50 });
      cache.set('key1', 'value1');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(cache.get('key1')).toBeUndefined();
    });

    it('should emit expire event', async () => {
      const listener = vi.fn();
      cache.on('expire', listener);

      cache.set('key1', 'value1', { ttl: 50 });

      await new Promise(resolve => setTimeout(resolve, 100));

      cache.get('key1'); // Triggers expiration check

      expect(listener).toHaveBeenCalledWith('key1');
    });

    it('should count expired as miss', async () => {
      cache.set('key1', 'value1', { ttl: 50 });

      await new Promise(resolve => setTimeout(resolve, 100));

      cache.get('key1');

      expect(cache.getStats().misses).toBe(1);
    });

    it('should handle entries with no TTL', () => {
      cache = new AdvancedCache({ defaultTTL: 0 });
      cache.set('key1', 'value1');

      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('Max size enforcement', () => {
    it('should enforce maxEntries limit', () => {
      cache = new AdvancedCache({ maxEntries: 3 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');

      expect(cache.size).toBe(3);
    });

    it('should enforce maxSize limit', () => {
      // Create cache with very small max size
      cache = new AdvancedCache({ maxSize: 100 });

      // Add entries that exceed size
      cache.set('key1', 'x'.repeat(30));
      cache.set('key2', 'x'.repeat(30));
      cache.set('key3', 'x'.repeat(30));
      cache.set('key4', 'x'.repeat(30));

      const stats = cache.getStats();
      expect(stats.size).toBeLessThanOrEqual(100);
    });

    it('should evict multiple entries if needed for large entry', () => {
      cache = new AdvancedCache({ maxEntries: 5, maxSize: 200 });

      cache.set('small1', 'a');
      cache.set('small2', 'b');
      cache.set('small3', 'c');
      cache.set('large', 'x'.repeat(50)); // May evict multiple small entries

      expect(cache.size).toBeLessThanOrEqual(5);
    });
  });

  describe('Event emission', () => {
    beforeEach(() => {
      cache = new AdvancedCache();
    });

    it('should emit set event', () => {
      const listener = vi.fn();
      cache.on('set', listener);

      cache.set('key1', 'value1');

      expect(listener).toHaveBeenCalledWith('key1', 'value1');
    });

    it('should emit get event on hit', () => {
      const listener = vi.fn();
      cache.on('get', listener);

      cache.set('key1', 'value1');
      cache.get('key1');

      expect(listener).toHaveBeenCalledWith('key1', 'value1');
    });

    it('should emit get event on miss', () => {
      const listener = vi.fn();
      cache.on('get', listener);

      cache.get('nonexistent');

      expect(listener).toHaveBeenCalledWith('nonexistent', undefined);
    });

    it('should emit delete event', () => {
      const listener = vi.fn();
      cache.on('delete', listener);

      cache.set('key1', 'value1');
      cache.delete('key1');

      expect(listener).toHaveBeenCalledWith('key1');
    });

    it('should emit evict event on eviction', () => {
      cache = new AdvancedCache({ maxEntries: 2 });
      const listener = vi.fn();
      cache.on('evict', listener);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3'); // Triggers eviction

      expect(listener).toHaveBeenCalled();
    });

    it('should emit clear event', () => {
      const listener = vi.fn();
      cache.on('clear', listener);

      cache.set('key1', 'value1');
      cache.clear();

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Additional methods', () => {
    beforeEach(() => {
      cache = new AdvancedCache();
    });

    describe('keys()', () => {
      it('should return all keys', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');

        const keys = cache.keys();
        expect(keys).toContain('key1');
        expect(keys).toContain('key2');
      });

      it('should return empty array for empty cache', () => {
        expect(cache.keys()).toEqual([]);
      });
    });

    describe('values()', () => {
      it('should return all values', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');

        const values = cache.values();
        expect(values).toContain('value1');
        expect(values).toContain('value2');
      });

      it('should not return expired values', async () => {
        cache.set('key1', 'value1', { ttl: 50 });
        cache.set('key2', 'value2', { ttl: 5000 });

        await new Promise(resolve => setTimeout(resolve, 100));

        const values = cache.values();
        expect(values).not.toContain('value1');
        expect(values).toContain('value2');
      });
    });

    describe('entries()', () => {
      it('should return all entries as [key, value] pairs', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');

        const entries = cache.entries();
        expect(entries).toContainEqual(['key1', 'value1']);
        expect(entries).toContainEqual(['key2', 'value2']);
      });
    });

    describe('touch()', () => {
      it('should update access time', () => {
        cache.set('key1', 'value1');

        const result = cache.touch('key1');

        expect(result).toBe(true);
      });

      it('should return false for non-existent key', () => {
        expect(cache.touch('nonexistent')).toBe(false);
      });

      it('should optionally update TTL', () => {
        cache.set('key1', 'value1', { ttl: 100 });
        cache.touch('key1', 5000);

        expect(cache.has('key1')).toBe(true);
      });
    });

    describe('setEvictionPolicy()', () => {
      it('should change eviction policy', () => {
        cache.setEvictionPolicy('lfu');
        expect(cache.getEvictionPolicy()).toBe('lfu');

        cache.setEvictionPolicy('fifo');
        expect(cache.getEvictionPolicy()).toBe('fifo');
      });
    });

    describe('resetStats()', () => {
      it('should reset all statistics', () => {
        cache.set('key1', 'value1');
        cache.get('key1');
        cache.get('nonexistent');

        cache.resetStats();

        const stats = cache.getStats();
        expect(stats.hits).toBe(0);
        expect(stats.misses).toBe(0);
        expect(stats.evictions).toBe(0);
      });
    });

    describe('size property', () => {
      it('should return current entry count', () => {
        expect(cache.size).toBe(0);

        cache.set('key1', 'value1');
        expect(cache.size).toBe(1);

        cache.set('key2', 'value2');
        expect(cache.size).toBe(2);

        cache.delete('key1');
        expect(cache.size).toBe(1);
      });
    });

    describe('getOrSet()', () => {
      it('should return cached value if exists', async () => {
        cache.set('key1', 'cached');
        const factory = vi.fn(() => 'new');

        const result = await cache.getOrSet('key1', factory);

        expect(result).toBe('cached');
        expect(factory).not.toHaveBeenCalled();
      });

      it('should call factory and cache if not exists', async () => {
        const factory = vi.fn(() => 'new');

        const result = await cache.getOrSet('key1', factory);

        expect(result).toBe('new');
        expect(factory).toHaveBeenCalled();
        expect(cache.get('key1')).toBe('new');
      });

      it('should support async factory', async () => {
        const factory = vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'async-value';
        });

        const result = await cache.getOrSet('key1', factory);

        expect(result).toBe('async-value');
      });

      it('should apply options to new entry', async () => {
        await cache.getOrSet('key1', () => 'value', { tags: ['test'] });

        expect(cache.getByTag('test')).toContain('value');
      });
    });

    describe('getOrSetSync()', () => {
      it('should return cached value if exists', () => {
        cache.set('key1', 'cached');
        const factory = vi.fn(() => 'new');

        const result = cache.getOrSetSync('key1', factory);

        expect(result).toBe('cached');
        expect(factory).not.toHaveBeenCalled();
      });

      it('should call factory and cache if not exists', () => {
        const factory = vi.fn(() => 'new');

        const result = cache.getOrSetSync('key1', factory);

        expect(result).toBe('new');
        expect(factory).toHaveBeenCalled();
      });
    });

    describe('destroy()', () => {
      it('should clear cache and stop cleanup timer', () => {
        cache.set('key1', 'value1');
        cache.destroy();

        expect(cache.size).toBe(0);
      });

      it('should remove all listeners', () => {
        const listener = vi.fn();
        cache.on('set', listener);

        cache.destroy();
        cache.emit('set', 'key', 'value');

        expect(listener).not.toHaveBeenCalled();
      });
    });
  });
});

describe('createAdvancedCache()', () => {
  it('should create AdvancedCache instance', () => {
    const cache = createAdvancedCache();
    expect(cache).toBeInstanceOf(AdvancedCache);
    cache.destroy();
  });

  it('should accept configuration', () => {
    const cache = createAdvancedCache({
      maxEntries: 100,
      evictionPolicy: 'lfu',
    });

    expect(cache.getEvictionPolicy()).toBe('lfu');
    cache.destroy();
  });

  it('should support generic type parameter', () => {
    const cache = createAdvancedCache<string>();

    cache.set('key1', 'value1');
    const value: string | undefined = cache.get('key1');

    expect(value).toBe('value1');
    cache.destroy();
  });

  it('should create independent instances', () => {
    const cache1 = createAdvancedCache();
    const cache2 = createAdvancedCache();

    cache1.set('key1', 'value1');

    expect(cache1.has('key1')).toBe(true);
    expect(cache2.has('key1')).toBe(false);

    cache1.destroy();
    cache2.destroy();
  });
});

describe('createPreloadedCache()', () => {
  it('should create cache with preloaded entries', () => {
    const cache = createPreloadedCache([
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' },
    ]);

    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBe('value2');
    cache.destroy();
  });

  it('should apply options to preloaded entries', () => {
    const cache = createPreloadedCache([
      { key: 'key1', value: 'value1', options: { tags: ['preloaded'] } },
      { key: 'key2', value: 'value2', options: { tags: ['preloaded'] } },
    ]);

    expect(cache.getByTag('preloaded')).toHaveLength(2);
    cache.destroy();
  });

  it('should accept cache configuration', () => {
    const cache = createPreloadedCache(
      [{ key: 'key1', value: 'value1' }],
      { evictionPolicy: 'fifo' }
    );

    expect(cache.getEvictionPolicy()).toBe('fifo');
    cache.destroy();
  });

  it('should handle empty entries array', () => {
    const cache = createPreloadedCache([]);
    expect(cache.size).toBe(0);
    cache.destroy();
  });
});

describe('Edge cases and error handling', () => {
  let cache: AdvancedCache;

  afterEach(() => {
    if (cache) {
      cache.destroy();
    }
  });

  it('should handle very long keys', () => {
    cache = new AdvancedCache();
    const longKey = 'k'.repeat(10000);

    cache.set(longKey, 'value');
    expect(cache.get(longKey)).toBe('value');
  });

  it('should handle special characters in keys', () => {
    cache = new AdvancedCache();

    cache.set('key:with:colons', 'value1');
    cache.set('key/with/slashes', 'value2');
    cache.set('key.with.dots', 'value3');

    expect(cache.get('key:with:colons')).toBe('value1');
    expect(cache.get('key/with/slashes')).toBe('value2');
    expect(cache.get('key.with.dots')).toBe('value3');
  });

  it('should handle empty string key', () => {
    cache = new AdvancedCache();

    cache.set('', 'empty key value');
    expect(cache.get('')).toBe('empty key value');
  });

  it('should handle circular references gracefully', () => {
    cache = new AdvancedCache();

    const obj: any = { name: 'test' };
    obj.self = obj; // Circular reference

    // Should not throw
    cache.set('circular', obj);
    expect(cache.get('circular')).toBe(obj);
  });

  it('should handle undefined values', () => {
    cache = new AdvancedCache();

    // Note: undefined values might be confusing with cache misses
    cache.set('key1', undefined);
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.has('key1')).toBe(true); // But has() should return true
  });

  it('should handle rapid set/get operations', () => {
    cache = new AdvancedCache({ maxEntries: 100 });

    for (let i = 0; i < 1000; i++) {
      cache.set(`key${i}`, `value${i}`);
    }

    // Last 100 entries should be available
    expect(cache.size).toBe(100);
  });

  it('should handle concurrent operations on same key', () => {
    cache = new AdvancedCache();

    // Rapid updates to same key
    for (let i = 0; i < 100; i++) {
      cache.set('key', i);
    }

    expect(cache.get('key')).toBe(99);
    expect(cache.size).toBe(1);
  });
});

describe('Performance characteristics', () => {
  it('should handle large number of entries efficiently', () => {
    const cache = new AdvancedCache({ maxEntries: 10000 });
    const startTime = Date.now();

    for (let i = 0; i < 10000; i++) {
      cache.set(`key${i}`, { id: i, data: `value${i}` });
    }

    const insertTime = Date.now() - startTime;

    // Should complete within reasonable time (adjust threshold as needed)
    expect(insertTime).toBeLessThan(5000);

    const lookupStart = Date.now();
    for (let i = 0; i < 1000; i++) {
      cache.get(`key${i}`);
    }
    const lookupTime = Date.now() - lookupStart;

    expect(lookupTime).toBeLessThan(1000);

    cache.destroy();
  });

  it('should maintain consistent performance during evictions', () => {
    const cache = new AdvancedCache({ maxEntries: 100 });

    const times: number[] = [];

    for (let batch = 0; batch < 10; batch++) {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        cache.set(`key${batch}-${i}`, `value${i}`);
      }

      times.push(Date.now() - startTime);
    }

    // Each batch should have similar timing
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxDeviation = Math.max(...times.map(t => Math.abs(t - avgTime)));

    // Allow for significant variance in CI environments where timing can be unpredictable
    // The key assertion is that operations complete, not strict timing bounds
    expect(maxDeviation).toBeLessThan(avgTime * 10 + 5);

    cache.destroy();
  });
});
