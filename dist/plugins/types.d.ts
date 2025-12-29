/**
 * Plugin System Types
 *
 * Complete type definitions for the knowledge-graph-agent plugin system.
 * Supports plugin discovery, loading, lifecycle management, and custom analyzers.
 *
 * @module plugins/types
 */
import type { EventEmitter } from 'events';
import type { KnowledgeGraphManager } from '../core/graph.js';
import type { KGConfiguration } from '../config/types.js';
import type { Logger } from '../utils/logger.js';
/**
 * Plugin type classification
 */
export type PluginType = 'analyzer' | 'transformer' | 'exporter' | 'importer' | 'integration' | 'visualization' | 'storage' | 'agent' | 'hook' | 'generic';
/**
 * Plugin lifecycle hook names
 */
export type PluginHook = 'onGraphLoad' | 'onGraphSave' | 'onNodeAdd' | 'onNodeUpdate' | 'onNodeRemove' | 'onEdgeAdd' | 'onEdgeRemove' | 'onAnalysisStart' | 'onAnalysisComplete' | 'onAgentTaskStart' | 'onAgentTaskComplete' | 'onFileChange' | 'onShutdown';
/**
 * Plugin capability declaration
 */
export interface PluginCapability {
    /** Capability identifier */
    name: string;
    /** Human-readable description */
    description?: string;
    /** Capability version */
    version?: string;
    /** Whether this capability is optional */
    optional?: boolean;
}
/**
 * Plugin dependency specification
 */
export interface PluginDependency {
    /** Plugin package name */
    name: string;
    /** Semver version range */
    version: string;
    /** Whether the dependency is optional */
    optional?: boolean;
}
/**
 * Plugin configuration schema definition
 */
export interface PluginConfigSchema {
    /** Schema type (JSON Schema compatible) */
    type: 'object' | 'array' | 'string' | 'number' | 'boolean';
    /** Schema properties for object types */
    properties?: Record<string, {
        type: string;
        description?: string;
        default?: unknown;
        required?: boolean;
        enum?: unknown[];
    }>;
    /** Required property names */
    required?: string[];
    /** Default configuration values */
    defaults?: Record<string, unknown>;
}
/**
 * Plugin manifest - extends package.json with kg-plugin field
 *
 * @example
 * ```json
 * {
 *   "name": "@kg-plugins/markdown-analyzer",
 *   "version": "1.0.0",
 *   "description": "Advanced markdown analysis for knowledge graphs",
 *   "kg-plugin": {
 *     "type": "analyzer",
 *     "main": "./dist/index.js",
 *     "hooks": ["onNodeAdd", "onAnalysisComplete"],
 *     "capabilities": [
 *       { "name": "markdown-parsing", "description": "Parse markdown content" }
 *     ],
 *     "configSchema": {
 *       "type": "object",
 *       "properties": {
 *         "enableGFM": { "type": "boolean", "default": true }
 *       }
 *     }
 *   }
 * }
 * ```
 */
export interface KGPluginManifest {
    /** Plugin package name (from package.json) */
    name: string;
    /** Plugin version (semver) */
    version: string;
    /** Plugin description */
    description?: string;
    /** Plugin author */
    author?: string | {
        name: string;
        email?: string;
        url?: string;
    };
    /** Plugin license */
    license?: string;
    /** Plugin repository */
    repository?: string | {
        type: string;
        url: string;
    };
    /** Plugin keywords for discovery */
    keywords?: string[];
    /** Knowledge graph plugin configuration */
    'kg-plugin': {
        /** Plugin type classification */
        type: PluginType;
        /** Path to main entry point (relative to package root) */
        main: string;
        /** Plugin display name */
        displayName?: string;
        /** Minimum knowledge-graph-agent version required */
        minVersion?: string;
        /** Maximum knowledge-graph-agent version supported */
        maxVersion?: string;
        /** Lifecycle hooks this plugin subscribes to */
        hooks?: PluginHook[];
        /** Plugin capabilities */
        capabilities?: PluginCapability[];
        /** Plugin dependencies on other plugins */
        pluginDependencies?: PluginDependency[];
        /** Configuration schema */
        configSchema?: PluginConfigSchema;
        /** Whether the plugin supports hot reload */
        hotReload?: boolean;
        /** Priority for hook execution (lower = earlier, default: 100) */
        priority?: number;
        /** Tags for categorization */
        tags?: string[];
    };
    /** Standard package.json fields */
    main?: string;
    types?: string;
    exports?: Record<string, unknown>;
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
}
/**
 * Database interface for plugin context
 */
