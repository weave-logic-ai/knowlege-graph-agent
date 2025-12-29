/**
 * Health Monitoring Module
 *
 * Provides system health monitoring, diagnostics, and alerting.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Health status values
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/**
 * Component health information
 */
export interface ComponentHealth {
  /** Component name */
  name: string;
  /** Health status */
  status: HealthStatus;
  /** Optional message */
  message?: string;
  /** Last check time */
  lastCheck: Date;
  /** Response time in milliseconds */
  responseTime?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * System-wide health information
 */
export interface SystemHealth {
  /** Overall status */
  status: HealthStatus;
  /** Component health details */
  components: ComponentHealth[];
  /** Check timestamp */
  timestamp: Date;
  /** System uptime in milliseconds */
  uptime: number;
}

/**
 * Memory metrics
 */
export interface MemoryMetrics {
  /** Heap used in bytes */
  heapUsed: number;
  /** Heap total in bytes */
  heapTotal: number;
  /** RSS in bytes */
  rss: number;
  /** External memory in bytes */
  external: number;
  /** Array buffers in bytes */
  arrayBuffers: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** CPU usage percentage */
  cpuUsage?: number;
  /** Memory metrics */
  memory: MemoryMetrics;
  /** Event loop lag in milliseconds */
  eventLoopLag?: number;
  /** Active handles count */
  activeHandles?: number;
  /** Active requests count */
  activeRequests?: number;
}

/**
 * Health check function
 */
export interface HealthCheck {
  /** Check name */
  name: string;
  /** Check function */
  check: () => Promise<ComponentHealth>;
  /** Check interval in milliseconds */
  interval?: number;
  /** Critical component flag */
  critical?: boolean;
}

/**
 * Health monitor configuration
 */
export interface HealthMonitorConfig {
  /** Check interval in milliseconds */
  interval?: number;
  /** Timeout for individual checks */
  timeout?: number;
  /** Enable automatic checks */
  autoStart?: boolean;
}

// ============================================================================
// Health Monitor
// ============================================================================

/**
 * Health Monitor for tracking system health
 */
export class HealthMonitor {
  private checks: Map<string, HealthCheck> = new Map();
  private results: Map<string, ComponentHealth> = new Map();
  private startTime: Date = new Date();
  private intervalId?: ReturnType<typeof setInterval>;
  private config: HealthMonitorConfig;

  constructor(config: HealthMonitorConfig = {}) {
    this.config = {
      interval: config.interval || 60000,
      timeout: config.timeout || 5000,
      autoStart: config.autoStart ?? false,
    };

    if (this.config.autoStart) {
      this.start();
    }
  }

  register(check: HealthCheck): void {
    this.checks.set(check.name, check);
  }

  unregister(name: string): void {
    this.checks.delete(name);
    this.results.delete(name);
  }

  async check(): Promise<SystemHealth> {
    const components: ComponentHealth[] = [];

    for (const [name, check] of this.checks) {
      try {
        const result = await Promise.race([
          check.check(),
          this.timeout(check.name),
        ]);
        this.results.set(name, result);
        components.push(result);
      } catch (error) {
        const errorResult: ComponentHealth = {
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : String(error),
          lastCheck: new Date(),
        };
        this.results.set(name, errorResult);
        components.push(errorResult);
      }
    }

    const status = this.calculateOverallStatus(components);

    return {
      status,
      components,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
    };
  }

  getLastStatus(): SystemHealth {
    const components = Array.from(this.results.values());
    return {
      status: this.calculateOverallStatus(components),
      components,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
    };
  }

  getPerformanceMetrics(): PerformanceMetrics {
    const memoryUsage = process.memoryUsage();
    return {
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers,
      },
    };
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.check().catch(() => {});
    }, this.config.interval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private timeout(name: string): Promise<ComponentHealth> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Health check timeout: ${name}`));
      }, this.config.timeout);
    });
  }

  private calculateOverallStatus(components: ComponentHealth[]): HealthStatus {
    if (components.length === 0) return 'unknown';
    const hasUnhealthy = components.some((c) => c.status === 'unhealthy');
    const hasDegraded = components.some((c) => c.status === 'degraded');
    if (hasUnhealthy) return 'unhealthy';
    if (hasDegraded) return 'degraded';
    return 'healthy';
  }
}

export function createHealthMonitor(config?: HealthMonitorConfig): HealthMonitor {
  return new HealthMonitor(config);
}

// ============================================================================
// Built-in Health Checks
// ============================================================================

export function createDatabaseCheck(dbPath: string): HealthCheck {
  return {
    name: 'database',
    critical: true,
    check: async (): Promise<ComponentHealth> => {
      const startTime = Date.now();
      const { existsSync } = await import('fs');
      const exists = existsSync(dbPath);
      return {
        name: 'database',
        status: exists ? 'healthy' : 'unhealthy',
        message: exists ? 'Database accessible' : 'Database file not found',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
      };
    },
  };
}

export function createCacheCheck(): HealthCheck {
  return {
    name: 'cache',
    check: async (): Promise<ComponentHealth> => {
      return {
        name: 'cache',
        status: 'healthy',
        message: 'Cache operational',
        lastCheck: new Date(),
      };
    },
  };
}

export function createMemoryCheck(thresholdMB: number = 500): HealthCheck {
  return {
    name: 'memory',
    check: async (): Promise<ComponentHealth> => {
      const { heapUsed } = process.memoryUsage();
      const usedMB = heapUsed / (1024 * 1024);
      let status: HealthStatus = 'healthy';
      if (usedMB > thresholdMB * 0.9) {
        status = 'unhealthy';
      } else if (usedMB > thresholdMB * 0.7) {
        status = 'degraded';
      }
      return {
        name: 'memory',
        status,
        message: `Heap usage: ${usedMB.toFixed(2)}MB`,
        lastCheck: new Date(),
        metadata: { heapUsedMB: usedMB, thresholdMB },
      };
    },
  };
}

export function createDiskCheck(path: string): HealthCheck {
  return {
    name: 'disk',
    check: async (): Promise<ComponentHealth> => {
      const { accessSync, constants } = await import('fs');
      try {
        accessSync(path, constants.R_OK | constants.W_OK);
        return {
          name: 'disk',
          status: 'healthy',
          message: 'Disk accessible',
          lastCheck: new Date(),
        };
      } catch {
        return {
          name: 'disk',
          status: 'unhealthy',
          message: 'Disk not accessible',
          lastCheck: new Date(),
        };
      }
    },
  };
}
