/**
 * Workflow Command
 *
 * Manage knowledge graph workflows for automated processing,
 * analysis, and synchronization tasks.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { randomUUID } from 'crypto';

/**
 * Workflow types supported by the system
 */
type WorkflowType = 'analysis' | 'sync' | 'generation' | 'validation' | 'migration';

/**
 * Workflow status
 */
type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'stopped';

/**
 * Workflow entry structure
 */
interface Workflow {
  id: string;
  type: WorkflowType;
  status: WorkflowStatus;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  progress: number;
  message?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

/**
 * In-memory workflow storage (would be replaced with persistent storage)
 */
const workflows: Map<string, Workflow> = new Map();

/**
 * Valid workflow types
 */
const VALID_WORKFLOW_TYPES: WorkflowType[] = [
  'analysis',
  'sync',
  'generation',
  'validation',
  'migration',
];

/**
 * Create workflow command with subcommands
 */
export function createWorkflowCommand(): Command {
  const workflow = new Command('workflow')
    .alias('wf')
    .description('Manage knowledge graph workflows');

  // Start workflow
  workflow
    .command('start <type>')
    .description('Start a new workflow')
    .addHelpText('after', `
Workflow Types:
  analysis    - Analyze codebase and extract knowledge
  sync        - Synchronize with external systems
  generation  - Generate knowledge graph artifacts
  validation  - Validate graph integrity and structure
  migration   - Migrate data between formats

Examples:
  $ kg workflow start analysis
  $ kg workflow start sync --input '{"namespace": "myproject"}'
  $ kg workflow start generation --async
    `)
    .option('-i, --input <json>', 'Input data as JSON')
    .option('-a, --async', 'Run workflow asynchronously')
    .option('--dry-run', 'Preview workflow without executing')
    .action(async (type: string, options) => {
      const spinner = ora('Starting workflow...').start();

      try {
        // Validate workflow type
        if (!VALID_WORKFLOW_TYPES.includes(type as WorkflowType)) {
          spinner.fail(`Invalid workflow type: ${type}`);
          console.log(
            chalk.gray('\n  Valid types: ') +
              chalk.cyan(VALID_WORKFLOW_TYPES.join(', '))
          );
          process.exit(1);
        }

        // Parse input if provided
        let input: Record<string, unknown> | undefined;
        if (options.input) {
          try {
            input = JSON.parse(options.input);
          } catch {
            spinner.fail('Invalid JSON input');
            console.log(chalk.gray('  Example: --input \'{"key": "value"}\''));
            process.exit(1);
          }
        }

        // Dry run mode
        if (options.dryRun) {
          spinner.info('Dry run mode - workflow will not execute');
          console.log();
          console.log(chalk.white('  Workflow Configuration:'));
          console.log(chalk.gray(`    Type:  ${type}`));
          console.log(chalk.gray(`    Input: ${input ? JSON.stringify(input, null, 2) : 'none'}`));
          console.log(chalk.gray(`    Async: ${options.async ? 'yes' : 'no'}`));
          return;
        }

        // Create workflow entry
        const workflowId = randomUUID().slice(0, 8);
        const now = new Date().toISOString();

        const workflowEntry: Workflow = {
          id: workflowId,
          type: type as WorkflowType,
          status: 'running',
          startedAt: now,
          updatedAt: now,
          progress: 0,
          input,
        };

        workflows.set(workflowId, workflowEntry);

        spinner.text = `Running ${type} workflow...`;

        // Simulate workflow execution
        if (options.async) {
          spinner.succeed(`Workflow started: ${chalk.cyan(workflowId)}`);
          console.log(
            chalk.gray(`\n  Check status: `) +
              chalk.cyan(`kg workflow status ${workflowId}`)
          );

          // Start async workflow simulation
          simulateWorkflow(workflowId);
        } else {
          // Synchronous execution simulation
          await simulateWorkflowSync(workflowId, spinner);

          const completedWorkflow = workflows.get(workflowId);
          if (completedWorkflow?.status === 'completed') {
            spinner.succeed(`Workflow completed: ${chalk.cyan(workflowId)}`);
            printWorkflowResult(completedWorkflow);
          } else if (completedWorkflow?.status === 'failed') {
            spinner.fail(`Workflow failed: ${chalk.cyan(workflowId)}`);
            if (completedWorkflow.error) {
              console.log(chalk.red(`\n  Error: ${completedWorkflow.error}`));
            }
            process.exit(1);
          }
        }
      } catch (error) {
        spinner.fail('Failed to start workflow');
        console.error(chalk.red(`  ${String(error)}`));
        process.exit(1);
      }
    });

  // Status command
  workflow
    .command('status [id]')
    .description('Check workflow status')
    .option('--json', 'Output as JSON')
    .option('-w, --watch', 'Watch for status changes')
    .action(async (id: string | undefined, options) => {
      try {
        if (id) {
          // Get specific workflow
          const wf = workflows.get(id);

          if (!wf) {
            console.log(chalk.yellow(`\n  Workflow not found: ${id}`));
            console.log(chalk.gray('  Run ') + chalk.cyan('kg workflow list') + chalk.gray(' to see active workflows'));
            process.exit(1);
          }

          if (options.json) {
            console.log(JSON.stringify(wf, null, 2));
            return;
          }

          printWorkflowDetails(wf);

          if (options.watch && wf.status === 'running') {
            await watchWorkflow(id);
          }
        } else {
          // Show all active workflows status
          const activeWorkflows = Array.from(workflows.values()).filter(
            (w) => w.status === 'running' || w.status === 'pending'
          );

          if (activeWorkflows.length === 0) {
            console.log(chalk.gray('\n  No active workflows'));
            console.log(chalk.gray('  Run ') + chalk.cyan('kg workflow start <type>') + chalk.gray(' to start one'));
            return;
          }

          if (options.json) {
            console.log(JSON.stringify(activeWorkflows, null, 2));
            return;
          }

          console.log(chalk.cyan.bold('\n  Active Workflows\n'));
          activeWorkflows.forEach((wf) => {
            printWorkflowSummary(wf);
          });
        }
      } catch (error) {
        console.error(chalk.red('Failed to get workflow status:'), String(error));
        process.exit(1);
      }
    });

  // List command
  workflow
    .command('list')
    .description('List all workflows')
    .option('-s, --status <status>', 'Filter by status (running, completed, failed, stopped)')
    .option('-t, --type <type>', 'Filter by workflow type')
    .option('-n, --limit <number>', 'Limit number of results', '10')
    .option('--json', 'Output as JSON')
    .action((options) => {
      try {
        let workflowList = Array.from(workflows.values());

        // Apply filters
        if (options.status) {
          workflowList = workflowList.filter((w) => w.status === options.status);
        }
        if (options.type) {
          workflowList = workflowList.filter((w) => w.type === options.type);
        }

        // Sort by start time (most recent first)
        workflowList.sort(
          (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );

        // Apply limit
        const limit = parseInt(options.limit, 10);
        workflowList = workflowList.slice(0, limit);

        if (workflowList.length === 0) {
          console.log(chalk.gray('\n  No workflows found'));
          if (options.status || options.type) {
            console.log(chalk.gray('  Try removing filters'));
          }
          return;
        }

        if (options.json) {
          console.log(JSON.stringify(workflowList, null, 2));
          return;
        }

        console.log(chalk.cyan.bold('\n  Workflows\n'));

        // Header
        console.log(
          chalk.gray(
            `  ${'ID'.padEnd(10)} ${'Type'.padEnd(12)} ${'Status'.padEnd(12)} ${'Progress'.padEnd(10)} Started`
          )
        );
        console.log(chalk.gray('  ' + '-'.repeat(70)));

        workflowList.forEach((wf) => {
          const statusColor = getStatusColor(wf.status);
          const progress = `${wf.progress}%`;
          const started = formatRelativeTime(wf.startedAt);

          console.log(
            `  ${chalk.cyan(wf.id.padEnd(10))} ${wf.type.padEnd(12)} ${statusColor(
              wf.status.padEnd(12)
            )} ${progress.padEnd(10)} ${chalk.gray(started)}`
          );
        });

        console.log();
        console.log(
          chalk.gray(`  Showing ${workflowList.length} workflow(s)`)
        );
        console.log();
      } catch (error) {
        console.error(chalk.red('Failed to list workflows:'), String(error));
        process.exit(1);
      }
    });

  // Stop command
  workflow
    .command('stop <id>')
    .description('Stop a running workflow')
    .option('-f, --force', 'Force stop without confirmation')
    .action(async (id: string, options) => {
      const spinner = ora(`Stopping workflow ${id}...`).start();

      try {
        const wf = workflows.get(id);

        if (!wf) {
          spinner.fail(`Workflow not found: ${id}`);
          process.exit(1);
        }

        if (wf.status !== 'running' && wf.status !== 'pending') {
          spinner.warn(`Workflow is not running (status: ${wf.status})`);
          return;
        }

        // Update workflow status
        wf.status = 'stopped';
        wf.updatedAt = new Date().toISOString();
        wf.message = 'Stopped by user';

        spinner.succeed(`Workflow stopped: ${chalk.cyan(id)}`);

        console.log();
        console.log(chalk.white('  Final Status:'));
        console.log(chalk.gray(`    Progress: ${wf.progress}%`));
        console.log(chalk.gray(`    Stopped at: ${wf.updatedAt}`));
        console.log();
      } catch (error) {
        spinner.fail('Failed to stop workflow');
        console.error(chalk.red(`  ${String(error)}`));
        process.exit(1);
      }
    });

  // History command
  workflow
    .command('history')
    .description('Show workflow history')
    .option('-n, --limit <number>', 'Limit number of results', '20')
    .option('-t, --type <type>', 'Filter by workflow type')
    .option('--since <date>', 'Show workflows since date (ISO format)')
    .option('--json', 'Output as JSON')
    .action((options) => {
      try {
        let historyList = Array.from(workflows.values()).filter(
          (w) => w.status === 'completed' || w.status === 'failed' || w.status === 'stopped'
        );

        // Apply filters
        if (options.type) {
          historyList = historyList.filter((w) => w.type === options.type);
        }

        if (options.since) {
          const sinceDate = new Date(options.since);
          if (isNaN(sinceDate.getTime())) {
            console.error(chalk.red('Invalid date format. Use ISO format (e.g., 2024-01-01)'));
            process.exit(1);
          }
          historyList = historyList.filter(
            (w) => new Date(w.startedAt) >= sinceDate
          );
        }

        // Sort by completion time (most recent first)
        historyList.sort((a, b) => {
          const timeA = new Date(a.completedAt || a.updatedAt).getTime();
          const timeB = new Date(b.completedAt || b.updatedAt).getTime();
          return timeB - timeA;
        });

        // Apply limit
        const limit = parseInt(options.limit, 10);
        historyList = historyList.slice(0, limit);

        if (historyList.length === 0) {
          console.log(chalk.gray('\n  No workflow history found'));
          return;
        }

        if (options.json) {
          console.log(JSON.stringify(historyList, null, 2));
          return;
        }

        console.log(chalk.cyan.bold('\n  Workflow History\n'));

        // Header
        console.log(
          chalk.gray(
            `  ${'ID'.padEnd(10)} ${'Type'.padEnd(12)} ${'Status'.padEnd(12)} ${'Duration'.padEnd(12)} Completed`
          )
        );
        console.log(chalk.gray('  ' + '-'.repeat(75)));

        historyList.forEach((wf) => {
          const statusColor = getStatusColor(wf.status);
          const duration = calculateDuration(wf.startedAt, wf.completedAt || wf.updatedAt);
          const completed = formatRelativeTime(wf.completedAt || wf.updatedAt);

          console.log(
            `  ${chalk.cyan(wf.id.padEnd(10))} ${wf.type.padEnd(12)} ${statusColor(
              wf.status.padEnd(12)
            )} ${duration.padEnd(12)} ${chalk.gray(completed)}`
          );

          if (wf.error) {
            console.log(chalk.red(`    Error: ${wf.error}`));
          }
        });

        console.log();
        console.log(
          chalk.gray(`  Showing ${historyList.length} workflow(s)`)
        );
        console.log();
      } catch (error) {
        console.error(chalk.red('Failed to get workflow history:'), String(error));
        process.exit(1);
      }
    });

  // Resume command (bonus)
  workflow
    .command('resume <id>')
    .description('Resume a stopped workflow')
    .action(async (id: string) => {
      const spinner = ora(`Resuming workflow ${id}...`).start();

      try {
        const wf = workflows.get(id);

        if (!wf) {
          spinner.fail(`Workflow not found: ${id}`);
          process.exit(1);
        }

        if (wf.status !== 'stopped') {
          spinner.warn(`Cannot resume workflow (status: ${wf.status})`);
          console.log(chalk.gray('\n  Only stopped workflows can be resumed'));
          return;
        }

        // Update workflow status
        wf.status = 'running';
        wf.updatedAt = new Date().toISOString();
        wf.message = 'Resumed by user';

        spinner.succeed(`Workflow resumed: ${chalk.cyan(id)}`);

        // Continue simulation
        simulateWorkflow(id);

        console.log(
          chalk.gray(`\n  Check status: `) +
            chalk.cyan(`kg workflow status ${id}`)
        );
      } catch (error) {
        spinner.fail('Failed to resume workflow');
        console.error(chalk.red(`  ${String(error)}`));
        process.exit(1);
      }
    });

  return workflow;
}

/**
 * Simulate async workflow execution
 */
function simulateWorkflow(id: string): void {
  const wf = workflows.get(id);
  if (!wf) return;

  const interval = setInterval(() => {
    const workflow = workflows.get(id);
    if (!workflow || workflow.status !== 'running') {
      clearInterval(interval);
      return;
    }

    workflow.progress = Math.min(workflow.progress + 10, 100);
    workflow.updatedAt = new Date().toISOString();

    if (workflow.progress >= 100) {
      workflow.status = 'completed';
      workflow.completedAt = new Date().toISOString();
      workflow.output = {
        processed: true,
        itemsProcessed: Math.floor(Math.random() * 100) + 10,
      };
      clearInterval(interval);
    }
  }, 1000);
}

/**
 * Simulate synchronous workflow execution
 */
async function simulateWorkflowSync(
  id: string,
  spinner: ReturnType<typeof ora>
): Promise<void> {
  const wf = workflows.get(id);
  if (!wf) return;

  for (let i = 0; i <= 100; i += 10) {
    await sleep(300);
    wf.progress = i;
    wf.updatedAt = new Date().toISOString();
    spinner.text = `Running ${wf.type} workflow... ${i}%`;
  }

  wf.status = 'completed';
  wf.completedAt = new Date().toISOString();
  wf.output = {
    processed: true,
    itemsProcessed: Math.floor(Math.random() * 100) + 10,
  };
}

/**
 * Watch workflow status changes
 */
async function watchWorkflow(id: string): Promise<void> {
  console.log(chalk.gray('\n  Watching for changes (Ctrl+C to stop)...\n'));

  while (true) {
    const wf = workflows.get(id);
    if (!wf || wf.status !== 'running') {
      if (wf) {
        printWorkflowDetails(wf);
      }
      break;
    }

    process.stdout.write(
      `\r  Progress: ${chalk.cyan(wf.progress + '%')} | Status: ${chalk.yellow(wf.status)}`
    );

    await sleep(500);
  }
}

/**
 * Print workflow result
 */
function printWorkflowResult(wf: Workflow): void {
  console.log();
  console.log(chalk.white('  Result:'));
  console.log(chalk.gray(`    Duration: ${calculateDuration(wf.startedAt, wf.completedAt || wf.updatedAt)}`));
  if (wf.output) {
    console.log(chalk.gray(`    Output: ${JSON.stringify(wf.output)}`));
  }
  console.log();
}

/**
 * Print detailed workflow information
 */
function printWorkflowDetails(wf: Workflow): void {
  const statusColor = getStatusColor(wf.status);

  console.log(chalk.cyan.bold(`\n  Workflow: ${wf.id}\n`));

  console.log(chalk.white('  Details:'));
  console.log(chalk.gray(`    Type:     ${wf.type}`));
  console.log(chalk.gray(`    Status:   `) + statusColor(wf.status));
  console.log(chalk.gray(`    Progress: ${wf.progress}%`));

  console.log();
  console.log(chalk.white('  Timeline:'));
  console.log(chalk.gray(`    Started:  ${wf.startedAt}`));
  console.log(chalk.gray(`    Updated:  ${wf.updatedAt}`));
  if (wf.completedAt) {
    console.log(chalk.gray(`    Completed: ${wf.completedAt}`));
    console.log(chalk.gray(`    Duration:  ${calculateDuration(wf.startedAt, wf.completedAt)}`));
  }

  if (wf.message) {
    console.log();
    console.log(chalk.white('  Message:'));
    console.log(chalk.gray(`    ${wf.message}`));
  }

  if (wf.input) {
    console.log();
    console.log(chalk.white('  Input:'));
    console.log(chalk.gray(`    ${JSON.stringify(wf.input, null, 2).replace(/\n/g, '\n    ')}`));
  }

  if (wf.output) {
    console.log();
    console.log(chalk.white('  Output:'));
    console.log(chalk.gray(`    ${JSON.stringify(wf.output, null, 2).replace(/\n/g, '\n    ')}`));
  }

  if (wf.error) {
    console.log();
    console.log(chalk.red('  Error:'));
    console.log(chalk.red(`    ${wf.error}`));
  }

  console.log();
}

/**
 * Print workflow summary (one line)
 */
function printWorkflowSummary(wf: Workflow): void {
  const statusColor = getStatusColor(wf.status);
  const progressBar = createProgressBar(wf.progress, 20);

  console.log(
    `  ${chalk.cyan(wf.id)} [${wf.type}] ${statusColor(wf.status)} ${progressBar} ${wf.progress}%`
  );
}

/**
 * Get chalk color function based on status
 */
function getStatusColor(status: WorkflowStatus): typeof chalk.green {
  switch (status) {
    case 'completed':
      return chalk.green;
    case 'running':
      return chalk.blue;
    case 'pending':
      return chalk.yellow;
    case 'failed':
      return chalk.red;
    case 'stopped':
      return chalk.gray;
    default:
      return chalk.white;
  }
}

/**
 * Create progress bar string
 */
function createProgressBar(progress: number, width: number): string {
  const filled = Math.floor((progress / 100) * width);
  const empty = width - filled;
  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

/**
 * Format relative time
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Calculate duration between two ISO timestamps
 */
function calculateDuration(start: string, end: string): string {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const diffMs = endTime - startTime;

  if (diffMs < 1000) return `${diffMs}ms`;
  if (diffMs < 60000) return `${(diffMs / 1000).toFixed(1)}s`;
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ${Math.floor((diffMs % 60000) / 1000)}s`;

  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
