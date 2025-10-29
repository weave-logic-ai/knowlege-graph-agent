#!/usr/bin/env bun
/**
 * Batch Metadata Addition Script
 * Phase 14 - Obsidian Visual Properties
 *
 * Adds visual properties to all markdown files in the knowledge graph
 * based on existing frontmatter and file path analysis.
 *
 * Usage:
 *   bun run scripts/add-obsidian-visual-properties.ts [--dry-run] [--path <dir>]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import matter from 'gray-matter';

// Configuration
const config = {
  rootDir: process.cwd(),
  targetDir: process.argv.includes('--path')
    ? process.argv[process.argv.indexOf('--path') + 1]
    : '.',  // Scan all directories by default
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
};

// Type definitions
interface VisualProperties {
  icon?: string;
  color?: string;
  cssclasses?: string[];
  graph_group?: string;
}

interface FrontmatterData {
  title?: string;
  type?: string;
  status?: string;
  phase_id?: string;
  priority?: string;
  domain?: string;
  scope?: string;
  tags?: string[];
  visual?: VisualProperties;
  [key: string]: any;
}

// Icon mappings
const typeIcons: Record<string, string> = {
  planning: '📋',
  implementation: '⚙️',
  research: '🔬',
  architecture: '🏗️',
  testing: '✅',
  documentation: '📚',
  hub: '🌐',
  sop: '📝',
  timeline: '📅',
  decision: '⚖️',
  template: '📄',
  workflow: '🔄',
  integration: '🔌',
  infrastructure: '🏭',
  business: '💼',
  concept: '💡',
};

const statusIcons: Record<string, string> = {
  complete: '✅',
  'in-progress': '🔄',
  blocked: '🚫',
  planned: '📋',
  draft: '✏️',
  review: '👁️',
  archived: '📦',
  deprecated: '⚠️',
  active: '⚡',
  paused: '⏸️',
};

const priorityIcons: Record<string, string> = {
  critical: '🔴',
  high: '🟡',
  medium: '🔵',
  low: '⚪',
};

const phaseIcons: Record<string, string> = {
  'PHASE-12': '🔮',
  'PHASE-13': '🧠',
  'PHASE-14': '🎨',
  'PHASE-15': '🚀',
};

// Color mappings
const typeColors: Record<string, string> = {
  planning: '#3B82F6',
  implementation: '#10B981',
  research: '#8B5CF6',
  architecture: '#F59E0B',
  testing: '#EF4444',
  documentation: '#06B6D4',
  hub: '#EC4899',
  sop: '#84CC16',
  decision: '#A855F7',
  timeline: '#14B8A6',
};

/**
 * Infer document type from file path and content
 */
function inferType(filePath: string, frontmatter: FrontmatterData): string {
  // Check existing frontmatter first
  if (frontmatter.type) {
    return frontmatter.type;
  }

  // Infer from path
  const path = filePath.toLowerCase();

  if (path.includes('_planning')) return 'planning';
  if (path.includes('architecture')) return 'architecture';
  if (path.includes('research')) return 'research';
  if (path.includes('.archive')) return 'timeline';
  if (path.includes('_sops')) return 'sop';
  if (path.includes('decisions')) return 'decision';
  if (path.includes('templates')) return 'template';
  if (path.includes('workflows')) return 'workflow';
  if (path.includes('infrastructure')) return 'infrastructure';
  if (path.includes('business')) return 'business';
  if (path.includes('concepts')) return 'concept';
  if (path.includes('tests') || path.includes('testing')) return 'testing';

  // Check title
  if (frontmatter.title?.includes('Hub')) return 'hub';
  if (frontmatter.title?.includes('Implementation')) return 'implementation';
  if (frontmatter.title?.includes('Research')) return 'research';
  if (frontmatter.title?.includes('Architecture')) return 'architecture';

  // Default
  return 'documentation';
}

/**
 * Infer domain from file path
 */
