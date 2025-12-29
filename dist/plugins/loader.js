import { existsSync, statSync, readFileSync, watch } from "fs";
import { resolve, join, isAbsolute, dirname } from "path";
import { pathToFileURL } from "url";
import { createLogger } from "../utils/logger.js";
import { createDefaultPluginMetadata, isValidSemver, isPluginManifest } from "./types.js";
const logger = createLogger("plugin-loader");
class AdvancedPluginLoader {
  cache = /* @__PURE__ */ new Map();
  searchPaths = [];
  enableHotReload;
  hotReloadCallbacks = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    this.searchPaths = options.searchPaths || [];
    this.enableHotReload = options.enableHotReload ?? false;
  }
  /**
   * Discover available plugins in search paths
   */
  async discover() {
    const discovered = [];
    for (const searchPath of this.searchPaths) {
      const resolvedPath = resolve(searchPath);
      if (!existsSync(resolvedPath)) {
        logger.debug("Search path does not exist", { path: resolvedPath });
        continue;
      }
      try {
        const stats = statSync(resolvedPath);
        if (stats.isDirectory()) {
          const directPlugin = await this.tryDiscoverPlugin(resolvedPath);
          if (directPlugin) {
            discovered.push(directPlugin);
          }
          const entries = await this.readDir(resolvedPath);
          for (const entry of entries) {
            const entryPath = join(resolvedPath, entry);
            const entryStats = statSync(entryPath);
            if (entryStats.isDirectory()) {
              const plugin = await this.tryDiscoverPlugin(entryPath);
              if (plugin) {
                discovered.push(plugin);
              }
            }
          }
        }
      } catch (error) {
        logger.error(`Failed to search path "${searchPath}"`, error instanceof Error ? error : new Error(String(error)));
      }
    }
    logger.info("Plugin discovery complete", { found: discovered.length });
    return discovered;
  }
  /**
   * Load a plugin by name
   */
  async load(name, options) {
    const startTime = Date.now();
    if (!options?.force && this.cache.has(name)) {
      const cached = this.cache.get(name);
      logger.debug("Using cached plugin", { name });
      return {
        success: true,
        plugin: cached.plugin,
        metadata: cached.metadata,
        loadTime: 0
      };
    }
    const discovered = await this.findPlugin(name);
    if (!discovered) {
      return {
        success: false,
        error: `Plugin "${name}" not found in search paths`,
        loadTime: Date.now() - startTime
      };
    }
    return this.loadFromPath(discovered.path, options);
  }
  /**
   * Load a plugin from a specific path
   */
  async loadFromPath(path, options) {
    const startTime = Date.now();
    const resolvedPath = isAbsolute(path) ? path : resolve(path);
    if (!existsSync(resolvedPath)) {
      return {
        success: false,
        error: `Plugin path does not exist: ${resolvedPath}`,
        loadTime: Date.now() - startTime
      };
    }
    try {
      const manifest = await this.loadManifest(resolvedPath);
      if (!manifest) {
        return {
          success: false,
          error: `No valid plugin manifest found at ${resolvedPath}`,
          loadTime: Date.now() - startTime
        };
      }
      if (options?.validate !== false) {
        const validation = this.validateManifest(manifest);
        if (!validation.valid) {
          return {
            success: false,
            error: `Invalid plugin manifest: ${validation.errors.join(", ")}`,
            loadTime: Date.now() - startTime
          };
        }
      }
      if (!options?.force && this.cache.has(manifest.name)) {
        const cached = this.cache.get(manifest.name);
        logger.debug("Using cached plugin", { name: manifest.name });
        return {
          success: true,
          plugin: cached.plugin,
          metadata: cached.metadata,
          loadTime: 0
        };
      }
      const plugin = await this.loadPluginModule(resolvedPath, manifest);
      if (!plugin) {
        return {
          success: false,
          error: `Failed to load plugin module from ${resolvedPath}`,
          loadTime: Date.now() - startTime
        };
      }
      const loadTime = Date.now() - startTime;
      const metadata = {
        ...createDefaultPluginMetadata(plugin.name, plugin.version, plugin.type),
        status: "loading",
        loadTime,
        hooks: manifest["kg-plugin"].hooks || [],
        capabilities: (manifest["kg-plugin"].capabilities || []).map((c) => c.name)
      };
      const cacheEntry = {
        plugin,
        manifest,
        metadata,
        path: resolvedPath,
        loadedAt: Date.now()
      };
      if (this.enableHotReload && manifest["kg-plugin"].hotReload !== false) {
        cacheEntry.watcher = this.setupHotReload(resolvedPath, manifest.name);
      }
      this.cache.set(manifest.name, cacheEntry);
      logger.info("Plugin loaded", {
        name: manifest.name,
        version: manifest.version,
        loadTime
      });
      return {
        success: true,
        plugin,
        metadata,
        loadTime
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to load plugin from "${resolvedPath}"`, err);
      return {
        success: false,
        error: err.message,
        loadTime: Date.now() - startTime
      };
    }
  }
  /**
   * Unload a plugin by name
   */
  async unload(name) {
    const entry = this.cache.get(name);
    if (!entry) {
      return false;
    }
    try {
      if (typeof entry.plugin.destroy === "function") {
        await entry.plugin.destroy();
      }
      if (entry.watcher) {
        entry.watcher.close();
      }
      this.cache.delete(name);
      logger.info("Plugin unloaded", { name });
      return true;
    } catch (error) {
      logger.error(`Failed to unload plugin "${name}"`, error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }
  /**
   * Reload a plugin
   */
  async reload(name) {
    const entry = this.cache.get(name);
    if (!entry) {
      return {
        success: false,
        error: `Plugin "${name}" is not loaded`,
        loadTime: 0
      };
    }
    const path = entry.path;
    await this.unload(name);
    return this.loadFromPath(path, { force: true });
  }
  /**
   * Get a loaded plugin by name
   */
  get(name) {
    return this.cache.get(name)?.plugin;
  }
  /**
   * Check if a plugin is loaded
   */
  isLoaded(name) {
    return this.cache.has(name);
  }
  /**
   * Get all loaded plugins
   */
  getAll() {
    return Array.from(this.cache.values()).map((e) => e.plugin);
  }
  /**
   * Validate a plugin manifest
   */
  validateManifest(manifest) {
    const errors = [];
    const warnings = [];
    if (!manifest.name || typeof manifest.name !== "string") {
      errors.push('Missing or invalid "name" field');
    }
    if (!manifest.version || typeof manifest.version !== "string") {
      errors.push('Missing or invalid "version" field');
    } else if (!isValidSemver(manifest.version)) {
      errors.push(`Invalid version format: ${manifest.version}`);
    }
    if (!manifest["kg-plugin"]) {
      errors.push('Missing "kg-plugin" configuration');
    } else {
      const kgPlugin = manifest["kg-plugin"];
      if (!kgPlugin.type) {
        errors.push('Missing "kg-plugin.type" field');
      }
      if (!kgPlugin.main) {
        errors.push('Missing "kg-plugin.main" field');
      }
      if (kgPlugin.hooks) {
        const validHooks = [
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
        for (const hook of kgPlugin.hooks) {
          if (!validHooks.includes(hook)) {
            warnings.push(`Unknown hook: ${hook}`);
          }
        }
      }
      if (kgPlugin.minVersion && !isValidSemver(kgPlugin.minVersion)) {
        errors.push(`Invalid minVersion format: ${kgPlugin.minVersion}`);
      }
      if (kgPlugin.maxVersion && !isValidSemver(kgPlugin.maxVersion)) {
        errors.push(`Invalid maxVersion format: ${kgPlugin.maxVersion}`);
      }
      if (kgPlugin.pluginDependencies) {
        for (const dep of kgPlugin.pluginDependencies) {
          if (!dep.name) {
            errors.push('Plugin dependency missing "name" field');
          }
          if (!dep.version) {
            errors.push(`Plugin dependency "${dep.name}" missing "version" field`);
          }
        }
      }
    }
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  /**
   * Set plugin search paths
   */
  setSearchPaths(paths) {
    this.searchPaths = paths.map((p) => resolve(p));
    logger.debug("Search paths updated", { paths: this.searchPaths });
  }
  /**
   * Get current plugin search paths
   */
  getSearchPaths() {
    return [...this.searchPaths];
  }
  /**
   * Register a callback for hot-reload events
   */
  onHotReload(name, callback) {
    this.hotReloadCallbacks.set(name, callback);
  }
  /**
   * Clear the plugin cache
   */
  async clearCache() {
    const names = Array.from(this.cache.keys());
    for (const name of names) {
      await this.unload(name);
    }
    logger.info("Plugin cache cleared");
  }
  /**
   * Get cache statistics
   */
  getCacheStats() {
    let oldest = null;
    let newest = null;
    const entries = Array.from(this.cache.values());
    for (const entry of entries) {
      if (oldest === null || entry.loadedAt < oldest) {
        oldest = entry.loadedAt;
      }
      if (newest === null || entry.loadedAt > newest) {
        newest = entry.loadedAt;
      }
    }
    return {
      entries: this.cache.size,
      oldestEntry: oldest,
      newestEntry: newest
    };
  }
  // Private helpers
  /**
   * Try to discover a plugin at the given path
   */
  async tryDiscoverPlugin(path) {
    const manifest = await this.loadManifest(path);
    if (!manifest) {
      return null;
    }
    const validation = this.validateManifest(manifest);
    return {
      manifest,
      path,
      isLocal: !path.includes("node_modules"),
      valid: validation.valid,
      errors: validation.valid ? void 0 : validation.errors
    };
  }
  /**
   * Find a plugin by name in search paths
   */
  async findPlugin(name) {
    for (const searchPath of this.searchPaths) {
      const resolvedPath = resolve(searchPath);
      if (!existsSync(resolvedPath)) continue;
      const directPath = join(resolvedPath, name);
      if (existsSync(directPath)) {
        const plugin = await this.tryDiscoverPlugin(directPath);
        if (plugin) return plugin;
      }
      const nodeModulesPath = join(resolvedPath, "node_modules", name);
      if (existsSync(nodeModulesPath)) {
        const plugin = await this.tryDiscoverPlugin(nodeModulesPath);
        if (plugin) return plugin;
      }
      if (name.startsWith("@")) {
        const [scope, packageName] = name.split("/");
        const scopedPath = join(resolvedPath, "node_modules", scope, packageName);
        if (existsSync(scopedPath)) {
          const plugin = await this.tryDiscoverPlugin(scopedPath);
          if (plugin) return plugin;
        }
      }
    }
    return null;
  }
  /**
   * Load a plugin manifest from a path
   */
  async loadManifest(pluginPath) {
    const packageJsonPath = join(pluginPath, "package.json");
    if (!existsSync(packageJsonPath)) {
      return null;
    }
    try {
      const content = readFileSync(packageJsonPath, "utf-8");
      const parsed = JSON.parse(content);
      if (!isPluginManifest(parsed)) {
        return null;
      }
      return parsed;
    } catch (error) {
      logger.debug("Failed to parse package.json", {
        path: packageJsonPath,
        error: (error instanceof Error ? error : new Error(String(error))).message
      });
      return null;
    }
  }
  /**
   * Load the plugin module
   */
  async loadPluginModule(pluginPath, manifest) {
    const mainPath = join(pluginPath, manifest["kg-plugin"].main);
    if (!existsSync(mainPath)) {
      const alternatives = [
        mainPath.replace(".js", ".mjs"),
        mainPath.replace(".js", ".cjs"),
        join(dirname(mainPath), "index.js"),
        join(dirname(mainPath), "index.mjs")
      ];
      for (const alt of alternatives) {
        if (existsSync(alt)) {
          return this.importPlugin(alt);
        }
      }
      logger.error("Plugin main entry not found", void 0, {
        path: mainPath,
        tried: alternatives
      });
      return null;
    }
    return this.importPlugin(mainPath);
  }
  /**
   * Import a plugin module
   */
  async importPlugin(modulePath) {
    try {
      this.clearModuleCache(modulePath);
      const fileUrl = pathToFileURL(modulePath).href;
      const module = await import(`${fileUrl}?t=${Date.now()}`);
      const exported = module.default || module;
      if (this.isPluginInstance(exported)) {
        return exported;
      }
      if (this.isPluginConstructor(exported)) {
        return new exported();
      }
      if (this.isPluginFactory(exported)) {
        return await exported();
      }
      if (module.plugin && this.isPluginInstance(module.plugin)) {
        return module.plugin;
      }
      if (module.createPlugin && typeof module.createPlugin === "function") {
        return await module.createPlugin();
      }
      logger.error("Plugin module does not export a valid plugin", void 0, {
        path: modulePath,
        exports: Object.keys(module)
      });
      return null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to import plugin module: ${modulePath}`, err);
      return null;
    }
  }
  /**
   * Check if an export is a plugin instance
   */
  isPluginInstance(obj) {
    if (typeof obj !== "object" || obj === null) {
      return false;
    }
    const plugin = obj;
    return typeof plugin.name === "string" && typeof plugin.version === "string" && typeof plugin.type === "string" && typeof plugin.initialize === "function";
  }
  /**
   * Check if an export is a plugin constructor
   */
  isPluginConstructor(obj) {
    return typeof obj === "function" && obj.prototype && typeof obj.prototype.initialize === "function";
  }
  /**
   * Check if an export is a plugin factory
   */
  isPluginFactory(obj) {
    return typeof obj === "function" && !obj.prototype?.initialize;
  }
  /**
   * Clear module from Node.js cache
   */
  clearModuleCache(modulePath) {
    try {
      const resolved = require.resolve(modulePath);
      if (require.cache[resolved]) {
        delete require.cache[resolved];
      }
    } catch {
    }
  }
  /**
   * Setup hot-reload watcher for a plugin
   */
  setupHotReload(pluginPath, pluginName) {
    try {
      const watcher = watch(pluginPath, { recursive: true }, async (eventType, filename) => {
        if (!filename) return;
        if (!filename.match(/\.(js|ts|mjs|cjs)$/)) {
          return;
        }
        logger.info("Hot-reloading plugin", { name: pluginName, file: filename });
        const result = await this.reload(pluginName);
        if (result.success && result.plugin) {
          const callback = this.hotReloadCallbacks.get(pluginName);
          if (callback) {
            callback(result.plugin);
          }
        }
      });
      return watcher;
    } catch (error) {
      logger.warn("Failed to setup hot-reload", {
        plugin: pluginName,
        error: (error instanceof Error ? error : new Error(String(error))).message
      });
      return void 0;
    }
  }
  /**
   * Read directory entries
   */
  async readDir(path) {
    const fs = await import("fs/promises");
    try {
      return await fs.readdir(path);
    } catch {
      return [];
    }
  }
}
function createAdvancedPluginLoader(options = {}) {
  return new AdvancedPluginLoader(options);
}
export {
  AdvancedPluginLoader,
  createAdvancedPluginLoader
};
//# sourceMappingURL=loader.js.map
