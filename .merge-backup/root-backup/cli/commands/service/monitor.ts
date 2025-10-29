/**
 * Service Monitor Command
 * Real-time service monitoring dashboard
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { processManager, type MonitorOptions } from '../../../service-manager/index.js';

/**
 * Create the monitor command
 */
export function createMonitorCommand(): Command {
  const command = new Command('monitor');

  command
    .description('Real-time service monitoring dashboard')
    .option('--refresh <ms>', 'Update interval in milliseconds', parseInt, 2000)
    .option('--alerts', 'Enable alert notifications')
    .action(async (options: MonitorOptions) => {
      console.log(chalk.bold('Service Monitor'));
      console.log(chalk.gray('Press Ctrl+C to stop\n'));

      const refresh = options.refresh || 2000;

      // Start monitoring loop
      while (true) {
        try {
          await displayMonitor();
          await new Promise((resolve) => setTimeout(resolve, refresh));

          // Clear screen for next update
          process.stdout.write('\x1Bc');
        } catch (error) {
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
          break;
        }
      }
    });

  return command;
}

/**
 * Display monitoring dashboard
 */
async function displayMonitor(): Promise<void> {
  const instances = await processManager.list();

  console.log(chalk.bold('Service Monitor'));
  console.log(chalk.gray(`Updated: ${new Date().toLocaleString()}`));
  console.log(chalk.gray('─'.repeat(100)));

  if (instances.length === 0) {
    console.log(chalk.yellow('\n  No services running\n'));
    return;
  }

  // Table header
  console.log(
    chalk.gray(
      `\n  ${'NAME'.padEnd(20)} ${'STATUS'.padEnd(10)} ${'CPU'.padEnd(8)} ${'MEMORY'.padEnd(10)} ${'UPTIME'.padEnd(12)} ${'RESTARTS'.padEnd(8)}`
    )
  );

  // Table rows
  for (const instance of instances) {
    const name = instance.config.name.padEnd(20);
    const stateColor = getStateColor(instance.status.state);
    const status = chalk[stateColor](instance.status.state.toUpperCase().padEnd(10));
    const cpu = instance.status.process
      ? `${instance.status.process.cpu_percent.toFixed(1)}%`.padEnd(8)
      : '-'.padEnd(8);
    const memory = instance.status.process
      ? `${instance.status.process.memory_mb.toFixed(0)} MB`.padEnd(10)
      : '-'.padEnd(10);
    const uptime = instance.status.uptime
      ? formatUptime(instance.status.uptime).padEnd(12)
      : '-'.padEnd(12);
    const restarts = instance.status.restarts.toString().padEnd(8);

    console.log(`  ${name} ${status} ${cpu} ${memory} ${uptime} ${restarts}`);
  }

  console.log('\n' + chalk.gray('Press Ctrl+C to stop'));
}

/**
 * Get color for service state
 */
function getStateColor(state: string): 'green' | 'yellow' | 'red' | 'gray' {
  const colorMap: Record<string, 'green' | 'yellow' | 'red' | 'gray'> = {
    running: 'green',
    starting: 'yellow',
    stopping: 'yellow',
    stopped: 'gray',
    errored: 'red',
    unknown: 'gray',
  };

  return colorMap[state] || 'gray';
}

/**
 * Format uptime duration
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${seconds}s`;
}
