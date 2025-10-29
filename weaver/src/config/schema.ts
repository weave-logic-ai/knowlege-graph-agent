/**
 * Configuration Schema
 *
 * Defines TypeScript types and JSON schema for Weaver configuration.
 * Supports validation, type safety, and documentation.
 */

import type { JSONSchemaType } from 'ajv';

/**
 * Complete Weaver configuration structure
 */
export interface WeaverConfig {
  version: string;
  server: ServerConfig;
  database: DatabaseConfig;
  workflows: WorkflowsConfig;
  embeddings: EmbeddingsConfig;
  perception: PerceptionConfig;
  learning: LearningConfig;
  git: GitConfig;
  vault: VaultConfig;
  obsidian: ObsidianConfig;
  ai: AIConfig;
  features: FeatureFlags;
}

export interface ServerConfig {
  port: number;
  host: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  nodeEnv: 'development' | 'production' | 'test';
}

export interface DatabaseConfig {
  path: string;
  backupDir: string;
  autoBackup: boolean;
  syncInterval: number;
}

export interface WorkflowsConfig {
  enabled: boolean;
  dbPath: string;
  maxConcurrency: number;
  timeout: number;
}

export interface EmbeddingsConfig {
  provider: 'openai' | 'xenova';
  model: string;
  apiKey?: string;
  maxChunkSize: number;
  chunkOverlap: number;
}

export interface PerceptionConfig {
  searchProvider: 'brave' | 'google' | 'duckduckgo' | 'bing';
  apiKey?: string;
  googleApiKey?: string;
  googleCseId?: string;
  bingApiKey?: string;
  enableWebScraping: boolean;
  enableSearch: boolean;
  defaultSource: 'search' | 'scrape';
  maxResults: number;
  webScraper: {
    headless: boolean;
    timeout: number;
    retries: number;
    userAgent: string;
  };
}

export interface LearningConfig {
  enabled: boolean;
  feedbackThreshold: number;
  enablePerception: boolean;
  enableReasoning: boolean;
  enableMemory: boolean;
  enableExecution: boolean;
  autoAdaptation: boolean;
  minExecutions: number;
  adaptationThreshold: number;
  maxStrategies: number;
}

export interface GitConfig {
  autoCommit: boolean;
  authorName: string;
  authorEmail: string;
  commitDebounceMs: number;
}

export interface VaultConfig {
  path: string;
  fileWatcher: {
    enabled: boolean;
    debounce: number;
    ignore: string[];
  };
}

export interface ObsidianConfig {
  apiUrl: string;
  apiKey?: string;
}

export interface AIConfig {
  provider: 'vercel-gateway' | 'anthropic';
  vercelApiKey?: string;
  anthropicApiKey?: string;
  defaultModel: string;
}

export interface FeatureFlags {
  aiEnabled: boolean;
  temporalEnabled: boolean;
  graphAnalytics: boolean;
  mcpEnabled: boolean;
  mcpTransport: 'stdio' | 'http';
}

/**
 * JSON Schema for configuration validation
 */
