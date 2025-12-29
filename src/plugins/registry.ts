/**
 * Plugin Registry
 *
 * Manages plugin registration, lifecycle, and hook execution.
 * Provides a centralized store for all loaded plugins with event-based notifications.
 *
 * @module plugins/registry
 */

import { EventEmitter } from 'events';
import { createLogger } from '../utils/index.js';
import type {
  KGPlugin,
  KGPluginManifest,
  PluginType,
  PluginHook,
  PluginMetadata,
  PluginStatus,
  PluginRegistry as IPluginRegistry,
  PluginRegistryEvents,
  AnalyzerPlugin,
} from './types.js';
import { isAnalyzerPlugin, createDefaultPluginMetadata } from './types.js';

const logger = createLogger('plugin-registry');

/**
 * Registered plugin entry
 */
interface PluginEntry {
  /** Plugin instance */
  plugin: KGPlugin;
  /** Plugin manifest */
  manifest: KGPluginManifest;
  /** Plugin metadata */
  metadata: PluginMetadata;
  /** Registration timestamp */
  registeredAt: number;
}

/**
 * Plugin compatibility validation result
 */
export interface CompatibilityResult {
  /** Whether the plugin is compatible */
  compatible: boolean;
  /** Compatibility issues */
  issues: string[];
  /** Missing dependencies */
  missingDependencies: string[];
}

/**
 * Plugin Registry implementation
 *
 * Stores and manages registered plugins, handles plugin dependencies,
 * and provides lifecycle hook execution.
 *
 * @example
 * ```typescript
 * const registry = new PluginRegistryImpl({ version: '0.4.0' });
 *
 * // Register a plugin
 * registry.register(myPlugin, manifest);
 *
 * // Execute hooks on all plugins
 * await registry.executeHook('onGraphLoad', graph);
 *
 * // Get plugins by type
 * const analyzers = registry.getByType('analyzer');
 * ```
 */
export class AdvancedPluginRegistry implements IPluginRegistry {
  private plugins: Map<string, PluginEntry> = new Map();
  private hookSubscribers: Map<PluginHook, Set<string>> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();
  private readonly agentVersion: string;

  constructor(options: { version: string }) {
    this.agentVersion = options.version;
  }

  /**
   * Register a plugin
   */
  register(plugin: KGPlugin, manifest: KGPluginManifest): void {
    const { name, version, type } = plugin;

    // Validate plugin name matches manifest
    if (name !== manifest.name) {
      throw new Error(
        `Plugin name mismatch: plugin reports "${name}" but manifest has "${manifest.name}"`
      );
    }

    // Check for existing registration
    if (this.plugins.has(name)) {
      logger.warn('Plugin already registered, replacing', { name });
      this.unregister(name);
    }

    // Validate compatibility
    const compatibility = this.validateCompatibility(manifest);
    if (!compatibility.compatible) {
      throw new Error(
        `Plugin "${name}" is not compatible: ${compatibility.issues.join(', ')}`
      );
    }

    // Check dependencies
    if (compatibility.missingDependencies.length > 0) {
      throw new Error(
        `Plugin "${name}" has missing dependencies: ${compatibility.missingDependencies.join(', ')}`
      );
    }

    // Create metadata
    const metadata: PluginMetadata = {
      ...createDefaultPluginMetadata(name, version, type),
      status: 'initialized',
      hooks: manifest['kg-plugin'].hooks || [],
      capabilities: (manifest['kg-plugin'].capabilities || []).map(c => c.name),
    };

    // Register hook subscriptions
    for (const hook of metadata.hooks) {
      if (!this.hookSubscribers.has(hook)) {
        this.hookSubscribers.set(hook, new Set());
      }
      this.hookSubscribers.get(hook)!.add(name);
    }

    // Store the plugin
    const entry: PluginEntry = {
      plugin,
      manifest,
      metadata,
      registeredAt: Date.now(),
    };
    this.plugins.set(name, entry);

    logger.info('Plugin registered', {
      name,
      version,
      type,
      hooks: metadata.hooks.length,
    });

    // Emit registration event
    this.eventEmitter.emit('registered', { plugin, metadata });
  }

