/**
 * Cultivation System - Type Definitions
 *
 * Types for the seed generator and cultivation system that analyzes
 * codebases and generates knowledge graph primitives.
 *
 * @module cultivation/types
 */

import type { NodeType, NodeFrontmatter } from '../core/types.js';

// ============================================================================
// Vault Context Types
// ============================================================================

/**
 * Context about the vault/docs structure
 */
export interface VaultContext {
  /** Content of primitives.md - foundational concepts */
  primitives?: string;
  /** Content of features.md - current feature set */
  features?: string;
  /** Content of tech-specs.md - technical specifications */
  techSpecs?: string;
  /** Vault/docs root directory */
  vaultRoot: string;
  /** All markdown files in vault */
  allFiles: string[];
}

// ============================================================================
// Dependency Analysis Types
// ============================================================================

/**
 * Supported programming language ecosystems
 */
export type Ecosystem =
  | 'nodejs'
  | 'python'
  | 'php'
  | 'rust'
  | 'go'
  | 'java'
  | 'ruby'
  | 'dotnet'
  | 'other';

/**
 * Dependency classification type
 */
export type DependencyType =
  | 'framework'
  | 'library'
  | 'tool'
  | 'service'
  | 'language'
  | 'runtime';

/**
 * Information about a detected dependency
 */
export interface DependencyInfo {
  /** Package/library name */
  name: string;
  /** Version string */
  version: string;
  /** Classification type */
  type: DependencyType;
  /** Category in knowledge graph (maps to PRIMITIVES.md structure) */
  category: string;
  /** Package ecosystem (nodejs, python, etc.) */
  ecosystem: Ecosystem;
  /** Optional description */
  description?: string;
  /** Documentation URLs */
  documentation?: string[];
  /** Repository URL */
  repository?: string;
  /** Files/docs that use this dependency */
  usedBy: string[];
  /** Related dependencies */
  relatedTo: string[];
  /** Is this a dev dependency? */
  isDev?: boolean;
}

// ============================================================================
// Service Analysis Types
// ============================================================================

/**
 * Service type classification
 */
export type ServiceType =
  | 'api'
  | 'database'
  | 'queue'
  | 'cache'
  | 'storage'
  | 'compute'
  | 'monitoring'
  | 'auth'
  | 'search'
  | 'ml';

/**
 * Information about a detected service
 */
export interface ServiceInfo {
  /** Service name */
  name: string;
  /** Service type */
  type: ServiceType;
  /** Technology used (postgres, redis, etc.) */
  technology: string;
  /** Framework if applicable */
  framework?: string;
  /** Programming language */
  language?: string;
  /** Service dependencies */
  dependencies: string[];
  /** API endpoints if detected */
  endpoints?: string[];
  /** Port mappings */
  ports?: number[];
  /** Environment variables */
  envVars?: string[];
}

// ============================================================================
// Seed Analysis Result
// ============================================================================

/**
 * Complete seed analysis result from codebase
 */
export interface SeedAnalysis {
  /** All detected dependencies */
  dependencies: DependencyInfo[];
  /** Detected services */
  services: ServiceInfo[];
  /** Framework dependencies (subset of dependencies) */
  frameworks: DependencyInfo[];
  /** Programming languages used */
  languages: string[];
  /** Deployment configurations found */
  deployments: string[];
  /** Existing concepts from vault */
  existingConcepts: string[];
  /** Existing features from vault */
  existingFeatures: string[];
  /** Analysis metadata */
  metadata: {
    analyzedAt: string;
    projectRoot: string;
    filesScanned: number;
    duration: number;
  };
}

// ============================================================================
// Generated Document Types
// ============================================================================

/**
 * Document metadata for generated files
 */
export interface DocumentMetadata extends NodeFrontmatter {
  /** Ecosystem/language */
  ecosystem?: Ecosystem;
  /** Version of the dependency */
  version?: string;
  /** Service type if applicable */
  service_type?: ServiceType;
  /** Technology used */
  technology?: string;
  /** Documentation links */
  documentation?: string[];
  /** Repository URL */
  repository?: string;
  /** Files using this primitive */
  used_by?: string[];
}

/**
 * Generated document from seed analysis
 */
export interface GeneratedDocument {
  /** Document type */
  type: NodeType | string;
  /** Output file path */
  path: string;
  /** Document title */
  title: string;
  /** Markdown content */
  content: string;
  /** Frontmatter metadata */
  frontmatter: DocumentMetadata;
  /** Backlinks to include */
  backlinks: string[];
}

// ============================================================================
// Cultivation Report Types
// ============================================================================

/**
 * Report from cultivation process
 */
export interface CultivationReport {
  /** Files processed */
  filesProcessed: number;
  /** Frontmatter entries added */
  frontmatterAdded: number;
  /** Documents generated */
  documentsGenerated: number;
  /** Footers updated */
  footersUpdated: number;
  /** Warnings encountered */
  warnings: string[];
  /** Errors encountered */
  errors: string[];
  /** Generated document details */
  generatedDocuments: GeneratedDocument[];
  /** Processing time in ms */
  processingTime: number;
}

/**
 * Options for cultivation process
 */
export interface CultivationOptions {
  /** Project root path */
  projectRoot: string;
  /** Docs/vault path */
  docsPath: string;
  /** Output path for generated files */
  outputPath?: string;
  /** Only analyze, don't generate */
  dryRun?: boolean;
  /** Verbose output */
  verbose?: boolean;
  /** Filter to specific ecosystems */
  ecosystems?: Ecosystem[];
  /** Minimum dependency importance to include */
  minImportance?: 'all' | 'major' | 'framework';
  /** Include dev dependencies */
  includeDev?: boolean;
}

// ============================================================================
// Gap Analysis Types
// ============================================================================

/**
 * Analysis of missing documentation/nodes
 */
export interface GapAnalysis {
  /** Missing concept documentation */
  missingConcepts: string[];
  /** Missing feature documentation */
  missingFeatures: string[];
  /** Missing architecture documentation */
  missingArchitecture: string[];
  /** Missing integration documentation */
  missingIntegrations: string[];
  /** Areas needing improvement */
  improvementAreas: string[];
  /** Items needing replacement */
  replacementNeeded: Array<{
    area: string;
    current: string;
    reason: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

// ============================================================================
// Init Primitives Types
// ============================================================================

/**
 * Result of init-primitives command
 */
export interface InitPrimitivesResult {
  /** Operation success */
  success: boolean;
  /** Seed analysis performed */
  analysis: SeedAnalysis;
  /** Documents generated */
  documentsGenerated: GeneratedDocument[];
  /** Directories created */
  directoriesCreated: string[];
  /** Errors encountered */
  errors: string[];
  /** Warnings */
  warnings: string[];
}
