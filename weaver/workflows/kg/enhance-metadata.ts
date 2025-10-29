/**
 * Metadata Enhancement Workflow
 *
 * Enhances markdown files with proper frontmatter metadata including:
 * - Inferred tags based on content
 * - Relationships to other documents
 * - Automatic categorization
 * - Schema validation
 *
 * @workflow
 */
'use workflow';

import { readFile, writeFile } from 'fs/promises';
import { join, basename, dirname, relative } from 'path';
import matter from 'gray-matter';
import { analyzeStructure, type StructureAnalysis, type DirectoryNode } from './analyze-structure';

export interface MetadataConfig {
  inferTags: boolean;
  inferRelations: boolean;
  validateSchema: boolean;
  autoFix: boolean;
}

export interface MetadataResult {
  filesProcessed: number;
  filesUpdated: number;
  filesSkipped: number;
  errors: Array<{ file: string; error: string }>;
}

export interface EnhancedMetadata {
  title?: string;
  description?: string;
  created?: string;
  updated?: string;
  status?: 'active' | 'archived' | 'deprecated' | 'draft';
  tags?: string[];
  category?: string;
  phase?: number;
  related?: string[];
  parent?: string;
  children?: string[];
  [key: string]: any;
}

/**
 * Main workflow function
 */
export async function enhanceMetadata(
  config: MetadataConfig,
  rootPath: string = '/home/aepod/dev/weave-nn'
): Promise<MetadataResult> {
  console.log('🔧 Enhancing metadata for all markdown files...');

  // First, analyze the structure to get all files
  const analysis = await analyzeStructure(rootPath);

  const result: MetadataResult = {
    filesProcessed: 0,
    filesUpdated: 0,
    filesSkipped: 0,
    errors: []
  };

  // Process files that are missing metadata
  for (const filePath of analysis.missingMetadata) {
    try {
      const fullPath = join(rootPath, filePath);
      const updated = await enhanceFile(fullPath, config, analysis);

      result.filesProcessed++;
      if (updated) {
        result.filesUpdated++;
      } else {
        result.filesSkipped++;
      }
    } catch (error) {
      result.errors.push({
        file: filePath,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  console.log('✅ Metadata enhancement complete!');
  console.log(`   Processed: ${result.filesProcessed}`);
  console.log(`   Updated: ${result.filesUpdated}`);
  console.log(`   Skipped: ${result.filesSkipped}`);
  console.log(`   Errors: ${result.errors.length}`);

  return result;
}

/**
 * Enhance a single file with metadata
 */
async function enhanceFile(
  filePath: string,
  config: MetadataConfig,
  analysis: StructureAnalysis
): Promise<boolean> {
  const content = await readFile(filePath, 'utf-8');
  const { data: existingMeta, content: markdownContent } = matter(content);

  // Generate enhanced metadata
  const enhanced = await generateMetadata(
    filePath,
    markdownContent,
    existingMeta,
    config,
    analysis
  );

  // Skip if no changes
  if (JSON.stringify(enhanced) === JSON.stringify(existingMeta)) {
    return false;
  }

  // Validate if requested
  if (config.validateSchema && !validateMetadata(enhanced)) {
    if (!config.autoFix) {
      throw new Error('Invalid metadata schema');
    }
    // Auto-fix would go here
  }

  // Write updated file
  const updatedContent = matter.stringify(markdownContent, enhanced);
  await writeFile(filePath, updatedContent, 'utf-8');

  return true;
}

/**
 * Generate metadata for a document
 */
async function generateMetadata(
  filePath: string,
  content: string,
  existing: Record<string, any>,
  config: MetadataConfig,
  analysis: StructureAnalysis
): Promise<EnhancedMetadata> {
  const metadata: EnhancedMetadata = { ...existing };

  // Title
  if (!metadata.title) {
    metadata.title = extractTitle(content) || inferTitle(filePath);
  }

  // Description
  if (!metadata.description) {
    metadata.description = extractDescription(content);
  }

  // Dates
  if (!metadata.created) {
    metadata.created = new Date().toISOString().split('T')[0];
  }
  metadata.updated = new Date().toISOString().split('T')[0];

  // Status
  if (!metadata.status) {
    metadata.status = inferStatus(filePath);
  }

  // Tags
  if (config.inferTags && (!metadata.tags || metadata.tags.length === 0)) {
    metadata.tags = inferTags(filePath, content);
  }

  // Category
  if (!metadata.category) {
    metadata.category = inferCategory(filePath);
  }

  // Phase
  if (!metadata.phase) {
    const phase = extractPhase(filePath, content);
    if (phase) metadata.phase = phase;
  }

  // Relations
  if (config.inferRelations) {
    const relations = inferRelations(filePath, content, analysis);
    if (relations.related.length > 0) metadata.related = relations.related;
    if (relations.parent) metadata.parent = relations.parent;
    if (relations.children.length > 0) metadata.children = relations.children;
  }

  return metadata;
}

/**
 * Extract title from content
 */
function extractTitle(content: string): string | null {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : null;
}

/**
 * Infer title from filename
 */
function inferTitle(filePath: string): string {
  const filename = basename(filePath, '.md');
  return filename
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extract description from content
 */
function extractDescription(content: string): string | undefined {
  const paragraphs = content.split('\n\n');

  for (const para of paragraphs) {
    const cleaned = para.replace(/^#+\s+/, '').trim();
    if (cleaned && !cleaned.startsWith('#') && cleaned.length > 20) {
      return cleaned.slice(0, 200);
    }
  }

  return undefined;
}

/**
 * Infer status from file path
 */
function inferStatus(filePath: string): 'active' | 'archived' | 'deprecated' | 'draft' {
  if (filePath.includes('.archive')) return 'archived';
  if (filePath.includes('deprecated')) return 'deprecated';
  if (filePath.includes('draft')) return 'draft';
  return 'active';
}

/**
 * Infer tags from file path and content
 */
function inferTags(filePath: string, content: string): string[] {
  const tags = new Set<string>();

  // From path
  const pathParts = filePath.split('/');
  for (const part of pathParts) {
    if (part.startsWith('_')) continue;
    if (part.includes('phase')) tags.add('phase');
    if (part.includes('docs')) tags.add('documentation');
    if (part.includes('planning')) tags.add('planning');
    if (part.includes('architecture')) tags.add('architecture');
    if (part.includes('research')) tags.add('research');
  }

  // From content keywords
  const keywords = [
    'workflow',
    'agent',
    'mcp',
    'vault',
    'learning',
    'perception',
    'chunking',
    'embedding',
    'knowledge-graph',
    'cli',
    'service'
  ];

  const lowerContent = content.toLowerCase();
  for (const keyword of keywords) {
    if (lowerContent.includes(keyword)) {
      tags.add(keyword);
    }
  }

  // Filename tags
  const filename = basename(filePath, '.md').toLowerCase();
  if (filename.includes('hub')) tags.add('hub');
  if (filename.includes('spec')) tags.add('specification');
  if (filename.includes('guide')) tags.add('guide');
  if (filename.includes('implementation')) tags.add('implementation');
  if (filename.includes('test')) tags.add('testing');

  return Array.from(tags);
}

/**
 * Infer category from file path
 */
function inferCategory(filePath: string): string {
  if (filePath.includes('_planning')) return 'Planning';
  if (filePath.includes('/docs')) return 'Documentation';
  if (filePath.includes('/architecture')) return 'Architecture';
  if (filePath.includes('/research')) return 'Research';
  if (filePath.includes('/src')) return 'Implementation';
  if (filePath.includes('/tests')) return 'Testing';
  if (filePath.includes('.archive')) return 'Archive';

  return 'General';
}

/**
 * Extract phase number from file path or content
 */
function extractPhase(filePath: string, content: string): number | null {
  // From filename
  const filenameMatch = basename(filePath).match(/phase[-_]?(\d+)/i);
  if (filenameMatch) return parseInt(filenameMatch[1], 10);

  // From content
  const contentMatch = content.match(/##?\s*Phase\s+(\d+)/i);
  if (contentMatch) return parseInt(contentMatch[1], 10);

  return null;
}

/**
 * Infer relationships to other documents
 */
function inferRelations(
  filePath: string,
  content: string,
  analysis: StructureAnalysis
): { related: string[]; parent?: string; children: string[] } {
  const related: string[] = [];
  let parent: string | undefined;
  const children: string[] = [];

  // Extract existing wikilinks as related
  const wikilinkPattern = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let match;

  while ((match = wikilinkPattern.exec(content)) !== null) {
    const target = match[1].trim();
    related.push(target);
  }

  // Determine parent hub
  const dirPath = dirname(filePath);
  const hubPath = join(dirPath, `${basename(dirPath).toUpperCase()}-HUB.md`);

  // Check if hub exists in analysis
  for (const dir of analysis.directories) {
    if (dir.path === relative('/home/aepod/dev/weave-nn', hubPath)) {
      parent = basename(hubPath);
      break;
    }
  }

  return { related: Array.from(new Set(related)), parent, children };
}

/**
 * Validate metadata against schema
 */
function validateMetadata(metadata: EnhancedMetadata): boolean {
  // Required fields
  if (!metadata.title) return false;
  if (!metadata.status) return false;

  // Valid status values
  const validStatuses = ['active', 'archived', 'deprecated', 'draft'];
  if (metadata.status && !validStatuses.includes(metadata.status)) return false;

  // Tags should be array
  if (metadata.tags && !Array.isArray(metadata.tags)) return false;

  // Phase should be number
  if (metadata.phase && typeof metadata.phase !== 'number') return false;

  return true;
}
