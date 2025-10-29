#!/usr/bin/env node
/**
 * Add Icons to Existing Files
 *
 * Batch processor to add visual.icon frontmatter to files based on:
 * - File path patterns
 * - Existing tags
 * - Document type
 * - Status and priority
 */

import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import matter from 'gray-matter';
import path from 'path';

interface IconMapping {
  pattern: RegExp | string;
  icon: string;
  cssClass?: string;
  description?: string;
}

// Icon mappings based on file patterns and content
const pathIconMappings: IconMapping[] = [
  // Type-based (path patterns)
  { pattern: /_planning\//, icon: '📋', cssClass: 'type-planning', description: 'Planning' },
  { pattern: /architecture\//, icon: '🏗️', cssClass: 'type-architecture', description: 'Architecture' },
  { pattern: /research\//, icon: '🔬', cssClass: 'type-research', description: 'Research' },
  { pattern: /tests?\//, icon: '✅', cssClass: 'type-testing', description: 'Testing' },
  { pattern: /docs\//, icon: '📚', cssClass: 'type-documentation', description: 'Documentation' },
  { pattern: /weaver\/src\//, icon: '⚙️', cssClass: 'type-implementation', description: 'Implementation' },
  { pattern: /workflows\//, icon: '🔄', cssClass: 'type-workflow', description: 'Workflow' },
  { pattern: /decisions\//, icon: '⚖️', cssClass: 'type-decision', description: 'Decision' },
  { pattern: /integrations\//, icon: '🔌', cssClass: 'type-integration', description: 'Integration' },
  { pattern: /infrastructure\//, icon: '🏭', cssClass: 'type-infrastructure', description: 'Infrastructure' },
  { pattern: /business\//, icon: '💼', cssClass: 'type-business', description: 'Business' },
  { pattern: /concepts\//, icon: '💡', cssClass: 'type-concept', description: 'Concept' },
  { pattern: /templates\//, icon: '📄', cssClass: 'type-template', description: 'Template' },
  { pattern: /_log\/|daily\//, icon: '📅', cssClass: 'type-timeline', description: 'Timeline' },
  { pattern: /_sops?\//, icon: '📝', cssClass: 'type-sop', description: 'SOP' },

  // Hub files
  { pattern: /-hub\.md$/, icon: '🌐', cssClass: 'type-hub', description: 'Hub' },
  { pattern: /-index\.md$/, icon: '🌐', cssClass: 'type-hub', description: 'Index' },
];

const tagIconMappings: Record<string, string> = {
  // Status
  'status/complete': '✅',
  'status/in-progress': '🔄',
  'status/blocked': '🚫',
  'status/planned': '📋',
  'status/draft': '✏️',
  'status/review': '👁️',
  'status/archived': '📦',
  'status/deprecated': '⚠️',

  // Priority
  'priority/critical': '🔴',
  'priority/high': '🟡',
  'priority/medium': '🔵',
  'priority/low': '⚪',

  // Phase
  'phase/phase-12': '🔮',
  'phase/phase-13': '🧠',
  'phase/phase-14': '🎨',
  'phase/phase-15': '🚀',

  // Type (backup if path doesn't match)
  'type/planning': '📋',
  'type/implementation': '⚙️',
  'type/research': '🔬',
  'type/architecture': '🏗️',
  'type/testing': '✅',
  'type/documentation': '📚',
};

function determineIcon(filePath: string, frontmatter: any): string | null {
  // Priority 1: Check if icon already exists
  if (frontmatter.visual?.icon) {
    return null; // Already has icon, skip
  }

  // Priority 2: Check tags for specific icons
  const tags = frontmatter.tags || [];
  const tagList = Array.isArray(tags) ? tags : [tags];

  for (const tag of tagList) {
    const tagStr = typeof tag === 'string' ? tag : String(tag);
    if (tagIconMappings[tagStr]) {
      return tagIconMappings[tagStr];
    }
  }

  // Priority 3: Check path patterns
  for (const mapping of pathIconMappings) {
    if (typeof mapping.pattern === 'string') {
      if (filePath.includes(mapping.pattern)) {
        return mapping.icon;
      }
    } else {
      if (mapping.pattern.test(filePath)) {
        return mapping.icon;
      }
    }
  }

  // Priority 4: Check document type in frontmatter
  const type = frontmatter.type;
  if (type) {
    const typeTag = `type/${type}`;
    if (tagIconMappings[typeTag]) {
      return tagIconMappings[typeTag];
    }
  }

  return null;
}

function determineCssClasses(filePath: string, frontmatter: any): string[] {
  const classes: string[] = [];

  // Add type class
  if (frontmatter.type) {
    classes.push(`type-${frontmatter.type}`);
  }

  // Add status class
  if (frontmatter.status) {
    classes.push(`status-${frontmatter.status}`);
  }

  // Add priority class
  if (frontmatter.priority) {
    classes.push(`priority-${frontmatter.priority}`);
  }

  // Add phase class
  const tags = frontmatter.tags || [];
  const tagList = Array.isArray(tags) ? tags : [tags];

  for (const tag of tagList) {
    const tagStr = String(tag);
    if (tagStr.startsWith('phase/')) {
      classes.push(tagStr.replace('/', '-'));
    }
  }

  return classes;
}

async function processFile(filePath: string, dryRun: boolean = false): Promise<boolean> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const { data: frontmatter, content: markdownContent } = matter(content);

    const icon = determineIcon(filePath, frontmatter);
    if (!icon) {
      return false; // No icon to add
    }

    // Determine CSS classes
    const cssClasses = determineCssClasses(filePath, frontmatter);

    // Add visual metadata
    if (!frontmatter.visual) {
      frontmatter.visual = {};
    }

    frontmatter.visual.icon = icon;

    // Add CSS classes if not already present
    if (cssClasses.length > 0) {
      const existingClasses = frontmatter.cssclasses || frontmatter.visual.cssclasses || [];
      const mergedClasses = [...new Set([...existingClasses, ...cssClasses])];
      frontmatter.visual.cssclasses = mergedClasses;
    }

    // Write back
    if (!dryRun) {
      const updatedContent = matter.stringify(markdownContent, frontmatter);
      await writeFile(filePath, updatedContent, 'utf-8');
    }

    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const rootDir = process.argv[2] || '/home/aepod/dev/weave-nn/weave-nn';

  console.log(`🎨 Adding icons to markdown files...`);
  console.log(`   Root: ${rootDir}`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  // Find all markdown files
  const pattern = `${rootDir}/**/*.md`;
  const files = await glob(pattern, {
    ignore: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
    ],
  });

  console.log(`📄 Found ${files.length} markdown files\n`);

  let processed = 0;
  let updated = 0;
  let errors = 0;

  for (const file of files) {
    processed++;

    try {
      const wasUpdated = await processFile(file, dryRun);
      if (wasUpdated) {
        updated++;
        const relativePath = path.relative(rootDir, file);
        console.log(`✅ ${relativePath}`);
      }
    } catch (error) {
      errors++;
      console.error(`❌ ${file}: ${error instanceof Error ? error.message : error}`);
    }

    // Progress indicator
    if (processed % 100 === 0) {
      console.log(`   Progress: ${processed}/${files.length} (${updated} updated)`);
    }
  }

  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${processed}`);
  console.log(`   Files updated: ${updated}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Success rate: ${((updated / processed) * 100).toFixed(1)}%`);

  if (dryRun) {
    console.log(`\n💡 This was a dry run. Run without --dry-run to apply changes.`);
  } else {
    console.log(`\n✅ Icons added successfully!`);
    console.log(`\n🔄 Next steps:`);
    console.log(`   1. Open Obsidian and verify icons appear in frontmatter`);
    console.log(`   2. Configure icon display plugins`);
    console.log(`   3. Enable graph view icons`);
    console.log(`   4. Test icon display in all views`);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
