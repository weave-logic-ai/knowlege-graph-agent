/**
 * Plugin Manager - Plugin lifecycle and coordination
 *
 * Provides centralized management for plugins including:
 * - Plugin discovery, loading, and initialization
 * - Lifecycle management (install, enable, disable, uninstall)
 * - Hook invocation with dependency ordering
 * - Plugin isolation and error handling
 * - Plugin context provisioning
 *
 * @module plugins/manager
 */

import { EventEmitter } from 'events';
import { resolve, dirname } from 'path';
import { pathToFileURL } from 'url';
import { createLogger } from '../utils/index.js';
import type { KnowledgeGraphManager } from '../core/graph.js';
import type { KGConfiguration } from '../config/types.js';
import type { Logger } from '../utils/logger.js';
import type {
  KGPlugin,
  PluginType,
  PluginHook,
  PluginStatus,
  PluginMetadata,
  PluginContext,
  PluginAPI,
  PluginCommand,
  PluginEventEmitter,
  KGPluginManifest,
  PluginLoader,
  PluginRegistry,
  PluginManager,
  PluginManagerConfig,
  PluginLoadOptions,
  PluginLoadResult,
  DiscoveredPlugin,
  PluginRegistryEvents,
  AnalyzerPlugin,
  KnowledgeGraphDatabase,
  ShadowCache,
  PluginModuleExport,
} from './types.js';
import { isAnalyzerPlugin, createDefaultPluginMetadata } from './types.js';

const logger = createLogger('plugin-manager');

// ============================================================================
// Plugin Event Emitter Implementation
// ============================================================================

/**
 * Plugin event emitter for inter-plugin communication
 */
class PluginEventEmitterImpl extends EventEmitter implements PluginEventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }
}

// ============================================================================
// Plugin Registry Implementation
// ============================================================================

/**
 * Registry for managing loaded plugins
 */
export class PluginRegistryImpl extends EventEmitter implements PluginRegistry {
  private plugins: Map<string, KGPlugin> = new Map();
  private manifests: Map<string, KGPluginManifest> = new Map();
  private metadata: Map<string, PluginMetadata> = new Map();
  private hookSubscribers: Map<PluginHook, Set<string>> = new Map();

  constructor() {
    super();
    logger.debug('PluginRegistry initialized');
  }

