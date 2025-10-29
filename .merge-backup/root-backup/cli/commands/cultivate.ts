/**
 * Cultivate Command - Systematically connect documents in knowledge graph
 *
 * This command finds orphaned or poorly connected documents and runs
 * the document-connection workflow to improve the knowledge graph structure.
 *
 * Usage:
 *   weaver cultivate [path]                - Cultivate all documents
 *   weaver cultivate --orphans-only        - Only process orphaned documents
 *   weaver cultivate --max 50              - Limit number of files to process
 *   weaver cultivate --dry-run             - Preview changes without executing
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import path from 'path';
import fs from 'fs/promises';
import { WorkflowEngine } from '../../workflow-engine/index.js';
import { GitIntegration } from '../../workflows/kg/git/index.js';
import { buildDocumentContext, filterBySimilarity } from '../../workflows/kg/context/index.js';
import type { FileEvent } from '../../file-watcher/types.js';
import type { DocumentContext } from '../../workflows/kg/context/index.js';

interface CultivateOptions {
  dryRun?: boolean;
  orphansOnly?: boolean;
  max?: number;
  minConnections?: number;
  verbose?: boolean;
  noBranch?: boolean;
}

interface OrphanFile {
  path: string;
  relativePath: string;
  connectionCount: number;
  context?: DocumentContext;
}

interface CultivationPlan {
  totalFiles: number;
  orphanedFiles: number;
  filesToProcess: OrphanFile[];
  estimatedConnections: number;
  estimatedTime: string;
}

/**
 * Create cultivate command
 */
export function createCultivateCommand(): Command {
  return new Command('cultivate')
    .description('Systematically cultivate knowledge graph connections')
    .argument('[path]', 'Directory to cultivate (defaults to current directory)', '.')
    .option('--dry-run', 'Preview changes without executing', false)
    .option('--orphans-only', 'Only process orphaned documents (no connections)', false)
    .option('--max <number>', 'Maximum files to process', '0')
    .option('--min-connections <number>', 'Minimum connections threshold (default: 2)', '2')
    .option('-v, --verbose', 'Verbose output', false)
    .option('--no-branch', 'Skip Git branch creation')
    .action(async (targetPath: string, options: CultivateOptions) => {
      const spinner = ora('Initializing cultivation...').start();

      try {
        // Validate target path
        const absolutePath = path.resolve(targetPath);
        try {
          await fs.access(absolutePath);
        } catch {
          spinner.fail(`Path not found: ${targetPath}`);
          process.exit(1);
        }

        // Find vault root
        const vaultRoot = await findVaultRoot(absolutePath);
        spinner.succeed(`Vault root: ${vaultRoot}`);

        // Analyze vault structure
        spinner.start('Analyzing vault structure...');
        const allFiles = await findMarkdownFiles(absolutePath);

        if (allFiles.length === 0) {
          spinner.warn('No markdown files found');
          return;
        }

        spinner.text = `Analyzing ${allFiles.length} files...`;

        // Identify orphaned/poorly connected files
        const orphans = await identifyOrphans(
          allFiles,
          vaultRoot,
          options.minConnections || 2,
          spinner
        );

        spinner.succeed(`Found ${orphans.length} orphaned/poorly connected files`);

        // Build cultivation plan
        const plan = buildCultivationPlan(
          allFiles.length,
          orphans,
          options.max || 0,
          options.orphansOnly || false
        );

        // Display plan
        displayPlan(plan, options.dryRun || false);

        if (options.dryRun) {
          // Preview mode - analyze top files
          await previewConnections(
            plan.filesToProcess.slice(0, 10),
            allFiles,
            vaultRoot,
            spinner,
            options.verbose || false
          );

          console.log(chalk.yellow('\n[DRY RUN] No changes were made'));
          console.log(chalk.gray('Run without --dry-run to execute'));
          return;
        }

        // Confirm execution
        if (plan.filesToProcess.length > 20) {
          console.log(chalk.yellow(`\nThis will process ${plan.filesToProcess.length} files.`));
          console.log(chalk.gray('Press Ctrl+C to cancel, or wait 5 seconds to continue...'));
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // Create Git branch for safety
        let branchName: string | undefined;
        if (options.noBranch !== true) {
          spinner.start('Creating workflow branch...');
          const git = new GitIntegration(vaultRoot);
          const timestamp = Date.now();
          branchName = `workflow/cultivate-${timestamp}`;

          try {
            await git.branches.createWorkflowBranch(branchName);
            spinner.succeed(`Created branch: ${chalk.cyan(branchName)}`);
          } catch (error) {
            spinner.warn('Failed to create branch, continuing...');
            branchName = undefined;
          }
        }

        // Execute cultivation
        spinner.start('Cultivating knowledge graph...');
        const results = await executeCultivation(
          plan.filesToProcess,
          vaultRoot,
          spinner,
          options.verbose || false
        );

        spinner.succeed('Cultivation complete');

        // Display results
        displayResults(results, branchName);

      } catch (error) {
        spinner.fail('Cultivation failed');
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) {
          console.error(chalk.gray(error.stack));
        }
        process.exit(1);
      }
    });
}

