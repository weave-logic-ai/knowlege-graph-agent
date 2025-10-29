/**
 * Workflow Command - Manage and execute knowledge graph workflows
 *
 * Usage:
 *   weaver workflow run <name> [path]      - Execute workflow on specific path
 *   weaver workflow list                    - List all registered workflows
 *   weaver workflow status                  - Show running workflows
 *   weaver workflow test <name> [path]      - Test workflow in dry-run mode
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import path from 'path';
import fs from 'fs/promises';
import { WorkflowEngine } from '../../workflow-engine/index.js';
import { GitIntegration } from '../../workflows/kg/git/index.js';
import { buildDocumentContext } from '../../workflows/kg/context/index.js';
import type { FileEvent } from '../../file-watcher/types.js';
import type { WorkflowDefinition, WorkflowExecution } from '../../workflow-engine/types.js';

interface WorkflowRunOptions {
  dryRun?: boolean;
  noBranch?: boolean;
  verbose?: boolean;
}

interface WorkflowListOptions {
  all?: boolean;
  verbose?: boolean;
}

interface WorkflowStatusOptions {
  verbose?: boolean;
  limit?: number;
}

/**
 * Create workflow command group
 */
export function createWorkflowCommand(): Command {
  const command = new Command('workflow')
    .description('Manage and execute knowledge graph workflows');

  // Add subcommands
  command.addCommand(createRunCommand());
  command.addCommand(createListCommand());
  command.addCommand(createStatusCommand());
  command.addCommand(createTestCommand());

  return command;
}

/**
 * workflow run <name> [path] - Execute workflow
 */
function createRunCommand(): Command {
  return new Command('run')
    .description('Execute a workflow on a specific file or directory')
    .argument('<name>', 'Workflow name to execute')
    .argument('[path]', 'File or directory path (defaults to current directory)', '.')
    .option('--dry-run', 'Preview changes without executing', false)
    .option('--no-branch', 'Skip Git branch creation')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (name: string, targetPath: string, options: WorkflowRunOptions) => {
      const spinner = ora('Initializing workflow...').start();

      try {
        // Validate target path
        const absolutePath = path.resolve(targetPath);
        try {
          await fs.access(absolutePath);
        } catch {
          spinner.fail(`Path not found: ${targetPath}`);
          process.exit(1);
        }

        // Get vault root (find nearest .git or assume current dir)
        const vaultRoot = await findVaultRoot(absolutePath);
        spinner.text = `Vault root: ${vaultRoot}`;

        // Initialize workflow engine
        spinner.text = 'Loading workflows...';
        const engine = new WorkflowEngine();

        // TODO: Load registered workflows from config
        // For now, we'll check if workflow exists by name
        const workflow = engine.getRegistry().getAllWorkflows()
          .find(w => w.id === name || w.name === name);

        if (!workflow) {
          spinner.fail(`Workflow not found: ${name}`);
          console.log(chalk.yellow('\nAvailable workflows:'));
          engine.getRegistry().getAllWorkflows().forEach(w => {
            console.log(`  ${chalk.cyan(w.id)} - ${w.name}`);
          });
          process.exit(1);
        }

        if (!workflow.enabled) {
          spinner.fail(`Workflow is disabled: ${name}`);
          process.exit(1);
        }

        spinner.succeed(`Found workflow: ${workflow.name}`);

        // Create Git branch for safety (unless disabled)
        let branchName: string | undefined;
        if (options.noBranch !== true && !options.dryRun) {
          spinner.start('Creating workflow branch...');
          const git = new GitIntegration(vaultRoot);
          const timestamp = Date.now();
          branchName = `workflow/${workflow.id}-${timestamp}`;

          try {
            await git.branches.createWorkflowBranch(branchName);
            spinner.succeed(`Created branch: ${chalk.cyan(branchName)}`);
          } catch (error) {
            spinner.warn('Failed to create branch, continuing...');
            if (options.verbose) {
              console.log(chalk.gray(error instanceof Error ? error.message : String(error)));
            }
            branchName = undefined;
          }
        }

        // Build context for target file/directory
        spinner.start('Analyzing context...');
        const stats = await fs.stat(absolutePath);
        const isFile = stats.isFile();

        if (isFile) {
          const fileEvent: FileEvent = {
            type: 'change',
            path: absolutePath,
            absolutePath: absolutePath,
            relativePath: path.relative(vaultRoot, absolutePath),
            timestamp: new Date(),
          };

          const context = await buildDocumentContext(fileEvent, vaultRoot);
          spinner.succeed('Context analyzed');

          if (options.verbose) {
            console.log(chalk.gray('  Directory:'), context.directory.purpose);
            console.log(chalk.gray('  Phase:'), context.temporal.phase || 'none');
            console.log(chalk.gray('  Domain:'), context.primitives.domain);
            if (context.primitives.platforms.length > 0) {
              console.log(chalk.gray('  Platforms:'), context.primitives.platforms.join(', '));
            }
          }
        } else {
          spinner.succeed('Context analyzed (directory mode)');
        }

        // Execute workflow
        if (options.dryRun) {
          spinner.info(chalk.yellow('[DRY RUN] No changes will be made'));
          console.log(chalk.cyan('\nWould execute:'));
          console.log(`  Workflow: ${workflow.name}`);
          console.log(`  Target: ${absolutePath}`);
          console.log(`  Branch: ${branchName || 'none'}`);
        } else {
          spinner.start('Executing workflow...');
          await executeWorkflow(engine, workflow, absolutePath, vaultRoot, spinner, options.verbose);
          spinner.succeed('Workflow completed');

          if (branchName) {
            console.log(chalk.green('\n✓ Success!'));
            console.log(chalk.cyan(`Branch: ${branchName}`));
            console.log(chalk.gray(`Merge with: git merge ${branchName}`));
          }
        }
      } catch (error) {
        spinner.fail('Workflow execution failed');
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) {
          console.error(chalk.gray(error.stack));
        }
        process.exit(1);
      }
    });
}

