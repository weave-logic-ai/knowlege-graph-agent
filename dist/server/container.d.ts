/**
 * Service Container - Singleton Pattern for Concurrent Server Execution
 *
 * Provides a centralized container for managing all shared services across
 * MCP, GraphQL, and Dashboard servers. Implements lazy initialization,
 * dependency injection, and coordinated lifecycle management.
 *
 * @module server/container
 */
import { KnowledgeGraphDatabase } from '../core/database.js';
import { AdvancedCache } from '../caching/index.js';
import { ConfigManager } from '../config/manager.js';
import { HealthMonitor } from '../health/index.js';
import { AgentRegistry } from '../agents/registry.js';
import { WorkflowRegistry } from '../workflows/registry.js';
import { ServiceManager } from '../services/manager.js';
import { TypedEventBus } from './event-bus.js';
import type { HealthStatus } from './types.js';
import type { CacheConfig } from '../caching/index.js';
import type { PluginManager } from '../plugins/types.js';
/**
 * Service initialization state
 */
export type ServiceInitState = 'uninitialized' | 'initializing' | 'initialized' | 'failed';
/**
 * Service dependency graph - defines initialization order
 */
export interface ServiceDependency {
    name: string;
    dependsOn: string[];
    priority: number;
}
/**
 * Container configuration options
 */
export interface ContainerConfig {
    /** Project root directory */
    projectRoot: string;
    /** Database path (relative to projectRoot) */
    databasePath?: string;
    /** Enable WAL mode for SQLite */
    walMode?: boolean;
    /** Cache configuration */
    cache?: Partial<CacheConfig>;
    /** Enable health monitoring */
    enableHealthMonitoring?: boolean;
    /** Health check interval in ms */
    healthCheckInterval?: number;
    /** Max agents per type */
    maxAgentsPerType?: number;
    /** Enable verbose logging */
    verbose?: boolean;
}
/**
 * Container event types
 */
export type ContainerEventType = 'service:initializing' | 'service:initialized' | 'service:failed' | 'service:shutting-down' | 'container:ready' | 'container:shutdown';
/**
 * ServiceContainer - Singleton for shared service management
 *
 * Manages the lifecycle of all shared services across concurrent server
 * instances. Provides lazy initialization, dependency injection, and
 * coordinated shutdown.
 *
 * @example
 * ```typescript
 * // Get or create the singleton instance
 * const container = ServiceContainer.getInstance({
 *   projectRoot: '/path/to/project',
 * });
 *
 * // Initialize all services
 * await container.initialize();
 *
 * // Access services
 * const db = container.getDatabase();
 * const cache = container.getCache();
 *
 * // Graceful shutdown
 * await container.shutdown();
 * ```
 */
export declare class ServiceContainer {
    private static instance;
    private static instanceLock;
    private _database;
    private _cache;
    private _configManager;
    private _healthMonitor;
    private _agentRegistry;
    private _workflowRegistry;
    private _pluginManager;
    private _eventBus;
    private _serviceManager;
    private _config;
    private _initState;
    private _initPromise;
    private _startTime;
    private _shutdownInProgress;
    private _serviceStates;
    /**
     * Private constructor - use getInstance() instead
     */
    private constructor();
    /**
     * Normalize and validate configuration
     */
    private normalizeConfig;
    /**
     * Initialize service state tracking
     */
    private initializeServiceStates;
    /**
     * Get the singleton instance, optionally creating it with config
     *
     * @param config - Configuration for new instance (required if no instance exists)
     * @returns The singleton ServiceContainer instance
     * @throws Error if no instance exists and no config provided
     */
    static getInstance(config?: ContainerConfig): ServiceContainer;
    /**
     * Check if an instance exists
     */
    static hasInstance(): boolean;
    /**
     * Reset the singleton instance (for testing)
     */
    static resetInstance(): Promise<void>;
    /**
     * Get the database instance
     * @throws Error if container not initialized
     */
    getDatabase(): KnowledgeGraphDatabase;
    /**
     * Get the advanced cache instance
     * @throws Error if container not initialized
     */
    getCache(): AdvancedCache;
    /**
     * Get the configuration manager
     * @throws Error if container not initialized
     */
    getConfig(): ConfigManager;
    /**
     * Get the health monitor
     * @throws Error if container not initialized
     */
    getHealthMonitor(): HealthMonitor;
    /**
     * Get the agent registry
     * @throws Error if container not initialized
     */
    getAgentRegistry(): AgentRegistry;
    /**
     * Get the workflow registry
     * @throws Error if container not initialized
     */
    getWorkflowRegistry(): WorkflowRegistry;
    /**
     * Get the plugin manager (if available)
     */
    getPluginManager(): PluginManager | null;
    /**
     * Get the typed event bus for cross-service communication
     */
    getEventBus(): TypedEventBus;
    /**
     * Get the service manager for background services
     * @throws Error if container not initialized
     */
    getServiceManager(): ServiceManager;
    /**
     * Get the project root directory
     */
    getProjectRoot(): string;
    /**
     * Get the container configuration
     */
    getContainerConfig(): Readonly<ContainerConfig>;
    /**
     * Initialize all services in dependency order
     */
    initialize(): Promise<void>;
    /**
     * Internal initialization logic with dependency ordering
     */
    private _doInitialize;
    /**
     * Initialize a single service with state tracking
     */
    private initializeService;
    /**
     * Ensure required directories exist
     */
    private ensureDirectories;
    private initConfigManager;
    private initDatabase;
    private initCache;
    private initHealthMonitor;
    private initServiceManager;
    private initAgentRegistry;
    private initWorkflowRegistry;
    /**
     * Gracefully shutdown all services in reverse dependency order
     */
    shutdown(): Promise<void>;
    /**
     * Internal cleanup logic - shutdown services in reverse order
     */
    private _cleanup;
    /**
     * Shutdown a single service with error handling
     */
    private shutdownService;
    /**
     * Check if container is initialized
     */
    isInitialized(): boolean;
    /**
     * Get initialization state
     */
    getInitState(): ServiceInitState;
    /**
     * Get individual service states
     */
    getServiceStates(): Map<string, ServiceInitState>;
    /**
     * Get comprehensive health status
     */
    getHealth(): HealthStatus;
    /**
     * Get uptime in milliseconds
     */
    getUptime(): number;
    /**
     * Assert that the container is initialized
     * @throws Error if not initialized
     */
    private assertInitialized;
}
/**
 * Create and initialize a service container
 *
 * @param config - Container configuration
 * @returns Initialized ServiceContainer
 */
export declare function createServiceContainer(config: ContainerConfig): Promise<ServiceContainer>;
/**
 * Get existing service container instance
 *
 * @returns ServiceContainer if initialized
 * @throws Error if not initialized
 */
export declare function getServiceContainer(): ServiceContainer;
/**
 * Check if service container is available
 */
export declare function hasServiceContainer(): boolean;
/**
 * Shutdown and reset the service container
 */
export declare function shutdownServiceContainer(): Promise<void>;
//# sourceMappingURL=container.d.ts.map