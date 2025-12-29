import { EventEmitter } from "events";
import { resolve } from "path";
import { pathToFileURL } from "url";
import { createLogger } from "../utils/logger.js";
import { createDefaultPluginMetadata, isAnalyzerPlugin } from "./types.js";
const logger = createLogger("plugin-manager");
class PluginEventEmitterImpl extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }
}
class PluginRegistryImpl extends EventEmitter {
  plugins = /* @__PURE__ */ new Map();
  manifests = /* @__PURE__ */ new Map();
  metadata = /* @__PURE__ */ new Map();
  hookSubscribers = /* @__PURE__ */ new Map();
  constructor() {
    super();
    logger.debug("PluginRegistry initialized");
  }
  register(plugin, manifest) {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already registered`);
    }
    this.plugins.set(plugin.name, plugin);
    this.manifests.set(plugin.name, manifest);
    const meta = {
      name: plugin.name,
      version: plugin.version,
      type: plugin.type,
      status: "initialized",
      hooks: manifest["kg-plugin"].hooks ?? [],
      capabilities: manifest["kg-plugin"].capabilities?.map((c) => c.name) ?? []
    };
    this.metadata.set(plugin.name, meta);
    for (const hook of meta.hooks) {
      if (!this.hookSubscribers.has(hook)) {
        this.hookSubscribers.set(hook, /* @__PURE__ */ new Set());
      }
      this.hookSubscribers.get(hook).add(plugin.name);
    }
    logger.info(`Plugin registered: ${plugin.name}@${plugin.version}`, {
      type: plugin.type,
      hooks: meta.hooks.length
    });
    this.emit("registered", { plugin, metadata: meta });
  }
  unregister(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;
    for (const [hook, subscribers] of this.hookSubscribers) {
      subscribers.delete(name);
    }
    this.plugins.delete(name);
    this.manifests.delete(name);
    this.metadata.delete(name);
    logger.info(`Plugin unregistered: ${name}`);
    this.emit("unregistered", { name });
    return true;
  }
  get(name) {
    return this.plugins.get(name);
  }
  getAll() {
    return Array.from(this.plugins.values());
  }
  getByType(type) {
    return this.getAll().filter((p) => p.type === type);
  }
  getAnalyzers() {
    return this.getAll().filter(isAnalyzerPlugin);
  }
  has(name) {
    return this.plugins.has(name);
  }
  getMetadata(name) {
    return this.metadata.get(name);
  }
  async enable(name) {
    const meta = this.metadata.get(name);
    if (!meta) return false;
    if (meta.status === "active") return true;
    meta.status = "active";
    logger.info(`Plugin enabled: ${name}`);
    this.emit("enabled", { name });
    return true;
  }
  async disable(name) {
    const meta = this.metadata.get(name);
    if (!meta) return false;
    if (meta.status === "disabled") return true;
    meta.status = "disabled";
    logger.info(`Plugin disabled: ${name}`);
    this.emit("disabled", { name });
    return true;
  }
  async executeHook(hook, ...args) {
    const results = /* @__PURE__ */ new Map();
    const subscribers = this.getHookSubscribers(hook);
    const startTime = Date.now();
    const sortedPlugins = subscribers.map((name) => ({
      name,
      plugin: this.plugins.get(name),
      manifest: this.manifests.get(name),
      meta: this.metadata.get(name)
    })).filter(({ meta }) => meta.status === "active").sort((a, b) => {
      const priorityA = a.manifest["kg-plugin"].priority ?? 100;
      const priorityB = b.manifest["kg-plugin"].priority ?? 100;
      return priorityA - priorityB;
    });
    for (const { name, plugin, meta } of sortedPlugins) {
      try {
        const hookMethod = plugin[hook];
        if (typeof hookMethod === "function") {
          const result = await hookMethod.apply(plugin, args);
          results.set(name, result);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        results.set(name, err);
        meta.status = "error";
        meta.lastError = err.message;
        logger.error(`Plugin ${name} hook ${hook} failed`, err);
        this.emit("error", { name, error: err });
      }
    }
    const duration = Date.now() - startTime;
    this.emit("hookExecuted", { hook, plugins: subscribers, duration });
    logger.debug(`Hook ${hook} executed`, { plugins: subscribers.length, duration });
    return results;
  }
  getHookSubscribers(hook) {
    return Array.from(this.hookSubscribers.get(hook) ?? []);
  }
  getStats() {
    const allMeta = Array.from(this.metadata.values());
    const pluginsByType = {
      analyzer: 0,
      transformer: 0,
      exporter: 0,
      importer: 0,
      integration: 0,
      visualization: 0,
      storage: 0,
      agent: 0,
      hook: 0,
      generic: 0
    };
    for (const meta of allMeta) {
      pluginsByType[meta.type]++;
    }
    const hookSubscriptions = {
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
      onShutdown: 0
    };
    for (const [hook, subscribers] of this.hookSubscribers) {
      hookSubscriptions[hook] = subscribers.size;
    }
    return {
      totalPlugins: allMeta.length,
      activePlugins: allMeta.filter((m) => m.status === "active").length,
      disabledPlugins: allMeta.filter((m) => m.status === "disabled").length,
      errorPlugins: allMeta.filter((m) => m.status === "error").length,
      pluginsByType,
      hookSubscriptions
    };
  }
  on(event, listener) {
    return super.on(event, listener);
  }
  off(event, listener) {
    return super.off(event, listener);
  }
  async clear() {
    const pluginNames = Array.from(this.plugins.keys());
    for (const name of pluginNames) {
      const plugin = this.plugins.get(name);
      if (plugin?.destroy) {
        try {
          await plugin.destroy();
        } catch (error) {
          logger.error(`Error destroying plugin ${name}`, error instanceof Error ? error : void 0);
        }
      }
      this.unregister(name);
    }
    logger.info("Plugin registry cleared");
  }
}
class PluginLoaderImpl {
  loadedPlugins = /* @__PURE__ */ new Map();
  loadedMetadata = /* @__PURE__ */ new Map();
  searchPaths = [];
  constructor(searchPaths = []) {
    this.searchPaths = [...searchPaths];
  }
  async discover() {
    const discovered = [];
    const { readdir, readFile, stat } = await import("fs/promises");
    for (const basePath of this.searchPaths) {
      try {
        const entries = await readdir(basePath, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          const pluginPath = resolve(basePath, entry.name);
          const packageJsonPath = resolve(pluginPath, "package.json");
          try {
            const packageStat = await stat(packageJsonPath);
            if (!packageStat.isFile()) continue;
            const content = await readFile(packageJsonPath, "utf-8");
            const manifest = JSON.parse(content);
            const validation = this.validateManifest(manifest);
            discovered.push({
              manifest,
              path: pluginPath,
              isLocal: true,
              valid: validation.valid,
              errors: validation.errors.length > 0 ? validation.errors : void 0
            });
          } catch {
          }
        }
      } catch {
        logger.debug(`Search path not accessible: ${basePath}`);
      }
    }
    logger.info(`Discovered ${discovered.length} plugins`, {
      valid: discovered.filter((p) => p.valid).length,
      invalid: discovered.filter((p) => !p.valid).length
    });
    return discovered;
  }
  async load(name, options = {}) {
    const startTime = Date.now();
    if (!options.force && this.loadedPlugins.has(name)) {
      const plugin = this.loadedPlugins.get(name);
      return {
        success: true,
        plugin,
        metadata: this.loadedMetadata.get(name),
        loadTime: Date.now() - startTime
      };
    }
    for (const basePath of this.searchPaths) {
      const pluginPath = resolve(basePath, name);
      const result = await this.loadFromPath(pluginPath, options);
      if (result.success) {
        return result;
      }
    }
    try {
      const modulePath = await import.meta.resolve?.(name) ?? name;
      return await this.loadModule(name, modulePath, options, startTime);
    } catch (error) {
      return {
        success: false,
        error: `Plugin ${name} not found`,
        loadTime: Date.now() - startTime
      };
    }
  }
  async loadFromPath(path, options = {}) {
    const startTime = Date.now();
    const { readFile } = await import("fs/promises");
    try {
      const packageJsonPath = resolve(path, "package.json");
      const content = await readFile(packageJsonPath, "utf-8");
      const manifest = JSON.parse(content);
      if (options.validate !== false) {
        const validation = this.validateManifest(manifest);
        if (!validation.valid) {
          return {
            success: false,
            error: `Invalid manifest: ${validation.errors.join(", ")}`,
            loadTime: Date.now() - startTime
          };
        }
      }
      const mainPath = resolve(path, manifest["kg-plugin"].main);
      const moduleUrl = pathToFileURL(mainPath).href;
      return await this.loadModule(manifest.name, moduleUrl, options, startTime, manifest);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        loadTime: Date.now() - startTime
      };
    }
  }
  async loadModule(name, modulePath, options, startTime, manifest) {
    try {
      const timeoutMs = options.timeout ?? 3e4;
      const loadPromise = import(modulePath);
      const module = await Promise.race([
        loadPromise,
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Plugin load timeout")), timeoutMs)
        )
      ]);
      const exported = module.default ?? module;
      let plugin;
      if (typeof exported === "function") {
        const result = exported();
        plugin = result instanceof Promise ? await result : result;
      } else {
        plugin = exported;
      }
      const metadata = createDefaultPluginMetadata(
        plugin.name,
        plugin.version,
        plugin.type
      );
      metadata.status = "loading";
      metadata.loadTime = Date.now() - startTime;
      this.loadedPlugins.set(name, plugin);
      this.loadedMetadata.set(name, metadata);
      logger.info(`Plugin loaded: ${name}`, { loadTime: metadata.loadTime });
      return {
        success: true,
        plugin,
        metadata,
        loadTime: metadata.loadTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        loadTime: Date.now() - startTime
      };
    }
  }
  async unload(name) {
    const plugin = this.loadedPlugins.get(name);
    if (!plugin) return false;
    try {
      if (plugin.destroy) {
        await plugin.destroy();
      }
    } catch (error) {
      logger.error(`Error destroying plugin ${name}`, error instanceof Error ? error : void 0);
    }
    this.loadedPlugins.delete(name);
    this.loadedMetadata.delete(name);
    logger.info(`Plugin unloaded: ${name}`);
    return true;
  }
  async reload(name) {
    await this.unload(name);
    return this.load(name, { force: true });
  }
  get(name) {
    return this.loadedPlugins.get(name);
  }
  isLoaded(name) {
    return this.loadedPlugins.has(name);
  }
  getAll() {
    return Array.from(this.loadedPlugins.values());
  }
  validateManifest(manifest) {
    const errors = [];
    const warnings = [];
    if (!manifest.name) {
      errors.push("Missing required field: name");
    }
    if (!manifest.version) {
      errors.push("Missing required field: version");
    }
    if (!manifest["kg-plugin"]) {
      errors.push("Missing required field: kg-plugin");
    } else {
      if (!manifest["kg-plugin"].type) {
        errors.push("Missing required field: kg-plugin.type");
      }
      if (!manifest["kg-plugin"].main) {
        errors.push("Missing required field: kg-plugin.main");
      }
    }
    if (!manifest.description) {
      warnings.push("Missing recommended field: description");
    }
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  setSearchPaths(paths) {
    this.searchPaths = [...paths];
  }
  getSearchPaths() {
    return [...this.searchPaths];
  }
}
class PluginManagerImpl extends EventEmitter {
  loader;
  registry;
  config;
  contexts = /* @__PURE__ */ new Map();
  pluginConfigs = /* @__PURE__ */ new Map();
  isShuttingDown = false;
  sharedEventEmitter;
  commands = /* @__PURE__ */ new Map();
  abortController = null;
  // Dependencies injected during initialization
  database;
  graph;
  cache;
  appConfig;
  projectRoot;
  constructor(config) {
    super();
    this.config = config;
    this.loader = new PluginLoaderImpl(config.searchPaths);
    this.registry = new PluginRegistryImpl();
    this.sharedEventEmitter = new PluginEventEmitterImpl();
    if (config.defaultConfig) {
      for (const [name, pluginConfig] of Object.entries(config.defaultConfig)) {
        this.pluginConfigs.set(name, pluginConfig);
      }
    }
    logger.info("PluginManager initialized", {
      searchPaths: config.searchPaths.length,
      autoLoad: config.autoLoad?.length ?? 0
    });
  }
  /**
   * Set dependencies for plugin contexts
   */
  setDependencies(deps) {
    this.database = deps.database;
    this.graph = deps.graph;
    this.cache = deps.cache;
    this.appConfig = deps.config;
    this.projectRoot = deps.projectRoot;
  }
  async initialize() {
    logger.info("Initializing plugin manager...");
    this.abortController = new AbortController();
    const discovered = await this.loader.discover();
    logger.info(`Found ${discovered.length} plugins`);
    const autoLoadPlugins = this.config.autoLoad ?? [];
    const loadResults = await this.loadPlugins(autoLoadPlugins);
    for (const [name, result] of loadResults) {
      if (result.success && result.plugin) {
        await this.initializePlugin(name, result.plugin);
      }
    }
    logger.info("Plugin manager initialization complete", {
      loaded: loadResults.size,
      successful: Array.from(loadResults.values()).filter((r) => r.success).length
    });
  }
  /**
   * Load multiple plugins with concurrency control
   */
  async loadPlugins(pluginNames) {
    const results = /* @__PURE__ */ new Map();
    const maxConcurrency = this.config.maxConcurrency ?? 5;
    const timeout = this.config.loadTimeout ?? 3e4;
    for (let i = 0; i < pluginNames.length; i += maxConcurrency) {
      const batch = pluginNames.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(async (name) => {
        const result = await this.loader.load(name, { timeout });
        return { name, result };
      });
      const batchResults = await Promise.allSettled(batchPromises);
      for (const settledResult of batchResults) {
        if (settledResult.status === "fulfilled") {
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
  async initializePlugin(name, plugin) {
    const startTime = Date.now();
    try {
      const context = this.getPluginContext(name);
      await plugin.initialize(context);
      const manifest = {
        name: plugin.name,
        version: plugin.version,
        "kg-plugin": {
          type: plugin.type,
          main: "index.js",
          hooks: this.detectPluginHooks(plugin)
        }
      };
      this.registry.register(plugin, manifest);
      await this.registry.enable(name);
      const meta = this.registry.getMetadata(name);
      if (meta) {
        meta.initTime = Date.now() - startTime;
      }
      logger.info(`Plugin initialized: ${name}`, { initTime: Date.now() - startTime });
    } catch (error) {
      logger.error(`Failed to initialize plugin ${name}`, error instanceof Error ? error : void 0);
      throw error;
    }
  }
  /**
   * Detect which hooks a plugin implements
   */
  detectPluginHooks(plugin) {
    const allHooks = [
      "onGraphLoad",
      "onGraphSave",
      "onNodeAdd",
      "onNodeUpdate",
      "onNodeRemove",
      "onEdgeAdd",
      "onEdgeRemove",
      "onAnalysisStart",
      "onAnalysisComplete",
      "onAgentTaskStart",
      "onAgentTaskComplete",
      "onFileChange",
      "onShutdown"
    ];
    return allHooks.filter((hook) => typeof plugin[hook] === "function");
  }
  async install(source) {
    logger.info(`Installing plugin: ${source}`);
    try {
      const { stat } = await import("fs/promises");
      const isLocal = await stat(source).then(() => true).catch(() => false);
      if (isLocal) {
        const result2 = await this.loader.loadFromPath(source, { validate: true });
        if (!result2.success) {
          return { success: false, error: result2.error };
        }
        await this.initializePlugin(result2.plugin.name, result2.plugin);
        return {
          success: true,
          name: result2.plugin.name,
          version: result2.plugin.version
        };
      }
      const result = await this.loader.load(source, { validate: true });
      if (!result.success) {
        return { success: false, error: result.error };
      }
      await this.initializePlugin(result.plugin.name, result.plugin);
      return {
        success: true,
        name: result.plugin.name,
        version: result.plugin.version
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  async uninstall(name) {
    logger.info(`Uninstalling plugin: ${name}`);
    try {
      const plugin = this.registry.get(name);
      if (plugin?.onShutdown) {
        await plugin.onShutdown();
      }
      this.registry.unregister(name);
      await this.loader.unload(name);
      this.contexts.delete(name);
      this.pluginConfigs.delete(name);
      logger.info(`Plugin uninstalled: ${name}`);
      return true;
    } catch (error) {
      logger.error(`Failed to uninstall plugin ${name}`, error instanceof Error ? error : void 0);
      return false;
    }
  }
  async update(name) {
    const currentPlugin = this.registry.get(name);
    const previousVersion = currentPlugin?.version;
    try {
      const result = await this.loader.reload(name);
      if (!result.success) {
        return { success: false, previousVersion, error: result.error };
      }
      await this.initializePlugin(name, result.plugin);
      return {
        success: true,
        previousVersion,
        newVersion: result.plugin.version
      };
    } catch (error) {
      return {
        success: false,
        previousVersion,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  async checkUpdates() {
    logger.debug("Checking for plugin updates...");
    return [];
  }
  getConfig(name) {
    return this.pluginConfigs.get(name);
  }
  async setConfig(name, config) {
    this.pluginConfigs.set(name, config);
    const context = this.contexts.get(name);
    if (context) {
      context.pluginConfig = config;
    }
    logger.debug(`Plugin config updated: ${name}`);
  }
  /**
   * Get plugin context for a specific plugin
   */
  getPluginContext(name) {
    if (this.contexts.has(name)) {
      return this.contexts.get(name);
    }
    const pluginConfig = this.pluginConfigs.get(name) ?? {};
    const pluginPath = this.findPluginPath(name);
    const context = {
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
      abortSignal: this.abortController?.signal
    };
    this.contexts.set(name, context);
    return context;
  }
  /**
   * Find the path to a plugin
   */
  findPluginPath(name) {
    for (const basePath of this.config.searchPaths) {
      const pluginPath = resolve(basePath, name);
      return pluginPath;
    }
    return resolve(process.cwd(), "plugins", name);
  }
  /**
   * Create plugin API for system interaction
   */
  createPluginAPI() {
    return {
      getPlugin: (name) => this.registry.get(name),
      getPluginsByType: (type) => this.registry.getByType(type),
      getAnalyzers: () => this.registry.getAnalyzers(),
      registerCommand: (command) => {
        this.commands.set(command.name, command);
        logger.debug(`Command registered: ${command.name}`);
      },
      unregisterCommand: (name) => {
        this.commands.delete(name);
      },
      getVersion: () => "1.0.0",
      // TODO: Get from package.json
      hasCapability: (name) => {
        for (const plugin of this.registry.getAll()) {
          const meta = this.registry.getMetadata(plugin.name);
          if (meta?.capabilities.includes(name)) {
            return true;
          }
        }
        return false;
      }
    };
  }
  /**
   * Invoke a lifecycle hook on all plugins
   */
  async invokeHook(hook, ...args) {
    if (this.isShuttingDown && hook !== "onShutdown") {
      logger.debug(`Skipping hook ${hook} during shutdown`);
      return /* @__PURE__ */ new Map();
    }
    return this.registry.executeHook(hook, ...args);
  }
  /**
   * Enable a specific plugin
   */
  async enablePlugin(name) {
    const plugin = this.registry.get(name);
    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`);
    }
    await this.registry.enable(name);
  }
  /**
   * Disable a specific plugin
   */
  async disablePlugin(name) {
    const plugin = this.registry.get(name);
    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`);
    }
    await this.registry.disable(name);
  }
  async shutdown() {
    if (this.isShuttingDown) {
      logger.debug("Shutdown already in progress");
      return;
    }
    this.isShuttingDown = true;
    logger.info("Shutting down plugin manager...");
    this.abortController?.abort();
    await this.invokeHook("onShutdown");
    await this.registry.clear();
    this.contexts.clear();
    this.pluginConfigs.clear();
    this.commands.clear();
    logger.info("Plugin manager shutdown complete");
    this.emit("shutdown");
  }
  // ========================================================================
  // Mock implementations for when dependencies aren't set
  // ========================================================================
  createMockDatabase() {
    return {
      query: async () => [],
      queryOne: async () => null,
      execute: async () => ({ changes: 0 }),
      beginTransaction: async () => {
      },
      commit: async () => {
      },
      rollback: async () => {
      },
      isConnected: () => false
    };
  }
  createMockGraph() {
    return {
      addNode: () => {
      },
      getNode: () => void 0,
      getAllNodes: () => [],
      getNodesByType: () => [],
      getNodesByStatus: () => [],
      getNodesByTag: () => [],
      updateNode: () => false,
      removeNode: () => false,
      addEdge: () => {
      },
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
        mostConnected: []
      }),
      toJSON: () => ({ nodes: /* @__PURE__ */ new Map(), edges: [], metadata: {} }),
      getMetadata: () => ({})
    };
  }
  createMockCache() {
    const cache = /* @__PURE__ */ new Map();
    return {
      get: async (key) => cache.get(key),
      set: async (key, value) => {
        cache.set(key, value);
      },
      delete: async (key) => cache.delete(key),
      deleteByTag: async () => 0,
      clear: async () => {
        cache.clear();
      },
      has: async (key) => cache.has(key),
      getStats: async () => ({
        entries: cache.size,
        size: 0,
        hits: 0,
        misses: 0,
        hitRate: 0
      })
    };
  }
  createDefaultConfig() {
    return {
      version: "1.0.0",
      projectRoot: process.cwd(),
      docsPath: "docs",
      database: {
        path: ".kg/knowledge.db",
        autoBackup: true,
        backupInterval: 864e5,
        maxBackups: 7
      },
      cache: {
        enabled: true,
        maxSize: 1e3,
        ttl: 36e5,
        evictionPolicy: "lru"
      },
      agents: {
        maxConcurrent: 5,
        defaultTimeout: 3e4,
        retryAttempts: 3,
        claudeFlowEnabled: false
      },
      services: {
        watcherEnabled: false,
        schedulerEnabled: false,
        syncEnabled: false,
        healthCheckInterval: 6e4
      },
      logging: {
        level: "info",
        format: "text"
      }
    };
  }
}
function createPluginRegistry() {
  return new PluginRegistryImpl();
}
function createPluginLoader(searchPaths = []) {
  return new PluginLoaderImpl(searchPaths);
}
function createPluginManager(config) {
  return new PluginManagerImpl(config);
}
function createDefaultPluginManager(projectRoot) {
  const searchPaths = [
    resolve(projectRoot, "plugins"),
    resolve(projectRoot, "node_modules")
  ];
  return createPluginManager({
    searchPaths,
    autoLoad: [],
    hotReload: false,
    maxConcurrency: 5,
    loadTimeout: 3e4
  });
}
export {
  PluginLoaderImpl,
  PluginManagerImpl,
  PluginRegistryImpl,
  createDefaultPluginManager,
  createPluginLoader,
  createPluginManager,
  createPluginRegistry
};
//# sourceMappingURL=manager.js.map
