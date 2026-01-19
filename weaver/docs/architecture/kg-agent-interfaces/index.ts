/**
 * Knowledge Graph Agent - Type Exports
 * @module @weave-nn/knowledge-graph-agent/types
 *
 * This module exports all TypeScript interfaces for the knowledge-graph-agent library.
 * These types define the complete API surface for:
 * - Knowledge Graph Engine
 * - Obsidian Vault Integration
 * - CLAUDE.md Generator
 * - Claude-Flow Memory Sync
 * - Configuration System
 */

// =============================================================================
// Core Types
// =============================================================================
export type {
  // Node types
  NodeType,
  DocumentStatus,
  Priority,
  DocumentFrontmatter,
  GraphNode,

  // Edge types
  LinkType,
  GraphEdge,

  // Metrics types
  HubInfo,
  GraphMetrics,

  // Traversal types
  TraversalAlgorithm,
  TraversalOptions,
  TraversalResult,
  Cluster,

  // Suggestion types
  SuggestionReason,
  ConnectionSuggestion,

  // Query types
  NodeQuery,
  EdgeQuery,

  // Event types
  GraphEventType,
  GraphEvent,
  GraphEventListener,

  // Export types
  ExportFormat,
  ExportOptions,
  ExportResult,
} from './core';

// =============================================================================
// Obsidian Types
// =============================================================================
export type {
  // File types
  VaultFile,
  VaultConfig,
  VaultMetadata,

  // Parsing types
  WikiLink,
  MarkdownLink,
  Tag,
  Heading,
  CodeBlock,
  ContentPosition,
  ParsedDocument,
  ParseWarning,

  // Resolution types
  LinkResolution,
  LinkResolutionOptions,

  // Operation types
  WriteOptions,
  ScanOptions,
  ScanResult,
  ScanError,

  // Watch types
  WatchEventType,
  WatchEvent,
  WatchListener,

  // Detection types
  VaultDetectionResult,

  // Frontmatter types
  FrontmatterUpdate,
  FrontmatterValidation,
  FrontmatterValidationError,
} from './obsidian';

// =============================================================================
// CLAUDE.md Types
// =============================================================================
export type {
  // Project types
  ProjectType,
  Framework,
  ProjectDetectionResult,

  // Content types
  ClaudeMdContent,
  HeaderSection,
  CommandsSection,
  CommandInfo,
  CodeStyleSection,
  FormattingConfig,
  NamingConventions,
  RulesSection,
  Rule,
  IntegrationsSection,
  ClaudeFlowIntegration,
  GitIntegration,
  CICDIntegration,
  EnvironmentSection,
  EnvironmentVariable,
  CustomSection,
  ClaudeMdMetadata,

  // Options types
  GenerateOptions,
  UpdateOptions,
  MergeOptions,

  // Validation types
  ValidationResult,
  ValidationError,

  // Template types
  Template,
  TemplateContext,
} from './claude-md';

// =============================================================================
// Memory Types
// =============================================================================
export type {
  // Configuration types
  MemoryConfig,

  // Operation types
  MemoryAction,
  MemoryEntry,
  MemoryRetrieveResult,
  BatchResult,
  MemorySearchResult,

  // Namespace types
  NamespaceInfo,
  NamespaceOperations,

  // Sync types
  SyncDirection,
  SyncStatus,
  SyncOptions,
  SyncProgress,
  SyncResult,
  SyncError,

  // Conflict types
  ConflictResolution,
  ConflictInfo,
  ConflictResolver,

  // Snapshot types
  GraphSnapshot,
  SnapshotMetadata,
  SnapshotDiff,

  // Cache types
  CacheEntry,
  CacheStats,

  // Client interfaces
  IMemoryClient,
  IGraphMemoryClient,
} from './memory';

// Re-export memory defaults
export { DEFAULT_MEMORY_CONFIG } from './memory';

// =============================================================================
// Configuration Types
// =============================================================================
export type {
  // Main config
  KnowledgeGraphConfig,
  ProjectConfig,

  // Graph config
  GraphConfig,
  ClassificationConfig,
  ClassificationRule,
  LinkConfig,
  MetricsConfig,
  GraphCacheConfig,

  // Obsidian config
  ObsidianConfig,
  FrontmatterConfig,
  TagConfig,
  WatchConfig,

  // CLAUDE.md config
  ClaudeMdConfig,
  ClaudeMdSections,

  // Memory config
  MemoryIntegrationConfig,
  SyncConfig,
  MemoryCacheConfig,

  // Hooks config
  HooksConfig,
  HookDefinition,
  HookEvent,
  HookAction,

  // Output config
  OutputConfig,
} from './config';

// Re-export config defaults
export { DEFAULT_CONFIG, CONFIG_FILE_NAMES, PACKAGE_JSON_FIELD } from './config';

// =============================================================================
// Version Information
// =============================================================================

/**
 * Type definitions version
 */
export const TYPES_VERSION = '1.0.0';

/**
 * Minimum compatible library version
 */
export const MIN_LIBRARY_VERSION = '1.0.0';
