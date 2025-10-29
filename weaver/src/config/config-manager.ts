/**
 * Configuration Manager
 *
 * Centralized configuration management with:
 * - Multi-source loading (defaults, files, env, CLI)
 * - Validation with JSON schema
 * - Secure storage for sensitive values
 * - Hot-reloading with file watching
 * - Migration support
 */

import { cosmiconfig } from 'cosmiconfig';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { watch } from 'chokidar';
import { EventEmitter } from 'node:events';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import * as dotenv from 'dotenv';
import { expand as dotenvExpand } from 'dotenv-expand';

import type { WeaverConfig } from './schema.js';
import { configSchema, isSensitiveKey, maskSensitiveValue } from './schema.js';
import { defaultConfig, USER_CONFIG_FILE, USER_CONFIG_DIR } from './defaults.js';
import { migrateConfig, needsMigration, getConfigVersion } from './migrations.js';

/**
 * Deep merge two objects
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (sourceValue === undefined) {
      continue;
    }

    if (
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      sourceValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue) &&
      targetValue !== null
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue as any;
    }
  }

  return result;
}

/**
 * Get nested property from object using dot notation
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set nested property on object using dot notation
 */
function setNestedProperty(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!(key in current)) {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Parse environment variables into config structure
 */
function parseEnvVars(): Partial<WeaverConfig> {
  const config: any = {};

  // Map environment variables to config structure
  const envMapping: Record<string, string> = {
    'WEAVER_PORT': 'server.port',
    'WEAVER_HOST': 'server.host',
    'LOG_LEVEL': 'server.logLevel',
    'NODE_ENV': 'server.nodeEnv',
    'SHADOW_CACHE_DB_PATH': 'database.path',
    'CACHE_SYNC_INTERVAL': 'database.syncInterval',
    'WORKFLOWS_ENABLED': 'workflows.enabled',
    'WORKFLOWS_DB_PATH': 'workflows.dbPath',
    'MEMORY_MAX_CHUNK_SIZE': 'embeddings.maxChunkSize',
    'MEMORY_CHUNK_OVERLAP': 'embeddings.chunkOverlap',
    'MEMORY_EMBEDDING_MODEL': 'embeddings.model',
    'PERCEPTION_ENABLE_WEB_SCRAPING': 'perception.enableWebScraping',
    'PERCEPTION_ENABLE_SEARCH': 'perception.enableSearch',
    'PERCEPTION_DEFAULT_SOURCE': 'perception.defaultSource',
    'PERCEPTION_MAX_RESULTS': 'perception.maxResults',
    'WEB_SCRAPER_HEADLESS': 'perception.webScraper.headless',
    'WEB_SCRAPER_TIMEOUT': 'perception.webScraper.timeout',
    'WEB_SCRAPER_RETRIES': 'perception.webScraper.retries',
    'WEB_SCRAPER_USER_AGENT': 'perception.webScraper.userAgent',
    'LEARNING_ENABLE_PERCEPTION': 'learning.enablePerception',
    'LEARNING_ENABLE_REASONING': 'learning.enableReasoning',
    'LEARNING_ENABLE_MEMORY': 'learning.enableMemory',
    'LEARNING_ENABLE_EXECUTION': 'learning.enableExecution',
    'LEARNING_AUTO_ADAPTATION': 'learning.autoAdaptation',
    'LEARNING_MIN_EXECUTIONS': 'learning.minExecutions',
    'ADAPTATION_THRESHOLD': 'learning.adaptationThreshold',
    'GIT_AUTO_COMMIT': 'git.autoCommit',
    'GIT_AUTHOR_NAME': 'git.authorName',
    'GIT_AUTHOR_EMAIL': 'git.authorEmail',
    'GIT_COMMIT_DEBOUNCE_MS': 'git.commitDebounceMs',
    'VAULT_PATH': 'vault.path',
    'FILE_WATCHER_ENABLED': 'vault.fileWatcher.enabled',
    'FILE_WATCHER_DEBOUNCE': 'vault.fileWatcher.debounce',
    'FILE_WATCHER_IGNORE': 'vault.fileWatcher.ignore',
    'OBSIDIAN_API_URL': 'obsidian.apiUrl',
    'OBSIDIAN_API_KEY': 'obsidian.apiKey',
    'AI_PROVIDER': 'ai.provider',
    'VERCEL_AI_GATEWAY_API_KEY': 'ai.vercelApiKey',
    'ANTHROPIC_API_KEY': 'ai.anthropicApiKey',
    'DEFAULT_AI_MODEL': 'ai.defaultModel',
    'FEATURE_AI_ENABLED': 'features.aiEnabled',
    'FEATURE_TEMPORAL_ENABLED': 'features.temporalEnabled',
    'FEATURE_GRAPH_ANALYTICS': 'features.graphAnalytics',
    'MCP_ENABLED': 'features.mcpEnabled',
    'MCP_TRANSPORT': 'features.mcpTransport',
    'GOOGLE_API_KEY': 'perception.googleApiKey',
    'GOOGLE_CSE_ID': 'perception.googleCseId',
    'BING_API_KEY': 'perception.bingApiKey',
  };

  for (const [envVar, configPath] of Object.entries(envMapping)) {
    const value = process.env[envVar];
    if (value !== undefined) {
      // Parse boolean values
      let parsedValue: any = value;
      if (value === 'true') parsedValue = true;
      else if (value === 'false') parsedValue = false;
      // Parse numbers
      else if (/^\d+$/.test(value)) parsedValue = parseInt(value, 10);
      else if (/^\d+\.\d+$/.test(value)) parsedValue = parseFloat(value);
      // Parse arrays (comma-separated)
      else if (value.includes(',')) parsedValue = value.split(',').map(s => s.trim());

      setNestedProperty(config, configPath, parsedValue);
    }
  }

  return config;
}

/**
 * Configuration Manager Events
 */
export interface ConfigManagerEvents {
  'config:loaded': (config: WeaverConfig) => void;
  'config:changed': (config: WeaverConfig, changes: Partial<WeaverConfig>) => void;
  'config:error': (error: Error) => void;
}

/**
 * Configuration Manager
 */
export class ConfigManager extends EventEmitter {
  private config: WeaverConfig;
  private validator: Ajv;
  private watcher?: ReturnType<typeof watch>;
  private configFilePath?: string;

  constructor() {
    super();

    // Initialize validator
    this.validator = new Ajv({ allErrors: true, strict: false });
    addFormats(this.validator);

    // Start with defaults
    this.config = { ...defaultConfig };
  }

  /**
   * Load configuration from all sources
   */
  async load(options: { watch: boolean } = { watch: false }): Promise<WeaverConfig> {
    try {
      // 1. Start with defaults
      let config = { ...defaultConfig };

      // 2. Load from .env file
      const envResult = dotenv.config();
      if (envResult.parsed) {
        dotenvExpand(envResult);
      }

      // 3. Load from config file (cosmiconfig)
      const explorer = cosmiconfig('weaver');
      const result = await explorer.search();

      if (result && !result.isEmpty) {
        this.configFilePath = result.filepath;

        // Check if migration is needed
        if (needsMigration(result.config)) {
          const currentVersion = getConfigVersion(result.config);
          console.log(`Migrating configuration from ${currentVersion} to ${config.version}`);
          const migrated = migrateConfig(result.config);
          config = deepMerge(config, migrated);
        } else {
          config = deepMerge(config, result.config);
        }
      }

      // 4. Load from user config file
      if (existsSync(USER_CONFIG_FILE)) {
        try {
          const userConfig = JSON.parse(readFileSync(USER_CONFIG_FILE, 'utf-8'));
          if (needsMigration(userConfig)) {
            const migrated = migrateConfig(userConfig);
            config = deepMerge(config, migrated);
          } else {
            config = deepMerge(config, userConfig);
          }
        } catch (error) {
          console.warn('Failed to load user config:', error);
        }
      }

      // 5. Override with environment variables
      const envConfig = parseEnvVars();
      config = deepMerge(config, envConfig);

      // 6. Validate final configuration
      this.validate(config);

      this.config = config;

      // 7. Setup file watcher if requested
      if (options.watch && this.configFilePath) {
        this.setupWatcher();
      }

      this.emit('config:loaded', this.config);

      return this.config;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('config:error', err);
      throw err;
    }
  }

  /**
   * Validate configuration against schema
   */
  private validate(config: any): void {
    const validate = this.validator.compile(configSchema);
    const valid = validate(config);

    if (!valid) {
      const errors = validate.errors?.map(err =>
        `${err.instancePath} ${err.message}`
      ).join(', ');
      throw new Error(`Configuration validation failed: ${errors}`);
    }
  }

  /**
   * Get current configuration
   */
  get(key?: string): any {
    if (!key) {
      return this.config;
    }
    return getNestedProperty(this.config, key);
  }

  /**
   * Set configuration value
   */
  async set(key: string, value: any, persist: boolean = true): Promise<void> {
    const newConfig = { ...this.config };
    setNestedProperty(newConfig, key, value);

    // Validate before applying
    this.validate(newConfig);

    const oldValue = getNestedProperty(this.config, key);
    this.config = newConfig;

    // Persist to user config file
    if (persist) {
      await this.saveUserConfig();
    }

    // Emit change event
    const changes: any = {};
    setNestedProperty(changes, key, value);
    this.emit('config:changed', this.config, changes);
  }

  /**
   * Reset configuration to defaults
   */
  async reset(): Promise<void> {
    this.config = { ...defaultConfig };

    // Clear user config file
    if (existsSync(USER_CONFIG_FILE)) {
      writeFileSync(USER_CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    }

    this.emit('config:changed', this.config, {});
  }

  /**
   * Save current configuration to user config file
   */
  private async saveUserConfig(): Promise<void> {
    if (!existsSync(USER_CONFIG_DIR)) {
      mkdirSync(USER_CONFIG_DIR, { recursive: true });
    }

    writeFileSync(USER_CONFIG_FILE, JSON.stringify(this.config, null, 2));
  }

  /**
   * Get configuration with masked sensitive values
   */
  getMasked(): WeaverConfig {
    const masked = JSON.parse(JSON.stringify(this.config));

    const maskObject = (obj: any, path: string = ''): void => {
      for (const key in obj) {
        const value = obj[key];
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          maskObject(value, currentPath);
        } else if (typeof value === 'string' && isSensitiveKey(key)) {
          obj[key] = maskSensitiveValue(value);
        }
      }
    };

    maskObject(masked);
    return masked;
  }

  /**
   * Get differences from default configuration
   */
  getDiff(): Partial<WeaverConfig> {
    const diff: any = {};

    const compareObjects = (current: any, defaults: any, path: string = ''): void => {
      for (const key in current) {
        const currentValue = current[key];
        const defaultValue = defaults[key];
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)) {
          if (typeof defaultValue === 'object' && defaultValue !== null) {
            compareObjects(currentValue, defaultValue, currentPath);
          } else {
            setNestedProperty(diff, currentPath, currentValue);
          }
        } else if (JSON.stringify(currentValue) !== JSON.stringify(defaultValue)) {
          setNestedProperty(diff, currentPath, currentValue);
        }
      }
    };

    compareObjects(this.config, defaultConfig);
    return diff;
  }

  /**
   * Setup file watcher for hot-reload
   */
  private setupWatcher(): void {
    if (this.watcher) {
      this.watcher.close();
    }

    const watchPaths = [this.configFilePath, USER_CONFIG_FILE].filter(Boolean) as string[];

    this.watcher = watch(watchPaths, {
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher.on('change', async (path) => {
      try {
        console.log(`Configuration file changed: ${path}`);
        await this.load({ watch: false });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.emit('config:error', err);
      }
    });
  }

  /**
   * Stop file watcher
   */
  stopWatcher(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = undefined;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopWatcher();
    this.removeAllListeners();
  }
}

/**
 * Singleton instance
 */
let instance: ConfigManager | undefined;

/**
 * Get global configuration manager instance
 */
export function getConfigManager(): ConfigManager {
  if (!instance) {
    instance = new ConfigManager();
  }
  return instance;
}
