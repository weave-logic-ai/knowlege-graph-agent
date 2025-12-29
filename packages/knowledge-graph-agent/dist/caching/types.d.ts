/**
 * Advanced Caching Types
 *
 * Type definitions for the advanced caching system supporting multiple
 * eviction policies, TTL management, and comprehensive cache statistics.
 *
 * @module caching/types
 */
/**
 * Eviction policy for cache entries when capacity is reached
 *
 * - lru: Least Recently Used - evicts entries that haven't been accessed recently
 * - lfu: Least Frequently Used - evicts entries with lowest access count
 * - fifo: First In First Out - evicts oldest entries first
 * - ttl: Time To Live - evicts entries closest to expiration
 */
export type EvictionPolicy = 'lru' | 'lfu' | 'fifo' | 'ttl';
/**
 * Cache entry storing value with metadata for eviction decisions
 */
export interface CacheEntry<T> {
    /** Unique key for the cache entry */
    key: string;
    /** The cached value */
    value: T;
    /** Estimated size of the entry in bytes */
    size: number;
    /** Unix timestamp when entry was created */
    createdAt: number;
    /** Unix timestamp when entry was last accessed */
    accessedAt: number;
    /** Number of times entry has been accessed */
    accessCount: number;
    /** Time-to-live in milliseconds (optional) */
    ttl?: number;
    /** Optional tags for grouping and batch operations */
    tags?: string[];
}
/**
 * Configuration options for the cache
 */
export interface CacheConfig {
    /** Maximum total size of cache in bytes */
    maxSize: number;
    /** Maximum number of entries in cache */
    maxEntries: number;
    /** Default TTL for entries in milliseconds */
    defaultTTL: number;
    /** Policy used for evicting entries when cache is full */
    evictionPolicy: EvictionPolicy;
    /** Optional callback when an entry is evicted */
    onEvict?: (key: string, value: any) => void;
}
/**
 * Cache statistics for monitoring and diagnostics
 */
export interface CacheStats {
    /** Current number of entries in cache */
    entries: number;
    /** Current total size of all entries in bytes */
    size: number;
    /** Total number of cache hits */
    hits: number;
    /** Total number of cache misses */
    misses: number;
    /** Hit rate as a ratio (0-1) */
    hitRate: number;
    /** Total number of evictions */
    evictions: number;
    /** Average access time in milliseconds */
    avgAccessTime: number;
}
/**
 * Options for cache set operations
 */
export interface CacheSetOptions {
    /** TTL override for this entry in milliseconds */
    ttl?: number;
    /** Tags for grouping entries */
    tags?: string[];
}
/**
 * Result of a cache operation with timing information
 */
export interface CacheOperationResult<T> {
    /** Whether the operation succeeded */
    success: boolean;
    /** The value if operation was successful */
    value?: T;
    /** Time taken for the operation in milliseconds */
    duration: number;
    /** Whether the result came from cache */
    fromCache: boolean;
}
//# sourceMappingURL=types.d.ts.map