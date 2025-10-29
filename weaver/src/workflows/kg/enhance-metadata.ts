#!/usr/bin/env tsx
/**
 * Mass Metadata Enhancement Workflow
 * Automatically adds comprehensive metadata to markdown files
 */

import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, relative, basename, dirname } from 'path';
import matter from 'gray-matter';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

interface MetadataV3 {
  title: string;
  type: string;
  status: string;
  phase_id?: string;
  tags?: string[];
  domain?: string[];
  priority?: string;
  aliases?: string[];
  related?: string[];
  visual?: {
    icon?: string;
    color?: string;
    cssclasses?: string[];
  };
  created?: string;
  updated?: string;
  author?: string;
  version?: string;
  dependencies?: string[];
  implements?: string[];
  supersedes?: string;
  keywords?: string[];
}

interface EnhancementConfig {
  targetDir: string;
  schemaPath: string;
  batchSize: number;
  dryRun?: boolean;
  priorityFiles?: string[];
}

interface ProcessingStats {
  total: number;
  enhanced: number;
  skipped: number;
  errors: number;
  validationErrors: number;
}

const stats: ProcessingStats = {
  total: 0,
  enhanced: 0,
  skipped: 0,
  errors: 0,
  validationErrors: 0,
};

// Tag taxonomy
const TAG_TAXONOMY = {
  phase: ['phase-12', 'phase-13', 'phase-14'],
  domain: ['weaver', 'learning-loop', 'knowledge-graph', 'infrastructure', 'perception', 'chunking'],
  type: ['implementation', 'planning', 'research', 'architecture', 'sop', 'hub'],
  priority: ['critical', 'high', 'medium', 'low'],
  status: ['draft', 'in-progress', 'review', 'complete', 'archived'],
};

// Visual styling by type
const VISUAL_STYLES = {
  hub: { icon: '🏠', color: '#4A90E2', cssclasses: ['hub-document'] },
  planning: { icon: '📋', color: '#F5A623', cssclasses: ['planning-document'] },
  implementation: { icon: '⚙️', color: '#7ED321', cssclasses: ['implementation-document'] },
  research: { icon: '🔬', color: '#BD10E0', cssclasses: ['research-document'] },
  architecture: { icon: '🏗️', color: '#50E3C2', cssclasses: ['architecture-document'] },
  sop: { icon: '📖', color: '#B8E986', cssclasses: ['sop-document'] },
  guide: { icon: '🗺️', color: '#9013FE', cssclasses: ['guide-document'] },
  specification: { icon: '📐', color: '#417505', cssclasses: ['spec-document'] },
};

/**
 * Load JSON schema
 */
async function loadSchema(schemaPath: string): Promise<any> {
  const schemaContent = await readFile(schemaPath, 'utf-8');
  return JSON.parse(schemaContent);
}

/**
 * Find all markdown files recursively
 */
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      // Skip node_modules, .git, etc.
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files;
}

/**
 * Analyze document content to extract metadata
 */