  /**
   * Unregister a plugin
   */
  unregister(name: string): boolean {
    const entry = this.plugins.get(name);
    if (!entry) {
      return false;
    }

    // Remove hook subscriptions
    for (const hook of entry.metadata.hooks) {
      this.hookSubscribers.get(hook)?.delete(name);
    }

    // Remove from registry
    this.plugins.delete(name);

    logger.info('Plugin unregistered', { name });

    // Emit unregistration event
    this.eventEmitter.emit('unregistered', { name });

    return true;
  }

  /**
   * Get a plugin by name
   */
  get<T extends KGPlugin = KGPlugin>(name: string): T | undefined {
    return this.plugins.get(name)?.plugin as T | undefined;
  }

  /**
   * Get all registered plugins
   */
  getAll(): KGPlugin[] {
    return Array.from(this.plugins.values()).map(e => e.plugin);
  }

  /**
   * Get plugins by type
   */
  getByType<T extends KGPlugin = KGPlugin>(type: PluginType): T[] {
    return Array.from(this.plugins.values())
      .filter(e => e.plugin.type === type)
      .map(e => e.plugin as T);
  }

  /**
   * Get all analyzer plugins
   */
  getAnalyzers(): AnalyzerPlugin[] {
    return this.getByType<AnalyzerPlugin>('analyzer').filter(isAnalyzerPlugin);
  }

  /**
   * Check if a plugin is registered
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get plugin metadata
   */
  getMetadata(name: string): PluginMetadata | undefined {
    return this.plugins.get(name)?.metadata;
  }

  /**
   * Enable a plugin
   */
  async enable(name: string): Promise<boolean> {
    const entry = this.plugins.get(name);
    if (!entry) {
      logger.warn('Cannot enable unknown plugin', { name });
      return false;
    }

    if (entry.metadata.status === 'active') {
      logger.debug('Plugin already active', { name });
      return true;
    }

    entry.metadata.status = 'active';
    logger.info('Plugin enabled', { name });

    this.eventEmitter.emit('enabled', { name });
    return true;
  }

  /**
   * Disable a plugin
   */
  async disable(name: string): Promise<boolean> {
    const entry = this.plugins.get(name);
    if (!entry) {
      logger.warn('Cannot disable unknown plugin', { name });
      return false;
    }

    if (entry.metadata.status === 'disabled') {
      logger.debug('Plugin already disabled', { name });
      return true;
    }

    entry.metadata.status = 'disabled';
    logger.info('Plugin disabled', { name });

    this.eventEmitter.emit('disabled', { name });
    return true;
  }

  /**
   * Execute a lifecycle hook on all applicable plugins
   */
  async executeHook<T = void>(
    hook: PluginHook,
    ...args: unknown[]
  ): Promise<Map<string, T | Error>> {
    const results = new Map<string, T | Error>();
    const subscribers = this.hookSubscribers.get(hook);

    if (!subscribers || subscribers.size === 0) {
      return results;
    }

    const startTime = Date.now();
    const executedPlugins: string[] = [];

    // Sort by priority (lower = earlier)
    const sortedSubscribers = Array.from(subscribers)
      .map(name => {
        const entry = this.plugins.get(name);
        return {
          name,
          priority: entry?.manifest['kg-plugin'].priority ?? 100,
        };
      })
      .sort((a, b) => a.priority - b.priority);

    for (const { name } of sortedSubscribers) {
      const entry = this.plugins.get(name);
      if (!entry) continue;

      // Skip disabled plugins
      if (entry.metadata.status === 'disabled') {
        continue;
      }

      const hookFn = entry.plugin[hook];
      if (typeof hookFn !== 'function') {
        continue;
      }

      try {
        // Call the hook
        const result = await (hookFn as (...args: unknown[]) => Promise<T>).call(
          entry.plugin,
          ...args
        );
        results.set(name, result);
        executedPlugins.push(name);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        results.set(name, err);
        entry.metadata.lastError = err.message;
        entry.metadata.status = 'error';

        logger.error(`Hook execution failed for plugin "${name}"`, err, {
          hook,
          plugin: name,
        });

        this.eventEmitter.emit('error', { name, error: err });
      }
    }

    const duration = Date.now() - startTime;
    logger.debug('Hook executed', {
      hook,
      plugins: executedPlugins.length,
      duration,
    });

    this.eventEmitter.emit('hookExecuted', {
      hook,
      plugins: executedPlugins,
      duration,
    });

    return results;
  }

