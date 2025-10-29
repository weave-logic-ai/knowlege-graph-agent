/**
 * Response Caching Layer
 *
 * Provides LRU caching for MCP responses with TTL support.
 * Only caches idempotent operations to ensure correctness.
 */

import { logger } from '../../utils/logger.js';
import type { ToolResult } from '../types/index.js';

/**
 * Cache configuration
 */
export interface CacheConfig {
  /**
   * Maximum cache size (default: 1000)
   */
  maxSize: number;

  /**
   * Default TTL in milliseconds (default: 5 minutes)
   */
  defaultTTL: number;

  /**
   * Enable/disable caching
   */
  enabled: boolean;
}

/**
 * Cache entry
 */
interface CacheEntry {
  key: string;
  value: ToolResult;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  currentSize: number;
  maxSize: number;
  hitRate: number;
  avgEntrySize: number;
  totalMemoryBytes: number;
}

/**
 * Response Cache Manager
 *
 * LRU cache implementation with TTL support for MCP responses.
 */
export class ResponseCache {
  private config: CacheConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  /**
   * Idempotent operations that can be cached
   */
  private readonly CACHEABLE_OPERATIONS = new Set([
    'get-file',
    'get-file-content',
    'query-files',
    'search-tags',
    'search-links',
    'get-stats',
    'list-workflows',
    'get-workflow-status',
  ]);

  /**
   * Create a new response cache
   *
   * @param config - Cache configuration
   */
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      defaultTTL: config.defaultTTL || 5 * 60 * 1000, // 5 minutes
      enabled: config.enabled !== false,
    };

    logger.debug('ResponseCache initialized', { ...this.config } as Record<string, unknown>);

    // Start TTL cleanup interval
    this.startTTLCleanup();
  }

  /**
   * Get cached response
   *
   * @param toolName - Tool name
   * @param params - Tool parameters
   * @returns Cached result or null
   */
  get(toolName: string, params: any): ToolResult | null {
    if (!this.config.enabled || !this.isCacheable(toolName)) {
      return null;
    }

    const key = this.generateKey(toolName, params);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access (LRU)
    entry.hits++;
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.stats.hits++;

    logger.debug('Cache hit', {
      toolName,
      key,
      hits: entry.hits,
      age: Date.now() - entry.timestamp,
    });

    return entry.value;
  }

  /**
   * Set cached response
   *
   * @param toolName - Tool name
   * @param params - Tool parameters
   * @param result - Tool result
   * @param ttl - Custom TTL in milliseconds (optional)
   */
  set(
    toolName: string,
    params: any,
    result: ToolResult,
    ttl?: number
  ): void {
    if (!this.config.enabled || !this.isCacheable(toolName)) {
      return;
    }

    const key = this.generateKey(toolName, params);
    const size = this.estimateSize(result);

    const entry: CacheEntry = {
      key,
      value: result,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      hits: 0,
      size,
    };

    // Check if we need to evict
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    this.cache.set(key, entry);

    logger.debug('Cache set', {
      toolName,
      key,
      size,
      ttl: entry.ttl,
    });
  }

  /**
   * Invalidate cache for a specific tool or all cache
   *
   * @param toolName - Tool name (optional, invalidates all if not provided)
   * @param params - Tool parameters (optional)
   */
  invalidate(toolName?: string, params?: any): void {
    if (!toolName) {
      // Invalidate all
      const count = this.cache.size;
      this.cache.clear();
      logger.info('Cache cleared', { entriesRemoved: count });
      return;
    }

    if (params) {
      // Invalidate specific entry
      const key = this.generateKey(toolName, params);
      this.cache.delete(key);
      logger.debug('Cache entry invalidated', { toolName, key });
    } else {
      // Invalidate all entries for this tool
      let count = 0;
      for (const [key, entry] of this.cache.entries()) {
        if (key.startsWith(`${toolName}:`)) {
          this.cache.delete(key);
          count++;
        }
      }
      logger.debug('Cache invalidated for tool', { toolName, entriesRemoved: count });
    }
  }

  /**
   * Check if operation is cacheable
   *
   * @param toolName - Tool name
   * @returns True if cacheable
   */
  private isCacheable(toolName: string): boolean {
    return this.CACHEABLE_OPERATIONS.has(toolName);
  }

  /**
   * Generate cache key from tool name and parameters
   *
   * @param toolName - Tool name
   * @param params - Tool parameters
   * @returns Cache key
   */
  private generateKey(toolName: string, params: any): string {
    const paramsStr = JSON.stringify(params || {}, Object.keys(params || {}).sort());
    return `${toolName}:${paramsStr}`;
  }

  /**
   * Check if cache entry has expired
   *
   * @param entry - Cache entry
   * @returns True if expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Evict oldest (least recently used) entry
   */
  private evictOldest(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
      this.stats.evictions++;
      logger.debug('Cache entry evicted', { key: firstKey });
    }
  }

  /**
   * Estimate size of a cache entry in bytes
   *
   * @param result - Tool result
   * @returns Estimated size in bytes
   */
  private estimateSize(result: ToolResult): number {
    try {
      return JSON.stringify(result).length;
    } catch {
      return 1024; // Default estimate
    }
  }

  /**
   * Start TTL cleanup interval
   */
  private startTTLCleanup(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Run every minute
  }

  /**
   * Remove expired entries
   */
  private cleanupExpired(): void {
    const before = this.cache.size;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }

    const removed = before - this.cache.size;
    if (removed > 0) {
      logger.debug('Expired cache entries removed', { count: removed });
    }
  }

  /**
   * Get cache statistics
   *
   * @returns Cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }

    const avgEntrySize =
      this.cache.size > 0 ? totalSize / this.cache.size : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      currentSize: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate,
      avgEntrySize,
      totalMemoryBytes: totalSize,
    };
  }

  /**
   * Update cache configuration
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };

    // If max size reduced, evict excess entries
    while (this.cache.size > this.config.maxSize) {
      this.evictOldest();
    }

    logger.info('Cache configuration updated', { ...this.config } as Record<string, unknown>);
  }

  /**
   * Add cacheable operation
   *
   * @param toolName - Tool name to mark as cacheable
   */
  addCacheableOperation(toolName: string): void {
    this.CACHEABLE_OPERATIONS.add(toolName);
    logger.info('Added cacheable operation', { toolName });
  }

  /**
   * Shutdown and cleanup
   */
  shutdown(): void {
    logger.info('Shutting down response cache', {
      finalSize: this.cache.size,
      stats: this.getStats(),
    });

    this.cache.clear();
  }
}
