/**
 * Configuration Module
 *
 * Provides configuration management with validation, migrations, and defaults.
 */

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Get default configuration
 */
export function getDefaultConfig(): KGConfiguration {
  return {
    database: {
      path: '.kg/knowledge.db',
      walMode: true,
      busyTimeout: 5000,
      cacheSize: 2000,
    },
    cache: {
      enabled: true,
      maxSize: 100 * 1024 * 1024, // 100MB
      defaultTtl: 3600000, // 1 hour
      evictionPolicy: 'lru',
    },
    agents: {
      maxConcurrent: 5,
      defaultTimeout: 30000,
      enableLogging: true,
    },
    services: {
      fileWatcher: true,
      watchPaths: ['docs', 'src'],
      healthCheckInterval: 60000,
    },
    logging: {
      level: 'info',
      format: 'text',
      console: true,
    },
    docsPath: 'docs',
  };
}

// ============================================================================
// Configuration Manager
// ============================================================================

/**
 * Configuration Manager for loading, saving, and managing configuration
 */
export class ConfigManager {
  private config: KGConfiguration;
  private configPath: string;
  private migrations: ConfigMigration[] = [];

  constructor(configPath?: string) {
    this.configPath = configPath || '.kg/config.json';
    this.config = getDefaultConfig();
  }

  /**
   * Load configuration from file
   */
  async load(): Promise<KGConfiguration> {
    try {
      const { readFileSync, existsSync } = await import('fs');
      if (existsSync(this.configPath)) {
        const content = readFileSync(this.configPath, 'utf-8');
        const loaded = JSON.parse(content) as Partial<KGConfiguration>;
        this.config = this.merge(getDefaultConfig(), loaded);
      }
    } catch {
      // Use defaults on error
    }
    return this.config;
  }

  /**
   * Save configuration to file
   */
  async save(): Promise<void> {
    const { writeFileSync, mkdirSync } = await import('fs');
    const { dirname } = await import('path');

    mkdirSync(dirname(this.configPath), { recursive: true });
    writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }

  /**
   * Get current configuration
   */
  get(): KGConfiguration {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  update(updates: Partial<KGConfiguration>): KGConfiguration {
    this.config = this.merge(this.config, updates);
    return this.config;
  }

  /**
   * Reset to defaults
   */
  reset(): KGConfiguration {
    this.config = getDefaultConfig();
    return this.config;
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.database?.path) {
      errors.push('Database path is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Register a migration
   */
  registerMigration(migration: ConfigMigration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Apply migrations
   */
  applyMigrations(fromVersion: number): KGConfiguration {
    for (const migration of this.migrations) {
      if (migration.version > fromVersion) {
        this.config = migration.migrate(this.config);
      }
    }
    return this.config;
  }

  /**
   * Merge configurations
   */
  private merge(
    base: KGConfiguration,
    updates: Partial<KGConfiguration>
  ): KGConfiguration {
    return {
      ...base,
      ...updates,
      database: { ...base.database, ...updates.database },
      cache: updates.cache ? { ...base.cache, ...updates.cache } : base.cache,
      agents: updates.agents ? { ...base.agents, ...updates.agents } : base.agents,
      services: updates.services ? { ...base.services, ...updates.services } : base.services,
      logging: updates.logging ? { ...base.logging, ...updates.logging } : base.logging,
    };
  }
}

/**
 * Create a new ConfigManager instance
 */
export function createConfigManager(configPath?: string): ConfigManager {
  return new ConfigManager(configPath);
}
