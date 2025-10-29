/**
 * Weaver Configuration Module
 *
 * Centralized configuration management with environment variable validation
 * and type-safe access to all Weaver settings.
 */

import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenvConfig();

/**
 * Configuration schema with validation
 */
const ConfigSchema = z.object({
  // Vault Configuration
  vault: z.object({
    path: z.string().min(1, 'VAULT_PATH is required'),
  }),

  // Obsidian API Configuration
  obsidian: z.object({
    apiUrl: z.string().url('OBSIDIAN_API_URL must be a valid URL'),
    apiKey: z.string().min(1, 'OBSIDIAN_API_KEY is required'),
  }),

  // AI Configuration
  ai: z.object({
    provider: z.enum(['vercel-gateway', 'anthropic']).default('vercel-gateway'),
    vercelApiKey: z.string().optional(),
    anthropicApiKey: z.string().optional(),
    defaultModel: z.string().default('claude-3-5-sonnet-20241022'),
  }),

  // Weaver Service Configuration
  service: z.object({
    env: z.enum(['development', 'production', 'test']).default('development'),
    port: z.number().int().positive().default(3000),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }),

  // Shadow Cache Configuration
  shadowCache: z.object({
    dbPath: z.string().default('./data/shadow-cache.db'),
    syncInterval: z.number().int().positive().default(300),
  }),

  // File Watcher Configuration
  fileWatcher: z.object({
    enabled: z.boolean().default(true),
    debounce: z.number().int().positive().default(1000),
    ignore: z.array(z.string()).default(['.obsidian', '.git', 'node_modules', '.archive']),
  }),

  // Workflow Configuration
  workflows: z.object({
    enabled: z.boolean().default(true),
    dbPath: z.string().default('./data/workflows.db'),
  }),

  // MCP Server Configuration
  mcp: z.object({
    enabled: z.boolean().default(true),
    transport: z.enum(['stdio', 'http']).default('stdio'),
  }),

  // Git Configuration
  git: z.object({
    autoCommit: z.boolean().default(true),
    authorName: z.string().default('Weaver'),
    authorEmail: z.string().default('weaver@weave-nn.local'),
    commitDebounceMs: z.number().int().positive().default(300000), // 5 minutes
  }),

  // Memory Synchronization Configuration
  memory: z.object({
    enabled: z.boolean().default(true),
    defaultNamespace: z.string().default('vault/'),
    defaultTTL: z.number().int().nonnegative().default(0),
    retryAttempts: z.number().int().positive().default(3),
    retryDelay: z.number().int().positive().default(1000),
    conflictLogPath: z.string().default('./data/sync-conflicts.json'),
  }),

  // Feature Flags
  features: z.object({
    aiEnabled: z.boolean().default(true),
    temporalEnabled: z.boolean().default(false),
    graphAnalytics: z.boolean().default(false),
    memorySync: z.boolean().default(true),
  }),
});

export type WeaverConfig = z.infer<typeof ConfigSchema>;

/**
 * Parse and validate configuration from environment variables
 */
