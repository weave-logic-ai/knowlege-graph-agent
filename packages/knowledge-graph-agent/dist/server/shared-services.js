import { EventEmitter } from "events";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { createDatabase } from "../core/database.js";
import { createShadowCache } from "../core/cache.js";
import { createRegistry } from "../agents/registry.js";
import { createWorkflowRegistry } from "../workflows/registry.js";
import { createLogger } from "../utils/logger.js";
const logger = createLogger("shared-services");
function createDefaultConfig(projectRoot) {
  return {
    projectRoot,
    mcp: {
      enabled: false,
      name: "knowledge-graph-mcp-server",
      version: "0.4.0"
    },
    graphql: {
      enabled: false,
      port: 4e3,
      playground: true,
      introspection: true
    },
    dashboard: {
      enabled: false,
      port: 3e3,
      hotReload: process.env.NODE_ENV !== "production"
    },
    database: {
      path: join(projectRoot, ".kg", "knowledge.db"),
      wal: true,
      busyTimeout: 5e3
    },
    cache: {
      enabled: true,
      defaultTTL: 36e5,
      // 1 hour
      maxEntries: 1e4
    },
    verbose: false
  };
}
class SharedServices {
  static instance = null;
  _database = null;
  _cache = null;
  _agentRegistry = null;
  _workflowRegistry = null;
  _eventBus;
  _config;
  _projectRoot;
  _initialized = false;
  _initPromise = null;
  _startTime = 0;
  /**
   * Private constructor - use getInstance() instead
   */
  constructor(config) {
    this._config = config;
    this._projectRoot = config.projectRoot;
    this._eventBus = new EventEmitter();
    this._eventBus.setMaxListeners(100);
    logger.debug("SharedServices instance created", {
      projectRoot: this._projectRoot
    });
  }
  /**
   * Get or create the singleton instance
   */
  static getInstance(config) {
    if (!SharedServices.instance) {
      SharedServices.instance = new SharedServices(config);
    } else {
      SharedServices.instance._config = config;
      SharedServices.instance._projectRoot = config.projectRoot;
    }
    return SharedServices.instance;
  }
  /**
   * Check if instance exists
   */
  static hasInstance() {
    return SharedServices.instance !== null;
  }
  /**
   * Reset the singleton instance (for testing)
   */
  static async resetInstance() {
    if (SharedServices.instance) {
      await SharedServices.instance.shutdown();
      SharedServices.instance = null;
    }
  }
  // ============================================================================
  // Property Accessors
  // ============================================================================
  get database() {
    if (!this._database) {
      throw new Error("SharedServices not initialized. Call initialize() first.");
    }
    return this._database;
  }
  get cache() {
    if (!this._cache) {
      throw new Error("SharedServices not initialized. Call initialize() first.");
    }
    return this._cache;
  }
  get agentRegistry() {
    if (!this._agentRegistry) {
      throw new Error("SharedServices not initialized. Call initialize() first.");
    }
    return this._agentRegistry;
  }
  get workflowRegistry() {
    if (!this._workflowRegistry) {
      throw new Error("SharedServices not initialized. Call initialize() first.");
    }
    return this._workflowRegistry;
  }
  get eventBus() {
    return this._eventBus;
  }
  get projectRoot() {
    return this._projectRoot;
  }
  get config() {
    return this._config;
  }
  // ============================================================================
  // Lifecycle Methods
  // ============================================================================
  /**
   * Initialize all shared services
   */
  async initialize() {
    if (this._initPromise) {
      return this._initPromise;
    }
    if (this._initialized) {
      logger.debug("SharedServices already initialized");
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
   * Internal initialization logic
   */
  async _doInitialize() {
    logger.info("Initializing SharedServices...");
    this._startTime = Date.now();
    try {
      const kgDir = join(this._projectRoot, ".kg");
      if (!existsSync(kgDir)) {
        mkdirSync(kgDir, { recursive: true });
        logger.debug("Created .kg directory");
      }
      logger.debug("Initializing database...");
      this._database = createDatabase(this._config.database.path);
      this._eventBus.emit("service:initialized", { service: "database" });
      if (this._config.cache.enabled) {
        logger.debug("Initializing cache...");
        this._cache = createShadowCache({
          projectRoot: this._projectRoot,
          defaultTTL: this._config.cache.defaultTTL,
          maxEntries: this._config.cache.maxEntries
        });
        this._eventBus.emit("service:initialized", { service: "cache" });
      } else {
        this._cache = createShadowCache({
          projectRoot: this._projectRoot,
          persist: false
        });
      }
      logger.debug("Initializing agent registry...");
      this._agentRegistry = createRegistry({
        enableHealthMonitoring: true,
        healthCheckInterval: 3e4
      });
      this._eventBus.emit("service:initialized", { service: "agentRegistry" });
      logger.debug("Initializing workflow registry...");
      this._workflowRegistry = createWorkflowRegistry({
        maxConcurrentExecutions: 10,
        persistHistory: true,
        maxHistoryEntries: 1e3
      });
      this._eventBus.emit("service:initialized", { service: "workflowRegistry" });
      this._initialized = true;
      const initTime = Date.now() - this._startTime;
      logger.info("SharedServices initialized successfully", {
        initTimeMs: initTime,
        databasePath: this._config.database.path
      });
      this._eventBus.emit("services:ready", {
        initTimeMs: initTime
      });
    } catch (error) {
      logger.error(
        "Failed to initialize SharedServices",
        error instanceof Error ? error : new Error(String(error))
      );
      await this._cleanup();
      throw error;
    }
  }
  /**
   * Shutdown all shared services
   */
  async shutdown() {
    if (!this._initialized) {
      logger.debug("SharedServices not initialized, nothing to shutdown");
      return;
    }
    logger.info("Shutting down SharedServices...");
    this._eventBus.emit("services:stopping");
    await this._cleanup();
    this._initialized = false;
    logger.info("SharedServices shutdown complete");
    this._eventBus.emit("services:stopped");
  }
  /**
   * Internal cleanup logic
   */
  async _cleanup() {
    if (this._workflowRegistry) {
      try {
        this._workflowRegistry.clear();
        this._workflowRegistry = null;
        logger.debug("Workflow registry shutdown complete");
      } catch (error) {
        logger.error("Error shutting down workflow registry", error);
      }
    }
    if (this._agentRegistry) {
      try {
        await this._agentRegistry.dispose();
        this._agentRegistry = null;
        logger.debug("Agent registry shutdown complete");
      } catch (error) {
        logger.error("Error shutting down agent registry", error);
      }
    }
    if (this._cache) {
      try {
        this._cache.save();
        this._cache = null;
        logger.debug("Cache shutdown complete");
      } catch (error) {
        logger.error("Error shutting down cache", error);
      }
    }
    if (this._database) {
      try {
        this._database.close();
        this._database = null;
        logger.debug("Database shutdown complete");
      } catch (error) {
        logger.error("Error shutting down database", error);
      }
    }
  }
  /**
   * Check if services are initialized
   */
  isInitialized() {
    return this._initialized;
  }
  // ============================================================================
  // Health Check Methods
  // ============================================================================
  /**
   * Get comprehensive health status
   */
  getHealth() {
    const components = [];
    const now = /* @__PURE__ */ new Date();
    components.push(this._checkDatabaseHealth(now));
    components.push(this._checkCacheHealth(now));
    components.push(this._checkAgentRegistryHealth(now));
    components.push(this._checkWorkflowRegistryHealth(now));
    const unhealthyCount = components.filter((c) => !c.healthy).length;
    const overallHealthy = unhealthyCount === 0;
    const status = unhealthyCount === 0 ? "healthy" : unhealthyCount < 2 ? "degraded" : "unhealthy";
    const memUsage = process.memoryUsage();
    return {
      healthy: overallHealthy,
      status,
      components,
      uptime: this._initialized ? Date.now() - this._startTime : 0,
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
  _checkDatabaseHealth(now) {
    if (!this._database) {
      return {
        name: "database",
        healthy: false,
        message: "Not initialized",
        lastCheck: now
      };
    }
    try {
      const stats = this._database.getStats();
      return {
        name: "database",
        healthy: true,
        message: "Connected",
        metrics: {
          nodes: stats.totalNodes,
          edges: stats.totalEdges
        },
        lastCheck: now
      };
    } catch (error) {
      return {
        name: "database",
        healthy: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        lastCheck: now
      };
    }
  }
  _checkCacheHealth(now) {
    if (!this._cache) {
      return {
        name: "cache",
        healthy: !this._config.cache.enabled,
        // Healthy if disabled
        message: this._config.cache.enabled ? "Not initialized" : "Disabled",
        lastCheck: now
      };
    }
    try {
      const stats = this._cache.getStats();
      return {
        name: "cache",
        healthy: true,
        message: "Operational",
        metrics: {
          entries: stats.totalEntries,
          hitRate: Math.round(stats.hitRate * 100),
          size: stats.sizeBytes
        },
        lastCheck: now
      };
    } catch (error) {
      return {
        name: "cache",
        healthy: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        lastCheck: now
      };
    }
  }
  _checkAgentRegistryHealth(now) {
    if (!this._agentRegistry) {
      return {
        name: "agentRegistry",
        healthy: false,
        message: "Not initialized",
        lastCheck: now
      };
    }
    try {
      const stats = this._agentRegistry.getStats();
      return {
        name: "agentRegistry",
        healthy: true,
        message: "Operational",
        metrics: {
          registeredTypes: stats.registeredTypes,
          activeInstances: stats.totalInstances
        },
        lastCheck: now
      };
    } catch (error) {
      return {
        name: "agentRegistry",
        healthy: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        lastCheck: now
      };
    }
  }
  _checkWorkflowRegistryHealth(now) {
    if (!this._workflowRegistry) {
      return {
        name: "workflowRegistry",
        healthy: false,
        message: "Not initialized",
        lastCheck: now
      };
    }
    try {
      const workflows = this._workflowRegistry.list();
      const history = this._workflowRegistry.getHistory({ limit: 100 });
      const completedCount = history.filter((e) => e.status === "completed").length;
      return {
        name: "workflowRegistry",
        healthy: true,
        message: "Operational",
        metrics: {
          registeredWorkflows: workflows.length,
          historyEntries: history.length,
          completedExecutions: completedCount
        },
        lastCheck: now
      };
    } catch (error) {
      return {
        name: "workflowRegistry",
        healthy: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        lastCheck: now
      };
    }
  }
  // ============================================================================
  // Event Helpers
  // ============================================================================
  /**
   * Emit a typed event
   */
  emit(event, data) {
    this._eventBus.emit(event, {
      timestamp: /* @__PURE__ */ new Date(),
      ...data
    });
  }
  /**
   * Subscribe to events
   */
  on(event, listener) {
    this._eventBus.on(event, listener);
  }
  /**
   * Unsubscribe from events
   */
  off(event, listener) {
    this._eventBus.off(event, listener);
  }
}
async function createSharedServices(config) {
  const fullConfig = {
    ...createDefaultConfig(config.projectRoot),
    ...config
  };
  const services = SharedServices.getInstance(fullConfig);
  await services.initialize();
  return services;
}
function getSharedServices() {
  if (!SharedServices.hasInstance()) {
    throw new Error("SharedServices not initialized. Call createSharedServices() first.");
  }
  return SharedServices.getInstance({});
}
export {
  SharedServices,
  createDefaultConfig,
  createSharedServices,
  getSharedServices
};
//# sourceMappingURL=shared-services.js.map