function analyzeContent(content: string, filePath: string): Partial<MetadataV3> {
  const metadata: Partial<MetadataV3> = {};
  const fileName = basename(filePath, '.md');
  const dirPath = dirname(filePath);

  // Extract title from first heading or filename
  const headingMatch = content.match(/^#\s+(.+)$/m);
  metadata.title = headingMatch ? headingMatch[1] : fileName.replace(/-/g, ' ');

  // Detect type from content patterns
  if (content.includes('## Hub Navigation') || fileName.includes('-hub')) {
    metadata.type = 'hub';
  } else if (content.includes('## Implementation') || content.includes('## Task')) {
    metadata.type = 'implementation';
  } else if (content.includes('## Research') || content.includes('## Analysis')) {
    metadata.type = 'research';
  } else if (content.includes('## Architecture') || content.includes('## Design')) {
    metadata.type = 'architecture';
  } else if (content.includes('## Planning') || content.includes('## Roadmap')) {
    metadata.type = 'planning';
  } else if (content.includes('## Standard Operating Procedure') || content.includes('## SOP')) {
    metadata.type = 'sop';
  } else if (content.includes('## Guide') || content.includes('## Tutorial')) {
    metadata.type = 'guide';
  } else {
    metadata.type = 'documentation';
  }

  // Detect status
  if (content.includes('## Status: Complete') || content.includes('✅ Complete')) {
    metadata.status = 'complete';
  } else if (content.includes('## Status: In Progress') || content.includes('🚧')) {
    metadata.status = 'in-progress';
  } else if (content.includes('## Status: Draft') || content.includes('📝')) {
    metadata.status = 'draft';
  } else if (content.includes('ARCHIVED') || dirPath.includes('.archive')) {
    metadata.status = 'archived';
  } else {
    metadata.status = 'in-progress';
  }

  // Extract phase ID
  const phaseMatch = content.match(/PHASE[- ](\d+[A-Z]?)/i) || filePath.match(/phase[- ](\d+[A-Z]?)/i);
  if (phaseMatch) {
    metadata.phase_id = `PHASE-${phaseMatch[1].toUpperCase()}`;
  }

  // Generate tags
  const tags: string[] = [];

  // Phase tags
  if (metadata.phase_id) {
    const phaseNum = metadata.phase_id.toLowerCase().replace('phase-', '');
    tags.push(`phase/phase-${phaseNum}`);
  }

  // Type tags
  if (metadata.type) {
    tags.push(`type/${metadata.type}`);
  }

  // Status tags
  if (metadata.status) {
    tags.push(`status/${metadata.status}`);
  }

  // Domain tags from path
  const pathDomains = [
    'learning-loop',
    'knowledge-graph',
    'perception',
    'chunking',
    'embeddings',
    'vault-init',
    'workflow-engine',
    'service-manager',
  ];

  const domains: string[] = [];
  for (const domain of pathDomains) {
    if (filePath.includes(domain)) {
      tags.push(`domain/${domain}`);
      domains.push(domain);
    }
  }

  // Add weaver if in weaver directory
  if (filePath.includes('/weaver/')) {
    domains.push('weaver');
    tags.push('domain/weaver');
  }

  metadata.tags = [...new Set(tags)];
  metadata.domain = domains.length > 0 ? domains : undefined;

  // Detect priority
  if (content.includes('CRITICAL') || content.includes('🚨')) {
    metadata.priority = 'critical';
    tags.push('priority/critical');
  } else if (content.includes('HIGH PRIORITY') || metadata.phase_id?.includes('13') || metadata.phase_id?.includes('14')) {
    metadata.priority = 'high';
    tags.push('priority/high');
  } else if (dirPath.includes('.archive')) {
    metadata.priority = 'low';
    tags.push('priority/low');
  } else {
    metadata.priority = 'medium';
    tags.push('priority/medium');
  }

  // Visual styling
  metadata.visual = VISUAL_STYLES[metadata.type as keyof typeof VISUAL_STYLES] ||
                    { icon: '📄', color: '#8E8E93', cssclasses: ['document'] };

  // Extract keywords from headings
  const headings = content.match(/^#{2,3}\s+(.+)$/gm) || [];
  const keywords = headings
    .map(h => h.replace(/^#{2,3}\s+/, '').toLowerCase())
    .filter(k => k.length > 3);

  if (keywords.length > 0) {
    metadata.keywords = [...new Set(keywords)].slice(0, 10);
  }

  // Timestamps
  metadata.updated = new Date().toISOString();

  return metadata;
}

/**
 * Remove undefined values from object
 */
function removeUndefined(obj: any): any {
  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        result[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      const cleaned = removeUndefined(value);
      if (Object.keys(cleaned).length > 0) {
        result[key] = cleaned;
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Enhance frontmatter with metadata
 */
function enhanceFrontmatter(existingData: any, newMetadata: Partial<MetadataV3>): any {
  // Merge existing with new, preferring existing where present
  const merged = {
    title: existingData.title || newMetadata.title || 'Untitled',
    type: existingData.type || newMetadata.type || 'documentation',
    status: existingData.status || newMetadata.status || 'draft',
    phase_id: existingData.phase_id || newMetadata.phase_id,
    tags: [...new Set([...(existingData.tags || []), ...(newMetadata.tags || [])])],
    domain: existingData.domain || newMetadata.domain,
    priority: existingData.priority || newMetadata.priority,
    aliases: existingData.aliases || newMetadata.aliases,
    related: existingData.related || newMetadata.related,
    visual: { ...(newMetadata.visual || {}), ...(existingData.visual || {}) },
    created: existingData.created || existingData.updated || newMetadata.created,
    updated: newMetadata.updated,
    author: existingData.author || newMetadata.author,
    version: existingData.version || newMetadata.version,
    dependencies: existingData.dependencies || newMetadata.dependencies,
    implements: existingData.implements || newMetadata.implements,
    supersedes: existingData.supersedes || newMetadata.supersedes,
    keywords: [...new Set([...(existingData.keywords || []), ...(newMetadata.keywords || [])])],
  };

  // Remove undefined values
  return removeUndefined(merged);
}

/**
 * Validate metadata against schema
 */
function validateMetadata(metadata: any, schema: any): { valid: boolean; errors?: any[] } {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const valid = validate(metadata);

  return {
    valid,
    errors: validate.errors || undefined,
  };
}

/**
 * Process a single file
 */
async function processFile(
  filePath: string,
  schema: any,
  config: EnhancementConfig
): Promise<boolean> {
  try {
    const fileContent = await readFile(filePath, 'utf-8');
    const parsed = matter(fileContent);

    // Analyze content
    const analyzedMetadata = analyzeContent(parsed.content, filePath);

    // Enhance frontmatter
    const enhancedMetadata = enhanceFrontmatter(parsed.data, analyzedMetadata);

    // Validate
    const validation = validateMetadata(enhancedMetadata, schema);
    if (!validation.valid) {
      console.warn(`⚠️  Validation errors in ${relative(config.targetDir, filePath)}:`);
      console.warn(validation.errors);
      stats.validationErrors++;
      // Continue anyway, fix manually later
    }

    // Update file
    if (!config.dryRun) {
      const newContent = matter.stringify(parsed.content, enhancedMetadata);
      await writeFile(filePath, newContent, 'utf-8');
    }

    console.log(`✅ Enhanced: ${relative(config.targetDir, filePath)}`);
    stats.enhanced++;
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    stats.errors++;
    return false;
  }
}

/**
 * Process files in batches
 */
async function processBatch(
  files: string[],
  schema: any,
  config: EnhancementConfig
): Promise<void> {
  const batches = [];
  for (let i = 0; i < files.length; i += config.batchSize) {
    batches.push(files.slice(i, i + config.batchSize));
  }

  console.log(`📦 Processing ${files.length} files in ${batches.length} batches...`);

  for (let i = 0; i < batches.length; i++) {
    console.log(`\n🔄 Batch ${i + 1}/${batches.length}`);
    const batch = batches[i];

    await Promise.all(
      batch.map(file => processFile(file, schema, config))
    );

    // Small delay between batches
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

/**
 * Main enhancement workflow
 */
async function enhanceMetadata(config: EnhancementConfig): Promise<void> {
  console.log('🚀 Mass Metadata Enhancement Workflow\n');
  console.log(`📂 Target: ${config.targetDir}`);
  console.log(`📋 Schema: ${config.schemaPath}`);
  console.log(`📦 Batch size: ${config.batchSize}`);
  console.log(`${config.dryRun ? '🔍 DRY RUN MODE' : '✍️  WRITE MODE'}\n`);

  // Load schema
  const schema = await loadSchema(config.schemaPath);
  console.log('✅ Schema loaded\n');

  // Find all markdown files
  console.log('🔍 Scanning for markdown files...');
  const allFiles = await findMarkdownFiles(config.targetDir);
  stats.total = allFiles.length;
  console.log(`📄 Found ${allFiles.length} markdown files\n`);

  // Prioritize files
  const priorityFiles = config.priorityFiles || [];
  const prioritySet = new Set(
    allFiles.filter(f =>
      priorityFiles.some(p => f.includes(p)) ||
      f.includes('phase-13') ||
      f.includes('phase-14') ||
      f.includes('-hub.md') ||
      f.includes('architecture')
    )
  );

  const regularFiles = allFiles.filter(f => !prioritySet.has(f));

  console.log(`⭐ Priority files: ${prioritySet.size}`);
  console.log(`📄 Regular files: ${regularFiles.length}\n`);

  // Process priority files first
  if (prioritySet.size > 0) {
    console.log('⭐ Processing priority files first...\n');
    await processBatch(Array.from(prioritySet), schema, config);
  }

  // Process regular files
  if (regularFiles.length > 0) {
    console.log('\n📄 Processing regular files...\n');
    await processBatch(regularFiles, schema, config);
  }

  // Print stats
  console.log('\n📊 Processing Complete!\n');
  console.log(`Total files: ${stats.total}`);
  console.log(`✅ Enhanced: ${stats.enhanced}`);
  console.log(`⏭️  Skipped: ${stats.skipped}`);
  console.log(`⚠️  Validation errors: ${stats.validationErrors}`);
  console.log(`❌ Errors: ${stats.errors}`);
  console.log(`\n📈 Coverage: ${((stats.enhanced / stats.total) * 100).toFixed(1)}%`);
}

// CLI execution
const args = process.argv.slice(2);
const config: EnhancementConfig = {
  targetDir: args.find(a => a.startsWith('--target='))?.split('=')[1] || '/home/aepod/dev/weave-nn/weave-nn',
  schemaPath: args.find(a => a.startsWith('--schema='))?.split('=')[1] || '/home/aepod/dev/weave-nn/weaver/schemas/metadata-v3.schema.json',
  batchSize: parseInt(args.find(a => a.startsWith('--batch-size='))?.split('=')[1] || '50'),
  dryRun: args.includes('--dry-run'),
};

enhanceMetadata(config)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

export { enhanceMetadata, type EnhancementConfig, type MetadataV3 };
