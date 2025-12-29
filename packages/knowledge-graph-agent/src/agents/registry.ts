/**
 * Agent Registry
 *
 * Manages agent type registration, instantiation, and lifecycle.
 * Provides a factory pattern for creating agents dynamically.
 *
 * @module agents/registry
 */

import { getLogger, type Logger } from '../utils/index.js';
import {
  AgentType,
  AgentStatus,
  type AgentConfig,
  type AgentFactory,
  type AgentInstance,
  type AgentState,
  type AgentCapability,
  type AgentHealthCheck,
  createAgentId,
} from './types.js';

// ============================================================================
// Registry Types
// ============================================================================

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

// ============================================================================
// Agent Registry Class
// ============================================================================

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
export class AgentRegistry {
  private registrations: Map<AgentType, AgentRegistration> = new Map();
  private instances: Map<string, AgentInstance> = new Map();
  private instancesByType: Map<AgentType, Set<string>> = new Map();
  private logger: Logger;
  private options: Required<RegistryOptions>;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(options: RegistryOptions = {}) {
    this.logger = options.logger ?? getLogger().child('agent-registry');
    this.options = {
      logger: this.logger,
      maxAgentsPerType: options.maxAgentsPerType ?? 10,
      defaultTimeout: options.defaultTimeout ?? 30000,
      enableHealthMonitoring: options.enableHealthMonitoring ?? false,
      healthCheckInterval: options.healthCheckInterval ?? 30000,
    };

    // Initialize type tracking
    for (const type of Object.values(AgentType)) {
      this.instancesByType.set(type, new Set());
    }

    // Start health monitoring if enabled
    if (this.options.enableHealthMonitoring) {
      this.startHealthMonitoring();
    }
  }

  // ============================================================================
  // Registration Methods
  // ============================================================================

  /**
   * Register an agent type with its factory function
   */
  register(
    type: AgentType,
    factory: AgentFactory,
    options?: {
      defaultConfig?: Partial<AgentConfig>;
      capabilities?: AgentCapability[];
      metadata?: Record<string, unknown>;
    }
  ): void {
    if (this.registrations.has(type)) {
      this.logger.warn(`Overwriting existing registration for agent type: ${type}`);
    }

    const registration: AgentRegistration = {
      type,
      factory,
      defaultConfig: options?.defaultConfig,
      capabilities: options?.capabilities ?? [],
      metadata: options?.metadata,
      registeredAt: new Date(),
    };

    this.registrations.set(type, registration);
    this.logger.info(`Registered agent type: ${type}`, {
      capabilities: registration.capabilities.map(c => c.name),
    });
  }

  /**
   * Unregister an agent type
   */
  unregister(type: AgentType): boolean {
    // Terminate all instances of this type first
    const instances = this.instancesByType.get(type);
    if (instances) {
      for (const id of instances) {
        void this.terminateAgent(id);
      }
    }

    const result = this.registrations.delete(type);
    if (result) {
      this.logger.info(`Unregistered agent type: ${type}`);
    }
    return result;
  }

  /**
   * Check if an agent type is registered
   */
  isRegistered(type: AgentType): boolean {
    return this.registrations.has(type);
  }

  /**
   * Get registration info for an agent type
   */
  getRegistration(type: AgentType): AgentRegistration | undefined {
    return this.registrations.get(type);
  }

  // ============================================================================
  // Agent Lifecycle Methods
  // ============================================================================

