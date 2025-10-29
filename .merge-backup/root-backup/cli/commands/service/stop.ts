/**
 * Service Stop Command
 * Stop a running service
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { processManager, type StopOptions } from '../../../service-manager/index.js';

/**
 * Create the stop command
 */
export function createStopCommand(): Command {
  const command = new Command('stop');

  command
    .description('Stop a running service')
    .argument('<name>', 'Service name to stop')
    .option('--force', 'Kill immediately (no graceful shutdown)')
    .option('--timeout <ms>', 'Graceful shutdown timeout in milliseconds', parseInt)
    .action(async (name: string, options: StopOptions) => {
      const spinner = ora(`Stopping service ${chalk.cyan(name)}...`).start();

      try {
        await processManager.stop(name, options.force);

        spinner.succeed(chalk.green(`Service ${chalk.cyan(name)} stopped successfully`));
      } catch (error) {
        spinner.fail(chalk.red(`Failed to stop service ${chalk.cyan(name)}`));
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return command;
}
