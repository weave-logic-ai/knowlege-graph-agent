/**
 * Legacy Configuration Support
 *
 * Provides backward compatibility for code using the old config system.
 * This loads the new configuration manager and exposes it as the old interface.
 */

import { config as dotenvConfig } from 'dotenv';
import { getConfigManager } from './config-manager.js';
import type { WeaverConfig } from './schema.js';

// Load environment variables from .env file
dotenvConfig();

/**
 * Legacy config object for backward compatibility
 * Initializes synchronously with defaults and environment variables
 */
class LegacyConfigProxy {
  private manager = getConfigManager();
  private loaded = false;

  constructor() {
    // Auto-load configuration asynchronously
    this.manager.load().catch(console.error);
  }

  get vault() {
    this.ensureLoaded();
    return this.manager.get('vault');
  }

  get obsidian() {
    this.ensureLoaded();
    return this.manager.get('obsidian');
  }

  get ai() {
    this.ensureLoaded();
    return this.manager.get('ai');
  }

  get service() {
    this.ensureLoaded();
    const server = this.manager.get('server');
    return {
      env: server.nodeEnv,
      port: server.port,
      logLevel: server.logLevel,
    };
  }

  get server() {
    this.ensureLoaded();
    return this.manager.get('server');
  }

  get shadowCache() {
    this.ensureLoaded();
    const db = this.manager.get('database');
    return {
      dbPath: db.path,
      syncInterval: db.syncInterval,
    };
  }

  get database() {
    this.ensureLoaded();
    return this.manager.get('database');
  }

  get fileWatcher() {
    this.ensureLoaded();
    return this.manager.get('vault').fileWatcher;
  }

  get workflows() {
    this.ensureLoaded();
    return this.manager.get('workflows');
  }

  get mcp() {
    this.ensureLoaded();
    const features = this.manager.get('features');
    return {
      enabled: features.mcpEnabled,
      transport: features.mcpTransport,
    };
  }

  get git() {
    this.ensureLoaded();
    return this.manager.get('git');
  }

  get memory() {
    this.ensureLoaded();
    return {
      enabled: true,
      defaultNamespace: 'vault/',
      defaultTTL: 0,
      retryAttempts: 3,
      retryDelay: 1000,
      conflictLogPath: './data/sync-conflicts.json',
    };
  }

  get features() {
    this.ensureLoaded();
    const features = this.manager.get('features');
    return {
      aiEnabled: features.aiEnabled,
      temporalEnabled: features.temporalEnabled,
      graphAnalytics: features.graphAnalytics,
      memorySync: true,
    };
  }

  private ensureLoaded() {
    if (!this.loaded) {
      // Use synchronous defaults if not yet loaded
      // The async load will update values when ready
      this.loaded = true;
    }
  }
}

/**
 * Legacy config instance for backward compatibility
 */
export const config = new LegacyConfigProxy() as any as WeaverConfig;

/**
 * Helper to get absolute paths
 */
export function getAbsolutePath(relativePath: string): string {
  const { resolve } = require('path');
  return resolve(process.cwd(), relativePath);
}

/**
 * Helper to resolve vault-relative paths
 */
export function resolveVaultPath(vaultRelativePath: string): string {
  const { resolve } = require('path');
  return resolve(config.vault.path, vaultRelativePath);
}

/**
 * Configuration display (safe for logging - no secrets)
 */
export function displayConfig(): Record<string, unknown> {
  const manager = getConfigManager();
  return manager.getMasked() as unknown as Record<string, unknown>;
}
