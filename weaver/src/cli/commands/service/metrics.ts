/**
 * Service Metrics Command
 * View service performance metrics
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { metricsCollector, type MetricsOptions } from '../../../service-manager/index.js';

/**
 * Create the metrics command
 */
export function createMetricsCommand(): Command {
  const command = new Command('metrics');

  command
    .description('View service performance metrics')
    .argument('[name]', 'Service name (optional)')
    .option('--duration <time>', 'Time window (e.g., "1h", "24h")', '1h')
    .option('--format <type>', 'Output format (table, json, prometheus)', 'table')
    .option('--export <path>', 'Export metrics to file')
    .action(async (name: string | undefined, options: MetricsOptions) => {
      try {
        if (!name) {
          console.error(chalk.red('Service name is required'));
          process.exit(1);
        }

        if (options.format === 'prometheus') {
          // Export Prometheus format
          const prometheus = metricsCollector.exportPrometheus(name);
          console.log(prometheus);
        } else if (options.format === 'json') {
          // Export JSON format
          const aggregated = metricsCollector.getAggregatedMetrics(name, options.duration || '1h');
          console.log(JSON.stringify(aggregated, null, 2));
        } else {
          // Display table format
          const aggregated = metricsCollector.getAggregatedMetrics(name, options.duration || '1h');
          displayMetricsTable(name, aggregated);
        }
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return command;
}

/**
 * Display metrics in table format
 */
function displayMetricsTable(name: string, metrics: any): void {
  console.log(chalk.bold(`\nMetrics: ${chalk.cyan(name)}`));
  console.log(chalk.gray('─'.repeat(50)));

  console.log(chalk.gray('\n  CPU Usage:'));
  console.log(`    Average: ${metrics.avg_cpu.toFixed(2)}%`);
  console.log(`    Maximum: ${metrics.max_cpu.toFixed(2)}%`);
  console.log(`    Minimum: ${metrics.min_cpu.toFixed(2)}%`);

  console.log(chalk.gray('\n  Memory Usage:'));
  console.log(`    Average: ${metrics.avg_memory_mb.toFixed(2)} MB`);
  console.log(`    Maximum: ${metrics.max_memory_mb.toFixed(2)} MB`);
  console.log(`    Minimum: ${metrics.min_memory_mb.toFixed(2)} MB`);

  console.log(chalk.gray('\n  Process Information:'));
  console.log(`    Uptime: ${formatUptime(metrics.uptime_seconds * 1000)}`);
  console.log(`    Total Restarts: ${metrics.total_restarts}`);

  console.log('');
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
