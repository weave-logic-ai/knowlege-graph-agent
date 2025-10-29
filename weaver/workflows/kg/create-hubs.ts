/**
 * Hub Generator Workflow
 *
 * Creates hub documents that act as central navigation points
 * for different domains, phases, and features in the knowledge graph.
 *
 * @workflow
 */
'use workflow';

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname, relative, basename } from 'path';
import matter from 'gray-matter';

export interface HubConfig {
  hubType: 'root' | 'domain' | 'phase' | 'feature';
  hubLevel: 0 | 1 | 2 | 3;
  domain: string;
  title: string;
  targetDirectory: string;
  parentHub?: string;
  childHubs?: string[];
  description?: string;
}

export interface HubResult {
  hubPath: string;
  documentsLinked: number;
  childHubs: number;
  success: boolean;
  error?: string;
}

export interface DocumentInfo {
  path: string;
  title: string;
  description?: string;
  category?: string;
  priority?: number;
}

/**
 * Main workflow function - creates multiple hubs
 */
export async function createHubs(configs: HubConfig[]): Promise<HubResult[]> {
  console.log(`🏗️  Creating ${configs.length} hub documents...`);

  const results: HubResult[] = [];

  for (const config of configs) {
    try {
      const result = await createHub(config);
      results.push(result);
      console.log(`✅ Created: ${result.hubPath} (${result.documentsLinked} documents)`);
    } catch (error) {
      results.push({
        hubPath: join(config.targetDirectory, `${config.domain.toUpperCase()}-HUB.md`),
        documentsLinked: 0,
        childHubs: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      console.error(`❌ Failed to create hub for ${config.domain}:`, error);
    }
  }

  return results;
}

/**
 * Create a single hub document
 */
async function createHub(config: HubConfig): Promise<HubResult> {
  const rootPath = '/home/aepod/dev/weave-nn';
  const targetDir = join(rootPath, config.targetDirectory);

  // Ensure target directory exists
  await mkdir(targetDir, { recursive: true });

  // Scan directory for documents
  const documents = await scanDocuments(targetDir, config);

  // Group documents by category
  const categorized = categorizeDocuments(documents, config);

  // Generate hub content
  const hubContent = generateHubContent(config, categorized, documents);

  // Write hub file
  const hubFileName = getHubFileName(config);
  const hubPath = join(targetDir, hubFileName);

  await writeFile(hubPath, hubContent, 'utf-8');

  return {
    hubPath: relative(rootPath, hubPath),
    documentsLinked: documents.length,
    childHubs: config.childHubs?.length || 0,
    success: true
  };
}

/**
 * Scan directory for markdown documents
 */
async function scanDocuments(
  dirPath: string,
  config: HubConfig
): Promise<DocumentInfo[]> {
  const documents: DocumentInfo[] = [];

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.includes('HUB')) {
        const fullPath = join(dirPath, entry.name);
        const content = await readFile(fullPath, 'utf-8');
        const { data: frontmatter } = matter(content);

        const docInfo: DocumentInfo = {
          path: entry.name,
          title: frontmatter.title || extractTitle(content) || entry.name.replace('.md', ''),
          description: frontmatter.description || extractFirstParagraph(content),
          category: frontmatter.category || inferCategory(entry.name, config),
          priority: frontmatter.priority || 1
        };

        documents.push(docInfo);
      } else if (entry.isDirectory() && !shouldSkipDirectory(entry.name)) {
        // Check if subdirectory has a hub
        const subHubPath = join(dirPath, entry.name, `${entry.name.toUpperCase()}-HUB.md`);
        try {
          await readFile(subHubPath, 'utf-8');
          documents.push({
            path: join(entry.name, `${entry.name.toUpperCase()}-HUB.md`),
            title: `${entry.name} Hub`,
            description: `Hub document for ${entry.name}`,
            category: 'Child Hubs',
            priority: 0
          });
        } catch {
          // No hub file, skip
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dirPath}:`, error);
  }

  return documents.sort((a, b) => (a.priority || 1) - (b.priority || 1));
}

/**
 * Categorize documents based on naming patterns and metadata
 */
function categorizeDocuments(
  documents: DocumentInfo[],
  config: HubConfig
): Map<string, DocumentInfo[]> {
  const categories = new Map<string, DocumentInfo[]>();

  for (const doc of documents) {
    const category = doc.category || 'Uncategorized';

    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push(doc);
  }

  return categories;
}

/**
 * Generate hub markdown content
 */
function generateHubContent(
  config: HubConfig,
  categorized: Map<string, DocumentInfo[]>,
  allDocuments: DocumentInfo[]
): string {
  const frontmatter = {
    title: config.title,
    hub_type: config.hubType,
    hub_level: config.hubLevel,
    parent_hub: config.parentHub || undefined,
    child_hubs: config.childHubs || undefined,
    domain: config.domain,
    status: 'active',
    created: new Date().toISOString().split('T')[0],
    updated: new Date().toISOString().split('T')[0],
    coverage_percentage: calculateCoverage(allDocuments),
    tags: ['hub', config.domain]
  };

  const parts: string[] = [];

  // Frontmatter
  parts.push('---');
  parts.push(formatYaml(frontmatter));
  parts.push('---');
  parts.push('');

  // Title
  parts.push(`# ${config.title}`);
  parts.push('');

  // Overview
  parts.push('## Overview');
  parts.push('');
  parts.push(config.description || `Hub document for ${config.domain}.`);
  parts.push('');

  // Visual structure
  parts.push('## Visual Structure');
  parts.push('');
  parts.push('```ascii');
  parts.push(generateAsciiDiagram(config, categorized));
  parts.push('```');
  parts.push('');

  // Navigation
  if (config.parentHub || config.childHubs) {
    parts.push('## Navigation');
    parts.push('');

    if (config.parentHub) {
      parts.push('### Parent Hub');
      parts.push(`- [[${config.parentHub}]] - Go up one level`);
      parts.push('');
    }

    if (config.childHubs && config.childHubs.length > 0) {
      parts.push('### Child Hubs');
      for (const childHub of config.childHubs) {
        parts.push(`- [[${childHub}]]`);
      }
      parts.push('');
    }
  }

  // Key documents by category
  parts.push('## Key Documents');
  parts.push('');

  for (const [category, docs] of categorized.entries()) {
    parts.push(`### ${category}`);
    for (const doc of docs) {
      const description = doc.description ? ` - ${doc.description.slice(0, 80)}${doc.description.length > 80 ? '...' : ''}` : '';
      parts.push(`- [[${doc.path}]]${description}`);
    }
    parts.push('');
  }

  // Quick reference
  if (allDocuments.length > 0) {
    parts.push('## Quick Reference');
    parts.push('');
    parts.push('### Most Important');
    const topDocs = allDocuments.slice(0, Math.min(5, allDocuments.length));
    topDocs.forEach((doc, i) => {
      parts.push(`${i + 1}. [[${doc.path}]]`);
    });
    parts.push('');
  }

  // Metadata
  parts.push('## Metadata');
  parts.push('');
  parts.push(`**Total Documents:** ${allDocuments.length}`);
  parts.push(`**Coverage:** ${calculateCoverage(allDocuments)}%`);
  parts.push(`**Last Updated:** ${new Date().toISOString().split('T')[0]}`);
  parts.push('');

  return parts.join('\n');
}

/**
 * Generate ASCII diagram of hub structure
 */
function generateAsciiDiagram(
  config: HubConfig,
  categorized: Map<string, DocumentInfo[]>
): string {
  const width = 40;
  const lines: string[] = [];

  lines.push('┌' + '─'.repeat(width - 2) + '┐');
  lines.push('│' + ` ${config.title}`.padEnd(width - 2) + '│');
  lines.push('├' + '─'.repeat(width - 2) + '┤');
  lines.push('│' + ' '.repeat(width - 2) + '│');

  const categories = Array.from(categorized.keys()).slice(0, 3);
  const boxWidth = Math.floor((width - 4 - (categories.length - 1) * 2) / categories.length);

  let boxRow = '│ ';
  for (const category of categories) {
    const label = category.slice(0, boxWidth - 2);
    boxRow += '┌' + '─'.repeat(boxWidth - 2) + '┐ ';
  }
  lines.push(boxRow.padEnd(width - 1) + '│');

  boxRow = '│ ';
  for (const category of categories) {
    const label = category.slice(0, boxWidth - 2).padEnd(boxWidth - 2);
    boxRow += '│' + label + '│ ';
  }
  lines.push(boxRow.padEnd(width - 1) + '│');

  boxRow = '│ ';
  for (const category of categories) {
    boxRow += '└' + '─'.repeat(boxWidth - 2) + '┘ ';
  }
  lines.push(boxRow.padEnd(width - 1) + '│');

  lines.push('│' + ' '.repeat(width - 2) + '│');
  lines.push('└' + '─'.repeat(width - 2) + '┘');

  return lines.join('\n');
}

/**
 * Calculate metadata coverage percentage
 */
function calculateCoverage(documents: DocumentInfo[]): number {
  if (documents.length === 0) return 0;

  const withMetadata = documents.filter(
    doc => doc.description || doc.category
  ).length;

  return Math.round((withMetadata / documents.length) * 100);
}

/**
 * Format object as YAML
 */
function formatYaml(obj: Record<string, any>): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${item}`);
      }
    } else if (typeof value === 'object') {
      lines.push(`${key}:`);
      for (const [subKey, subValue] of Object.entries(value)) {
        lines.push(`  ${subKey}: ${subValue}`);
      }
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  return lines.join('\n');
}

/**
 * Get hub filename based on config
 */
function getHubFileName(config: HubConfig): string {
  if (config.hubType === 'root') {
    return 'WEAVE-NN-HUB.md';
  }
  return `${config.domain.toUpperCase()}-HUB.md`;
}

/**
 * Extract title from markdown content
 */
function extractTitle(content: string): string | null {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : null;
}

/**
 * Extract first paragraph from markdown
 */
function extractFirstParagraph(content: string): string | null {
  const { content: markdownContent } = matter(content);
  const paragraphs = markdownContent.split('\n\n');

  for (const para of paragraphs) {
    const cleaned = para.replace(/^#+\s+/, '').trim();
    if (cleaned && !cleaned.startsWith('#') && cleaned.length > 20) {
      return cleaned.slice(0, 150);
    }
  }

  return null;
}

/**
 * Infer category from filename and config
 */
function inferCategory(filename: string, config: HubConfig): string {
  if (filename.startsWith('PHASE-')) return 'Phase Documents';
  if (filename.includes('-HUB')) return 'Child Hubs';
  if (filename.includes('spec')) return 'Specifications';
  if (filename.includes('guide')) return 'Guides';
  if (filename.includes('architecture')) return 'Architecture';
  if (filename.includes('design')) return 'Design';
  if (filename.includes('implementation')) return 'Implementation';
  if (filename.includes('test')) return 'Testing';

  return 'General';
}

/**
 * Check if directory should be skipped
 */
function shouldSkipDirectory(name: string): boolean {
  return name.startsWith('.') || name === 'node_modules';
}
