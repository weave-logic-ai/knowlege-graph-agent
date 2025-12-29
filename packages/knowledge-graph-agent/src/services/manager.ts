/**
 * Service Manager - Background process management
 *
 * Provides centralized management for background services including:
 * - Service registration and lifecycle management
 * - Health monitoring with configurable intervals
 * - Automatic restart on failure
 * - Graceful shutdown coordination
 *
 * @module services/manager
 */

import { EventEmitter } from 'events';
import { createLogger } from '../utils/index.js';
import type {
  ServiceConfig,
  ServiceState,
  ServiceHandler,
  ServiceMetrics,
} from './types.js';

const logger = createLogger('service-manager');

/**
 * Manages background services with lifecycle control and health monitoring.
 *
 * @example
 * ```typescript
 * const manager = createServiceManager();
 *
 * await manager.register(
 *   { id: 'watcher', name: 'File Watcher', type: 'watcher', autoStart: true },
 *   new FileWatcherService(['/path/to/watch'])
 * );
 *
 * manager.on('started', (state) => console.log(`${state.name} started`));
 *
 * // Graceful shutdown
 * process.on('SIGTERM', () => manager.shutdown());
 * ```
 */
export class ServiceManager extends EventEmitter {
  private services: Map<string, ServiceState> = new Map();
  private handlers: Map<string, ServiceHandler> = new Map();
  private configs: Map<string, ServiceConfig> = new Map();
  private healthCheckTimers: Map<string, NodeJS.Timeout> = new Map();
  private isShuttingDown = false;

  constructor() {
    super();
    logger.info('ServiceManager initialized');
  }

  /**
   * Register a new service with the manager.
   *
   * @param config - Service configuration
   * @param handler - Service implementation
   * @throws Error if service ID is already registered
   */
  async register(config: ServiceConfig, handler: ServiceHandler): Promise<void> {
    if (this.services.has(config.id)) {
      throw new Error(`Service ${config.id} already registered`);
    }

    const state: ServiceState = {
      id: config.id,
      name: config.name,
      type: config.type,
      status: 'stopped',
      restarts: 0,
      metrics: {
        uptime: 0,
        requests: 0,
        errors: 0,
        healthStatus: 'healthy',
      },
    };

    this.services.set(config.id, state);
    this.handlers.set(config.id, handler);
    this.configs.set(config.id, config);

    logger.info(`Service registered: ${config.name}`, {
      id: config.id,
      type: config.type,
      autoStart: config.autoStart,
    });
    this.emit('registered', state);

    if (config.autoStart) {
      await this.start(config.id);
    }

    if (config.healthCheckInterval && config.healthCheckInterval > 0) {
      this.startHealthCheck(config.id, config.healthCheckInterval);
    }
  }

  /**
   * Start a registered service.
   *
   * @param id - Service identifier
   * @throws Error if service is not found
   */
  async start(id: string): Promise<void> {
    const state = this.services.get(id);
    const handler = this.handlers.get(id);

    if (!state || !handler) {
      throw new Error(`Service ${id} not found`);
    }

    if (state.status === 'running' || state.status === 'starting') {
      logger.debug(`Service ${state.name} already ${state.status}`);
      return;
    }

    state.status = 'starting';
    this.emit('starting', state);

    try {
      await handler.start();
      state.status = 'running';
      state.startTime = new Date();
      state.lastError = undefined;
      logger.info(`Service started: ${state.name}`);
      this.emit('started', state);
    } catch (error) {
      state.status = 'failed';
      state.lastError = error instanceof Error ? error.message : String(error);
      state.metrics.errors++;
      logger.error(`Service failed to start: ${state.name}`, undefined, { error: state.lastError });
      this.emit('failed', state);

      // Handle auto-restart
      await this.handleFailure(id);
    }
  }

  /**
   * Stop a running service.
   *
   * @param id - Service identifier
   * @throws Error if service is not found
   */
  async stop(id: string): Promise<void> {
    const state = this.services.get(id);
    const handler = this.handlers.get(id);

    if (!state || !handler) {
      throw new Error(`Service ${id} not found`);
    }

    if (state.status === 'stopped' || state.status === 'stopping') {
      logger.debug(`Service ${state.name} already ${state.status}`);
      return;
    }

    state.status = 'stopping';
    this.emit('stopping', state);

    try {
      await handler.stop();
      state.status = 'stopped';

      // Calculate final uptime
      if (state.startTime) {
        state.metrics.uptime += Date.now() - state.startTime.getTime();
      }

      logger.info(`Service stopped: ${state.name}`);
      this.emit('stopped', state);
    } catch (error) {
      state.status = 'failed';
      state.lastError = error instanceof Error ? error.message : String(error);
      state.metrics.errors++;
      logger.error(`Service failed to stop: ${state.name}`, undefined, { error: state.lastError });
      this.emit('failed', state);
    }
  }

  /**
   * Restart a service.
   *
   * @param id - Service identifier
   * @throws Error if service is not found
   */
  async restart(id: string): Promise<void> {
    const state = this.services.get(id);
    if (!state) {
      throw new Error(`Service ${id} not found`);
    }

    logger.info(`Restarting service: ${state.name}`);
    state.restarts++;

    await this.stop(id);
    await this.start(id);

    this.emit('restarted', state);
  }

