/**
 * Configuration Module
 *
 * Provides configuration management with validation, migrations, and defaults.
 */
/**
 * Database configuration
 */
export interface DatabaseConfig {
    /** Path to database file */
    path: string;
    /** Enable WAL mode */
    walMode?: boolean;
    /** Busy timeout in milliseconds */
    busyTimeout?: number;
    /** Cache size in pages */
    cacheSize?: number;
}
/**
 * Cache configuration
 */
export interface CacheConfig {
    /** Enable caching */
    enabled: boolean;
    /** Maximum cache size in bytes */
    maxSize?: number;
    /** Default TTL in milliseconds */
    defaultTtl?: number;
    /** Eviction policy */
    evictionPolicy?: 'lru' | 'lfu' | 'fifo';
}
/**
 * Agent configuration
 */
export interface AgentConfig {
    /** Maximum concurrent agents */
    maxConcurrent?: number;
    /** Default timeout in milliseconds */
    defaultTimeout?: number;
    /** Enable agent logging */
    enableLogging?: boolean;
}
/**
 * Services configuration
 */
export interface ServicesConfig {
    /** Enable file watcher */
    fileWatcher?: boolean;
    /** File watcher paths */
    watchPaths?: string[];
    /** Health check interval in milliseconds */
    healthCheckInterval?: number;
}
/**
 * Logging configuration
 */
export interface LoggingConfig {
    /** Log level */
    level: 'debug' | 'info' | 'warn' | 'error';
    /** Log format */
    format?: 'json' | 'text';
    /** Log file path */
    filePath?: string;
    /** Enable console logging */
    console?: boolean;
}
/**
 * Full knowledge graph configuration
 */
export interface KGConfiguration {
    /** Database settings */
    database: DatabaseConfig;
    /** Cache settings */
    cache?: CacheConfig;
    /** Agent settings */
    agents?: AgentConfig;
    /** Services settings */
    services?: ServicesConfig;
    /** Logging settings */
    logging?: LoggingConfig;
    /** Project root path */
    projectRoot?: string;
    /** Docs path relative to project root */
    docsPath?: string;
}
/**
 * Configuration migration
 */
export interface ConfigMigration {
    /** Migration version */
    version: number;
    /** Migration description */
    description: string;
    /** Migration function */
    migrate: (config: Partial<KGConfiguration>) => KGConfiguration;
}
/**
 * Get default configuration
 */
export declare function getDefaultConfig(): KGConfiguration;
/**
 * Configuration Manager for loading, saving, and managing configuration
 */
export declare class ConfigManager {
    private config;
    private configPath;
    private migrations;
    constructor(configPath?: string);
    /**
     * Load configuration from file
     */
    load(): Promise<KGConfiguration>;
    /**
     * Save configuration to file
     */
    save(): Promise<void>;
    /**
     * Get current configuration
     */
    get(): KGConfiguration;
    /**
     * Update configuration
     */
    update(updates: Partial<KGConfiguration>): KGConfiguration;
    /**
     * Reset to defaults
     */
    reset(): KGConfiguration;
    /**
     * Validate configuration
     */
    validate(): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Register a migration
     */
    registerMigration(migration: ConfigMigration): void;
    /**
     * Apply migrations
     */
    applyMigrations(fromVersion: number): KGConfiguration;
    /**
     * Merge configurations
     */
    private merge;
}
/**
 * Create a new ConfigManager instance
 */
export declare function createConfigManager(configPath?: string): ConfigManager;
//# sourceMappingURL=index.d.ts.map