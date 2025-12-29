/**
 * Plugin Registry
 *
 * Manages plugin registration, lifecycle, and hook execution.
 * Provides a centralized store for all loaded plugins with event-based notifications.
 *
 * @module plugins/registry
 */
import type { KGPlugin, KGPluginManifest, PluginType, PluginHook, PluginMetadata, PluginStatus, PluginRegistry as IPluginRegistry, PluginRegistryEvents, AnalyzerPlugin } from './types.js';
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
export declare class AdvancedPluginRegistry implements IPluginRegistry {
    private plugins;
    private hookSubscribers;
    private eventEmitter;
    private readonly agentVersion;
    constructor(options: {
        version: string;
    });
    /**
     * Register a plugin
     */
    register(plugin: KGPlugin, manifest: KGPluginManifest): void;
    /**
     * Unregister a plugin
     */
    unregister(name: string): boolean;
    /**
     * Get a plugin by name
     */
    get<T extends KGPlugin = KGPlugin>(name: string): T | undefined;
    /**
     * Get all registered plugins
     */
    getAll(): KGPlugin[];
    /**
     * Get plugins by type
     */
    getByType<T extends KGPlugin = KGPlugin>(type: PluginType): T[];
    /**
     * Get all analyzer plugins
     */
    getAnalyzers(): AnalyzerPlugin[];
    /**
     * Check if a plugin is registered
     */
    has(name: string): boolean;
    /**
     * Get plugin metadata
     */
    getMetadata(name: string): PluginMetadata | undefined;
    /**
     * Enable a plugin
     */
    enable(name: string): Promise<boolean>;
    /**
     * Disable a plugin
     */
    disable(name: string): Promise<boolean>;
    /**
     * Execute a lifecycle hook on all applicable plugins
     */
    executeHook<T = void>(hook: PluginHook, ...args: unknown[]): Promise<Map<string, T | Error>>;
    /**
     * Get plugins that subscribe to a specific hook
     */
    getHookSubscribers(hook: PluginHook): string[];
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
    };
    /**
     * Subscribe to registry events
     */
    on<K extends keyof PluginRegistryEvents>(event: K, listener: (data: PluginRegistryEvents[K]) => void): void;
    /**
     * Unsubscribe from registry events
     */
    off<K extends keyof PluginRegistryEvents>(event: K, listener: (data: PluginRegistryEvents[K]) => void): void;
    /**
     * Clear all registered plugins
     */
    clear(): Promise<void>;
    /**
     * Validate plugin compatibility with the current agent version
     */
    validateCompatibility(manifest: KGPluginManifest): CompatibilityResult;
    /**
     * Check if a plugin has a specific capability
     */
    hasCapability(capabilityName: string): boolean;
    /**
     * Get plugins that provide a specific capability
     */
    getByCapability(capabilityName: string): KGPlugin[];
    /**
     * Get the dependency graph for all plugins
     */
    getDependencyGraph(): Map<string, string[]>;
    /**
     * Check if plugins can be safely unregistered (no dependents)
     */
    canUnregister(name: string): {
        canUnregister: boolean;
        dependents: string[];
    };
    /**
     * Update plugin status
     */
    setPluginStatus(name: string, status: PluginStatus): void;
    /**
     * Simple version comparison
     * Supports basic semver-like comparisons
     */
    private satisfiesVersion;
    /**
     * Compare two version arrays
     */
    private compareVersions;
}
/**
 * Create a new advanced plugin registry
 */
export declare function createAdvancedPluginRegistry(options: {
    version: string;
}): AdvancedPluginRegistry;
//# sourceMappingURL=registry.d.ts.map