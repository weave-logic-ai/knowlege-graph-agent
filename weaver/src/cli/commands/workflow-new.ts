/**
 * New Workflow Command - Use Next.js Workflow DevKit API
 *
 * This is the updated workflow command that interacts with the Next.js
 * Workflow DevKit server instead of the old WorkflowEngine.
 *
 * Usage:
 *   weaver workflow run <name> [path]      - Execute workflow via API
 *   weaver workflow list                    - List available workflows
 *   weaver workflow status                  - Show server status
 *   weaver workflow test <name> [path]      - Test workflow in dry-run mode
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';
import { WorkflowApiClient, ensureWorkflowServer, DEFAULT_CONFIG } from './workflow-api.js';

interface WorkflowRunOptions {
  dryRun?: boolean;
  verbose?: boolean;
  server?: string;
}

interface WorkflowListOptions {
  verbose?: boolean;
  server?: string;
}

interface WorkflowStatusOptions {
  verbose?: boolean;
  server?: string;
}

/**
 * Create workflow command group (NEW version)
 */
export function createWorkflowCommandNew(): Command {
  const command = new Command('workflow')
    .description('Manage and execute workflows via Next.js Workflow DevKit');

  // Add subcommands
  command.addCommand(createRunCommandNew());
  command.addCommand(createListCommandNew());
  command.addCommand(createStatusCommandNew());
  command.addCommand(createTestCommandNew());

  return command;
}

/**
 * workflow run <name> [path] - Execute workflow via API
 */
function createRunCommandNew(): Command {
  return new Command('run')
    .description('Execute a workflow on a specific file via the workflow server')
    .argument('<name>', 'Workflow name (e.g., document-connection)')
    .argument('[path]', 'File path to process', '.')
    .option('--dry-run', 'Preview changes without executing', false)
    .option('-v, --verbose', 'Verbose output', false)
    .option('--server <url>', 'Workflow server URL', `${DEFAULT_CONFIG.baseUrl}:${DEFAULT_CONFIG.port}`)
    .action(async (name: string, targetPath: string, options: WorkflowRunOptions) => {
      const spinner = ora('Connecting to workflow server...').start();

      try {
        // Parse server config
        const serverUrl = options.server || `${DEFAULT_CONFIG.baseUrl}:${DEFAULT_CONFIG.port}`;
        const url = new URL(serverUrl);
        const config = {
          baseUrl: `${url.protocol}//${url.hostname}`,
          port: parseInt(url.port || '3000', 10),
        };

        // Check if server is running
        if (!(await ensureWorkflowServer(config))) {
          spinner.fail('Workflow server is not running');
          process.exit(1);
        }

        spinner.succeed('Connected to workflow server');

        // Validate target path
        const absolutePath = path.resolve(targetPath);
        try {
          await fs.access(absolutePath);
        } catch {
          spinner.fail(`Path not found: ${targetPath}`);
          process.exit(1);
        }

        // Get vault root
        const vaultRoot = await findVaultRoot(absolutePath);
        spinner.text = `Vault root: ${vaultRoot}`;

        // Execute workflow based on name
        if (name === 'document-connection') {
          spinner.start('Executing document connection workflow...');

          const client = new WorkflowApiClient(config);
          const result = await client.executeDocumentConnection({
            filePath: absolutePath,
            vaultRoot,
            eventType: 'change',
            dryRun: options.dryRun,
          });

          spinner.succeed('Workflow completed');

          // Display results
          console.log(chalk.green('\n✓ Success!'));
          console.log(chalk.cyan(`Run ID: ${result.runId}`));
          console.log(chalk.gray(`Duration: ${result.result.duration}ms`));
          console.log(chalk.gray(`Connections: ${result.result.connections}`));

          if (result.result.filesModified.length > 0) {
            console.log(chalk.gray(`Files modified: ${result.result.filesModified.length}`));
            if (options.verbose) {
              result.result.filesModified.forEach(file => {
                console.log(chalk.gray(`  - ${file}`));
              });
            }
          }

          if (options.dryRun) {
            console.log(chalk.yellow('\n[DRY RUN] No changes were made'));
          }
        } else {
          spinner.fail(`Unknown workflow: ${name}`);
          console.log(chalk.yellow('\nAvailable workflows:'));
          console.log('  document-connection - Automatic document linking');
          process.exit(1);
        }
      } catch (error) {
        spinner.fail('Workflow execution failed');
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack && options.verbose) {
          console.error(chalk.gray(error.stack));
        }
        process.exit(1);
      }
    });
}

