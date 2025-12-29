/**
 * LRU Cache Implementation
 *
 * Advanced cache implementation supporting multiple eviction policies,
 * TTL management, tag-based operations, and comprehensive statistics.
 *
 * @module caching/lru-cache
 */

import { EventEmitter } from 'events';
import { createLogger } from '../utils/index.js';
import type { CacheEntry, CacheConfig, CacheStats, EvictionPolicy, CacheSetOptions } from './types.js';

const logger = createLogger('lru-cache');

/**
 * Cache event types emitted by AdvancedCache
 */
export interface CacheEvents<T> {
  set: (key: string, value: T) => void;
  get: (key: string, value: T | undefined) => void;
  delete: (key: string) => void;
  evict: (key: string) => void;
  clear: () => void;
  expire: (key: string) => void;
}

/**
 * Advanced Cache with multiple eviction policies
 *
 * Features:
 * - LRU, LFU, FIFO, and TTL-based eviction policies
 * - Tag-based grouping and batch operations
 * - Automatic TTL expiration with periodic cleanup
 * - Comprehensive statistics and monitoring
 * - Event emission for cache operations
 *
 * @example
 * ```typescript
 * const cache = new AdvancedCache<User>({
 *   maxSize: 50 * 1024 * 1024, // 50MB
 *   maxEntries: 1000,
 *   defaultTTL: 300000, // 5 minutes
 *   evictionPolicy: 'lru',
 *   onEvict: (key, value) => console.log(`Evicted: ${key}`)
 * });
 *
 * cache.set('user:123', userData, { tags: ['user', 'active'] });
 * const user = cache.get<User>('user:123');
 *
 * // Delete all entries with 'user' tag
 * cache.deleteByTag('user');
 * ```
 */
