/**
 * Knowledge Graph Generator
 *
 * Scans documentation and generates a knowledge graph from markdown files.
 */

import { readFileSync, statSync } from 'fs';
import { join, basename, relative, extname } from 'path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import type {
  KnowledgeNode,
  NodeType,
  NodeStatus,
  NodeLink,
  NodeFrontmatter,
  GeneratorOptions,
  GeneratedDocument,
} from '../core/types.js';
import { KnowledgeGraphManager } from '../core/graph.js';
import { KnowledgeGraphDatabase } from '../core/database.js';

/**
 * Link extraction patterns
 */
const WIKILINK_PATTERN = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Generate knowledge graph from docs directory
 */
export async function generateGraph(options: GeneratorOptions): Promise<{
  graph: KnowledgeGraphManager;
  stats: {
    filesScanned: number;
    nodesCreated: number;
    edgesCreated: number;
    errors: string[];
  };
}> {
  const { projectRoot, outputPath } = options;

  const stats = {
    filesScanned: 0,
    nodesCreated: 0,
    edgesCreated: 0,
    errors: [] as string[],
  };

  // Create graph manager
  const graph = new KnowledgeGraphManager(
    basename(projectRoot),
    projectRoot
  );

  // Find all markdown files
  const files = await fg('**/*.md', {
    cwd: outputPath,
    ignore: ['node_modules/**', '.git/**', '_templates/**'],
    absolute: true,
  });

  stats.filesScanned = files.length;

  // First pass: Create all nodes
  const nodeMap = new Map<string, KnowledgeNode>();

  for (const filePath of files) {
    try {
      const node = await parseMarkdownFile(filePath, outputPath);
      nodeMap.set(node.id, node);
      stats.nodesCreated++;
    } catch (error) {
      stats.errors.push(`Failed to parse ${filePath}: ${error}`);
    }
  }

  // Second pass: Resolve links and add to graph
  for (const node of nodeMap.values()) {
    // Resolve outgoing links
    const resolvedLinks: NodeLink[] = [];

    for (const link of node.outgoingLinks) {
      // Try to resolve the link target
      const targetId = resolveLink(link.target, node.path, nodeMap);

      if (targetId) {
        resolvedLinks.push({
          ...link,
          target: targetId,
        });

        // Create backlink in target node
        const targetNode = nodeMap.get(targetId);
        if (targetNode) {
          targetNode.incomingLinks.push({
            target: node.id,
            type: 'backlink',
            text: node.title,
          });
        }

        stats.edgesCreated++;
      }
    }

    node.outgoingLinks = resolvedLinks;
    graph.addNode(node);
  }

  return { graph, stats };
}

/**
 * Generate graph and save to database
 */
export async function generateAndSave(
  options: GeneratorOptions,
  dbPath: string
): Promise<{
  success: boolean;
  stats: {
    filesScanned: number;
    nodesCreated: number;
    edgesCreated: number;
    errors: string[];
  };
}> {
  const { graph, stats } = await generateGraph(options);

  // Save to database
  const db = new KnowledgeGraphDatabase(dbPath);

  try {
    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges();

    for (const node of nodes) {
      db.upsertNode(node);
    }

    for (const edge of edges) {
      db.addEdge(edge);
    }

    db.setMetadata('lastGenerated', new Date().toISOString());
    db.setMetadata('nodeCount', String(stats.nodesCreated));
    db.setMetadata('edgeCount', String(stats.edgesCreated));

    return { success: true, stats };
  } catch (error) {
    stats.errors.push(`Database error: ${error}`);
    return { success: false, stats };
  } finally {
    db.close();
  }
}

/**
 * Parse a markdown file into a knowledge node
 */
