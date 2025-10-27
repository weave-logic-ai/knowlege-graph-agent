import yaml from 'js-yaml';
import type { NodeData, ProjectContext, NodeType } from './types';

/**
 * Generate YAML frontmatter for Obsidian nodes
 */

export interface FrontmatterOptions {
  includeTimestamp?: boolean;
  includeAuthor?: boolean;
  includeVersion?: boolean;
  customFields?: Record<string, any>;
}

/**
 * Generate frontmatter object from node data and context
 */
export function generateFrontmatter(
  nodeData: NodeData,
  projectContext: ProjectContext,
  options: FrontmatterOptions = {}
): Record<string, any> {
  const {
    includeTimestamp = true,
    includeAuthor = true,
    includeVersion = false,
    customFields = {},
  } = options;

  const frontmatter: Record<string, any> = {
    type: nodeData.type,
    name: nodeData.name,
    tags: generateTags(nodeData, projectContext),
    ...customFields,
  };

  // Add description if provided
  if (nodeData.description) {
    frontmatter['description'] = nodeData.description;
  }

  // Add timestamp
  if (includeTimestamp) {
    frontmatter['created'] = (
      projectContext.timestamp || new Date()
    ).toISOString();
  }

  // Add author if available
  if (includeAuthor && projectContext.author) {
    frontmatter['author'] = projectContext.author;
  }

  // Add version if available and requested
  if (includeVersion && projectContext.version) {
    frontmatter['version'] = projectContext.version;
  }

  // Add framework information
  frontmatter['framework'] = projectContext.framework;
  frontmatter['project'] = projectContext.projectName;

  // Add custom metadata from nodeData
  if (nodeData.metadata) {
    Object.assign(frontmatter, nodeData.metadata);
  }

  // Add links if provided
  if (nodeData.links && nodeData.links.length > 0) {
    frontmatter['links'] = nodeData.links;
  }

  return frontmatter;
}

/**
 * Generate tags array from node data and context
 */
function generateTags(
  nodeData: NodeData,
  projectContext: ProjectContext
): string[] {
  const tags = new Set<string>();

  // Add type-based tag
  tags.add(nodeData.type);

  // Add framework tag
  tags.add(projectContext.framework);

  // Add user-provided tags
  if (nodeData.tags) {
    nodeData.tags.forEach((tag) => tags.add(tag));
  }

  // Add auto-generated tags based on node type
  const autoTags = getAutoTagsForType(nodeData.type);
  autoTags.forEach((tag) => tags.add(tag));

  return Array.from(tags).sort();
}

/**
 * Get automatic tags based on node type
 */
function getAutoTagsForType(type: NodeType): string[] {
  switch (type) {
    case 'concept':
      return ['knowledge', 'conceptual'];
    case 'technical':
      return ['implementation', 'technical'];
    case 'feature':
      return ['functionality', 'feature'];
    default:
      return [];
  }
}

/**
 * Convert frontmatter object to YAML string
 */
export function frontmatterToYaml(frontmatter: Record<string, any>): string {
  try {
    const yamlContent = yaml.dump(frontmatter, {
      indent: 2,
      lineWidth: 80,
      noRefs: true,
      sortKeys: false,
    });
    return `---\n${yamlContent}---\n`;
  } catch (error) {
    throw new Error(`Failed to generate YAML frontmatter: ${error}`);
  }
}

/**
 * Parse YAML frontmatter from markdown content
 */
export function parseFrontmatter(
  markdownContent: string
): { frontmatter: Record<string, any> | null; content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdownContent.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: null, content: markdownContent };
  }

  try {
    const frontmatter = yaml.load(match[1] || '') as Record<string, any>;
    const content = match[2] || '';
    return { frontmatter, content };
  } catch (error) {
    throw new Error(`Failed to parse YAML frontmatter: ${error}`);
  }
}

/**
 * Update frontmatter in existing markdown content
 */
export function updateFrontmatter(
  markdownContent: string,
  updates: Record<string, any>
): string {
  const { frontmatter, content } = parseFrontmatter(markdownContent);

  const updatedFrontmatter = {
    ...(frontmatter || {}),
    ...updates,
  };

  return frontmatterToYaml(updatedFrontmatter) + content;
}

/**
 * Validate frontmatter structure
 */
export function validateFrontmatter(
  frontmatter: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!frontmatter['type']) {
    errors.push('Missing required field: type');
  }

  if (!frontmatter['name']) {
    errors.push('Missing required field: name');
  }

  // Validate type enum
  if (
    frontmatter['type'] &&
    !['concept', 'technical', 'feature'].includes(frontmatter['type'])
  ) {
    errors.push(`Invalid type: ${frontmatter['type']}`);
  }

  // Validate tags is array if present
  if (frontmatter['tags'] && !Array.isArray(frontmatter['tags'])) {
    errors.push('Tags must be an array');
  }

  // Validate links is array if present
  if (frontmatter['links'] && !Array.isArray(frontmatter['links'])) {
    errors.push('Links must be an array');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