export interface KnowledgeGraphDatabase {
    /** Execute a query and return results */
    query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
    /** Execute a query and return first result */
    queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>;
    /** Execute a mutation (insert, update, delete) */
    execute(sql: string, params?: unknown[]): Promise<{
        changes: number;
        lastInsertRowid?: number | bigint;
    }>;
    /** Begin a transaction */
    beginTransaction(): Promise<void>;
    /** Commit a transaction */
    commit(): Promise<void>;
    /** Rollback a transaction */
    rollback(): Promise<void>;
    /** Check if the database is connected */
    isConnected(): boolean;
}
/**
 * Shadow cache interface for plugin context
 */
export interface ShadowCache {
    /** Get a cached value */
    get<T>(key: string): Promise<T | undefined>;
    /** Set a cached value */
    set<T>(key: string, value: T, options?: {
        ttl?: number;
        tags?: string[];
    }): Promise<void>;
    /** Delete a cached value */
    delete(key: string): Promise<boolean>;
    /** Delete all values with a specific tag */
    deleteByTag(tag: string): Promise<number>;
    /** Clear all cached values */
    clear(): Promise<void>;
    /** Check if a key exists */
    has(key: string): Promise<boolean>;
    /** Get cache statistics */
    getStats(): Promise<{
        entries: number;
        size: number;
        hits: number;
        misses: number;
        hitRate: number;
    }>;
}
/**
 * Plugin event emitter for inter-plugin communication
 */
export interface PluginEventEmitter extends EventEmitter {
    /** Emit an event to all registered listeners */
    emit(event: string, ...args: unknown[]): boolean;
    /** Subscribe to an event */
    on(event: string, listener: (...args: unknown[]) => void): this;
    /** Subscribe to an event once */
    once(event: string, listener: (...args: unknown[]) => void): this;
    /** Unsubscribe from an event */
    off(event: string, listener: (...args: unknown[]) => void): this;
    /** Get all registered event names */
    eventNames(): (string | symbol)[];
}
/**
 * Plugin API for interacting with the knowledge graph system
 */
export interface PluginAPI {
    /** Get plugin by name */
    getPlugin<T extends KGPlugin = KGPlugin>(name: string): T | undefined;
    /** Get all plugins of a specific type */
    getPluginsByType(type: PluginType): KGPlugin[];
    /** Get all analyzer plugins */
    getAnalyzers(): AnalyzerPlugin[];
    /** Register a custom command */
    registerCommand(command: PluginCommand): void;
    /** Unregister a custom command */
    unregisterCommand(name: string): void;
    /** Get the current knowledge graph agent version */
    getVersion(): string;
    /** Check if a capability is available */
    hasCapability(name: string): boolean;
}
/**
 * Plugin command registration
 */
export interface PluginCommand {
    /** Command name (used in CLI) */
    name: string;
    /** Command description */
    description: string;
    /** Command aliases */
    aliases?: string[];
    /** Command options */
    options?: Array<{
        name: string;
        description: string;
        type: 'string' | 'number' | 'boolean';
        required?: boolean;
        default?: unknown;
    }>;
    /** Command handler */
    handler: (args: Record<string, unknown>, context: PluginContext) => Promise<void>;
}
/**
 * Plugin context provided during initialization and execution
 */
export interface PluginContext {
    /** Database instance for persistent storage */
    database: KnowledgeGraphDatabase;
    /** Knowledge graph manager instance */
    graph: KnowledgeGraphManager;
    /** Shadow cache for temporary storage */
    cache: ShadowCache;
    /** Logger instance scoped to the plugin */
    logger: Logger;
    /** Current configuration */
    config: KGConfiguration;
    /** Plugin configuration (from user config or defaults) */
    pluginConfig: Record<string, unknown>;
    /** Event emitter for plugin communication */
    events: PluginEventEmitter;
    /** Plugin API for system interaction */
    api: PluginAPI;
    /** Root path of the project */
    projectRoot: string;
    /** Path to the plugin's package directory */
    pluginRoot: string;
    /** Abort signal for graceful shutdown */
    abortSignal?: AbortSignal;
}
/**
 * Plugin status
 */
export type PluginStatus = 'unloaded' | 'loading' | 'initialized' | 'active' | 'error' | 'disabled';
/**
 * Plugin metadata at runtime
 */
