/**
 * Weaver CLI - Command-line interface for vault management
 * Optimized for fast startup and concurrent execution
 */

import { Command } from 'commander';
import chalk from 'chalk';
import packageJson from '../../package.json' with { type: 'json' };

// Lazy-loaded command creators (loaded on demand)
let cachedCommands: any = null;

/**
 * Lazy load all command creators
 */
async function loadCommands(): Promise<any> {
  if (cachedCommands) {
    return cachedCommands;
  }

  const [
    { createInitVaultCommand },
    { createInitPrimitivesCommand },
    serviceCommands,
    { createSopCommand },
    { createLearnCommand },
    { createPerceiveCommand },
    { createWorkflowCommandNew },
    { createCultivateCommand },
    { createCommitCommand },
    { createConfigCommand },
    { createAgentsCommand },
    { createSetupCommand },
    opsCommands,
  ] = await Promise.all([
    import('./commands/init-vault.js'),
    import('./commands/init-primitives.js'),
    import('./commands/service/index.js'),
    import('./commands/sop/index.js'),
    import('./commands/learn.js'),
    import('./commands/perceive.js'),
    import('./commands/workflow-new.js'),
    import('./commands/cultivate.js'),
    import('./commands/commit.js'),
    import('./commands/config.js'),
    import('./commands/agents.js'),
    import('./commands/setup.js'),
    import('./commands/ops/index.js'),
  ]);

  cachedCommands = {
    createInitVaultCommand,
    createInitPrimitivesCommand,
    ...serviceCommands,
    createSopCommand,
    createLearnCommand,
    createPerceiveCommand,
    createWorkflowCommandNew,
    createCultivateCommand,
    createCommitCommand,
    createConfigCommand,
    createAgentsCommand,
    createSetupCommand,
    ...opsCommands,
  };

  return cachedCommands;
}

/**
 * Create and configure the CLI program with lazy loading
 */
export function createCLI(): Command {
  const program = new Command();

  program
    .name('weaver')
    .description('Weave-NN vault management CLI')
    .version(packageJson.version, '-v, --version', 'Display version number');

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

  // Always load commands on first use
  // (The lazy loading is handled internally per command)
  
  return program;
}

/**
 * Load and register all commands
 */
async function loadAndRegisterCommands(program: Command): Promise<void> {
  const commands = await loadCommands();

  // Add init-vault command
  program.addCommand(commands.createInitVaultCommand());
  
  // Add init-primitives command
  program.addCommand(commands.createInitPrimitivesCommand());

  // Add AI-powered commit command
  program.addCommand(commands.createCommitCommand());

  // Add learning loop commands
  program.addCommand(commands.createLearnCommand());
  program.addCommand(commands.createPerceiveCommand());

  // Add workflow commands (NEW Next.js API-based)
  program.addCommand(commands.createWorkflowCommandNew());
  program.addCommand(commands.createCultivateCommand());

  // Create service management command group
  const serviceCommand = new Command('service')
    .description('Service management commands')
    .addCommand(commands.createStartCommand())
    .addCommand(commands.createStopCommand())
    .addCommand(commands.createRestartCommand())
    .addCommand(commands.createStatusCommand())
    .addCommand(commands.createLogsCommand())
    .addCommand(commands.createHealthCommand())
    .addCommand(commands.createMetricsCommand())
    .addCommand(commands.createStatsCommand())
    .addCommand(commands.createSyncCommand())
    .addCommand(commands.createCommitCommand())
    .addCommand(commands.createMonitorCommand());

  program.addCommand(serviceCommand);

  // Add SOP command group (Standard Operating Procedures)
  program.addCommand(commands.createSopCommand());

  // Add operations commands
  program.addCommand(commands.createDatabaseCommand());
  program.addCommand(commands.createCacheCommand());
  program.addCommand(commands.createDiagnoseCommand());
  program.addCommand(commands.createVersionCommand());

  // Add configuration management command (Phase 11)
  program.addCommand(commands.createConfigCommand());

  // Add agent orchestration commands
  program.addCommand(commands.createAgentsCommand());

  // Add setup commands
  program.addCommand(commands.createSetupCommand());
}

/**
 * Run the CLI with provided arguments
 */
export async function runCLI(args = process.argv): Promise<void> {
  const program = createCLI();
  
  // Load and register all commands before parsing
  await loadAndRegisterCommands(program);

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

// If this file is run directly (not imported), execute the CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  runCLI().catch((error) => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}
