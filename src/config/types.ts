/**
 * Configuration Types
 *
 * Type definitions for Knowledge Graph configuration system.
 *
 * @module config/types
 */

/**
 * Main configuration interface for the Knowledge Graph system
 */
export interface KGConfiguration {
  /** Configuration version for migration support */
  version: string;

  /** Root directory of the project */
  projectRoot: string;

  /** Path to documentation directory (relative to projectRoot) */
  docsPath: string;

  /** Database configuration */
  database: DatabaseConfig;

  /** Cache configuration */
  cache: CacheConfig;

  /** Agent configuration */
  agents: AgentConfig;

  /** Services configuration */
  services: ServicesConfig;

  /** Logging configuration */
  logging: LoggingConfig;
}

/**
 * Database configuration settings
 */
export interface DatabaseConfig {
  /** Path to database file (relative to projectRoot) */
  path: string;

  /** Enable automatic backups */
  autoBackup: boolean;

  /** Backup interval in milliseconds (default: 24 hours) */
  backupInterval: number;

  /** Maximum number of backup files to retain */
  maxBackups: number;
}

/**
 * Cache configuration settings
 */
export interface CacheConfig {
  /** Enable caching */
  enabled: boolean;

  /** Maximum number of items in cache */
  maxSize: number;

  /** Time-to-live in milliseconds */
  ttl: number;

  /** Cache eviction policy */
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
}

/**
 * Agent configuration settings
 */
export interface AgentConfig {
  /** Maximum concurrent agent executions */
  maxConcurrent: number;

  /** Default timeout for agent operations in milliseconds */
  defaultTimeout: number;

  /** Number of retry attempts for failed operations */
  retryAttempts: number;

  /** Enable Claude Flow integration */
  claudeFlowEnabled: boolean;
}

/**
 * Services configuration settings
 */
export interface ServicesConfig {
  /** Enable file system watcher service */
  watcherEnabled: boolean;

  /** Enable task scheduler service */
  schedulerEnabled: boolean;

  /** Enable sync service */
  syncEnabled: boolean;

  /** Health check interval in milliseconds */
  healthCheckInterval: number;
}

/**
 * Logging configuration settings
 */
export interface LoggingConfig {
  /** Minimum log level */
  level: 'debug' | 'info' | 'warn' | 'error';

  /** Log output format */
  format: 'json' | 'text';

  /** Optional path for log file output */
  outputPath?: string;
}

/**
 * Configuration migration definition
 */
export interface ConfigMigration {
  /** Target version for this migration */
  version: string;

  /** Upgrade function */
  up: (config: Partial<KGConfiguration>) => Partial<KGConfiguration>;

  /** Downgrade function */
  down: (config: Partial<KGConfiguration>) => Partial<KGConfiguration>;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /** Whether the configuration is valid */
  valid: boolean;

  /** Validation errors if any */
  errors: ConfigValidationError[];

  /** Validation warnings if any */
  warnings: ConfigValidationError[];
}

/**
 * Configuration validation error
 */
export interface ConfigValidationError {
  /** Path to the invalid field */
  path: string;

  /** Error message */
  message: string;

  /** Expected value or type */
  expected?: string;

  /** Actual value received */
  actual?: string;
}
