/**
 * Configuration Manager
 *
 * Manages Knowledge Graph configuration with migration support,
 * persistence, and validation.
 *
 * @module config/manager
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { createLogger } from '../utils/index.js';
import type {
  KGConfiguration,
  ConfigMigration,
  DatabaseConfig,
  CacheConfig,
  AgentConfig,
  ServicesConfig,
  LoggingConfig,
} from './types.js';

const logger = createLogger('config-manager');

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: KGConfiguration = {
  version: '1.0.0',
  projectRoot: process.cwd(),
  docsPath: 'docs',
  database: {
    path: '.kg/knowledge.db',
    autoBackup: true,
    backupInterval: 86400000, // 24 hours
    maxBackups: 5,
  },
  cache: {
    enabled: true,
    maxSize: 1000,
    ttl: 3600000, // 1 hour
    evictionPolicy: 'lru',
  },
  agents: {
    maxConcurrent: 5,
    defaultTimeout: 30000, // 30 seconds
    retryAttempts: 3,
    claudeFlowEnabled: true,
  },
  services: {
    watcherEnabled: true,
    schedulerEnabled: true,
    syncEnabled: true,
    healthCheckInterval: 60000, // 1 minute
  },
  logging: {
    level: 'info',
    format: 'text',
  },
};

/**
 * Configuration Manager class
 *
 * Handles loading, saving, and migrating configuration files.
 */
export class ConfigManager {
  private config: KGConfiguration;
  private configPath: string;
  private migrations: ConfigMigration[] = [];

  /**
   * Create a new ConfigManager instance
   *
   * @param projectRoot - Root directory of the project
   * @param configPath - Optional custom config file path
   */
  constructor(projectRoot: string, configPath?: string) {
    this.configPath = configPath || join(projectRoot, '.kg/config.json');
    this.config = this.load();
    // Update projectRoot to match the actual project root
    this.config.projectRoot = projectRoot;
  }

