/**
 * Configuration Manager
 *
 * Manages Knowledge Graph configuration with migration support,
 * persistence, and validation.
 *
 * @module config/manager
 */
import type { KGConfiguration, ConfigMigration } from './types.js';
/**
 * Configuration Manager class
 *
 * Handles loading, saving, and migrating configuration files.
 */
export declare class ConfigManager {
    private config;
    private configPath;
    private migrations;
    /**
     * Create a new ConfigManager instance
     *
     * @param projectRoot - Root directory of the project
     * @param configPath - Optional custom config file path
     */
    constructor(projectRoot: string, configPath?: string);
    /**
     * Load configuration from file
     *
     * @returns Loaded configuration merged with defaults
     */
    private load;
    /**
     * Merge loaded configuration with defaults
     *
     * @param loaded - Partially loaded configuration
     * @returns Complete configuration with defaults filled in
     */
    private mergeWithDefaults;
    /**
     * Save configuration to file
     */
    save(): void;
    /**
     * Get a configuration value by key
     *
     * @param key - Configuration key
     * @returns Configuration value for the key
     */
    get<K extends keyof KGConfiguration>(key: K): KGConfiguration[K];
    /**
     * Set a configuration value
     *
     * @param key - Configuration key
     * @param value - Value to set
     */
    set<K extends keyof KGConfiguration>(key: K, value: KGConfiguration[K]): void;
    /**
     * Update multiple configuration values
     *
     * @param updates - Partial configuration to merge
     */
    update(updates: Partial<KGConfiguration>): void;
    /**
     * Get the complete configuration
     *
     * @returns Complete configuration object (copy)
     */
    getAll(): KGConfiguration;
    /**
     * Register a configuration migration
     *
     * @param migration - Migration definition
     */
    registerMigration(migration: ConfigMigration): void;
    /**
     * Run migrations to target version
     *
     * @param targetVersion - Target version to migrate to (defaults to latest)
     */
    migrate(targetVersion?: string): void;
    /**
     * Compare two version strings
     *
     * @param a - First version
     * @param b - Second version
     * @returns Negative if a < b, 0 if equal, positive if a > b
     */
    private compareVersions;
    /**
     * Get the version before a given version
     *
     * @param version - Current version
     * @returns Previous version string
     */
    private getPreviousVersion;
    /**
     * Reset configuration to defaults
     */
    reset(): void;
    /**
     * Get the configuration file path
     *
     * @returns Path to the configuration file
     */
    getConfigPath(): string;
    /**
     * Check if configuration file exists
     *
     * @returns True if config file exists
     */
    exists(): boolean;
    /**
     * Validate the current configuration
     *
     * @returns Validation result with any errors
     */
    validate(): {
        valid: boolean;
        errors: string[];
    };
}
/**
 * Create a new ConfigManager instance
 *
 * @param projectRoot - Root directory of the project
 * @param configPath - Optional custom config file path
 * @returns ConfigManager instance
 */
export declare function createConfigManager(projectRoot: string, configPath?: string): ConfigManager;
/**
 * Get a copy of the default configuration
 *
 * @returns Default configuration object
 */
export declare function getDefaultConfig(): KGConfiguration;
//# sourceMappingURL=manager.d.ts.map