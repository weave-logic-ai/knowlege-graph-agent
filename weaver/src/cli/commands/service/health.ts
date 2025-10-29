/**
 * Service Health Command
 * Check service health status
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { healthCheckService, type ServiceConfig, type HealthStatus } from '../../../service-manager/index.js';

/**
 * Create the health command
 */
export function createHealthCommand(): Command {
  const command = new Command('health');

  command
    .description('Check service health')
    .argument('[name]', 'Service name (optional)')
    .option('--timeout <ms>', 'Health check timeout in milliseconds', parseInt, 5000)
    .option('--interval <ms>', 'Check interval in milliseconds', parseInt)
    .option('--retries <number>', 'Retry attempts', parseInt, 3)
    .action(async (name: string | undefined, options: any) => {
      try {
        // Mock service config - in production, load from registry
        const config: ServiceConfig = {
          name: name || 'weaver-mcp',
          type: 'mcp-server',
          enabled: true,
          script: './dist/mcp-server/cli.js',
          health: {
            enabled: true,
            endpoint: 'http://localhost:3000/health',
            timeout: options.timeout,
            retries: options.retries,
            interval: options.interval || 30000,
          },
        };

        const result = await healthCheckService.checkHealth(config);

        // Display results
        displayHealthResult(config.name, result);

        // Set exit code based on health
        if (result.overall_health === 'unhealthy') {
          process.exit(2);
        } else if (result.overall_health === 'degraded') {
          process.exit(1);
        } else {
          process.exit(0);
        }
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(2);
      }
    });

  return command;
}

/**
 * Display health check result
 */
function displayHealthResult(name: string, result: any): void {
  console.log(chalk.bold(`\nHealth Check: ${chalk.cyan(name)}`));
  console.log(chalk.gray('─'.repeat(50)));

  const statusColor = getHealthColor(result.overall_health);
  console.log(
    `  Overall Status: ${chalk[statusColor](result.overall_health.toUpperCase())}`
  );
  console.log(`  Checked at: ${result.timestamp.toLocaleString()}`);

  if (result.checks && result.checks.length > 0) {
    console.log(chalk.gray('\n  Individual Checks:'));

    for (const check of result.checks) {
      const checkColor = getHealthColor(check.status);
      const duration = check.duration_ms ? ` (${check.duration_ms}ms)` : '';

      console.log(
        `    ${chalk[checkColor]('●')} ${check.name}: ${chalk[checkColor](check.status)}${duration}`
      );

      if (check.message) {
        console.log(chalk.gray(`      ${check.message}`));
      }
    }
  }

  console.log('');
}

/**
 * Get color for health status
 */
function getHealthColor(status: HealthStatus): 'green' | 'yellow' | 'red' | 'gray' {
  const colorMap: Record<HealthStatus, 'green' | 'yellow' | 'red' | 'gray'> = {
    healthy: 'green',
    degraded: 'yellow',
    unhealthy: 'red',
    unknown: 'gray',
  };

  return colorMap[status] || 'gray';
}
