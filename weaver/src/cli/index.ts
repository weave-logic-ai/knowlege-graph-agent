/**
 * Weaver CLI - Command-line interface for vault management
 */

import { Command } from 'commander';
import { createInitVaultCommand } from './commands/init-vault.js';
import chalk from 'chalk';
import packageJson from '../../package.json' assert { type: 'json' };

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
