/**
 * Serve Command
 *
 * CLI command for running all Knowledge Graph Agent services concurrently.
 * Supports MCP server (stdio), GraphQL server (HTTP), and web dashboard.
 *
 * @module cli/commands/serve
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { join } from 'path';
import { existsSync } from 'fs';
import {
  ServerManager,
  createServerManager,
  createDefaultConfig,
  DEFAULT_GRAPHQL_PORT,
  DEFAULT_DASHBOARD_PORT,
  DEFAULT_DATABASE_PATH,
} from '../../server/index.js';
import type {
  ServerConfig,
  ServeCommandOptions,
  ParsedServeOptions,
  ServerEventType,
} from '../../server/types.js';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse and validate serve command options
 */
function parseOptions(options: ServeCommandOptions, projectRoot: string): ParsedServeOptions {
  // Determine which servers to enable
  let mcp = options.mcp ?? false;
  let graphql = options.graphql ?? false;
  let dashboard = options.dashboard ?? false;

  // --all enables everything
  if (options.all) {
    mcp = true;
    graphql = true;
    dashboard = true;
  }

  // If no specific servers selected, default to MCP only
  if (!mcp && !graphql && !dashboard) {
    mcp = true;
  }

  // Parse ports
  const graphqlPort =
    typeof options.portGraphql === 'string'
      ? parseInt(options.portGraphql, 10)
      : options.portGraphql ?? DEFAULT_GRAPHQL_PORT;

  const dashboardPort =
    typeof options.portDashboard === 'string'
      ? parseInt(options.portDashboard, 10)
      : options.portDashboard ?? DEFAULT_DASHBOARD_PORT;

  // Validate ports
  if (graphql && (isNaN(graphqlPort) || graphqlPort < 1 || graphqlPort > 65535)) {
    throw new Error(`Invalid GraphQL port: ${options.portGraphql}`);
  }

  if (dashboard && (isNaN(dashboardPort) || dashboardPort < 1 || dashboardPort > 65535)) {
    throw new Error(`Invalid Dashboard port: ${options.portDashboard}`);
  }

  // Check for port conflicts
  if (graphql && dashboard && graphqlPort === dashboardPort) {
    throw new Error(`GraphQL and Dashboard cannot use the same port (${graphqlPort})`);
  }

  // Database path
  const databasePath = options.db
    ? join(projectRoot, options.db)
    : join(projectRoot, DEFAULT_DATABASE_PATH);

  return {
    mcp,
    graphql,
    dashboard,
    graphqlPort,
    dashboardPort,
    databasePath,
    verbose: options.verbose ?? false,
  };
}

/**
 * Build server configuration from parsed options
 */
function buildConfig(options: ParsedServeOptions, projectRoot: string): ServerConfig {
  const defaultConfig = createDefaultConfig(projectRoot);

  return {
    ...defaultConfig,
    projectRoot,
    mcp: {
      ...defaultConfig.mcp,
      enabled: options.mcp,
    },
    graphql: {
      ...defaultConfig.graphql,
      enabled: options.graphql,
      port: options.graphqlPort,
    },
    dashboard: {
      ...defaultConfig.dashboard,
      enabled: options.dashboard,
      port: options.dashboardPort,
    },
    database: {
      ...defaultConfig.database,
      path: options.databasePath,
    },
    verbose: options.verbose,
  };
}

/**
 * Display server status summary
 */
