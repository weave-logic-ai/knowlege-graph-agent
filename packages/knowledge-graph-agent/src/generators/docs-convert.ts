/**
 * Docs Converter
 *
 * Converts existing documentation to weave-nn structure with proper
 * frontmatter and directory organization.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join, basename, dirname, relative, extname } from 'path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import type { NodeType, NodeStatus, NodeFrontmatter } from '../core/types.js';

/**
 * Conversion options
 */
export interface ConvertOptions {
  /** Source directory with existing docs */
  sourceDir: string;
  /** Target directory (default: docs-nn) */
  targetDir?: string;
  /** Project root for path resolution */
  projectRoot: string;
  /** Preserve original files (copy instead of move) */
  preserveOriginal?: boolean;
  /** Overwrite existing files in target */
  force?: boolean;
  /** Auto-categorize based on content analysis */
  autoCategory?: boolean;
  /** Dry run - show what would be done */
  dryRun?: boolean;
}

/**
 * Frontmatter options
 */
export interface FrontmatterOptions {
  /** Target file or directory */
  target: string;
  /** Project root */
  projectRoot: string;
  /** Override type detection */
  type?: NodeType;
  /** Override status */
  status?: NodeStatus;
  /** Additional tags to add */
  tags?: string[];
  /** Force overwrite existing frontmatter */
  force?: boolean;
  /** Dry run */
  dryRun?: boolean;
}

/**
 * Conversion result
 */
export interface ConvertResult {
  success: boolean;
  filesProcessed: number;
  filesConverted: number;
  filesSkipped: number;
  errors: string[];
  converted: Array<{
    source: string;
    target: string;
    type: NodeType;
  }>;
}

/**
 * Frontmatter result
 */
export interface FrontmatterResult {
  success: boolean;
  filesProcessed: number;
  filesUpdated: number;
  filesSkipped: number;
  errors: string[];
}

/**
 * Weave-NN directory structure mapping
 */
const CATEGORY_DIRS: Record<NodeType, string> = {
  concept: 'concepts',
  technical: 'components',
  feature: 'features',
  primitive: 'integrations',
  service: 'services',
  guide: 'guides',
  standard: 'standards',
  integration: 'integrations',
};

/**
 * Keywords for content-based categorization
 */
const CATEGORY_KEYWORDS: Record<NodeType, string[]> = {
  concept: [
    'overview', 'introduction', 'theory', 'principle', 'concept',
    'philosophy', 'approach', 'methodology', 'paradigm', 'model',
  ],
  technical: [
    'component', 'implementation', 'class', 'function', 'module',
    'algorithm', 'data structure', 'interface', 'abstract', 'utility',
  ],
  feature: [
    'feature', 'capability', 'functionality', 'use case', 'user story',
    'requirement', 'specification', 'product', 'roadmap',
  ],
  primitive: [
    'library', 'framework', 'dependency', 'package', 'tool',
    'sdk', 'runtime', 'platform', 'language',
  ],
  service: [
    'api', 'endpoint', 'service', 'server', 'backend', 'microservice',
    'rest', 'graphql', 'webhook', 'worker', 'queue',
  ],
  guide: [
    'how to', 'tutorial', 'guide', 'walkthrough', 'step by step',
    'getting started', 'setup', 'installation', 'configuration',
  ],
  standard: [
    'standard', 'convention', 'best practice', 'rule', 'policy',
    'guideline', 'coding style', 'lint', 'format',
  ],
  integration: [
    'integration', 'connect', 'plugin', 'adapter', 'bridge',
    'sync', 'import', 'export', 'webhook',
  ],
};

/**
 * Path-based categorization patterns
 */
