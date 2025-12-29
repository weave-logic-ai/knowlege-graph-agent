import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { join } from "path";
import { existsSync } from "fs";
import { DEFAULT_GRAPHQL_PORT, DEFAULT_DASHBOARD_PORT, DEFAULT_DATABASE_PATH } from "../../server/types.js";
import { createDefaultConfig } from "../../server/shared-services.js";
import { SharedServices, createSharedServices } from "../../server/shared-services.js";
import { createServerManager } from "../../server/manager.js";
import { ServerManager } from "../../server/manager.js";
import "../../server/container.js";
import "../../server/event-bus.js";
function parseOptions(options, projectRoot) {
  let mcp = options.mcp ?? false;
  let graphql = options.graphql ?? false;
  let dashboard = options.dashboard ?? false;
  if (options.all) {
    mcp = true;
    graphql = true;
    dashboard = true;
  }
  if (!mcp && !graphql && !dashboard) {
    mcp = true;
  }
  const graphqlPort = typeof options.portGraphql === "string" ? parseInt(options.portGraphql, 10) : options.portGraphql ?? DEFAULT_GRAPHQL_PORT;
  const dashboardPort = typeof options.portDashboard === "string" ? parseInt(options.portDashboard, 10) : options.portDashboard ?? DEFAULT_DASHBOARD_PORT;
  if (graphql && (isNaN(graphqlPort) || graphqlPort < 1 || graphqlPort > 65535)) {
    throw new Error(`Invalid GraphQL port: ${options.portGraphql}`);
  }
  if (dashboard && (isNaN(dashboardPort) || dashboardPort < 1 || dashboardPort > 65535)) {
    throw new Error(`Invalid Dashboard port: ${options.portDashboard}`);
  }
  if (graphql && dashboard && graphqlPort === dashboardPort) {
    throw new Error(`GraphQL and Dashboard cannot use the same port (${graphqlPort})`);
  }
  const databasePath = options.db ? join(projectRoot, options.db) : join(projectRoot, DEFAULT_DATABASE_PATH);
  return {
    mcp,
    graphql,
    dashboard,
    graphqlPort,
    dashboardPort,
    databasePath,
    verbose: options.verbose ?? false
  };
}
function buildConfig(options, projectRoot) {
  const defaultConfig = createDefaultConfig(projectRoot);
  return {
    ...defaultConfig,
    projectRoot,
    mcp: {
      ...defaultConfig.mcp,
      enabled: options.mcp
    },
    graphql: {
      ...defaultConfig.graphql,
      enabled: options.graphql,
      port: options.graphqlPort
    },
    dashboard: {
      ...defaultConfig.dashboard,
      enabled: options.dashboard,
      port: options.dashboardPort
    },
    database: {
      ...defaultConfig.database,
      path: options.databasePath
    },
    verbose: options.verbose
  };
}
function displayStatus(config) {
  console.log(chalk.cyan.bold("\n  Knowledge Graph Agent Servers\n"));
  const mcpStatus = config.mcp.enabled ? chalk.green("enabled") : chalk.gray("disabled");
  console.log(`  ${chalk.white("MCP Server:")}     ${mcpStatus}`);
  if (config.mcp.enabled) {
    console.log(chalk.gray("                  Transport: stdio"));
  }
  const graphqlStatus = config.graphql.enabled ? chalk.green("enabled") : chalk.gray("disabled");
  console.log(`  ${chalk.white("GraphQL Server:")} ${graphqlStatus}`);
  if (config.graphql.enabled) {
    console.log(chalk.gray(`                  Port: ${config.graphql.port}`));
    console.log(chalk.gray(`                  URL: http://localhost:${config.graphql.port}/graphql`));
  }
  const dashboardStatus = config.dashboard.enabled ? chalk.green("enabled") : chalk.gray("disabled");
  console.log(`  ${chalk.white("Dashboard:")}      ${dashboardStatus}`);
  if (config.dashboard.enabled) {
    console.log(chalk.gray(`                  Port: ${config.dashboard.port}`));
    console.log(chalk.gray(`                  URL: http://localhost:${config.dashboard.port}`));
  }
  console.log();
  console.log(chalk.gray(`  Database: ${config.database.path}`));
  console.log();
}
function displayMCPWarning() {
  console.log(chalk.yellow.bold("\n  Note: MCP + HTTP Servers"));
  console.log(chalk.gray("  When running MCP server with GraphQL/Dashboard:"));
  console.log(chalk.gray("  - MCP server uses stdio (standard input/output)"));
  console.log(chalk.gray("  - HTTP servers will run on their configured ports"));
  console.log(chalk.gray("  - The process will remain active until terminated"));
  console.log();
}
function setupSignalHandlers(manager) {
  let shutdownInitiated = false;
  const shutdown = async (signal) => {
    if (shutdownInitiated) {
      console.log(chalk.yellow("\n  Shutdown already in progress..."));
      return;
    }
    shutdownInitiated = true;
    console.log(chalk.cyan(`
  Received ${signal}, shutting down gracefully...`));
    try {
      await manager.gracefulShutdown();
      console.log(chalk.green("  Shutdown complete"));
      process.exit(0);
    } catch (error) {
      console.error(chalk.red("  Shutdown error:"), String(error));
      process.exit(1);
    }
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("uncaughtException", async (error) => {
    console.error(chalk.red("\n  Uncaught exception:"), error.message);
    await shutdown("uncaughtException");
  });
  process.on("unhandledRejection", async (reason) => {
    console.error(
      chalk.red("\n  Unhandled rejection:"),
      reason instanceof Error ? reason.message : String(reason)
    );
    await shutdown("unhandledRejection");
  });
}
function createServeCommand() {
  const serve = new Command("serve").description("Run Knowledge Graph Agent servers").addHelpText(
    "after",
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
  ).option("--mcp", "Enable MCP server (stdio transport)").option("--graphql", "Enable GraphQL server").option("--dashboard", "Enable web dashboard").option("--port-graphql <port>", `GraphQL server port (default: ${DEFAULT_GRAPHQL_PORT})`).option("--port-dashboard <port>", `Dashboard server port (default: ${DEFAULT_DASHBOARD_PORT})`).option("--all", "Enable all servers").option("--db <path>", "Database file path (relative to project root)").option("-v, --verbose", "Enable verbose logging").action(async (options) => {
    const projectRoot = process.cwd();
    const spinner = ora("Initializing servers...").start();
    try {
      const kgDir = join(projectRoot, ".kg");
      if (!existsSync(kgDir)) {
        spinner.text = "Creating .kg directory...";
      }
      const parsedOptions = parseOptions(options, projectRoot);
      const config = buildConfig(parsedOptions, projectRoot);
      spinner.stop();
      displayStatus(config);
      if (config.mcp.enabled && (config.graphql.enabled || config.dashboard.enabled)) {
        displayMCPWarning();
      }
      spinner.start("Starting servers...");
      const manager = await createServerManager(config);
      setupSignalHandlers(manager);
      if (parsedOptions.verbose) {
        const eventTypes = [
          "server:starting",
          "server:started",
          "server:stopping",
          "server:stopped",
          "server:error"
        ];
        for (const eventType of eventTypes) {
          manager.on(eventType, (event) => {
            console.log(
              chalk.gray(`  [${(/* @__PURE__ */ new Date()).toISOString()}] ${event.type}`),
              event.server ? chalk.cyan(`(${event.server})`) : "",
              event.data ? JSON.stringify(event.data) : ""
            );
          });
        }
      }
      await manager.startAll();
      spinner.succeed("Servers started successfully");
      console.log(chalk.cyan.bold("\n  Running Servers:\n"));
      if (config.mcp.enabled) {
        console.log(chalk.green("  [MCP]       "), chalk.gray("Running on stdio"));
      }
      if (config.graphql.enabled) {
        console.log(
          chalk.green("  [GraphQL]   "),
          chalk.gray(`http://localhost:${config.graphql.port}/graphql`)
        );
      }
      if (config.dashboard.enabled) {
        console.log(
          chalk.green("  [Dashboard] "),
          chalk.gray(`http://localhost:${config.dashboard.port}`)
        );
      }
      console.log();
      console.log(chalk.gray("  Press Ctrl+C to stop all servers"));
      console.log();
      if (config.mcp.enabled && !config.graphql.enabled && !config.dashboard.enabled) {
      }
    } catch (error) {
      spinner.fail("Failed to start servers");
      console.error(chalk.red(`
  Error: ${String(error)}`));
      if (options.verbose && error instanceof Error && error.stack) {
        console.error(chalk.gray("\n  Stack trace:"));
        console.error(chalk.gray(`  ${error.stack.split("\n").join("\n  ")}`));
      }
      process.exit(1);
    }
  });
  serve.command("status").description("Show status of running servers").action(async () => {
    console.log(chalk.cyan.bold("\n  Server Status\n"));
    console.log(chalk.gray("  Status check requires a running server instance."));
    console.log(chalk.gray("  When servers are running, use the Dashboard API:"));
    console.log();
    console.log(chalk.white("    Dashboard:"), chalk.gray("http://localhost:3000/api/status"));
    console.log(chalk.white("    Health:   "), chalk.gray("http://localhost:3000/api/health"));
    console.log();
  });
  return serve;
}
export {
  ServerManager,
  SharedServices,
  createServeCommand,
  createServerManager,
  createSharedServices
};
//# sourceMappingURL=serve.js.map
