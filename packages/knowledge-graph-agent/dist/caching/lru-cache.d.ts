/**
 * LRU Cache Implementation
 *
 * Advanced cache implementation supporting multiple eviction policies,
 * TTL management, tag-based operations, and comprehensive statistics.
 *
 * @module caching/lru-cache
 */
import { EventEmitter } from 'events';
import type { CacheConfig, CacheStats, EvictionPolicy, CacheSetOptions } from './types.js';
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
export declare class AdvancedCache<T = any> extends EventEmitter {
    private cache;
    private config;
    private stats;
    private cleanupTimer?;
    /**
     * Create a new AdvancedCache instance
     *
     * @param config - Partial cache configuration (defaults will be applied)
     */
    constructor(config?: Partial<CacheConfig>);
    /**
     * Get a value from the cache
     *
     * @param key - The cache key to retrieve
     * @returns The cached value or undefined if not found/expired
     */
    get<V extends T>(key: string): V | undefined;
    /**
     * Set a value in the cache
     *
     * @param key - The cache key
     * @param value - The value to cache
     * @param options - Optional settings for TTL and tags
     */
    set(key: string, value: T, options?: CacheSetOptions): void;
    /**
     * Check if a key exists in the cache and is not expired
     *
     * @param key - The cache key to check
     * @returns True if key exists and is not expired
     */
    has(key: string): boolean;
    /**
     * Delete an entry from the cache
     *
     * @param key - The cache key to delete
     * @returns True if the entry was deleted
     */
    delete(key: string): boolean;
    /**
     * Clear all entries from the cache
     */
    clear(): void;
    /**
     * Get all entries with a specific tag
     *
     * @param tag - The tag to filter by
     * @returns Array of values with the specified tag
     */
    getByTag(tag: string): T[];
    /**
     * Get all keys with a specific tag
     *
     * @param tag - The tag to filter by
     * @returns Array of keys with the specified tag
     */
    getKeysByTag(tag: string): string[];
    /**
     * Delete all entries with a specific tag
     *
     * @param tag - The tag to filter by
     * @returns Number of entries deleted
     */
    deleteByTag(tag: string): number;
    /**
     * Get all unique tags in the cache
     *
     * @returns Set of all tags
     */
    getTags(): Set<string>;
    /**
     * Get cache statistics
     *
     * @returns Current cache statistics
     */
    getStats(): CacheStats;
    /**
     * Reset statistics counters
     */
    resetStats(): void;
    /**
     * Get the current eviction policy
     */
    getEvictionPolicy(): EvictionPolicy;
    /**
     * Change the eviction policy
     *
     * @param policy - The new eviction policy
     */
    setEvictionPolicy(policy: EvictionPolicy): void;
    /**
     * Get all keys in the cache
     *
     * @returns Array of all cache keys
     */
    keys(): string[];
    /**
     * Get all values in the cache
     *
     * @returns Array of all cached values
     */
    values(): T[];
    /**
     * Get all entries in the cache
     *
     * @returns Array of [key, value] pairs
     */
    entries(): [string, T][];
    /**
     * Get the number of entries in the cache
     */
    get size(): number;
    /**
     * Update the TTL for an existing entry
     *
     * @param key - The cache key
     * @param ttl - New TTL in milliseconds
     * @returns True if the entry was updated
     */
    touch(key: string, ttl?: number): boolean;
    /**
     * Get or set a value using a factory function
     *
     * @param key - The cache key
     * @param factory - Function to create value if not cached
     * @param options - Optional settings for TTL and tags
     * @returns The cached or newly created value
     */
    getOrSet<V extends T>(key: string, factory: () => V | Promise<V>, options?: CacheSetOptions): Promise<V>;
    /**
     * Get or set a value synchronously using a factory function
     *
     * @param key - The cache key
     * @param factory - Function to create value if not cached
     * @param options - Optional settings for TTL and tags
     * @returns The cached or newly created value
     */
    getOrSetSync<V extends T>(key: string, factory: () => V, options?: CacheSetOptions): V;
    /**
     * Check if an entry is expired
     */
    private isExpired;
    /**
     * Check if eviction is needed for a new entry of given size
     */
    private needsEviction;
    /**
     * Evict one entry based on the eviction policy
     *
     * @returns True if an entry was evicted
     */
    private evictOne;
    /**
     * Select a candidate for eviction based on policy
     */
    private selectEvictionCandidate;
    /**
     * Compare two entries for eviction (returns true if entry should be evicted over candidate)
     */
    private compareForEviction;
    /**
     * Estimate the size of a value in bytes
     */
    private estimateSize;
    /**
     * Record access time for statistics
     */
    private recordAccessTime;
    /**
     * Start periodic cleanup of expired entries
     */
    private startCleanup;
    /**
     * Destroy the cache and release resources
     */
    destroy(): void;
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
export declare function createAdvancedCache<T = any>(config?: Partial<CacheConfig>): AdvancedCache<T>;
/**
 * Create a cache with preloaded entries
 *
 * @param entries - Initial entries to populate the cache
 * @param config - Partial cache configuration
 * @returns A new AdvancedCache instance with preloaded entries
 */
export declare function createPreloadedCache<T = any>(entries: Array<{
    key: string;
    value: T;
    options?: CacheSetOptions;
}>, config?: Partial<CacheConfig>): AdvancedCache<T>;
//# sourceMappingURL=lru-cache.d.ts.map