  /**
   * Get plugins that subscribe to a specific hook
   */
  getHookSubscribers(hook: PluginHook): string[] {
    return Array.from(this.hookSubscribers.get(hook) || []);
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalPlugins: number;
    activePlugins: number;
    disabledPlugins: number;
    errorPlugins: number;
    pluginsByType: Record<PluginType, number>;
    hookSubscriptions: Record<PluginHook, number>;
  } {
    const pluginsByType: Partial<Record<PluginType, number>> = {};
    const hookSubscriptions: Partial<Record<PluginHook, number>> = {};

    let activePlugins = 0;
    let disabledPlugins = 0;
    let errorPlugins = 0;

    const pluginEntries = Array.from(this.plugins.values());
    for (const entry of pluginEntries) {
      // Count by type
      const type = entry.plugin.type;
      pluginsByType[type] = (pluginsByType[type] || 0) + 1;

      // Count by status
      switch (entry.metadata.status) {
        case 'active':
          activePlugins++;
          break;
        case 'disabled':
          disabledPlugins++;
          break;
        case 'error':
          errorPlugins++;
          break;
      }
    }

    // Count hook subscriptions
    const hookEntries = Array.from(this.hookSubscribers.entries());
    for (const [hook, subscribers] of hookEntries) {
      hookSubscriptions[hook] = subscribers.size;
    }

    return {
      totalPlugins: this.plugins.size,
      activePlugins,
      disabledPlugins,
      errorPlugins,
      pluginsByType: pluginsByType as Record<PluginType, number>,
      hookSubscriptions: hookSubscriptions as Record<PluginHook, number>,
    };
  }

