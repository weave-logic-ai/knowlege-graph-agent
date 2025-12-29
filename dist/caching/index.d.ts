/**
 * Advanced Caching Module
 *
 * Provides configurable caching with multiple eviction policies.
 */
export type EvictionPolicy = 'lru' | 'lfu' | 'fifo' | 'ttl';
export interface CacheEntry<T> {
    key: string;
    value: T;
    createdAt: number;
    accessedAt: number;
    accessCount: number;
    ttl?: number;
    size: number;
}
export interface CacheConfig {
    maxSize?: number;
    maxEntries?: number;
    defaultTtl?: number;
    evictionPolicy?: EvictionPolicy;
    enableStats?: boolean;
}
export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    entryCount: number;
    currentSize: number;
    evictions: number;
}
export declare class AdvancedCache<T = unknown> {
    private cache;
    private config;
    private stats;
    constructor(config?: CacheConfig);
    get(key: string): T | undefined;
    set(key: string, value: T, ttl?: number): void;
    delete(key: string): boolean;
    has(key: string): boolean;
    clear(): void;
    getStats(): CacheStats;
    keys(): string[];
    size(): number;
    prune(): number;
    private shouldEvict;
    private evictOne;
    private findLRU;
    private findLFU;
    private findFIFO;
    private findOldestTTL;
    private estimateSize;
    private updateHitRate;
}
export declare function createAdvancedCache<T = unknown>(config?: CacheConfig): AdvancedCache<T>;
//# sourceMappingURL=index.d.ts.map