/**
 * workflow list - List all workflows
 */
function createListCommandNew(): Command {
  return new Command('list')
    .description('List all available workflows on the server')
    .option('-v, --verbose', 'Show detailed information', false)
    .option('--server <url>', 'Workflow server URL', `${DEFAULT_CONFIG.baseUrl}:${DEFAULT_CONFIG.port}`)
    .action(async (options: WorkflowListOptions) => {
      const spinner = ora('Fetching workflows...').start();

      try {
        // Parse server config
        const serverUrl = options.server || `${DEFAULT_CONFIG.baseUrl}:${DEFAULT_CONFIG.port}`;
        const url = new URL(serverUrl);
        const config = {
          baseUrl: `${url.protocol}//${url.hostname}`,
          port: parseInt(url.port || '3000', 10),
        };

        // Check if server is running
        if (!(await ensureWorkflowServer(config))) {
          spinner.fail('Workflow server is not running');
          process.exit(1);
        }

        const client = new WorkflowApiClient(config);
        const workflows = await client.listWorkflows();

        spinner.succeed('Workflows loaded');

        console.log(chalk.bold.blue('\n📋 Available Workflows\n'));

        if (workflows.length === 0) {
          console.log(chalk.yellow('No workflows available'));
          return;
        }

        workflows.forEach(workflow => {
          console.log(`${chalk.green('✓')} ${chalk.cyan(workflow.id)}`);
          console.log(`  ${workflow.description}`);
          console.log(chalk.gray(`  Endpoint: ${workflow.method} ${workflow.endpoint}`));

          if (options.verbose && workflow.parameters) {
            console.log(chalk.gray('  Parameters:'));
            Object.entries(workflow.parameters).forEach(([key, value]) => {
              console.log(chalk.gray(`    ${key}: ${value}`));
            });
          }
          console.log();
        });
      } catch (error) {
        spinner.fail('Failed to list workflows');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}

/**
 * workflow status - Show server status
 */
function createStatusCommandNew(): Command {
  return new Command('status')
    .description('Check workflow server status')
    .option('-v, --verbose', 'Show detailed information', false)
    .option('--server <url>', 'Workflow server URL', `${DEFAULT_CONFIG.baseUrl}:${DEFAULT_CONFIG.port}`)
    .action(async (options: WorkflowStatusOptions) => {
      const spinner = ora('Checking server status...').start();

      try {
        // Parse server config
        const serverUrl = options.server || `${DEFAULT_CONFIG.baseUrl}:${DEFAULT_CONFIG.port}`;
        const url = new URL(serverUrl);
        const config = {
          baseUrl: `${url.protocol}//${url.hostname}`,
          port: parseInt(url.port || '3000', 10),
        };

        const client = new WorkflowApiClient(config);
        const isRunning = await client.healthCheck();

        if (isRunning) {
          spinner.succeed('Workflow server is running');
          console.log(chalk.green(`\n✓ Server: ${serverUrl}`));

          if (options.verbose) {
            const workflows = await client.listWorkflows();
            console.log(chalk.gray(`  Workflows: ${workflows.length} available`));
          }
        } else {
          spinner.fail('Workflow server is not running');
          console.log(chalk.yellow(`\n⚠️  Expected at: ${serverUrl}`));
          console.log(chalk.gray('Start with: npm run dev:web\n'));
          process.exit(1);
        }
      } catch (error) {
        spinner.fail('Failed to check server status');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}

/**
 * workflow test <name> [path] - Test workflow in dry-run mode
 */
function createTestCommandNew(): Command {
  return new Command('test')
    .description('Test a workflow without making changes (dry-run mode)')
    .argument('<name>', 'Workflow name to test')
    .argument('[path]', 'File path (defaults to current directory)', '.')
    .option('-v, --verbose', 'Verbose output', false)
    .option('--server <url>', 'Workflow server URL', `${DEFAULT_CONFIG.baseUrl}:${DEFAULT_CONFIG.port}`)
    .action(async (name: string, targetPath: string, options: { verbose?: boolean; server?: string }) => {
      // Execute the run command logic with dry-run=true
      const spinner = ora('Connecting to workflow server...').start();

      try {
        // Parse server config
        const serverUrl = options.server || `${DEFAULT_CONFIG.baseUrl}:${DEFAULT_CONFIG.port}`;
        const url = new URL(serverUrl);
        const config = {
          baseUrl: `${url.protocol}//${url.hostname}`,
          port: parseInt(url.port || '3000', 10),
        };

        // Check if server is running
        if (!(await ensureWorkflowServer(config))) {
          spinner.fail('Workflow server is not running');
          process.exit(1);
        }

        spinner.succeed('Connected to workflow server');

        // Get absolute path and vault root
        const absolutePath = path.resolve(process.cwd(), targetPath);
        const vaultRoot = path.dirname(absolutePath);

        // Determine workflow
        if (name === 'document-connection') {
          const spinner2 = ora('Testing document connection workflow (DRY RUN)...').start();

          const client = new WorkflowApiClient(config);
          const { runId, result } = await client.executeDocumentConnection({
            filePath: absolutePath,
            vaultRoot,
            eventType: 'change',
            dryRun: true,  // Force dry-run for test command
          });

          spinner2.succeed('Workflow test completed');

          console.log(chalk.green('\n✓ Success!'));
          console.log(chalk.cyan(`Run ID: ${runId}`));
          console.log(chalk.gray(`Duration: ${result.duration}ms`));
          console.log(chalk.gray(`Connections found: ${result.connections}`));

          if (result.log && options.verbose) {
            console.log(chalk.bold('\nWorkflow Log:'));
            result.log.forEach(line => {
              console.log(chalk.gray(`  ${line}`));
            });
          }

          console.log(chalk.yellow('\n[DRY RUN] No changes were made'));
        } else {
          spinner.fail(`Unknown workflow: ${name}`);
          console.log(chalk.yellow('\nAvailable workflows:'));
          console.log('  document-connection - Automatic document linking');
          process.exit(1);
        }
      } catch (error) {
        spinner.fail('Workflow test failed');
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack && options.verbose) {
          console.error(chalk.gray(error.stack));
        }
        process.exit(1);
      }
    });
}

// Old implementation that caused issues:
function _createTestCommandOld(): Command {
  return new Command('test')
    .description('Test a workflow without making changes (dry-run mode)')
    .argument('<name>', 'Workflow name to test')
    .argument('[path]', 'File path (defaults to current directory)', '.')
    .option('-v, --verbose', 'Verbose output', false)
    .option('--server <url>', 'Workflow server URL', `${DEFAULT_CONFIG.baseUrl}:${DEFAULT_CONFIG.port}`)
    .action(async (name: string, targetPath: string, options: { verbose?: boolean; server?: string }) => {
      // Delegate to run command with --dry-run flag
      const runCommand = createRunCommandNew();
      await runCommand.parseAsync([
        'node',
        'workflow',
        'run',
        name,
        targetPath,
        '--dry-run',
        ...(options.verbose ? ['--verbose'] : []),
        ...(options.server ? ['--server', options.server] : []),
      ]);
    });
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
