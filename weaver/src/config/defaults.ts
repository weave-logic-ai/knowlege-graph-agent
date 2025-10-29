/**
 * Default Configuration
 *
 * Provides default values for all configuration options.
 * These are the lowest priority and can be overridden by files, env vars, or CLI flags.
 */

import type { WeaverConfig } from './schema.js';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Current configuration schema version
 */
export const CONFIG_VERSION = '1.0.0';

/**
 * Default configuration values
 */
export const defaultConfig: WeaverConfig = {
  version: CONFIG_VERSION,

  server: {
    port: 3000,
    host: '127.0.0.1',
    logLevel: 'info',
    nodeEnv: 'development',
  },

  database: {
    path: './data/shadow-cache.db',
    backupDir: './data/backups',
    autoBackup: true,
    syncInterval: 300, // 5 minutes
  },

  workflows: {
    enabled: true,
    dbPath: './data/workflows.db',
    maxConcurrency: 5,
    timeout: 300000, // 5 minutes
  },

  embeddings: {
    provider: 'xenova',
    model: 'text-embedding-ada-002',
    maxChunkSize: 1000,
    chunkOverlap: 100,
  },

  perception: {
    searchProvider: 'duckduckgo',
    enableWebScraping: false,
    enableSearch: true,
    defaultSource: 'search',
    maxResults: 10,
    webScraper: {
      headless: true,
      timeout: 30000,
      retries: 3,
      userAgent: 'Mozilla/5.0 (compatible; WeaverBot/1.0)',
    },
  },

  learning: {
    enabled: true,
    feedbackThreshold: 0.7,
    enablePerception: true,
    enableReasoning: true,
    enableMemory: true,
    enableExecution: true,
    autoAdaptation: true,
    minExecutions: 5,
    adaptationThreshold: 0.7,
    maxStrategies: 10,
  },

  git: {
    autoCommit: true,
    authorName: 'Weaver',
    authorEmail: 'weaver@weave-nn.local',
    commitDebounceMs: 300000, // 5 minutes
  },

  vault: {
    path: join(homedir(), 'Documents', 'weave-nn'),
    fileWatcher: {
      enabled: true,
      debounce: 1000,
      ignore: ['.obsidian', '.git', 'node_modules', '.archive'],
    },
  },

  obsidian: {
    apiUrl: 'https://localhost:27124',
  },

  ai: {
    provider: 'vercel-gateway',
    defaultModel: 'claude-3-5-sonnet-20241022',
  },

  features: {
    aiEnabled: true,
    temporalEnabled: false,
    graphAnalytics: false,
    mcpEnabled: true,
    mcpTransport: 'stdio',
  },
};

/**
 * Configuration file paths to search (in order of precedence)
 */
export const CONFIG_FILE_PATHS = [
  '.weaverrc.json',
  '.weaverrc.yaml',
  '.weaverrc.yml',
  'weaver.config.json',
  'weaver.config.yaml',
  'weaver.config.yml',
];

/**
 * User-level configuration directory
 */
export const USER_CONFIG_DIR = join(homedir(), '.weaver');

/**
 * User-level configuration file
 */
export const USER_CONFIG_FILE = join(USER_CONFIG_DIR, 'config.json');