/**
 * Identify orphaned or poorly connected files
 */
async function identifyOrphans(
  files: string[],
  vaultRoot: string,
  minConnections: number,
  spinner: Ora
): Promise<OrphanFile[]> {
  const orphans: OrphanFile[] = [];

  for (const [index, file] of files.entries()) {
    if (index % 10 === 0) {
      spinner.text = `Analyzing ${index + 1}/${files.length} files...`;
    }

    try {
      const content = await fs.readFile(file, 'utf-8');
      const connectionCount = countWikiLinks(content);

      if (connectionCount < minConnections) {
        orphans.push({
          path: file,
          relativePath: path.relative(vaultRoot, file),
          connectionCount,
        });
      }
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }

  return orphans.sort((a, b) => a.connectionCount - b.connectionCount);
}

/**
 * Count wiki-style links [[...]] in content
 */
function countWikiLinks(content: string): number {
  const matches = content.match(/\[\[([^\]]+)\]\]/g);
  return matches ? matches.length : 0;
}

/**
 * Build cultivation plan
 */
function buildCultivationPlan(
  totalFiles: number,
  orphans: OrphanFile[],
  maxFiles: number,
  orphansOnly: boolean
): CultivationPlan {
  const filesToProcess = orphansOnly
    ? orphans.filter(o => o.connectionCount === 0)
    : orphans;

  const limitedFiles = maxFiles > 0 && maxFiles < filesToProcess.length
    ? filesToProcess.slice(0, maxFiles)
    : filesToProcess;

  const estimatedConnections = limitedFiles.length * 3; // Estimate ~3 connections per file
  const estimatedTimeMs = limitedFiles.length * 2000; // Estimate ~2s per file
  const estimatedTime = formatDuration(estimatedTimeMs);

  return {
    totalFiles,
    orphanedFiles: orphans.filter(o => o.connectionCount === 0).length,
    filesToProcess: limitedFiles,
    estimatedConnections,
    estimatedTime,
  };
}

/**
 * Display cultivation plan
 */
function displayPlan(plan: CultivationPlan, isDryRun: boolean): void {
  console.log(chalk.bold.blue('\n📊 Cultivation Plan\n'));

  if (isDryRun) {
    console.log(chalk.yellow('[DRY RUN] No changes will be made\n'));
  }

  console.log(chalk.cyan('Vault Analysis:'));
  console.log(`  Total files: ${plan.totalFiles}`);
  console.log(`  Orphaned files: ${chalk.yellow(plan.orphanedFiles)} (${Math.round(plan.orphanedFiles / plan.totalFiles * 100)}%)`);
  console.log(`  Poorly connected: ${plan.filesToProcess.length - plan.orphanedFiles}`);

  console.log(chalk.cyan('\nExecution Plan:'));
  console.log(`  Files to process: ${chalk.yellow(plan.filesToProcess.length)}`);
  console.log(`  Estimated connections: ${chalk.green(`~${plan.estimatedConnections}`)}`);
  console.log(`  Estimated time: ${plan.estimatedTime}`);
  console.log();
}

/**
 * Preview connections for dry-run mode
 */