  register(plugin: KGPlugin, manifest: KGPluginManifest): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already registered`);
    }

    this.plugins.set(plugin.name, plugin);
    this.manifests.set(plugin.name, manifest);

    const meta: PluginMetadata = {
      name: plugin.name,
      version: plugin.version,
      type: plugin.type,
      status: 'initialized',
      hooks: manifest['kg-plugin'].hooks ?? [],
      capabilities: manifest['kg-plugin'].capabilities?.map(c => c.name) ?? [],
    };
    this.metadata.set(plugin.name, meta);

    // Register hook subscriptions
    for (const hook of meta.hooks) {
      if (!this.hookSubscribers.has(hook)) {
        this.hookSubscribers.set(hook, new Set());
      }
      this.hookSubscribers.get(hook)!.add(plugin.name);
    }

    logger.info(`Plugin registered: ${plugin.name}@${plugin.version}`, {
      type: plugin.type,
      hooks: meta.hooks.length,
    });

    this.emit('registered', { plugin, metadata: meta });
  }

  unregister(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;

    // Remove hook subscriptions
    for (const [hook, subscribers] of this.hookSubscribers) {
      subscribers.delete(name);
    }

    this.plugins.delete(name);
    this.manifests.delete(name);
    this.metadata.delete(name);

    logger.info(`Plugin unregistered: ${name}`);
    this.emit('unregistered', { name });
    return true;
  }

  get<T extends KGPlugin = KGPlugin>(name: string): T | undefined {
    return this.plugins.get(name) as T | undefined;
  }

  getAll(): KGPlugin[] {
    return Array.from(this.plugins.values());
  }

  getByType<T extends KGPlugin = KGPlugin>(type: PluginType): T[] {
    return this.getAll().filter(p => p.type === type) as T[];
  }

  getAnalyzers(): AnalyzerPlugin[] {
    return this.getAll().filter(isAnalyzerPlugin);
  }

  has(name: string): boolean {
    return this.plugins.has(name);
  }

  getMetadata(name: string): PluginMetadata | undefined {
    return this.metadata.get(name);
  }

  async enable(name: string): Promise<boolean> {
    const meta = this.metadata.get(name);
    if (!meta) return false;

    if (meta.status === 'active') return true;

    meta.status = 'active';
    logger.info(`Plugin enabled: ${name}`);
    this.emit('enabled', { name });
    return true;
  }

  async disable(name: string): Promise<boolean> {
    const meta = this.metadata.get(name);
    if (!meta) return false;

    if (meta.status === 'disabled') return true;

    meta.status = 'disabled';
    logger.info(`Plugin disabled: ${name}`);
    this.emit('disabled', { name });
    return true;
  }

  async executeHook<T = void>(
    hook: PluginHook,
    ...args: unknown[]
  ): Promise<Map<string, T | Error>> {
    const results = new Map<string, T | Error>();
    const subscribers = this.getHookSubscribers(hook);
    const startTime = Date.now();

    // Get plugins sorted by priority
    const sortedPlugins = subscribers
      .map(name => ({
        name,
        plugin: this.plugins.get(name)!,
        manifest: this.manifests.get(name)!,
        meta: this.metadata.get(name)!,
      }))
      .filter(({ meta }) => meta.status === 'active')
      .sort((a, b) => {
        const priorityA = a.manifest['kg-plugin'].priority ?? 100;
        const priorityB = b.manifest['kg-plugin'].priority ?? 100;
        return priorityA - priorityB;
      });

    for (const { name, plugin, meta } of sortedPlugins) {
      try {
        const hookMethod = plugin[hook] as ((...hookArgs: unknown[]) => Promise<T>) | undefined;
        if (typeof hookMethod === 'function') {
          const result = await hookMethod.apply(plugin, args);
          results.set(name, result);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        results.set(name, err);
        meta.status = 'error';
        meta.lastError = err.message;
        logger.error(`Plugin ${name} hook ${hook} failed`, err);
        this.emit('error', { name, error: err });
      }
    }

    const duration = Date.now() - startTime;
    this.emit('hookExecuted', { hook, plugins: subscribers, duration });
    logger.debug(`Hook ${hook} executed`, { plugins: subscribers.length, duration });

    return results;
  }

  getHookSubscribers(hook: PluginHook): string[] {
    return Array.from(this.hookSubscribers.get(hook) ?? []);
  }

  getStats(): {
    totalPlugins: number;
    activePlugins: number;
    disabledPlugins: number;
    errorPlugins: number;
    pluginsByType: Record<PluginType, number>;
    hookSubscriptions: Record<PluginHook, number>;
  } {
    const allMeta = Array.from(this.metadata.values());

    const pluginsByType: Record<PluginType, number> = {
      analyzer: 0,
      transformer: 0,
      exporter: 0,
      importer: 0,
      integration: 0,
      visualization: 0,
      storage: 0,
      agent: 0,
      hook: 0,
      generic: 0,
    };

    for (const meta of allMeta) {
      pluginsByType[meta.type]++;
    }

    const hookSubscriptions: Record<PluginHook, number> = {
      onGraphLoad: 0,
      onGraphSave: 0,
      onNodeAdd: 0,
      onNodeUpdate: 0,
      onNodeRemove: 0,
      onEdgeAdd: 0,
      onEdgeRemove: 0,
      onAnalysisStart: 0,
      onAnalysisComplete: 0,
      onAgentTaskStart: 0,
      onAgentTaskComplete: 0,
      onFileChange: 0,
      onShutdown: 0,
    };

    for (const [hook, subscribers] of this.hookSubscribers) {
      hookSubscriptions[hook] = subscribers.size;
    }

    return {
      totalPlugins: allMeta.length,
      activePlugins: allMeta.filter(m => m.status === 'active').length,
      disabledPlugins: allMeta.filter(m => m.status === 'disabled').length,
      errorPlugins: allMeta.filter(m => m.status === 'error').length,
      pluginsByType,
      hookSubscriptions,
    };
  }

  on<K extends keyof PluginRegistryEvents>(
    event: K,
    listener: (data: PluginRegistryEvents[K]) => void
  ): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }

  off<K extends keyof PluginRegistryEvents>(
    event: K,
    listener: (data: PluginRegistryEvents[K]) => void
  ): this {
    return super.off(event, listener as (...args: unknown[]) => void);
  }

  async clear(): Promise<void> {
    const pluginNames = Array.from(this.plugins.keys());
    for (const name of pluginNames) {
      const plugin = this.plugins.get(name);
      if (plugin?.destroy) {
        try {
          await plugin.destroy();
        } catch (error) {
          logger.error(`Error destroying plugin ${name}`, error instanceof Error ? error : undefined);
        }
      }
      this.unregister(name);
    }
    logger.info('Plugin registry cleared');
  }
}

// ============================================================================
// Plugin Loader Implementation
// ============================================================================

/**
 * Loader for discovering and loading plugins
 */
export class PluginLoaderImpl implements PluginLoader {
  private loadedPlugins: Map<string, KGPlugin> = new Map();
  private loadedMetadata: Map<string, PluginMetadata> = new Map();
  private searchPaths: string[] = [];

  constructor(searchPaths: string[] = []) {
    this.searchPaths = [...searchPaths];
  }

  async discover(): Promise<DiscoveredPlugin[]> {
    const discovered: DiscoveredPlugin[] = [];
    const { readdir, readFile, stat } = await import('fs/promises');

    for (const basePath of this.searchPaths) {
      try {
        const entries = await readdir(basePath, { withFileTypes: true });

        for (const entry of entries) {
          if (!entry.isDirectory()) continue;

          const pluginPath = resolve(basePath, entry.name);
          const packageJsonPath = resolve(pluginPath, 'package.json');

          try {
            const packageStat = await stat(packageJsonPath);
            if (!packageStat.isFile()) continue;

            const content = await readFile(packageJsonPath, 'utf-8');
            const manifest = JSON.parse(content) as KGPluginManifest;

            const validation = this.validateManifest(manifest);

            discovered.push({
              manifest,
              path: pluginPath,
              isLocal: true,
              valid: validation.valid,
              errors: validation.errors.length > 0 ? validation.errors : undefined,
            });
          } catch {
            // Skip directories without valid package.json
          }
        }
      } catch {
        logger.debug(`Search path not accessible: ${basePath}`);
      }
    }

    logger.info(`Discovered ${discovered.length} plugins`, {
      valid: discovered.filter(p => p.valid).length,
      invalid: discovered.filter(p => !p.valid).length,
    });

    return discovered;
  }

  async load(name: string, options: PluginLoadOptions = {}): Promise<PluginLoadResult> {
    const startTime = Date.now();

    // Check if already loaded
    if (!options.force && this.loadedPlugins.has(name)) {
      const plugin = this.loadedPlugins.get(name)!;
      return {
        success: true,
        plugin,
        metadata: this.loadedMetadata.get(name),
        loadTime: Date.now() - startTime,
      };
    }

    // Try to find the plugin in search paths
    for (const basePath of this.searchPaths) {
      const pluginPath = resolve(basePath, name);
      const result = await this.loadFromPath(pluginPath, options);
      if (result.success) {
        return result;
      }
    }

    // Try to load as npm package
    try {
      const modulePath = await import.meta.resolve?.(name) ?? name;
      return await this.loadModule(name, modulePath, options, startTime);
    } catch (error) {
      return {
        success: false,
        error: `Plugin ${name} not found`,
        loadTime: Date.now() - startTime,
      };
    }
  }

  async loadFromPath(path: string, options: PluginLoadOptions = {}): Promise<PluginLoadResult> {
    const startTime = Date.now();
    const { readFile } = await import('fs/promises');

    try {
      // Read package.json
      const packageJsonPath = resolve(path, 'package.json');
      const content = await readFile(packageJsonPath, 'utf-8');
      const manifest = JSON.parse(content) as KGPluginManifest;

      // Validate if requested
      if (options.validate !== false) {
        const validation = this.validateManifest(manifest);
        if (!validation.valid) {
          return {
            success: false,
            error: `Invalid manifest: ${validation.errors.join(', ')}`,
            loadTime: Date.now() - startTime,
          };
        }
      }

      // Load the plugin module
      const mainPath = resolve(path, manifest['kg-plugin'].main);
      const moduleUrl = pathToFileURL(mainPath).href;

      return await this.loadModule(manifest.name, moduleUrl, options, startTime, manifest);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        loadTime: Date.now() - startTime,
      };
    }
  }

  private async loadModule(
    name: string,
    modulePath: string,
    options: PluginLoadOptions,
    startTime: number,
    manifest?: KGPluginManifest
  ): Promise<PluginLoadResult> {
    try {
      const timeoutMs = options.timeout ?? 30000;
      const loadPromise = import(modulePath);

      const module = await Promise.race([
        loadPromise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Plugin load timeout')), timeoutMs)
        ),
      ]);

      const exported: PluginModuleExport = module.default ?? module;
      let plugin: KGPlugin;

      // Handle different export types
      if (typeof exported === 'function') {
        // Factory function or constructor
        const result = (exported as () => KGPlugin | Promise<KGPlugin>)();
        plugin = result instanceof Promise ? await result : result;
      } else {
        // Direct plugin instance
        plugin = exported as KGPlugin;
      }

      const metadata = createDefaultPluginMetadata(
        plugin.name,
        plugin.version,
        plugin.type
      );
      metadata.status = 'loading';
      metadata.loadTime = Date.now() - startTime;

      this.loadedPlugins.set(name, plugin);
      this.loadedMetadata.set(name, metadata);

      logger.info(`Plugin loaded: ${name}`, { loadTime: metadata.loadTime });

      return {
        success: true,
        plugin,
        metadata,
        loadTime: metadata.loadTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        loadTime: Date.now() - startTime,
      };
    }
  }

  async unload(name: string): Promise<boolean> {
    const plugin = this.loadedPlugins.get(name);
    if (!plugin) return false;

    try {
      if (plugin.destroy) {
        await plugin.destroy();
      }
    } catch (error) {
      logger.error(`Error destroying plugin ${name}`, error instanceof Error ? error : undefined);
    }

    this.loadedPlugins.delete(name);
    this.loadedMetadata.delete(name);
    logger.info(`Plugin unloaded: ${name}`);
    return true;
  }

  async reload(name: string): Promise<PluginLoadResult> {
    await this.unload(name);
    return this.load(name, { force: true });
  }

  get(name: string): KGPlugin | undefined {
    return this.loadedPlugins.get(name);
  }

  isLoaded(name: string): boolean {
    return this.loadedPlugins.has(name);
  }

  getAll(): KGPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  validateManifest(manifest: KGPluginManifest): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!manifest.name) {
      errors.push('Missing required field: name');
    }
    if (!manifest.version) {
      errors.push('Missing required field: version');
    }
    if (!manifest['kg-plugin']) {
      errors.push('Missing required field: kg-plugin');
    } else {
      if (!manifest['kg-plugin'].type) {
        errors.push('Missing required field: kg-plugin.type');
      }
      if (!manifest['kg-plugin'].main) {
        errors.push('Missing required field: kg-plugin.main');
      }
    }

    // Warnings
    if (!manifest.description) {
      warnings.push('Missing recommended field: description');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  setSearchPaths(paths: string[]): void {
    this.searchPaths = [...paths];
  }

  getSearchPaths(): string[] {
    return [...this.searchPaths];
  }
}

// ============================================================================
// Plugin Manager Implementation
// ============================================================================

/**
 * Main plugin manager for high-level plugin operations
 */
export class PluginManagerImpl extends EventEmitter implements PluginManager {
  readonly loader: PluginLoader;
  readonly registry: PluginRegistry;

  private config: PluginManagerConfig;
  private contexts: Map<string, PluginContext> = new Map();
  private pluginConfigs: Map<string, Record<string, unknown>> = new Map();
  private isShuttingDown = false;
  private sharedEventEmitter: PluginEventEmitterImpl;
  private commands: Map<string, PluginCommand> = new Map();
  private abortController: AbortController | null = null;

  // Dependencies injected during initialization
  private database?: KnowledgeGraphDatabase;
  private graph?: KnowledgeGraphManager;
  private cache?: ShadowCache;
  private appConfig?: KGConfiguration;
  private projectRoot?: string;

  constructor(config: PluginManagerConfig) {
    super();
    this.config = config;
    this.loader = new PluginLoaderImpl(config.searchPaths);
    this.registry = new PluginRegistryImpl();
    this.sharedEventEmitter = new PluginEventEmitterImpl();

    // Set up default plugin configs
    if (config.defaultConfig) {
      for (const [name, pluginConfig] of Object.entries(config.defaultConfig)) {
        this.pluginConfigs.set(name, pluginConfig);
      }
    }

    logger.info('PluginManager initialized', {
      searchPaths: config.searchPaths.length,
      autoLoad: config.autoLoad?.length ?? 0,
    });
  }

  /**
   * Set dependencies for plugin contexts
   */
  setDependencies(deps: {
    database: KnowledgeGraphDatabase;
    graph: KnowledgeGraphManager;
    cache: ShadowCache;
    config: KGConfiguration;
    projectRoot: string;
  }): void {
    this.database = deps.database;
    this.graph = deps.graph;
    this.cache = deps.cache;
    this.appConfig = deps.config;
    this.projectRoot = deps.projectRoot;
  }

  async initialize(): Promise<void> {
    logger.info('Initializing plugin manager...');
    this.abortController = new AbortController();

    // Discover plugins
    const discovered = await this.loader.discover();
    logger.info(`Found ${discovered.length} plugins`);

    // Load auto-load plugins
    const autoLoadPlugins = this.config.autoLoad ?? [];
    const loadResults = await this.loadPlugins(autoLoadPlugins);

    // Initialize loaded plugins
    for (const [name, result] of loadResults) {
      if (result.success && result.plugin) {
        await this.initializePlugin(name, result.plugin);
      }
    }

    logger.info('Plugin manager initialization complete', {
      loaded: loadResults.size,
      successful: Array.from(loadResults.values()).filter(r => r.success).length,
    });
  }

  /**
   * Load multiple plugins with concurrency control
   */
  private async loadPlugins(
    pluginNames: string[]
  ): Promise<Map<string, PluginLoadResult>> {
    const results = new Map<string, PluginLoadResult>();
    const maxConcurrency = this.config.maxConcurrency ?? 5;
    const timeout = this.config.loadTimeout ?? 30000;

    // Process in batches
    for (let i = 0; i < pluginNames.length; i += maxConcurrency) {
      const batch = pluginNames.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(async name => {
        const result = await this.loader.load(name, { timeout });
        return { name, result };
      });

      const batchResults = await Promise.allSettled(batchPromises);

      for (const settledResult of batchResults) {
        if (settledResult.status === 'fulfilled') {
          const { name, result } = settledResult.value;
          results.set(name, result);
        }
      }
    }

    return results;
  }

  /**
   * Initialize a single plugin with context
   */
  private async initializePlugin(name: string, plugin: KGPlugin): Promise<void> {
    const startTime = Date.now();

    try {
      // Get or create plugin context
      const context = this.getPluginContext(name);

      // Initialize the plugin
      await plugin.initialize(context);

      // Get manifest (create minimal one if not available)
      const manifest: KGPluginManifest = {
        name: plugin.name,
        version: plugin.version,
        'kg-plugin': {
          type: plugin.type,
          main: 'index.js',
          hooks: this.detectPluginHooks(plugin),
        },
      };

      // Register in registry
      this.registry.register(plugin, manifest);
      await this.registry.enable(name);

      const meta = this.registry.getMetadata(name);
      if (meta) {
        meta.initTime = Date.now() - startTime;
      }

      logger.info(`Plugin initialized: ${name}`, { initTime: Date.now() - startTime });
    } catch (error) {
      logger.error(`Failed to initialize plugin ${name}`, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Detect which hooks a plugin implements
   */
  private detectPluginHooks(plugin: KGPlugin): PluginHook[] {
    const allHooks: PluginHook[] = [
      'onGraphLoad',
      'onGraphSave',
      'onNodeAdd',
      'onNodeUpdate',
      'onNodeRemove',
      'onEdgeAdd',
      'onEdgeRemove',
      'onAnalysisStart',
      'onAnalysisComplete',
      'onAgentTaskStart',
      'onAgentTaskComplete',
      'onFileChange',
      'onShutdown',
    ];

    return allHooks.filter(hook => typeof plugin[hook] === 'function');
  }

  async install(source: string): Promise<{
    success: boolean;
    name?: string;
    version?: string;
    error?: string;
  }> {
    logger.info(`Installing plugin: ${source}`);

    try {
      // Check if it's a local path
      const { stat } = await import('fs/promises');
      const isLocal = await stat(source).then(() => true).catch(() => false);

      if (isLocal) {
        // Load from local path
        const result = await this.loader.loadFromPath(source, { validate: true });
        if (!result.success) {
          return { success: false, error: result.error };
        }

        // Initialize the plugin
        await this.initializePlugin(result.plugin!.name, result.plugin!);

        return {
          success: true,
          name: result.plugin!.name,
          version: result.plugin!.version,
        };
      }

      // For npm packages, we would typically use npm/yarn to install
      // This is a simplified implementation
      const result = await this.loader.load(source, { validate: true });
      if (!result.success) {
        return { success: false, error: result.error };
      }

      await this.initializePlugin(result.plugin!.name, result.plugin!);

      return {
        success: true,
        name: result.plugin!.name,
        version: result.plugin!.version,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async uninstall(name: string): Promise<boolean> {
    logger.info(`Uninstalling plugin: ${name}`);

    try {
      // Disable and cleanup
      const plugin = this.registry.get(name);
      if (plugin?.onShutdown) {
        await plugin.onShutdown();
      }

      // Unregister from registry
      this.registry.unregister(name);

      // Unload from loader
      await this.loader.unload(name);

      // Clear context
      this.contexts.delete(name);
      this.pluginConfigs.delete(name);

      logger.info(`Plugin uninstalled: ${name}`);
      return true;
    } catch (error) {
      logger.error(`Failed to uninstall plugin ${name}`, error instanceof Error ? error : undefined);
      return false;
    }
  }

  async update(name: string): Promise<{
    success: boolean;
    previousVersion?: string;
    newVersion?: string;
    error?: string;
  }> {
    const currentPlugin = this.registry.get(name);
    const previousVersion = currentPlugin?.version;

    try {
      // Reload the plugin
      const result = await this.loader.reload(name);
      if (!result.success) {
        return { success: false, previousVersion, error: result.error };
      }

      // Reinitialize
      await this.initializePlugin(name, result.plugin!);

      return {
        success: true,
        previousVersion,
        newVersion: result.plugin!.version,
      };
    } catch (error) {
      return {
        success: false,
        previousVersion,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async checkUpdates(): Promise<Array<{
    name: string;
    currentVersion: string;
    latestVersion: string;
  }>> {
    // This would typically check npm registry for newer versions
    // Simplified implementation returns empty array
    logger.debug('Checking for plugin updates...');
    return [];
  }

  getConfig(name: string): Record<string, unknown> | undefined {
    return this.pluginConfigs.get(name);
  }

  async setConfig(name: string, config: Record<string, unknown>): Promise<void> {
    this.pluginConfigs.set(name, config);

    // Update the plugin context
    const context = this.contexts.get(name);
    if (context) {
      context.pluginConfig = config;
    }

    logger.debug(`Plugin config updated: ${name}`);
  }

  /**
   * Get plugin context for a specific plugin
   */
  getPluginContext(name: string): PluginContext {
    if (this.contexts.has(name)) {
      return this.contexts.get(name)!;
    }

    const pluginConfig = this.pluginConfigs.get(name) ?? {};
    const pluginPath = this.findPluginPath(name);

    const context: PluginContext = {
      database: this.database ?? this.createMockDatabase(),
      graph: this.graph ?? this.createMockGraph(),
      cache: this.cache ?? this.createMockCache(),
      logger: createLogger(`plugin:${name}`),
      config: this.appConfig ?? this.createDefaultConfig(),
      pluginConfig,
      events: this.sharedEventEmitter,
      api: this.createPluginAPI(),
      projectRoot: this.projectRoot ?? process.cwd(),
      pluginRoot: pluginPath,
      abortSignal: this.abortController?.signal,
    };

    this.contexts.set(name, context);
    return context;
  }

  /**
   * Find the path to a plugin
   */
  private findPluginPath(name: string): string {
    for (const basePath of this.config.searchPaths) {
      const pluginPath = resolve(basePath, name);
      return pluginPath;
    }
    return resolve(process.cwd(), 'plugins', name);
  }

  /**
   * Create plugin API for system interaction
   */
  private createPluginAPI(): PluginAPI {
    return {
      getPlugin: <T extends KGPlugin>(name: string) => this.registry.get<T>(name),
      getPluginsByType: (type: PluginType) => this.registry.getByType(type),
      getAnalyzers: () => this.registry.getAnalyzers(),
      registerCommand: (command: PluginCommand) => {
        this.commands.set(command.name, command);
        logger.debug(`Command registered: ${command.name}`);
      },
      unregisterCommand: (name: string) => {
        this.commands.delete(name);
      },
      getVersion: () => '1.0.0', // TODO: Get from package.json
      hasCapability: (name: string) => {
        for (const plugin of this.registry.getAll()) {
          const meta = this.registry.getMetadata(plugin.name);
          if (meta?.capabilities.includes(name)) {
            return true;
          }
        }
        return false;
      },
    };
  }

  /**
   * Invoke a lifecycle hook on all plugins
   */
  async invokeHook<T = void>(hook: PluginHook, ...args: unknown[]): Promise<Map<string, T | Error>> {
    if (this.isShuttingDown && hook !== 'onShutdown') {
      logger.debug(`Skipping hook ${hook} during shutdown`);
      return new Map();
    }

    return this.registry.executeHook<T>(hook, ...args);
  }

  /**
   * Enable a specific plugin
   */
  async enablePlugin(name: string): Promise<void> {
    const plugin = this.registry.get(name);
    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`);
    }

    await this.registry.enable(name);
  }

  /**
   * Disable a specific plugin
   */
  async disablePlugin(name: string): Promise<void> {
    const plugin = this.registry.get(name);
    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`);
    }

    await this.registry.disable(name);
  }

  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      logger.debug('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    logger.info('Shutting down plugin manager...');

    // Signal abort to all plugins
    this.abortController?.abort();

    // Invoke shutdown hook on all plugins
    await this.invokeHook('onShutdown');

    // Clear registry
    await this.registry.clear();

    // Clear contexts and configs
    this.contexts.clear();
    this.pluginConfigs.clear();
    this.commands.clear();

    logger.info('Plugin manager shutdown complete');
    this.emit('shutdown');
  }

  // ========================================================================
  // Mock implementations for when dependencies aren't set
  // ========================================================================

  private createMockDatabase(): KnowledgeGraphDatabase {
    return {
      query: async () => [],
      queryOne: async () => null,
      execute: async () => ({ changes: 0 }),
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      isConnected: () => false,
    };
  }

  private createMockGraph(): KnowledgeGraphManager {
    // Create a minimal mock - in real usage, setDependencies should be called
    return {
      addNode: () => {},
      getNode: () => undefined,
      getAllNodes: () => [],
      getNodesByType: () => [],
      getNodesByStatus: () => [],
      getNodesByTag: () => [],
      updateNode: () => false,
      removeNode: () => false,
      addEdge: () => {},
      getIncomingEdges: () => [],
      getOutgoingEdges: () => [],
      getAllEdges: () => [],
      findOrphanNodes: () => [],
      findMostConnected: () => [],
      findPath: () => null,
      findRelated: () => [],
      getStats: () => ({
        totalNodes: 0,
        totalEdges: 0,
        nodesByType: {},
        nodesByStatus: {},
        orphanNodes: 0,
        avgLinksPerNode: 0,
        mostConnected: [],
      }),
      toJSON: () => ({ nodes: new Map(), edges: [], metadata: {} as any }),
      getMetadata: () => ({} as any),
    } as unknown as KnowledgeGraphManager;
  }

  private createMockCache(): ShadowCache {
    const cache = new Map<string, unknown>();
    return {
      get: async (key) => cache.get(key) as any,
      set: async (key, value) => { cache.set(key, value); },
      delete: async (key) => cache.delete(key),
      deleteByTag: async () => 0,
      clear: async () => { cache.clear(); },
      has: async (key) => cache.has(key),
      getStats: async () => ({
        entries: cache.size,
        size: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
      }),
    };
  }

  private createDefaultConfig(): KGConfiguration {
    return {
      version: '1.0.0',
      projectRoot: process.cwd(),
      docsPath: 'docs',
      database: {
        path: '.kg/knowledge.db',
        autoBackup: true,
        backupInterval: 86400000,
        maxBackups: 7,
      },
      cache: {
        enabled: true,
        maxSize: 1000,
        ttl: 3600000,
        evictionPolicy: 'lru',
      },
      agents: {
        maxConcurrent: 5,
        defaultTimeout: 30000,
        retryAttempts: 3,
        claudeFlowEnabled: false,
      },
      services: {
        watcherEnabled: false,
        schedulerEnabled: false,
        syncEnabled: false,
        healthCheckInterval: 60000,
      },
      logging: {
        level: 'info',
        format: 'text',
      },
    };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new plugin registry
 */
export function createPluginRegistry(): PluginRegistry {
  return new PluginRegistryImpl();
}

/**
 * Create a new plugin loader
 */
export function createPluginLoader(searchPaths: string[] = []): PluginLoader {
  return new PluginLoaderImpl(searchPaths);
}

/**
 * Create a new plugin manager
 */
export function createPluginManager(config: PluginManagerConfig): PluginManager {
  return new PluginManagerImpl(config);
}

/**
 * Create a plugin manager with default configuration
 */
export function createDefaultPluginManager(projectRoot: string): PluginManager {
  const searchPaths = [
    resolve(projectRoot, 'plugins'),
    resolve(projectRoot, 'node_modules'),
  ];

  return createPluginManager({
    searchPaths,
    autoLoad: [],
    hotReload: false,
    maxConcurrency: 5,
    loadTimeout: 30000,
  });
}
