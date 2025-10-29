/**
 * Performance Middleware Integration
 *
 * Integrates all performance optimization features into the MCP server
 * as middleware layers with feature flags for gradual rollout.
 */

import { logger } from '../../utils/logger.js';
import type { ToolHandler, ToolResult } from '../types/index.js';
import { RequestBatcher } from './batching.js';
import { ResponseCache } from './cache.js';
import { CompressionManager } from './compression.js';
import { RetryManager, DEFAULT_RETRY_POLICY } from './retry.js';
import type { RetryPolicy } from './retry.js';

/**
 * Performance middleware configuration
 */
export interface PerformanceMiddlewareConfig {
  batching: {
    enabled: boolean;
    windowMs?: number;
    maxBatchSize?: number;
  };
  caching: {
    enabled: boolean;
    maxSize?: number;
    defaultTTL?: number;
  };
  compression: {
    enabled: boolean;
    minSizeBytes?: number;
    algorithm?: 'gzip' | 'brotli';
  };
  retry: {
    enabled: boolean;
    maxAttempts?: number;
    initialDelayMs?: number;
  };
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  batching: {
    enabled: boolean;
    pendingRequests: number;
    pendingToolTypes: number;
  };
  caching: {
    enabled: boolean;
    hits: number;
    misses: number;
    hitRate: number;
    currentSize: number;
  };
  compression: {
    enabled: boolean;
    compressedRequests: number;
    totalSavings: number;
    avgCompressionRatio: number;
  };
  retry: {
    enabled: boolean;
    config: any;
  };
}

/**
 * Performance Middleware
 *
 * Wraps tool handlers with performance optimizations.
 */
export class PerformanceMiddleware {
  private batcher: RequestBatcher;
  private cache: ResponseCache;
  private compression: CompressionManager;
  private retry: RetryManager;
  private config: PerformanceMiddlewareConfig;

  /**
   * Create performance middleware
   *
   * @param config - Middleware configuration
   */
  constructor(config: Partial<PerformanceMiddlewareConfig> = {}) {
    this.config = {
      batching: {
        enabled: config.batching?.enabled !== false,
        windowMs: config.batching?.windowMs,
        maxBatchSize: config.batching?.maxBatchSize,
      },
      caching: {
        enabled: config.caching?.enabled !== false,
        maxSize: config.caching?.maxSize,
        defaultTTL: config.caching?.defaultTTL,
      },
      compression: {
        enabled: config.compression?.enabled !== false,
        minSizeBytes: config.compression?.minSizeBytes,
        algorithm: config.compression?.algorithm,
      },
      retry: {
        enabled: config.retry?.enabled !== false,
        maxAttempts: config.retry?.maxAttempts,
        initialDelayMs: config.retry?.initialDelayMs,
      },
    };

    // Initialize components
    this.batcher = new RequestBatcher({
      enabled: this.config.batching.enabled,
      windowMs: this.config.batching.windowMs,
      maxBatchSize: this.config.batching.maxBatchSize,
    });

    this.cache = new ResponseCache({
      enabled: this.config.caching.enabled,
      maxSize: this.config.caching.maxSize,
      defaultTTL: this.config.caching.defaultTTL,
    });

    this.compression = new CompressionManager({
      enabled: this.config.compression.enabled,
      minSizeBytes: this.config.compression.minSizeBytes,
      algorithm: this.config.compression.algorithm,
    });

    this.retry = new RetryManager({
      enabled: this.config.retry.enabled,
      maxAttempts: this.config.retry.maxAttempts,
      initialDelayMs: this.config.retry.initialDelayMs,
    });

    logger.info('PerformanceMiddleware initialized', { ...this.config } as Record<string, unknown>);
  }

  /**
   * Wrap a tool handler with performance optimizations
   *
   * @param toolName - Name of the tool
   * @param handler - Original tool handler
   * @param retryPolicy - Custom retry policy (optional)
   * @returns Wrapped handler
   */
  wrap(
    toolName: string,
    handler: ToolHandler,
    retryPolicy: RetryPolicy = DEFAULT_RETRY_POLICY
  ): ToolHandler {
    return async (params: any): Promise<ToolResult> => {
      const startTime = Date.now();

      // 1. Check cache first
      if (this.config.caching.enabled) {
        const cached = this.cache.get(toolName, params);
        if (cached) {
          logger.debug('Cache hit', { toolName, executionTime: `${Date.now() - startTime}ms` });
          return {
            ...cached,
            metadata: {
              ...cached.metadata,
              cacheHit: true,
              executionTime: Date.now() - startTime,
            },
          };
        }
      }

      // 2. Execute with batching and retry
      const executeWithRetry = async (): Promise<ToolResult> => {
        if (this.config.batching.enabled) {
          // Execute with batching
          return this.batcher.batchRequest(toolName, params, handler);
        } else {
          // Execute directly
          return handler(params);
        }
      };

      let result: ToolResult;

      if (this.config.retry.enabled) {
        // Execute with retry
        const retryResult = await this.retry.execute(
          executeWithRetry,
          retryPolicy
        );

        if (!retryResult.success) {
          throw retryResult.error!;
        }

        result = retryResult.result!;

        // Add retry metadata
        if (retryResult.attempts.length > 0) {
          result.metadata = {
            ...result.metadata,
            retryAttempts: retryResult.attempts.length,
            totalRetryTime: retryResult.totalTime,
          };
        }
      } else {
        // Execute without retry
        result = await executeWithRetry();
      }

      // 3. Cache result
      if (this.config.caching.enabled && result.success) {
        this.cache.set(toolName, params, result);
      }

      // 4. Add execution metadata
      result.metadata = {
        ...result.metadata,
        executionTime: Date.now() - startTime,
        cacheHit: false,
      };

      return result;
    };
  }