  /**
   * Load configuration from file
   *
   * @returns Loaded configuration merged with defaults
   */
  private load(): KGConfiguration {
    if (!existsSync(this.configPath)) {
      logger.debug('No config file found, using defaults', { path: this.configPath });
      return { ...DEFAULT_CONFIG };
    }

    try {
      const data = readFileSync(this.configPath, 'utf-8');
      const loaded = JSON.parse(data) as Partial<KGConfiguration>;
      logger.debug('Loaded configuration', { path: this.configPath, version: loaded.version });
      return this.mergeWithDefaults(loaded);
    } catch (error) {
      logger.warn('Failed to load config, using defaults', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { ...DEFAULT_CONFIG };
    }
  }

  /**
   * Merge loaded configuration with defaults
   *
   * @param loaded - Partially loaded configuration
   * @returns Complete configuration with defaults filled in
   */
  private mergeWithDefaults(loaded: Partial<KGConfiguration>): KGConfiguration {
    return {
      ...DEFAULT_CONFIG,
      ...loaded,
      database: { ...DEFAULT_CONFIG.database, ...loaded.database } as DatabaseConfig,
      cache: { ...DEFAULT_CONFIG.cache, ...loaded.cache } as CacheConfig,
      agents: { ...DEFAULT_CONFIG.agents, ...loaded.agents } as AgentConfig,
      services: { ...DEFAULT_CONFIG.services, ...loaded.services } as ServicesConfig,
      logging: { ...DEFAULT_CONFIG.logging, ...loaded.logging } as LoggingConfig,
    };
  }

  /**
   * Save configuration to file
   */
  save(): void {
    const dir = dirname(this.configPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    try {
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      logger.info('Configuration saved', { path: this.configPath });
    } catch (error) {
      logger.error('Failed to save configuration', error instanceof Error ? error : undefined, {
        path: this.configPath,
      });
      throw error;
    }
  }

  /**
   * Get a configuration value by key
   *
   * @param key - Configuration key
   * @returns Configuration value for the key
   */
  get<K extends keyof KGConfiguration>(key: K): KGConfiguration[K] {
    return this.config[key];
  }

  /**
   * Set a configuration value
   *
   * @param key - Configuration key
   * @param value - Value to set
   */
  set<K extends keyof KGConfiguration>(key: K, value: KGConfiguration[K]): void {
    this.config[key] = value;
    this.save();
  }

  /**
   * Update multiple configuration values
   *
   * @param updates - Partial configuration to merge
   */
  update(updates: Partial<KGConfiguration>): void {
    this.config = this.mergeWithDefaults({ ...this.config, ...updates });
    this.save();
  }

  /**
   * Get the complete configuration
   *
   * @returns Complete configuration object (copy)
   */
  getAll(): KGConfiguration {
    return { ...this.config };
  }

  /**
   * Register a configuration migration
   *
   * @param migration - Migration definition
   */
  registerMigration(migration: ConfigMigration): void {
    this.migrations.push(migration);
    // Sort migrations by version
    this.migrations.sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }));
    logger.debug('Registered migration', { version: migration.version });
  }

  /**
   * Run migrations to target version
   *
   * @param targetVersion - Target version to migrate to (defaults to latest)
   */
  migrate(targetVersion?: string): void {
    const currentVersion = this.config.version;
    const target =
      targetVersion || this.migrations[this.migrations.length - 1]?.version || currentVersion;

    if (currentVersion === target) {
      logger.info('Config already at target version', { version: target });
      return;
    }

    const isUpgrade = this.compareVersions(currentVersion, target) < 0;

    // Filter applicable migrations
    const applicableMigrations = this.migrations.filter((m) => {
      if (isUpgrade) {
        return (
          this.compareVersions(m.version, currentVersion) > 0 &&
          this.compareVersions(m.version, target) <= 0
        );
      } else {
        return (
          this.compareVersions(m.version, currentVersion) <= 0 &&
          this.compareVersions(m.version, target) > 0
        );
      }
    });

    // Reverse order for downgrades
    if (!isUpgrade) {
      applicableMigrations.reverse();
    }

    // Apply migrations
    for (const migration of applicableMigrations) {
      logger.info(`Applying migration ${migration.version}`, {
        direction: isUpgrade ? 'up' : 'down',
      });

      try {
        const result = isUpgrade ? migration.up(this.config) : migration.down(this.config);
        this.config = this.mergeWithDefaults(result);
        this.config.version = isUpgrade
          ? migration.version
          : this.getPreviousVersion(migration.version);
      } catch (error) {
        logger.error(
          `Migration ${migration.version} failed`,
          error instanceof Error ? error : undefined
        );
        throw error;
      }
    }

    // Set final version
    this.config.version = target;
    this.save();
    logger.info('Migration complete', { from: currentVersion, to: target });
  }

  /**
   * Compare two version strings
   *
   * @param a - First version
   * @param b - Second version
   * @returns Negative if a < b, 0 if equal, positive if a > b
   */
  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i] || 0;
      const partB = partsB[i] || 0;
      if (partA !== partB) {
        return partA - partB;
      }
    }
    return 0;
  }

  /**
   * Get the version before a given version
   *
   * @param version - Current version
   * @returns Previous version string
   */
  private getPreviousVersion(version: string): string {
    const index = this.migrations.findIndex((m) => m.version === version);
    if (index > 0) {
      return this.migrations[index - 1].version;
    }
    // Return a default previous version
    const parts = version.split('.').map(Number);
    if (parts[2] > 0) {
      parts[2]--;
    } else if (parts[1] > 0) {
      parts[1]--;
      parts[2] = 0;
    } else if (parts[0] > 0) {
      parts[0]--;
      parts[1] = 0;
      parts[2] = 0;
    }
    return parts.join('.');
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    this.config = { ...DEFAULT_CONFIG, projectRoot: this.config.projectRoot };
    this.save();
    logger.info('Configuration reset to defaults');
  }

  /**
   * Get the configuration file path
   *
   * @returns Path to the configuration file
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Check if configuration file exists
   *
   * @returns True if config file exists
   */
  exists(): boolean {
    return existsSync(this.configPath);
  }

  /**
   * Validate the current configuration
   *
   * @returns Validation result with any errors
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate version
    if (!this.config.version.match(/^\d+\.\d+\.\d+$/)) {
      errors.push('Invalid version format, expected semver (e.g., 1.0.0)');
    }

    // Validate database config
    if (!this.config.database.path) {
      errors.push('Database path is required');
    }
    if (this.config.database.backupInterval < 0) {
      errors.push('Database backup interval must be non-negative');
    }
    if (this.config.database.maxBackups < 0) {
      errors.push('Database max backups must be non-negative');
    }

    // Validate cache config
    if (this.config.cache.maxSize < 0) {
      errors.push('Cache max size must be non-negative');
    }
    if (this.config.cache.ttl < 0) {
      errors.push('Cache TTL must be non-negative');
    }
    if (!['lru', 'lfu', 'fifo'].includes(this.config.cache.evictionPolicy)) {
      errors.push('Invalid cache eviction policy');
    }

    // Validate agents config
    if (this.config.agents.maxConcurrent < 1) {
      errors.push('Agents max concurrent must be at least 1');
    }
    if (this.config.agents.defaultTimeout < 0) {
      errors.push('Agents default timeout must be non-negative');
    }
    if (this.config.agents.retryAttempts < 0) {
      errors.push('Agents retry attempts must be non-negative');
    }

    // Validate services config
    if (this.config.services.healthCheckInterval < 0) {
      errors.push('Health check interval must be non-negative');
    }

    // Validate logging config
    if (!['debug', 'info', 'warn', 'error'].includes(this.config.logging.level)) {
      errors.push('Invalid logging level');
    }
    if (!['json', 'text'].includes(this.config.logging.format)) {
      errors.push('Invalid logging format');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Create a new ConfigManager instance
 *
 * @param projectRoot - Root directory of the project
 * @param configPath - Optional custom config file path
 * @returns ConfigManager instance
 */
export function createConfigManager(projectRoot: string, configPath?: string): ConfigManager {
  return new ConfigManager(projectRoot, configPath);
}

/**
 * Get a copy of the default configuration
 *
 * @returns Default configuration object
 */
export function getDefaultConfig(): KGConfiguration {
  return { ...DEFAULT_CONFIG };
}
