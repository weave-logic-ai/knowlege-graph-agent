/**
 * Docs Analyzer
 *
 * Advanced documentation analyzer that uses claude-flow to create
 * comprehensive knowledge graph documentation with proper structure,
 * wikilinks, frontmatter, and tags following Obsidian conventions.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, basename, dirname, relative, extname } from 'path';
import { execSync, spawn } from 'child_process';
import fg from 'fast-glob';
import matter from 'gray-matter';
import type { NodeType, NodeStatus, NodeFrontmatter } from '../core/types.js';

/**
 * Analyzer options
 */
export interface AnalyzerOptions {
  /** Source directory with existing docs */
  sourceDir: string;
  /** Target directory (default: docs-nn) */
  targetDir?: string;
  /** Project root for path resolution */
  projectRoot: string;
  /** Use claude-flow for deep analysis */
  useClaudeFlow?: boolean;
  /** Create MOC (Map of Content) files */
  createMOC?: boolean;
  /** Link back to original docs */
  linkOriginal?: boolean;
  /** Maximum depth for analysis */
  maxDepth?: number;
  /** Dry run - show what would be done */
  dryRun?: boolean;
  /** Verbose output */
  verbose?: boolean;
}

/**
 * Analyzed document
 */
export interface AnalyzedDoc {
  /** Original file path */
  originalPath: string;
  /** New file path in docs-nn */
  newPath: string;
  /** Document title */
  title: string;
  /** Detected node type */
  type: NodeType;
  /** Extracted tags */
  tags: string[];
  /** Related documents (wikilinks) */
  related: string[];
  /** Key concepts extracted */
  concepts: string[];
  /** Areas needing research */
  researchNeeded: string[];
  /** TODOs found or generated */
  todos: string[];
  /** Summary/description */
  summary: string;
  /** Category path in structure */
  category: string;
}

/**
 * Analyzer result
 */
export interface AnalyzerResult {
  success: boolean;
  filesAnalyzed: number;
  filesCreated: number;
  mocFilesCreated: number;
  errors: string[];
  analyzed: AnalyzedDoc[];
  structure: Map<string, string[]>;
}

/**
 * Weave-NN category structure with descriptions
 */
const CATEGORY_STRUCTURE: Record<string, { type: NodeType; description: string; subcategories: string[] }> = {
  concepts: {
    type: 'concept',
    description: 'Abstract concepts, theories, and architectural principles',
    subcategories: ['architecture', 'patterns', 'principles', 'models'],
  },
  components: {
    type: 'technical',
    description: 'Reusable technical components and implementations',
    subcategories: ['ui', 'utilities', 'core', 'shared'],
  },
  services: {
    type: 'service',
    description: 'Backend services, APIs, and workers',
    subcategories: ['api', 'workers', 'handlers', 'middleware'],
  },
  features: {
    type: 'feature',
    description: 'Product features and capabilities',
    subcategories: ['core', 'advanced', 'experimental'],
  },
  integrations: {
    type: 'integration',
    description: 'External integrations and adapters',
    subcategories: ['databases', 'auth', 'storage', 'monitoring', 'third-party'],
  },
  standards: {
    type: 'standard',
    description: 'Coding standards, conventions, and best practices',
    subcategories: ['coding', 'documentation', 'testing', 'security'],
  },
  guides: {
    type: 'guide',
    description: 'How-to guides and tutorials',
    subcategories: ['getting-started', 'tutorials', 'troubleshooting', 'deployment'],
  },
  references: {
    type: 'technical',
    description: 'API references and technical documentation',
    subcategories: ['api', 'cli', 'config', 'schemas'],
  },
};

/**
 * Analyze and migrate documentation to weave-nn structure
 */
