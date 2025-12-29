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
import type { ServiceConfig, ServiceState, ServiceHandler } from './types.js';
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
export declare class ServiceManager extends EventEmitter {
    private services;
    private handlers;
    private configs;
    private healthCheckTimers;
    private isShuttingDown;
    constructor();
    /**
     * Register a new service with the manager.
     *
     * @param config - Service configuration
     * @param handler - Service implementation
     * @throws Error if service ID is already registered
     */
    register(config: ServiceConfig, handler: ServiceHandler): Promise<void>;
    /**
     * Start a registered service.
     *
     * @param id - Service identifier
     * @throws Error if service is not found
     */
    start(id: string): Promise<void>;
    /**
     * Stop a running service.
     *
     * @param id - Service identifier
     * @throws Error if service is not found
     */
    stop(id: string): Promise<void>;
    /**
     * Restart a service.
     *
     * @param id - Service identifier
     * @throws Error if service is not found
     */
    restart(id: string): Promise<void>;
    /**
     * Handle service failure with optional auto-restart.
     */
    private handleFailure;
    /**
     * Get the current state of a service.
     *
     * @param id - Service identifier
     * @returns Service state or undefined if not found
     */
    getStatus(id: string): ServiceState | undefined;
    /**
     * List all registered services.
     *
     * @returns Array of service states
     */
    listServices(): ServiceState[];
    /**
     * Get services by type.
     *
     * @param type - Service type to filter by
     * @returns Array of matching service states
     */
    getServicesByType(type: string): ServiceState[];
    /**
     * Get services by status.
     *
     * @param status - Service status to filter by
     * @returns Array of matching service states
     */
    getServicesByStatus(status: string): ServiceState[];
    /**
     * Start periodic health checks for a service.
     */
    private startHealthCheck;
    /**
     * Stop health checks for a service.
     */
    private stopHealthCheck;
    /**
     * Unregister a service.
     *
     * @param id - Service identifier
     */
    unregister(id: string): Promise<void>;
    /**
     * Check if manager is shutting down.
     */
    get shuttingDown(): boolean;
    /**
     * Gracefully shutdown all services.
     */
    shutdown(): Promise<void>;
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
    };
}
/**
 * Create a new ServiceManager instance.
 *
 * @returns Configured ServiceManager
 */
export declare function createServiceManager(): ServiceManager;
//# sourceMappingURL=manager.d.ts.map