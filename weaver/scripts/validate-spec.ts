#!/usr/bin/env tsx
/**
 * Phase Document Validation Script
 *
 * Validates phase documents for spec-kit workflow compatibility:
 * 1. Has "## 📋 Implementation Tasks" section
 * 2. Tasks use "### X.Y Task Name" format
 * 3. Metadata has required camelCase fields
 * 4. Provides actionable fix suggestions
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  line?: number;
  suggestion?: string;
}

interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  taskCount: number;
  hasMetadata: boolean;
}

const VAULT_PATH =
  process.env['VAULT_PATH'] || '/home/aepod/dev/weave-nn/weave-nn';
const PHASES_DIR = join(VAULT_PATH, '_planning/phases');
const SPECS_DIR = join(VAULT_PATH, '_planning/specs');

/**
 * Validate phase document format
 */
function validatePhaseDocument(content: string, filePath: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  const lines = content.split('\n');
  let taskCount = 0;
  let hasTaskSection = false;

  // Check for Implementation Tasks section
  const hasTasksSection = content.match(/##\s+📋\s+Implementation\s+Tasks/i);
  if (!hasTasksSection) {
    issues.push({
      type: 'error',
      message: 'Missing "## 📋 Implementation Tasks" section header',
      suggestion:
        'Add the following header to your phase document:\n## 📋 Implementation Tasks',
    });
  } else {
    hasTaskSection = true;
  }

  // Validate task format
  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for task headers
    if (line.match(/^###\s+Task\s+\d+/i)) {
      issues.push({
        type: 'error',
        line: lineNum,
        message: `Incorrect task format: "${line.trim()}"`,
        suggestion:
          'Use format "### X.Y Task Name" instead of "### Task X.Y: Task Name"',
      });
    }

    // Count valid tasks
    if (line.match(/^###\s+\d+\.\d+\s+/)) {
      taskCount++;

      // Check for metadata on next line
      const nextLine = lines[index + 1];
      if (nextLine && !nextLine.includes('**Effort**:')) {
        issues.push({
          type: 'warning',
          line: lineNum + 1,
          message: 'Task missing metadata line',
          suggestion:
            'Add metadata: **Effort**: X hours | **Priority**: High|Medium|Low | **Dependencies**: X.Y or None',
        });
      }
    }

    // Check for Status field (should not exist)
    if (line.match(/\*\*Status\*\*:/)) {
      issues.push({
        type: 'error',
        line: lineNum,
        message: 'Tasks should not have **Status**: field',
        suggestion: 'Remove the **Status**: field from task metadata',
      });
    }

    // Check for multi-line metadata (should be single line)
    if (
      line.match(/^\s+\*\*(?:Effort|Priority|Dependencies)\*\*:/) &&
      !line.includes('|')
    ) {
      issues.push({
        type: 'error',
        line: lineNum,
        message: 'Metadata should be on single line with pipe separators',
        suggestion:
          'Combine metadata: **Effort**: X hours | **Priority**: High | **Dependencies**: X.Y',
      });
    }
  });

  // Check metadata file if exists
  const specDir = join(
    SPECS_DIR,
    filePath.replace(PHASES_DIR + '/', '').replace('.md', '')
  );
  const metadataPath = join(specDir, '.speckit/metadata.json');
  const hasMetadata = existsSync(metadataPath);

  if (hasMetadata) {
    try {
      const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));

      // Check for camelCase fields
      if ('source_document' in metadata) {
        issues.push({
          type: 'warning',
          message:
            'Metadata uses deprecated "source_document" (should be "sourceDocument")',
          suggestion: 'Run metadata migration to update to camelCase format',
        });
      }

      // Check for required fields
      const required = ['phaseId', 'phaseName', 'generatedAt', 'sourceDocument'];
      required.forEach((field) => {
        if (!(field in metadata)) {
          issues.push({
            type: 'error',
            message: `Metadata missing required field: ${field}`,
            suggestion: 'Regenerate metadata with updated spec-kit tools',
          });
        }
      });
    } catch (err) {
      issues.push({
        type: 'error',
        message: `Invalid metadata.json: ${err instanceof Error ? err.message : 'Unknown error'}`,
        suggestion: 'Fix JSON syntax or regenerate metadata file',
      });
    }
  }

  return {
    valid: issues.filter((i) => i.type === 'error').length === 0,
    issues,
    taskCount,
    hasMetadata,
  };
}

