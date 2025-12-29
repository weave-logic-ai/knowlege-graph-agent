import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { createLogger } from "../utils/logger.js";
const logger = createLogger("config-manager");
const DEFAULT_CONFIG = {
  version: "1.0.0",
  projectRoot: process.cwd(),
  docsPath: "docs",
  database: {
    path: ".kg/knowledge.db",
    autoBackup: true,
    backupInterval: 864e5,
    // 24 hours
    maxBackups: 5
  },
  cache: {
    enabled: true,
    maxSize: 1e3,
    ttl: 36e5,
    // 1 hour
    evictionPolicy: "lru"
  },
  agents: {
    maxConcurrent: 5,
    defaultTimeout: 3e4,
    // 30 seconds
    retryAttempts: 3,
    claudeFlowEnabled: true
  },
  services: {
    watcherEnabled: true,
    schedulerEnabled: true,
    syncEnabled: true,
    healthCheckInterval: 6e4
    // 1 minute
  },
  logging: {
    level: "info",
    format: "text"
  }
};
class ConfigManager {
  config;
  configPath;
  migrations = [];
  /**
   * Create a new ConfigManager instance
   *
   * @param projectRoot - Root directory of the project
   * @param configPath - Optional custom config file path
   */
  constructor(projectRoot, configPath) {
    this.configPath = configPath || join(projectRoot, ".kg/config.json");
    this.config = this.load();
    this.config.projectRoot = projectRoot;
  }
  /**
   * Load configuration from file
   *
   * @returns Loaded configuration merged with defaults
   */
  load() {
    if (!existsSync(this.configPath)) {
      logger.debug("No config file found, using defaults", { path: this.configPath });
      return { ...DEFAULT_CONFIG };
    }
    try {
      const data = readFileSync(this.configPath, "utf-8");
      const loaded = JSON.parse(data);
      logger.debug("Loaded configuration", { path: this.configPath, version: loaded.version });
      return this.mergeWithDefaults(loaded);
    } catch (error) {
      logger.warn("Failed to load config, using defaults", {
        error: error instanceof Error ? error.message : String(error)
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
  mergeWithDefaults(loaded) {
    return {
      ...DEFAULT_CONFIG,
      ...loaded,
      database: { ...DEFAULT_CONFIG.database, ...loaded.database },
      cache: { ...DEFAULT_CONFIG.cache, ...loaded.cache },
      agents: { ...DEFAULT_CONFIG.agents, ...loaded.agents },
      services: { ...DEFAULT_CONFIG.services, ...loaded.services },
      logging: { ...DEFAULT_CONFIG.logging, ...loaded.logging }
    };
  }
  /**
   * Save configuration to file
   */
  save() {
    const dir = dirname(this.configPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    try {
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      logger.info("Configuration saved", { path: this.configPath });
    } catch (error) {
      logger.error("Failed to save configuration", error instanceof Error ? error : void 0, {
        path: this.configPath
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
  get(key) {
    return this.config[key];
  }
  /**
   * Set a configuration value
   *
   * @param key - Configuration key
   * @param value - Value to set
   */
  set(key, value) {
    this.config[key] = value;
    this.save();
  }
  /**
   * Update multiple configuration values
   *
   * @param updates - Partial configuration to merge
   */
  update(updates) {
    this.config = this.mergeWithDefaults({ ...this.config, ...updates });
    this.save();
  }
  /**
   * Get the complete configuration
   *
   * @returns Complete configuration object (copy)
   */
  getAll() {
    return { ...this.config };
  }
  /**
   * Register a configuration migration
   *
   * @param migration - Migration definition
   */
  registerMigration(migration) {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version.localeCompare(b.version, void 0, { numeric: true }));
    logger.debug("Registered migration", { version: migration.version });
  }
  /**
   * Run migrations to target version
   *
   * @param targetVersion - Target version to migrate to (defaults to latest)
   */
  migrate(targetVersion) {
    const currentVersion = this.config.version;
    const target = targetVersion || this.migrations[this.migrations.length - 1]?.version || currentVersion;
    if (currentVersion === target) {
      logger.info("Config already at target version", { version: target });
      return;
    }
    const isUpgrade = this.compareVersions(currentVersion, target) < 0;
    const applicableMigrations = this.migrations.filter((m) => {
      if (isUpgrade) {
        return this.compareVersions(m.version, currentVersion) > 0 && this.compareVersions(m.version, target) <= 0;
      } else {
        return this.compareVersions(m.version, currentVersion) <= 0 && this.compareVersions(m.version, target) > 0;
      }
    });
    if (!isUpgrade) {
      applicableMigrations.reverse();
    }
    for (const migration of applicableMigrations) {
      logger.info(`Applying migration ${migration.version}`, {
        direction: isUpgrade ? "up" : "down"
      });
      try {
        const result = isUpgrade ? migration.up(this.config) : migration.down(this.config);
        this.config = this.mergeWithDefaults(result);
        this.config.version = isUpgrade ? migration.version : this.getPreviousVersion(migration.version);
      } catch (error) {
        logger.error(
          `Migration ${migration.version} failed`,
          error instanceof Error ? error : void 0
        );
        throw error;
      }
    }
    this.config.version = target;
    this.save();
    logger.info("Migration complete", { from: currentVersion, to: target });
  }
  /**
   * Compare two version strings
   *
   * @param a - First version
   * @param b - Second version
   * @returns Negative if a < b, 0 if equal, positive if a > b
   */
  compareVersions(a, b) {
    const partsA = a.split(".").map(Number);
    const partsB = b.split(".").map(Number);
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
  getPreviousVersion(version) {
    const index = this.migrations.findIndex((m) => m.version === version);
    if (index > 0) {
      return this.migrations[index - 1].version;
    }
    const parts = version.split(".").map(Number);
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
    return parts.join(".");
  }
  /**
   * Reset configuration to defaults
   */
  reset() {
    this.config = { ...DEFAULT_CONFIG, projectRoot: this.config.projectRoot };
    this.save();
    logger.info("Configuration reset to defaults");
  }
  /**
   * Get the configuration file path
   *
   * @returns Path to the configuration file
   */
  getConfigPath() {
    return this.configPath;
  }
  /**
   * Check if configuration file exists
   *
   * @returns True if config file exists
   */
  exists() {
    return existsSync(this.configPath);
  }
  /**
   * Validate the current configuration
   *
   * @returns Validation result with any errors
   */
  validate() {
    const errors = [];
    if (!this.config.version.match(/^\d+\.\d+\.\d+$/)) {
      errors.push("Invalid version format, expected semver (e.g., 1.0.0)");
    }
    if (!this.config.database.path) {
      errors.push("Database path is required");
    }
    if (this.config.database.backupInterval < 0) {
      errors.push("Database backup interval must be non-negative");
    }
    if (this.config.database.maxBackups < 0) {
      errors.push("Database max backups must be non-negative");
    }
    if (this.config.cache.maxSize < 0) {
      errors.push("Cache max size must be non-negative");
    }
    if (this.config.cache.ttl < 0) {
      errors.push("Cache TTL must be non-negative");
    }
    if (!["lru", "lfu", "fifo"].includes(this.config.cache.evictionPolicy)) {
      errors.push("Invalid cache eviction policy");
    }
    if (this.config.agents.maxConcurrent < 1) {
      errors.push("Agents max concurrent must be at least 1");
    }
    if (this.config.agents.defaultTimeout < 0) {
      errors.push("Agents default timeout must be non-negative");
    }
    if (this.config.agents.retryAttempts < 0) {
      errors.push("Agents retry attempts must be non-negative");
    }
    if (this.config.services.healthCheckInterval < 0) {
      errors.push("Health check interval must be non-negative");
    }
    if (!["debug", "info", "warn", "error"].includes(this.config.logging.level)) {
      errors.push("Invalid logging level");
    }
    if (!["json", "text"].includes(this.config.logging.format)) {
      errors.push("Invalid logging format");
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
export {
  ConfigManager
};
//# sourceMappingURL=manager.js.map
