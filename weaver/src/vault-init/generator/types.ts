import { z } from 'zod';
// @ts-expect-error - VaultTemplate imported for type reference but not directly used in this file
import type { VaultTemplate } from '../templates/types';

/**
 * Core types for node generation
 */

export const NodeTypeSchema = z.enum(['concept', 'technical', 'feature']);
export type NodeType = z.infer<typeof NodeTypeSchema>;

/**
 * Input data for generating a node
 */
export interface NodeData {
  name: string;
  type: NodeType;
  description?: string;
  content?: string;
  tags?: string[];
  links?: string[];
  metadata?: Record<string, any>;
}

/**
 * Project context information for node generation
 */
export interface ProjectContext {
  projectName: string;
  framework: string;
  version?: string;
  author?: string;
  basePath?: string;
  timestamp?: Date;
  customData?: Record<string, any>;
}

/**
 * Generated node output
 */
export interface GeneratedNode {
  filename: string;
  relativePath: string;
  content: string; // Full markdown with frontmatter
  frontmatter: Record<string, any>;
}

/**
 * Wikilink information
 */
export interface WikiLink {
  target: string;
  alias?: string;
  type?: 'concept' | 'technical' | 'feature' | 'external';
}

/**
 * Node generation options
 */
export interface NodeGenerationOptions {
  includeTimestamp?: boolean;
  autoGenerateLinks?: boolean;
  includeTOC?: boolean;
  customFrontmatter?: Record<string, any>;
  contentPrefix?: string;
  contentSuffix?: string;
}

/**
 * Default values for node generation
 */
export const DEFAULT_NODE_OPTIONS: Required<NodeGenerationOptions> = {
  includeTimestamp: true,
  autoGenerateLinks: true,
  includeTOC: false,
  customFrontmatter: {},
  contentPrefix: '',
  contentSuffix: '',
};

/**
 * Node generation errors
 */
export class NodeGenerationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'NodeGenerationError';
  }
}

export class TemplateNotFoundError extends NodeGenerationError {
  constructor(nodeType: string) {
    super(
      `Template not found for node type: ${nodeType}`,
      'TEMPLATE_NOT_FOUND',
      { nodeType }
    );
    this.name = 'TemplateNotFoundError';
  }
}

export class InvalidNodeDataError extends NodeGenerationError {
  constructor(message: string, details?: unknown) {
    super(message, 'INVALID_NODE_DATA', details);
    this.name = 'InvalidNodeDataError';
  }
}

/**
 * Validation schema for NodeData
 */
export const NodeDataSchema = z.object({
  name: z.string().min(1, 'Node name cannot be empty'),
  type: NodeTypeSchema,
  description: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  links: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Validation schema for ProjectContext
 */
export const ProjectContextSchema = z.object({
  projectName: z.string().min(1),
  framework: z.string().min(1),
  version: z.string().optional(),
  author: z.string().optional(),
  basePath: z.string().optional(),
  timestamp: z.date().optional(),
  customData: z.record(z.any()).optional(),
});