export async function analyzeDocs(options: AnalyzerOptions): Promise<AnalyzerResult> {
  const {
    sourceDir,
    targetDir = 'docs-nn',
    projectRoot,
    useClaudeFlow = false,
    createMOC = true,
    linkOriginal = true,
    maxDepth = 3,
    dryRun = false,
    verbose = false,
  } = options;

  const result: AnalyzerResult = {
    success: true,
    filesAnalyzed: 0,
    filesCreated: 0,
    mocFilesCreated: 0,
    errors: [],
    analyzed: [],
    structure: new Map(),
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
    createFullStructure(targetPath);
  }

  // Find all markdown files
  const files = await fg('**/*.md', {
    cwd: sourcePath,
    ignore: ['node_modules/**', '.git/**', '_templates/**', 'docs-nn/**'],
  });

  // First pass: Analyze all documents
  const analyzedDocs: AnalyzedDoc[] = [];

  for (const file of files) {
    result.filesAnalyzed++;
    const sourceFile = join(sourcePath, file);

    try {
      const analyzed = await analyzeDocument(sourceFile, file, sourcePath, {
        useClaudeFlow,
        linkOriginal,
        verbose,
      });
      analyzedDocs.push(analyzed);

      // Track structure
      const category = analyzed.category.split('/')[0];
      if (!result.structure.has(category)) {
        result.structure.set(category, []);
      }
      result.structure.get(category)!.push(analyzed.title);

    } catch (error) {
      result.errors.push(`Failed to analyze ${file}: ${error}`);
    }
  }

  // Build cross-references between documents
  buildCrossReferences(analyzedDocs);

  // Second pass: Create new documents
  for (const doc of analyzedDocs) {
    try {
      const targetFile = join(targetPath, doc.newPath);

      if (!dryRun) {
        mkdirSync(dirname(targetFile), { recursive: true });
        const content = generateKnowledgeDoc(doc, sourceDir, linkOriginal, analyzedDocs);
        writeFileSync(targetFile, content, 'utf-8');
      }

      result.filesCreated++;
      result.analyzed.push(doc);

    } catch (error) {
      result.errors.push(`Failed to create ${doc.newPath}: ${error}`);
    }
  }

  // Create MOC files for each category
  if (createMOC && !dryRun) {
    for (const [category, docs] of result.structure) {
      const mocPath = join(targetPath, category, '_MOC.md');
      const mocContent = generateMOC(category, docs, analyzedDocs);
      writeFileSync(mocPath, mocContent, 'utf-8');
      result.mocFilesCreated++;
    }

    // Create master MOC
    const masterMocPath = join(targetPath, 'MOC.md');
    const masterMocContent = generateMasterMOC(result.structure, analyzedDocs);
    writeFileSync(masterMocPath, masterMocContent, 'utf-8');
    result.mocFilesCreated++;

    // Create PRIMITIVES.md
    const primitivesPath = join(targetPath, 'PRIMITIVES.md');
    const primitivesContent = generatePrimitives(analyzedDocs);
    writeFileSync(primitivesPath, primitivesContent, 'utf-8');
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Analyze a single document
 */
async function analyzeDocument(
  filePath: string,
  relativePath: string,
  sourcePath: string,
  options: { useClaudeFlow?: boolean; linkOriginal?: boolean; verbose?: boolean }
): Promise<AnalyzedDoc> {
  const content = readFileSync(filePath, 'utf-8');
  const { data: existingFrontmatter, content: body } = matter(content);

  const filename = basename(filePath, '.md');
  const title = existingFrontmatter.title as string || formatTitle(filename);

  // Detect node type and category
  const { type, category } = detectTypeAndCategory(relativePath, body, existingFrontmatter);

  // Extract tags
  const tags = extractAllTags(body, existingFrontmatter, relativePath);

  // Extract wikilinks and markdown links
  const related = extractLinks(body);

  // Extract key concepts
  const concepts = extractConcepts(body);

  // Find areas needing research
  const researchNeeded = findResearchAreas(body, filename);

  // Extract existing TODOs and generate new ones
  const todos = extractAndGenerateTodos(body, content, filename);

  // Generate summary
  const summary = generateSummary(body, existingFrontmatter);

  // Determine new path
  const newPath = join(category, formatFilename(filename) + '.md');

  return {
    originalPath: relativePath,
    newPath,
    title,
    type,
    tags,
    related,
    concepts,
    researchNeeded,
    todos,
    summary,
    category,
  };
}

/**
 * Create full target directory structure
 */
function createFullStructure(targetPath: string): void {
  // Create all category directories and subcategories
  for (const [category, config] of Object.entries(CATEGORY_STRUCTURE)) {
    mkdirSync(join(targetPath, category), { recursive: true });
    for (const sub of config.subcategories) {
      mkdirSync(join(targetPath, category, sub), { recursive: true });
    }
  }

  // Create meta directories
  mkdirSync(join(targetPath, '_templates'), { recursive: true });
  mkdirSync(join(targetPath, '_attachments'), { recursive: true });
  mkdirSync(join(targetPath, '_archive'), { recursive: true });
}

/**
 * Detect node type and category from content
 */
function detectTypeAndCategory(
  filePath: string,
  content: string,
  frontmatter: Record<string, unknown>
): { type: NodeType; category: string } {
  // Check frontmatter first
  if (frontmatter.type && frontmatter.category) {
    return {
      type: frontmatter.type as NodeType,
      category: frontmatter.category as string,
    };
  }

  const lowerContent = content.toLowerCase();
  const lowerPath = filePath.toLowerCase();

  // Score each category
  const scores: Record<string, number> = {};

  for (const [category, config] of Object.entries(CATEGORY_STRUCTURE)) {
    scores[category] = 0;

    // Path matching
    if (lowerPath.includes(category)) scores[category] += 10;
    for (const sub of config.subcategories) {
      if (lowerPath.includes(sub)) scores[category] += 5;
    }

    // Content analysis based on type
    const keywords = getKeywordsForType(config.type);
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) scores[category] += matches.length;
    }
  }

  // Find best match
  let bestCategory = 'concepts';
  let bestScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return {
    type: CATEGORY_STRUCTURE[bestCategory].type,
    category: bestCategory,
  };
}

