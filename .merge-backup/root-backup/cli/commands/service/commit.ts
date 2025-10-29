/**
 * Service Commit Command
 * Manually trigger git commit for service changes
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import type { CommitOptions } from '../../../service-manager/index.js';

/**
 * Create the commit command
 */
export function createCommitCommand(): Command {
  const command = new Command('commit');

  command
    .description('Manually trigger git commit for service changes')
    .argument('<message>', 'Commit message')
    .option('--auto', 'AI-generated commit message')
    .option('--scope <type>', 'Commit scope (feat, fix, docs, refactor, test)')
    .action(async (message: string, options: CommitOptions) => {
      const spinner = ora('Creating commit...').start();

      try {
        // Mock commit operation - in production, integrate with git
        await mockCommit(message, options);

        spinner.succeed(chalk.green('Commit created successfully'));
      } catch (error) {
        spinner.fail(chalk.red('Commit failed'));
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return command;
}

/**
 * Mock commit operation
 */
async function mockCommit(message: string, options: CommitOptions): Promise<void> {
  // Simulate commit delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (options.auto) {
    console.log(chalk.gray('\n  AI-generated commit message enabled'));
  }

  if (options.scope) {
    console.log(chalk.gray(`  Scope: ${options.scope}`));
  }

  console.log(chalk.gray(`  Message: ${message}`));
}
