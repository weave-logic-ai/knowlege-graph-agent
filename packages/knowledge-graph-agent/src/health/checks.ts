/**
 * Built-in Health Checks
 *
 * Provides pre-built health checks for common components.
 *
 * @module health/checks
 */

import { existsSync, statSync } from 'fs';
import type { ComponentHealth, HealthCheck } from './types.js';

/**
 * Create a health check for database file existence and size
 *
 * @param dbPath - Path to the database file
 * @returns Health check for database
 *
 * @example
 * ```typescript
 * const check = createDatabaseCheck('/path/to/graph.db');
 * monitor.registerCheck(check);
 * ```
 */
export function createDatabaseCheck(dbPath: string): HealthCheck {
  return {
    name: 'database',
    critical: true,
    interval: 30000,
    check: async (): Promise<ComponentHealth> => {
      try {
        const exists = existsSync(dbPath);

        if (!exists) {
          return {
            name: 'database',
            status: 'unhealthy',
            message: `Database file not found: ${dbPath}`,
            lastCheck: new Date(),
          };
        }

        const stats = statSync(dbPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        return {
          name: 'database',
          status: 'healthy',
          message: `Database accessible, size: ${sizeMB} MB`,
          lastCheck: new Date(),
          metrics: {
            size: stats.size,
            sizeKB: stats.size / 1024,
            mtime: stats.mtimeMs,
          },
        };
      } catch (error) {
        return {
          name: 'database',
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Failed to check database',
          lastCheck: new Date(),
        };
      }
    },
  };
}

/**
 * Cache interface for health check
 */
interface CacheWithStats {
  getStats: () => {
    totalEntries: number;
    hitRate: number;
    hitCount?: number;
    missCount?: number;
    sizeBytes?: number;
  };
}

/**
 * Create a health check for cache status
 *
 * @param cache - Cache instance with getStats method
 * @returns Health check for cache
 *
 * @example
 * ```typescript
 * const cache = new ShadowCache({ projectRoot: '/project' });
 * const check = createCacheCheck(cache);
 * monitor.registerCheck(check);
 * ```
 */
export function createCacheCheck(cache: CacheWithStats | null | undefined): HealthCheck {
  return {
    name: 'cache',
    critical: false,
    interval: 60000,
    check: async (): Promise<ComponentHealth> => {
      if (!cache) {
        return {
          name: 'cache',
          status: 'unknown',
          message: 'Cache not initialized',
          lastCheck: new Date(),
        };
      }

      try {
        const stats = cache.getStats();
        const hitRatePercent = (stats.hitRate * 100).toFixed(1);

        // Consider cache degraded if hit rate is very low with significant requests
        const totalRequests = (stats.hitCount || 0) + (stats.missCount || 0);
        const isDegraded = totalRequests > 100 && stats.hitRate < 0.3;

        return {
          name: 'cache',
          status: isDegraded ? 'degraded' : 'healthy',
          message: `Entries: ${stats.totalEntries}, Hit rate: ${hitRatePercent}%`,
          lastCheck: new Date(),
          metrics: {
            entries: stats.totalEntries,
            hitRate: stats.hitRate,
            hitCount: stats.hitCount || 0,
            missCount: stats.missCount || 0,
            sizeBytes: stats.sizeBytes || 0,
          },
        };
      } catch (error) {
        return {
          name: 'cache',
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Failed to get cache stats',
          lastCheck: new Date(),
        };
      }
    },
  };
}

/**
 * Create a health check for memory usage
 *
 * @param thresholdPercent - Heap usage percentage threshold (default: 90)
 * @param warningThreshold - Heap usage percentage for degraded status (default: 75)
 * @returns Health check for memory
 *
 * @example
 * ```typescript
 * const check = createMemoryCheck(85, 70);
 * monitor.registerCheck(check);
 * ```
 */
export function createMemoryCheck(
  thresholdPercent = 90,
  warningThreshold = 75
): HealthCheck {
  return {
    name: 'memory',
    critical: true,
    interval: 30000,
    check: async (): Promise<ComponentHealth> => {
      const mem = process.memoryUsage();
      const usagePercent = (mem.heapUsed / mem.heapTotal) * 100;

      let status: ComponentHealth['status'] = 'healthy';
      let message = `Heap usage: ${usagePercent.toFixed(1)}%`;

      if (usagePercent > thresholdPercent) {
        status = 'unhealthy';
        message = `Memory critical: ${usagePercent.toFixed(1)}% (threshold: ${thresholdPercent}%)`;
      } else if (usagePercent > warningThreshold) {
        status = 'degraded';
        message = `Memory warning: ${usagePercent.toFixed(1)}% (warning: ${warningThreshold}%)`;
      }

      return {
        name: 'memory',
        status,
        message,
        lastCheck: new Date(),
        metrics: {
          heapUsed: mem.heapUsed,
          heapTotal: mem.heapTotal,
          external: mem.external,
          rss: mem.rss,
          usagePercent,
          heapUsedMB: mem.heapUsed / (1024 * 1024),
          heapTotalMB: mem.heapTotal / (1024 * 1024),
          rssMB: mem.rss / (1024 * 1024),
        },
      };
    },
  };
}

/**
 * Create a health check for disk/path accessibility
 *
 * @param path - Path to check
 * @param name - Optional name for the check (default: 'disk')
 * @returns Health check for disk
 *
 * @example
 * ```typescript
 * const check = createDiskCheck('/data/storage', 'data-storage');
 * monitor.registerCheck(check);
 * ```
 */
export function createDiskCheck(path: string, name = 'disk'): HealthCheck {
  return {
    name,
    critical: false,
    interval: 300000, // 5 minutes
    check: async (): Promise<ComponentHealth> => {
      try {
        const exists = existsSync(path);

        if (!exists) {
          return {
            name,
            status: 'degraded',
            message: `Path not accessible: ${path}`,
            lastCheck: new Date(),
          };
        }

        const stats = statSync(path);

        return {
          name,
          status: 'healthy',
          message: `Path accessible: ${path}`,
          lastCheck: new Date(),
          metrics: {
            isDirectory: stats.isDirectory() ? 1 : 0,
            isFile: stats.isFile() ? 1 : 0,
            size: stats.size,
            mtime: stats.mtimeMs,
          },
        };
      } catch (error) {
        return {
          name,
          status: 'degraded',
          message: error instanceof Error ? error.message : 'Path check failed',
          lastCheck: new Date(),
        };
      }
    },
  };
}

/**
 * Create a health check for event loop lag
 *
 * @param warningMs - Lag threshold for degraded status (default: 100ms)
 * @param criticalMs - Lag threshold for unhealthy status (default: 500ms)
 * @returns Health check for event loop
 *
 * @example
 * ```typescript
 * const check = createEventLoopCheck(50, 200);
 * monitor.registerCheck(check);
 * ```
 */
export function createEventLoopCheck(warningMs = 100, criticalMs = 500): HealthCheck {
  return {
    name: 'event-loop',
    critical: false,
    interval: 10000, // Check every 10 seconds
    check: async (): Promise<ComponentHealth> => {
      return new Promise((resolve) => {
        const start = Date.now();

        setImmediate(() => {
          const lag = Date.now() - start;
          let status: ComponentHealth['status'] = 'healthy';
          let message = `Event loop lag: ${lag}ms`;

          if (lag > criticalMs) {
            status = 'unhealthy';
            message = `Event loop blocked: ${lag}ms (critical: ${criticalMs}ms)`;
          } else if (lag > warningMs) {
            status = 'degraded';
            message = `Event loop slow: ${lag}ms (warning: ${warningMs}ms)`;
          }

          resolve({
            name: 'event-loop',
            status,
            message,
            lastCheck: new Date(),
            metrics: {
              lagMs: lag,
              warningThreshold: warningMs,
              criticalThreshold: criticalMs,
            },
          });
        });
      });
    },
  };
}

/**
 * Create a health check for external service connectivity
 *
 * @param serviceName - Name of the service
 * @param checkFn - Async function that returns true if service is healthy
 * @param timeoutMs - Timeout for the check (default: 5000ms)
 * @returns Health check for external service
 *
 * @example
 * ```typescript
 * const check = createServiceCheck('redis', async () => {
 *   await redis.ping();
 *   return true;
 * });
 * monitor.registerCheck(check);
 * ```
 */
export function createServiceCheck(
  serviceName: string,
  checkFn: () => Promise<boolean>,
  timeoutMs = 5000
): HealthCheck {
  return {
    name: serviceName,
    critical: false,
    interval: 60000,
    check: async (): Promise<ComponentHealth> => {
      const startTime = Date.now();

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Health check timed out')), timeoutMs);
        });

        const result = await Promise.race([checkFn(), timeoutPromise]);
        const duration = Date.now() - startTime;

        if (result) {
          return {
            name: serviceName,
            status: 'healthy',
            message: `Service responding (${duration}ms)`,
            lastCheck: new Date(),
            metrics: {
              responseTime: duration,
            },
          };
        }

        return {
          name: serviceName,
          status: 'unhealthy',
          message: 'Service check returned false',
          lastCheck: new Date(),
          metrics: {
            responseTime: duration,
          },
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        return {
          name: serviceName,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Service check failed',
          lastCheck: new Date(),
          metrics: {
            responseTime: duration,
          },
        };
      }
    },
  };
}

/**
 * Create a custom health check with a provided check function
 *
 * @param name - Check name
 * @param checkFn - Async function that returns ComponentHealth
 * @param options - Additional options
 * @returns Health check
 *
 * @example
 * ```typescript
 * const check = createCustomCheck('my-check', async () => {
 *   const result = await myService.check();
 *   return {
 *     name: 'my-check',
 *     status: result.ok ? 'healthy' : 'unhealthy',
 *     message: result.message,
 *     lastCheck: new Date(),
 *   };
 * }, { critical: true, interval: 15000 });
 * monitor.registerCheck(check);
 * ```
 */
export function createCustomCheck(
  name: string,
  checkFn: () => Promise<ComponentHealth>,
  options: { critical?: boolean; interval?: number } = {}
): HealthCheck {
  return {
    name,
    check: checkFn,
    critical: options.critical ?? false,
    interval: options.interval ?? 60000,
  };
}
