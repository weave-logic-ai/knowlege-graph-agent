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
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { KnowledgeGraphDatabase, createDatabase } from '../core/database.js';
import { ShadowCache, createShadowCache } from '../core/cache.js';
import { AgentRegistry, createRegistry } from '../agents/registry.js';
import { WorkflowRegistry, createWorkflowRegistry } from '../workflows/registry.js';
import { createLogger } from '../utils/index.js';
import type {
  ServerConfig,
  ISharedServices,
  HealthStatus,
  ComponentHealth,
} from './types.js';

const logger = createLogger('shared-services');

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Create default server configuration
 */
export function createDefaultConfig(projectRoot: string): ServerConfig {
  return {
    projectRoot,
    mcp: {
      enabled: false,
      name: 'knowledge-graph-mcp-server',
      version: '0.4.0',
    },
    graphql: {
      enabled: false,
      port: 4000,
      playground: true,
      introspection: true,
    },
    dashboard: {
      enabled: false,
      port: 3000,
      hotReload: process.env.NODE_ENV !== 'production',
    },
    database: {
      path: join(projectRoot, '.kg', 'knowledge.db'),
      wal: true,
      busyTimeout: 5000,
    },
    cache: {
      enabled: true,
      defaultTTL: 3600000, // 1 hour
      maxEntries: 10000,
    },
    verbose: false,
  };
}

// ============================================================================
// Shared Services Implementation
// ============================================================================

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
export class SharedServices implements ISharedServices {
  private static instance: SharedServices | null = null;

  private _database: KnowledgeGraphDatabase | null = null;
  private _cache: ShadowCache | null = null;
  private _agentRegistry: AgentRegistry | null = null;
  private _workflowRegistry: WorkflowRegistry | null = null;
  private _eventBus: EventEmitter;
  private _config: ServerConfig;
  private _projectRoot: string;
  private _initialized: boolean = false;
  private _initPromise: Promise<void> | null = null;
  private _startTime: number = 0;

  /**
   * Private constructor - use getInstance() instead
   */
  private constructor(config: ServerConfig) {
    this._config = config;
    this._projectRoot = config.projectRoot;
    this._eventBus = new EventEmitter();

    // Increase max listeners for busy systems
    this._eventBus.setMaxListeners(100);

    logger.debug('SharedServices instance created', {
      projectRoot: this._projectRoot,
    });
  }

  /**
   * Get or create the singleton instance
   */
  static getInstance(config: ServerConfig): SharedServices {
    if (!SharedServices.instance) {
      SharedServices.instance = new SharedServices(config);
    } else {
      // Update config if instance exists
      SharedServices.instance._config = config;
      SharedServices.instance._projectRoot = config.projectRoot;
    }
    return SharedServices.instance;
  }

