/**
 * Knowledge Graph Agent - Configuration Types
 * @module @weave-nn/knowledge-graph-agent/config
 */

import type { NodeType, Priority } from './core';
import type { ScanOptions } from './obsidian';
import type { MemoryConfig } from './memory';
import type { GenerateOptions as ClaudeMdGenerateOptions } from './claude-md';

// =============================================================================
// Main Configuration
// =============================================================================

/**
 * Main configuration schema for knowledge-graph-agent
 */
export interface KnowledgeGraphConfig {
  /** Configuration schema version */
  $schema?: string;

  /** Project configuration */
  project: ProjectConfig;

  /** Graph engine configuration */
  graph: GraphConfig;

  /** Obsidian/vault configuration */
  obsidian: ObsidianConfig;

  /** CLAUDE.md configuration */
  claudeMd: ClaudeMdConfig;

  /** Memory/sync configuration */
  memory: MemoryIntegrationConfig;

  /** Hooks configuration */
  hooks: HooksConfig;

  /** Output configuration */
  output: OutputConfig;
}

// =============================================================================
// Project Configuration
// =============================================================================

/**
 * Project configuration
 */
export interface ProjectConfig {
  /** Project name */
  name: string;

  /** Project version */
  version?: string;

  /** Project type (auto-detected or manual) */
  type?: string;

  /** Project description */
  description?: string;

  /** Root path (defaults to config file location) */
  rootPath?: string;
}

// =============================================================================
// Graph Configuration
// =============================================================================

/**
 * Graph engine configuration
 */
export interface GraphConfig {
  /** File patterns to include */
  include: string[];

  /** File patterns to exclude */
  exclude: string[];

  /** Node classification configuration */
  classification: ClassificationConfig;

  /** Link detection configuration */
  links: LinkConfig;

  /** Metrics configuration */
  metrics: MetricsConfig;

  /** Cache configuration */
  cache: GraphCacheConfig;
}

/**
 * Node classification configuration
 */
export interface ClassificationConfig {
  /** Classification rules (evaluated in order) */
  rules: ClassificationRule[];

  /** Default type for unclassified nodes */
  default: NodeType;

  /** Use frontmatter type if available */
  useFrontmatterType: boolean;
}

/**
 * Classification rule
 */
export interface ClassificationRule {
  /** Glob pattern to match */
  pattern: string;

  /** Node type to assign */
  type: NodeType;

  /** Priority if multiple rules match (higher = precedence) */
  priority?: number;

  /** Additional conditions */
  conditions?: {
    /** Frontmatter field must exist */
    hasField?: string;
    /** Frontmatter field must have value */
    fieldEquals?: { field: string; value: unknown };
    /** File must have tag */
    hasTag?: string;
  };
}

/**
 * Link detection configuration
 */
export interface LinkConfig {
  /** Detect wikilinks [[...]] */
  wikilinks: boolean;

  /** Detect markdown links [...](url) */
  markdownLinks: boolean;

  /** Detect implicit references (mentions without link syntax) */
  implicitReferences: boolean;

  /** Create edges from shared tags */
  tagConnections: boolean;

  /** Minimum tag overlap for tag connections */
  tagConnectionThreshold?: number;

  /** Create edges from semantic similarity */
  semanticConnections?: boolean;

  /** Minimum similarity for semantic connections (0-1) */
  semanticThreshold?: number;
}

/**
 * Metrics configuration
 */
export interface MetricsConfig {
  /** Calculate clustering coefficient */
  clusteringCoefficient: boolean;

  /** Calculate PageRank */
  pageRank: boolean;

  /** PageRank damping factor */
  pageRankDamping?: number;

  /** PageRank iterations */
  pageRankIterations?: number;

  /** Hub detection threshold (minimum inbound links) */
  hubThreshold: number;

  /** Orphan detection (nodes with 0 connections) */
  detectOrphans: boolean;

  /** Weak connection threshold */
  weakConnectionThreshold: number;

  /** Strong connection threshold */
  strongConnectionThreshold: number;
}

/**
 * Graph cache configuration
 */
export interface GraphCacheConfig {
  /** Enable caching */
  enabled: boolean;

  /** Cache directory */
  directory: string;

  /** Cache TTL in seconds */
  ttl: number;

  /** Maximum cache size in bytes */
  maxSize: number;

  /** Persist cache across sessions */
  persistent: boolean;
}

// =============================================================================
// Obsidian Configuration
// =============================================================================

/**
 * Obsidian/vault configuration
 */
