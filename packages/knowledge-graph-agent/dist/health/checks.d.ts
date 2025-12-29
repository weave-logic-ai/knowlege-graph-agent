/**
 * Built-in Health Checks
 *
 * Provides pre-built health checks for common components.
 *
 * @module health/checks
 */
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
export declare function createDatabaseCheck(dbPath: string): HealthCheck;
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
export declare function createCacheCheck(cache: CacheWithStats | null | undefined): HealthCheck;
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
export declare function createMemoryCheck(thresholdPercent?: number, warningThreshold?: number): HealthCheck;
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
export declare function createDiskCheck(path: string, name?: string): HealthCheck;
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
export declare function createEventLoopCheck(warningMs?: number, criticalMs?: number): HealthCheck;
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
export declare function createServiceCheck(serviceName: string, checkFn: () => Promise<boolean>, timeoutMs?: number): HealthCheck;
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
export declare function createCustomCheck(name: string, checkFn: () => Promise<ComponentHealth>, options?: {
    critical?: boolean;
    interval?: number;
}): HealthCheck;
export {};
//# sourceMappingURL=checks.d.ts.map