  /**
   * Compress response data
   *
   * @param data - Data to compress
   * @param acceptedEncodings - Client-accepted encodings
   * @returns Compression result
   */
  async compressResponse(
    data: any,
    acceptedEncodings: string[] = ['brotli', 'gzip']
  ) {
    if (!this.config.compression.enabled) {
      return {
        data,
        algorithm: 'none' as const,
        originalSize: 0,
        compressedSize: 0,
        ratio: 1.0,
      };
    }

    return this.compression.compress(data, acceptedEncodings);
  }

  /**
   * Invalidate cache for tool
   *
   * @param toolName - Tool name (optional)
   * @param params - Tool parameters (optional)
   */
  invalidateCache(toolName?: string, params?: any): void {
    this.cache.invalidate(toolName, params);
  }

  /**
   * Flush all pending batches
   *
   * @param handler - Tool handler for flush
   */
  async flushBatches(handler: ToolHandler): Promise<void> {
    if (this.config.batching.enabled) {
      await this.batcher.flushAll(handler);
    }
  }

  /**
   * Get performance statistics
   *
   * @returns Performance stats
   */
  getStats(): PerformanceStats {
    const batchingStats = this.batcher.getStats();
    const cacheStats = this.cache.getStats();
    const compressionStats = this.compression.getStats();
    const retryConfig = this.retry.getConfig();

    return {
      batching: {
        enabled: batchingStats.enabled,
        pendingRequests: batchingStats.totalPendingRequests,
        pendingToolTypes: batchingStats.pendingToolTypes,
      },
      caching: {
        enabled: this.config.caching.enabled,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRate: cacheStats.hitRate,
        currentSize: cacheStats.currentSize,
      },
      compression: {
        enabled: this.config.compression.enabled,
        compressedRequests: compressionStats.compressedRequests,
        totalSavings:
          compressionStats.totalOriginalBytes - compressionStats.totalCompressedBytes,
        avgCompressionRatio: compressionStats.avgCompressionRatio,
      },
      retry: {
        enabled: this.config.retry.enabled,
        config: retryConfig,
      },
    };
  }

  /**
   * Update configuration
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<PerformanceMiddlewareConfig>): void {
    this.config = {
      batching: { ...this.config.batching, ...config.batching },
      caching: { ...this.config.caching, ...config.caching },
      compression: { ...this.config.compression, ...config.compression },
      retry: { ...this.config.retry, ...config.retry },
    };

    // Update component configs
    if (config.batching) {
      this.batcher.updateConfig({
        enabled: config.batching.enabled,
        windowMs: config.batching.windowMs,
        maxBatchSize: config.batching.maxBatchSize,
      });
    }

    if (config.caching) {
      this.cache.updateConfig({
        enabled: config.caching.enabled,
        maxSize: config.caching.maxSize,
        defaultTTL: config.caching.defaultTTL,
      });
    }

    if (config.compression) {
      this.compression.updateConfig({
        enabled: config.compression.enabled,
        minSizeBytes: config.compression.minSizeBytes,
        algorithm: config.compression.algorithm,
      });
    }

    if (config.retry) {
      this.retry.updateConfig({
        enabled: config.retry.enabled,
        maxAttempts: config.retry.maxAttempts,
        initialDelayMs: config.retry.initialDelayMs,
      });
    }

    logger.info('Performance middleware configuration updated', { ...this.config } as Record<string, unknown>);
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down performance middleware');

    await this.batcher.shutdown();
    this.cache.shutdown();

    logger.info('Performance middleware shutdown complete');
  }
}

/**
 * Create performance middleware instance
 *
 * @param config - Middleware configuration
 * @returns Performance middleware
 */
export function createPerformanceMiddleware(
  config?: Partial<PerformanceMiddlewareConfig>
): PerformanceMiddleware {
  return new PerformanceMiddleware(config);
}