export interface ObsidianConfig {
  /** Enable Obsidian integration */
  enabled: boolean;

  /** Vault path (relative to project root or absolute) */
  vaultPath: string;

  /** Frontmatter configuration */
  frontmatter: FrontmatterConfig;

  /** Tag configuration */
  tags: TagConfig;

  /** File watching configuration */
  watch: WatchConfig;

  /** Scan options */
  scan?: ScanOptions;
}

/**
 * Frontmatter configuration
 */
export interface FrontmatterConfig {
  /** Required frontmatter fields */
  required: string[];

  /** Default values for missing fields */
  defaults: Record<string, unknown>;

  /** Validate frontmatter on parse */
  validate: boolean;

  /** Auto-update timestamps */
  autoUpdateTimestamps: boolean;

  /** Custom field validators */
  validators?: Record<string, string>; // field -> regex pattern
}

/**
 * Tag configuration
 */
export interface TagConfig {
  /** Case-sensitive tag matching */
  caseSensitive: boolean;

  /** Normalize tags (lowercase, trim) */
  normalize: boolean;

  /** Normalize function ('lowercase' | 'uppercase' | 'capitalize') */
  normalizeFunction?: 'lowercase' | 'uppercase' | 'capitalize';

  /** Flatten nested tags (parent/child -> [parent, child]) */
  flattenNested: boolean;

  /** Minimum tag length */
  minLength?: number;

  /** Maximum tag length */
  maxLength?: number;

  /** Blocked tags (will be ignored) */
  blocked?: string[];
}

/**
 * Watch configuration
 */
export interface WatchConfig {
  /** Enable file watching */
  enabled: boolean;

  /** Debounce delay in milliseconds */
  debounce: number;

  /** Patterns to watch */
  patterns: string[];

  /** Patterns to ignore */
  ignored: string[];

  /** Use polling instead of native events */
  usePolling: boolean;

  /** Polling interval if usePolling is true */
  pollingInterval?: number;
}

// =============================================================================
// CLAUDE.md Configuration
// =============================================================================

/**
 * CLAUDE.md configuration
 */
export interface ClaudeMdConfig {
  /** Enable CLAUDE.md generation */
  enabled: boolean;

  /** Output path for CLAUDE.md */
  path: string;

  /** Auto-generate on init */
  autoGenerate: boolean;

  /** Merge with global CLAUDE.md */
  mergeGlobal: boolean;

  /** Path to global CLAUDE.md */
  globalPath?: string;

  /** Template to use */
  template: string;

  /** Section configuration */
  sections: ClaudeMdSections;

  /** Generation options */
  options?: Partial<ClaudeMdGenerateOptions>;
}

/**
 * CLAUDE.md section toggles
 */
export interface ClaudeMdSections {
  /** Include header section */
  header: boolean;

  /** Include commands section */
  commands: boolean;

  /** Include code style section */
  codeStyle: boolean;

  /** Include rules section */
  rules: boolean;

  /** Include integrations section */
  integrations: boolean;

  /** Include environment section */
  environment: boolean;
}

// =============================================================================
// Memory Configuration
// =============================================================================

/**
 * Memory integration configuration
 */
export interface MemoryIntegrationConfig {
  /** Enable memory integration */
  enabled: boolean;

  /** Memory namespace */
  namespace: string;

  /** Sync configuration */
  sync: SyncConfig;

  /** Cache configuration */
  cache: MemoryCacheConfig;

  /** Base memory config */
  client?: Partial<MemoryConfig>;
}

/**
 * Sync configuration
 */
export interface SyncConfig {
  /** Enable automatic sync */
  auto: boolean;

  /** Auto-sync interval in milliseconds */
  interval: number;

  /** Sync on file modification */
  onModify: boolean;

  /** Sync on graph build */
  onBuild: boolean;

  /** Conflict resolution strategy */
  conflictResolution: 'local-wins' | 'remote-wins' | 'newest-wins' | 'manual';
}

/**
 * Memory cache configuration
 */
export interface MemoryCacheConfig {
  /** Enable local cache */
  enabled: boolean;

  /** Cache TTL in seconds */
  ttl: number;

  /** Maximum cache entries */
  maxEntries: number;
}

// =============================================================================
// Hooks Configuration
// =============================================================================

/**
 * Hooks configuration
 */
export interface HooksConfig {
  /** Enable hooks system */
  enabled: boolean;

  /** External hooks config file path */
  configPath?: string;

  /** Hook definitions */
  hooks: HookDefinition[];
}

/**
 * Hook definition
 */