const PATH_PATTERNS: Array<{ pattern: RegExp; type: NodeType }> = [
  { pattern: /\/(api|endpoints?|routes?)\//i, type: 'service' },
  { pattern: /\/(guide|tutorial|howto|getting-started)\//i, type: 'guide' },
  { pattern: /\/(component|ui|widget)\//i, type: 'technical' },
  { pattern: /\/(feature|capability)\//i, type: 'feature' },
  { pattern: /\/(standard|convention|style)\//i, type: 'standard' },
  { pattern: /\/(integration|plugin|adapter)\//i, type: 'integration' },
  { pattern: /\/(service|worker|job)\//i, type: 'service' },
  { pattern: /\/(concept|architecture|design)\//i, type: 'concept' },
];

/**
 * Convert existing docs to weave-nn structure
 */
export async function convertDocs(options: ConvertOptions): Promise<ConvertResult> {
  const {
    sourceDir,
    targetDir = 'docs-nn',
    projectRoot,
    preserveOriginal = true,
    force = false,
    autoCategory = true,
    dryRun = false,
  } = options;

  const result: ConvertResult = {
    success: true,
    filesProcessed: 0,
    filesConverted: 0,
    filesSkipped: 0,
    errors: [],
    converted: [],
  };

  const sourcePath = join(projectRoot, sourceDir);
  const targetPath = join(projectRoot, targetDir);

  // Validate source exists
  if (!existsSync(sourcePath)) {
    result.success = false;
    result.errors.push(`Source directory not found: ${sourcePath}`);
    return result;
  }

  // Create target structure
  if (!dryRun) {
    createTargetStructure(targetPath);
  }

  // Find all markdown files
  const files = await fg('**/*.md', {
    cwd: sourcePath,
    ignore: ['node_modules/**', '.git/**', '_templates/**'],
  });

  for (const file of files) {
    result.filesProcessed++;
    const sourceFile = join(sourcePath, file);

    try {
      // Read and parse file
      const content = readFileSync(sourceFile, 'utf-8');
      const { data: existingFrontmatter, content: body } = matter(content);

      // Determine node type
      const nodeType = autoCategory
        ? detectNodeType(file, body, existingFrontmatter)
        : (existingFrontmatter.type as NodeType) || 'concept';

      // Determine target path
      const targetSubdir = CATEGORY_DIRS[nodeType];
      const targetFile = join(targetPath, targetSubdir, basename(file));

      // Check if target exists
      if (existsSync(targetFile) && !force) {
        result.filesSkipped++;
        continue;
      }

      // Generate frontmatter
      const frontmatter = generateFrontmatter(file, body, nodeType, existingFrontmatter);

      // Build new content
      const newContent = buildMarkdownWithFrontmatter(frontmatter, body);

      if (!dryRun) {
        // Ensure directory exists
        mkdirSync(dirname(targetFile), { recursive: true });

        // Write converted file
        writeFileSync(targetFile, newContent, 'utf-8');
      }

      result.filesConverted++;
      result.converted.push({
        source: file,
        target: relative(projectRoot, targetFile),
        type: nodeType,
      });

    } catch (error) {
      result.errors.push(`Failed to convert ${file}: ${error}`);
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Add or update frontmatter in existing files
 */
export async function addFrontmatter(options: FrontmatterOptions): Promise<FrontmatterResult> {
  const {
    target,
    projectRoot,
    type,
    status = 'active',
    tags = [],
    force = false,
    dryRun = false,
  } = options;

  const result: FrontmatterResult = {
    success: true,
    filesProcessed: 0,
    filesUpdated: 0,
    filesSkipped: 0,
    errors: [],
  };

  const targetPath = join(projectRoot, target);

  // Handle single file or directory
  let files: string[];
  if (existsSync(targetPath) && !targetPath.endsWith('.md')) {
    // Directory - find all markdown files
    files = await fg('**/*.md', {
      cwd: targetPath,
      ignore: ['node_modules/**', '.git/**', '_templates/**'],
      absolute: true,
    });
  } else if (existsSync(targetPath)) {
    files = [targetPath];
  } else {
    result.success = false;
    result.errors.push(`Target not found: ${targetPath}`);
    return result;
  }

  for (const file of files) {
    result.filesProcessed++;

    try {
      const content = readFileSync(file, 'utf-8');
      const { data: existingFrontmatter, content: body } = matter(content);

      // Skip if has frontmatter and not forcing
      if (Object.keys(existingFrontmatter).length > 0 && !force) {
        result.filesSkipped++;
        continue;
      }

      // Detect type if not specified
      const relPath = relative(projectRoot, file);
      const nodeType = type || detectNodeType(relPath, body, existingFrontmatter);

      // Generate frontmatter
      const frontmatter = generateFrontmatter(
        relPath,
        body,
        nodeType,
        force ? {} : existingFrontmatter,
        status,
        tags
      );

      // Build new content
      const newContent = buildMarkdownWithFrontmatter(frontmatter, body);

      if (!dryRun) {
        writeFileSync(file, newContent, 'utf-8');
      }

      result.filesUpdated++;

    } catch (error) {
      result.errors.push(`Failed to update ${file}: ${error}`);
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Validate frontmatter in files
 */
export async function validateFrontmatter(
  target: string,
  projectRoot: string
): Promise<{
  valid: number;
  invalid: number;
  missing: number;
  issues: Array<{ file: string; issues: string[] }>;
}> {
  const result = {
    valid: 0,
    invalid: 0,
    missing: 0,
    issues: [] as Array<{ file: string; issues: string[] }>,
  };

  const targetPath = join(projectRoot, target);

  const files = await fg('**/*.md', {
    cwd: targetPath,
    ignore: ['node_modules/**', '.git/**', '_templates/**'],
    absolute: true,
  });

  const validTypes: NodeType[] = [
    'concept', 'technical', 'feature', 'primitive',
    'service', 'guide', 'standard', 'integration',
  ];

  const validStatuses: NodeStatus[] = ['draft', 'active', 'deprecated', 'archived'];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const { data: frontmatter } = matter(content);
    const fileIssues: string[] = [];

    if (Object.keys(frontmatter).length === 0) {
      result.missing++;
      fileIssues.push('Missing frontmatter');
    } else {
      // Check required fields
      if (!frontmatter.title) {
        fileIssues.push('Missing title');
      }
      if (!frontmatter.type) {
        fileIssues.push('Missing type');
      } else if (!validTypes.includes(frontmatter.type)) {
        fileIssues.push(`Invalid type: ${frontmatter.type}`);
      }
      if (frontmatter.status && !validStatuses.includes(frontmatter.status)) {
        fileIssues.push(`Invalid status: ${frontmatter.status}`);
      }
      if (!frontmatter.created) {
        fileIssues.push('Missing created date');
      }
    }

    if (fileIssues.length > 0) {
      result.invalid++;
      result.issues.push({
        file: relative(projectRoot, file),
        issues: fileIssues,
      });
    } else if (Object.keys(frontmatter).length > 0) {
      result.valid++;
    }
  }

  return result;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create target directory structure
 */
function createTargetStructure(targetPath: string): void {
  const dirs = [
    '',
    'concepts',
    'concepts/architecture',
    'concepts/patterns',
    'components',
    'components/ui',
    'components/utilities',
    'services',
    'services/api',
    'services/workers',
    'features',
    'features/core',
    'features/advanced',
    'integrations',
    'integrations/databases',
    'integrations/auth',
    'standards',
    'standards/coding',
    'standards/documentation',
    'guides',
    'guides/getting-started',
    'guides/tutorials',
    'references',
    'references/api',
    '_templates',
    '_attachments',
  ];

  for (const dir of dirs) {
    const fullPath = join(targetPath, dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
    }
  }
}

/**
 * Detect node type from file path and content
 */
function detectNodeType(
  filePath: string,
  content: string,
  existingFrontmatter: Record<string, unknown>
): NodeType {
  // Use existing type if valid
  const validTypes: NodeType[] = [
    'concept', 'technical', 'feature', 'primitive',
    'service', 'guide', 'standard', 'integration',
  ];

  if (existingFrontmatter.type && validTypes.includes(existingFrontmatter.type as NodeType)) {
    return existingFrontmatter.type as NodeType;
  }

  // Check path patterns
  for (const { pattern, type } of PATH_PATTERNS) {
    if (pattern.test(filePath)) {
      return type;
    }
  }

  // Analyze content
  const lowerContent = content.toLowerCase();
  const scores: Record<NodeType, number> = {
    concept: 0,
    technical: 0,
    feature: 0,
    primitive: 0,
    service: 0,
    guide: 0,
    standard: 0,
    integration: 0,
  };

  for (const [nodeType, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = lowerContent.match(regex);
      if (matches) {
        scores[nodeType as NodeType] += matches.length;
      }
    }
  }

  // Find highest scoring type
  let maxScore = 0;
  let detectedType: NodeType = 'concept';

  for (const [nodeType, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedType = nodeType as NodeType;
    }
  }

  return detectedType;
}

/**
 * Generate frontmatter for a file
 */
function generateFrontmatter(
  filePath: string,
  content: string,
  nodeType: NodeType,
  existing: Record<string, unknown> = {},
  status: NodeStatus = 'active',
  additionalTags: string[] = []
): NodeFrontmatter {
  const filename = basename(filePath, '.md');
  const title = existing.title as string || formatTitle(filename);

  // Extract tags from content
  const extractedTags = extractTags(content);
  const allTags = [...new Set([
    ...(existing.tags as string[] || []),
    ...extractedTags,
    ...additionalTags,
  ])];

  // Get dates
  const now = new Date().toISOString().split('T')[0];
  const created = existing.created as string || now;

  return {
    title,
    type: nodeType,
    status: existing.status as NodeStatus || status,
    tags: allTags.length > 0 ? allTags : undefined,
    category: existing.category as string || undefined,
    description: existing.description as string || extractDescription(content),
    created,
    updated: now,
    aliases: existing.aliases as string[] || undefined,
    related: existing.related as string[] || undefined,
  };
}

/**
 * Format filename as title
 */
function formatTitle(filename: string): string {
  return filename
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

/**
 * Extract tags from content
 */
function extractTags(content: string): string[] {
  const tags: string[] = [];

  // Look for #tags in content
  const tagMatches = content.match(/#[\w-]+/g);
  if (tagMatches) {
    tags.push(...tagMatches.map(t => t.slice(1)));
  }

  return tags.slice(0, 10); // Limit to 10 tags
}

/**
 * Extract description from first paragraph
 */
function extractDescription(content: string): string | undefined {
  // Skip headers and find first paragraph
  const lines = content.split('\n');
  let description = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
      description = trimmed;
      break;
    }
  }

  if (description.length > 200) {
    description = description.slice(0, 197) + '...';
  }

  return description || undefined;
}

/**
 * Build markdown content with frontmatter
 */
function buildMarkdownWithFrontmatter(
  frontmatter: NodeFrontmatter,
  content: string
): string {
  // Clean undefined values
  const cleanFrontmatter: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value !== undefined) {
      cleanFrontmatter[key] = value;
    }
  }

  // Build YAML frontmatter
  const yamlLines = ['---'];

  // Order: title, type, status, tags, description, dates, others
  const orderedKeys = ['title', 'type', 'status', 'tags', 'category', 'description', 'created', 'updated', 'aliases', 'related'];

  for (const key of orderedKeys) {
    if (cleanFrontmatter[key] !== undefined) {
      yamlLines.push(formatYamlLine(key, cleanFrontmatter[key]));
    }
  }

  yamlLines.push('---');
  yamlLines.push('');

  return yamlLines.join('\n') + content.trim() + '\n';
}

/**
 * Format a YAML line
 */
function formatYamlLine(key: string, value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`;
  }
  if (typeof value === 'string' && (value.includes(':') || value.includes('#'))) {
    return `${key}: "${value}"`;
  }
  return `${key}: ${value}`;
}
