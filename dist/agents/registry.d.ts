/**
 * Agent Registry
 *
 * Manages agent type registration, instantiation, and lifecycle.
 * Provides a factory pattern for creating agents dynamically.
 *
 * @module agents/registry
 */
import { type Logger } from '../utils/index.js';
import { AgentType, AgentStatus, type AgentConfig, type AgentFactory, type AgentInstance, type AgentCapability, type AgentHealthCheck } from './types.js';
/**
 * Agent registration entry
 */
interface AgentRegistration {
    /** Agent type */
    type: AgentType;
    /** Factory function */
    factory: AgentFactory;
    /** Default configuration */
    defaultConfig?: Partial<AgentConfig>;
    /** Agent capabilities */
    capabilities: AgentCapability[];
    /** Registration metadata */
    metadata?: Record<string, unknown>;
    /** Registration timestamp */
    registeredAt: Date;
}
/**
 * Registry configuration options
 */
export interface RegistryOptions {
    /** Logger instance */
    logger?: Logger;
    /** Maximum agents per type */
    maxAgentsPerType?: number;
    /** Default task timeout */
    defaultTimeout?: number;
    /** Enable health monitoring */
    enableHealthMonitoring?: boolean;
    /** Health check interval in ms */
    healthCheckInterval?: number;
}
/**
 * Agent spawn options
 */
export interface SpawnOptions {
    /** Custom agent ID */
    id?: string;
    /** Override default configuration */
    configOverrides?: Partial<AgentConfig>;
    /** Start immediately after spawn */
    autoStart?: boolean;
}
/**
 * Agent Registry
 *
 * Central registry for managing agent types and instances.
 * Supports registration, spawning, lifecycle management, and health monitoring.
 *
 * @example
 * ```typescript
 * const registry = new AgentRegistry();
 *
 * // Register an agent type
 * registry.register(AgentType.RESEARCHER, researcherFactory, {
 *   capabilities: [{ name: 'search', description: 'Search capabilities' }]
 * });
 *
 * // Spawn an agent
 * const agent = await registry.spawn(AgentType.RESEARCHER, {
 *   name: 'Research Assistant',
 * });
 *
 * // Execute a task
 * const result = await agent.execute(task);
 * ```
 */
export declare class AgentRegistry {
    private registrations;
    private instances;
    private instancesByType;
    private logger;
    private options;
    private healthCheckTimer?;
    constructor(options?: RegistryOptions);
    /**
     * Register an agent type with its factory function
     */
    register(type: AgentType, factory: AgentFactory, options?: {
        defaultConfig?: Partial<AgentConfig>;
        capabilities?: AgentCapability[];
        metadata?: Record<string, unknown>;
    }): void;
    /**
     * Unregister an agent type
     */
    unregister(type: AgentType): boolean;
    /**
     * Check if an agent type is registered
     */
    isRegistered(type: AgentType): boolean;
    /**
     * Get registration info for an agent type
     */
    getRegistration(type: AgentType): AgentRegistration | undefined;
    /**
     * Spawn a new agent instance
     */
    spawn(type: AgentType, config: Omit<AgentConfig, 'type'>, options?: SpawnOptions): Promise<AgentInstance>;
    /**
     * Spawn multiple agents in parallel
     */
    spawnMultiple(specs: Array<{
        type: AgentType;
        config: Omit<AgentConfig, 'type'>;
        options?: SpawnOptions;
    }>): Promise<AgentInstance[]>;
    /**
     * Get an agent instance by ID
     */
    get(id: string): AgentInstance | undefined;
    /**
     * Get all agent instances
     */
    getAll(): AgentInstance[];
    /**
     * Get agents by type
     */
    getByType(type: AgentType): AgentInstance[];
    /**
     * List all registered agent types
     */
    listTypes(): Array<{
        type: AgentType;
        capabilities: AgentCapability[];
        instanceCount: number;
    }>;
    /**
     * List all active agent instances
     */
    listInstances(): Array<{
        id: string;
        type: AgentType;
        name: string;
        status: AgentStatus;
    }>;
    /**
     * Terminate an agent instance
     */
    terminateAgent(id: string): Promise<boolean>;
    /**
     * Terminate all agents of a specific type
     */
    terminateByType(type: AgentType): Promise<number>;
    /**
     * Terminate all agents
     */
    terminateAll(): Promise<number>;
    /**
     * Start health monitoring
     */
    private startHealthMonitoring;
    /**
     * Stop health monitoring
     */
    stopHealthMonitoring(): void;
    /**
     * Perform health checks on all agents
     */
    performHealthChecks(): Promise<AgentHealthCheck[]>;
    /**
     * Get health status for a specific agent
     */
    getAgentHealth(id: string): Promise<AgentHealthCheck | null>;
    /**
     * Get registry statistics
     */
    getStats(): {
        registeredTypes: number;
        totalInstances: number;
        instancesByType: Record<string, number>;
        instancesByStatus: Record<string, number>;
    };
    /**
     * Clear all registrations and instances
     */
    clear(): Promise<void>;
    /**
     * Dispose of the registry
     */
    dispose(): Promise<void>;
}
/**
 * Get or create the default registry instance
 */
export declare function getRegistry(): AgentRegistry;
/**
 * Create a new registry instance
 */
export declare function createRegistry(options?: RegistryOptions): AgentRegistry;
/**
 * Set the default registry instance
 */
export declare function setDefaultRegistry(registry: AgentRegistry): void;
/**
 * Register default agent types with a registry
 *
 * This registers placeholder factories that should be replaced
 * with actual implementations.
 */
export declare function registerDefaultAgents(registry: AgentRegistry, factories?: Partial<Record<AgentType, AgentFactory>>): void;
export {};
//# sourceMappingURL=registry.d.ts.map