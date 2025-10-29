#!/usr/bin/env bun
/**
 * YAML Wikilink Array Fix Script
 * Phase 14 - Week 2 Cleanup
 *
 * Fixes YAML syntax errors in frontmatter where wikilink arrays
 * are not properly quoted/formatted.
 *
 * Problem:
 *   related_to: [[PROJECT-TIMELINE]], [[BUILD-SUCCESS]]
 *
 * Solution:
 *   related_to:
 *     - "[[PROJECT-TIMELINE]]"
 *     - "[[BUILD-SUCCESS]]"
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Files with known YAML errors
const AFFECTED_FILES = [
  'PHASE-13-FINAL-VALIDATION.md',
  'PHASE-13-NEXT-STEPS.md',
  'PHASE-14-EXECUTIVE-SUMMARY.md',
  'PHASE-14-WEEK-1-2-VALIDATION.md',
  'PHASE-13-DOCUMENTATION-COMPLETE.md',
  'PROJECT-STATUS-SUMMARY.md',
  'TESTER-TO-CODER-HANDOFF.md',
  '_planning/phases/phase-14-revised-workflow-automation.md',
  'BUILD-SUCCESS-REPORT.md',
  'weave-nn/_log/daily/2025-10-22.md',
  'weave-nn/_log/tasks/review_2025-10-22.3.23.3b.23.implement_hooks.automation.33eb0d.md',
];

const ROOT_DIR = process.cwd();
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

/**
 * Fix wikilink array syntax in frontmatter
 */
function fixWikilinkArrays(content: string): { fixed: string; changes: number } {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let changes = 0;
  const fixedLines: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Track frontmatter boundaries
    if (line === '---') {
      inFrontmatter = !inFrontmatter;
      fixedLines.push(line);
      i++;
      continue;
    }

    // Only process lines inside frontmatter
    if (!inFrontmatter) {
      fixedLines.push(line);
      i++;
      continue;
    }

    // Pattern: key: [[link1]], [[link2]], [[link3]]
    const match = line.match(/^(\s*)([a-z_]+):\s*(\[\[.+\]\])(?:,\s*(\[\[.+\]\]))+/i);

    if (match) {
      const indent = match[1];
      const key = match[2];
      const wikilinkString = line.substring(line.indexOf(':') + 1).trim();

      // Extract all wikilinks
      const wikilinks = wikilinkString.match(/\[\[[^\]]+\]\]/g) || [];

      if (wikilinks.length > 0) {
        // Replace with proper YAML array
        fixedLines.push(`${indent}${key}:`);
        for (const link of wikilinks) {
          fixedLines.push(`${indent}  - "${link}"`);
        }
        changes++;

        if (VERBOSE) {
          console.log(`   Fixed: ${key} (${wikilinks.length} links)`);
        }
      } else {
        fixedLines.push(line);
      }
    } else {
      fixedLines.push(line);
    }

    i++;
  }

  return {
    fixed: fixedLines.join('\n'),
    changes,
  };
}

/**
 * Process a single file
 */
function processFile(relativePath: string): { success: boolean; changes: number } {
  const fullPath = join(ROOT_DIR, relativePath);

  try {
    // Read file
    const content = readFileSync(fullPath, 'utf-8');

    // Fix wikilink arrays
    const { fixed, changes } = fixWikilinkArrays(content);

    if (changes === 0) {
      if (VERBOSE) {
        console.log(`⏭️  No changes needed: ${relativePath}`);
      }
      return { success: true, changes: 0 };
    }

    // Write back (unless dry run)
    if (!DRY_RUN) {
      writeFileSync(fullPath, fixed, 'utf-8');
    }

    console.log(`✅ Fixed ${changes} wikilink array(s): ${relativePath}`);
    return { success: true, changes };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error processing ${relativePath}: ${errorMsg}`);
    return { success: false, changes: 0 };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 YAML Wikilink Array Fix\n');
  console.log(`Target files: ${AFFECTED_FILES.length}`);
  console.log(`Dry run: ${DRY_RUN ? 'YES' : 'NO'}\n`);

  let totalFixed = 0;
  let totalChanges = 0;
  let totalErrors = 0;

  for (const file of AFFECTED_FILES) {
    const result = processFile(file);
    if (result.success && result.changes > 0) {
      totalFixed++;
      totalChanges += result.changes;
    } else if (!result.success) {
      totalErrors++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   Total files: ${AFFECTED_FILES.length}`);
  console.log(`   ✅ Fixed: ${totalFixed}`);
  console.log(`   🔧 Total changes: ${totalChanges}`);
  console.log(`   ❌ Errors: ${totalErrors}`);
  console.log('='.repeat(50));

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN - No files were modified');
    console.log('Remove --dry-run to apply changes');
  }

  console.log('\n✨ Done!');
}

// Run
main().catch(console.error);