async function parseMarkdownFile(
  filePath: string,
  docsRoot: string
): Promise<KnowledgeNode> {
  const content = readFileSync(filePath, 'utf-8');
  const stat = statSync(filePath);
  const { data, content: body } = matter(content);

  // Extract filename and path
  const filename = basename(filePath, '.md');
  const relativePath = relative(docsRoot, filePath);

  // Generate ID from relative path
  const id = relativePath
    .replace(/\.md$/, '')
    .replace(/\\/g, '/')
    .replace(/[^a-z0-9/]+/gi, '-')
    .toLowerCase();

  // Extract links from content
  const outgoingLinks = extractLinks(body);

  // Determine node type from frontmatter or path
  const type = inferNodeType(data.type, relativePath);
  const status = (data.status as NodeStatus) || 'active';

  // Build frontmatter
  const frontmatter: NodeFrontmatter = {
    title: data.title || formatTitle(filename),
    type,
    status,
    tags: Array.isArray(data.tags) ? data.tags : [],
    category: data.category,
    description: data.description,
    created: data.created || stat.birthtime.toISOString().split('T')[0],
    updated: data.updated || stat.mtime.toISOString().split('T')[0],
    aliases: data.aliases,
    related: data.related,
    ...data,
  };

  // Calculate word count
  const wordCount = body
    .replace(/[#*`\[\]()]/g, '')
    .split(/\s+/)
    .filter(Boolean).length;

  return {
    id,
    path: relativePath,
    filename,
    title: frontmatter.title || formatTitle(filename),
    type,
    status,
    content: body,
    frontmatter,
    tags: frontmatter.tags || [],
    outgoingLinks,
    incomingLinks: [], // Will be filled in second pass
    wordCount,
    lastModified: stat.mtime,
  };
}

/**
 * Extract links from markdown content
 */
function extractLinks(content: string): NodeLink[] {
  const links: NodeLink[] = [];
  const seen = new Set<string>();

  // Extract wikilinks
  let match: RegExpExecArray | null;
  while ((match = WIKILINK_PATTERN.exec(content)) !== null) {
    const target = match[1].trim();
    const text = match[2]?.trim();

    if (!seen.has(target)) {
      seen.add(target);
      links.push({
        target,
        type: 'wikilink',
        text,
      });
    }
  }

  // Extract markdown links (only internal ones)
  while ((match = MARKDOWN_LINK_PATTERN.exec(content)) !== null) {
    const text = match[1].trim();
    const target = match[2].trim();

    // Skip external URLs
    if (target.startsWith('http://') || target.startsWith('https://')) {
      continue;
    }

    if (!seen.has(target)) {
      seen.add(target);
      links.push({
        target,
        type: 'markdown',
        text,
      });
    }
  }

  return links;
}

/**
 * Resolve a link target to a node ID
 */
function resolveLink(
  target: string,
  currentPath: string,
  nodeMap: Map<string, KnowledgeNode>
): string | null {
  // Clean target
  const cleanTarget = target
    .replace(/\.md$/, '')
    .replace(/^\.\//, '')
    .toLowerCase();

  // Try direct match
  for (const [id, node] of nodeMap) {
    // Match by ID
    if (id === cleanTarget) {
      return id;
    }

    // Match by filename
    if (node.filename.toLowerCase() === cleanTarget) {
      return id;
    }

    // Match by title
    if (node.title.toLowerCase() === cleanTarget) {
      return id;
    }

    // Match by alias
    if (node.frontmatter.aliases?.some(
      a => a.toLowerCase() === cleanTarget
    )) {
      return id;
    }
  }

  // Try relative path resolution
  const currentDir = currentPath.replace(/[^/]+$/, '');
  const relativePath = join(currentDir, cleanTarget)
    .replace(/\\/g, '/')
    .replace(/^\//, '');

  for (const [id, node] of nodeMap) {
    if (id === relativePath || node.path.replace(/\.md$/, '') === relativePath) {
      return id;
    }
  }

  return null;
}

/**
 * Infer node type from frontmatter or path
 */
function inferNodeType(declaredType: unknown, path: string): NodeType {
  // Use declared type if valid
  const validTypes: NodeType[] = [
    'concept', 'technical', 'feature', 'primitive',
    'service', 'guide', 'standard', 'integration',
  ];

  if (typeof declaredType === 'string' && validTypes.includes(declaredType as NodeType)) {
    return declaredType as NodeType;
  }

  // Infer from path
  const pathLower = path.toLowerCase();

  if (pathLower.includes('concept')) return 'concept';
  if (pathLower.includes('component') || pathLower.includes('technical')) return 'technical';
  if (pathLower.includes('feature')) return 'feature';
  if (pathLower.includes('primitive') || pathLower.includes('integration')) return 'primitive';
  if (pathLower.includes('service') || pathLower.includes('api')) return 'service';
  if (pathLower.includes('guide') || pathLower.includes('tutorial')) return 'guide';
  if (pathLower.includes('standard')) return 'standard';
  if (pathLower.includes('reference')) return 'technical';

  return 'concept'; // Default
}

/**
 * Format filename as title
 */
function formatTitle(filename: string): string {
  return filename
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Generate graph from existing database (incremental update)
 */
export async function updateGraph(
  dbPath: string,
  docsRoot: string
): Promise<{
  added: number;
  updated: number;
  removed: number;
  errors: string[];
}> {
  const result = {
    added: 0,
    updated: 0,
    removed: 0,
    errors: [] as string[],
  };

  const db = new KnowledgeGraphDatabase(dbPath);

  try {
    // Get existing nodes
    const existingNodes = db.getAllNodes();
    const existingPaths = new Set(existingNodes.map(n => n.path));

    // Find current files
    const currentFiles = await fg('**/*.md', {
      cwd: docsRoot,
      ignore: ['node_modules/**', '.git/**', '_templates/**'],
    });
    const currentPaths = new Set(currentFiles);

    // Find removed files
    for (const node of existingNodes) {
      if (!currentPaths.has(node.path)) {
        db.deleteNode(node.id);
        result.removed++;
      }
    }

    // Process current files
    for (const filePath of currentFiles) {
      const fullPath = join(docsRoot, filePath);

      try {
        const node = await parseMarkdownFile(fullPath, docsRoot);

        if (existingPaths.has(filePath)) {
          // Check if file was modified
          const existing = existingNodes.find(n => n.path === filePath);
          if (existing && node.lastModified > existing.lastModified) {
            db.deleteNodeEdges(node.id);
            db.upsertNode(node);
            result.updated++;
          }
        } else {
          db.upsertNode(node);
          result.added++;
        }
      } catch (error) {
        result.errors.push(`Failed to process ${filePath}: ${error}`);
      }
    }

    db.setMetadata('lastUpdated', new Date().toISOString());
  } finally {
    db.close();
  }

  return result;
}
