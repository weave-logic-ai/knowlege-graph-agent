/**
 * Services Module
 *
 * Provides service management, lifecycle control, and file watching capabilities.
 */
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
/**
 * Service Manager for managing multiple services
 */
export declare class ServiceManager {
    private services;
    private configs;
    private states;
    /**
     * Register a service
     */
    register(config: ServiceConfig, handler: ServiceHandler): void;
    /**
     * Start a service
     */
    start(id: string): Promise<void>;
    /**
     * Stop a service
     */
    stop(id: string): Promise<void>;
    /**
     * Start all services
     */
    startAll(): Promise<void>;
    /**
     * Stop all services
     */
    stopAll(): Promise<void>;
    /**
     * Get service state
     */
    getState(id: string): ServiceState | undefined;
    /**
     * Get all service states
     */
    getAllStates(): Map<string, ServiceState>;
    /**
     * Get service metrics
     */
    getMetrics(id: string): ServiceMetrics | undefined;
}
/**
 * Create a new ServiceManager instance
 */
export declare function createServiceManager(): ServiceManager;
/**
 * File watcher service for monitoring file changes
 */
export declare class FileWatcherService implements ServiceHandler {
    private watchPaths;
    private onChange?;
    private status;
    private metrics;
    private startTime?;
    private watcher;
    constructor(watchPaths: string[], onChange?: ((path: string, event: string) => void) | undefined);
    start(): Promise<void>;
    stop(): Promise<void>;
    getStatus(): ServiceStatus;
    getMetrics(): ServiceMetrics;
}
//# sourceMappingURL=index.d.ts.map