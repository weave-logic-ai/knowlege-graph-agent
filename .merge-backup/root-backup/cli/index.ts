/**
 * Weaver CLI - Command-line interface for vault management
 */

import { Command } from 'commander';
import { createInitVaultCommand } from './commands/init-vault.js';
import {
  createStartCommand,
  createStopCommand,
  createRestartCommand,
  createStatusCommand,
  createLogsCommand,
  createHealthCommand,
  createMetricsCommand,
  createStatsCommand,
  createSyncCommand,
  createCommitCommand,
  createMonitorCommand,
} from './commands/service/index.js';
import { createSopCommand } from './commands/sop/index.js';
import { createLearnCommand } from './commands/learn.js';
import { createPerceiveCommand } from './commands/perceive.js';
import { createWorkflowCommand } from './commands/workflow.js';
import { createCultivateCommand } from './commands/cultivate.js';
import chalk from 'chalk';
import packageJson from '../../package.json' with { type: 'json' };

/**
 * Create and configure the CLI program
 */
export function createCLI(): Command {
  const program = new Command();

  program
    .name('weaver')
    .description('Weave-NN vault management CLI')
    .version(packageJson.version, '-v, --version', 'Display version number');

  // Add init-vault command
  program.addCommand(createInitVaultCommand());

  // Add learning loop commands
  program.addCommand(createLearnCommand());
  program.addCommand(createPerceiveCommand());

  // Add workflow commands
  program.addCommand(createWorkflowCommand());
  program.addCommand(createCultivateCommand());

  // Create service management command group
  const serviceCommand = new Command('service')
    .description('Service management commands')
    .addCommand(createStartCommand())
    .addCommand(createStopCommand())
    .addCommand(createRestartCommand())
    .addCommand(createStatusCommand())
    .addCommand(createLogsCommand())
    .addCommand(createHealthCommand())
    .addCommand(createMetricsCommand())
    .addCommand(createStatsCommand())
    .addCommand(createSyncCommand())
    .addCommand(createCommitCommand())
    .addCommand(createMonitorCommand());

  program.addCommand(serviceCommand);

  // Add SOP command group (Standard Operating Procedures)
  program.addCommand(createSopCommand());

  // Custom help formatting
  program.configureHelp({
    sortSubcommands: true,
    sortOptions: true,
  });

  // Custom error handling
  program.exitOverride((err) => {
    if (err.code === 'commander.help') {
      process.exit(0);
    }
    if (err.code === 'commander.version') {
      process.exit(0);
    }
    if (err.code === 'commander.helpDisplayed') {
      process.exit(0);
    }

    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  });

  return program;
}

/**
 * Run the CLI with provided arguments
 */
export async function runCLI(args = process.argv): Promise<void> {
  const program = createCLI();

  try {
    await program.parseAsync(args);
  } catch (error) {
    // Error already handled by exitOverride
    if (error instanceof Error && !(error as any).code?.startsWith('commander.')) {
      console.error(chalk.red('An unexpected error occurred'));
      console.error(error);
      process.exit(1);
    }
  }
}
