/**
 * Service Restart Command
 * Restart a running service
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { processManager, type RestartOptions } from '../../../service-manager/index.js';

/**
 * Create the restart command
 */
export function createRestartCommand(): Command {
  const command = new Command('restart');

  command
    .description('Restart a running service')
    .argument('<name>', 'Service name to restart')
    .option('--zero-downtime', 'Rolling restart (zero downtime)')
    .option('--wait <ms>', 'Wait between restarts in milliseconds', parseInt)
    .action(async (name: string, _options: RestartOptions) => {
      const spinner = ora(`Restarting service ${chalk.cyan(name)}...`).start();

      try {
        await processManager.restart(name);

        spinner.succeed(chalk.green(`Service ${chalk.cyan(name)} restarted successfully`));
      } catch (error) {
        spinner.fail(chalk.red(`Failed to restart service ${chalk.cyan(name)}`));
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return command;
}