export interface PluginMetadata {
    /** Plugin name */
    name: string;
    /** Plugin version */
    version: string;
    /** Plugin type */
    type: PluginType;
    /** Plugin status */
    status: PluginStatus;
    /** Load time in milliseconds */
    loadTime?: number;
    /** Initialize time in milliseconds */
    initTime?: number;
    /** Last error if status is 'error' */
    lastError?: string;
    /** Registered hooks */
    hooks: PluginHook[];
    /** Available capabilities */
    capabilities: string[];
}
/**
 * Base plugin interface that all plugins must implement
 */
export interface KGPlugin {
    /** Plugin name (must match manifest) */
    readonly name: string;
    /** Plugin version (must match manifest) */
    readonly version: string;
    /** Plugin type */
    readonly type: PluginType;
    /**
     * Initialize the plugin
     *
     * Called once when the plugin is loaded. Use this to set up resources,
     * register event listeners, and validate configuration.
     *
     * @param context - Plugin context with system access
     * @throws Error if initialization fails
     */
    initialize(context: PluginContext): Promise<void>;
    /**
     * Destroy the plugin (optional)
     *
     * Called when the plugin is being unloaded. Use this to clean up resources,
     * close connections, and remove event listeners.
     */
    destroy?(): Promise<void>;
    /**
     * Get plugin health status (optional)
     *
     * @returns Health status information
     */
    healthCheck?(): Promise<{
        healthy: boolean;
        message?: string;
        details?: Record<string, unknown>;
    }>;
    /**
     * Get plugin statistics (optional)
     *
     * @returns Plugin-specific statistics
     */
    getStats?(): Promise<Record<string, unknown>>;
    /** Called when the knowledge graph is loaded */
    onGraphLoad?(graph: KnowledgeGraphManager): Promise<void>;
    /** Called before the knowledge graph is saved */
    onGraphSave?(graph: KnowledgeGraphManager): Promise<void>;
    /** Called when a node is added to the graph */
    onNodeAdd?(nodeId: string, nodeData: unknown): Promise<void>;
    /** Called when a node is updated */
    onNodeUpdate?(nodeId: string, changes: unknown): Promise<void>;
    /** Called when a node is removed */
    onNodeRemove?(nodeId: string): Promise<void>;
    /** Called when an edge is added */
    onEdgeAdd?(sourceId: string, targetId: string, edgeData: unknown): Promise<void>;
    /** Called when an edge is removed */
    onEdgeRemove?(sourceId: string, targetId: string): Promise<void>;
    /** Called when analysis starts */
    onAnalysisStart?(analysisType: string): Promise<void>;
    /** Called when analysis completes */
    onAnalysisComplete?(analysisType: string, results: unknown): Promise<void>;
    /** Called when an agent task starts */
    onAgentTaskStart?(agentId: string, taskId: string, taskData: unknown): Promise<void>;
    /** Called when an agent task completes */
    onAgentTaskComplete?(agentId: string, taskId: string, result: unknown): Promise<void>;
    /** Called when a file changes */
    onFileChange?(filePath: string, changeType: 'add' | 'change' | 'unlink'): Promise<void>;
    /** Called during shutdown */
    onShutdown?(): Promise<void>;
}
/**
 * Analysis input data
 */
export interface AnalysisInput {
    /** Unique identifier for this analysis */
    id: string;
    /** Content to analyze */
    content: string;
    /** Content type (e.g., 'markdown', 'typescript', 'json') */
    contentType: string;
    /** Source file path (if applicable) */
    filePath?: string;
    /** Related node IDs for context */
    relatedNodes?: string[];
    /** Additional metadata */
    metadata?: Record<string, unknown>;
    /** Analysis options */
    options?: Record<string, unknown>;
}
/**
 * Analysis result structure
 */
