import { EventEmitter } from "events";
import { createLogger } from "../utils/logger.js";
import { createDefaultPluginMetadata, isAnalyzerPlugin } from "./types.js";
const logger = createLogger("plugin-registry");
class AdvancedPluginRegistry {
  plugins = /* @__PURE__ */ new Map();
  hookSubscribers = /* @__PURE__ */ new Map();
  eventEmitter = new EventEmitter();
  agentVersion;
  constructor(options) {
    this.agentVersion = options.version;
  }
  /**
   * Register a plugin
   */
  register(plugin, manifest) {
    const { name, version, type } = plugin;
    if (name !== manifest.name) {
      throw new Error(
        `Plugin name mismatch: plugin reports "${name}" but manifest has "${manifest.name}"`
      );
    }
    if (this.plugins.has(name)) {
      logger.warn("Plugin already registered, replacing", { name });
      this.unregister(name);
    }
    const compatibility = this.validateCompatibility(manifest);
    if (!compatibility.compatible) {
      throw new Error(
        `Plugin "${name}" is not compatible: ${compatibility.issues.join(", ")}`
      );
    }
    if (compatibility.missingDependencies.length > 0) {
      throw new Error(
        `Plugin "${name}" has missing dependencies: ${compatibility.missingDependencies.join(", ")}`
      );
    }
    const metadata = {
      ...createDefaultPluginMetadata(name, version, type),
      status: "initialized",
      hooks: manifest["kg-plugin"].hooks || [],
      capabilities: (manifest["kg-plugin"].capabilities || []).map((c) => c.name)
    };
    for (const hook of metadata.hooks) {
      if (!this.hookSubscribers.has(hook)) {
        this.hookSubscribers.set(hook, /* @__PURE__ */ new Set());
      }
      this.hookSubscribers.get(hook).add(name);
    }
    const entry = {
      plugin,
      manifest,
      metadata,
      registeredAt: Date.now()
    };
    this.plugins.set(name, entry);
    logger.info("Plugin registered", {
      name,
      version,
      type,
      hooks: metadata.hooks.length
    });
    this.eventEmitter.emit("registered", { plugin, metadata });
  }
  /**
   * Unregister a plugin
   */
  unregister(name) {
    const entry = this.plugins.get(name);
    if (!entry) {
      return false;
    }
    for (const hook of entry.metadata.hooks) {
      this.hookSubscribers.get(hook)?.delete(name);
    }
    this.plugins.delete(name);
    logger.info("Plugin unregistered", { name });
    this.eventEmitter.emit("unregistered", { name });
    return true;
  }
  /**
   * Get a plugin by name
   */
  get(name) {
    return this.plugins.get(name)?.plugin;
  }
  /**
   * Get all registered plugins
   */
  getAll() {
    return Array.from(this.plugins.values()).map((e) => e.plugin);
  }
  /**
   * Get plugins by type
   */
  getByType(type) {
    return Array.from(this.plugins.values()).filter((e) => e.plugin.type === type).map((e) => e.plugin);
  }
  /**
   * Get all analyzer plugins
   */
  getAnalyzers() {
    return this.getByType("analyzer").filter(isAnalyzerPlugin);
  }
  /**
   * Check if a plugin is registered
   */
  has(name) {
    return this.plugins.has(name);
  }
  /**
   * Get plugin metadata
   */
  getMetadata(name) {
    return this.plugins.get(name)?.metadata;
  }
  /**
   * Enable a plugin
   */
  async enable(name) {
    const entry = this.plugins.get(name);
    if (!entry) {
      logger.warn("Cannot enable unknown plugin", { name });
      return false;
    }
    if (entry.metadata.status === "active") {
      logger.debug("Plugin already active", { name });
      return true;
    }
    entry.metadata.status = "active";
    logger.info("Plugin enabled", { name });
    this.eventEmitter.emit("enabled", { name });
    return true;
  }
  /**
   * Disable a plugin
   */
  async disable(name) {
    const entry = this.plugins.get(name);
    if (!entry) {
      logger.warn("Cannot disable unknown plugin", { name });
      return false;
    }
    if (entry.metadata.status === "disabled") {
      logger.debug("Plugin already disabled", { name });
      return true;
    }
    entry.metadata.status = "disabled";
    logger.info("Plugin disabled", { name });
    this.eventEmitter.emit("disabled", { name });
    return true;
  }
  /**
   * Execute a lifecycle hook on all applicable plugins
   */
  async executeHook(hook, ...args) {
    const results = /* @__PURE__ */ new Map();
    const subscribers = this.hookSubscribers.get(hook);
    if (!subscribers || subscribers.size === 0) {
      return results;
    }
    const startTime = Date.now();
    const executedPlugins = [];
    const sortedSubscribers = Array.from(subscribers).map((name) => {
      const entry = this.plugins.get(name);
      return {
        name,
        priority: entry?.manifest["kg-plugin"].priority ?? 100
      };
    }).sort((a, b) => a.priority - b.priority);
    for (const { name } of sortedSubscribers) {
      const entry = this.plugins.get(name);
      if (!entry) continue;
      if (entry.metadata.status === "disabled") {
        continue;
      }
      const hookFn = entry.plugin[hook];
      if (typeof hookFn !== "function") {
        continue;
      }
      try {
        const result = await hookFn.call(
          entry.plugin,
          ...args
        );
        results.set(name, result);
        executedPlugins.push(name);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        results.set(name, err);
        entry.metadata.lastError = err.message;
        entry.metadata.status = "error";
        logger.error(`Hook execution failed for plugin "${name}"`, err, {
          hook,
          plugin: name
        });
        this.eventEmitter.emit("error", { name, error: err });
      }
    }
    const duration = Date.now() - startTime;
    logger.debug("Hook executed", {
      hook,
      plugins: executedPlugins.length,
      duration
    });
    this.eventEmitter.emit("hookExecuted", {
      hook,
      plugins: executedPlugins,
      duration
    });
    return results;
  }
  /**
   * Get plugins that subscribe to a specific hook
   */
  getHookSubscribers(hook) {
    return Array.from(this.hookSubscribers.get(hook) || []);
  }
  /**
   * Get registry statistics
   */
  getStats() {
    const pluginsByType = {};
    const hookSubscriptions = {};
    let activePlugins = 0;
    let disabledPlugins = 0;
    let errorPlugins = 0;
    const pluginEntries = Array.from(this.plugins.values());
    for (const entry of pluginEntries) {
      const type = entry.plugin.type;
      pluginsByType[type] = (pluginsByType[type] || 0) + 1;
      switch (entry.metadata.status) {
        case "active":
          activePlugins++;
          break;
        case "disabled":
          disabledPlugins++;
          break;
        case "error":
          errorPlugins++;
          break;
      }
    }
    const hookEntries = Array.from(this.hookSubscribers.entries());
    for (const [hook, subscribers] of hookEntries) {
      hookSubscriptions[hook] = subscribers.size;
    }
    return {
      totalPlugins: this.plugins.size,
      activePlugins,
      disabledPlugins,
      errorPlugins,
      pluginsByType,
      hookSubscriptions
    };
  }
  /**
   * Subscribe to registry events
   */
  on(event, listener) {
    this.eventEmitter.on(event, listener);
  }
  /**
   * Unsubscribe from registry events
   */
  off(event, listener) {
    this.eventEmitter.off(event, listener);
  }
  /**
   * Clear all registered plugins
   */
  async clear() {
    const pluginEntries = Array.from(this.plugins.entries());
    for (const [name, entry] of pluginEntries) {
      try {
        if (typeof entry.plugin.destroy === "function") {
          await entry.plugin.destroy();
        }
      } catch (error) {
        logger.error(`Failed to destroy plugin "${name}"`, error instanceof Error ? error : new Error(String(error)));
      }
    }
    this.plugins.clear();
    this.hookSubscribers.clear();
    logger.info("Registry cleared");
  }
  /**
   * Validate plugin compatibility with the current agent version
   */
  validateCompatibility(manifest) {
    const issues = [];
    const missingDependencies = [];
    const kgPlugin = manifest["kg-plugin"];
    if (kgPlugin.minVersion) {
      if (!this.satisfiesVersion(this.agentVersion, `>=${kgPlugin.minVersion}`)) {
        issues.push(
          `Requires minimum version ${kgPlugin.minVersion}, current: ${this.agentVersion}`
        );
      }
    }
    if (kgPlugin.maxVersion) {
      if (!this.satisfiesVersion(this.agentVersion, `<=${kgPlugin.maxVersion}`)) {
        issues.push(
          `Requires maximum version ${kgPlugin.maxVersion}, current: ${this.agentVersion}`
        );
      }
    }
    if (kgPlugin.pluginDependencies) {
      for (const dep of kgPlugin.pluginDependencies) {
        if (!this.has(dep.name)) {
          if (!dep.optional) {
            missingDependencies.push(dep.name);
          }
        } else {
          const depPlugin = this.plugins.get(dep.name);
          if (depPlugin && !this.satisfiesVersion(depPlugin.plugin.version, dep.version)) {
            issues.push(
              `Dependency "${dep.name}" version ${depPlugin.plugin.version} does not satisfy ${dep.version}`
            );
          }
        }
      }
    }
    return {
      compatible: issues.length === 0 && missingDependencies.length === 0,
      issues,
      missingDependencies
    };
  }
  /**
   * Check if a plugin has a specific capability
   */
  hasCapability(capabilityName) {
    const entries = Array.from(this.plugins.values());
    for (const entry of entries) {
      if (entry.metadata.capabilities.includes(capabilityName)) {
        return true;
      }
    }
    return false;
  }
  /**
   * Get plugins that provide a specific capability
   */
  getByCapability(capabilityName) {
    return Array.from(this.plugins.values()).filter((e) => e.metadata.capabilities.includes(capabilityName)).map((e) => e.plugin);
  }
  /**
   * Get the dependency graph for all plugins
   */
  getDependencyGraph() {
    const graph = /* @__PURE__ */ new Map();
    const pluginEntries = Array.from(this.plugins.entries());
    for (const [name, entry] of pluginEntries) {
      const deps = entry.manifest["kg-plugin"].pluginDependencies || [];
      graph.set(
        name,
        deps.filter((d) => !d.optional).map((d) => d.name)
      );
    }
    return graph;
  }
  /**
   * Check if plugins can be safely unregistered (no dependents)
   */
  canUnregister(name) {
    const dependents = [];
    const pluginEntries = Array.from(this.plugins.entries());
    for (const [pluginName, entry] of pluginEntries) {
      if (pluginName === name) continue;
      const deps = entry.manifest["kg-plugin"].pluginDependencies || [];
      const hasDep = deps.some((d) => d.name === name && !d.optional);
      if (hasDep) {
        dependents.push(pluginName);
      }
    }
    return {
      canUnregister: dependents.length === 0,
      dependents
    };
  }
  /**
   * Update plugin status
   */
  setPluginStatus(name, status) {
    const entry = this.plugins.get(name);
    if (entry) {
      entry.metadata.status = status;
    }
  }
  /**
   * Simple version comparison
   * Supports basic semver-like comparisons
   */
  satisfiesVersion(version, requirement) {
    const parseVersion = (v) => {
      return v.replace(/[^0-9.]/g, "").split(".").map((n) => parseInt(n, 10) || 0);
    };
    const current = parseVersion(version);
    if (requirement.startsWith(">=")) {
      const required2 = parseVersion(requirement.slice(2));
      return this.compareVersions(current, required2) >= 0;
    }
    if (requirement.startsWith("<=")) {
      const required2 = parseVersion(requirement.slice(2));
      return this.compareVersions(current, required2) <= 0;
    }
    if (requirement.startsWith(">")) {
      const required2 = parseVersion(requirement.slice(1));
      return this.compareVersions(current, required2) > 0;
    }
    if (requirement.startsWith("<")) {
      const required2 = parseVersion(requirement.slice(1));
      return this.compareVersions(current, required2) < 0;
    }
    if (requirement.startsWith("^")) {
      const required2 = parseVersion(requirement.slice(1));
      return current[0] === required2[0] && this.compareVersions(current, required2) >= 0;
    }
    if (requirement.startsWith("~")) {
      const required2 = parseVersion(requirement.slice(1));
      return current[0] === required2[0] && current[1] === required2[1] && this.compareVersions(current, required2) >= 0;
    }
    const required = parseVersion(requirement);
    return this.compareVersions(current, required) === 0;
  }
  /**
   * Compare two version arrays
   */
  compareVersions(a, b) {
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      const aVal = a[i] || 0;
      const bVal = b[i] || 0;
      if (aVal > bVal) return 1;
      if (aVal < bVal) return -1;
    }
    return 0;
  }
}
function createAdvancedPluginRegistry(options) {
  return new AdvancedPluginRegistry(options);
}
export {
  AdvancedPluginRegistry,
  createAdvancedPluginRegistry
};
//# sourceMappingURL=registry.js.map