/**
 * Get keywords for a node type
 */
function getKeywordsForType(type: NodeType): string[] {
  const keywords: Record<NodeType, string[]> = {
    concept: ['concept', 'theory', 'principle', 'overview', 'introduction', 'architecture', 'design', 'pattern'],
    technical: ['component', 'implementation', 'class', 'function', 'module', 'utility', 'helper'],
    feature: ['feature', 'capability', 'functionality', 'user', 'requirement', 'use case'],
    primitive: ['library', 'framework', 'dependency', 'tool', 'sdk'],
    service: ['api', 'endpoint', 'service', 'server', 'backend', 'worker', 'handler'],
    guide: ['how to', 'tutorial', 'guide', 'step', 'walkthrough', 'getting started'],
    standard: ['standard', 'convention', 'best practice', 'rule', 'guideline', 'style'],
    integration: ['integration', 'connect', 'plugin', 'adapter', 'sync', 'import', 'export'],
  };

  return keywords[type] || [];
}

/**
 * Extract all tags from content and path
 */
function extractAllTags(
  content: string,
  frontmatter: Record<string, unknown>,
  filePath: string
): string[] {
  const tags = new Set<string>();

  // Add existing frontmatter tags
  if (Array.isArray(frontmatter.tags)) {
    frontmatter.tags.forEach(t => tags.add(String(t)));
  }

  // Extract #tags from content
  const hashTags = content.match(/#[\w-]+/g);
  if (hashTags) {
    hashTags.forEach(t => tags.add(t.slice(1)));
  }

  // Generate tags from path
  const pathParts = filePath.split('/').filter(p => p && !p.endsWith('.md'));
  pathParts.forEach(p => {
    if (p.length > 2 && p.length < 20) {
      tags.add(p.replace(/[-_]/g, '-').toLowerCase());
    }
  });

  // Add status tags
  if (content.match(/\b(wip|draft|todo)\b/i)) tags.add('needs-work');
  if (content.match(/\b(deprecated|legacy)\b/i)) tags.add('deprecated');
  if (content.match(/\b(experimental|beta)\b/i)) tags.add('experimental');

  return [...tags].slice(0, 15);
}

/**
 * Extract wikilinks and markdown links
 */
function extractLinks(content: string): string[] {
  const links = new Set<string>();

  // Wikilinks
  const wikilinks = content.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g);
  if (wikilinks) {
    wikilinks.forEach(link => {
      const match = link.match(/\[\[([^\]|]+)/);
      if (match) links.add(match[1].trim());
    });
  }

  // Markdown links (internal only)
  const mdLinks = content.match(/\[([^\]]+)\]\(([^)]+)\)/g);
  if (mdLinks) {
    mdLinks.forEach(link => {
      const match = link.match(/\]\(([^)]+)\)/);
      if (match && !match[1].startsWith('http')) {
        links.add(match[1].replace(/\.md$/, '').trim());
      }
    });
  }

  return [...links];
}

