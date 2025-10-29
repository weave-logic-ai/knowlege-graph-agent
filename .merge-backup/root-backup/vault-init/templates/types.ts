import { z } from 'zod';

/**
 * Core template types for vault structure generation
 */

// Zod schema for node frontmatter
export const NodeFrontmatterSchema = z.record(z.string(), z.any());

// Zod schema for directory structure
export const DirectoryStructureSchema = z.record(
  z.string(),
  z.object({
    description: z.string(),
    children: z.record(z.string(), z.string()).optional(),
  })
);

// Zod schema for node template
export const NodeTemplateSchema = z.object({
  type: z.enum(['concept', 'technical', 'feature']),
  frontmatter: NodeFrontmatterSchema,
  contentTemplate: z.string(),
  description: z.string().optional(),
});

// Zod schema for vault template
export const VaultTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  framework: z.string(),
  version: z.string(),
  description: z.string(),
  directories: DirectoryStructureSchema,
  nodeTemplates: z.record(z.string(), NodeTemplateSchema),
  metadata: z
    .object({
      author: z.string().optional(),
      tags: z.array(z.string()).optional(),
      dependencies: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * TypeScript interfaces derived from Zod schemas
 */

export type NodeFrontmatter = z.infer<typeof NodeFrontmatterSchema>;

export interface DirectoryStructure {
  [key: string]: {
    description: string;
    children?: Record<string, string>;
  };
}

export interface NodeTemplate {
  type: 'concept' | 'technical' | 'feature';
  frontmatter: NodeFrontmatter;
  contentTemplate: string; // Handlebars template string
  description?: string;
}

export interface VaultTemplate {
  id: string;
  name: string;
  framework: string;
  version: string;
  description: string;
  directories: DirectoryStructure;
  nodeTemplates: Map<string, NodeTemplate>;
  metadata?: {
    author?: string;
    tags?: string[];
    dependencies?: string[];
  };
}

/**
 * Template rendering context for Handlebars
 */
export interface TemplateContext {
  projectName: string;
  framework: string;
  nodeName: string;
  nodeType: string;
  timestamp: string;
  author?: string;
  [key: string]: any; // Additional custom variables
}

/**
 * Template validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Template metadata for listing/discovery
 */
export interface TemplateMetadata {
  id: string;
  name: string;
  framework: string;
  version: string;
  description: string;
  tags?: string[];
}