function inferDomain(filePath: string): string | undefined {
  const path = filePath.toLowerCase();

  if (path.includes('weaver')) return 'weaver';
  if (path.includes('learning-loop')) return 'learning-loop';
  if (path.includes('knowledge-graph') || path.includes('embeddings')) {
    return 'knowledge-graph';
  }
  if (path.includes('infrastructure') || path.includes('docker')) {
    return 'infrastructure';
  }
  if (path.includes('perception')) return 'perception';
  if (path.includes('cultivation')) return 'cultivation';

  return undefined;
}

/**
 * Infer scope from file path and frontmatter
 */
function inferScope(filePath: string, frontmatter: FrontmatterData): string | undefined {
  if (frontmatter.scope) return frontmatter.scope;

  const path = filePath.toLowerCase();
  const isHub = frontmatter.title?.includes('Hub') || path.includes('-hub.md');

  if (isHub) return 'system';
  if (path.includes('index')) return 'system';
  if (path.includes('overview')) return 'system';
  if (path.includes('service') || path.includes('component')) return 'component';
  if (path.includes('feature')) return 'feature';
  if (path.includes('task')) return 'task';

  return undefined;
}

/**
 * Infer priority from frontmatter and context
 */
function inferPriority(frontmatter: FrontmatterData): string | undefined {
  if (frontmatter.priority) return frontmatter.priority;

  // Critical if it's a hub or system-level doc
  if (frontmatter.scope === 'system') return 'high';
  if (frontmatter.type === 'hub') return 'high';

  // High if it's current phase
  if (frontmatter.phase_id === 'PHASE-14') return 'high';
  if (frontmatter.phase_id === 'PHASE-15') return 'high';

  // Medium for most implementation
  if (frontmatter.type === 'implementation') return 'medium';

  return undefined;
}

/**
 * Generate CSS classes array
 */
function generateCssClasses(frontmatter: FrontmatterData): string[] {
  const classes: string[] = [];

  if (frontmatter.type) {
    classes.push(`type-${frontmatter.type}`);
  }

  if (frontmatter.status) {
    classes.push(`status-${frontmatter.status}`);
  }

  if (frontmatter.priority) {
    classes.push(`priority-${frontmatter.priority}`);
  }

  if (frontmatter.phase_id) {
    const phaseName = frontmatter.phase_id.toLowerCase().replace(/_/g, '-');
    classes.push(phaseName);
  }

  if (frontmatter.domain) {
    classes.push(`domain-${frontmatter.domain}`);
  }

  return classes;
}

/**
 * Generate visual properties
 */
function generateVisualProperties(
  filePath: string,
  frontmatter: FrontmatterData
): VisualProperties {
  // Don't override existing visual properties
  if (frontmatter.visual && Object.keys(frontmatter.visual).length > 0) {
    return frontmatter.visual;
  }

  const visual: VisualProperties = {};

  // Determine type if not set
  const type = inferType(filePath, frontmatter);

  // Set icon
  visual.icon = typeIcons[type] || '📄';

  // Set color
  visual.color = typeColors[type];

  // Generate CSS classes
  visual.cssclasses = generateCssClasses({ ...frontmatter, type });

  // Set graph group for hubs
  if (type === 'hub' || frontmatter.scope === 'system') {
    visual.graph_group = 'navigation';
  }

  return visual;
}

/**
 * Remove undefined values from object recursively
 */
function removeUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined).filter((v) => v !== undefined);
  }

  if (obj !== null && typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned;
  }

  return obj;
}

/**
 * Enhance frontmatter with missing properties
 */