export interface AnalysisResult {
    /** Whether analysis was successful */
    success: boolean;
    /** Analysis type identifier */
    analysisType: string;
    /** Extracted entities */
    entities?: Array<{
        id: string;
        type: string;
        value: string;
        confidence: number;
        position?: {
            start: number;
            end: number;
        };
        metadata?: Record<string, unknown>;
    }>;
    /** Extracted relationships */
    relationships?: Array<{
        sourceId: string;
        targetId: string;
        type: string;
        confidence: number;
        metadata?: Record<string, unknown>;
    }>;
    /** Extracted tags/keywords */
    tags?: Array<{
        value: string;
        confidence: number;
        category?: string;
    }>;
    /** Content summary */
    summary?: string;
    /** Quality score (0-1) */
    qualityScore?: number;
    /** Analysis metrics */
    metrics?: {
        durationMs: number;
        tokensProcessed?: number;
        entitiesFound?: number;
        relationshipsFound?: number;
    };
    /** Suggestions for improvement */
    suggestions?: Array<{
        type: 'add_link' | 'add_tag' | 'fix_format' | 'add_content' | 'other';
        message: string;
        confidence: number;
        action?: Record<string, unknown>;
    }>;
    /** Raw analysis data for debugging */
    raw?: unknown;
    /** Error information if analysis failed */
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
}
/**
 * Stream chunk for streaming analysis
 */
export interface AnalysisStreamChunk {
    /** Chunk type */
    type: 'entity' | 'relationship' | 'tag' | 'progress' | 'error' | 'complete';
    /** Chunk data */
    data: unknown;
    /** Progress percentage (0-100) for progress chunks */
    progress?: number;
    /** Timestamp */
    timestamp: Date;
}
/**
 * Analyzer plugin interface for custom content analysis
 */
export interface AnalyzerPlugin extends KGPlugin {
    readonly type: 'analyzer';
    /**
     * Supported content types for this analyzer
     */
    readonly supportedContentTypes: string[];
    /**
     * Analyze content and return structured results
     *
     * @param input - Analysis input data
     * @returns Analysis results
     */
    analyze(input: AnalysisInput): Promise<AnalysisResult>;
    /**
     * Stream analysis results (optional)
     *
     * For large content, streaming provides incremental results.
     *
     * @param input - Analysis input data
     * @returns Async iterable of analysis chunks
     */
    analyzeStream?(input: AnalysisInput): AsyncIterable<AnalysisStreamChunk>;
    /**
     * Check if this analyzer can handle the given content
     *
     * @param contentType - Content type to check
     * @returns Whether this analyzer supports the content type
     */
    canAnalyze(contentType: string): boolean;
    /**
     * Get analyzer-specific configuration options
     *
     * @returns Configuration options with descriptions
     */
    getConfigOptions?(): Record<string, {
        type: 'string' | 'number' | 'boolean' | 'array' | 'object';
        description: string;
        default?: unknown;
        required?: boolean;
    }>;
}
/**
 * Plugin discovery result
 */
export interface DiscoveredPlugin {
    /** Plugin manifest */
    manifest: KGPluginManifest;
    /** Absolute path to the plugin package */
    path: string;
    /** Whether the plugin is locally installed */
    isLocal: boolean;
    /** Whether the plugin is valid */
    valid: boolean;
    /** Validation errors if not valid */
    errors?: string[];
}
/**
 * Plugin load options
 */
export interface PluginLoadOptions {
    /** Plugin configuration to pass */
    config?: Record<string, unknown>;
    /** Force reload even if already loaded */
    force?: boolean;
    /** Validate plugin before loading */
    validate?: boolean;
    /** Timeout for initialization in milliseconds */
    timeout?: number;
}
/**
 * Plugin load result
 */
export interface PluginLoadResult {
    /** Whether loading was successful */
    success: boolean;
    /** Loaded plugin instance (if successful) */
    plugin?: KGPlugin;
    /** Plugin metadata */
    metadata?: PluginMetadata;
    /** Error message (if failed) */
    error?: string;
    /** Load duration in milliseconds */
    loadTime: number;
}
/**
 * Plugin loader interface for discovering and loading plugins
 */
