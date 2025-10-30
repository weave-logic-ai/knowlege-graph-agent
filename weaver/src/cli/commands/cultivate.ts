/**
 * Cultivate Command - Systematically enhance the knowledge graph
 *
 * This command provides multiple cultivation tasks:
 * - Connect orphaned/poorly connected documents
 * - Apply visual icons based on document type/status
 * - Update metadata and frontmatter
 * - Clean up and optimize graph structure
 *
 * Usage:
 *   weaver cultivate [path]                - Cultivate all documents
 *   weaver cultivate --icons               - Apply icons
 *   weaver cultivate --connections         - Add connections
 *   weaver cultivate --all                 - Run all tasks
 *   weaver cultivate --watch               - Watch mode
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import path from 'path';
import fs from 'fs/promises';
import { WorkflowEngine } from '../../workflow-engine/index.js';
import { GitIntegration } from '../../workflows/kg/git/index.js';
import { buildDocumentContext, filterBySimilarity } from '../../workflows/kg/context/index.js';
import { runIconApplicationWorkflow } from '../../workflows/kg/icon-application.js';
import type { FileEvent } from '../../file-watcher/types.js';
import type { DocumentContext } from '../../workflows/kg/context/index.js';

interface CultivateOptions {
  dryRun?: boolean;
  orphansOnly?: boolean;
  max?: number;
  minConnections?: number;
  verbose?: boolean;
  noBranch?: boolean;
  // New options for icon workflow
  icons?: boolean;
  connections?: boolean;
  metadata?: boolean;
  cleanup?: boolean;
  all?: boolean;
  watch?: boolean;
  mode?: 'incremental' | 'full';
  // Intelligent cultivation options
  frontmatter?: boolean;
  generateMissing?: boolean;
  parse?: boolean;
  useContext?: boolean;
  agentMode?: string;
  maxAgents?: string;
  seed?: boolean;
  projectRoot?: string;
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
    .description('Systematically cultivate and enhance the knowledge graph')
    .argument('[path]', 'Directory to cultivate (defaults to current directory)', '.')
    .option('--dry-run', 'Preview changes without executing', false)
    .option('--icons', 'Apply visual icons to files', false)
    .option('--connections', 'Connect orphaned/poorly connected documents', false)
    .option('--metadata', 'Update metadata and frontmatter', false)
    .option('--cleanup', 'Clean up and optimize graph', false)
    .option('--all', 'Run all cultivation tasks', false)
    .option('-w, --watch', 'Watch mode - continuous cultivation', false)
    .option('-m, --mode <mode>', 'Mode: incremental or full (default: incremental)', 'incremental')
    .option('--orphans-only', 'Only process orphaned documents (no connections)', false)
    .option('--max <number>', 'Maximum files to process', '0')
    .option('--min-connections <number>', 'Minimum connections threshold (default: 2)', '2')
    .option('-v, --verbose', 'Verbose output', false)
    .option('--no-branch', 'Skip Git branch creation')
    .option('--frontmatter', 'Generate/update intelligent frontmatter', false)
    .option('--generate-missing', 'Generate missing documentation based on context', false)
    .option('--parse', 'Parse directory and enhance all documents', false)
    .option('--use-context', 'Use primitives/features/tech-specs for context', true)
    .option('--agent-mode <mode>', 'Agent execution mode: sequential, parallel, adaptive', 'adaptive')
    .option('--max-agents <number>', 'Maximum concurrent agents for generation', '5')
    .option('--seed', 'Bootstrap vault with primitives from codebase analysis', false)
    .option('--project-root <path>', 'Project root for seed analysis (defaults to target directory)')
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

        // Determine which tasks to run
        const tasks = {
          icons: options.icons || options.all,
          connections: options.connections || options.all,
          metadata: options.metadata || options.all,
          cleanup: options.cleanup || options.all,
        };

        // New intelligent cultivation tasks
        const intelligentTasks = {
          frontmatter: options.frontmatter || options.parse || options.all,
          generateMissing: options.generateMissing || options.parse || options.all,
          buildFooters: options.parse, // buildFooters may already exist
          seed: options.seed || false,
        };

        // If no tasks selected, show help
        if (!tasks.icons && !tasks.connections && !tasks.metadata && !tasks.cleanup &&
            !intelligentTasks.frontmatter && !intelligentTasks.generateMissing && !intelligentTasks.seed && !options.parse) {
          console.log(chalk.yellow('\n💡 No tasks selected. Use one or more of:'));
          console.log('  --icons       Apply visual icons to files');
          console.log('  --connections Connect orphaned/poorly connected documents');
          console.log('  --metadata    Update metadata and frontmatter');
          console.log('  --cleanup     Clean up and optimize graph');
          console.log('  --parse           Parse and enhance all documents (frontmatter + generation)');
          console.log('  --frontmatter     Generate intelligent YAML frontmatter');
          console.log('  --generate-missing Generate missing docs from primitives/features/tech-specs');
          console.log('  --all         Run all tasks');
          console.log('\nRun "weaver cultivate --help" for more options\n');
          return;
        }

        console.log(chalk.bold.green('\n🌱 Knowledge Graph Cultivator\n'));
        console.log(`Mode: ${options.mode || 'incremental'}`);
        console.log(`Tasks: ${Object.entries(tasks).filter(([_, v]) => v).map(([k, _]) => k).join(', ')}`);
        console.log(`Dry run: ${options.dryRun ? 'yes' : 'no'}\n`);

        // Watch mode
        if (options.watch) {
          if (tasks.icons) {
            console.log(chalk.blue('👁️  Starting icon watch mode...\n'));
            await runIconApplicationWorkflow('watch', options.dryRun || false);
            await new Promise(() => {}); // Keep alive
          } else {
            console.log(chalk.yellow('⚠️  Watch mode only supports --icons currently'));
          }
          return;
        }

        const startTime = Date.now();

        // Task 1: Icon Application
        if (tasks.icons) {
          spinner.start('Applying icons...');
          const mode = options.mode === 'full' ? 'full' : 'incremental';
          const iconResult = await runIconApplicationWorkflow(mode, options.dryRun || false);

          spinner.succeed(`Icons applied: ${iconResult.filesUpdated} files updated`);
          console.log(chalk.gray(`  Processed: ${iconResult.filesProcessed}, Skipped: ${iconResult.filesSkipped}`));

          if (iconResult.errors.length > 0) {
            console.log(chalk.yellow(`  Errors: ${iconResult.errors.length}`));
          }
        }

        // Task 2: Connection Workflow (existing logic)
        if (tasks.connections) {
          spinner.start('Analyzing connections...');

          // Analyze vault structure
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
          } else {
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
            spinner.start('Connecting documents...');
            const results = await executeCultivation(
              plan.filesToProcess,
              vaultRoot,
              spinner,
              options.verbose || false
            );

            spinner.succeed('Connections complete');

            // Display results
            displayResults(results, branchName);
          }
        }

        // Task 3: Intelligent Cultivation
        if (options.parse || intelligentTasks.frontmatter || intelligentTasks.generateMissing || intelligentTasks.seed) {
          const { CultivationEngine } = await import('../../cultivation/engine.js');

          const cultivationOptions = {
            targetDirectory: absolutePath,
            dryRun: options.dryRun || false,
            force: options.mode === 'full',
            skipUnmodified: options.mode !== 'full',
            generateMissing: intelligentTasks.generateMissing,
            buildFooters: intelligentTasks.buildFooters,
            useAgents: options.useContext !== false,
            agentMode: (options.agentMode || 'adaptive') as 'sequential' | 'parallel' | 'adaptive',
            maxAgents: parseInt(options.maxAgents || '5', 10),
            verbose: options.verbose || false,
            seed: intelligentTasks.seed || false,
            projectRoot: options.projectRoot,
          };

          spinner.start('Initializing intelligent cultivation...');
          const engine = new CultivationEngine(cultivationOptions);
          spinner.succeed('Engine initialized');

          // Discovery phase
          if (intelligentTasks.frontmatter || intelligentTasks.generateMissing) {
            spinner.start('Discovering documents...');
            const discovery = await engine.discover();
            spinner.succeed(`Found ${discovery.totalFiles} files (${discovery.needsProcessing} need processing)`);

            if (options.verbose) {
              console.log(chalk.gray(`  With frontmatter: ${discovery.withFrontmatter}`));
              console.log(chalk.gray(`  Without frontmatter: ${discovery.withoutFrontmatter}`));
            }
          }

          // Load context
          if (options.useContext !== false || intelligentTasks.seed) {
            spinner.start('Loading vault context...');
            const context = await engine.loadContext();
            const hasContext = [context.primitives, context.features, context.techSpecs].filter(Boolean).length;
            spinner.succeed(`Loaded context from ${hasContext} reference files`);
          }

          // Seed generation (run first to bootstrap vault)
          if (intelligentTasks.seed) {
            spinner.start('Seeding primitives from codebase...');
            const seedResult = await engine.seedPrimitives();
            spinner.succeed(`Seeded ${seedResult.created} primitive nodes`);

            if (options.verbose && seedResult.documents.length > 0) {
              console.log(chalk.gray('  Generated primitives:'));
              seedResult.documents.slice(0, 10).forEach((doc: any) => {
                console.log(chalk.gray(`    • ${doc.frontmatter.category || 'primitive'}: ${doc.title}`));
              });
              if (seedResult.documents.length > 10) {
                console.log(chalk.gray(`    • ...and ${seedResult.documents.length - 10} more`));
              }
            }
          }

          // Frontmatter generation
          if (intelligentTasks.frontmatter) {
            spinner.start('Generating frontmatter...');
            const frontmatterResult = await engine.generateFrontmatter();
            spinner.succeed(`Frontmatter: ${frontmatterResult.updated} updated, ${frontmatterResult.skipped} skipped`);
          }

          // Document generation
          if (intelligentTasks.generateMissing) {
            spinner.start('Analyzing gaps and generating documents...');
            const genResult = await engine.generateDocuments();
            spinner.succeed(`Generated ${genResult.created} new documents`);

            if (options.verbose && genResult.documents.length > 0) {
              console.log(chalk.gray('  Generated:'));
              genResult.documents.slice(0, 5).forEach((doc: any) => {
                console.log(chalk.gray(`    • ${doc.type}: ${doc.title}`));
              });
            }
          }

          // Footer building
          if (intelligentTasks.buildFooters) {
            spinner.start('Building backlink footers...');
            const footerResult = await engine.buildFooters();
            spinner.succeed(`Footers: ${footerResult.updated} updated`);
          }

          // Final report
          const report = await engine.getReport();
          console.log(chalk.bold.green('\n✨ Intelligent Cultivation Complete\n'));
          console.log(chalk.cyan('Summary:'));
          if (report.seed.created > 0) {
            console.log(`  Primitives seeded: ${report.seed.created}`);
          }
          console.log(`  Files processed: ${report.frontmatter.processed}`);
          console.log(`  Frontmatter updated: ${report.frontmatter.updated}`);
          console.log(`  Documents generated: ${report.generation.created}`);
          console.log(`  Footers updated: ${report.footers.updated}`);
          console.log(`  Processing time: ${(report.duration / 1000).toFixed(2)}s`);

          if (report.warnings.length > 0) {
            console.log(chalk.yellow(`\n  Warnings: ${report.warnings.length}`));
          }
          if (report.errors.length > 0) {
            console.log(chalk.red(`  Errors: ${report.errors.length}`));
          }
        }

        // Task 4: Metadata Update
        if (tasks.metadata) {
          spinner.info('Metadata cultivation: Not yet implemented');
        }

        // Task 5: Cleanup
        if (tasks.cleanup) {
          spinner.info('Graph cleanup: Not yet implemented');
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        if (options.dryRun) {
          console.log(chalk.yellow('\n[DRY RUN] No changes were made'));
          console.log(chalk.gray('Run without --dry-run to execute'));
        } else {
          console.log(chalk.bold.green(`\n✅ Cultivation complete! (${duration}s)\n`));
        }

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
        absolutePath: orphan.path,
        relativePath: orphan.relativePath,
        timestamp: new Date(),
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
        absolutePath: file,
        relativePath: path.relative(vaultRoot, file),
        timestamp: new Date(),
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
        absolutePath: file.path,
        relativePath: file.relativePath,
        timestamp: new Date(),
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
 * Find vault root by looking for .obsidian directory (Obsidian vault marker)
 * If not found, use the specified directory as vault root
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

  // Look for .obsidian folder (Obsidian vault marker)
  let searchPath = currentPath;
  while (searchPath !== '/') {
    try {
      const obsidianPath = path.join(searchPath, '.obsidian');
      const stats = await fs.stat(obsidianPath);
      if (stats.isDirectory()) {
        return searchPath;
      }
    } catch {
      // Not found, continue searching
    }

    const parent = path.dirname(searchPath);
    if (parent === searchPath) {
      break;
    }
    searchPath = parent;
  }

  // No .obsidian found, use specified directory as vault root
  return currentPath;
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
