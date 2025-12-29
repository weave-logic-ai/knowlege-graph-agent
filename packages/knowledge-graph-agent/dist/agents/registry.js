import { getLogger } from "../utils/logger.js";
import { AgentType, createAgentId, AgentStatus } from "./types.js";
class AgentRegistry {
  registrations = /* @__PURE__ */ new Map();
  instances = /* @__PURE__ */ new Map();
  instancesByType = /* @__PURE__ */ new Map();
  logger;
  options;
  healthCheckTimer;
  constructor(options = {}) {
    this.logger = options.logger ?? getLogger().child("agent-registry");
    this.options = {
      logger: this.logger,
      maxAgentsPerType: options.maxAgentsPerType ?? 10,
      defaultTimeout: options.defaultTimeout ?? 3e4,
      enableHealthMonitoring: options.enableHealthMonitoring ?? false,
      healthCheckInterval: options.healthCheckInterval ?? 3e4
    };
    for (const type of Object.values(AgentType)) {
      this.instancesByType.set(type, /* @__PURE__ */ new Set());
    }
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
  register(type, factory, options) {
    if (this.registrations.has(type)) {
      this.logger.warn(`Overwriting existing registration for agent type: ${type}`);
    }
    const registration = {
      type,
      factory,
      defaultConfig: options?.defaultConfig,
      capabilities: options?.capabilities ?? [],
      metadata: options?.metadata,
      registeredAt: /* @__PURE__ */ new Date()
    };
    this.registrations.set(type, registration);
    this.logger.info(`Registered agent type: ${type}`, {
      capabilities: registration.capabilities.map((c) => c.name)
    });
  }
  /**
   * Unregister an agent type
   */
  unregister(type) {
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
  isRegistered(type) {
    return this.registrations.has(type);
  }
  /**
   * Get registration info for an agent type
   */
  getRegistration(type) {
    return this.registrations.get(type);
  }
  // ============================================================================
  // Agent Lifecycle Methods
  // ============================================================================
  /**
   * Spawn a new agent instance
   */
  async spawn(type, config, options) {
    const registration = this.registrations.get(type);
    if (!registration) {
      throw new Error(`Agent type not registered: ${type}`);
    }
    const existingCount = this.instancesByType.get(type)?.size ?? 0;
    if (existingCount >= this.options.maxAgentsPerType) {
      throw new Error(
        `Maximum agents of type ${type} reached (${this.options.maxAgentsPerType})`
      );
    }
    const fullConfig = {
      ...registration.defaultConfig,
      ...config,
      type,
      id: options?.id ?? createAgentId(type),
      ...options?.configOverrides
    };
    this.logger.debug(`Spawning agent: ${fullConfig.id}`, {
      type,
      name: fullConfig.name
    });
    try {
      const agent = await registration.factory(fullConfig);
      this.instances.set(fullConfig.id, agent);
      this.instancesByType.get(type)?.add(fullConfig.id);
      this.logger.info(`Agent spawned: ${fullConfig.id}`, {
        type,
        name: fullConfig.name,
        capabilities: fullConfig.capabilities
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
  async spawnMultiple(specs) {
    const results = await Promise.allSettled(
      specs.map((spec) => this.spawn(spec.type, spec.config, spec.options))
    );
    const agents = [];
    const errors = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        agents.push(result.value);
      } else {
        errors.push(result.reason);
      }
    }
    if (errors.length > 0) {
      this.logger.warn(`${errors.length} agents failed to spawn`, {
        totalRequested: specs.length,
        spawned: agents.length,
        failed: errors.length
      });
    }
    return agents;
  }
  /**
   * Get an agent instance by ID
   */
  get(id) {
    return this.instances.get(id);
  }
  /**
   * Get all agent instances
   */
  getAll() {
    return Array.from(this.instances.values());
  }
  /**
   * Get agents by type
   */
  getByType(type) {
    const ids = this.instancesByType.get(type);
    if (!ids) return [];
    return Array.from(ids).map((id) => this.instances.get(id)).filter((agent) => agent !== void 0);
  }
  /**
   * List all registered agent types
   */
  listTypes() {
    return Array.from(this.registrations.entries()).map(([type, reg]) => ({
      type,
      capabilities: reg.capabilities,
      instanceCount: this.instancesByType.get(type)?.size ?? 0
    }));
  }
  /**
   * List all active agent instances
   */
  listInstances() {
    return Array.from(this.instances.entries()).map(([id, agent]) => ({
      id,
      type: agent.config.type,
      name: agent.config.name,
      status: agent.getStatus()
    }));
  }
  /**
   * Terminate an agent instance
   */
  async terminateAgent(id) {
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
      this.instances.delete(id);
      this.instancesByType.get(agent.config.type)?.delete(id);
      return false;
    }
  }
  /**
   * Terminate all agents of a specific type
   */
  async terminateByType(type) {
    const ids = this.instancesByType.get(type);
    if (!ids || ids.size === 0) return 0;
    const results = await Promise.allSettled(
      Array.from(ids).map((id) => this.terminateAgent(id))
    );
    return results.filter((r) => r.status === "fulfilled" && r.value).length;
  }
  /**
   * Terminate all agents
   */
  async terminateAll() {
    const ids = Array.from(this.instances.keys());
    const results = await Promise.allSettled(
      ids.map((id) => this.terminateAgent(id))
    );
    return results.filter((r) => r.status === "fulfilled" && r.value).length;
  }
  // ============================================================================
  // Health Monitoring Methods
  // ============================================================================
  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.options.healthCheckInterval);
    this.logger.debug("Health monitoring started", {
      interval: this.options.healthCheckInterval
    });
  }
  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = void 0;
      this.logger.debug("Health monitoring stopped");
    }
  }
  /**
   * Perform health checks on all agents
   */
  async performHealthChecks() {
    const checks = [];
    for (const [id, agent] of this.instances) {
      const check = {
        agentId: id,
        healthy: true,
        status: agent.getStatus(),
        lastHeartbeat: /* @__PURE__ */ new Date()
      };
      if (agent.state.status === AgentStatus.RUNNING) {
        const stuckThreshold = this.options.defaultTimeout * 2;
        const elapsed = Date.now() - agent.state.lastActivity.getTime();
        if (elapsed > stuckThreshold) {
          check.healthy = false;
          check.error = `Agent appears stuck (${elapsed}ms since last activity)`;
        }
      }
      if (agent.state.errorCount > 5) {
        check.healthy = false;
        check.error = `High error count: ${agent.state.errorCount}`;
      }
      checks.push(check);
      if (!check.healthy) {
        this.logger.warn(`Unhealthy agent detected: ${id}`, {
          status: check.status,
          error: check.error
        });
      }
    }
    return checks;
  }
  /**
   * Get health status for a specific agent
   */
  async getAgentHealth(id) {
    const agent = this.instances.get(id);
    if (!agent) return null;
    return {
      agentId: id,
      healthy: agent.state.errorCount < 5,
      status: agent.getStatus(),
      lastHeartbeat: agent.state.lastActivity,
      error: agent.state.errorCount >= 5 ? `High error count: ${agent.state.errorCount}` : void 0
    };
  }
  // ============================================================================
  // Utility Methods
  // ============================================================================
  /**
   * Get registry statistics
   */
  getStats() {
    const instancesByStatus = {};
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
          ids.size
        ])
      ),
      instancesByStatus
    };
  }
  /**
   * Clear all registrations and instances
   */
  async clear() {
    await this.terminateAll();
    this.registrations.clear();
    this.stopHealthMonitoring();
    this.logger.info("Registry cleared");
  }
  /**
   * Dispose of the registry
   */
  async dispose() {
    await this.clear();
    this.logger.info("Registry disposed");
  }
}
let defaultRegistry = null;
function getRegistry() {
  if (!defaultRegistry) {
    defaultRegistry = new AgentRegistry();
  }
  return defaultRegistry;
}
function createRegistry(options) {
  return new AgentRegistry(options);
}
function setDefaultRegistry(registry) {
  defaultRegistry = registry;
}
function registerDefaultAgents(registry, factories) {
  const defaultCapabilities = {
    [AgentType.RESEARCHER]: [
      { name: "search", description: "Information search" },
      { name: "analyze", description: "Data analysis" }
    ],
    [AgentType.CODER]: [
      { name: "code", description: "Code generation" },
      { name: "refactor", description: "Code refactoring" }
    ],
    [AgentType.TESTER]: [
      { name: "test", description: "Test generation" },
      { name: "coverage", description: "Coverage analysis" }
    ],
    [AgentType.ANALYST]: [
      { name: "analyze", description: "Pattern analysis" },
      { name: "report", description: "Report generation" }
    ],
    [AgentType.ARCHITECT]: [
      { name: "design", description: "System design" },
      { name: "document", description: "Architecture documentation" }
    ],
    [AgentType.REVIEWER]: [
      { name: "review", description: "Code review" },
      { name: "feedback", description: "Feedback generation" }
    ],
    [AgentType.COORDINATOR]: [
      { name: "orchestrate", description: "Task orchestration" },
      { name: "delegate", description: "Task delegation" }
    ],
    [AgentType.OPTIMIZER]: [
      { name: "optimize", description: "Performance optimization" },
      { name: "benchmark", description: "Benchmarking" }
    ],
    [AgentType.DOCUMENTER]: [
      { name: "document", description: "Documentation generation" },
      { name: "format", description: "Documentation formatting" }
    ],
    [AgentType.PLANNER]: [
      { name: "plan", description: "Task planning and decomposition" },
      { name: "schedule", description: "Timeline estimation" },
      { name: "risk", description: "Risk assessment" }
    ],
    [AgentType.CUSTOM]: []
  };
  for (const type of Object.values(AgentType)) {
    const factory = factories?.[type];
    if (factory) {
      registry.register(type, factory, {
        capabilities: defaultCapabilities[type]
      });
    }
  }
}
export {
  AgentRegistry,
  createRegistry,
  getRegistry,
  registerDefaultAgents,
  setDefaultRegistry
};
//# sourceMappingURL=registry.js.map
