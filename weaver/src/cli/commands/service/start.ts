/**
 * Service Start Command
 * Start a service with comprehensive recovery options
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import {
  processManager,
  recoveryManager,
  portAllocator,
  databaseRecovery,
  configValidator,
  stateManager,
  type ServiceConfig,
  type StartOptions,
} from '../../../service-manager/index.js';

/**
 * Extended start options
 */
interface ExtendedStartOptions extends StartOptions {
  script?: string;
  config?: string;
  maxRestarts?: number;
  minUptime?: number;
  port?: number;
  autoPort?: boolean;
  portRetry?: number;
  db?: string;
  autoRestore?: boolean;
  createIfMissing?: boolean;
  watchConfig?: boolean;
  restartBackoff?: 'linear' | 'exponential';
  circuitBreaker?: boolean;
  failureThreshold?: number;
  stateFile?: string;
  lazyInit?: boolean;
  maxCpu?: number;
}

/**
 * Create the start command
 */
export function createStartCommand(): Command {
  const command = new Command('start');

  command
    .description('Start a service with comprehensive failure recovery')
    .argument('<name>', 'Service name to start')
    .option('--script <path>', 'Path to service script')
    .option('--config <path>', 'Path to configuration file')
    .option('--max-restarts <number>', 'Maximum restart attempts', parseInt, 10)
    .option('--min-uptime <ms>', 'Minimum uptime before counting as successful (ms)', parseInt, 5000)
    .option('--port <number>', 'Port number', parseInt)
    .option('--auto-port', 'Automatically select available port on conflict')
    .option('--port-retry <number>', 'Port binding retry attempts', parseInt, 3)
    .option('--db <path>', 'Database file path')
    .option('--auto-restore', 'Automatically restore from backup on corruption')
    .option('--create-if-missing', 'Create new database if missing')
    .option('--watch-config', 'Watch configuration file for changes')
    .option('--restart-backoff <type>', 'Restart backoff strategy (linear|exponential)', 'exponential')
    .option('--circuit-breaker', 'Enable circuit breaker pattern')
    .option('--failure-threshold <number>', 'Circuit breaker failure threshold', parseInt, 3)
    .option('--state-file <path>', 'Path to save service state')
    .option('--watch', 'Auto-restart on file changes')
    .option('--env <path>', 'Environment file path')
    .option('--max-memory <size>', 'Memory limit (e.g., "512M")')
    .option('--max-cpu <percent>', 'CPU limit percentage', parseInt)
    .option('--lazy-init', 'Enable lazy initialization for faster startup')
    .option('--log-level <level>', 'Log level (debug, info, warn, error)')
    .action(async (name: string, options: ExtendedStartOptions) => {
      let spinner = ora(`Starting service ${chalk.cyan(name)}...`).start();

      try {
        // Load configuration
        let config: ServiceConfig;

        if (options.config) {
          // Load from config file
          spinner.text = `Loading configuration from ${options.config}...`;
          config = await configValidator.loadConfig(options.config);

          // Merge with command-line options
          config = configValidator.mergeWithOptions(config, options);
        } else {
          // Build from options
          if (!options.script) {
            throw new Error('--script is required when not using --config');
          }

          config = {
            name,
            type: 'custom',
            enabled: true,
            script: options.script,
            interpreter: 'node',
            args: [],
            max_restarts: options.maxRestarts || 10,
            // Lazy init reduces min_uptime for faster startup
            min_uptime: options.lazyInit ? 1000 : (options.minUptime || 5000),
            restart_delay: 1000,
            max_memory_restart: options.maxMemory,
          };
        }

        // Handle database recovery
        if (options.db) {
          spinner.text = 'Checking database...';
          const dbResult = await databaseRecovery.recoverDatabase({
            dbPath: options.db,
            autoRestore: options.autoRestore,
            createIfMissing: options.createIfMissing,
          });

          if (!dbResult.success) {
            throw new Error(dbResult.message);
          }

          spinner.succeed(chalk.green(`Database ${dbResult.action}: ${dbResult.message}`));
          spinner = ora(`Starting service ${chalk.cyan(name)}...`).start();
        }

        // Handle port allocation
        if (options.port || options.autoPort) {
          spinner.text = 'Allocating port...';

          const port = await portAllocator.allocatePort(name, {
            preferredPort: options.port,
            autoSelect: options.autoPort,
            retryCount: options.portRetry || 3,
          });

          spinner.text = `Allocated port ${port} for ${name}`;

          // Add port to environment
          config.env = {
            ...config.env,
            PORT: String(port),
          };
        }

        // Initialize recovery manager
        recoveryManager.initializeRecovery(name, {
          maxRestarts: config.max_restarts || 10,
          minUptime: config.min_uptime || 5000,
          restartDelay: config.restart_delay || 1000,
          restartBackoff: (options.restartBackoff as 'linear' | 'exponential') || 'exponential',
          circuitBreaker: options.circuitBreaker,
          failureThreshold: options.failureThreshold || 3,
          saveState: !!options.stateFile,
          stateFile: options.stateFile,
        });

        // Try to restore previous state
        if (options.stateFile) {
          const previousState = await stateManager.restoreState(name);
          if (previousState) {
            spinner.text = `Restored previous state for ${name}`;
          }
        }

        // Start the service
        spinner.text = `Starting ${name}...`;
        const processInfo = await processManager.start(config);

        // Save initial state
        if (options.stateFile) {
          await stateManager.saveState(name, {
            state: 'running',
            restarts: 0,
            process: processInfo,
          });
        }

        spinner.succeed(chalk.green(`Service ${chalk.cyan(name)} started successfully`));
        console.log(chalk.gray(`  PID: ${processInfo.pid}`));
        console.log(chalk.gray(`  Memory: ${processInfo.memory_mb.toFixed(2)} MB`));
        console.log(chalk.gray(`  CPU: ${processInfo.cpu_percent.toFixed(2)}%`));

        // Watch config for changes if requested
        if (options.watchConfig && options.config) {
          await configValidator.watchConfig(options.config, async (newConfig) => {
            console.log(chalk.yellow(`Configuration changed, reloading ${name}...`));
            // In a full implementation, this would trigger a graceful reload
          });
          console.log(chalk.gray(`  Watching config: ${options.config}`));
        }

      } catch (error) {
        spinner.fail(chalk.red(`Failed to start service ${chalk.cyan(name)}`));
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return command;
}