function enhanceFrontmatter(
  filePath: string,
  frontmatter: FrontmatterData
): FrontmatterData {
  const enhanced: FrontmatterData = { ...frontmatter };

  // Infer and set type
  if (!enhanced.type) {
    enhanced.type = inferType(filePath, frontmatter);
  }

  // Infer and set domain
  if (!enhanced.domain) {
    const domain = inferDomain(filePath);
    if (domain) enhanced.domain = domain;
  }

  // Infer and set scope
  if (!enhanced.scope) {
    const scope = inferScope(filePath, frontmatter);
    if (scope) enhanced.scope = scope;
  }

  // Infer and set priority
  if (!enhanced.priority) {
    const priority = inferPriority(enhanced);
    if (priority) enhanced.priority = priority;
  }

  // Add visual properties
  enhanced.visual = generateVisualProperties(filePath, enhanced);

  // Add version if not present
  if (!enhanced.version) {
    enhanced.version = '3.0';
  }

  // Add updated_date
  enhanced.updated_date = new Date().toISOString().split('T')[0];

  // Remove all undefined values before serialization
  return removeUndefined(enhanced);
}

/**
 * Process a single markdown file
 */
function processFile(filePath: string): { processed: boolean; error?: string } {
  try {
    // Read file
    const content = readFileSync(filePath, 'utf-8');

    // Parse frontmatter
    const parsed = matter(content);

    // Skip if no frontmatter
    if (!parsed.data || Object.keys(parsed.data).length === 0) {
      if (config.verbose) {
        console.log(`⏭️  Skipping (no frontmatter): ${filePath}`);
      }
      return { processed: false };
    }

    // Enhance frontmatter
    const enhanced = enhanceFrontmatter(filePath, parsed.data);

    // Check if changes were made
    const hasChanges =
      JSON.stringify(parsed.data.visual) !== JSON.stringify(enhanced.visual) ||
      parsed.data.type !== enhanced.type ||
      parsed.data.domain !== enhanced.domain ||
      parsed.data.scope !== enhanced.scope ||
      parsed.data.priority !== enhanced.priority;

    if (!hasChanges) {
      if (config.verbose) {
        console.log(`✓ No changes needed: ${filePath}`);
      }
      return { processed: false };
    }

    // Generate new content
    const newContent = matter.stringify(parsed.content, enhanced);

    // Write back to file (unless dry run)
    if (!config.dryRun) {
      writeFileSync(filePath, newContent, 'utf-8');
    }

    console.log(`✅ Enhanced: ${relative(config.rootDir, filePath)}`);
    if (config.verbose) {
      console.log(`   Type: ${enhanced.type}`);
      console.log(`   Icon: ${enhanced.visual?.icon}`);
      console.log(`   Classes: ${enhanced.visual?.cssclasses?.join(', ')}`);
    }

    return { processed: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error processing ${filePath}: ${errorMsg}`);
    return { processed: false, error: errorMsg };
  }
}

/**
 * Recursively find all markdown files
 */
function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      // Skip node_modules, .git, dist, build, .cache, etc.
      if (
        entry.startsWith('.') ||
        entry === 'node_modules' ||
        entry === 'dist' ||
        entry === 'build' ||
        entry === 'coverage'
      ) {
        continue;
      }

      if (stat.isDirectory()) {
        files.push(...findMarkdownFiles(fullPath));
      } else if (entry.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }

  return files;
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Obsidian Visual Properties Batch Addition\n');
  console.log(`Target directory: ${config.targetDir}`);
  console.log(`Dry run: ${config.dryRun ? 'YES' : 'NO'}\n`);

  // Find all markdown files
  const targetPath = join(config.rootDir, config.targetDir);
  console.log('🔍 Scanning for markdown files...');
  const files = findMarkdownFiles(targetPath);

  console.log(`\n📚 Found ${files.length} markdown files\n`);

  // Process each file
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const result = processFile(file);
    if (result.processed) {
      processed++;
    } else if (result.error) {
      errors++;
    } else {
      skipped++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   Total files: ${files.length}`);
  console.log(`   ✅ Enhanced: ${processed}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log('='.repeat(50));

  if (config.dryRun) {
    console.log('\n⚠️  DRY RUN - No files were modified');
    console.log('Remove --dry-run to apply changes');
  }

  console.log('\n✨ Done!');
}

// Run
main().catch(console.error);
