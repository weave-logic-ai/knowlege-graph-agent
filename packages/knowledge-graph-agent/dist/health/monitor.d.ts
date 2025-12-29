/**
 * Health Monitor - System health monitoring
 *
 * Provides centralized health monitoring for all system components,
 * with support for automatic checks, alerting, and history tracking.
 *
 * @module health/monitor
 */
import { EventEmitter } from 'events';
import type { SystemHealth, ComponentHealth, HealthCheck, HealthMonitorConfig } from './types.js';
/**
 * Health Monitor
 *
 * Monitors the health of system components and aggregates status.
 *
 * @example
 * ```typescript
 * const monitor = createHealthMonitor({ checkInterval: 30000 });
 *
 * // Register health checks
 * monitor.registerCheck(createMemoryCheck(85));
 * monitor.registerCheck(createDatabaseCheck('/path/to/db'));
 *
 * // Listen for events
 * monitor.on('alert', (alert) => {
 *   console.error(`Health alert: ${alert.message}`);
 * });
 *
 * // Start monitoring
 * monitor.start();
 *
 * // Get current health
 * const health = await monitor.runAllChecks();
 * console.log(`System status: ${health.status}`);
 * ```
 */
export declare class HealthMonitor extends EventEmitter {
    private checks;
    private results;
    private failureCounts;
    private history;
    private timer?;
    private startTime;
    private config;
    private lastStatus;
    private requestCount;
    private errorCount;
    private latencySum;
    private cacheHits;
    private cacheMisses;
    private lastResetTime;
    constructor(config?: Partial<HealthMonitorConfig>);
    /**
     * Register a health check
     */
    registerCheck(check: HealthCheck): void;
    /**
     * Unregister a health check
     */
    unregisterCheck(name: string): void;
    /**
     * Get all registered check names
     */
    getRegisteredChecks(): string[];
    /**
     * Run a specific health check by name
     */
    runCheck(name: string): Promise<ComponentHealth>;
    /**
     * Run all registered health checks
     */
    runAllChecks(): Promise<SystemHealth>;
    /**
     * Get current system health without running checks
     */
    getSystemHealth(): SystemHealth;
    /**
     * Get the last known health for a component
     */
    getComponentHealth(name: string): ComponentHealth | undefined;
    /**
     * Calculate overall system status from component statuses
     */
    private calculateOverallStatus;
    /**
     * Get current memory metrics
     */
    private getMemoryMetrics;
    /**
     * Get current performance metrics
     */
    private getPerformanceMetrics;
    /**
     * Record a request for performance tracking
     */
    recordRequest(latency: number, error?: boolean): void;
    /**
     * Record a cache access for performance tracking
     */
    recordCacheAccess(hit: boolean): void;
    /**
     * Reset performance metrics
     */
    resetPerformanceMetrics(): void;
    /**
     * Trigger a health alert
     */
    private triggerAlert;
    /**
     * Add health snapshot to history
     */
    private addToHistory;
    /**
     * Get health history
     */
    getHistory(limit?: number): SystemHealth[];
    /**
     * Get failure count for a component
     */
    getFailureCount(name: string): number;
    /**
     * Start automatic health monitoring
     */
    start(): void;
    /**
     * Stop automatic health monitoring
     */
    stop(): void;
    /**
     * Check if monitor is running
     */
    isRunning(): boolean;
    /**
     * Get monitor uptime in milliseconds
     */
    getUptime(): number;
    /**
     * Get current configuration
     */
    getConfig(): HealthMonitorConfig;
}
/**
 * Create a new health monitor instance
 */
export declare function createHealthMonitor(config?: Partial<HealthMonitorConfig>): HealthMonitor;
//# sourceMappingURL=monitor.d.ts.map