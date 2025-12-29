/**
 * Health Monitor - System health monitoring
 *
 * Provides centralized health monitoring for all system components,
 * with support for automatic checks, alerting, and history tracking.
 *
 * @module health/monitor
 */

import { EventEmitter } from 'events';
import { createLogger } from '../utils/index.js';
import type {
  SystemHealth,
  ComponentHealth,
  HealthStatus,
  HealthCheck,
  HealthMonitorConfig,
  MemoryMetrics,
  PerformanceMetrics,
  HealthAlert,
} from './types.js';

const logger = createLogger('health-monitor');

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: HealthMonitorConfig = {
  checkInterval: 60000, // 1 minute
  historySize: 100,
  alertThreshold: 3,
};

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
export class HealthMonitor extends EventEmitter {
  private checks: Map<string, HealthCheck> = new Map();
  private results: Map<string, ComponentHealth> = new Map();
  private failureCounts: Map<string, number> = new Map();
  private history: SystemHealth[] = [];
  private timer?: ReturnType<typeof setInterval>;
  private startTime: Date;
  private config: HealthMonitorConfig;
  private lastStatus: HealthStatus = 'unknown';

  // Performance tracking
  private requestCount = 0;
  private errorCount = 0;
  private latencySum = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private lastResetTime: number;