function loadConfig(): WeaverConfig {
  const env = process.env;
  const rawConfig = {
    vault: {
      path: env['VAULT_PATH'] || '',
    },
    obsidian: {
      apiUrl: env['OBSIDIAN_API_URL'] || 'https://localhost:27124',
      apiKey: env['OBSIDIAN_API_KEY'] || '',
    },
    ai: {
      provider: (env['AI_PROVIDER'] as 'vercel-gateway' | 'anthropic') || 'vercel-gateway',
      vercelApiKey: env['VERCEL_AI_GATEWAY_API_KEY'],
      anthropicApiKey: env['ANTHROPIC_API_KEY'],
      defaultModel: env['DEFAULT_AI_MODEL'] || 'claude-3-5-sonnet-20241022',
    },
    service: {
      env: (env['NODE_ENV'] as 'development' | 'production' | 'test') || 'development',
      port: parseInt(env['WEAVER_PORT'] || '3000', 10),
      logLevel: (env['LOG_LEVEL'] as 'debug' | 'info' | 'warn' | 'error') || 'info',
    },
    shadowCache: {
      dbPath: env['SHADOW_CACHE_DB_PATH'] || './data/shadow-cache.db',
      syncInterval: parseInt(env['CACHE_SYNC_INTERVAL'] || '300', 10),
    },
    fileWatcher: {
      enabled: env['FILE_WATCHER_ENABLED'] !== 'false',
      debounce: parseInt(env['FILE_WATCHER_DEBOUNCE'] || '1000', 10),
      ignore: env['FILE_WATCHER_IGNORE']?.split(',') || ['.obsidian', '.git', 'node_modules', '.archive'],
    },
    workflows: {
      enabled: env['WORKFLOWS_ENABLED'] !== 'false',
      dbPath: env['WORKFLOWS_DB_PATH'] || './data/workflows.db',
    },
    mcp: {
      enabled: env['MCP_ENABLED'] !== 'false',
      transport: (env['MCP_TRANSPORT'] as 'stdio' | 'http') || 'stdio',
    },
    git: {
      autoCommit: env['GIT_AUTO_COMMIT'] !== 'false',
      authorName: env['GIT_AUTHOR_NAME'] || 'Weaver',
      authorEmail: env['GIT_AUTHOR_EMAIL'] || 'weaver@weave-nn.local',
      commitDebounceMs: parseInt(env['GIT_COMMIT_DEBOUNCE_MS'] || '300000', 10),
    },
    memory: {
      enabled: env['MEMORY_SYNC_ENABLED'] !== 'false',
      defaultNamespace: env['MEMORY_DEFAULT_NAMESPACE'] || 'vault/',
      defaultTTL: parseInt(env['MEMORY_DEFAULT_TTL'] || '0', 10),
      retryAttempts: parseInt(env['MEMORY_RETRY_ATTEMPTS'] || '3', 10),
      retryDelay: parseInt(env['MEMORY_RETRY_DELAY'] || '1000', 10),
      conflictLogPath: env['MEMORY_CONFLICT_LOG_PATH'] || './data/sync-conflicts.json',
    },
    features: {
      aiEnabled: env['FEATURE_AI_ENABLED'] !== 'false',
      temporalEnabled: env['FEATURE_TEMPORAL_ENABLED'] === 'true',
      graphAnalytics: env['FEATURE_GRAPH_ANALYTICS'] === 'true',
      memorySync: env['FEATURE_MEMORY_SYNC'] !== 'false',
    },
  };

  // Validate configuration
  const result = ConfigSchema.safeParse(rawConfig);

  if (!result.success) {
    console.error('Configuration validation failed:');
    console.error(result.error.format());
    throw new Error('Invalid configuration. Check environment variables.');
  }

  return result.data;
}

/**
 * Global configuration instance
 */
export const config = loadConfig();

/**
 * Helper to get absolute paths
 */
export function getAbsolutePath(relativePath: string): string {
  return resolve(process.cwd(), relativePath);
}

/**
 * Helper to resolve vault-relative paths
 */
export function resolveVaultPath(vaultRelativePath: string): string {
  return resolve(config.vault.path, vaultRelativePath);
}

/**
 * Configuration display (safe for logging - no secrets)
 */
export function displayConfig(): Record<string, unknown> {
  return {
    vault: config.vault,
    obsidian: {
      apiUrl: config.obsidian.apiUrl,
      apiKey: '***' + config.obsidian.apiKey.slice(-4),
    },
    ai: {
      provider: config.ai.provider,
      defaultModel: config.ai.defaultModel,
      vercelApiKey: config.ai.vercelApiKey ? '***' + config.ai.vercelApiKey.slice(-4) : undefined,
      anthropicApiKey: config.ai.anthropicApiKey ? '***' + config.ai.anthropicApiKey.slice(-4) : undefined,
    },
    service: config.service,
    shadowCache: config.shadowCache,
    fileWatcher: config.fileWatcher,
    workflows: config.workflows,
    mcp: config.mcp,
    git: config.git,
    memory: config.memory,
    features: config.features,
  };
}
