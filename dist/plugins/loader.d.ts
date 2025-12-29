/**
 * Plugin Loader
 *
 * Handles plugin discovery, loading, validation, and hot-reloading.
 * Supports loading plugins from file paths and npm packages.
 *
 * @module plugins/loader
 */
import type { KGPlugin, KGPluginManifest, PluginLoader as IPluginLoader, PluginLoadOptions, PluginLoadResult, DiscoveredPlugin } from './types.js';
/**
 * Plugin Loader implementation
 *
 * Discovers, validates, and loads plugins from the filesystem or npm.
 * Supports caching and hot-reloading for development.
 *
 * @example
 * ```typescript
 * const loader = new PluginLoaderImpl({
 *   searchPaths: ['./plugins', './node_modules'],
 *   enableHotReload: true,
 * });
 *
 * // Discover available plugins
 * const discovered = await loader.discover();
 *
 * // Load a specific plugin
 * const result = await loader.load('@kg-plugins/markdown');
 * if (result.success) {
 *   console.log('Loaded:', result.plugin.name);
 * }
 * ```
 */
export declare class AdvancedPluginLoader implements IPluginLoader {
    private cache;
    private searchPaths;
    private enableHotReload;
    private hotReloadCallbacks;
    constructor(options?: {
        searchPaths?: string[];
        enableHotReload?: boolean;
    });
    /**
     * Discover available plugins in search paths
     */
    discover(): Promise<DiscoveredPlugin[]>;
    /**
     * Load a plugin by name
     */
    load(name: string, options?: PluginLoadOptions): Promise<PluginLoadResult>;
    /**
     * Load a plugin from a specific path
     */
    loadFromPath(path: string, options?: PluginLoadOptions): Promise<PluginLoadResult>;
    /**
     * Unload a plugin by name
     */
    unload(name: string): Promise<boolean>;
    /**
     * Reload a plugin
     */
    reload(name: string): Promise<PluginLoadResult>;
    /**
     * Get a loaded plugin by name
     */
    get(name: string): KGPlugin | undefined;
    /**
     * Check if a plugin is loaded
     */
    isLoaded(name: string): boolean;
    /**
     * Get all loaded plugins
     */
    getAll(): KGPlugin[];
    /**
     * Validate a plugin manifest
     */
    validateManifest(manifest: KGPluginManifest): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
    /**
     * Set plugin search paths
     */
    setSearchPaths(paths: string[]): void;
    /**
     * Get current plugin search paths
     */
    getSearchPaths(): string[];
    /**
     * Register a callback for hot-reload events
     */
    onHotReload(name: string, callback: (plugin: KGPlugin) => void): void;
    /**
     * Clear the plugin cache
     */
    clearCache(): Promise<void>;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        entries: number;
        oldestEntry: number | null;
        newestEntry: number | null;
    };
    /**
     * Try to discover a plugin at the given path
     */
    private tryDiscoverPlugin;
    /**
     * Find a plugin by name in search paths
     */
    private findPlugin;
    /**
     * Load a plugin manifest from a path
     */
    private loadManifest;
    /**
     * Load the plugin module
     */
    private loadPluginModule;
    /**
     * Import a plugin module
     */
    private importPlugin;
    /**
     * Check if an export is a plugin instance
     */
    private isPluginInstance;
    /**
     * Check if an export is a plugin constructor
     */
    private isPluginConstructor;
    /**
     * Check if an export is a plugin factory
     */
    private isPluginFactory;
    /**
     * Clear module from Node.js cache
     */
    private clearModuleCache;
    /**
     * Setup hot-reload watcher for a plugin
     */
    private setupHotReload;
    /**
     * Read directory entries
     */
    private readDir;
}
/**
 * Create a new advanced plugin loader
 */
export declare function createAdvancedPluginLoader(options?: {
    searchPaths?: string[];
    enableHotReload?: boolean;
}): AdvancedPluginLoader;
//# sourceMappingURL=loader.d.ts.map