export interface PluginLoader {
    /**
     * Discover available plugins
     *
     * Searches configured paths for valid plugin packages.
     *
     * @returns Array of discovered plugin manifests
     */
    discover(): Promise<DiscoveredPlugin[]>;
    /**
     * Load a plugin by name
     *
     * @param name - Plugin package name
     * @param options - Load options
     * @returns Load result
     */
    load(name: string, options?: PluginLoadOptions): Promise<PluginLoadResult>;
    /**
     * Load a plugin from a specific path
     *
     * @param path - Absolute path to plugin package
     * @param options - Load options
     * @returns Load result
     */
    loadFromPath(path: string, options?: PluginLoadOptions): Promise<PluginLoadResult>;
    /**
     * Unload a plugin by name
     *
     * @param name - Plugin package name
     * @returns Whether unload was successful
     */
    unload(name: string): Promise<boolean>;
    /**
     * Reload a plugin
     *
     * @param name - Plugin package name
     * @returns Load result
     */
    reload(name: string): Promise<PluginLoadResult>;
    /**
     * Get a loaded plugin by name
     *
     * @param name - Plugin package name
     * @returns Plugin instance or undefined
     */
    get(name: string): KGPlugin | undefined;
    /**
     * Check if a plugin is loaded
     *
     * @param name - Plugin package name
     * @returns Whether the plugin is loaded
     */
    isLoaded(name: string): boolean;
    /**
     * Get all loaded plugins
     *
     * @returns Array of loaded plugin instances
     */
    getAll(): KGPlugin[];
    /**
     * Validate a plugin manifest
     *
     * @param manifest - Plugin manifest to validate
     * @returns Validation result
     */
    validateManifest(manifest: KGPluginManifest): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
    /**
     * Set plugin search paths
     *
     * @param paths - Array of paths to search for plugins
     */
    setSearchPaths(paths: string[]): void;
    /**
     * Get current plugin search paths
     *
     * @returns Array of search paths
     */
    getSearchPaths(): string[];
}
/**
 * Plugin registry events
 */
export interface PluginRegistryEvents {
    /** Emitted when a plugin is registered */
    registered: {
        plugin: KGPlugin;
        metadata: PluginMetadata;
    };
    /** Emitted when a plugin is unregistered */
    unregistered: {
        name: string;
    };
    /** Emitted when a plugin is enabled */
    enabled: {
        name: string;
    };
    /** Emitted when a plugin is disabled */
    disabled: {
        name: string;
    };
    /** Emitted when a plugin encounters an error */
    error: {
        name: string;
        error: Error;
    };
    /** Emitted when a hook is executed */
    hookExecuted: {
        hook: PluginHook;
        plugins: string[];
        duration: number;
    };
}
/**
 * Plugin registry for managing loaded plugins
 */
export interface PluginRegistry {
    /**
     * Register a plugin
     *
     * @param plugin - Plugin instance to register
     * @param manifest - Plugin manifest
     */
    register(plugin: KGPlugin, manifest: KGPluginManifest): void;
    /**
     * Unregister a plugin
     *
     * @param name - Plugin name to unregister
     * @returns Whether the plugin was found and unregistered
     */
    unregister(name: string): boolean;
    /**
     * Get a plugin by name
     *
     * @param name - Plugin name
     * @returns Plugin instance or undefined
     */
    get<T extends KGPlugin = KGPlugin>(name: string): T | undefined;
    /**
     * Get all registered plugins
     *
     * @returns Array of all registered plugins
     */
    getAll(): KGPlugin[];
    /**
     * Get plugins by type
     *
     * @param type - Plugin type to filter
     * @returns Array of plugins of the specified type
     */
    getByType<T extends KGPlugin = KGPlugin>(type: PluginType): T[];
    /**
     * Get all analyzer plugins
     *
     * @returns Array of analyzer plugins
     */
    getAnalyzers(): AnalyzerPlugin[];
    /**
     * Check if a plugin is registered
     *
     * @param name - Plugin name
     * @returns Whether the plugin is registered
     */
    has(name: string): boolean;
    /**
     * Get plugin metadata
     *
     * @param name - Plugin name
     * @returns Plugin metadata or undefined
     */
    getMetadata(name: string): PluginMetadata | undefined;
    /**
     * Enable a plugin
     *
     * @param name - Plugin name
     * @returns Whether the plugin was enabled
     */
    enable(name: string): Promise<boolean>;
    /**
     * Disable a plugin
     *
     * @param name - Plugin name
     * @returns Whether the plugin was disabled
     */
    disable(name: string): Promise<boolean>;
    /**
     * Execute a lifecycle hook on all applicable plugins
     *
     * @param hook - Hook name to execute
     * @param args - Arguments to pass to the hook
     * @returns Results from each plugin
     */
    executeHook<T = void>(hook: PluginHook, ...args: unknown[]): Promise<Map<string, T | Error>>;
    /**
     * Get plugins that subscribe to a specific hook
     *
     * @param hook - Hook name
     * @returns Array of plugin names
     */
    getHookSubscribers(hook: PluginHook): string[];
    /**
     * Get registry statistics
     *
     * @returns Registry statistics
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
     *
     * @param event - Event name
     * @param listener - Event listener
     */
    on<K extends keyof PluginRegistryEvents>(event: K, listener: (data: PluginRegistryEvents[K]) => void): void;
    /**
     * Unsubscribe from registry events
     *
     * @param event - Event name
     * @param listener - Event listener
     */
    off<K extends keyof PluginRegistryEvents>(event: K, listener: (data: PluginRegistryEvents[K]) => void): void;
    /**
     * Clear all registered plugins
     */
    clear(): Promise<void>;
}
/**
 * Plugin manager configuration
 */