export interface HookDefinition {
  /** Hook trigger event */
  event: HookEvent;

  /** Actions to execute */
  actions: HookAction[];

  /** Hook priority (lower = earlier) */
  priority?: number;

  /** Condition for hook execution */
  condition?: string;
}

/**
 * Hook events
 */
export type HookEvent =
  | 'pre-graph-build'
  | 'post-graph-build'
  | 'pre-node-add'
  | 'post-node-add'
  | 'pre-node-update'
  | 'post-node-update'
  | 'pre-node-remove'
  | 'post-node-remove'
  | 'pre-sync'
  | 'post-sync'
  | 'on-orphan-detected'
  | 'on-conflict'
  | 'on-error';

/**
 * Hook action
 */
export interface HookAction {
  /** Action type */
  type: 'sync' | 'report' | 'notify' | 'backup' | 'validate' | 'custom';

  /** Action-specific configuration */
  config?: Record<string, unknown>;
}

// =============================================================================
// Output Configuration
// =============================================================================

/**
 * Output configuration
 */
export interface OutputConfig {
  /** Reports directory */
  reportsDir: string;

  /** Cache directory */
  cacheDir: string;

  /** Default output format */
  format: 'json' | 'markdown' | 'yaml';

  /** Pretty print output */
  pretty: boolean;

  /** Include timestamps in output */
  timestamps: boolean;

  /** Include metrics in reports */
  includeMetrics: boolean;
}

// =============================================================================
// Configuration Defaults
// =============================================================================

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: KnowledgeGraphConfig = {
  project: {
    name: 'unknown',
  },
  graph: {
    include: ['**/*.md'],
    exclude: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
    classification: {
      rules: [
        { pattern: 'docs/adr/**', type: 'adr' },
        { pattern: 'docs/architecture/**', type: 'architecture' },
        { pattern: 'docs/guides/**', type: 'guide' },
        { pattern: 'docs/api/**', type: 'reference' },
      ],
      default: 'unknown',
      useFrontmatterType: true,
    },
    links: {
      wikilinks: true,
      markdownLinks: true,
      implicitReferences: false,
      tagConnections: false,
    },
    metrics: {
      clusteringCoefficient: true,
      pageRank: false,
      hubThreshold: 10,
      detectOrphans: true,
      weakConnectionThreshold: 2,
      strongConnectionThreshold: 5,
    },
    cache: {
      enabled: true,
      directory: '.kg/cache',
      ttl: 3600,
      maxSize: 100 * 1024 * 1024, // 100MB
      persistent: true,
    },
  },
  obsidian: {
    enabled: true,
    vaultPath: '.',
    frontmatter: {
      required: ['title'],
      defaults: {
        status: 'draft',
      },
      validate: true,
      autoUpdateTimestamps: true,
    },
    tags: {
      caseSensitive: false,
      normalize: true,
      normalizeFunction: 'lowercase',
      flattenNested: false,
    },
    watch: {
      enabled: false,
      debounce: 300,
      patterns: ['**/*.md'],
      ignored: ['node_modules/**', '.git/**'],
      usePolling: false,
    },
  },
  claudeMd: {
    enabled: true,
    path: 'CLAUDE.md',
    autoGenerate: true,
    mergeGlobal: true,
    template: 'default',
    sections: {
      header: true,
      commands: true,
      codeStyle: true,
      rules: true,
      integrations: true,
      environment: false,
    },
  },
  memory: {
    enabled: true,
    namespace: 'kg-graph',
    sync: {
      auto: false,
      interval: 300000,
      onModify: true,
      onBuild: true,
      conflictResolution: 'newest-wins',
    },
    cache: {
      enabled: true,
      ttl: 3600,
      maxEntries: 1000,
    },
  },
  hooks: {
    enabled: true,
    hooks: [],
  },
  output: {
    reportsDir: '.kg/reports',
    cacheDir: '.kg/cache',
    format: 'markdown',
    pretty: true,
    timestamps: true,
    includeMetrics: true,
  },
};

// =============================================================================
// Configuration File Names
// =============================================================================

/**
 * Supported configuration file names (in order of precedence)
 */
export const CONFIG_FILE_NAMES = [
  'kg.config.yaml',
  'kg.config.yml',
  'kg.config.json',
  'kg.config.js',
  'kg.config.ts',
  '.kgrc',
  '.kgrc.yaml',
  '.kgrc.yml',
  '.kgrc.json',
];

/**
 * Package.json field name for config
 */
export const PACKAGE_JSON_FIELD = 'kg';