  constructor(config?: Partial<HealthMonitorConfig>) {
    super();
    this.startTime = new Date();
    this.lastResetTime = Date.now();
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Register a health check
   */
  registerCheck(check: HealthCheck): void {
    this.checks.set(check.name, check);
    this.failureCounts.set(check.name, 0);
    logger.debug(`Health check registered: ${check.name}`, {
      critical: check.critical,
      interval: check.interval,
    });
  }

  /**
   * Unregister a health check
   */
  unregisterCheck(name: string): void {
    this.checks.delete(name);
    this.results.delete(name);
    this.failureCounts.delete(name);
    logger.debug(`Health check unregistered: ${name}`);
  }

  /**
   * Get all registered check names
   */
  getRegisteredChecks(): string[] {
    return Array.from(this.checks.keys());
  }

  /**
   * Run a specific health check by name
   */
  async runCheck(name: string): Promise<ComponentHealth> {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Health check '${name}' not found`);
    }

    const startTime = Date.now();

    try {
      const result = await check.check();
      const duration = Date.now() - startTime;

      this.results.set(name, result);

      if (result.status === 'healthy') {
        // Reset failure count on success
        this.failureCounts.set(name, 0);
      } else {
        // Increment failure count
        const failures = (this.failureCounts.get(name) || 0) + 1;
        this.failureCounts.set(name, failures);

        // Check if alert threshold reached
        if (failures >= this.config.alertThreshold) {
          this.triggerAlert(name, result, failures);
        }
      }

      this.emit('checkComplete', result);
      logger.debug(`Health check completed: ${name}`, {
        status: result.status,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      const result: ComponentHealth = {
        name,
        status: 'unhealthy',
        message: `Check failed: ${errorMessage}`,
        lastCheck: new Date(),
      };

      this.results.set(name, result);

      // Increment failure count
      const failures = (this.failureCounts.get(name) || 0) + 1;
      this.failureCounts.set(name, failures);

      // Check if alert threshold reached
      if (failures >= this.config.alertThreshold) {
        this.triggerAlert(name, result, failures);
      }

      this.emit('checkFailed', result);
      logger.error(`Health check failed: ${name}`, undefined, {
        errorMessage,
        duration,
        failures,
      });

      return result;
    }
  }

  /**
   * Run all registered health checks
   */
  async runAllChecks(): Promise<SystemHealth> {
    const checkNames = Array.from(this.checks.keys());
    const promises = checkNames.map((name) => this.runCheck(name));

    await Promise.allSettled(promises);

    return this.getSystemHealth();
  }

  /**
   * Get current system health without running checks
   */
  getSystemHealth(): SystemHealth {
    const components = Array.from(this.results.values());
    const newStatus = this.calculateOverallStatus(components);

    // Emit status change event if status changed
    if (newStatus !== this.lastStatus) {
      this.emit('statusChange', this.lastStatus, newStatus);
      logger.info(`System health status changed`, {
        from: this.lastStatus,
        to: newStatus,
      });
      this.lastStatus = newStatus;
    }

    const health: SystemHealth = {
      status: newStatus,
      components,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      memory: this.getMemoryMetrics(),
      performance: this.getPerformanceMetrics(),
    };

    this.addToHistory(health);
    return health;
  }

  /**
   * Get the last known health for a component
   */
  getComponentHealth(name: string): ComponentHealth | undefined {
    return this.results.get(name);
  }

  /**
   * Calculate overall system status from component statuses
   */
  private calculateOverallStatus(components: ComponentHealth[]): HealthStatus {
    if (components.length === 0) {
      return 'unknown';
    }

    // Check for critical component failures
    const criticalFailures = components.filter((c) => {
      const check = this.checks.get(c.name);
      return check?.critical && c.status === 'unhealthy';
    });

    if (criticalFailures.length > 0) {
      return 'unhealthy';
    }

    // Count unhealthy and degraded components
    const unhealthyCount = components.filter((c) => c.status === 'unhealthy').length;
    const degradedCount = components.filter((c) => c.status === 'degraded').length;
    const unknownCount = components.filter((c) => c.status === 'unknown').length;

    // Any unhealthy component makes system degraded
    if (unhealthyCount > 0) {
      return 'degraded';
    }

    // More than half degraded makes system degraded
    if (degradedCount > components.length / 2) {
      return 'degraded';
    }

    // All unknown is unknown
    if (unknownCount === components.length) {
      return 'unknown';
    }

    return 'healthy';
  }

  /**
   * Get current memory metrics
   */
  private getMemoryMetrics(): MemoryMetrics {
    const mem = process.memoryUsage();
    return {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      rss: mem.rss,
      usagePercent: (mem.heapUsed / mem.heapTotal) * 100,
    };
  }

  /**
   * Get current performance metrics
   */
  private getPerformanceMetrics(): PerformanceMetrics {
    const totalCacheOps = this.cacheHits + this.cacheMisses;
    const elapsedMinutes = (Date.now() - this.lastResetTime) / 60000;

    return {
      requestsPerMinute: elapsedMinutes > 0 ? this.requestCount / elapsedMinutes : 0,
      averageLatency: this.requestCount > 0 ? this.latencySum / this.requestCount : 0,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
      cacheHitRate: totalCacheOps > 0 ? (this.cacheHits / totalCacheOps) * 100 : 0,
    };
  }

  /**
   * Record a request for performance tracking
   */
  recordRequest(latency: number, error = false): void {
    this.requestCount++;
    this.latencySum += latency;
    if (error) {
      this.errorCount++;
    }
  }

  /**
   * Record a cache access for performance tracking
   */
  recordCacheAccess(hit: boolean): void {
    if (hit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
  }

  /**
   * Reset performance metrics
   */
  resetPerformanceMetrics(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.latencySum = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.lastResetTime = Date.now();
    logger.debug('Performance metrics reset');
  }

  /**
   * Trigger a health alert
   */
  private triggerAlert(name: string, health: ComponentHealth, failures: number): void {
    const check = this.checks.get(name);
    const alert: HealthAlert = {
      component: name,
      severity: check?.critical ? 'critical' : 'warning',
      message: health.message || `Component ${name} is ${health.status}`,
      timestamp: new Date(),
      failureCount: failures,
    };

    this.emit('alert', alert);
    logger.warn(`Health alert triggered`, {
      component: name,
      severity: alert.severity,
      failures,
    });
  }

  /**
   * Add health snapshot to history
   */
  private addToHistory(health: SystemHealth): void {
    this.history.push(health);

    // Trim history if needed
    if (this.history.length > this.config.historySize) {
      this.history.shift();
    }
  }

  /**
   * Get health history
   */
  getHistory(limit?: number): SystemHealth[] {
    const slice = limit ? this.history.slice(-limit) : this.history;
    return [...slice];
  }

  /**
   * Get failure count for a component
   */
  getFailureCount(name: string): number {
    return this.failureCounts.get(name) || 0;
  }

  /**
   * Start automatic health monitoring
   */
  start(): void {
    if (this.timer) {
      logger.warn('Health monitor already running');
      return;
    }

    // Run initial check
    this.runAllChecks().catch((err) => {
      logger.error('Initial health check failed', err instanceof Error ? err : undefined);
    });

    // Start periodic checks
    this.timer = setInterval(() => {
      this.runAllChecks().catch((err) => {
        logger.error('Periodic health check failed', err instanceof Error ? err : undefined);
      });
    }, this.config.checkInterval);

    logger.info('Health monitor started', {
      interval: this.config.checkInterval,
      checks: this.checks.size,
    });
  }

  /**
   * Stop automatic health monitoring
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
      logger.info('Health monitor stopped');
    }
  }

  /**
   * Check if monitor is running
   */
  isRunning(): boolean {
    return !!this.timer;
  }

  /**
   * Get monitor uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }

  /**
   * Get current configuration
   */
  getConfig(): HealthMonitorConfig {
    return { ...this.config };
  }
}

/**
 * Create a new health monitor instance
 */
export function createHealthMonitor(config?: Partial<HealthMonitorConfig>): HealthMonitor {
  return new HealthMonitor(config);
}
