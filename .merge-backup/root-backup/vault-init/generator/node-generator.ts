import Handlebars from 'handlebars';
import type {
  NodeData,
  ProjectContext,
  GeneratedNode,
  NodeGenerationOptions,
} from './types';
import {
  DEFAULT_NODE_OPTIONS,
  TemplateNotFoundError,
  InvalidNodeDataError,
  NodeDataSchema,
  ProjectContextSchema,
} from './types';
import type { VaultTemplate } from '../templates/types';
import {
  generateFrontmatter,
  frontmatterToYaml,
  validateFrontmatter,
} from './frontmatter-generator';
import {
  generateAutoLinks,
  formatLinksSection,
  sanitizeNodeName,
} from './wikilink-builder';

/**
 * Main node generator that converts code artifacts into Obsidian markdown nodes
 */

/**
 * Generate a complete Obsidian node from node data
 */
export async function generateNode(
  nodeData: NodeData,
  template: VaultTemplate,
  projectContext: ProjectContext,
  options: NodeGenerationOptions = {}
): Promise<GeneratedNode> {
  // Validate input data
  validateNodeData(nodeData);
  validateProjectContext(projectContext);

  // Merge options with defaults
  const opts = { ...DEFAULT_NODE_OPTIONS, ...options };

  // Get node template from vault template
  const nodeTemplate = template.nodeTemplates.get(nodeData.type);
  if (!nodeTemplate) {
    throw new TemplateNotFoundError(nodeData.type);
  }

  // Generate frontmatter
  const frontmatter = generateFrontmatter(nodeData, projectContext, {
    includeTimestamp: opts.includeTimestamp,
    customFields: opts.customFrontmatter,
  });

  // Validate frontmatter
  const validation = validateFrontmatter(frontmatter);
  if (!validation.valid) {
    throw new InvalidNodeDataError(
      'Invalid frontmatter generated',
      validation.errors
    );
  }

  // Generate content from template
  const content = await renderNodeContent(
    nodeData,
    nodeTemplate.contentTemplate,
    projectContext,
    opts
  );

  // Generate wikilinks if enabled
  let linksSection = '';
  if (opts.autoGenerateLinks) {
    const links = generateAutoLinks(nodeData);
    linksSection = formatLinksSection(links);
  }

  // Combine all parts
  const fullContent =
    frontmatterToYaml(frontmatter) +
    '\n' +
    (opts.contentPrefix || '') +
    content +
    linksSection +
    (opts.contentSuffix || '');

  // Generate filename and path
  const filename = generateFilename(nodeData.name);
  const relativePath = generateRelativePath(nodeData.type, filename);

  return {
    filename,
    relativePath,
    content: fullContent,
    frontmatter,
  };
}

/**
 * Render node content using Handlebars template
 */
async function renderNodeContent(
  nodeData: NodeData,
  contentTemplate: string,
  projectContext: ProjectContext,
  _options: NodeGenerationOptions
): Promise<string> {
  // Register Handlebars helpers
  registerHandlebarsHelpers();

  // Compile template
  const template = Handlebars.compile(contentTemplate, {
    noEscape: true,
    strict: false,
  });

  // Prepare template context
  const context = {
    name: nodeData.name,
    type: nodeData.type,
    description: nodeData.description || '',
    content: nodeData.content || '',
    tags: nodeData.tags || [],
    projectName: projectContext.projectName,
    framework: projectContext.framework,
    timestamp: (projectContext.timestamp || new Date()).toISOString(),
    author: projectContext.author || 'Unknown',
    version: projectContext.version || '1.0.0',
    ...nodeData.metadata,
    ...projectContext.customData,
  };

  try {
    return template(context);
  } catch (error) {
    throw new Error(`Failed to render template: ${error}`);
  }
}

/**
 * Register custom Handlebars helpers
 */
