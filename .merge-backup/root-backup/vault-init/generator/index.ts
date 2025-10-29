/**
 * Node Generator - Phase 6 Vault Initialization
 *
 * Converts code artifacts into Obsidian markdown nodes with:
 * - YAML frontmatter generation
 * - Wikilink relationship building
 * - Template-based content rendering
 * - Support for concept, technical, and feature node types
 */

export {
  generateNode,
  generateNodes,
  generateNodeWithDefaults,
} from './node-generator';

export {
  generateFrontmatter,
  frontmatterToYaml,
  parseFrontmatter,
  updateFrontmatter,
  validateFrontmatter,
} from './frontmatter-generator';

export {
  formatWikiLink,
  parseWikiLink,
  generateAutoLinks,
  groupLinksByType,
  formatLinksSection,
  extractWikiLinks,
  sanitizeNodeName,
} from './wikilink-builder';

export type {
  NodeData,
  ProjectContext,
  GeneratedNode,
  WikiLink,
  NodeType,
  NodeGenerationOptions,
} from './types';

export {
  NodeGenerationError,
  TemplateNotFoundError,
  InvalidNodeDataError,
  DEFAULT_NODE_OPTIONS,
} from './types';
