/**
 * Service Health Command
 * Check service health status with comprehensive error handling
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { healthCheckService, type ServiceConfig, type HealthStatus } from '../../../service-manager/index.js';
import { withRetry } from '../../../utils/error-recovery.js';

/**
 * Health check options
 */
interface HealthCheckOptions {
  timeout?: number;
  interval?: number;
  retries?: number;
  endpoint?: string;
}

/**
 * Create the health command
 */
export function createHealthCommand(): Command {
  const command = new Command('health');

  command
    .description('Check service health with retry and error handling')
    .argument('[name]', 'Service name (optional)')
    .option('--timeout <ms>', 'Health check timeout in milliseconds', parseInt, 5000)
    .option('--interval <ms>', 'Check interval in milliseconds', parseInt)
    .option('--retries <number>', 'Retry attempts', parseInt, 3)
    .option('--endpoint <url>', 'Custom health check endpoint')
    .action(async (name: string | undefined, options: HealthCheckOptions) => {
      try {
        // Mock service config - in production, load from registry
        const config: ServiceConfig = {
          name: name || 'weaver-mcp',
          type: 'mcp-server',
          enabled: true,
          script: './dist/mcp-server/cli.js',
          health: {
            enabled: true,
            endpoint: options.endpoint || 'http://localhost:3000/health',
            timeout: options.timeout || 5000,
            retries: options.retries || 3,
            interval: options.interval || 30000,
          },
        };

        // Perform health check with retries and error handling
        const result = await withRetry(
          async (attempt) => {
            if (attempt > 0) {
              console.log(chalk.gray(`  Retry attempt ${attempt}...`));
            }
            return await healthCheckService.checkHealth(config);
          },
          {
            maxAttempts: options.retries || 3,
            initialDelay: 1000,
            backoffMultiplier: 2,
            jitter: true,
            attemptTimeout: options.timeout,
            onRetry: (error, attempt) => {
              // Handle specific error types
              if (error.message.includes('ENOTFOUND') || error.message.includes('DNS')) {
                console.error(chalk.red(`DNS resolution failed: Unable to resolve host`));
              } else if (error.message.includes('ECONNREFUSED') || error.message.includes('refused')) {
                console.error(chalk.red(`Connection refused: Service is not responding`));
              } else if (error.message.includes('timeout')) {
                console.error(chalk.red(`Request timeout: Service took too long to respond`));
              } else {
                console.error(chalk.red(`Health check failed: ${error.message}`));
              }
            },
          }
        );

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
      } catch (error: any) {
        // Handle specific network errors
        if (error.message.includes('ENOTFOUND') || error.message.includes('DNS') || error.message.includes('not found')) {
          console.error(chalk.red('DNS resolution failure: Unable to resolve the endpoint hostname'));
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('refused') || error.message.includes('connect')) {
          console.error(chalk.red('Connection refused: The service is not running or not accessible'));
        } else if (error.message.includes('timeout')) {
          console.error(chalk.red('Health check timeout: Service did not respond in time'));
        } else if (error.message.includes('EADDRINUSE')) {
          console.error(chalk.red('Port already in use: Another service is using the same port'));
        } else {
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        }

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