export const configSchema = {
  type: 'object',
  properties: {
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    server: {
      type: 'object',
      properties: {
        port: { type: 'integer', minimum: 1, maximum: 65535 },
        host: { type: 'string' },
        logLevel: { type: 'string', enum: ['debug', 'info', 'warn', 'error'] },
        nodeEnv: { type: 'string', enum: ['development', 'production', 'test'] },
      },
      required: ['port', 'host', 'logLevel', 'nodeEnv'],
      additionalProperties: false,
    },
    database: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        backupDir: { type: 'string' },
        autoBackup: { type: 'boolean' },
        syncInterval: { type: 'integer', minimum: 0 },
      },
      required: ['path', 'backupDir', 'autoBackup', 'syncInterval'],
      additionalProperties: false,
    },
    workflows: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        dbPath: { type: 'string' },
        maxConcurrency: { type: 'integer', minimum: 1 },
        timeout: { type: 'integer', minimum: 0 },
      },
      required: ['enabled', 'dbPath', 'maxConcurrency', 'timeout'],
      additionalProperties: false,
    },
    embeddings: {
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['openai', 'xenova'] },
        model: { type: 'string' },
        apiKey: { type: 'string', nullable: true },
        maxChunkSize: { type: 'integer', minimum: 100 },
        chunkOverlap: { type: 'integer', minimum: 0 },
      },
      required: ['provider', 'model', 'maxChunkSize', 'chunkOverlap'],
      additionalProperties: false,
    },
    perception: {
      type: 'object',
      properties: {
        searchProvider: { type: 'string', enum: ['brave', 'google', 'duckduckgo', 'bing'] },
        apiKey: { type: 'string', nullable: true },
        googleApiKey: { type: 'string', nullable: true },
        googleCseId: { type: 'string', nullable: true },
        bingApiKey: { type: 'string', nullable: true },
        enableWebScraping: { type: 'boolean' },
        enableSearch: { type: 'boolean' },
        defaultSource: { type: 'string', enum: ['search', 'scrape'] },
        maxResults: { type: 'integer', minimum: 1 },
        webScraper: {
          type: 'object',
          properties: {
            headless: { type: 'boolean' },
            timeout: { type: 'integer', minimum: 1000 },
            retries: { type: 'integer', minimum: 0 },
            userAgent: { type: 'string' },
          },
          required: ['headless', 'timeout', 'retries', 'userAgent'],
          additionalProperties: false,
        },
      },
      required: ['searchProvider', 'enableWebScraping', 'enableSearch', 'defaultSource', 'maxResults', 'webScraper'],
      additionalProperties: false,
    },
    learning: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        feedbackThreshold: { type: 'number', minimum: 0, maximum: 1 },
        enablePerception: { type: 'boolean' },
        enableReasoning: { type: 'boolean' },
        enableMemory: { type: 'boolean' },
        enableExecution: { type: 'boolean' },
        autoAdaptation: { type: 'boolean' },
        minExecutions: { type: 'integer', minimum: 1 },
        adaptationThreshold: { type: 'number', minimum: 0, maximum: 1 },
        maxStrategies: { type: 'integer', minimum: 1 },
      },
      required: ['enabled', 'feedbackThreshold', 'enablePerception', 'enableReasoning', 'enableMemory', 'enableExecution', 'autoAdaptation', 'minExecutions', 'adaptationThreshold', 'maxStrategies'],
      additionalProperties: false,
    },
    git: {
      type: 'object',
      properties: {
        autoCommit: { type: 'boolean' },
        authorName: { type: 'string' },
        authorEmail: { type: 'string', format: 'email' },
        commitDebounceMs: { type: 'integer', minimum: 0 },
      },
      required: ['autoCommit', 'authorName', 'authorEmail', 'commitDebounceMs'],
      additionalProperties: false,
    },
    vault: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        fileWatcher: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            debounce: { type: 'integer', minimum: 0 },
            ignore: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['enabled', 'debounce', 'ignore'],
          additionalProperties: false,
        },
      },
      required: ['path', 'fileWatcher'],
      additionalProperties: false,
    },
    obsidian: {
      type: 'object',
      properties: {
        apiUrl: { type: 'string', format: 'uri' },
        apiKey: { type: 'string', nullable: true },
      },
      required: ['apiUrl'],
      additionalProperties: false,
    },
    ai: {
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['vercel-gateway', 'anthropic'] },
        vercelApiKey: { type: 'string', nullable: true },
        anthropicApiKey: { type: 'string', nullable: true },
        defaultModel: { type: 'string' },
      },
      required: ['provider', 'defaultModel'],
      additionalProperties: false,
    },
    features: {
      type: 'object',
      properties: {
        aiEnabled: { type: 'boolean' },
        temporalEnabled: { type: 'boolean' },
        graphAnalytics: { type: 'boolean' },
        mcpEnabled: { type: 'boolean' },
        mcpTransport: { type: 'string', enum: ['stdio', 'http'] },
      },
      required: ['aiEnabled', 'temporalEnabled', 'graphAnalytics', 'mcpEnabled', 'mcpTransport'],
      additionalProperties: false,
    },
  },
  required: ['version', 'server', 'database', 'workflows', 'embeddings', 'perception', 'learning', 'git', 'vault', 'obsidian', 'ai', 'features'],
  additionalProperties: false,
};

/**
 * List of sensitive configuration keys that should be masked in output
 */
export const SENSITIVE_KEYS = [
  'apiKey',
  'anthropicApiKey',
  'vercelApiKey',
  'googleApiKey',
  'bingApiKey',
  'password',
  'secret',
  'token',
] as const;

/**
 * Check if a key name indicates sensitive data
 */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.some(sensitiveKey =>
    key.toLowerCase().includes(sensitiveKey.toLowerCase())
  );
}

/**
 * Mask sensitive value for display
 */
export function maskSensitiveValue(value: string): string {
  if (!value || value.length < 4) return '***';
  return `${value.slice(0, 4)}${'*'.repeat(Math.min(value.length - 4, 20))}`;
}
