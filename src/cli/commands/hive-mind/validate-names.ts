/**
 * Hive Mind - Name Validator
 *
 * Validates file naming schema in a vault to ensure consistent, linkable names.
 * Supports kebab-case, lowercase, and other naming conventions.
 *
 * SPEC-003: Hive Mind Reconnection Tools
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { readdir, rename, access, mkdir, writeFile } from 'fs/promises';
import { glob } from 'fast-glob';

// ============================================================================
// Types
// ============================================================================

export interface ValidateNamesOptions {
  fix?: boolean;
  dryRun?: boolean;
  schema?: string;
  output?: string;
  json?: boolean;
  verbose?: boolean;
}

export interface InvalidFile {
  file: string;
  issues: string[];
  suggested: string;
}

export interface ValidationResult {
  valid: string[];
  invalid: InvalidFile[];
  statistics: {
    totalFiles: number;
    validCount: number;
    invalidCount: number;
    commonIssues: Map<string, number>;
  };
}

export interface NamingSchema {
  name: string;
  patterns: {
    lowercase: boolean;
    separator: '-' | '_' | '.';
    maxLength: number;
    allowedChars: RegExp;
    reservedNames: string[];
    allowMixedSeparators?: boolean;
  };
}

// ============================================================================
// Predefined Schemas
// ============================================================================

const SCHEMAS: Record<string, NamingSchema> = {
  kebab: {
    name: 'kebab-case',
    patterns: {
      lowercase: true,
      separator: '-',
      maxLength: 100,
      allowedChars: /^[a-z0-9-]+$/,
      reservedNames: ['index', 'readme', 'changelog'],
    },
  },
  snake: {
    name: 'snake_case',
    patterns: {
      lowercase: true,
      separator: '_',
      maxLength: 100,
      allowedChars: /^[a-z0-9_]+$/,
      reservedNames: ['index', 'readme', 'changelog'],
    },
  },
  obsidian: {
    name: 'Obsidian-friendly',
    patterns: {
      lowercase: false,
      separator: '-',
      maxLength: 200,
      allowedChars: /^[a-zA-Z0-9-_ ]+$/,
      reservedNames: [],
      allowMixedSeparators: true,
    },
  },
};

// ============================================================================
// Name Validator Class
// ============================================================================

export class NameValidator {
  private schema: NamingSchema;

  constructor(schemaName = 'kebab') {
    this.schema = SCHEMAS[schemaName] || SCHEMAS.kebab;
  }

  /**
   * Validate all files in a vault
   */
  async validateVault(vaultPath: string, options: ValidateNamesOptions = {}): Promise<ValidationResult> {
    const resolvedPath = path.resolve(vaultPath);

    // Find all markdown files
    const files = await glob('**/*.md', {
      cwd: resolvedPath,
      ignore: ['node_modules/**', '.git/**', 'dist/**'],
      absolute: false,
    });

    if (files.length === 0) {
      throw new Error(`No markdown files found in: ${resolvedPath}`);
    }

    const valid: string[] = [];
    const invalid: InvalidFile[] = [];
    const commonIssues = new Map<string, number>();

    for (const file of files) {
      const basename = path.basename(file, '.md');
      const issues = this.validateFilename(basename);

      if (issues.length === 0) {
        valid.push(file);
      } else {
        const suggested = this.suggestRename(basename);

        invalid.push({
          file,
          issues,
          suggested: file.replace(basename + '.md', suggested + '.md'),
        });

        // Count issues
        for (const issue of issues) {
          commonIssues.set(issue, (commonIssues.get(issue) || 0) + 1);
        }
      }
    }

    return {
      valid,
      invalid,
      statistics: {
        totalFiles: files.length,
        validCount: valid.length,
        invalidCount: invalid.length,
        commonIssues,
      },
    };
  }

  /**
   * Validate a single filename
   */
  validateFilename(filename: string): string[] {
    const issues: string[] = [];
    const { patterns } = this.schema;

    // Check for uppercase (if lowercase required)
    if (patterns.lowercase && filename !== filename.toLowerCase()) {
      issues.push('Contains uppercase characters');
    }

    // Check for spaces (unless pattern allows spaces)
    const allowsSpaces = patterns.allowedChars.test('a b');
    if (!allowsSpaces && filename.includes(' ')) {
      issues.push('Contains spaces');
    }

    // Check for special characters
    const testName = patterns.lowercase
      ? filename.toLowerCase()
      : filename;
    if (!patterns.allowedChars.test(testName)) {
      issues.push(`Contains invalid characters (allowed: ${patterns.allowedChars})`);
    }

    // Check length
    if (filename.length > patterns.maxLength) {
      issues.push(`Exceeds maximum length (${patterns.maxLength})`);
    }

    // Check for consecutive separators
    const doubleSep = patterns.separator + patterns.separator;
    if (filename.includes(doubleSep)) {
      issues.push(`Contains consecutive separators (${doubleSep})`);
    }

    // Check for leading/trailing separators
    if (filename.startsWith(patterns.separator) || filename.endsWith(patterns.separator)) {
      issues.push('Starts or ends with separator');
    }

    // Check for underscores when using kebab-case (skip if mixed separators allowed)
    if (!patterns.allowMixedSeparators && patterns.separator === '-' && filename.includes('_')) {
      issues.push('Contains underscores (use hyphens)');
    }

    // Check for mixed separators (skip if allowed)
    if (!patterns.allowMixedSeparators) {
      if (patterns.separator === '-' && filename.includes('_')) {
        issues.push('Mixed separators (hyphens and underscores)');
      }
      if (patterns.separator === '_' && filename.includes('-')) {
        issues.push('Mixed separators (underscores and hyphens)');
      }
    }

    return issues;
  }

  /**
   * Suggest a valid filename
   */
  suggestRename(filename: string): string {
    const { patterns } = this.schema;

    let suggested = filename;

    // Convert to lowercase if required
    if (patterns.lowercase) {
      suggested = suggested.toLowerCase();
    }

    // Replace spaces with separator
    suggested = suggested.replace(/\s+/g, patterns.separator);

    // Replace underscores with separator (for kebab-case)
    if (patterns.separator === '-') {
      suggested = suggested.replace(/_+/g, '-');
    }

    // Replace hyphens with separator (for snake_case)
    if (patterns.separator === '_') {
      suggested = suggested.replace(/-+/g, '_');
    }

    // Remove invalid characters
    suggested = suggested.replace(/[^a-z0-9-_]/g, '');

    // Remove consecutive separators
    const sepRegex = new RegExp(`${patterns.separator}+`, 'g');
    suggested = suggested.replace(sepRegex, patterns.separator);

    // Remove leading/trailing separators
    suggested = suggested.replace(new RegExp(`^${patterns.separator}+|${patterns.separator}+$`, 'g'), '');

    // Truncate if too long
    if (suggested.length > patterns.maxLength) {
      suggested = suggested.substring(0, patterns.maxLength);
      // Clean up any trailing separator after truncation
      suggested = suggested.replace(new RegExp(`${patterns.separator}+$`, 'g'), '');
    }

    return suggested || 'untitled';
  }

  /**
   * Rename files (with safety checks)
   */
  async renameFiles(
    vaultPath: string,
    invalidFiles: InvalidFile[],
    dryRun = false
  ): Promise<Array<{ from: string; to: string; success: boolean; error?: string }>> {
    const resolvedPath = path.resolve(vaultPath);
    const results: Array<{ from: string; to: string; success: boolean; error?: string }> = [];

    for (const { file, suggested } of invalidFiles) {
      const fromPath = path.join(resolvedPath, file);
      const toPath = path.join(resolvedPath, suggested);

      // Check if target already exists
      try {
        await access(toPath);
        results.push({
          from: file,
          to: suggested,
          success: false,
          error: 'Target file already exists',
        });
        continue;
      } catch {
        // Target doesn't exist, we can proceed
      }

      if (dryRun) {
        results.push({
          from: file,
          to: suggested,
          success: true,
        });
      } else {
        try {
          // Ensure target directory exists
          await mkdir(path.dirname(toPath), { recursive: true });
          await rename(fromPath, toPath);
          results.push({
            from: file,
            to: suggested,
            success: true,
          });
        } catch (error) {
          results.push({
            from: file,
            to: suggested,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return results;
  }

  /**
   * Get current schema
   */
  getSchema(): NamingSchema {
    return this.schema;
  }

  /**
   * Generate report
   */
  generateReport(result: ValidationResult): string {
    const lines: string[] = [];

    lines.push('# File Naming Validation Report\n');
    lines.push(`Generated: ${new Date().toISOString()}\n`);
    lines.push(`Schema: ${this.schema.name}\n`);
    lines.push('');

    lines.push('## Summary\n');
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total Files | ${result.statistics.totalFiles} |`);
    lines.push(`| Valid | ${result.statistics.validCount} |`);
    lines.push(`| Invalid | ${result.statistics.invalidCount} |`);
    lines.push(`| Compliance | ${((result.statistics.validCount / result.statistics.totalFiles) * 100).toFixed(1)}% |`);
    lines.push('');

    if (result.statistics.commonIssues.size > 0) {
      lines.push('## Common Issues\n');
      const sortedIssues = [...result.statistics.commonIssues.entries()]
        .sort((a, b) => b[1] - a[1]);
      for (const [issue, count] of sortedIssues) {
        lines.push(`- ${issue}: ${count} files`);
      }
      lines.push('');
    }

    if (result.invalid.length > 0) {
      lines.push('## Files to Rename\n');
      lines.push('| Current | Suggested | Issues |');
      lines.push('|---------|-----------|--------|');
      for (const { file, suggested, issues } of result.invalid.slice(0, 50)) {
        lines.push(`| \`${file}\` | \`${suggested}\` | ${issues.join(', ')} |`);
      }
      if (result.invalid.length > 50) {
        lines.push(`\n*... and ${result.invalid.length - 50} more*`);
      }
    }

    return lines.join('\n');
  }
}

// ============================================================================
// CLI Command
// ============================================================================

export function createValidateNamesCommand(): Command {
  const command = new Command('validate-names')
    .description('Validate file naming schema')
    .argument('<vault-path>', 'Path to Obsidian vault or docs directory')
    .option('--schema <name>', 'Naming schema (kebab, snake, obsidian)', 'kebab')
    .option('--fix', 'Auto-rename invalid files')
    .option('--dry-run', 'Show what would be renamed without making changes')
    .option('-o, --output <file>', 'Output file for report')
    .option('--json', 'Output as JSON')
    .option('-v, --verbose', 'Show detailed output')
    .action(async (vaultPath: string, options: ValidateNamesOptions) => {
      const validator = new NameValidator(options.schema || 'kebab');

      console.log(chalk.cyan(`\nValidating file names (${validator.getSchema().name})...\n`));

      try {
        const result = await validator.validateVault(vaultPath, options);

        if (options.json) {
          const jsonResult = {
            ...result,
            statistics: {
              ...result.statistics,
              commonIssues: Object.fromEntries(result.statistics.commonIssues),
            },
          };

          if (options.output) {
            await writeFile(options.output, JSON.stringify(jsonResult, null, 2));
            console.log(chalk.green(`Results written to: ${options.output}`));
          } else {
            console.log(JSON.stringify(jsonResult, null, 2));
          }
        } else {
          // Display summary
          const compliance = (result.statistics.validCount / result.statistics.totalFiles) * 100;
          const complianceColor = compliance === 100 ? chalk.green : compliance >= 80 ? chalk.yellow : chalk.red;

          console.log(chalk.bold('Summary:'));
          console.log(chalk.white(`  Total Files:  ${result.statistics.totalFiles}`));
          console.log(chalk.green(`  Valid:        ${result.statistics.validCount}`));
          console.log(chalk.red(`  Invalid:      ${result.statistics.invalidCount}`));
          console.log(complianceColor(`  Compliance:   ${compliance.toFixed(1)}%`));
          console.log('');

          if (result.statistics.commonIssues.size > 0) {
            console.log(chalk.bold('Common Issues:'));
            const sortedIssues = [...result.statistics.commonIssues.entries()]
              .sort((a, b) => b[1] - a[1]);
            for (const [issue, count] of sortedIssues) {
              console.log(chalk.yellow(`  ${count}x ${issue}`));
            }
            console.log('');
          }

          if (result.invalid.length > 0 && (options.verbose || options.fix || options.dryRun)) {
            console.log(chalk.bold('Files to Rename:'));
            for (const { file, suggested, issues } of result.invalid.slice(0, options.verbose ? 50 : 10)) {
              console.log(chalk.red(`  ${file}`));
              console.log(chalk.green(`    -> ${suggested}`));
              if (options.verbose) {
                console.log(chalk.gray(`       Issues: ${issues.join(', ')}`));
              }
            }
            if (result.invalid.length > (options.verbose ? 50 : 10)) {
              console.log(chalk.gray(`  ... and ${result.invalid.length - (options.verbose ? 50 : 10)} more`));
            }
            console.log('');
          }

          // Handle fix/dry-run
          if (options.fix || options.dryRun) {
            const action = options.dryRun ? 'Preview' : 'Rename';
            console.log(chalk.bold(`${action}ing files...`));

            const renameResults = await validator.renameFiles(
              vaultPath,
              result.invalid,
              options.dryRun || false
            );

            const success = renameResults.filter(r => r.success);
            const failed = renameResults.filter(r => !r.success);

            if (options.dryRun) {
              console.log(chalk.cyan(`  Would rename ${success.length} files`));
            } else {
              console.log(chalk.green(`  Renamed ${success.length} files`));
            }

            if (failed.length > 0) {
              console.log(chalk.red(`  Failed: ${failed.length} files`));
              if (options.verbose) {
                for (const { from, to, error } of failed) {
                  console.log(chalk.red(`    ${from} -> ${to}: ${error}`));
                }
              }
            }
            console.log('');
          }

          // Write report if output specified
          if (options.output && !options.json) {
            const report = validator.generateReport(result);
            await writeFile(options.output, report);
            console.log(chalk.green(`Report written to: ${options.output}`));
          }

          // Show next steps
          if (result.invalid.length > 0 && !options.fix) {
            console.log(chalk.bold('Next Steps:'));
            console.log(chalk.gray('  1. Review invalid file names'));
            console.log(chalk.gray('  2. Run with --dry-run to preview changes'));
            console.log(chalk.gray('  3. Run with --fix to auto-rename files'));
            console.log(chalk.gray('  4. Update links after renaming with kg analyze-links'));
            console.log('');
          }
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });

  return command;
}

export default createValidateNamesCommand;
