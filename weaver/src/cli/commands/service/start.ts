/**
 * Service Start Command
 * Start a service using PM2
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { processManager, type ServiceConfig, type StartOptions } from '../../../service-manager/index.js';

/**
 * Create the start command
 */
export function createStartCommand(): Command {
  const command = new Command('start');

  command
    .description('Start a service')
    .argument('<name>', 'Service name to start')
    .option('--watch', 'Auto-restart on file changes')
    .option('--env <path>', 'Environment file path')
    .option('--port <number>', 'Override default port', parseInt)
    .option('--max-memory <size>', 'Memory limit (e.g., "512M")')
    .option('--max-restarts <number>', 'Max auto-restart attempts', parseInt)
    .option('--log-level <level>', 'Log level (debug, info, warn, error)')
    .action(async (name: string, options: StartOptions) => {
      const spinner = ora(`Starting service ${chalk.cyan(name)}...`).start();

      try {
        // Build service configuration
        const config: ServiceConfig = {
          name,
          type: 'mcp-server',
          enabled: true,
          script: './dist/mcp-server/cli.js',
          interpreter: 'node',
          args: [],
          env: options.env ? loadEnvFile(options.env) : undefined,
          max_memory_restart: options.maxMemory,
          max_restarts: options.maxRestarts,
        };

        // Start the service
        const processInfo = await processManager.start(config);

        spinner.succeed(chalk.green(`Service ${chalk.cyan(name)} started successfully`));
        console.log(chalk.gray(`  PID: ${processInfo.pid}`));
        console.log(chalk.gray(`  Memory: ${processInfo.memory_mb.toFixed(2)} MB`));
        console.log(chalk.gray(`  CPU: ${processInfo.cpu_percent.toFixed(2)}%`));
      } catch (error) {
        spinner.fail(chalk.red(`Failed to start service ${chalk.cyan(name)}`));
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return command;
}

/**
 * Load environment variables from file
 */
function loadEnvFile(_filePath: string): Record<string, string> {
  // Simplified implementation - in production, use dotenv
  return {};
}
