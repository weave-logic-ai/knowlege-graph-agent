/**
 * Vault Initialization Types
 *
 * Shared type definitions for vault initialization system.
 */

/**
 * Node type classification
 */
export type NodeType = 'concept' | 'technical' | 'feature';

/**
 * Generated vault node
 */
export interface GeneratedNode {
  id: string;
  title: string;
  type: NodeType;
  filename: string;
  content: string;
  tags?: string[];
  links?: Array<{
    target: string;
    type: 'wikilink' | 'markdown';
    text?: string;
  }>;
  frontmatter?: Record<string, unknown>;
}

/**
 * Vault initialization configuration
 */
export interface VaultConfig {
  name: string;
  description?: string;
  outputPath: string;
  nodeCount?: number;
  includeExamples?: boolean;
}

/**
 * Vault metadata
 */
export interface VaultMetadata {
  name: string;
  version: string;
  createdAt: string;
  nodeCount: number;
  lastUpdated: string;
}
