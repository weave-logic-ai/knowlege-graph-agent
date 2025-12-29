/**
 * Services Module
 *
 * Provides service management, lifecycle control, and file watching capabilities.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Status of a service
 */
export type ServiceStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

/**
 * Type of service
 */
export type ServiceType = 'watcher' | 'sync' | 'health' | 'cache' | 'background';

/**
 * Service configuration
 */
export interface ServiceConfig {
  /** Service identifier */
  id: string;
  /** Service type */
  type: ServiceType;
  /** Whether service should auto-start */
  autoStart?: boolean;
  /** Restart on failure */
  restartOnFailure?: boolean;
  /** Maximum restart attempts */
  maxRestarts?: number;
  /** Restart delay in milliseconds */
  restartDelay?: number;
}

/**
 * Service state
 */
export interface ServiceState {
  /** Current status */
  status: ServiceStatus;
  /** Start time */
  startedAt?: Date;
  /** Last error */
  lastError?: Error;
  /** Restart count */
  restartCount: number;
}

/**
 * Service metrics
 */
export interface ServiceMetrics {
  /** Total uptime in milliseconds */
  uptime: number;
  /** Number of operations performed */
  operationCount: number;
  /** Number of errors */
  errorCount: number;
  /** Last operation time */
  lastOperationAt?: Date;
}

/**
 * Service handler interface
 */
export interface ServiceHandler {
  /** Start the service */
  start(): Promise<void>;
  /** Stop the service */
  stop(): Promise<void>;
  /** Get service status */
  getStatus(): ServiceStatus;
  /** Get service metrics */
  getMetrics(): ServiceMetrics;
}

// ============================================================================
// Service Manager
// ============================================================================

/**
 * Service Manager for managing multiple services
 */
export class ServiceManager {
  private services: Map<string, ServiceHandler> = new Map();
  private configs: Map<string, ServiceConfig> = new Map();
  private states: Map<string, ServiceState> = new Map();

  /**
   * Register a service
   */
  register(config: ServiceConfig, handler: ServiceHandler): void {
    this.services.set(config.id, handler);
    this.configs.set(config.id, config);
    this.states.set(config.id, {
      status: 'stopped',
      restartCount: 0,
    });
  }

  /**
   * Start a service
   */
  async start(id: string): Promise<void> {
    const handler = this.services.get(id);
    const state = this.states.get(id);
    if (!handler || !state) {
      throw new Error(`Service not found: ${id}`);
    }

    state.status = 'starting';
    try {
      await handler.start();
      state.status = 'running';
      state.startedAt = new Date();
    } catch (error) {
      state.status = 'error';
      state.lastError = error instanceof Error ? error : new Error(String(error));
      throw error;
    }
  }

  /**
   * Stop a service
   */
  async stop(id: string): Promise<void> {
    const handler = this.services.get(id);
    const state = this.states.get(id);
    if (!handler || !state) {
      throw new Error(`Service not found: ${id}`);
    }

    state.status = 'stopping';
    try {
      await handler.stop();
      state.status = 'stopped';
    } catch (error) {
      state.status = 'error';
      state.lastError = error instanceof Error ? error : new Error(String(error));
      throw error;
    }
  }

  /**
   * Start all services
   */
  async startAll(): Promise<void> {
    for (const [id, config] of this.configs) {
      if (config.autoStart !== false) {
        await this.start(id);
      }
    }
  }

  /**
   * Stop all services
   */
  async stopAll(): Promise<void> {
    for (const id of this.services.keys()) {
      const state = this.states.get(id);
      if (state?.status === 'running') {
        await this.stop(id);
      }
    }
  }

  /**
   * Get service state
   */
  getState(id: string): ServiceState | undefined {
    return this.states.get(id);
  }

  /**
   * Get all service states
   */
  getAllStates(): Map<string, ServiceState> {
    return new Map(this.states);
  }

  /**
   * Get service metrics
   */
  getMetrics(id: string): ServiceMetrics | undefined {
    return this.services.get(id)?.getMetrics();
  }
}

/**
 * Create a new ServiceManager instance
 */
export function createServiceManager(): ServiceManager {
  return new ServiceManager();
}

// ============================================================================
// File Watcher Service
// ============================================================================

/**
 * File watcher service for monitoring file changes
 */
export class FileWatcherService implements ServiceHandler {
  private status: ServiceStatus = 'stopped';
  private metrics: ServiceMetrics = {
    uptime: 0,
    operationCount: 0,
    errorCount: 0,
  };
  private startTime?: Date;
  private watcher: unknown = null;

  constructor(
    private watchPaths: string[],
    private onChange?: (path: string, event: string) => void
  ) {}

  async start(): Promise<void> {
    this.status = 'running';
    this.startTime = new Date();
    // File watcher implementation would go here
    // Using chokidar or fs.watch
  }

  async stop(): Promise<void> {
    this.status = 'stopped';
    this.watcher = null;
  }

  getStatus(): ServiceStatus {
    return this.status;
  }

  getMetrics(): ServiceMetrics {
    if (this.startTime && this.status === 'running') {
      this.metrics.uptime = Date.now() - this.startTime.getTime();
    }
    return { ...this.metrics };
  }
}
