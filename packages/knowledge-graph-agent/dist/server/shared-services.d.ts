/**
 * Shared Services Layer
 *
 * Singleton service layer that provides shared resources to all server
 * components (MCP, GraphQL, Dashboard). Ensures consistent state and
 * proper resource lifecycle management.
 *
 * @module server/shared-services
 */
import { EventEmitter } from 'events';
import { KnowledgeGraphDatabase } from '../core/database.js';
import { ShadowCache } from '../core/cache.js';
import { AgentRegistry } from '../agents/registry.js';
import { WorkflowRegistry } from '../workflows/registry.js';
import type { ServerConfig, ISharedServices, HealthStatus } from './types.js';
/**
 * Create default server configuration
 */
export declare function createDefaultConfig(projectRoot: string): ServerConfig;
/**
 * SharedServices
 *
 * Singleton class that manages shared resources across all server components.
 * Provides database, cache, registries, and event bus for cross-service
 * communication.
 *
 * @example
 * ```typescript
 * const services = SharedServices.getInstance(config);
 * await services.initialize();
 *
 * // Access shared resources
 * const db = services.database;
 * const cache = services.cache;
 *
 * // Listen to events
 * services.eventBus.on('graph:updated', handleUpdate);
 *
 * // Cleanup
 * await services.shutdown();
 * ```
 */
export declare class SharedServices implements ISharedServices {
    private static instance;
    private _database;
    private _cache;
    private _agentRegistry;
    private _workflowRegistry;
    private _eventBus;
    private _config;
    private _projectRoot;
    private _initialized;
    private _initPromise;
    private _startTime;
    /**
     * Private constructor - use getInstance() instead
     */
    private constructor();
    /**
     * Get or create the singleton instance
     */
    static getInstance(config: ServerConfig): SharedServices;
    /**
     * Check if instance exists
     */
    static hasInstance(): boolean;
    /**
     * Reset the singleton instance (for testing)
     */
    static resetInstance(): Promise<void>;
    get database(): KnowledgeGraphDatabase;
    get cache(): ShadowCache;
    get agentRegistry(): AgentRegistry;
    get workflowRegistry(): WorkflowRegistry;
    get eventBus(): EventEmitter;
    get projectRoot(): string;
    get config(): ServerConfig;
    /**
     * Initialize all shared services
     */
    initialize(): Promise<void>;
    /**
     * Internal initialization logic
     */
    private _doInitialize;
    /**
     * Shutdown all shared services
     */
    shutdown(): Promise<void>;
    /**
     * Internal cleanup logic
     */
    private _cleanup;
    /**
     * Check if services are initialized
     */
    isInitialized(): boolean;
    /**
     * Get comprehensive health status
     */
    getHealth(): HealthStatus;
    private _checkDatabaseHealth;
    private _checkCacheHealth;
    private _checkAgentRegistryHealth;
    private _checkWorkflowRegistryHealth;
    /**
     * Emit a typed event
     */
    emit(event: string, data?: Record<string, unknown>): void;
    /**
     * Subscribe to events
     */
    on(event: string, listener: (...args: unknown[]) => void): void;
    /**
     * Unsubscribe from events
     */
    off(event: string, listener: (...args: unknown[]) => void): void;
}
/**
 * Create and initialize shared services
 */
export declare function createSharedServices(config: Partial<ServerConfig> & {
    projectRoot: string;
}): Promise<SharedServices>;
/**
 * Get existing shared services instance
 * @throws Error if not initialized
 */
export declare function getSharedServices(): SharedServices;
//# sourceMappingURL=shared-services.d.ts.map