/**
 * Extract key concepts from content
 */
function extractConcepts(content: string): string[] {
  const concepts: string[] = [];

  // Look for headers as concepts
  const headers = content.match(/^##\s+(.+)$/gm);
  if (headers) {
    headers.slice(0, 5).forEach(h => {
      concepts.push(h.replace(/^##\s+/, '').trim());
    });
  }

  // Look for bold terms as concepts
  const boldTerms = content.match(/\*\*([^*]+)\*\*/g);
  if (boldTerms) {
    boldTerms.slice(0, 5).forEach(term => {
      const clean = term.replace(/\*\*/g, '').trim();
      if (clean.length > 2 && clean.length < 50) {
        concepts.push(clean);
      }
    });
  }

  return [...new Set(concepts)].slice(0, 10);
}

/**
 * Find areas needing research
 */
function findResearchAreas(content: string, filename: string): string[] {
  const areas: string[] = [];

  // Look for question marks indicating uncertainty
  const questions = content.match(/[^.!?]*\?/g);
  if (questions) {
    questions.slice(0, 3).forEach(q => {
      if (q.length > 10 && q.length < 200) {
        areas.push(q.trim());
      }
    });
  }

  // Look for placeholders
  if (content.match(/\bTBD\b|\bTODO\b|\bFIXME\b/i)) {
    areas.push('Contains placeholders that need completion');
  }

  // Look for empty sections
  const emptyHeaders = content.match(/^##[^#\n]+\n\n##/gm);
  if (emptyHeaders) {
    areas.push('Has empty sections that need content');
  }

  // Check for missing content indicators
  if (content.length < 500) {
    areas.push('Document is short - may need expansion');
  }

  return areas;
}

/**
 * Extract and generate TODOs
 */
function extractAndGenerateTodos(body: string, fullContent: string, filename: string): string[] {
  const todos: string[] = [];

  // Extract existing TODOs
  const existingTodos = fullContent.match(/[-*]\s*\[[ x]\]\s*(.+)/g);
  if (existingTodos) {
    existingTodos.forEach(todo => {
      todos.push(todo.replace(/^[-*]\s*\[[ x]\]\s*/, '').trim());
    });
  }

  // Extract TODO comments
  const todoComments = fullContent.match(/(?:TODO|FIXME|XXX):\s*(.+)/gi);
  if (todoComments) {
    todoComments.forEach(todo => {
      todos.push(todo.replace(/^(?:TODO|FIXME|XXX):\s*/i, '').trim());
    });
  }

  // Generate suggested TODOs based on analysis
  if (!fullContent.match(/^---[\s\S]*?---/)) {
    todos.push('Add proper frontmatter');
  }

  if (!fullContent.match(/\[\[/)) {
    todos.push('Add wikilinks to related documents');
  }

  if (!fullContent.match(/^##\s/m)) {
    todos.push('Add section structure with headers');
  }

  return [...new Set(todos)].slice(0, 10);
}

/**
 * Generate summary from content
 */
function generateSummary(body: string, frontmatter: Record<string, unknown>): string {
  // Use existing description
  if (frontmatter.description) {
    return String(frontmatter.description);
  }

  // Extract first meaningful paragraph
  const lines = body.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```') && trimmed.length > 30) {
      return trimmed.length > 200 ? trimmed.slice(0, 197) + '...' : trimmed;
    }
  }

  return 'Documentation requiring summary.';
}

/**
 * Build cross-references between documents
 */
function buildCrossReferences(docs: AnalyzedDoc[]): void {
  const titleMap = new Map<string, AnalyzedDoc>();

  // Build title lookup
  docs.forEach(doc => {
    titleMap.set(doc.title.toLowerCase(), doc);
    titleMap.set(formatFilename(doc.title), doc);
  });

  // Update related links
  docs.forEach(doc => {
    const newRelated: string[] = [];

    doc.related.forEach(link => {
      const linkedDoc = titleMap.get(link.toLowerCase()) || titleMap.get(formatFilename(link));
      if (linkedDoc) {
        newRelated.push(linkedDoc.title);
      } else {
        newRelated.push(link);
      }
    });

    // Find related docs by shared tags
    const sharedTagDocs = docs.filter(other =>
      other !== doc &&
      other.tags.some(t => doc.tags.includes(t))
    );

    sharedTagDocs.slice(0, 3).forEach(other => {
      if (!newRelated.includes(other.title)) {
        newRelated.push(other.title);
      }
    });

    doc.related = [...new Set(newRelated)].slice(0, 10);
  });
}

/**
 * Generate knowledge document content
 */
function generateKnowledgeDoc(
  doc: AnalyzedDoc,
  sourceDir: string,
  linkOriginal: boolean,
  allDocs: AnalyzedDoc[]
): string {
  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  lines.push(`title: "${doc.title}"`);
  lines.push(`type: ${doc.type}`);
  lines.push(`status: active`);
  if (doc.tags.length > 0) {
    lines.push('tags:');
    doc.tags.forEach(tag => lines.push(`  - ${tag}`));
  }
  lines.push(`category: ${doc.category}`);
  lines.push(`description: "${doc.summary.replace(/"/g, '\\"')}"`);
  lines.push(`created: ${new Date().toISOString().split('T')[0]}`);
  lines.push(`updated: ${new Date().toISOString().split('T')[0]}`);
  if (linkOriginal) {
    lines.push(`original: "${sourceDir}/${doc.originalPath}"`);
  }
  if (doc.related.length > 0) {
    lines.push('related:');
    doc.related.slice(0, 5).forEach(r => lines.push(`  - "[[${r}]]"`));
  }
  lines.push('---');
  lines.push('');

  // Title
  lines.push(`# ${doc.title}`);
  lines.push('');

  // Summary
  lines.push('## Overview');
  lines.push('');
  lines.push(doc.summary);
  lines.push('');

  // Original reference
  if (linkOriginal) {
    lines.push(`> [!info] Original Documentation`);
    lines.push(`> See [[${sourceDir}/${doc.originalPath}|original document]] for full details.`);
    lines.push('');
  }

  // Key concepts
  if (doc.concepts.length > 0) {
    lines.push('## Key Concepts');
    lines.push('');
    doc.concepts.forEach(concept => {
      lines.push(`- **${concept}**`);
    });
    lines.push('');
  }

  // Related documents
  if (doc.related.length > 0) {
    lines.push('## Related');
    lines.push('');
    doc.related.forEach(rel => {
      lines.push(`- [[${rel}]]`);
    });
    lines.push('');
  }

  // Research needed
  if (doc.researchNeeded.length > 0) {
    lines.push('## Research Needed');
    lines.push('');
    lines.push('> [!warning] Areas Requiring Further Research');
    doc.researchNeeded.forEach(area => {
      lines.push(`> - ${area}`);
    });
    lines.push('');
  }

  // TODOs
  if (doc.todos.length > 0) {
    lines.push('## TODOs');
    lines.push('');
    doc.todos.forEach(todo => {
      lines.push(`- [ ] ${todo}`);
    });
    lines.push('');
  }

  // Tags section
  lines.push('## Tags');
  lines.push('');
  lines.push(doc.tags.map(t => `#${t}`).join(' '));
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate MOC (Map of Content) for a category
 */
function generateMOC(category: string, docTitles: string[], allDocs: AnalyzedDoc[]): string {
  const config = CATEGORY_STRUCTURE[category];
  const categoryDocs = allDocs.filter(d => d.category.startsWith(category));

  const lines: string[] = [];

  lines.push('---');
  lines.push(`title: "${formatTitle(category)} - Map of Content"`);
  lines.push('type: concept');
  lines.push('status: active');
  lines.push('tags:');
  lines.push('  - moc');
  lines.push(`  - ${category}`);
  lines.push(`created: ${new Date().toISOString().split('T')[0]}`);
  lines.push('---');
  lines.push('');
  lines.push(`# ${formatTitle(category)}`);
  lines.push('');
  lines.push(config?.description || `Documentation related to ${category}.`);
  lines.push('');

  // Group by subcategory
  const bySubcategory = new Map<string, AnalyzedDoc[]>();
  categoryDocs.forEach(doc => {
    const parts = doc.category.split('/');
    const sub = parts[1] || 'general';
    if (!bySubcategory.has(sub)) {
      bySubcategory.set(sub, []);
    }
    bySubcategory.get(sub)!.push(doc);
  });

  for (const [sub, docs] of bySubcategory) {
    lines.push(`## ${formatTitle(sub)}`);
    lines.push('');
    docs.forEach(doc => {
      lines.push(`- [[${doc.title}]] - ${doc.summary.slice(0, 60)}...`);
    });
    lines.push('');
  }

  lines.push('---');
  lines.push(`*${categoryDocs.length} documents in this category*`);

  return lines.join('\n');
}

/**
 * Generate master MOC
 */
function generateMasterMOC(structure: Map<string, string[]>, allDocs: AnalyzedDoc[]): string {
  const lines: string[] = [];

  lines.push('---');
  lines.push('title: "Knowledge Graph - Master Index"');
  lines.push('type: concept');
  lines.push('status: active');
  lines.push('tags:');
  lines.push('  - moc');
  lines.push('  - index');
  lines.push('  - knowledge-graph');
  lines.push(`created: ${new Date().toISOString().split('T')[0]}`);
  lines.push('---');
  lines.push('');
  lines.push('# Knowledge Graph');
  lines.push('');
  lines.push('Welcome to the knowledge graph. This is the master index of all documentation.');
  lines.push('');
  lines.push('## Categories');
  lines.push('');

  for (const [category, config] of Object.entries(CATEGORY_STRUCTURE)) {
    const count = structure.get(category)?.length || 0;
    lines.push(`### [[${category}/_MOC|${formatTitle(category)}]]`);
    lines.push('');
    lines.push(`${config.description}`);
    lines.push(`*${count} documents*`);
    lines.push('');
  }

  lines.push('## Quick Links');
  lines.push('');
  lines.push('- [[PRIMITIVES]] - Core building blocks and technologies');
  lines.push('- [[guides/_MOC|Getting Started]]');
  lines.push('- [[standards/_MOC|Coding Standards]]');
  lines.push('');

  lines.push('## Statistics');
  lines.push('');
  lines.push(`- **Total Documents**: ${allDocs.length}`);
  lines.push(`- **Categories**: ${structure.size}`);
  lines.push(`- **Generated**: ${new Date().toISOString()}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate PRIMITIVES.md
 */
function generatePrimitives(allDocs: AnalyzedDoc[]): string {
  const lines: string[] = [];

  lines.push('---');
  lines.push('title: "Primitives"');
  lines.push('type: primitive');
  lines.push('status: active');
  lines.push('tags:');
  lines.push('  - primitives');
  lines.push('  - foundation');
  lines.push('  - knowledge-graph');
  lines.push(`created: ${new Date().toISOString().split('T')[0]}`);
  lines.push('---');
  lines.push('');
  lines.push('# Primitives');
  lines.push('');
  lines.push('Core building blocks and foundational technologies used in this project.');
  lines.push('');

  // Group docs by type
  const byType = new Map<NodeType, AnalyzedDoc[]>();
  allDocs.forEach(doc => {
    if (!byType.has(doc.type)) {
      byType.set(doc.type, []);
    }
    byType.get(doc.type)!.push(doc);
  });

  for (const [type, docs] of byType) {
    lines.push(`## ${formatTitle(type)}`);
    lines.push('');
    docs.slice(0, 10).forEach(doc => {
      lines.push(`- [[${doc.title}]]`);
    });
    if (docs.length > 10) {
      lines.push(`- *...and ${docs.length - 10} more*`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format filename from title
 */
function formatFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

/**
 * Format title from filename
 */
function formatTitle(filename: string): string {
  return filename
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}