/**
 * workflow list - List all workflows
 */
function createListCommand(): Command {
  return new Command('list')
    .description('List all registered workflows')
    .option('-a, --all', 'Show all workflows including disabled', false)
    .option('-v, --verbose', 'Show detailed information', false)
    .action(async (options: WorkflowListOptions) => {
      try {
        const engine = new WorkflowEngine();
        const workflows = engine.getRegistry().getAllWorkflows();

        if (workflows.length === 0) {
          console.log(chalk.yellow('No workflows registered'));
          console.log(chalk.gray('Workflows are registered when the Weaver service starts'));
          return;
        }

        console.log(chalk.bold.blue('\n📋 Available Workflows\n'));

        const filteredWorkflows = options.all
          ? workflows
          : workflows.filter(w => w.enabled);

        filteredWorkflows.forEach(workflow => {
          const statusIcon = workflow.enabled ? chalk.green('✓') : chalk.gray('○');
          console.log(`${statusIcon} ${chalk.cyan(workflow.id)}`);
          console.log(`  ${workflow.description}`);

          if (options.verbose) {
            console.log(chalk.gray('  Triggers:'), workflow.triggers.join(', '));
            if (workflow.fileFilter) {
              console.log(chalk.gray('  File filter:'), workflow.fileFilter);
            }
          }
          console.log();
        });

        const stats = engine.getStats();
        console.log(chalk.gray(`Total: ${stats.totalWorkflows} workflows (${stats.enabledWorkflows} enabled)`));
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}

/**
 * workflow status - Show running workflows
 */
function createStatusCommand(): Command {
  return new Command('status')
    .description('Show currently running and recent workflow executions')
    .option('-v, --verbose', 'Show detailed execution information', false)
    .option('-l, --limit <number>', 'Number of recent executions to show', '10')
    .action(async (options: WorkflowStatusOptions) => {
      try {
        const engine = new WorkflowEngine();
        const stats = engine.getStats();
        const limit = parseInt(options.limit?.toString() || '10', 10);
        const recentExecutions = engine.getRegistry().getRecentExecutions(limit);

        console.log(chalk.bold.blue('\n⚙️  Workflow Status\n'));

        // Show statistics
        console.log(chalk.bold('Statistics:'));
        console.log(`  Total workflows: ${stats.totalWorkflows} (${stats.enabledWorkflows} enabled)`);
        console.log(`  Running: ${chalk.yellow(stats.runningExecutions)}`);
        console.log(`  Completed: ${chalk.green(stats.successfulExecutions)}`);
        console.log(`  Failed: ${chalk.red(stats.failedExecutions)}`);
        console.log(`  Total executions: ${stats.totalExecutions}`);

        // Show recent executions
        if (recentExecutions.length > 0) {
          console.log(chalk.bold(`\nRecent Executions (last ${limit}):\n`));

          recentExecutions.forEach(execution => {
            const statusColor =
              execution.status === 'completed' ? chalk.green :
              execution.status === 'failed' ? chalk.red :
              execution.status === 'running' ? chalk.yellow :
              chalk.gray;

            const statusIcon =
              execution.status === 'completed' ? '✓' :
              execution.status === 'failed' ? '✗' :
              execution.status === 'running' ? '⋯' :
              '○';

            console.log(`${statusColor(statusIcon)} ${chalk.cyan(execution.workflowName)}`);
            console.log(`  Status: ${statusColor(execution.status)}`);
            console.log(`  Started: ${formatDate(execution.startedAt)}`);

            if (execution.duration) {
              console.log(`  Duration: ${formatDuration(execution.duration)}`);
            }

            if (execution.fileEvent) {
              console.log(`  File: ${execution.fileEvent.relativePath}`);
            }

            if (execution.error && options.verbose) {
              console.log(chalk.red('  Error:'), execution.error);
            }

            console.log();
          });
        } else {
          console.log(chalk.gray('\nNo recent executions'));
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}

/**
 * workflow test <name> [path] - Test workflow in dry-run mode
 */
function createTestCommand(): Command {
  return new Command('test')
    .description('Test a workflow without making changes (dry-run mode)')
    .argument('<name>', 'Workflow name to test')
    .argument('[path]', 'File or directory path (defaults to current directory)', '.')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (name: string, targetPath: string, options: { verbose?: boolean }) => {
      // Delegate to run command with --dry-run flag
      const runCommand = createRunCommand();
      await runCommand.parseAsync([
        'node',
        'workflow',
        'run',
        name,
        targetPath,
        '--dry-run',
        ...(options.verbose ? ['--verbose'] : []),
      ]);
    });
}

/**
 * Execute a workflow on a target path
 */
async function executeWorkflow(
  engine: WorkflowEngine,
  workflow: WorkflowDefinition,
  targetPath: string,
  vaultRoot: string,
  spinner: Ora,
  verbose = false
): Promise<void> {
  const stats = await fs.stat(targetPath);
  const isFile = stats.isFile();

  if (isFile) {
    // Execute on single file
    const fileEvent: FileEvent = {
      type: 'change',
      path: targetPath,
      absolutePath: targetPath,
      relativePath: path.relative(vaultRoot, targetPath),
      timestamp: new Date(),
    };

    await engine.triggerManual(workflow.id, {
      fileEvent,
      targetPath,
      vaultRoot,
    });
  } else {
    // Execute on directory - find all eligible files
    spinner.text = 'Scanning directory...';
    const files = await findMarkdownFiles(targetPath);

    if (files.length === 0) {
      spinner.warn('No markdown files found in directory');
      return;
    }

    spinner.text = `Processing ${files.length} files...`;

    for (const [index, file] of files.entries()) {
      spinner.text = `Processing ${index + 1}/${files.length}: ${path.basename(file)}`;

      const fileEvent: FileEvent = {
        type: 'change',
        path: file,
        absolutePath: file,
        relativePath: path.relative(vaultRoot, file),
        timestamp: new Date(),
      };

      try {
        await engine.triggerManual(workflow.id, {
          fileEvent,
          targetPath: file,
          vaultRoot,
        });
      } catch (error) {
        if (verbose) {
          console.log(chalk.yellow(`\n  ⚠ Failed: ${path.basename(file)}`));
          console.log(chalk.gray(`    ${error instanceof Error ? error.message : String(error)}`));
        }
      }
    }
  }
}

/**
 * Find vault root by looking for .git directory
 */
async function findVaultRoot(startPath: string): Promise<string> {
  let currentPath = path.resolve(startPath);

  // If it's a file, start from its directory
  try {
    const stats = await fs.stat(currentPath);
    if (stats.isFile()) {
      currentPath = path.dirname(currentPath);
    }
  } catch {
    // Path doesn't exist, use as-is
  }

  // Walk up until we find .git or reach root
  while (currentPath !== '/') {
    try {
      await fs.access(path.join(currentPath, '.git'));
      return currentPath;
    } catch {
      // Not found, go up one level
      const parent = path.dirname(currentPath);
      if (parent === currentPath) {
        break; // Reached root
      }
      currentPath = parent;
    }
  }

  // No .git found, return original path
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

      // Skip hidden and node_modules directories
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
 * Format date for display
 */
function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    return 'just now';
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleString();
  }
}

/**
 * Format duration in milliseconds
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}