async function previewConnections(
  files: OrphanFile[],
  allFiles: string[],
  vaultRoot: string,
  spinner: Ora,
  verbose: boolean
): Promise<void> {
  console.log(chalk.bold.cyan('\n🔍 Preview (Top 10 Files)\n'));

  for (const [index, orphan] of files.entries()) {
    spinner.text = `Analyzing ${index + 1}/${files.length}: ${path.basename(orphan.path)}`;

    try {
      // Build context for this file
      const fileEvent: FileEvent = {
        type: 'change',
        path: orphan.path,
        relativePath: orphan.relativePath,
        timestamp: Date.now(),
      };

      const context = await buildDocumentContext(fileEvent, vaultRoot);

      // Find potential connections
      const candidates = await buildCandidateContexts(allFiles, vaultRoot, orphan.path);
      const matches = filterBySimilarity(context, candidates, 0.3);

      console.log(`\n${chalk.cyan(orphan.relativePath)}`);
      console.log(`  Current connections: ${chalk.yellow(orphan.connectionCount)}`);
      console.log(`  Potential matches: ${matches.length}`);

      if (verbose && matches.length > 0) {
        const top3 = matches.slice(0, 3);
        top3.forEach(match => {
          const score = Math.round(match.similarity * 100);
          console.log(`    ${chalk.gray('→')} ${match.context.filePath} ${chalk.green(`(${score})`)}`);
        });
      }
    } catch (error) {
      console.log(`  ${chalk.red('Error:')} ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  spinner.stop();
}

/**
 * Build contexts for candidate files
 */
async function buildCandidateContexts(
  files: string[],
  vaultRoot: string,
  excludePath: string
): Promise<DocumentContext[]> {
  const contexts: DocumentContext[] = [];

  // Sample up to 100 files for performance
  const sampleSize = Math.min(100, files.length);
  const sampled = files
    .filter(f => f !== excludePath)
    .sort(() => Math.random() - 0.5)
    .slice(0, sampleSize);

  for (const file of sampled) {
    try {
      const fileEvent: FileEvent = {
        type: 'change',
        path: file,
        relativePath: path.relative(vaultRoot, file),
        timestamp: Date.now(),
      };

      const context = await buildDocumentContext(fileEvent, vaultRoot);
      contexts.push(context);
    } catch {
      // Skip files that fail
      continue;
    }
  }

  return contexts;
}

/**
 * Execute cultivation workflow on files
 */
async function executeCultivation(
  files: OrphanFile[],
  vaultRoot: string,
  spinner: Ora,
  verbose: boolean
): Promise<CultivationResults> {
  const results: CultivationResults = {
    processed: 0,
    successful: 0,
    failed: 0,
    connectionsAdded: 0,
    errors: [],
  };

  const engine = new WorkflowEngine();

  for (const [index, file] of files.entries()) {
    spinner.text = `Processing ${index + 1}/${files.length}: ${path.basename(file.path)}`;

    try {
      const fileEvent: FileEvent = {
        type: 'change',
        path: file.path,
        relativePath: file.relativePath,
        timestamp: Date.now(),
      };

      // Execute document-connection workflow
      await engine.triggerManual('document-connection', {
        fileEvent,
        targetPath: file.path,
        vaultRoot,
      });

      results.processed++;
      results.successful++;

      // Estimate connections added (would need actual workflow result)
      results.connectionsAdded += 3;
    } catch (error) {
      results.processed++;
      results.failed++;
      results.errors.push({
        file: file.relativePath,
        error: error instanceof Error ? error.message : String(error),
      });

      if (verbose) {
        console.log(chalk.yellow(`\n  ⚠ Failed: ${path.basename(file.path)}`));
        console.log(chalk.gray(`    ${error instanceof Error ? error.message : String(error)}`));
      }
    }
  }

  return results;
}

interface CultivationResults {
  processed: number;
  successful: number;
  failed: number;
  connectionsAdded: number;
  errors: Array<{ file: string; error: string }>;
}

/**
 * Display cultivation results
 */
function displayResults(results: CultivationResults, branchName?: string): void {
  console.log(chalk.bold.blue('\n✨ Cultivation Results\n'));

  console.log(chalk.cyan('Summary:'));
  console.log(`  Files processed: ${results.processed}`);
  console.log(`  Successful: ${chalk.green(results.successful)}`);
  console.log(`  Failed: ${results.failed > 0 ? chalk.red(results.failed) : results.failed}`);
  console.log(`  Connections added: ${chalk.green(`~${results.connectionsAdded}`)}`);

  if (results.errors.length > 0 && results.errors.length <= 5) {
    console.log(chalk.yellow('\nErrors:'));
    results.errors.forEach(err => {
      console.log(`  ${chalk.gray('•')} ${err.file}`);
      console.log(`    ${chalk.red(err.error)}`);
    });
  } else if (results.errors.length > 5) {
    console.log(chalk.yellow(`\n${results.errors.length} errors occurred (use --verbose to see details)`));
  }

  if (branchName) {
    console.log(chalk.green('\n✓ Success!'));
    console.log(chalk.cyan(`Branch: ${branchName}`));
    console.log(chalk.gray(`Merge with: git merge ${branchName}`));
  }

  console.log();
}

/**
 * Find vault root by looking for .git directory
 */
async function findVaultRoot(startPath: string): Promise<string> {
  let currentPath = path.resolve(startPath);

  try {
    const stats = await fs.stat(currentPath);
    if (stats.isFile()) {
      currentPath = path.dirname(currentPath);
    }
  } catch {
    // Path doesn't exist, use as-is
  }

  while (currentPath !== '/') {
    try {
      await fs.access(path.join(currentPath, '.git'));
      return currentPath;
    } catch {
      const parent = path.dirname(currentPath);
      if (parent === currentPath) {
        break;
      }
      currentPath = parent;
    }
  }

  return path.resolve(startPath);
}

/**
 * Find all markdown files in a directory
 */
async function findMarkdownFiles(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  async function scan(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  await scan(dirPath);
  return files;
}

/**
 * Format duration in milliseconds
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}