export class AdvancedCache<T = any> extends EventEmitter {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalAccessTime: 0,
    accessCount: 0,
  };
  private cleanupTimer?: NodeJS.Timeout;

  /**
   * Create a new AdvancedCache instance
   *
   * @param config - Partial cache configuration (defaults will be applied)
   */
  constructor(config?: Partial<CacheConfig>) {
    super();
    this.config = {
      maxSize: config?.maxSize ?? 100 * 1024 * 1024, // 100MB default
      maxEntries: config?.maxEntries ?? 10000,
      defaultTTL: config?.defaultTTL ?? 3600000, // 1 hour default
      evictionPolicy: config?.evictionPolicy ?? 'lru',
      onEvict: config?.onEvict,
    };

    logger.debug('Cache initialized', {
      maxSize: this.config.maxSize,
      maxEntries: this.config.maxEntries,
      evictionPolicy: this.config.evictionPolicy,
    });

    this.startCleanup();
  }

  /**
   * Get a value from the cache
   *
   * @param key - The cache key to retrieve
   * @returns The cached value or undefined if not found/expired
   */
  get<V extends T>(key: string): V | undefined {
    const startTime = Date.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.recordAccessTime(startTime);
      logger.debug('Cache miss', { key });
      this.emit('get', key, undefined);
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      this.recordAccessTime(startTime);
      logger.debug('Cache expired', { key });
      this.emit('expire', key);
      return undefined;
    }

    // Update access metadata
    entry.accessedAt = Date.now();
    entry.accessCount++;
    this.stats.hits++;
    this.recordAccessTime(startTime);

    logger.debug('Cache hit', { key, accessCount: entry.accessCount });
    this.emit('get', key, entry.value);

    return entry.value as V;
  }

  /**
   * Set a value in the cache
   *
   * @param key - The cache key
   * @param value - The value to cache
   * @param options - Optional settings for TTL and tags
   */
  set(key: string, value: T, options?: CacheSetOptions): void {
    const size = this.estimateSize(value);

    // Evict entries if needed to make room
    while (this.needsEviction(size)) {
      const evicted = this.evictOne();
      if (!evicted) {
        logger.warn('Unable to evict entry to make room', { key, size });
        break;
      }
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      size,
      createdAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 1,
      ttl: options?.ttl ?? this.config.defaultTTL,
      tags: options?.tags,
    };

    this.cache.set(key, entry);
    logger.debug('Cache set', { key, size, ttl: entry.ttl, tags: entry.tags });
    this.emit('set', key, value);
  }

  /**
   * Check if a key exists in the cache and is not expired
   *
   * @param key - The cache key to check
   * @returns True if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Delete an entry from the cache
   *
   * @param key - The cache key to delete
   * @returns True if the entry was deleted
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.config.onEvict?.(key, entry.value);
      this.cache.delete(key);
      logger.debug('Cache delete', { key });
      this.emit('delete', key);
      return true;
    }
    return false;
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    for (const [key, entry] of this.cache) {
      this.config.onEvict?.(key, entry.value);
    }
    this.cache.clear();
    logger.info('Cache cleared');
    this.emit('clear');
  }

  /**
   * Get all entries with a specific tag
   *
   * @param tag - The tag to filter by
   * @returns Array of values with the specified tag
   */
  getByTag(tag: string): T[] {
    const results: T[] = [];
    for (const entry of this.cache.values()) {
      if (entry.tags?.includes(tag) && !this.isExpired(entry)) {
        results.push(entry.value);
      }
    }
    logger.debug('Get by tag', { tag, count: results.length });
    return results;
  }

  /**
   * Get all keys with a specific tag
   *
   * @param tag - The tag to filter by
   * @returns Array of keys with the specified tag
   */
  getKeysByTag(tag: string): string[] {
    const results: string[] = [];
    for (const entry of this.cache.values()) {
      if (entry.tags?.includes(tag) && !this.isExpired(entry)) {
        results.push(entry.key);
      }
    }
    return results;
  }

  /**
   * Delete all entries with a specific tag
   *
   * @param tag - The tag to filter by
   * @returns Number of entries deleted
   */
  deleteByTag(tag: string): number {
    let deleted = 0;
    for (const [key, entry] of this.cache) {
      if (entry.tags?.includes(tag)) {
        this.delete(key);
        deleted++;
      }
    }
    logger.info('Delete by tag', { tag, deleted });
    return deleted;
  }

  /**
   * Get all unique tags in the cache
   *
   * @returns Set of all tags
   */
  getTags(): Set<string> {
    const tags = new Set<string>();
    for (const entry of this.cache.values()) {
      if (entry.tags) {
        for (const tag of entry.tags) {
          tags.add(tag);
        }
      }
    }
    return tags;
  }

  /**
   * Get cache statistics
   *
   * @returns Current cache statistics
   */
  getStats(): CacheStats {
    const totalHitsMisses = this.stats.hits + this.stats.misses;
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }

    return {
      entries: this.cache.size,
      size: totalSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: totalHitsMisses > 0 ? this.stats.hits / totalHitsMisses : 0,
      evictions: this.stats.evictions,
      avgAccessTime:
        this.stats.accessCount > 0 ? this.stats.totalAccessTime / this.stats.accessCount : 0,
    };
  }

  /**
   * Reset statistics counters
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalAccessTime: 0,
      accessCount: 0,
    };
    logger.debug('Cache stats reset');
  }

  /**
   * Get the current eviction policy
   */
  getEvictionPolicy(): EvictionPolicy {
    return this.config.evictionPolicy;
  }

  /**
   * Change the eviction policy
   *
   * @param policy - The new eviction policy
   */
  setEvictionPolicy(policy: EvictionPolicy): void {
    this.config.evictionPolicy = policy;
    logger.info('Eviction policy changed', { policy });
  }

  /**
   * Get all keys in the cache
   *
   * @returns Array of all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values in the cache
   *
   * @returns Array of all cached values
   */
  values(): T[] {
    const results: T[] = [];
    for (const entry of this.cache.values()) {
      if (!this.isExpired(entry)) {
        results.push(entry.value);
      }
    }
    return results;
  }

  /**
   * Get all entries in the cache
   *
   * @returns Array of [key, value] pairs
   */
  entries(): [string, T][] {
    const results: [string, T][] = [];
    for (const entry of this.cache.values()) {
      if (!this.isExpired(entry)) {
        results.push([entry.key, entry.value]);
      }
    }
    return results;
  }

  /**
   * Get the number of entries in the cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Update the TTL for an existing entry
   *
   * @param key - The cache key
   * @param ttl - New TTL in milliseconds
   * @returns True if the entry was updated
   */
  touch(key: string, ttl?: number): boolean {
    const entry = this.cache.get(key);
    if (entry && !this.isExpired(entry)) {
      entry.accessedAt = Date.now();
      if (ttl !== undefined) {
        entry.ttl = ttl;
        entry.createdAt = Date.now(); // Reset TTL timer
      }
      return true;
    }
    return false;
  }

  /**
   * Get or set a value using a factory function
   *
   * @param key - The cache key
   * @param factory - Function to create value if not cached
   * @param options - Optional settings for TTL and tags
   * @returns The cached or newly created value
   */
  async getOrSet<V extends T>(
    key: string,
    factory: () => V | Promise<V>,
    options?: CacheSetOptions
  ): Promise<V> {
    const cached = this.get<V>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, options);
    return value;
  }

  /**
   * Get or set a value synchronously using a factory function
   *
   * @param key - The cache key
   * @param factory - Function to create value if not cached
   * @param options - Optional settings for TTL and tags
   * @returns The cached or newly created value
   */
  getOrSetSync<V extends T>(key: string, factory: () => V, options?: CacheSetOptions): V {
    const cached = this.get<V>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = factory();
    this.set(key, value, options);
    return value;
  }

  /**
   * Check if an entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    if (!entry.ttl) {
      return false;
    }
    return Date.now() - entry.createdAt > entry.ttl;
  }

  /**
   * Check if eviction is needed for a new entry of given size
   */
  private needsEviction(newSize: number): boolean {
    if (this.cache.size === 0) {
      return false;
    }

    // Check entry count limit
    if (this.cache.size >= this.config.maxEntries) {
      return true;
    }

    // Check size limit
    let totalSize = newSize;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return totalSize > this.config.maxSize;
  }

  /**
   * Evict one entry based on the eviction policy
   *
   * @returns True if an entry was evicted
   */
  private evictOne(): boolean {
    const toEvict = this.selectEvictionCandidate();
    if (toEvict) {
      this.delete(toEvict);
      this.stats.evictions++;
      logger.debug('Cache eviction', { key: toEvict, policy: this.config.evictionPolicy });
      this.emit('evict', toEvict);
      return true;
    }
    return false;
  }

  /**
   * Select a candidate for eviction based on policy
   */
  private selectEvictionCandidate(): string | undefined {
    if (this.cache.size === 0) {
      return undefined;
    }

    let candidate: { key: string; entry: CacheEntry<T> } | undefined;

    for (const [key, entry] of this.cache) {
      if (!candidate) {
        candidate = { key, entry };
        continue;
      }

      const shouldReplace = this.compareForEviction(entry, candidate.entry);
      if (shouldReplace) {
        candidate = { key, entry };
      }
    }

    return candidate?.key;
  }

  /**
   * Compare two entries for eviction (returns true if entry should be evicted over candidate)
   */
  private compareForEviction(entry: CacheEntry<T>, candidate: CacheEntry<T>): boolean {
    switch (this.config.evictionPolicy) {
      case 'lru':
        // Evict least recently used
        return entry.accessedAt < candidate.accessedAt;

      case 'lfu':
        // Evict least frequently used
        return entry.accessCount < candidate.accessCount;

      case 'fifo':
        // Evict first in (oldest)
        return entry.createdAt < candidate.createdAt;

      case 'ttl':
        // Evict closest to expiration
        const entryExpiry = entry.createdAt + (entry.ttl || Infinity);
        const candidateExpiry = candidate.createdAt + (candidate.ttl || Infinity);
        return entryExpiry < candidateExpiry;

      default:
        return false;
    }
  }

  /**
   * Estimate the size of a value in bytes
   */
  private estimateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2; // Approximate UTF-16 size
    } catch {
      // For non-serializable values, estimate based on type
      if (typeof value === 'string') {
        return value.length * 2;
      }
      if (typeof value === 'number') {
        return 8;
      }
      if (typeof value === 'boolean') {
        return 4;
      }
      if (value === null || value === undefined) {
        return 0;
      }
      // Default estimate for complex objects
      return 1024;
    }
  }

  /**
   * Record access time for statistics
   */
  private recordAccessTime(startTime: number): void {
    this.stats.totalAccessTime += Date.now() - startTime;
    this.stats.accessCount++;
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(
      () => {
        let cleaned = 0;
        for (const [key, entry] of this.cache) {
          if (this.isExpired(entry)) {
            this.delete(key);
            this.emit('expire', key);
            cleaned++;
          }
        }
        if (cleaned > 0) {
          logger.debug('Periodic cleanup completed', { cleaned });
        }
      },
      60000 // Run cleanup every minute
    );

    // Don't let the timer prevent process exit
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Destroy the cache and release resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
    this.removeAllListeners();
    logger.info('Cache destroyed');
  }
}

/**
 * Create a new AdvancedCache instance
 *
 * @param config - Partial cache configuration
 * @returns A new AdvancedCache instance
 *
 * @example
 * ```typescript
 * const cache = createAdvancedCache<string>({
 *   maxEntries: 1000,
 *   evictionPolicy: 'lfu'
 * });
 * ```
 */
export function createAdvancedCache<T = any>(config?: Partial<CacheConfig>): AdvancedCache<T> {
  return new AdvancedCache<T>(config);
}

/**
 * Create a cache with preloaded entries
 *
 * @param entries - Initial entries to populate the cache
 * @param config - Partial cache configuration
 * @returns A new AdvancedCache instance with preloaded entries
 */
export function createPreloadedCache<T = any>(
  entries: Array<{ key: string; value: T; options?: CacheSetOptions }>,
  config?: Partial<CacheConfig>
): AdvancedCache<T> {
  const cache = new AdvancedCache<T>(config);
  for (const { key, value, options } of entries) {
    cache.set(key, value, options);
  }
  return cache;
}