function displayStatus(config: ServerConfig): void {
  console.log(chalk.cyan.bold('\n  Knowledge Graph Agent Servers\n'));

  // MCP status
  const mcpStatus = config.mcp.enabled ? chalk.green('enabled') : chalk.gray('disabled');
  console.log(`  ${chalk.white('MCP Server:')}     ${mcpStatus}`);
  if (config.mcp.enabled) {
    console.log(chalk.gray('                  Transport: stdio'));
  }

  // GraphQL status
  const graphqlStatus = config.graphql.enabled ? chalk.green('enabled') : chalk.gray('disabled');
  console.log(`  ${chalk.white('GraphQL Server:')} ${graphqlStatus}`);
  if (config.graphql.enabled) {
    console.log(chalk.gray(`                  Port: ${config.graphql.port}`));
    console.log(chalk.gray(`                  URL: http://localhost:${config.graphql.port}/graphql`));
  }

  // Dashboard status
  const dashboardStatus = config.dashboard.enabled ? chalk.green('enabled') : chalk.gray('disabled');
  console.log(`  ${chalk.white('Dashboard:')}      ${dashboardStatus}`);
  if (config.dashboard.enabled) {
    console.log(chalk.gray(`                  Port: ${config.dashboard.port}`));
    console.log(chalk.gray(`                  URL: http://localhost:${config.dashboard.port}`));
  }

  console.log();
  console.log(chalk.gray(`  Database: ${config.database.path}`));
  console.log();
}

/**
 * Display help for combining MCP with HTTP servers
 */
function displayMCPWarning(): void {
  console.log(chalk.yellow.bold('\n  Note: MCP + HTTP Servers'));
  console.log(chalk.gray('  When running MCP server with GraphQL/Dashboard:'));
  console.log(chalk.gray('  - MCP server uses stdio (standard input/output)'));
  console.log(chalk.gray('  - HTTP servers will run on their configured ports'));
  console.log(chalk.gray('  - The process will remain active until terminated'));
  console.log();
}

// ============================================================================
// Signal Handlers
// ============================================================================

/**
 * Setup graceful shutdown handlers
 */
function setupSignalHandlers(manager: ServerManager): void {
  let shutdownInitiated = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shutdownInitiated) {
      console.log(chalk.yellow('\n  Shutdown already in progress...'));
      return;
    }

    shutdownInitiated = true;
    console.log(chalk.cyan(`\n  Received ${signal}, shutting down gracefully...`));

    try {
      await manager.gracefulShutdown();
      console.log(chalk.green('  Shutdown complete'));
      process.exit(0);
    } catch (error) {
      console.error(chalk.red('  Shutdown error:'), String(error));
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle uncaught errors
  process.on('uncaughtException', async (error) => {
    console.error(chalk.red('\n  Uncaught exception:'), error.message);
    await shutdown('uncaughtException');
  });

  process.on('unhandledRejection', async (reason) => {
    console.error(
      chalk.red('\n  Unhandled rejection:'),
      reason instanceof Error ? reason.message : String(reason)
    );
    await shutdown('unhandledRejection');
  });
}

// ============================================================================
// Command Implementation
// ============================================================================

/**
 * Create the serve command
 */
