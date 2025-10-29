/**
 * Service Status Command
 * Display service status information
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { processManager, type StatusOptions } from '../../../service-manager/index.js';

/**
 * Create the status command
 */
export function createStatusCommand(): Command {
  const command = new Command('status');

  command
    .description('Display service status')
    .argument('[name]', 'Service name (optional, shows all if omitted)')
    .option('--json', 'Output in JSON format')
    .option('--verbose', 'Include full details')
    .option('--refresh <seconds>', 'Auto-refresh interval in seconds', parseInt)
    .action(async (name: string | undefined, options: StatusOptions) => {
      try {
        if (name) {
          // Show status for specific service
          await showServiceStatus(name, options);
        } else {
          // Show status for all services
          await showAllServicesStatus(options);
        }
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return command;
}

/**
 * Show status for a specific service
 */
async function showServiceStatus(name: string, options: StatusOptions): Promise<void> {
  const status = await processManager.getStatus(name);

  if (options.json) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  // Format human-readable output
  console.log(chalk.bold(`\nService: ${chalk.cyan(name)}`));
  console.log(chalk.gray('─'.repeat(50)));

  const stateColor = getStateColor(status.state);
  console.log(`  Status: ${chalk[stateColor](status.state.toUpperCase())}`);

  if (status.uptime !== undefined) {
    console.log(`  Uptime: ${formatUptime(status.uptime)}`);
  }

  console.log(`  Restarts: ${status.restarts}`);

  if (status.last_restart) {
    console.log(`  Last Restart: ${status.last_restart.toLocaleString()}`);
  }

  if (status.process) {
    console.log(chalk.gray('\n  Process Information:'));
    console.log(`    PID: ${status.process.pid}`);
    console.log(`    CPU: ${status.process.cpu_percent.toFixed(2)}%`);
    console.log(`    Memory: ${status.process.memory_mb.toFixed(2)} MB`);
    console.log(`    Threads: ${status.process.threads}`);
  }

  console.log('');
}

/**
 * Show status for all services
 */
async function showAllServicesStatus(options: StatusOptions): Promise<void> {
  const instances = await processManager.list();

  if (options.json) {
    console.log(JSON.stringify(instances, null, 2));
    return;
  }

  console.log(chalk.bold('\nAll Services'));
  console.log(chalk.gray('─'.repeat(80)));

  if (instances.length === 0) {
    console.log(chalk.yellow('  No services running\n'));
    return;
  }

  // Table header
  console.log(
    chalk.gray(
      `  ${'NAME'.padEnd(20)} ${'STATUS'.padEnd(10)} ${'PID'.padEnd(8)} ${'CPU'.padEnd(8)} ${'MEMORY'.padEnd(10)} ${'RESTARTS'.padEnd(8)}`
    )
  );

  // Table rows
  for (const instance of instances) {
    const name = instance.config.name.padEnd(20);
    const stateColor = getStateColor(instance.status.state);
    const status = chalk[stateColor](instance.status.state.toUpperCase().padEnd(10));
    const pid = (instance.status.process?.pid.toString() || '-').padEnd(8);
    const cpu = instance.status.process
      ? `${instance.status.process.cpu_percent.toFixed(1)}%`.padEnd(8)
      : '-'.padEnd(8);
    const memory = instance.status.process
      ? `${instance.status.process.memory_mb.toFixed(0)} MB`.padEnd(10)
      : '-'.padEnd(10);
    const restarts = instance.status.restarts.toString().padEnd(8);

    console.log(`  ${name} ${status} ${pid} ${cpu} ${memory} ${restarts}`);
  }

  console.log('');
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
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }

  return `${seconds}s`;
}