  /**
   * Spawn a new agent instance
   */
  async spawn(
    type: AgentType,
    config: Omit<AgentConfig, 'type'>,
    options?: SpawnOptions
  ): Promise<AgentInstance> {
    const registration = this.registrations.get(type);
    if (!registration) {
      throw new Error(`Agent type not registered: ${type}`);
    }

    // Check max agents limit
    const existingCount = this.instancesByType.get(type)?.size ?? 0;
    if (existingCount >= this.options.maxAgentsPerType) {
      throw new Error(
        `Maximum agents of type ${type} reached (${this.options.maxAgentsPerType})`
      );
    }

    // Merge configurations
    const fullConfig: AgentConfig = {
      ...registration.defaultConfig,
      ...config,
      type,
      id: options?.id ?? createAgentId(type),
      ...options?.configOverrides,
    };

    this.logger.debug(`Spawning agent: ${fullConfig.id}`, {
      type,
      name: fullConfig.name,
    });

    try {
      // Create agent using factory
      const agent = await registration.factory(fullConfig);

      // Track instance
      this.instances.set(fullConfig.id!, agent);
      this.instancesByType.get(type)?.add(fullConfig.id!);

      this.logger.info(`Agent spawned: ${fullConfig.id}`, {
        type,
        name: fullConfig.name,
        capabilities: fullConfig.capabilities,
      });

      return agent;
    } catch (error) {
      this.logger.error(
        `Failed to spawn agent: ${fullConfig.id}`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Spawn multiple agents in parallel
   */
  async spawnMultiple(
    specs: Array<{
      type: AgentType;
      config: Omit<AgentConfig, 'type'>;
      options?: SpawnOptions;
    }>
  ): Promise<AgentInstance[]> {
    const results = await Promise.allSettled(
      specs.map(spec => this.spawn(spec.type, spec.config, spec.options))
    );

    const agents: AgentInstance[] = [];
    const errors: Error[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        agents.push(result.value);
      } else {
        errors.push(result.reason);
      }
    }

    if (errors.length > 0) {
      this.logger.warn(`${errors.length} agents failed to spawn`, {
        totalRequested: specs.length,
        spawned: agents.length,
        failed: errors.length,
      });
    }

    return agents;
  }

  /**
   * Get an agent instance by ID
   */
  get(id: string): AgentInstance | undefined {
    return this.instances.get(id);
  }

  /**
   * Get all agent instances
   */
  getAll(): AgentInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get agents by type
   */
  getByType(type: AgentType): AgentInstance[] {
    const ids = this.instancesByType.get(type);
    if (!ids) return [];

    return Array.from(ids)
      .map(id => this.instances.get(id))
      .filter((agent): agent is AgentInstance => agent !== undefined);
  }

  /**
   * List all registered agent types
   */
  listTypes(): Array<{
    type: AgentType;
    capabilities: AgentCapability[];
    instanceCount: number;
  }> {
    return Array.from(this.registrations.entries()).map(([type, reg]) => ({
      type,
      capabilities: reg.capabilities,
      instanceCount: this.instancesByType.get(type)?.size ?? 0,
    }));
  }

  /**
   * List all active agent instances
   */
  listInstances(): Array<{
    id: string;
    type: AgentType;
    name: string;
    status: AgentStatus;
  }> {
    return Array.from(this.instances.entries()).map(([id, agent]) => ({
      id,
      type: agent.config.type,
      name: agent.config.name,
      status: agent.getStatus(),
    }));
  }

  /**
   * Terminate an agent instance
   */
  async terminateAgent(id: string): Promise<boolean> {
    const agent = this.instances.get(id);
    if (!agent) {
      return false;
    }

    try {
      await agent.terminate();
      this.instances.delete(id);
      this.instancesByType.get(agent.config.type)?.delete(id);

      this.logger.info(`Agent terminated: ${id}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to terminate agent: ${id}`,
        error instanceof Error ? error : new Error(String(error))
      );
      // Force remove from tracking even if termination failed
      this.instances.delete(id);
      this.instancesByType.get(agent.config.type)?.delete(id);
      return false;
    }
  }

  /**
   * Terminate all agents of a specific type
   */
  async terminateByType(type: AgentType): Promise<number> {
    const ids = this.instancesByType.get(type);
    if (!ids || ids.size === 0) return 0;

    const results = await Promise.allSettled(
      Array.from(ids).map(id => this.terminateAgent(id))
    );

    return results.filter(r => r.status === 'fulfilled' && r.value).length;
  }

  /**
   * Terminate all agents
   */
  async terminateAll(): Promise<number> {
    const ids = Array.from(this.instances.keys());
    const results = await Promise.allSettled(
      ids.map(id => this.terminateAgent(id))
    );

    return results.filter(r => r.status === 'fulfilled' && r.value).length;
  }

  // ============================================================================
  // Health Monitoring Methods
  // ============================================================================

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.options.healthCheckInterval);

    this.logger.debug('Health monitoring started', {
      interval: this.options.healthCheckInterval,
    });
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
      this.logger.debug('Health monitoring stopped');
    }
  }

  /**
   * Perform health checks on all agents
   */
  async performHealthChecks(): Promise<AgentHealthCheck[]> {
    const checks: AgentHealthCheck[] = [];

    for (const [id, agent] of this.instances) {
      const check: AgentHealthCheck = {
        agentId: id,
        healthy: true,
        status: agent.getStatus(),
        lastHeartbeat: new Date(),
      };

      // Check for stuck agents
      if (agent.state.status === AgentStatus.RUNNING) {
        const stuckThreshold = this.options.defaultTimeout * 2;
        const elapsed = Date.now() - agent.state.lastActivity.getTime();

        if (elapsed > stuckThreshold) {
          check.healthy = false;
          check.error = `Agent appears stuck (${elapsed}ms since last activity)`;
        }
      }

      // Check error count
      if (agent.state.errorCount > 5) {
        check.healthy = false;
        check.error = `High error count: ${agent.state.errorCount}`;
      }

      checks.push(check);

      if (!check.healthy) {
        this.logger.warn(`Unhealthy agent detected: ${id}`, {
          status: check.status,
          error: check.error,
        });
      }
    }

    return checks;
  }

  /**
   * Get health status for a specific agent
   */
  async getAgentHealth(id: string): Promise<AgentHealthCheck | null> {
    const agent = this.instances.get(id);
    if (!agent) return null;

    return {
      agentId: id,
      healthy: agent.state.errorCount < 5,
      status: agent.getStatus(),
      lastHeartbeat: agent.state.lastActivity,
      error: agent.state.errorCount >= 5
        ? `High error count: ${agent.state.errorCount}`
        : undefined,
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get registry statistics
   */
  getStats(): {
    registeredTypes: number;
    totalInstances: number;
    instancesByType: Record<string, number>;
    instancesByStatus: Record<string, number>;
  } {
    const instancesByStatus: Record<string, number> = {};

    for (const agent of this.instances.values()) {
      const status = agent.getStatus();
      instancesByStatus[status] = (instancesByStatus[status] ?? 0) + 1;
    }

    return {
      registeredTypes: this.registrations.size,
      totalInstances: this.instances.size,
      instancesByType: Object.fromEntries(
        Array.from(this.instancesByType.entries()).map(([type, ids]) => [
          type,
          ids.size,
        ])
      ),
      instancesByStatus,
    };
  }

  /**
   * Clear all registrations and instances
   */
  async clear(): Promise<void> {
    await this.terminateAll();
    this.registrations.clear();
    this.stopHealthMonitoring();
    this.logger.info('Registry cleared');
  }

  /**
   * Dispose of the registry
   */
  async dispose(): Promise<void> {
    await this.clear();
    this.logger.info('Registry disposed');
  }
}

// ============================================================================
// Default Registry Instance
// ============================================================================

let defaultRegistry: AgentRegistry | null = null;

/**
 * Get or create the default registry instance
 */
export function getRegistry(): AgentRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new AgentRegistry();
  }
  return defaultRegistry;
}