export function createServeCommand(): Command {
  const serve = new Command('serve')
    .description('Run Knowledge Graph Agent servers')
    .addHelpText(
      'after',
      `
Examples:
  $ kg serve                      # Start MCP server only (default)
  $ kg serve --graphql            # Start GraphQL server on port 4000
  $ kg serve --dashboard          # Start Dashboard on port 3000
  $ kg serve --all                # Start all servers
  $ kg serve --mcp --graphql      # Start MCP and GraphQL servers

  # Custom ports
  $ kg serve --graphql --port-graphql 8080
  $ kg serve --dashboard --port-dashboard 8000

  # All servers with custom ports
  $ kg serve --all --port-graphql 4001 --port-dashboard 3001

  # Custom database location
  $ kg serve --all --db ./data/knowledge.db

Notes:
  - MCP server uses stdio transport (for Claude Desktop integration)
  - GraphQL and Dashboard use HTTP on their respective ports
  - When running MCP with HTTP servers, the process stays active
  - Use Ctrl+C to gracefully shutdown all servers
`
    )
    .option('--mcp', 'Enable MCP server (stdio transport)')
    .option('--graphql', 'Enable GraphQL server')
    .option('--dashboard', 'Enable web dashboard')
    .option('--port-graphql <port>', `GraphQL server port (default: ${DEFAULT_GRAPHQL_PORT})`)
    .option('--port-dashboard <port>', `Dashboard server port (default: ${DEFAULT_DASHBOARD_PORT})`)
    .option('--all', 'Enable all servers')
    .option('--db <path>', 'Database file path (relative to project root)')
    .option('-v, --verbose', 'Enable verbose logging')
    .action(async (options: ServeCommandOptions) => {
      const projectRoot = process.cwd();
      const spinner = ora('Initializing servers...').start();

      try {
        // Check for .kg directory or initialize
        const kgDir = join(projectRoot, '.kg');
        if (!existsSync(kgDir)) {
          spinner.text = 'Creating .kg directory...';
        }

        // Parse and validate options
        const parsedOptions = parseOptions(options, projectRoot);
        const config = buildConfig(parsedOptions, projectRoot);

        // Display configuration
        spinner.stop();
        displayStatus(config);

        // Warn about MCP + HTTP combination
        if (
          config.mcp.enabled &&
          (config.graphql.enabled || config.dashboard.enabled)
        ) {
          displayMCPWarning();
        }

        // Create and initialize server manager
        spinner.start('Starting servers...');
        const manager = await createServerManager(config);

        // Setup signal handlers for graceful shutdown
        setupSignalHandlers(manager);

        // Subscribe to events for logging
        if (parsedOptions.verbose) {
          const eventTypes: ServerEventType[] = [
            'server:starting',
            'server:started',
            'server:stopping',
            'server:stopped',
            'server:error',
          ];

          for (const eventType of eventTypes) {
            manager.on(eventType, (event) => {
              console.log(
                chalk.gray(`  [${new Date().toISOString()}] ${event.type}`),
                event.server ? chalk.cyan(`(${event.server})`) : '',
                event.data ? JSON.stringify(event.data) : ''
              );
            });
          }
        }

        // Start all enabled servers
        await manager.startAll();

        spinner.succeed('Servers started successfully');

        // Display running servers info
        console.log(chalk.cyan.bold('\n  Running Servers:\n'));

        if (config.mcp.enabled) {
          console.log(chalk.green('  [MCP]       '), chalk.gray('Running on stdio'));
        }

        if (config.graphql.enabled) {
          console.log(
            chalk.green('  [GraphQL]   '),
            chalk.gray(`http://localhost:${config.graphql.port}/graphql`)
          );
        }

        if (config.dashboard.enabled) {
          console.log(
            chalk.green('  [Dashboard] '),
            chalk.gray(`http://localhost:${config.dashboard.port}`)
          );
        }

        console.log();
        console.log(chalk.gray('  Press Ctrl+C to stop all servers'));
        console.log();

        // If only MCP is running, it will handle the event loop via stdio
        // If HTTP servers are running, they keep the process alive
        // We need to keep the process alive if only MCP is running
        if (config.mcp.enabled && !config.graphql.enabled && !config.dashboard.enabled) {
          // MCP server takes over stdio, so the process stays alive naturally
          // No additional keep-alive needed
        }
      } catch (error) {
        spinner.fail('Failed to start servers');
        console.error(chalk.red(`\n  Error: ${String(error)}`));

        if (options.verbose && error instanceof Error && error.stack) {
          console.error(chalk.gray('\n  Stack trace:'));
          console.error(chalk.gray(`  ${error.stack.split('\n').join('\n  ')}`));
        }

        process.exit(1);
      }
    });

  // Add status subcommand
  serve
    .command('status')
    .description('Show status of running servers')
    .action(async () => {
      console.log(chalk.cyan.bold('\n  Server Status\n'));
      console.log(chalk.gray('  Status check requires a running server instance.'));
      console.log(chalk.gray('  When servers are running, use the Dashboard API:'));
      console.log();
      console.log(chalk.white('    Dashboard:'), chalk.gray('http://localhost:3000/api/status'));
      console.log(chalk.white('    Health:   '), chalk.gray('http://localhost:3000/api/health'));
      console.log();
    });

  return serve;
}

// ============================================================================
// Re-exports
// ============================================================================

export {
  ServerManager,
  createServerManager,
  SharedServices,
  createSharedServices,
} from '../../server/index.js';
