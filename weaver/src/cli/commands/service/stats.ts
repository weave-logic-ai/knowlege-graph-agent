/**
 * Service Stats Command
 * View aggregated service statistics
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { processManager, type StatsOptions } from '../../../service-manager/index.js';

/**
 * Create the stats command
 */
export function createStatsCommand(): Command {
  const command = new Command('stats');

  command
    .description('View aggregated service statistics')
    .option('--format <type>', 'Output format (table, json)', 'table')
    .option('--sort-by <field>', 'Sort by field (cpu, memory, uptime, restarts)', 'cpu')
    .action(async (options: StatsOptions) => {
      try {
        const instances = await processManager.list();

        if (options.format === 'json') {
          console.log(JSON.stringify(instances, null, 2));
        } else {
          displayStatsTable(instances, options.sortBy || 'cpu');
        }
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return command;
}

/**
 * Display stats in table format
 */
function displayStatsTable(instances: any[], sortBy: string): void {
  console.log(chalk.bold('\nService Statistics'));
  console.log(chalk.gray('─'.repeat(100)));

  if (instances.length === 0) {
    console.log(chalk.yellow('  No services running\n'));
    return;
  }

  // Sort instances
  const sorted = sortInstances(instances, sortBy);

  // Table header
  console.log(
    chalk.gray(
      `  ${'NAME'.padEnd(20)} ${'STATUS'.padEnd(10)} ${'CPU'.padEnd(8)} ${'MEMORY'.padEnd(10)} ${'UPTIME'.padEnd(12)} ${'RESTARTS'.padEnd(8)}`
    )
  );

  // Table rows
  for (const instance of sorted) {
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

  console.log('');
}

/**
 * Sort instances by field
 */
function sortInstances(instances: any[], sortBy: string): any[] {
  return [...instances].sort((a, b) => {
    switch (sortBy) {
      case 'cpu':
        return (b.status.process?.cpu_percent || 0) - (a.status.process?.cpu_percent || 0);
      case 'memory':
        return (b.status.process?.memory_mb || 0) - (a.status.process?.memory_mb || 0);
      case 'uptime':
        return (b.status.uptime || 0) - (a.status.uptime || 0);
      case 'restarts':
        return b.status.restarts - a.status.restarts;
      default:
        return 0;
    }
  });
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