  /**
   * Check if instance exists
   */
  static hasInstance(): boolean {
    return SharedServices.instance !== null;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  static async resetInstance(): Promise<void> {
    if (SharedServices.instance) {
      await SharedServices.instance.shutdown();
      SharedServices.instance = null;
    }
  }

  // ============================================================================
  // Property Accessors
  // ============================================================================

  get database(): KnowledgeGraphDatabase {
    if (!this._database) {
      throw new Error('SharedServices not initialized. Call initialize() first.');
    }
    return this._database;
  }

  get cache(): ShadowCache {
    if (!this._cache) {
      throw new Error('SharedServices not initialized. Call initialize() first.');
    }
    return this._cache;
  }

  get agentRegistry(): AgentRegistry {
    if (!this._agentRegistry) {
      throw new Error('SharedServices not initialized. Call initialize() first.');
    }
    return this._agentRegistry;
  }

  get workflowRegistry(): WorkflowRegistry {
    if (!this._workflowRegistry) {
      throw new Error('SharedServices not initialized. Call initialize() first.');
    }
    return this._workflowRegistry;
  }

  get eventBus(): EventEmitter {
    return this._eventBus;
  }

  get projectRoot(): string {
    return this._projectRoot;
  }

  get config(): ServerConfig {
    return this._config;
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  /**
   * Initialize all shared services
   */
  async initialize(): Promise<void> {
    // Return existing promise if already initializing
    if (this._initPromise) {
      return this._initPromise;
    }

    // Return immediately if already initialized
    if (this._initialized) {
      logger.debug('SharedServices already initialized');
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
  private async _doInitialize(): Promise<void> {
    logger.info('Initializing SharedServices...');
    this._startTime = Date.now();

    try {
      // Ensure .kg directory exists
      const kgDir = join(this._projectRoot, '.kg');
      if (!existsSync(kgDir)) {
        mkdirSync(kgDir, { recursive: true });
        logger.debug('Created .kg directory');
      }

      // Initialize database
      logger.debug('Initializing database...');
      this._database = createDatabase(this._config.database.path);
      this._eventBus.emit('service:initialized', { service: 'database' });

      // Initialize cache
      if (this._config.cache.enabled) {
        logger.debug('Initializing cache...');
        this._cache = createShadowCache({
          projectRoot: this._projectRoot,
          defaultTTL: this._config.cache.defaultTTL,
          maxEntries: this._config.cache.maxEntries,
        });
        this._eventBus.emit('service:initialized', { service: 'cache' });
      } else {
        // Create minimal cache even if disabled
        this._cache = createShadowCache({
          projectRoot: this._projectRoot,
          persist: false,
        });
      }

      // Initialize agent registry
      logger.debug('Initializing agent registry...');
      this._agentRegistry = createRegistry({
        enableHealthMonitoring: true,
        healthCheckInterval: 30000,
      });
      this._eventBus.emit('service:initialized', { service: 'agentRegistry' });

      // Initialize workflow registry
      logger.debug('Initializing workflow registry...');
      this._workflowRegistry = createWorkflowRegistry({
        maxConcurrentExecutions: 10,
        persistHistory: true,
        maxHistoryEntries: 1000,
      });
      this._eventBus.emit('service:initialized', { service: 'workflowRegistry' });

      this._initialized = true;

      const initTime = Date.now() - this._startTime;
      logger.info('SharedServices initialized successfully', {
        initTimeMs: initTime,
        databasePath: this._config.database.path,
      });

      this._eventBus.emit('services:ready', {
        initTimeMs: initTime,
      });
    } catch (error) {
      logger.error(
        'Failed to initialize SharedServices',
        error instanceof Error ? error : new Error(String(error))
      );

      // Cleanup partial initialization
      await this._cleanup();

      throw error;
    }
  }

  /**
   * Shutdown all shared services
   */
  async shutdown(): Promise<void> {
    if (!this._initialized) {
      logger.debug('SharedServices not initialized, nothing to shutdown');
      return;
    }

    logger.info('Shutting down SharedServices...');
    this._eventBus.emit('services:stopping');

    await this._cleanup();

    this._initialized = false;
    logger.info('SharedServices shutdown complete');

    this._eventBus.emit('services:stopped');
  }

  /**
   * Internal cleanup logic
   */
  private async _cleanup(): Promise<void> {
    // Shutdown workflow registry
    if (this._workflowRegistry) {
      try {
        // Clear any active workflows
        this._workflowRegistry.clear();
        this._workflowRegistry = null;
        logger.debug('Workflow registry shutdown complete');
      } catch (error) {
        logger.error('Error shutting down workflow registry', error as Error);
      }
    }

    // Shutdown agent registry
    if (this._agentRegistry) {
      try {
        await this._agentRegistry.dispose();
        this._agentRegistry = null;
        logger.debug('Agent registry shutdown complete');
      } catch (error) {
        logger.error('Error shutting down agent registry', error as Error);
      }
    }

    // Shutdown cache
    if (this._cache) {
      try {
        // Save cache to disk if persistence enabled
        this._cache.save();
        this._cache = null;
        logger.debug('Cache shutdown complete');
      } catch (error) {
        logger.error('Error shutting down cache', error as Error);
      }
    }

    // Shutdown database (last to ensure other services can write final state)
    if (this._database) {
      try {
        this._database.close();
        this._database = null;
        logger.debug('Database shutdown complete');
      } catch (error) {
        logger.error('Error shutting down database', error as Error);
      }
    }
  }

  /**
   * Check if services are initialized
   */
  isInitialized(): boolean {
    return this._initialized;
  }

  // ============================================================================
  // Health Check Methods
  // ============================================================================

  /**
   * Get comprehensive health status
   */
  getHealth(): HealthStatus {
    const components: ComponentHealth[] = [];
    const now = new Date();

    // Database health
    components.push(this._checkDatabaseHealth(now));

    // Cache health
    components.push(this._checkCacheHealth(now));

    // Agent registry health
    components.push(this._checkAgentRegistryHealth(now));

    // Workflow registry health
    components.push(this._checkWorkflowRegistryHealth(now));

    // Calculate overall health
    const unhealthyCount = components.filter((c) => !c.healthy).length;
    const overallHealthy = unhealthyCount === 0;
    const status: HealthStatus['status'] =
      unhealthyCount === 0 ? 'healthy' : unhealthyCount < 2 ? 'degraded' : 'unhealthy';

    // Memory usage
    const memUsage = process.memoryUsage();

    return {
      healthy: overallHealthy,
      status,
      components,
      uptime: this._initialized ? Date.now() - this._startTime : 0,
      totalRequests: 0, // Updated by server manager
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      },
    };
  }

  private _checkDatabaseHealth(now: Date): ComponentHealth {
    if (!this._database) {
      return {
        name: 'database',
        healthy: false,
        message: 'Not initialized',
        lastCheck: now,
      };
    }

    try {
      // Simple health check query
      const stats = this._database.getStats();
      return {
        name: 'database',
        healthy: true,
        message: 'Connected',
        metrics: {
          nodes: stats.totalNodes,
          edges: stats.totalEdges,
        },
        lastCheck: now,
      };
    } catch (error) {
      return {
        name: 'database',
        healthy: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        lastCheck: now,
      };
    }
  }

  private _checkCacheHealth(now: Date): ComponentHealth {
    if (!this._cache) {
      return {
        name: 'cache',
        healthy: !this._config.cache.enabled, // Healthy if disabled
        message: this._config.cache.enabled ? 'Not initialized' : 'Disabled',
        lastCheck: now,
      };
    }

    try {
      const stats = this._cache.getStats();
      return {
        name: 'cache',
        healthy: true,
        message: 'Operational',
        metrics: {
          entries: stats.totalEntries,
          hitRate: Math.round(stats.hitRate * 100),
          size: stats.sizeBytes,
        },
        lastCheck: now,
      };
    } catch (error) {
      return {
        name: 'cache',
        healthy: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        lastCheck: now,
      };
    }
  }

  private _checkAgentRegistryHealth(now: Date): ComponentHealth {
    if (!this._agentRegistry) {
      return {
        name: 'agentRegistry',
        healthy: false,
        message: 'Not initialized',
        lastCheck: now,
      };
    }

    try {
      const stats = this._agentRegistry.getStats();
      return {
        name: 'agentRegistry',
        healthy: true,
        message: 'Operational',
        metrics: {
          registeredTypes: stats.registeredTypes,
          activeInstances: stats.totalInstances,
        },
        lastCheck: now,
      };
    } catch (error) {
      return {
        name: 'agentRegistry',
        healthy: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        lastCheck: now,
      };
    }
  }

  private _checkWorkflowRegistryHealth(now: Date): ComponentHealth {
    if (!this._workflowRegistry) {
      return {
        name: 'workflowRegistry',
        healthy: false,
        message: 'Not initialized',
        lastCheck: now,
      };
    }

    try {
      // Get basic stats from registry
      const workflows = this._workflowRegistry.list();
      const history = this._workflowRegistry.getHistory({ limit: 100 });
      const completedCount = history.filter(e => e.status === 'completed').length;

      return {
        name: 'workflowRegistry',
        healthy: true,
        message: 'Operational',
        metrics: {
          registeredWorkflows: workflows.length,
          historyEntries: history.length,
          completedExecutions: completedCount,
        },
        lastCheck: now,
      };
    } catch (error) {
      return {
        name: 'workflowRegistry',
        healthy: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        lastCheck: now,
      };
    }
  }

  // ============================================================================
  // Event Helpers
  // ============================================================================

  /**
   * Emit a typed event
   */
  emit(event: string, data?: Record<string, unknown>): void {
    this._eventBus.emit(event, {
      timestamp: new Date(),
      ...data,
    });
  }

  /**
   * Subscribe to events
   */
  on(event: string, listener: (...args: unknown[]) => void): void {
    this._eventBus.on(event, listener);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, listener: (...args: unknown[]) => void): void {
    this._eventBus.off(event, listener);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create and initialize shared services
 */
export async function createSharedServices(
  config: Partial<ServerConfig> & { projectRoot: string }
): Promise<SharedServices> {
  const fullConfig: ServerConfig = {
    ...createDefaultConfig(config.projectRoot),
    ...config,
  };

  const services = SharedServices.getInstance(fullConfig);
  await services.initialize();

  return services;
}

/**
 * Get existing shared services instance
 * @throws Error if not initialized
 */
export function getSharedServices(): SharedServices {
  if (!SharedServices.hasInstance()) {
    throw new Error('SharedServices not initialized. Call createSharedServices() first.');
  }
  return SharedServices.getInstance({} as ServerConfig);
}