export interface PluginManagerConfig {
    /** Paths to search for plugins */
    searchPaths: string[];
    /** Plugins to auto-load on initialization */
    autoLoad?: string[];
    /** Whether to enable hot reload */
    hotReload?: boolean;
    /** Default plugin configuration */
    defaultConfig?: Record<string, Record<string, unknown>>;
    /** Logger instance */
    logger?: Logger;
    /** Maximum plugin load concurrency */
    maxConcurrency?: number;
    /** Plugin load timeout in milliseconds */
    loadTimeout?: number;
}
/**
 * Plugin manager for high-level plugin operations
 */
export interface PluginManager {
    /** Plugin loader instance */
    readonly loader: PluginLoader;
    /** Plugin registry instance */
    readonly registry: PluginRegistry;
    /**
     * Initialize the plugin manager
     *
     * Discovers and loads configured plugins.
     */
    initialize(): Promise<void>;
    /**
     * Install a plugin from npm or local path
     *
     * @param source - npm package name or local path
     * @returns Installation result
     */
    install(source: string): Promise<{
        success: boolean;
        name?: string;
        version?: string;
        error?: string;
    }>;
    /**
     * Uninstall a plugin
     *
     * @param name - Plugin name to uninstall
     * @returns Whether uninstallation was successful
     */
    uninstall(name: string): Promise<boolean>;
    /**
     * Update a plugin to the latest version
     *
     * @param name - Plugin name to update
     * @returns Update result
     */
    update(name: string): Promise<{
        success: boolean;
        previousVersion?: string;
        newVersion?: string;
        error?: string;
    }>;
    /**
     * Check for plugin updates
     *
     * @returns Available updates
     */
    checkUpdates(): Promise<Array<{
        name: string;
        currentVersion: string;
        latestVersion: string;
    }>>;
    /**
     * Get plugin configuration
     *
     * @param name - Plugin name
     * @returns Plugin configuration
     */
    getConfig(name: string): Record<string, unknown> | undefined;
    /**
     * Set plugin configuration
     *
     * @param name - Plugin name
     * @param config - Configuration to set
     */
    setConfig(name: string, config: Record<string, unknown>): Promise<void>;
    /**
     * Shutdown the plugin manager
     *
     * Destroys all loaded plugins and cleans up resources.
     */
    shutdown(): Promise<void>;
}
/**
 * Type guard for checking if a plugin is an AnalyzerPlugin
 */
export declare function isAnalyzerPlugin(plugin: KGPlugin): plugin is AnalyzerPlugin;
/**
 * Type guard for checking if an object is a valid plugin manifest
 */
export declare function isPluginManifest(obj: unknown): obj is KGPluginManifest;
/**
 * Type guard for checking if an object is an AnalysisResult
 */
export declare function isAnalysisResult(obj: unknown): obj is AnalysisResult;
/**
 * Extract the configuration type from a plugin manifest
 */
export type PluginConfigType<T extends KGPluginManifest> = T['kg-plugin']['configSchema'] extends PluginConfigSchema ? Record<string, unknown> : Record<string, unknown>;
/**
 * Plugin factory function type
 */
export type PluginFactory = () => KGPlugin | Promise<KGPlugin>;
/**
 * Plugin constructor type
 */
export interface PluginConstructor {
    new (): KGPlugin;
}
/**
 * Plugin module default export types
 */
export type PluginModuleExport = KGPlugin | PluginFactory | PluginConstructor;
/**
 * Create a unique plugin instance ID
 */
export declare function createPluginId(name: string): string;
/**
 * Validate semver version string
 */
export declare function isValidSemver(version: string): boolean;
/**
 * Get default plugin metadata
 */
export declare function createDefaultPluginMetadata(name: string, version: string, type: PluginType): PluginMetadata;
//# sourceMappingURL=types.d.ts.map