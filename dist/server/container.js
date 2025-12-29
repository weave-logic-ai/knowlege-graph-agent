import { resolve, join } from "path";
import { existsSync, mkdirSync } from "fs";
import { createDatabase } from "../core/database.js";
import { createAdvancedCache } from "../caching/index.js";
import { ConfigManager } from "../config/manager.js";
import { createHealthMonitor, createMemoryCheck, createDatabaseCheck } from "../health/index.js";
import { createRegistry } from "../agents/registry.js";
import { createWorkflowRegistry } from "../workflows/registry.js";
import { createServiceManager } from "../services/manager.js";
import { createTypedEventBus } from "./event-bus.js";
import { createLogger } from "../utils/logger.js";
const logger = createLogger("service-container");
function emitContainerEvent(eventBus, type, source, data) {
  const emitter = eventBus.getEmitter();
  emitter.emit(type, {
    type,
    source,
    timestamp: /* @__PURE__ */ new Date(),
    data
  });
}
class ServiceContainer {
  static instance = null;
  static instanceLock = false;
  // Service instances (lazy initialized)
  _database = null;
  _cache = null;
  _configManager = null;
  _healthMonitor = null;
  _agentRegistry = null;
  _workflowRegistry = null;
  _pluginManager = null;
  _eventBus;
  _serviceManager = null;
  // State tracking
  _config;
  _initState = "uninitialized";
  _initPromise = null;
  _startTime = 0;
  _shutdownInProgress = false;
  // Service initialization tracking
  _serviceStates = /* @__PURE__ */ new Map();
  /**
   * Private constructor - use getInstance() instead
   */
  constructor(config) {
    this._config = this.normalizeConfig(config);
    this._eventBus = createTypedEventBus({
      maxHistorySize: 1e3,
      historyRetention: 60 * 60 * 1e3,
      // 1 hour
      debugEvents: config.verbose ?? false
    });
    this.initializeServiceStates();
    logger.debug("ServiceContainer instance created", {
      projectRoot: this._config.projectRoot
    });
  }
  /**
   * Normalize and validate configuration
   */
  normalizeConfig(config) {
    return {
      projectRoot: resolve(config.projectRoot),
      databasePath: config.databasePath ?? ".kg/knowledge.db",
      walMode: config.walMode ?? true,
      cache: {
        maxSize: config.cache?.maxSize ?? 100 * 1024 * 1024,
        // 100MB
        maxEntries: config.cache?.maxEntries ?? 1e4,
        defaultTtl: config.cache?.defaultTtl ?? 36e5,
        // 1 hour
        evictionPolicy: config.cache?.evictionPolicy ?? "lru"
      },
      enableHealthMonitoring: config.enableHealthMonitoring ?? true,
      healthCheckInterval: config.healthCheckInterval ?? 6e4,
      maxAgentsPerType: config.maxAgentsPerType ?? 10,
      verbose: config.verbose ?? false
    };
  }
  /**
   * Initialize service state tracking
   */
  initializeServiceStates() {
    const services = [
      "database",
      "cache",
      "configManager",
      "healthMonitor",
      "agentRegistry",
      "workflowRegistry",
      "serviceManager",
      "pluginManager"
    ];
    for (const service of services) {
      this._serviceStates.set(service, "uninitialized");
    }
  }
  // ============================================================================
  // Singleton Pattern
  // ============================================================================
  /**
   * Get the singleton instance, optionally creating it with config
   *
   * @param config - Configuration for new instance (required if no instance exists)
   * @returns The singleton ServiceContainer instance
   * @throws Error if no instance exists and no config provided
   */
  static getInstance(config) {
    if (ServiceContainer.instance) {
      if (config) {
        ServiceContainer.instance._config = ServiceContainer.instance.normalizeConfig(config);
      }
      return ServiceContainer.instance;
    }
    if (!config) {
      throw new Error("ServiceContainer not initialized. Provide config.");
    }
    if (ServiceContainer.instanceLock) {
      throw new Error("ServiceContainer is being initialized by another caller.");
    }
    ServiceContainer.instanceLock = true;
    try {
      ServiceContainer.instance = new ServiceContainer(config);
    } finally {
      ServiceContainer.instanceLock = false;
    }
    return ServiceContainer.instance;
  }
  /**
   * Check if an instance exists
   */
  static hasInstance() {
    return ServiceContainer.instance !== null;
  }
  /**
   * Reset the singleton instance (for testing)
   */
  static async resetInstance() {
    if (ServiceContainer.instance) {
      await ServiceContainer.instance.shutdown();
      ServiceContainer.instance = null;
    }
  }
  // ============================================================================
  // Service Accessors (Lazy Initialization)
  // ============================================================================
  /**
   * Get the database instance
   * @throws Error if container not initialized
   */
  getDatabase() {
    this.assertInitialized();
    if (!this._database) {
      throw new Error("Database not initialized");
    }
    return this._database;
  }
  /**
   * Get the advanced cache instance
   * @throws Error if container not initialized
   */
  getCache() {
    this.assertInitialized();
    if (!this._cache) {
      throw new Error("Cache not initialized");
    }
    return this._cache;
  }
  /**
   * Get the configuration manager
   * @throws Error if container not initialized
   */
  getConfig() {
    this.assertInitialized();
    if (!this._configManager) {
      throw new Error("ConfigManager not initialized");
    }
    return this._configManager;
  }
  /**
   * Get the health monitor
   * @throws Error if container not initialized
   */
  getHealthMonitor() {
    this.assertInitialized();
    if (!this._healthMonitor) {
      throw new Error("HealthMonitor not initialized");
    }
    return this._healthMonitor;
  }
  /**
   * Get the agent registry
   * @throws Error if container not initialized
   */
  getAgentRegistry() {
    this.assertInitialized();
    if (!this._agentRegistry) {
      throw new Error("AgentRegistry not initialized");
    }
    return this._agentRegistry;
  }
  /**
   * Get the workflow registry
   * @throws Error if container not initialized
   */
  getWorkflowRegistry() {
    this.assertInitialized();
    if (!this._workflowRegistry) {
      throw new Error("WorkflowRegistry not initialized");
    }
    return this._workflowRegistry;
  }
  /**
   * Get the plugin manager (if available)
   */
  getPluginManager() {
    this.assertInitialized();
    return this._pluginManager;
  }
  /**
   * Get the typed event bus for cross-service communication
   */
  getEventBus() {
    return this._eventBus;
  }
  /**
   * Get the service manager for background services
   * @throws Error if container not initialized
   */
  getServiceManager() {
    this.assertInitialized();
    if (!this._serviceManager) {
      throw new Error("ServiceManager not initialized");
    }
    return this._serviceManager;
  }
  /**
   * Get the project root directory
   */
  getProjectRoot() {
    return this._config.projectRoot;
  }
  /**
   * Get the container configuration
   */
  getContainerConfig() {
    return Object.freeze({ ...this._config });
  }
  // ============================================================================
  // Lifecycle Management
  // ============================================================================
  /**
   * Initialize all services in dependency order
   */
  async initialize() {
    if (this._initPromise) {
      return this._initPromise;
    }
    if (this._initState === "initialized") {
      logger.debug("ServiceContainer already initialized");
      return;
    }
    this._initPromise = this._doInitialize();
    try {
      await this._initPromise;
    } finally {
      this._initPromise = null;
    }
  }
  /**
   * Internal initialization logic with dependency ordering
   */
  async _doInitialize() {
    if (this._initState === "initializing") {
      throw new Error("Initialization already in progress");
    }
    this._initState = "initializing";
    this._startTime = Date.now();
    logger.info("Initializing ServiceContainer...");
    emitContainerEvent(this._eventBus, "container:initializing", "container", {});
    try {
      await this.ensureDirectories();
      await this.initializeService("configManager", () => this.initConfigManager());
      await this.initializeService("database", () => this.initDatabase());
      await this.initializeService("cache", () => this.initCache());
      await this.initializeService("healthMonitor", () => this.initHealthMonitor());
      await this.initializeService("serviceManager", () => this.initServiceManager());
      await this.initializeService("agentRegistry", () => this.initAgentRegistry());
      await this.initializeService("workflowRegistry", () => this.initWorkflowRegistry());
      this._initState = "initialized";
      const initTime = Date.now() - this._startTime;
      logger.info("ServiceContainer initialized successfully", {
        initTimeMs: initTime,
        services: Array.from(this._serviceStates.entries()).filter(([, state]) => state === "initialized").map(([name]) => name)
      });
      emitContainerEvent(this._eventBus, "container:ready", "container", {
        initTimeMs: initTime
      });
    } catch (error) {
      this._initState = "failed";
      logger.error(
        "Failed to initialize ServiceContainer",
        error instanceof Error ? error : new Error(String(error))
      );
      emitContainerEvent(this._eventBus, "container:failed", "container", {
        error: error instanceof Error ? error.message : String(error)
      });
      await this._cleanup();
      throw error;
    }
  }
  /**
   * Initialize a single service with state tracking
   */
  async initializeService(name, initializer) {
    this._serviceStates.set(name, "initializing");
    emitContainerEvent(this._eventBus, "service:initializing", "container", { service: name });
    try {
      await initializer();
      this._serviceStates.set(name, "initialized");
      emitContainerEvent(this._eventBus, "service:initialized", "container", { service: name });
      logger.debug(`Service initialized: ${name}`);
    } catch (error) {
      this._serviceStates.set(name, "failed");
      emitContainerEvent(this._eventBus, "service:failed", "container", {
        service: name,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const kgDir = join(this._config.projectRoot, ".kg");
    if (!existsSync(kgDir)) {
      mkdirSync(kgDir, { recursive: true });
      logger.debug("Created .kg directory");
    }
  }
  // ============================================================================
  // Service Initializers
  // ============================================================================
  async initConfigManager() {
    this._configManager = new ConfigManager(this._config.projectRoot);
  }
  async initDatabase() {
    const dbPath = join(this._config.projectRoot, this._config.databasePath);
    this._database = createDatabase(dbPath);
    logger.debug("Database initialized", { path: dbPath });
  }
  async initCache() {
    this._cache = createAdvancedCache({
      maxSize: this._config.cache?.maxSize,
      maxEntries: this._config.cache?.maxEntries,
      defaultTtl: this._config.cache?.defaultTtl,
      evictionPolicy: this._config.cache?.evictionPolicy,
      enableStats: true
    });
    logger.debug("Cache initialized");
  }
  async initHealthMonitor() {
    this._healthMonitor = createHealthMonitor({
      interval: this._config.healthCheckInterval,
      autoStart: false
    });
    this._healthMonitor.register(createMemoryCheck(85));
    if (this._database) {
      const dbPath = join(this._config.projectRoot, this._config.databasePath);
      this._healthMonitor.register(createDatabaseCheck(dbPath));
    }
    if (this._config.enableHealthMonitoring) {
      this._healthMonitor.start();
    }
    logger.debug("Health monitor initialized");
  }
  async initServiceManager() {
    this._serviceManager = createServiceManager();
    logger.debug("Service manager initialized");
  }
  async initAgentRegistry() {
    this._agentRegistry = createRegistry({
      enableHealthMonitoring: this._config.enableHealthMonitoring,
      healthCheckInterval: this._config.healthCheckInterval,
      maxAgentsPerType: this._config.maxAgentsPerType
    });
    logger.debug("Agent registry initialized");
  }
  async initWorkflowRegistry() {
    this._workflowRegistry = createWorkflowRegistry({
      maxConcurrentExecutions: 10,
      persistHistory: true,
      maxHistoryEntries: 1e3
    });
    logger.debug("Workflow registry initialized");
  }
  // ============================================================================
  // Shutdown
  // ============================================================================
  /**
   * Gracefully shutdown all services in reverse dependency order
   */
  async shutdown() {
    if (this._shutdownInProgress) {
      logger.warn("Shutdown already in progress");
      return;
    }
    if (this._initState === "uninitialized") {
      logger.debug("ServiceContainer not initialized, nothing to shutdown");
      return;
    }
    this._shutdownInProgress = true;
    logger.info("Shutting down ServiceContainer...");
    emitContainerEvent(this._eventBus, "container:shutdown", "container", {});
    await this._cleanup();
    this._initState = "uninitialized";
    this._shutdownInProgress = false;
    logger.info("ServiceContainer shutdown complete");
  }
  /**
   * Internal cleanup logic - shutdown services in reverse order
   */
  async _cleanup() {
    await this.shutdownService("workflowRegistry", async () => {
      if (this._workflowRegistry) {
        this._workflowRegistry.clear();
        this._workflowRegistry = null;
      }
    });
    await this.shutdownService("agentRegistry", async () => {
      if (this._agentRegistry) {
        await this._agentRegistry.dispose();
        this._agentRegistry = null;
      }
    });
    await this.shutdownService("serviceManager", async () => {
      if (this._serviceManager) {
        await this._serviceManager.shutdown();
        this._serviceManager = null;
      }
    });
    await this.shutdownService("healthMonitor", async () => {
      if (this._healthMonitor) {
        this._healthMonitor.stop();
        this._healthMonitor = null;
      }
    });
    await this.shutdownService("cache", async () => {
      if (this._cache) {
        this._cache.clear();
        this._cache = null;
      }
    });
    await this.shutdownService("database", async () => {
      if (this._database) {
        this._database.close();
        this._database = null;
      }
    });
    await this.shutdownService("configManager", async () => {
      if (this._configManager) {
        try {
          this._configManager.save();
        } catch {
        }
        this._configManager = null;
      }
    });
  }
  /**
   * Shutdown a single service with error handling
   */
  async shutdownService(name, cleanup) {
    if (this._serviceStates.get(name) !== "initialized") {
      return;
    }
    emitContainerEvent(this._eventBus, "service:shutting-down", "container", { service: name });
    try {
      await cleanup();
      this._serviceStates.set(name, "uninitialized");
      logger.debug(`Service shutdown complete: ${name}`);
    } catch (error) {
      logger.error(`Error shutting down ${name}`, error);
      this._serviceStates.set(name, "failed");
    }
  }
  // ============================================================================
  // Health & Status
  // ============================================================================
  /**
   * Check if container is initialized
   */
  isInitialized() {
    return this._initState === "initialized";
  }
  /**
   * Get initialization state
   */
  getInitState() {
    return this._initState;
  }
  /**
   * Get individual service states
   */
  getServiceStates() {
    return new Map(this._serviceStates);
  }
  /**
   * Get comprehensive health status
   */
  getHealth() {
    const components = [];
    const now = /* @__PURE__ */ new Date();
    const serviceEntries = Array.from(this._serviceStates.entries());
    for (const [name, state] of serviceEntries) {
      components.push({
        name,
        healthy: state === "initialized",
        message: state,
        lastCheck: now
      });
    }
    if (this._healthMonitor && this._initState === "initialized") {
      try {
        const systemHealth = this._healthMonitor.getLastStatus();
        for (const component of systemHealth.components) {
          components.push({
            name: `monitor:${component.name}`,
            healthy: component.status === "healthy",
            message: component.message,
            metrics: component.metadata,
            lastCheck: component.lastCheck
          });
        }
      } catch {
      }
    }
    const unhealthyCount = components.filter((c) => !c.healthy).length;
    const overallHealthy = unhealthyCount === 0;
    const status = unhealthyCount === 0 ? "healthy" : unhealthyCount < 2 ? "degraded" : "unhealthy";
    const memUsage = process.memoryUsage();
    return {
      healthy: overallHealthy,
      status,
      components,
      uptime: this._initState === "initialized" ? Date.now() - this._startTime : 0,
      totalRequests: 0,
      // Updated by server manager
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      }
    };
  }
  /**
   * Get uptime in milliseconds
   */
  getUptime() {
    if (this._initState !== "initialized") {
      return 0;
    }
    return Date.now() - this._startTime;
  }
  // ============================================================================
  // Helper Methods
  // ============================================================================
  /**
   * Assert that the container is initialized
   * @throws Error if not initialized
   */
  assertInitialized() {
    if (this._initState !== "initialized") {
      throw new Error("ServiceContainer not initialized. Call initialize() first.");
    }
  }
}
async function createServiceContainer(config) {
  const container = ServiceContainer.getInstance(config);
  await container.initialize();
  return container;
}
function getServiceContainer() {
  if (!ServiceContainer.hasInstance()) {
    throw new Error("ServiceContainer not initialized. Call createServiceContainer() first.");
  }
  return ServiceContainer.getInstance();
}
function hasServiceContainer() {
  return ServiceContainer.hasInstance();
}
async function shutdownServiceContainer() {
  await ServiceContainer.resetInstance();
}
export {
  ServiceContainer,
  createServiceContainer,
  getServiceContainer,
  hasServiceContainer,
  shutdownServiceContainer
};
//# sourceMappingURL=container.js.map
