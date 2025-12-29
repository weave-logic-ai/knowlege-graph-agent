/**
 * Knowledge Graph Agent - Core Types
 *
 * Type definitions for the knowledge graph system.
 */

import { z } from 'zod';

// ============================================================================
// Node Types
// ============================================================================

export type NodeType =
  | 'concept'      // Abstract concepts and ideas
  | 'technical'    // Technical components and implementations
  | 'feature'      // Product features and capabilities
  | 'primitive'    // Base technology primitives (frameworks, libraries)
  | 'service'      // Backend services and APIs
  | 'guide'        // How-to guides and tutorials
  | 'standard'     // Coding standards and conventions
  | 'integration'; // External integrations

export type NodeStatus = 'draft' | 'active' | 'deprecated' | 'archived';

export interface NodeLink {
  target: string;           // Target node filename or path
  type: 'wikilink' | 'markdown' | 'backlink';
  text?: string;            // Display text for the link
  context?: string;         // Context in which link appears
}

export interface NodeFrontmatter {
  title?: string;
  type?: NodeType;
  status?: NodeStatus;
  tags?: string[];
  category?: string;
  description?: string;
  created?: string;
  updated?: string;
  aliases?: string[];
  related?: string[];
  [key: string]: unknown;
}

export interface KnowledgeNode {
  id: string;
  path: string;
  filename: string;
  title: string;
  type: NodeType;
  status: NodeStatus;
  content: string;
  frontmatter: NodeFrontmatter;
  tags: string[];
  outgoingLinks: NodeLink[];
  incomingLinks: NodeLink[];
  wordCount: number;
  lastModified: Date;
}

// ============================================================================
// Graph Types
// ============================================================================

export interface GraphEdge {
  source: string;  // Source node ID
  target: string;  // Target node ID
  type: 'link' | 'reference' | 'parent' | 'related';
  weight: number;  // Relationship strength 0-1
  context?: string;
}

export interface KnowledgeGraph {
  nodes: Map<string, KnowledgeNode>;
  edges: GraphEdge[];
  metadata: GraphMetadata;
}

export interface GraphMetadata {
  name: string;
  version: string;
  created: string;
  updated: string;
  nodeCount: number;
  edgeCount: number;
  rootPath: string;
}

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<NodeType, number>;
  nodesByStatus: Record<NodeStatus, number>;
  orphanNodes: number;
  avgLinksPerNode: number;
  mostConnected: Array<{ id: string; connections: number }>;
}

// ============================================================================
// Configuration Types
// ============================================================================

export const ConfigSchema = z.object({
  // Project settings
  projectRoot: z.string().default('.'),
  docsRoot: z.string().default('./docs'),
  vaultName: z.string().optional(),

  // Graph settings
  graph: z.object({
    includePatterns: z.array(z.string()).default(['**/*.md']),
    excludePatterns: z.array(z.string()).default([
      'node_modules/**',
      'dist/**',
      '.git/**',
    ]),
    maxDepth: z.number().default(10),
  }).default({}),

  // Database settings
  database: z.object({
    path: z.string().default('./.kg/knowledge.db'),
    enableWAL: z.boolean().default(true),
  }).default({}),

  // Claude-Flow integration
  claudeFlow: z.object({
    enabled: z.boolean().default(true),
    namespace: z.string().default('knowledge-graph'),
    syncOnChange: z.boolean().default(true),
  }).default({}),

  // Templates
  templates: z.object({
    customPath: z.string().optional(),
    defaultType: z.enum(['concept', 'technical', 'feature', 'primitive', 'service', 'guide', 'standard', 'integration']).default('concept'),
  }).default({}),
});

export type KGConfig = z.infer<typeof ConfigSchema>;

// ============================================================================
// Generator Types
// ============================================================================

export interface GeneratorOptions {
  projectRoot: string;
  outputPath: string;
  includeExamples?: boolean;
  force?: boolean;
}

export interface GeneratedDocument {
  path: string;
  title: string;
  type: NodeType;
  content: string;
  frontmatter: NodeFrontmatter;
}

export interface DocsInitOptions {
  projectRoot: string;
  docsPath?: string;
  template?: string;
  includeExamples?: boolean;
  detectFramework?: boolean;
}

export interface DocsInitResult {
  success: boolean;
  docsPath: string;
  filesCreated: string[];
  errors: string[];
}

// ============================================================================
// Claude-Flow Integration Types
// ============================================================================

export interface MemoryEntry {
  key: string;
  value: unknown;
  namespace?: string;
  ttl?: number;
  metadata?: Record<string, unknown>;
}

export interface SyncResult {
  synced: number;
  failed: number;
  errors: Array<{ key: string; error: string }>;
}

// ============================================================================
// CLAUDE.md Template Types
// ============================================================================

export interface ClaudeMdSection {
  title: string;
  content: string;
  order: number;
}

export interface ClaudeMdTemplate {
  name: string;
  description: string;
  sections: ClaudeMdSection[];
  variables: Record<string, string>;
}

export interface ClaudeMdGeneratorOptions {
  projectRoot: string;
  outputPath?: string;
  template?: string;
  includeKnowledgeGraph?: boolean;
  includeClaudeFlow?: boolean;
  customSections?: ClaudeMdSection[];
}
