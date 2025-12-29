function getDefaultConfig() {
  return {
    database: {
      path: ".kg/knowledge.db",
      walMode: true,
      busyTimeout: 5e3,
      cacheSize: 2e3
    },
    cache: {
      enabled: true,
      maxSize: 100 * 1024 * 1024,
      // 100MB
      defaultTtl: 36e5,
      // 1 hour
      evictionPolicy: "lru"
    },
    agents: {
      maxConcurrent: 5,
      defaultTimeout: 3e4,
      enableLogging: true
    },
    services: {
      fileWatcher: true,
      watchPaths: ["docs", "src"],
      healthCheckInterval: 6e4
    },
    logging: {
      level: "info",
      format: "text",
      console: true
    },
    docsPath: "docs"
  };
}
class ConfigManager {
  config;
  configPath;
  migrations = [];
  constructor(configPath) {
    this.configPath = configPath || ".kg/config.json";
    this.config = getDefaultConfig();
  }
  /**
   * Load configuration from file
   */
  async load() {
    try {
      const { readFileSync, existsSync } = await import("fs");
      if (existsSync(this.configPath)) {
        const content = readFileSync(this.configPath, "utf-8");
        const loaded = JSON.parse(content);
        this.config = this.merge(getDefaultConfig(), loaded);
      }
    } catch {
    }
    return this.config;
  }
  /**
   * Save configuration to file
   */
  async save() {
    const { writeFileSync, mkdirSync } = await import("fs");
    const { dirname } = await import("path");
    mkdirSync(dirname(this.configPath), { recursive: true });
    writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }
  /**
   * Get current configuration
   */
  get() {
    return { ...this.config };
  }
  /**
   * Update configuration
   */
  update(updates) {
    this.config = this.merge(this.config, updates);
    return this.config;
  }
  /**
   * Reset to defaults
   */
  reset() {
    this.config = getDefaultConfig();
    return this.config;
  }
  /**
   * Validate configuration
   */
  validate() {
    const errors = [];
    if (!this.config.database?.path) {
      errors.push("Database path is required");
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
  /**
   * Register a migration
   */
  registerMigration(migration) {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }
  /**
   * Apply migrations
   */
  applyMigrations(fromVersion) {
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
  merge(base, updates) {
    return {
      ...base,
      ...updates,
      database: { ...base.database, ...updates.database },
      cache: updates.cache ? { ...base.cache, ...updates.cache } : base.cache,
      agents: updates.agents ? { ...base.agents, ...updates.agents } : base.agents,
      services: updates.services ? { ...base.services, ...updates.services } : base.services,
      logging: updates.logging ? { ...base.logging, ...updates.logging } : base.logging
    };
  }
}
function createConfigManager(configPath) {
  return new ConfigManager(configPath);
}
export {
  ConfigManager,
  createConfigManager,
  getDefaultConfig
};
//# sourceMappingURL=index.js.map