  /**
   * Handle service failure with optional auto-restart.
   */
  private async handleFailure(id: string): Promise<void> {
    const state = this.services.get(id);
    const config = this.configs.get(id);

    if (!state || !config) return;

    if (!config.restartOnFailure) return;

    const maxRestarts = config.maxRestarts ?? 3;
    if (state.restarts >= maxRestarts) {
      logger.error(`Service ${state.name} exceeded max restarts (${maxRestarts})`);
      return;
    }

    const delay = config.restartDelay ?? 1000;
    logger.info(`Scheduling restart for ${state.name} in ${delay}ms`);

    await new Promise(resolve => setTimeout(resolve, delay));

    if (!this.isShuttingDown && state.status === 'failed') {
      state.restarts++;
      await this.start(id);
    }
  }

  /**
   * Get the current state of a service.
   *
   * @param id - Service identifier
   * @returns Service state or undefined if not found
   */
  getStatus(id: string): ServiceState | undefined {
    const state = this.services.get(id);
    if (!state) return undefined;

    const handler = this.handlers.get(id);
    if (handler && state.status === 'running') {
      // Update metrics from handler
      const metrics = handler.getMetrics();
      state.metrics = { ...state.metrics, ...metrics };
    }

    return { ...state };
  }

  /**
   * List all registered services.
   *
   * @returns Array of service states
   */
  listServices(): ServiceState[] {
    return Array.from(this.services.values()).map(state => ({ ...state }));
  }

  /**
   * Get services by type.
   *
   * @param type - Service type to filter by
   * @returns Array of matching service states
   */
  getServicesByType(type: string): ServiceState[] {
    return this.listServices().filter(s => s.type === type);
  }

  /**
   * Get services by status.
   *
   * @param status - Service status to filter by
   * @returns Array of matching service states
   */
  getServicesByStatus(status: string): ServiceState[] {
    return this.listServices().filter(s => s.status === status);
  }

  /**
   * Start periodic health checks for a service.
   */
  private startHealthCheck(id: string, interval: number): void {
    // Clear any existing timer
    const existingTimer = this.healthCheckTimers.get(id);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    const timer = setInterval(async () => {
      if (this.isShuttingDown) return;

      const handler = this.handlers.get(id);
      const state = this.services.get(id);

      if (!handler || !state || state.status !== 'running') return;

      try {
        const healthy = await handler.healthCheck();
        state.metrics.lastHealthCheck = new Date();

        if (healthy) {
          state.metrics.healthStatus = 'healthy';
        } else {
          state.metrics.healthStatus = 'degraded';
          logger.warn(`Service ${state.name} health check returned unhealthy`);
        }

        this.emit('healthCheck', { id, healthy });
      } catch (error) {
        state.metrics.healthStatus = 'unhealthy';
        state.metrics.errors++;
        logger.error(
          `Service ${state.name} health check failed`,
          error instanceof Error ? error : undefined,
        );
        this.emit('healthCheck', { id, healthy: false });
      }
    }, interval);

    this.healthCheckTimers.set(id, timer);
    logger.debug(`Started health checks for ${id} every ${interval}ms`);
  }

  /**
   * Stop health checks for a service.
   */
  private stopHealthCheck(id: string): void {
    const timer = this.healthCheckTimers.get(id);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(id);
    }
  }

  /**
   * Unregister a service.
   *
   * @param id - Service identifier
   */
  async unregister(id: string): Promise<void> {
    const state = this.services.get(id);
    if (!state) return;

    // Stop if running
    if (state.status === 'running' || state.status === 'starting') {
      await this.stop(id);
    }

    // Clean up
    this.stopHealthCheck(id);
    this.services.delete(id);
    this.handlers.delete(id);
    this.configs.delete(id);

    logger.info(`Service unregistered: ${state.name}`);
  }

  /**
   * Check if manager is shutting down.
   */
  get shuttingDown(): boolean {
    return this.isShuttingDown;
  }

  /**
   * Gracefully shutdown all services.
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      logger.debug('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    logger.info('Shutting down all services...');

    // Clear all health check timers
    const timerEntries = Array.from(this.healthCheckTimers.entries());
    for (const [id, timer] of timerEntries) {
      clearInterval(timer);
      logger.debug(`Cleared health check timer for ${id}`);
    }
    this.healthCheckTimers.clear();

    // Stop all services in parallel
    const serviceIds = Array.from(this.services.keys());
    const stopPromises = serviceIds.map(async id => {
      try {
        await this.stop(id);
      } catch (error) {
        logger.error(
          `Error stopping service ${id}`,
          error instanceof Error ? error : undefined,
        );
      }
    });

    await Promise.allSettled(stopPromises);

    // Clear all maps
    this.services.clear();
    this.handlers.clear();
    this.configs.clear();

    logger.info('All services stopped');
    this.emit('shutdown');
  }

  /**
   * Get aggregate metrics for all services.
   */
  getAggregateMetrics(): {
    totalServices: number;
    running: number;
    stopped: number;
    failed: number;
    totalRequests: number;
    totalErrors: number;
    healthyCount: number;
  } {
    const services = this.listServices();

    return {
      totalServices: services.length,
      running: services.filter(s => s.status === 'running').length,
      stopped: services.filter(s => s.status === 'stopped').length,
      failed: services.filter(s => s.status === 'failed').length,
      totalRequests: services.reduce((sum, s) => sum + s.metrics.requests, 0),
      totalErrors: services.reduce((sum, s) => sum + s.metrics.errors, 0),
      healthyCount: services.filter(s => s.metrics.healthStatus === 'healthy').length,
    };
  }
}

/**
 * Create a new ServiceManager instance.
 *
 * @returns Configured ServiceManager
 */
export function createServiceManager(): ServiceManager {
  return new ServiceManager();
}
