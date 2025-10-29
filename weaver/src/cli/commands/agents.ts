/**
 * Agent Management CLI Commands
 *
 * Commands for managing agent orchestration rules and monitoring.
 */

import { Command } from 'commander';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import boxen from 'boxen';
import { createOrchestrator } from '../../agents/orchestration/index.js';
import { logger } from '../../utils/logger.js';
import type { OrchestrationRule } from '../../agents/orchestration/types.js';

/**
 * Create agents command group
 */
export function createAgentsCommand(): Command {
  const command = new Command('agents')
    .description('Agent orchestration management');

  // Rules subcommand
  command
    .command('rules')
    .description('Manage agent orchestration rules')
    .option('-l, --list', 'List all active rules')
    .option('-v, --validate', 'Validate rules file')
    .option('-s, --stats', 'Show rule statistics')
    .option('--reload', 'Reload rules from file')
    .option('--path <path>', 'Custom rules file path', join(homedir(), '.weaver', 'agent-rules.json'))
    .action(async (options) => {
      try {
        if (options.list) {
          await listRules(options.path);
        } else if (options.validate) {
          await validateRules(options.path);
        } else if (options.stats) {
          await showRuleStats(options.path);
        } else if (options.reload) {
          await reloadRules(options.path);
        } else {
          console.log(chalk.yellow('Please specify an action: --list, --validate, --stats, or --reload'));
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Metrics subcommand
  command
    .command('metrics')
    .description('Show orchestration metrics')
    .option('-d, --detailed', 'Show detailed metrics')
    .option('--reset', 'Reset metrics')
    .action(async (options) => {
      try {
        await showMetrics(options.detailed, options.reset);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Workload subcommand
  command
    .command('workload')
    .description('Show agent workload distribution')
    .option('-a, --agent <type>', 'Show workload for specific agent')
    .action(async (options) => {
      try {
        await showWorkload(options.agent);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Init subcommand
  command
    .command('init')
    .description('Initialize agent orchestration with example rules')
    .option('--force', 'Overwrite existing rules file')
    .action(async (options) => {
      try {
        await initializeRules(options.force);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}

/**
 * List all active rules
 */
async function listRules(rulesPath: string): Promise<void> {
  try {
    const content = await readFile(rulesPath, 'utf-8');
    const data = JSON.parse(content);
    const rules: OrchestrationRule[] = data.rules || [];

    console.log(chalk.cyan.bold('\n📋 Agent Orchestration Rules\n'));

    if (rules.length === 0) {
      console.log(chalk.yellow('No rules found.'));
      return;
    }

    for (const rule of rules) {
      const enabled = rule.enabled !== false;
      const status = enabled ? chalk.green('✓ ENABLED') : chalk.gray('✗ DISABLED');

      console.log(boxen(
        `${chalk.bold(rule.id)} ${status}\n` +
        `${chalk.gray('Action:')} ${rule.action}\n` +
        `${chalk.gray('Priority:')} ${rule.priority}\n` +
        `${chalk.gray('Condition:')} ${rule.condition}\n` +
        (rule.description ? `${chalk.gray('Description:')} ${rule.description}` : ''),
        {
          padding: 1,
          margin: { top: 0, bottom: 1, left: 2, right: 0 },
          borderStyle: 'round',
          borderColor: enabled ? 'cyan' : 'gray',
        }
      ));
    }

    console.log(chalk.gray(`Total rules: ${rules.length}`));
    console.log(chalk.gray(`Active rules: ${rules.filter(r => r.enabled !== false).length}\n`));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(chalk.yellow('No rules file found. Run "weaver agents init" to create one.'));
    } else {
      throw error;
    }
  }
}

/**
 * Validate rules file
 */
async function validateRules(rulesPath: string): Promise<void> {
  console.log(chalk.cyan('Validating rules file...'));

  const orchestrator = createOrchestrator({
    ruleEngine: { rulesFile: rulesPath },
  });

  try {
    await orchestrator.initialize();
    const rules = orchestrator.getRuleEngine().getRules();

    console.log(chalk.green('✅ Rules file is valid'));
    console.log(chalk.gray(`Loaded ${rules.length} rules successfully\n`));

    // Show any warnings
    for (const rule of rules) {
      if (!rule.description) {
        console.log(chalk.yellow(`⚠ Rule ${rule.id} has no description`));
      }
    }
  } catch (error) {
    console.log(chalk.red('❌ Rules file validation failed'));
    throw error;
  }
}

/**
 * Show rule statistics
 */
async function showRuleStats(rulesPath: string): Promise<void> {
  const orchestrator = createOrchestrator({
    ruleEngine: { rulesFile: rulesPath },
  });

  await orchestrator.initialize();
  const metrics = orchestrator.getMetrics();

  console.log(chalk.cyan.bold('\n📊 Rule Engine Statistics\n'));

  console.log(boxen(
    `${chalk.bold('Total Tasks Evaluated:')} ${metrics.rules.totalTasks}\n` +
    `${chalk.bold('Tasks Routed:')} ${metrics.rules.tasksRouted}\n` +
    `${chalk.bold('Tasks Split:')} ${metrics.rules.tasksSplit}\n` +
    `${chalk.bold('Priority Adjustments:')} ${metrics.rules.priorityAdjustments}\n` +
    `${chalk.bold('Conflicts Detected:')} ${metrics.rules.conflictsDetected}\n` +
    `${chalk.bold('Conflicts Resolved:')} ${metrics.rules.conflictsResolved}\n` +
    `${chalk.bold('Avg Evaluation Time:')} ${metrics.rules.averageEvaluationTime.toFixed(2)}ms`,
    {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    }
  ));

  console.log();
}

/**
 * Reload rules from file
 */
async function reloadRules(rulesPath: string): Promise<void> {
  const orchestrator = createOrchestrator({
    ruleEngine: { rulesFile: rulesPath },
  });

  await orchestrator.initialize();

  console.log(chalk.green('\n✓ Rules reloaded successfully'));
  console.log(chalk.gray(`  Rules file: ${rulesPath}\n`));
}

/**
 * Show orchestration metrics
 */
async function showMetrics(detailed: boolean, reset: boolean): Promise<void> {
  const orchestrator = createOrchestrator();
  await orchestrator.initialize();

  if (reset) {
    orchestrator.reset();
    console.log(chalk.green('✅ Metrics reset\n'));
    return;
  }

  const metrics = orchestrator.getMetrics();

  console.log(chalk.cyan.bold('\n📈 Orchestration Metrics\n'));

  // Rule metrics
  console.log(chalk.bold('Rule Engine:'));
  console.log(`  Total Tasks: ${metrics.rules.totalTasks}`);
  console.log(`  Avg Evaluation Time: ${metrics.rules.averageEvaluationTime.toFixed(2)}ms`);
  console.log();

  // Workload metrics
  console.log(chalk.bold('Workload Distribution:'));
  for (const dist of metrics.workload) {
    const bar = '█'.repeat(Math.floor(dist.utilizationPercent / 10));
    console.log(`  ${dist.agentType.padEnd(20)} ${bar.padEnd(10)} ${dist.utilizationPercent.toFixed(1)}%`);
    if (detailed) {
      console.log(`    Active: ${dist.activeTasks}, Queued: ${dist.queuedTasks}`);
    }
  }
  console.log();

  // Queue metrics
  console.log(chalk.bold('Task Queue:'));
  console.log(`  Queued Tasks: ${metrics.queue.queuedTasks}`);
  if (metrics.queue.oldestQueueTime) {
    console.log(`  Oldest Queue Time: ${(metrics.queue.oldestQueueTime / 1000).toFixed(1)}s`);
    console.log(`  Average Queue Time: ${(metrics.queue.averageQueueTime / 1000).toFixed(1)}s`);
  }
  console.log();
}

/**
 * Show workload distribution
 */
async function showWorkload(agentType?: string): Promise<void> {
  const orchestrator = createOrchestrator();
  await orchestrator.initialize();

  const distribution = orchestrator.getBalancer().getWorkloadDistribution();

  console.log(chalk.cyan.bold('\n⚖️  Agent Workload Distribution\n'));

  const filtered = agentType
    ? distribution.filter(d => d.agentType === agentType)
    : distribution;

  if (filtered.length === 0) {
    console.log(chalk.yellow('No workload data available'));
    return;
  }

  for (const dist of filtered) {
    const utilizationBar = '█'.repeat(Math.floor(dist.utilizationPercent / 5));

    console.log(boxen(
      `${chalk.bold(dist.agentType)}\n\n` +
      `${chalk.gray('Utilization:')} ${utilizationBar} ${dist.utilizationPercent.toFixed(1)}%\n` +
      `${chalk.gray('Active Tasks:')} ${dist.activeTasks}\n` +
      `${chalk.gray('Queued Tasks:')} ${dist.queuedTasks}\n` +
      `${chalk.gray('Est. Completion:')} ${(dist.estimatedCompletionTime / 1000).toFixed(1)}s`,
      {
        padding: 1,
        margin: { bottom: 1, left: 2 },
        borderStyle: 'round',
        borderColor: dist.utilizationPercent > 80 ? 'red' : 'cyan',
      }
    ));
  }
}

/**
 * Initialize rules with examples
 */
async function initializeRules(force: boolean): Promise<void> {
  const rulesPath = join(homedir(), '.weaver', 'agent-rules.json');

  // Check if file exists
  try {
    await readFile(rulesPath);
    if (!force) {
      console.log(chalk.yellow('Rules file already exists. Use --force to overwrite.'));
      return;
    }
  } catch (error) {
    // File doesn't exist, continue
  }

  const exampleRules = {
    rules: [
      {
        id: 'ui-specialist',
        name: 'Route UI tasks to frontend specialist',
        description: 'Routes tasks involving UI files to specialized frontend agent',
        condition: "task.files && (task.files.includes('.tsx') || task.files.includes('.jsx'))",
        action: 'route_to_agent',
        agent: 'coder',
        priority: 100,
        enabled: true,
      },
      {
        id: 'parallel-tests',
        name: 'Split complex testing tasks',
        description: 'Automatically splits testing tasks with high complexity into parallel subtasks',
        condition: "task.type === 'testing' && task.estimatedComplexity > 5",
        action: 'split_parallel',
        max_subtasks: 4,
        priority: 90,
        enabled: true,
      },
      {
        id: 'critical-path-boost',
        name: 'Boost critical path priorities',
        description: 'Increases priority for tasks on the critical path',
        condition: "task.dependencies && task.dependencies.length > 2",
        action: 'adjust_priority',
        priority_adjustment: 25,
        priority: 80,
        enabled: true,
      },
      {
        id: 'research-routing',
        name: 'Route research tasks',
        description: 'Routes research and analysis tasks to researcher agent',
        condition: "task.description.toLowerCase().includes('research') || task.description.toLowerCase().includes('analyze')",
        action: 'route_to_agent',
        agent: 'researcher',
        priority: 95,
        enabled: true,
      },
      {
        id: 'architecture-design',
        name: 'Route architecture tasks',
        description: 'Routes system design and architecture tasks to architect agent',
        condition: "task.description.toLowerCase().includes('design') || task.description.toLowerCase().includes('architecture')",
        action: 'route_to_agent',
        agent: 'architect',
        priority: 95,
        enabled: true,
      },
    ],
  };

  await writeFile(rulesPath, JSON.stringify(exampleRules, null, 2), 'utf-8');

  console.log(chalk.green('✅ Agent orchestration rules initialized'));
  console.log(chalk.gray(`Rules file created at: ${rulesPath}`));
  console.log(chalk.gray(`Created ${exampleRules.rules.length} example rules\n`));
}
