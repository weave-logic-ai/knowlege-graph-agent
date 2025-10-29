/**
 * Service Logs Command
 * View service logs
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { logger, type LogOptions, type LogLevel } from '../../../service-manager/index.js';

/**
 * Create the logs command
 */
export function createLogsCommand(): Command {
  const command = new Command('logs');

  command
    .description('View service logs')
    .argument('<name>', 'Service name')
    .option('-f, --follow', 'Follow log output (tail mode)')
    .option('-n, --lines <number>', 'Number of lines to show', parseInt, 100)
    .option('--level <level>', 'Filter by log level (debug, info, warn, error)')
    .option('--since <time>', 'Show logs since timestamp')
    .option('--grep <pattern>', 'Filter by pattern')
    .option('--json', 'Output in JSON format')
    .action(async (name: string, options: LogOptions) => {
      try {
        // Initialize logger
        await logger.initialize();

        if (options.follow) {
          // Tail mode
          await tailLogs(name, options);
        } else {
          // Static log view
          await viewLogs(name, options);
        }
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return command;
}

/**
 * View static logs
 */
async function viewLogs(name: string, options: LogOptions): Promise<void> {
  const entries = await logger.readLogs(name, options);

  if (options.json) {
    console.log(JSON.stringify(entries, null, 2));
    return;
  }

  if (entries.length === 0) {
    console.log(chalk.yellow('No logs found'));
    return;
  }

  for (const entry of entries) {
    console.log(formatLogEntry(entry));
  }
}

/**
 * Tail logs in real-time
 */
async function tailLogs(name: string, options: LogOptions): Promise<void> {
  console.log(chalk.gray(`Following logs for ${chalk.cyan(name)}...`));
  console.log(chalk.gray('Press Ctrl+C to stop\n'));

  for await (const entry of logger.tailLogs(name, options)) {
    console.log(formatLogEntry(entry));
  }
}

/**
 * Format log entry for display
 */
function formatLogEntry(entry: any): string {
  const timestamp = chalk.gray(entry.timestamp.toISOString());
  const level = formatLogLevel(entry.level);
  const message = entry.message;

  let line = `${timestamp} ${level} ${message}`;

  if (entry.metadata && Object.keys(entry.metadata).length > 0) {
    line += chalk.gray(` ${JSON.stringify(entry.metadata)}`);
  }

  return line;
}

/**
 * Format log level with colors
 */
function formatLogLevel(level: LogLevel): string {
  const colors: Record<LogLevel, 'gray' | 'cyan' | 'yellow' | 'red'> = {
    debug: 'gray',
    info: 'cyan',
    warn: 'yellow',
    error: 'red',
  };

  const color = colors[level] || 'cyan';
  return chalk[color](level.toUpperCase().padEnd(5));
}
