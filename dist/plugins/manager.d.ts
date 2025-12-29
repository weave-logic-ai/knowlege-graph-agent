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
import type { KnowledgeGraphManager } from '../core/graph.js';
import type { KGConfiguration } from '../config/types.js';
import type { KGPlugin, PluginType, PluginHook, PluginMetadata, PluginContext, KGPluginManifest, PluginLoader, PluginRegistry, PluginManager, PluginManagerConfig, PluginLoadOptions, PluginLoadResult, DiscoveredPlugin, PluginRegistryEvents, AnalyzerPlugin, KnowledgeGraphDatabase, ShadowCache } from './types.js';
/**
 * Registry for managing loaded plugins
 */
export declare class PluginRegistryImpl extends EventEmitter implements PluginRegistry {
    private plugins;
    private manifests;
    private metadata;
    private hookSubscribers;
    constructor();
    register(plugin: KGPlugin, manifest: KGPluginManifest): void;
    unregister(name: string): boolean;
    get<T extends KGPlugin = KGPlugin>(name: string): T | undefined;
    getAll(): KGPlugin[];
    getByType<T extends KGPlugin = KGPlugin>(type: PluginType): T[];
    getAnalyzers(): AnalyzerPlugin[];
    has(name: string): boolean;
    getMetadata(name: string): PluginMetadata | undefined;
    enable(name: string): Promise<boolean>;
    disable(name: string): Promise<boolean>;
    executeHook<T = void>(hook: PluginHook, ...args: unknown[]): Promise<Map<string, T | Error>>;
    getHookSubscribers(hook: PluginHook): string[];
    getStats(): {
        totalPlugins: number;
        activePlugins: number;
        disabledPlugins: number;
        errorPlugins: number;
        pluginsByType: Record<PluginType, number>;
        hookSubscriptions: Record<PluginHook, number>;
    };
    on<K extends keyof PluginRegistryEvents>(event: K, listener: (data: PluginRegistryEvents[K]) => void): this;
    off<K extends keyof PluginRegistryEvents>(event: K, listener: (data: PluginRegistryEvents[K]) => void): this;
    clear(): Promise<void>;
}
/**
 * Loader for discovering and loading plugins
 */
export declare class PluginLoaderImpl implements PluginLoader {
    private loadedPlugins;
    private loadedMetadata;
    private searchPaths;
    constructor(searchPaths?: string[]);
    discover(): Promise<DiscoveredPlugin[]>;
    load(name: string, options?: PluginLoadOptions): Promise<PluginLoadResult>;
    loadFromPath(path: string, options?: PluginLoadOptions): Promise<PluginLoadResult>;
    private loadModule;
    unload(name: string): Promise<boolean>;
    reload(name: string): Promise<PluginLoadResult>;
    get(name: string): KGPlugin | undefined;
    isLoaded(name: string): boolean;
    getAll(): KGPlugin[];
    validateManifest(manifest: KGPluginManifest): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
    setSearchPaths(paths: string[]): void;
    getSearchPaths(): string[];
}
/**
 * Main plugin manager for high-level plugin operations
 */
export declare class PluginManagerImpl extends EventEmitter implements PluginManager {
    readonly loader: PluginLoader;
    readonly registry: PluginRegistry;
    private config;
    private contexts;
    private pluginConfigs;
    private isShuttingDown;
    private sharedEventEmitter;
    private commands;
    private abortController;
    private database?;
    private graph?;
    private cache?;
    private appConfig?;
    private projectRoot?;
    constructor(config: PluginManagerConfig);
    /**
     * Set dependencies for plugin contexts
     */
    setDependencies(deps: {
        database: KnowledgeGraphDatabase;
        graph: KnowledgeGraphManager;
        cache: ShadowCache;
        config: KGConfiguration;
        projectRoot: string;
    }): void;
    initialize(): Promise<void>;
    /**
     * Load multiple plugins with concurrency control
     */
    private loadPlugins;
    /**
     * Initialize a single plugin with context
     */
    private initializePlugin;
    /**
     * Detect which hooks a plugin implements
     */
    private detectPluginHooks;
    install(source: string): Promise<{
        success: boolean;
        name?: string;
        version?: string;
        error?: string;
    }>;
    uninstall(name: string): Promise<boolean>;
    update(name: string): Promise<{
        success: boolean;
        previousVersion?: string;
        newVersion?: string;
        error?: string;
    }>;
    checkUpdates(): Promise<Array<{
        name: string;
        currentVersion: string;
        latestVersion: string;
    }>>;
    getConfig(name: string): Record<string, unknown> | undefined;
    setConfig(name: string, config: Record<string, unknown>): Promise<void>;
    /**
     * Get plugin context for a specific plugin
     */
    getPluginContext(name: string): PluginContext;
    /**
     * Find the path to a plugin
     */
    private findPluginPath;
    /**
     * Create plugin API for system interaction
     */
    private createPluginAPI;
    /**
     * Invoke a lifecycle hook on all plugins
     */
    invokeHook<T = void>(hook: PluginHook, ...args: unknown[]): Promise<Map<string, T | Error>>;
    /**
     * Enable a specific plugin
     */
    enablePlugin(name: string): Promise<void>;
    /**
     * Disable a specific plugin
     */
    disablePlugin(name: string): Promise<void>;
    shutdown(): Promise<void>;
    private createMockDatabase;
    private createMockGraph;
    private createMockCache;
    private createDefaultConfig;
}
/**
 * Create a new plugin registry
 */
export declare function createPluginRegistry(): PluginRegistry;
/**
 * Create a new plugin loader
 */
export declare function createPluginLoader(searchPaths?: string[]): PluginLoader;
/**
 * Create a new plugin manager
 */
export declare function createPluginManager(config: PluginManagerConfig): PluginManager;
/**
 * Create a plugin manager with default configuration
 */
export declare function createDefaultPluginManager(projectRoot: string): PluginManager;
//# sourceMappingURL=manager.d.ts.map