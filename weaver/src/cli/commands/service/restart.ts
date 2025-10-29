/**
 * Service Restart Command
 * Restart a running service with state preservation
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import {
  processManager,
  stateManager,
  type RestartOptions
} from '../../../service-manager/index.js';

/**
 * Extended restart options
 */
interface ExtendedRestartOptions extends RestartOptions {
  saveState?: boolean;
  stateFile?: string;
}

/**
 * Create the restart command
 */
export function createRestartCommand(): Command {
  const command = new Command('restart');

  command
    .description('Restart a service with optional state preservation')
    .argument('<name>', 'Service name to restart')
    .option('--zero-downtime', 'Zero-downtime restart')
    .option('--wait <ms>', 'Wait time before restart (ms)', parseInt)
    .option('--save-state', 'Save service state before restart')
    .option('--state-file <path>', 'Path to save service state')
    .action(async (name: string, options: ExtendedRestartOptions) => {
      const spinner = ora(`Restarting service ${chalk.cyan(name)}...`).start();

      try {
        // Save state before restart if requested
        if (options.saveState || options.stateFile) {
          spinner.text = 'Saving service state...';
          const status = await processManager.getStatus(name);
          await stateManager.saveBeforeRestart(name, status);

          if (options.stateFile) {
            const fs = await import('fs/promises');
            const stateData = await stateManager.restoreState(name);
            if (stateData) {
              await fs.writeFile(options.stateFile, JSON.stringify(stateData, null, 2));
            }
          }
        }

        // Apply wait if specified
        if (options.wait) {
          spinner.text = `Waiting ${options.wait}ms before restart...`;
          await new Promise(resolve => setTimeout(resolve, options.wait));
        }

        spinner.text = `Restarting ${name}...`;
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
