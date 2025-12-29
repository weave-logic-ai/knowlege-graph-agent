/**
 * Diagnostics Command
 *
 * System diagnostics and health monitoring for knowledge graph.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { join } from 'path';
import { existsSync } from 'fs';
import {
  createHealthMonitor,
  createDatabaseCheck,
  createMemoryCheck,
  createDiskCheck,
} from '../../health/index.js';
import { createIntegrityChecker } from '../../recovery/index.js';
import type { SystemHealth, HealthStatus } from '../../health/index.js';

export function createDiagnosticsCommand(): Command {
  const diagnostics = new Command('diagnostics')
    .alias('diag')
    .description('System diagnostics and health monitoring');

  diagnostics
    .command('health')
    .description('Run health checks on all components')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const cwd = process.cwd();
        const dbPath = join(cwd, '.kg', 'knowledge.db');

        const monitor = createHealthMonitor();

        // Register health checks
        monitor.register(createDatabaseCheck(dbPath));
        monitor.register(createMemoryCheck(500));
        monitor.register(createDiskCheck(cwd));

        console.log(chalk.cyan('Running health checks...\n'));

        const health = await monitor.check();

        if (options.json) {
          console.log(JSON.stringify(health, null, 2));
        } else {
          printHealth(health);
        }

        if (health.status === 'unhealthy') {
          process.exit(1);
        }
      } catch (error) {
        console.error(chalk.red('Error running health checks:'), error);
        process.exit(1);
      }
    });

  diagnostics
    .command('integrity')
    .description('Check database integrity')
    .option('--repair', 'Attempt to repair issues')
    .action(async (options) => {
      try {
        const cwd = process.cwd();
        const dbPath = join(cwd, '.kg', 'knowledge.db');

        if (!existsSync(dbPath)) {
          console.log(chalk.yellow('Database not found. Run "kg init" first.'));
          process.exit(1);
        }

        console.log(chalk.cyan('Checking database integrity...\n'));

        const checker = createIntegrityChecker(dbPath);
        const result = await checker.check();

        if (result.valid) {
          console.log(chalk.green('Database integrity: OK'));
        } else {
          console.log(chalk.red('Database integrity: FAILED'));
          result.issues.forEach((issue: string) => {
            console.log(chalk.yellow(`  - ${issue}`));
          });

          if (options.repair) {
            console.log(chalk.cyan('\nAttempting repairs...'));
            const repairResult = await checker.repair();
            if (repairResult.repaired) {
              console.log(chalk.green('Repairs completed'));
              repairResult.actions.forEach((action: string) => {
                console.log(chalk.gray(`  - ${action}`));
              });
            } else {
              console.log(chalk.red('Some repairs failed'));
              process.exit(1);
            }
          }
        }

        console.log(chalk.gray(`\nCheck completed in ${result.duration}ms`));
      } catch (error) {
        console.error(chalk.red('Error checking integrity:'), error);
        process.exit(1);
      }
    });

  diagnostics
    .command('memory')
    .description('Show memory usage statistics')
    .action(() => {
      const usage = process.memoryUsage();

      console.log(chalk.cyan.bold('\nMemory Usage:\n'));
      console.log(chalk.white(`  Heap Used:     ${formatBytes(usage.heapUsed)}`));
      console.log(chalk.white(`  Heap Total:    ${formatBytes(usage.heapTotal)}`));
      console.log(chalk.white(`  RSS:           ${formatBytes(usage.rss)}`));
      console.log(chalk.white(`  External:      ${formatBytes(usage.external)}`));
      console.log(chalk.white(`  Array Buffers: ${formatBytes(usage.arrayBuffers)}`));
      console.log('');
    });

  diagnostics
    .command('status')
    .description('Show overall system status')
    .action(async () => {
      try {
        const cwd = process.cwd();
        const kgDir = join(cwd, '.kg');
        const dbPath = join(kgDir, 'knowledge.db');

        console.log(chalk.cyan.bold('\nKnowledge Graph Status:\n'));

        // Check initialization
        const initialized = existsSync(kgDir);
        console.log(chalk.white('Initialized:'), initialized ? chalk.green('Yes') : chalk.red('No'));

        // Check database
        const dbExists = existsSync(dbPath);
        console.log(chalk.white('Database:'), dbExists ? chalk.green('OK') : chalk.yellow('Not found'));

        // Show paths
        console.log(chalk.white('\nPaths:'));
        console.log(chalk.gray(`  Project: ${cwd}`));
        console.log(chalk.gray(`  KG Dir:  ${kgDir}`));
        console.log(chalk.gray(`  DB:      ${dbPath}`));

        // Memory
        const usage = process.memoryUsage();
        console.log(chalk.white('\nMemory:'));
        console.log(chalk.gray(`  Heap: ${formatBytes(usage.heapUsed)} / ${formatBytes(usage.heapTotal)}`));

        console.log('');
      } catch (error) {
        console.error(chalk.red('Error getting status:'), error);
        process.exit(1);
      }
    });

  return diagnostics;
}

function printHealth(health: SystemHealth): void {
  const statusColor: Record<HealthStatus, typeof chalk.green> = {
    healthy: chalk.green,
    degraded: chalk.yellow,
    unhealthy: chalk.red,
    unknown: chalk.gray,
  };

  console.log(chalk.white('Overall Status:'), statusColor[health.status](health.status.toUpperCase()));
  console.log(chalk.gray(`Uptime: ${Math.floor(health.uptime / 1000)}s`));
  console.log('');

  console.log(chalk.white('Components:'));
  for (const component of health.components) {
    const icon = component.status === 'healthy' ? '[OK]' : component.status === 'degraded' ? '[!]' : '[X]';
    const colorFn = statusColor[component.status];
    console.log(
      `  ${colorFn(icon)} ${component.name.padEnd(15)} ${colorFn(component.status)}`
    );
    if (component.message) {
      console.log(chalk.gray(`    ${component.message}`));
    }
    if (component.responseTime !== undefined) {
      console.log(chalk.gray(`    Response time: ${component.responseTime}ms`));
    }
  }
  console.log('');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