function registerHandlebarsHelpers(): void {
  // Helper to format dates
  Handlebars.registerHelper('formatDate', function (date: Date | string) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  // Helper to uppercase text
  Handlebars.registerHelper('uppercase', function (text: string) {
    return text.toUpperCase();
  });

  // Helper to lowercase text
  Handlebars.registerHelper('lowercase', function (text: string) {
    return text.toLowerCase();
  });

  // Helper to titlecase text
  Handlebars.registerHelper('titlecase', function (text: string) {
    return text.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  });

  // Helper for conditional rendering
  Handlebars.registerHelper('ifEquals', function (this: any, arg1: any, arg2: any, options: any) {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this);
  });

  // Helper to join array
  Handlebars.registerHelper('join', function (array: string[], separator: string) {
    return Array.isArray(array) ? array.join(separator || ', ') : '';
  });

  // Helper to create bullet list
  Handlebars.registerHelper('bulletList', function (array: string[]) {
    if (!Array.isArray(array) || array.length === 0) {
      return '';
    }
    return array.map((item) => `- ${item}`).join('\n');
  });
}

/**
 * Generate filename from node name
 */
function generateFilename(nodeName: string): string {
  const sanitized = sanitizeNodeName(nodeName);
  return `${sanitized}.md`;
}

/**
 * Generate relative path based on node type
 */
function generateRelativePath(
  nodeType: string,
  filename: string
): string {
  // Map node types to directory structure
  const directoryMap: Record<string, string> = {
    concept: 'concepts',
    technical: 'technical',
    feature: 'features',
  };

  const directory = directoryMap[nodeType] || 'misc';
  return `${directory}/${filename}`;
}

/**
 * Validate node data
 */
function validateNodeData(nodeData: NodeData): void {
  try {
    NodeDataSchema.parse(nodeData);
  } catch (error: any) {
    const errorMessage = error.errors
      ? error.errors.map((e: any) => e.message).join(', ')
      : error.message || 'Unknown validation error';
    throw new InvalidNodeDataError(`Invalid node data: ${errorMessage}`, error.errors || error);
  }
}

/**
 * Validate project context
 */
function validateProjectContext(projectContext: ProjectContext): void {
  try {
    ProjectContextSchema.parse(projectContext);
  } catch (error: any) {
    const errorMessage = error.errors
      ? error.errors.map((e: any) => e.message).join(', ')
      : error.message || 'Unknown validation error';
    throw new InvalidNodeDataError(
      `Invalid project context: ${errorMessage}`,
      error.errors || error
    );
  }
}

/**
 * Batch generate multiple nodes
 */
export async function generateNodes(
  nodesData: NodeData[],
  template: VaultTemplate,
  projectContext: ProjectContext,
  options: NodeGenerationOptions = {}
): Promise<GeneratedNode[]> {
  const results = await Promise.all(
    nodesData.map((nodeData) =>
      generateNode(nodeData, template, projectContext, options)
    )
  );

  return results;
}

/**
 * Generate node with default template
 */
export async function generateNodeWithDefaults(
  nodeData: NodeData,
  projectContext: ProjectContext
): Promise<GeneratedNode> {
  // Create a minimal default template
  const defaultTemplate: VaultTemplate = {
    id: 'default',
    name: 'Default Template',
    framework: projectContext.framework,
    version: '1.0.0',
    description: 'Default template for node generation',
    directories: {
      concepts: { description: 'Conceptual nodes' },
      technical: { description: 'Technical nodes' },
      features: { description: 'Feature nodes' },
    },
    nodeTemplates: new Map([
      [
        'concept',
        {
          type: 'concept',
          frontmatter: {},
          contentTemplate: `# {{name}}

{{#if description}}
## Description

{{description}}
{{/if}}

{{#if content}}
## Details

{{content}}
{{/if}}
`,
        },
      ],
      [
        'technical',
        {
          type: 'technical',
          frontmatter: {},
          contentTemplate: `# {{name}}

{{#if description}}
## Overview

{{description}}
{{/if}}

{{#if content}}
## Implementation

{{content}}
{{/if}}
`,
        },
      ],
      [
        'feature',
        {
          type: 'feature',
          frontmatter: {},
          contentTemplate: `# {{name}}

{{#if description}}
## Description

{{description}}
{{/if}}

{{#if content}}
## Functionality

{{content}}
{{/if}}
`,
        },
      ],
    ]),
  };

  return generateNode(nodeData, defaultTemplate, projectContext);
}
