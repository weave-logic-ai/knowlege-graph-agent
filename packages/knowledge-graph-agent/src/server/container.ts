/**
 * Service Container - Singleton Pattern for Concurrent Server Execution
 *
 * Provides a centralized container for managing all shared services across
 * MCP, GraphQL, and Dashboard servers. Implements lazy initialization,
 * dependency injection, and coordinated lifecycle management.
 *
 * @module server/container
 */

import { join, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { KnowledgeGraphDatabase, createDatabase } from '../core/database.js';
import { AdvancedCache, createAdvancedCache } from '../caching/index.js';
import { ConfigManager } from '../config/manager.js';
import {
  HealthMonitor,
  createHealthMonitor,
  createMemoryCheck,
  createDatabaseCheck,
  type SystemHealth,
} from '../health/index.js';
import { AgentRegistry, createRegistry } from '../agents/registry.js';
import { WorkflowRegistry, createWorkflowRegistry } from '../workflows/registry.js';
import { ServiceManager, createServiceManager } from '../services/manager.js';
import { TypedEventBus, createTypedEventBus } from './event-bus.js';
import { createLogger } from '../utils/index.js';
import type { HealthStatus, ComponentHealth } from './types.js';
import type { CacheConfig } from '../caching/index.js';
import type { PluginManager } from '../plugins/types.js';

const logger = createLogger('service-container');

/**
 * Emit a container lifecycle event using the underlying emitter
 */
function emitContainerEvent(
  eventBus: TypedEventBus,
  type: ContainerEventType,
  source: string,
  data: Record<string, unknown>
): void {
  const emitter = eventBus.getEmitter();
  emitter.emit(type, {
    type,
    source,
    timestamp: new Date(),
    data,
  });
}

// ============================================================================
// Types
// ============================================================================

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
  priority: number; // Lower = earlier initialization
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
export type ContainerEventType =
  | 'service:initializing'
  | 'service:initialized'
  | 'service:failed'
  | 'service:shutting-down'
  | 'container:ready'
  | 'container:shutdown';

// ============================================================================
// Service Container Implementation
// ============================================================================

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
export class ServiceContainer {
  private static instance: ServiceContainer | null = null;
  private static instanceLock = false;

  // Service instances (lazy initialized)
  private _database: KnowledgeGraphDatabase | null = null;
  private _cache: AdvancedCache | null = null;
  private _configManager: ConfigManager | null = null;
  private _healthMonitor: HealthMonitor | null = null;
  private _agentRegistry: AgentRegistry | null = null;
  private _workflowRegistry: WorkflowRegistry | null = null;
  private _pluginManager: PluginManager | null = null;
  private _eventBus: TypedEventBus;
  private _serviceManager: ServiceManager | null = null;

  // State tracking
  private _config: ContainerConfig;
  private _initState: ServiceInitState = 'uninitialized';
  private _initPromise: Promise<void> | null = null;
  private _startTime: number = 0;
  private _shutdownInProgress = false;

  // Service initialization tracking
  private _serviceStates: Map<string, ServiceInitState> = new Map();

  /**
   * Private constructor - use getInstance() instead
   */
  private constructor(config: ContainerConfig) {
    this._config = this.normalizeConfig(config);
    this._eventBus = createTypedEventBus({
      maxHistorySize: 1000,
      historyRetention: 60 * 60 * 1000, // 1 hour
      debugEvents: config.verbose ?? false,
    });

    // Initialize service state tracking
    this.initializeServiceStates();

    logger.debug('ServiceContainer instance created', {
      projectRoot: this._config.projectRoot,
    });
  }

  /**
   * Normalize and validate configuration
   */
  private normalizeConfig(config: ContainerConfig): ContainerConfig {
    return {
      projectRoot: resolve(config.projectRoot),
      databasePath: config.databasePath ?? '.kg/knowledge.db',
      walMode: config.walMode ?? true,
      cache: {
        maxSize: config.cache?.maxSize ?? 100 * 1024 * 1024, // 100MB
        maxEntries: config.cache?.maxEntries ?? 10000,
        defaultTtl: config.cache?.defaultTtl ?? 3600000, // 1 hour
        evictionPolicy: config.cache?.evictionPolicy ?? 'lru',
      },
      enableHealthMonitoring: config.enableHealthMonitoring ?? true,
      healthCheckInterval: config.healthCheckInterval ?? 60000,
      maxAgentsPerType: config.maxAgentsPerType ?? 10,
      verbose: config.verbose ?? false,
    };
  }

  /**
   * Initialize service state tracking
   */
  private initializeServiceStates(): void {
    const services = [
      'database',
      'cache',
      'configManager',
      'healthMonitor',
      'agentRegistry',
      'workflowRegistry',
      'serviceManager',
      'pluginManager',
    ];

    for (const service of services) {
      this._serviceStates.set(service, 'uninitialized');
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
  static getInstance(config?: ContainerConfig): ServiceContainer {
    if (ServiceContainer.instance) {
      // Update config if provided
      if (config) {
        ServiceContainer.instance._config = ServiceContainer.instance.normalizeConfig(config);
      }
      return ServiceContainer.instance;
    }

    if (!config) {
      throw new Error('ServiceContainer not initialized. Provide config.');
    }

    // Prevent concurrent instance creation
    if (ServiceContainer.instanceLock) {
      throw new Error('ServiceContainer is being initialized by another caller.');
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
  static hasInstance(): boolean {
    return ServiceContainer.instance !== null;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  static async resetInstance(): Promise<void> {
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
  getDatabase(): KnowledgeGraphDatabase {
    this.assertInitialized();
    if (!this._database) {
      throw new Error('Database not initialized');
    }
    return this._database;
  }

  /**
   * Get the advanced cache instance
   * @throws Error if container not initialized
   */
  getCache(): AdvancedCache {
    this.assertInitialized();
    if (!this._cache) {
      throw new Error('Cache not initialized');
    }
    return this._cache;
  }

  /**
   * Get the configuration manager
   * @throws Error if container not initialized
   */
  getConfig(): ConfigManager {
    this.assertInitialized();
    if (!this._configManager) {
      throw new Error('ConfigManager not initialized');
    }
    return this._configManager;
  }

  /**
   * Get the health monitor
   * @throws Error if container not initialized
   */
  getHealthMonitor(): HealthMonitor {
    this.assertInitialized();
    if (!this._healthMonitor) {
      throw new Error('HealthMonitor not initialized');
    }
    return this._healthMonitor;
  }

  /**
   * Get the agent registry
   * @throws Error if container not initialized
   */
  getAgentRegistry(): AgentRegistry {
    this.assertInitialized();
    if (!this._agentRegistry) {
      throw new Error('AgentRegistry not initialized');
    }
    return this._agentRegistry;
  }

  /**
   * Get the workflow registry
   * @throws Error if container not initialized
   */
  getWorkflowRegistry(): WorkflowRegistry {
    this.assertInitialized();
    if (!this._workflowRegistry) {
      throw new Error('WorkflowRegistry not initialized');
    }
    return this._workflowRegistry;
  }

  /**
   * Get the plugin manager (if available)
   */
  getPluginManager(): PluginManager | null {
    this.assertInitialized();
    return this._pluginManager;
  }

  /**
   * Get the typed event bus for cross-service communication
   */
  getEventBus(): TypedEventBus {
    return this._eventBus;
  }

  /**
   * Get the service manager for background services
   * @throws Error if container not initialized
   */
  getServiceManager(): ServiceManager {
    this.assertInitialized();
    if (!this._serviceManager) {
      throw new Error('ServiceManager not initialized');
    }
    return this._serviceManager;
  }

  /**
   * Get the project root directory
   */
  getProjectRoot(): string {
    return this._config.projectRoot;
  }

  /**
   * Get the container configuration
   */
  getContainerConfig(): Readonly<ContainerConfig> {
    return Object.freeze({ ...this._config });
  }

  // ============================================================================
  // Lifecycle Management
  // ============================================================================

  /**
   * Initialize all services in dependency order
   */
  async initialize(): Promise<void> {
    // Return existing promise if already initializing
    if (this._initPromise) {
      return this._initPromise;
    }

    // Return immediately if already initialized
    if (this._initState === 'initialized') {
      logger.debug('ServiceContainer already initialized');
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
  private async _doInitialize(): Promise<void> {
    if (this._initState === 'initializing') {
      throw new Error('Initialization already in progress');
    }

    this._initState = 'initializing';
    this._startTime = Date.now();

    logger.info('Initializing ServiceContainer...');
    emitContainerEvent(this._eventBus, 'container:initializing' as ContainerEventType, 'container', {});

    try {
      // Ensure .kg directory exists
      await this.ensureDirectories();

      // Initialize services in dependency order
      // Phase 1: Core services (no dependencies)
      await this.initializeService('configManager', () => this.initConfigManager());
      await this.initializeService('database', () => this.initDatabase());
      await this.initializeService('cache', () => this.initCache());

      // Phase 2: Dependent services
      await this.initializeService('healthMonitor', () => this.initHealthMonitor());
      await this.initializeService('serviceManager', () => this.initServiceManager());

      // Phase 3: High-level services
      await this.initializeService('agentRegistry', () => this.initAgentRegistry());
      await this.initializeService('workflowRegistry', () => this.initWorkflowRegistry());

      // Phase 4: Optional services
      // Plugin manager initialization would go here when implemented

      this._initState = 'initialized';

      const initTime = Date.now() - this._startTime;
      logger.info('ServiceContainer initialized successfully', {
        initTimeMs: initTime,
        services: Array.from(this._serviceStates.entries())
          .filter(([, state]) => state === 'initialized')
          .map(([name]) => name),
      });

      emitContainerEvent(this._eventBus, 'container:ready', 'container', {
        initTimeMs: initTime,
      });
    } catch (error) {
      this._initState = 'failed';

      logger.error(
        'Failed to initialize ServiceContainer',
        error instanceof Error ? error : new Error(String(error))
      );

      emitContainerEvent(this._eventBus, 'container:failed' as ContainerEventType, 'container', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Cleanup partial initialization
      await this._cleanup();

      throw error;
    }
  }

  /**
   * Initialize a single service with state tracking
   */
  private async initializeService(
    name: string,
    initializer: () => Promise<void>
  ): Promise<void> {
    this._serviceStates.set(name, 'initializing');
    emitContainerEvent(this._eventBus, 'service:initializing', 'container', { service: name });

    try {
      await initializer();
      this._serviceStates.set(name, 'initialized');
      emitContainerEvent(this._eventBus, 'service:initialized', 'container', { service: name });
      logger.debug(`Service initialized: ${name}`);
    } catch (error) {
      this._serviceStates.set(name, 'failed');
      emitContainerEvent(this._eventBus, 'service:failed', 'container', {
        service: name,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    const kgDir = join(this._config.projectRoot, '.kg');
    if (!existsSync(kgDir)) {
      mkdirSync(kgDir, { recursive: true });
      logger.debug('Created .kg directory');
    }
  }

  // ============================================================================
  // Service Initializers
  // ============================================================================

  private async initConfigManager(): Promise<void> {
    this._configManager = new ConfigManager(this._config.projectRoot);
  }

  private async initDatabase(): Promise<void> {
    const dbPath = join(this._config.projectRoot, this._config.databasePath!);
    this._database = createDatabase(dbPath);
    logger.debug('Database initialized', { path: dbPath });
  }

  private async initCache(): Promise<void> {
    this._cache = createAdvancedCache({
      maxSize: this._config.cache?.maxSize,
      maxEntries: this._config.cache?.maxEntries,
      defaultTtl: this._config.cache?.defaultTtl,
      evictionPolicy: this._config.cache?.evictionPolicy,
      enableStats: true,
    });
    logger.debug('Cache initialized');
  }

  private async initHealthMonitor(): Promise<void> {
    this._healthMonitor = createHealthMonitor({
      interval: this._config.healthCheckInterval,
      autoStart: false,
    });

    // Register built-in health checks
    this._healthMonitor.register(createMemoryCheck(85)); // 85% threshold

    if (this._database) {
      const dbPath = join(this._config.projectRoot, this._config.databasePath!);
      this._healthMonitor.register(createDatabaseCheck(dbPath));
    }

    if (this._config.enableHealthMonitoring) {
      this._healthMonitor.start();
    }

    logger.debug('Health monitor initialized');
  }

  private async initServiceManager(): Promise<void> {
    this._serviceManager = createServiceManager();
    logger.debug('Service manager initialized');
  }

  private async initAgentRegistry(): Promise<void> {
    this._agentRegistry = createRegistry({
      enableHealthMonitoring: this._config.enableHealthMonitoring,
      healthCheckInterval: this._config.healthCheckInterval,
      maxAgentsPerType: this._config.maxAgentsPerType,
    });
    logger.debug('Agent registry initialized');
  }

  private async initWorkflowRegistry(): Promise<void> {
    this._workflowRegistry = createWorkflowRegistry({
      maxConcurrentExecutions: 10,
      persistHistory: true,
      maxHistoryEntries: 1000,
    });
    logger.debug('Workflow registry initialized');
  }

  // ============================================================================
  // Shutdown
  // ============================================================================

  /**
   * Gracefully shutdown all services in reverse dependency order
   */
  async shutdown(): Promise<void> {
    if (this._shutdownInProgress) {
      logger.warn('Shutdown already in progress');
      return;
    }

    if (this._initState === 'uninitialized') {
      logger.debug('ServiceContainer not initialized, nothing to shutdown');
      return;
    }

    this._shutdownInProgress = true;
    logger.info('Shutting down ServiceContainer...');
    emitContainerEvent(this._eventBus, 'container:shutdown', 'container', {});

    await this._cleanup();

    this._initState = 'uninitialized';
    this._shutdownInProgress = false;

    logger.info('ServiceContainer shutdown complete');
  }

  /**
   * Internal cleanup logic - shutdown services in reverse order
   */
  private async _cleanup(): Promise<void> {
    // Shutdown in reverse dependency order

    // Phase 4: Optional services (first to shutdown)
    // Plugin manager would be cleaned up here

    // Phase 3: High-level services
    await this.shutdownService('workflowRegistry', async () => {
      if (this._workflowRegistry) {
        // WorkflowRegistry doesn't have a dispose, but we can clear active executions
        this._workflowRegistry.clear();
        this._workflowRegistry = null;
      }
    });

    await this.shutdownService('agentRegistry', async () => {
      if (this._agentRegistry) {
        await this._agentRegistry.dispose();
        this._agentRegistry = null;
      }
    });

    // Phase 2: Dependent services
    await this.shutdownService('serviceManager', async () => {
      if (this._serviceManager) {
        await this._serviceManager.shutdown();
        this._serviceManager = null;
      }
    });

    await this.shutdownService('healthMonitor', async () => {
      if (this._healthMonitor) {
        this._healthMonitor.stop();
        this._healthMonitor = null;
      }
    });

    // Phase 1: Core services (last to shutdown)
    await this.shutdownService('cache', async () => {
      if (this._cache) {
        // AdvancedCache doesn't have explicit cleanup, just clear
        this._cache.clear();
        this._cache = null;
      }
    });

    await this.shutdownService('database', async () => {
      if (this._database) {
        this._database.close();
        this._database = null;
      }
    });

    await this.shutdownService('configManager', async () => {
      if (this._configManager) {
        // Save any pending config changes
        try {
          this._configManager.save();
        } catch {
          // Ignore save errors during shutdown
        }
        this._configManager = null;
      }
    });
  }

  /**
   * Shutdown a single service with error handling
   */
  private async shutdownService(
    name: string,
    cleanup: () => Promise<void>
  ): Promise<void> {
    if (this._serviceStates.get(name) !== 'initialized') {
      return;
    }

    emitContainerEvent(this._eventBus, 'service:shutting-down', 'container', { service: name });

    try {
      await cleanup();
      this._serviceStates.set(name, 'uninitialized');
      logger.debug(`Service shutdown complete: ${name}`);
    } catch (error) {
      logger.error(`Error shutting down ${name}`, error as Error);
      this._serviceStates.set(name, 'failed');
    }
  }

  // ============================================================================
  // Health & Status
  // ============================================================================

  /**
   * Check if container is initialized
   */
  isInitialized(): boolean {
    return this._initState === 'initialized';
  }

  /**
   * Get initialization state
   */
  getInitState(): ServiceInitState {
    return this._initState;
  }

  /**
   * Get individual service states
   */
  getServiceStates(): Map<string, ServiceInitState> {
    return new Map(this._serviceStates);
  }

  /**
   * Get comprehensive health status
   */
  getHealth(): HealthStatus {
    const components: ComponentHealth[] = [];
    const now = new Date();

    // Check each service
    const serviceEntries = Array.from(this._serviceStates.entries());
    for (const [name, state] of serviceEntries) {
      components.push({
        name,
        healthy: state === 'initialized',
        message: state,
        lastCheck: now,
      });
    }

    // Add health monitor results if available
    if (this._healthMonitor && this._initState === 'initialized') {
      try {
        const systemHealth = this._healthMonitor.getLastStatus();
        for (const component of systemHealth.components) {
          components.push({
            name: `monitor:${component.name}`,
            healthy: component.status === 'healthy',
            message: component.message,
            metrics: component.metadata as Record<string, number | string> | undefined,
            lastCheck: component.lastCheck,
          });
        }
      } catch {
        // Health monitor might not be ready
      }
    }

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
      uptime: this._initState === 'initialized' ? Date.now() - this._startTime : 0,
      totalRequests: 0, // Updated by server manager
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      },
    };
  }

  /**
   * Get uptime in milliseconds
   */
  getUptime(): number {
    if (this._initState !== 'initialized') {
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
  private assertInitialized(): void {
    if (this._initState !== 'initialized') {
      throw new Error('ServiceContainer not initialized. Call initialize() first.');
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create and initialize a service container
 *
 * @param config - Container configuration
 * @returns Initialized ServiceContainer
 */
export async function createServiceContainer(
  config: ContainerConfig
): Promise<ServiceContainer> {
  const container = ServiceContainer.getInstance(config);
  await container.initialize();
  return container;
}

/**
 * Get existing service container instance
 *
 * @returns ServiceContainer if initialized
 * @throws Error if not initialized
 */
export function getServiceContainer(): ServiceContainer {
  if (!ServiceContainer.hasInstance()) {
    throw new Error('ServiceContainer not initialized. Call createServiceContainer() first.');
  }
  return ServiceContainer.getInstance();
}

/**
 * Check if service container is available
 */
export function hasServiceContainer(): boolean {
  return ServiceContainer.hasInstance();
}

/**
 * Shutdown and reset the service container
 */
export async function shutdownServiceContainer(): Promise<void> {
  await ServiceContainer.resetInstance();
}