/**
 * Print validation results
 */
function printResults(filePath: string, result: ValidationResult): void {
  const fileName = filePath.replace(PHASES_DIR + '/', '');

  console.log('');
  console.log(
    chalk.bold(
      result.valid ? chalk.green('✓') : chalk.red('✗'),
      fileName
    )
  );
  console.log(chalk.gray(`  Tasks found: ${result.taskCount}`));
  console.log(
    chalk.gray(`  Has metadata: ${result.hasMetadata ? 'Yes' : 'No'}`)
  );

  if (result.issues.length === 0) {
    console.log(chalk.green('  All checks passed!'));
    return;
  }

  // Group by type
  const errors = result.issues.filter((i) => i.type === 'error');
  const warnings = result.issues.filter((i) => i.type === 'warning');

  if (errors.length > 0) {
    console.log('');
    console.log(chalk.red.bold('  Errors:'));
    errors.forEach((issue) => {
      const location = issue.line ? chalk.gray(`[Line ${issue.line}]`) : '';
      console.log(chalk.red(`    ✗ ${location} ${issue.message}`));
      if (issue.suggestion) {
        console.log(chalk.yellow(`      → ${issue.suggestion}`));
      }
    });
  }

  if (warnings.length > 0) {
    console.log('');
    console.log(chalk.yellow.bold('  Warnings:'));
    warnings.forEach((issue) => {
      const location = issue.line ? chalk.gray(`[Line ${issue.line}]`) : '';
      console.log(chalk.yellow(`    ⚠ ${location} ${issue.message}`));
      if (issue.suggestion) {
        console.log(chalk.gray(`      → ${issue.suggestion}`));
      }
    });
  }
}

/**
 * Main validation function
 */
async function main() {
  const args = process.argv.slice(2);

  console.log(chalk.bold.blue('🔍 Phase Document Validator'));
  console.log('');

  if (args.length === 0) {
    // Validate all phase documents
    console.log(chalk.gray('Validating all phase documents in:'));
    console.log(chalk.gray(`  ${PHASES_DIR}`));

    const files = readdirSync(PHASES_DIR).filter(
      (f) => f.endsWith('.md') && f.startsWith('phase-')
    );

    let totalValid = 0;
    const results: Array<{ file: string; result: ValidationResult }> = [];

    for (const file of files) {
      const filePath = join(PHASES_DIR, file);
      const content = readFileSync(filePath, 'utf-8');
      const result = validatePhaseDocument(content, filePath);

      results.push({ file: filePath, result });
      if (result.valid) totalValid++;
    }

    // Print all results
    results.forEach(({ file, result }) => {
      printResults(file, result);
    });

    // Summary
    console.log('');
    console.log(chalk.bold('Summary:'));
    console.log(
      `  ${totalValid}/${files.length} phase documents passed validation`
    );

    if (totalValid < files.length) {
      process.exit(1);
    }
  } else {
    // Validate specific file
    const fileInput = args[0];
    let filePath: string;

    if (fileInput.startsWith('/')) {
      filePath = fileInput;
    } else if (fileInput.includes('/')) {
      filePath = join(process.cwd(), fileInput);
    } else {
      // Assume it's just the phase name
      const phasePattern = fileInput.toLowerCase().replace(/^phase-/, '');
      const matchingFiles = readdirSync(PHASES_DIR).filter(
        (f) => f.toLowerCase().includes(phasePattern) && f.endsWith('.md')
      );

      if (matchingFiles.length === 0) {
        console.error(chalk.red(`✗ No phase file found matching: ${fileInput}`));
        process.exit(1);
      }
      if (matchingFiles.length > 1) {
        console.error(
          chalk.red(
            `✗ Multiple phase files found: ${matchingFiles.join(', ')}`
          )
        );
        process.exit(1);
      }

      filePath = join(PHASES_DIR, matchingFiles[0]);
    }

    if (!existsSync(filePath)) {
      console.error(chalk.red(`✗ File not found: ${filePath}`));
      process.exit(1);
    }

    const content = readFileSync(filePath, 'utf-8');
    const result = validatePhaseDocument(content, filePath);

    printResults(filePath, result);

    if (!result.valid) {
      process.exit(1);
    }
  }

  console.log('');
}

main().catch((err) => {
  console.error(chalk.red('Validation failed:'), err);
  process.exit(1);
});
