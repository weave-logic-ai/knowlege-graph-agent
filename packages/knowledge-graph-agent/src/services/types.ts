/**
 * Service Manager Types
 *
 * Defines types for background service management including
 * configuration, state, metrics, and handlers.
 *
 * @module services/types
 */

/**
 * Current operational status of a service.
 */
export type ServiceStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'failed';

/**
 * Classification of service functionality.
 */
export type ServiceType = 'watcher' | 'scheduler' | 'sync' | 'analyzer' | 'server';

/**
 * Configuration options for registering a service.
 */
export interface ServiceConfig {
  /** Unique identifier for the service */
  id: string;
  /** Human-readable name */
  name: string;
  /** Type of service for categorization */
  type: ServiceType;
  /** Whether to start automatically on registration */
  autoStart?: boolean;
  /** Whether to restart on failure */
  restartOnFailure?: boolean;
  /** Maximum number of restart attempts */
  maxRestarts?: number;
  /** Delay in milliseconds between restart attempts */
  restartDelay?: number;
  /** Interval in milliseconds for health checks */
  healthCheckInterval?: number;
}

/**
 * Runtime state of a registered service.
 */
export interface ServiceState {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Service type */
  type: ServiceType;
  /** Current operational status */
  status: ServiceStatus;
  /** Process ID if applicable */
  pid?: number;
  /** When the service was started */
  startTime?: Date;
  /** Number of times the service has been restarted */
  restarts: number;
  /** Last error message if status is 'failed' */
  lastError?: string;
  /** Performance and health metrics */
  metrics: ServiceMetrics;
}

/**
 * Performance and health metrics for a service.
 */
export interface ServiceMetrics {
  /** Total uptime in milliseconds */
  uptime: number;
  /** Number of requests/events processed */
  requests: number;
  /** Number of errors encountered */
  errors: number;
  /** Last health check timestamp */
  lastHealthCheck?: Date;
  /** Current health status */
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}

/**
 * Interface that service implementations must fulfill.
 */
export interface ServiceHandler {
  /** Start the service */
  start(): Promise<void>;
  /** Stop the service gracefully */
  stop(): Promise<void>;
  /** Check if the service is healthy */
  healthCheck(): Promise<boolean>;
  /** Get current metrics */
  getMetrics(): ServiceMetrics;
}

/**
 * Event types emitted by the service manager.
 */
export interface ServiceManagerEvents {
  registered: ServiceState;
  starting: ServiceState;
  started: ServiceState;
  stopping: ServiceState;
  stopped: ServiceState;
  failed: ServiceState;
  restarted: ServiceState;
  healthCheck: { id: string; healthy: boolean };
  shutdown: void;
}