/**
 * Create a new registry instance
 */
export function createRegistry(options?: RegistryOptions): AgentRegistry {
  return new AgentRegistry(options);
}

/**
 * Set the default registry instance
 */
export function setDefaultRegistry(registry: AgentRegistry): void {
  defaultRegistry = registry;
}

// ============================================================================
// Built-in Agent Registration Helpers
// ============================================================================

/**
 * Register default agent types with a registry
 *
 * This registers placeholder factories that should be replaced
 * with actual implementations.
 */
export function registerDefaultAgents(
  registry: AgentRegistry,
  factories?: Partial<Record<AgentType, AgentFactory>>
): void {
  const defaultCapabilities: Record<AgentType, AgentCapability[]> = {
    [AgentType.RESEARCHER]: [
      { name: 'search', description: 'Information search' },
      { name: 'analyze', description: 'Data analysis' },
    ],
    [AgentType.CODER]: [
      { name: 'code', description: 'Code generation' },
      { name: 'refactor', description: 'Code refactoring' },
    ],
    [AgentType.TESTER]: [
      { name: 'test', description: 'Test generation' },
      { name: 'coverage', description: 'Coverage analysis' },
    ],
    [AgentType.ANALYST]: [
      { name: 'analyze', description: 'Pattern analysis' },
      { name: 'report', description: 'Report generation' },
    ],
    [AgentType.ARCHITECT]: [
      { name: 'design', description: 'System design' },
      { name: 'document', description: 'Architecture documentation' },
    ],
    [AgentType.REVIEWER]: [
      { name: 'review', description: 'Code review' },
      { name: 'feedback', description: 'Feedback generation' },
    ],
    [AgentType.COORDINATOR]: [
      { name: 'orchestrate', description: 'Task orchestration' },
      { name: 'delegate', description: 'Task delegation' },
    ],
    [AgentType.OPTIMIZER]: [
      { name: 'optimize', description: 'Performance optimization' },
      { name: 'benchmark', description: 'Benchmarking' },
    ],
    [AgentType.DOCUMENTER]: [
      { name: 'document', description: 'Documentation generation' },
      { name: 'format', description: 'Documentation formatting' },
    ],
    [AgentType.PLANNER]: [
      { name: 'plan', description: 'Task planning and decomposition' },
      { name: 'schedule', description: 'Timeline estimation' },
      { name: 'risk', description: 'Risk assessment' },
    ],
    [AgentType.CUSTOM]: [],
  };

  for (const type of Object.values(AgentType)) {
    const factory = factories?.[type];
    if (factory) {
      registry.register(type, factory, {
        capabilities: defaultCapabilities[type],
      });
    }
  }
}
