/**
 * Health Monitoring Types
 *
 * Type definitions for the health monitoring system.
 *
 * @module health/types
 */

/**
 * Health status levels for components and systems
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/**
 * Health information for a single component
 */
export interface ComponentHealth {
  /** Component name/identifier */
  name: string;
  /** Current health status */
  status: HealthStatus;
  /** Optional status message */
  message?: string;
  /** Timestamp of last health check */
  lastCheck: Date;
  /** Optional component-specific metrics */
  metrics?: Record<string, number>;
}

/**
 * Overall system health information
 */
export interface SystemHealth {
  /** Aggregate health status */
  status: HealthStatus;
  /** Health status of individual components */
  components: ComponentHealth[];
  /** Timestamp of this health snapshot */
  timestamp: Date;
  /** System uptime in milliseconds */
  uptime: number;
  /** Memory usage metrics */
  memory: MemoryMetrics;
  /** Performance metrics */
  performance: PerformanceMetrics;
}

/**
 * Memory usage metrics from Node.js process
 */
export interface MemoryMetrics {
  /** Heap memory used in bytes */
  heapUsed: number;
  /** Total heap memory allocated in bytes */
  heapTotal: number;
  /** Memory used by C++ objects bound to JS in bytes */
  external: number;
  /** Resident Set Size in bytes */
  rss: number;
  /** Percentage of heap used (heapUsed / heapTotal * 100) */
  usagePercent: number;
}

/**
 * Performance metrics for request handling
 */
export interface PerformanceMetrics {
  /** Number of requests processed per minute */
  requestsPerMinute: number;
  /** Average request latency in milliseconds */
  averageLatency: number;
  /** Percentage of requests that resulted in errors */
  errorRate: number;
  /** Cache hit rate as a percentage */
  cacheHitRate: number;
}

/**
 * Health check definition
 */
export interface HealthCheck {
  /** Unique name for this health check */
  name: string;
  /** Function that performs the health check */
  check: () => Promise<ComponentHealth>;
  /** Interval between automatic checks in milliseconds */
  interval: number;
  /** Whether this check is critical for overall system health */
  critical?: boolean;
}

/**
 * Configuration for the health monitor
 */
export interface HealthMonitorConfig {
  /** Interval between automatic health checks in milliseconds */
  checkInterval: number;
  /** Maximum number of health history entries to retain */
  historySize: number;
  /** Number of consecutive failures before alerting */
  alertThreshold: number;
}

/**
 * Health check result with timing information
 */
export interface HealthCheckResult {
  /** The component health result */
  health: ComponentHealth;
  /** Duration of the check in milliseconds */
  duration: number;
  /** Whether the check timed out */
  timedOut: boolean;
}

/**
 * Alert triggered by health monitor
 */
export interface HealthAlert {
  /** Component that triggered the alert */
  component: string;
  /** Alert severity level */
  severity: 'warning' | 'critical';
  /** Alert message */
  message: string;
  /** Timestamp when alert was triggered */
  timestamp: Date;
  /** Number of consecutive failures */
  failureCount: number;
}

/**
 * Health monitor events
 */
export interface HealthMonitorEvents {
  /** Emitted when a health check completes */
  checkComplete: (result: ComponentHealth) => void;
  /** Emitted when a health check fails */
  checkFailed: (result: ComponentHealth) => void;
  /** Emitted when system health status changes */
  statusChange: (oldStatus: HealthStatus, newStatus: HealthStatus) => void;
  /** Emitted when an alert is triggered */
  alert: (alert: HealthAlert) => void;
}