  /**
   * Subscribe to registry events
   */
  on<K extends keyof PluginRegistryEvents>(
    event: K,
    listener: (data: PluginRegistryEvents[K]) => void
  ): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Unsubscribe from registry events
   */
  off<K extends keyof PluginRegistryEvents>(
    event: K,
    listener: (data: PluginRegistryEvents[K]) => void
  ): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Clear all registered plugins
   */
  async clear(): Promise<void> {
    // Destroy all plugins
    const pluginEntries = Array.from(this.plugins.entries());
    for (const [name, entry] of pluginEntries) {
      try {
        if (typeof entry.plugin.destroy === 'function') {
          await entry.plugin.destroy();
        }
      } catch (error) {
        logger.error(`Failed to destroy plugin "${name}"`, error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.plugins.clear();
    this.hookSubscribers.clear();

    logger.info('Registry cleared');
  }

  /**
   * Validate plugin compatibility with the current agent version
   */
  validateCompatibility(manifest: KGPluginManifest): CompatibilityResult {
    const issues: string[] = [];
    const missingDependencies: string[] = [];
    const kgPlugin = manifest['kg-plugin'];

    // Check minimum version requirement
    if (kgPlugin.minVersion) {
      if (!this.satisfiesVersion(this.agentVersion, `>=${kgPlugin.minVersion}`)) {
        issues.push(
          `Requires minimum version ${kgPlugin.minVersion}, current: ${this.agentVersion}`
        );
      }
    }

    // Check maximum version requirement
    if (kgPlugin.maxVersion) {
      if (!this.satisfiesVersion(this.agentVersion, `<=${kgPlugin.maxVersion}`)) {
        issues.push(
          `Requires maximum version ${kgPlugin.maxVersion}, current: ${this.agentVersion}`
        );
      }
    }

    // Check plugin dependencies
    if (kgPlugin.pluginDependencies) {
      for (const dep of kgPlugin.pluginDependencies) {
        if (!this.has(dep.name)) {
          if (!dep.optional) {
            missingDependencies.push(dep.name);
          }
        } else {
          // Check version compatibility
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
      missingDependencies,
    };
  }

  /**
   * Check if a plugin has a specific capability
   */
  hasCapability(capabilityName: string): boolean {
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
  getByCapability(capabilityName: string): KGPlugin[] {
    return Array.from(this.plugins.values())
      .filter(e => e.metadata.capabilities.includes(capabilityName))
      .map(e => e.plugin);
  }

  /**
   * Get the dependency graph for all plugins
   */
  getDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    const pluginEntries = Array.from(this.plugins.entries());

    for (const [name, entry] of pluginEntries) {
      const deps = entry.manifest['kg-plugin'].pluginDependencies || [];
      graph.set(
        name,
        deps.filter(d => !d.optional).map(d => d.name)
      );
    }

    return graph;
  }

  /**
   * Check if plugins can be safely unregistered (no dependents)
   */
  canUnregister(name: string): { canUnregister: boolean; dependents: string[] } {
    const dependents: string[] = [];
    const pluginEntries = Array.from(this.plugins.entries());

    for (const [pluginName, entry] of pluginEntries) {
      if (pluginName === name) continue;

      const deps = entry.manifest['kg-plugin'].pluginDependencies || [];
      const hasDep = deps.some(d => d.name === name && !d.optional);
      if (hasDep) {
        dependents.push(pluginName);
      }
    }

    return {
      canUnregister: dependents.length === 0,
      dependents,
    };
  }

  /**
   * Update plugin status
   */
  setPluginStatus(name: string, status: PluginStatus): void {
    const entry = this.plugins.get(name);
    if (entry) {
      entry.metadata.status = status;
    }
  }

  /**
   * Simple version comparison
   * Supports basic semver-like comparisons
   */
  private satisfiesVersion(version: string, requirement: string): boolean {
    // Parse version
    const parseVersion = (v: string): number[] => {
      return v.replace(/[^0-9.]/g, '').split('.').map(n => parseInt(n, 10) || 0);
    };

    const current = parseVersion(version);

    // Handle range requirements
    if (requirement.startsWith('>=')) {
      const required = parseVersion(requirement.slice(2));
      return this.compareVersions(current, required) >= 0;
    }

    if (requirement.startsWith('<=')) {
      const required = parseVersion(requirement.slice(2));
      return this.compareVersions(current, required) <= 0;
    }

    if (requirement.startsWith('>')) {
      const required = parseVersion(requirement.slice(1));
      return this.compareVersions(current, required) > 0;
    }

    if (requirement.startsWith('<')) {
      const required = parseVersion(requirement.slice(1));
      return this.compareVersions(current, required) < 0;
    }

    if (requirement.startsWith('^')) {
      const required = parseVersion(requirement.slice(1));
      // Caret allows changes that do not modify the left-most non-zero digit
      return current[0] === required[0] && this.compareVersions(current, required) >= 0;
    }

    if (requirement.startsWith('~')) {
      const required = parseVersion(requirement.slice(1));
      // Tilde allows patch-level changes
      return (
        current[0] === required[0] &&
        current[1] === required[1] &&
        this.compareVersions(current, required) >= 0
      );
    }

    // Exact match
    const required = parseVersion(requirement);
    return this.compareVersions(current, required) === 0;
  }

  /**
   * Compare two version arrays
   */
  private compareVersions(a: number[], b: number[]): number {
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

/**
 * Create a new advanced plugin registry
 */
export function createAdvancedPluginRegistry(options: { version: string }): AdvancedPluginRegistry {
  return new AdvancedPluginRegistry(options);
}
