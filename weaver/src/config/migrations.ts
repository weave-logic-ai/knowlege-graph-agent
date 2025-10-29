/**
 * Configuration Migrations
 *
 * Handles migration of configuration between schema versions.
 * Ensures backward compatibility and smooth upgrades.
 */

import type { WeaverConfig } from './schema.js';
import { CONFIG_VERSION } from './defaults.js';

/**
 * Migration function signature
 */
type MigrationFunction = (config: any) => any;

/**
 * Migration registry: version -> migration function
 */
const migrations: Map<string, MigrationFunction> = new Map();

/**
 * Register a migration from one version to another
 */
function registerMigration(fromVersion: string, toVersion: string, migrate: MigrationFunction): void {
  const key = `${fromVersion}:${toVersion}`;
  migrations.set(key, migrate);
}

/**
 * Migration from 0.1.0 to 1.0.0
 * - Restructures configuration into logical groups
 * - Adds new feature flags
 */
registerMigration('0.1.0', '1.0.0', (config: any) => {
  return {
    version: '1.0.0',
    server: {
      port: config.port || 3000,
      host: config.host || '127.0.0.1',
      logLevel: config.logLevel || 'info',
      nodeEnv: config.nodeEnv || 'development',
    },
    database: {
      path: config.dbPath || './data/shadow-cache.db',
      backupDir: config.backupDir || './data/backups',
      autoBackup: config.autoBackup ?? true,
      syncInterval: config.syncInterval || 300,
    },
    workflows: {
      enabled: config.workflowsEnabled ?? true,
      dbPath: config.workflowsDbPath || './data/workflows.db',
      maxConcurrency: config.maxConcurrency || 5,
      timeout: config.timeout || 300000,
    },
    embeddings: {
      provider: config.embeddingProvider || 'xenova',
      model: config.embeddingModel || 'text-embedding-ada-002',
      apiKey: config.openaiApiKey,
      maxChunkSize: config.maxChunkSize || 1000,
      chunkOverlap: config.chunkOverlap || 100,
    },
    perception: {
      searchProvider: config.searchProvider || 'duckduckgo',
      apiKey: config.searchApiKey,
      googleApiKey: config.googleApiKey,
      googleCseId: config.googleCseId,
      bingApiKey: config.bingApiKey,
      enableWebScraping: config.enableWebScraping ?? false,
      enableSearch: config.enableSearch ?? true,
      defaultSource: config.defaultSource || 'search',
      maxResults: config.maxResults || 10,
      webScraper: {
        headless: config.webScraperHeadless ?? true,
        timeout: config.webScraperTimeout || 30000,
        retries: config.webScraperRetries || 3,
        userAgent: config.webScraperUserAgent || 'Mozilla/5.0 (compatible; WeaverBot/1.0)',
      },
    },
    learning: {
      enabled: config.learningEnabled ?? true,
      feedbackThreshold: config.feedbackThreshold || 0.7,
      enablePerception: config.learningEnablePerception ?? true,
      enableReasoning: config.learningEnableReasoning ?? true,
      enableMemory: config.learningEnableMemory ?? true,
      enableExecution: config.learningEnableExecution ?? true,
      autoAdaptation: config.learningAutoAdaptation ?? true,
      minExecutions: config.learningMinExecutions || 5,
      adaptationThreshold: config.adaptationThreshold || 0.7,
      maxStrategies: config.maxStrategies || 10,
    },
    git: {
      autoCommit: config.gitAutoCommit ?? true,
      authorName: config.gitAuthorName || 'Weaver',
      authorEmail: config.gitAuthorEmail || 'weaver@weave-nn.local',
      commitDebounceMs: config.gitCommitDebounceMs || 300000,
    },
    vault: {
      path: config.vaultPath || '',
      fileWatcher: {
        enabled: config.fileWatcherEnabled ?? true,
        debounce: config.fileWatcherDebounce || 1000,
        ignore: config.fileWatcherIgnore || ['.obsidian', '.git', 'node_modules', '.archive'],
      },
    },
    obsidian: {
      apiUrl: config.obsidianApiUrl || 'https://localhost:27124',
      apiKey: config.obsidianApiKey,
    },
    ai: {
      provider: config.aiProvider || 'vercel-gateway',
      vercelApiKey: config.vercelApiKey,
      anthropicApiKey: config.anthropicApiKey,
      defaultModel: config.defaultModel || 'claude-3-5-sonnet-20241022',
    },
    features: {
      aiEnabled: config.featureAiEnabled ?? true,
      temporalEnabled: config.featureTemporalEnabled ?? false,
      graphAnalytics: config.featureGraphAnalytics ?? false,
      mcpEnabled: config.mcpEnabled ?? true,
      mcpTransport: config.mcpTransport || 'stdio',
    },
  };
});

/**
 * Get all migration steps needed to go from one version to another
 */
function getMigrationPath(fromVersion: string, toVersion: string): string[] {
  // For now, only support direct migrations
  // In the future, could implement multi-step migrations
  const key = `${fromVersion}:${toVersion}`;
  return migrations.has(key) ? [key] : [];
}

/**
 * Migrate configuration from one version to another
 */
export function migrateConfig(config: any, targetVersion: string = CONFIG_VERSION): Partial<WeaverConfig> {
  const currentVersion = config.version || '0.1.0';

  if (currentVersion === targetVersion) {
    return config;
  }

  const migrationPath = getMigrationPath(currentVersion, targetVersion);

  if (migrationPath.length === 0) {
    throw new Error(
      `No migration path found from version ${currentVersion} to ${targetVersion}`
    );
  }

  let migratedConfig = config;

  for (const step of migrationPath) {
    const migrationFn = migrations.get(step);
    if (!migrationFn) {
      throw new Error(`Migration function not found for step: ${step}`);
    }
    migratedConfig = migrationFn(migratedConfig);
  }

  return migratedConfig;
}

/**
 * Check if a configuration needs migration
 */
export function needsMigration(config: any, targetVersion: string = CONFIG_VERSION): boolean {
  const currentVersion = config.version || '0.1.0';
  return currentVersion !== targetVersion;
}

/**
 * Get the current configuration version
 */
export function getConfigVersion(config: any): string {
  return config.version || '0.1.0';
}
