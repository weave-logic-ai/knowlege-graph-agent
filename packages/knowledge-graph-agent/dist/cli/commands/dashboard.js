import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { exec } from "child_process";
import { join } from "path";
import { existsSync } from "fs";
import { DEFAULT_DASHBOARD_PORT, DEFAULT_GRAPHQL_PORT } from "../../server/types.js";
import { createDashboardServer } from "../../dashboard-server/server.js";
function execAsync(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
      }
    });
  });
}
const DASHBOARD_DIR_NAME = "dashboard";
function getDashboardPath(projectRoot) {
  const packageDashboard = join(projectRoot, DASHBOARD_DIR_NAME);
  if (existsSync(packageDashboard)) {
    return packageDashboard;
  }
  const parentDashboard = join(projectRoot, "..", DASHBOARD_DIR_NAME);
  if (existsSync(parentDashboard)) {
    return parentDashboard;
  }
  return packageDashboard;
}
function detectGraphQLEndpoint(port) {
  const graphqlPort = port ?? DEFAULT_GRAPHQL_PORT;
  return `http://localhost:${graphqlPort}/graphql`;
}
async function isPortAvailable(port) {
  try {
    const { stdout } = await execAsync(`lsof -i :${port} -t`);
    return stdout.trim() === "";
  } catch {
    return true;
  }
}
async function openBrowser(url) {
  const platform = process.platform;
  let command;
  if (platform === "darwin") {
    command = `open "${url}"`;
  } else if (platform === "win32") {
    command = `start "${url}"`;
  } else {
    command = `xdg-open "${url}" || sensible-browser "${url}" || x-www-browser "${url}"`;
  }
  await execAsync(command);
}
async function handleDashboardStart(options) {
  const projectRoot = process.cwd();
  const spinner = ora("Starting dashboard development server...").start();
  try {
    const dashboardPort = typeof options.port === "string" ? parseInt(options.port, 10) : options.port ?? DEFAULT_DASHBOARD_PORT;
    const graphqlPort = typeof options.graphqlPort === "string" ? parseInt(options.graphqlPort, 10) : options.graphqlPort ?? DEFAULT_GRAPHQL_PORT;
    if (isNaN(dashboardPort) || dashboardPort < 1 || dashboardPort > 65535) {
      throw new Error(`Invalid port: ${options.port}`);
    }
    spinner.text = "Checking port availability...";
    const portAvailable = await isPortAvailable(dashboardPort);
    if (!portAvailable) {
      throw new Error(`Port ${dashboardPort} is already in use. Try a different port with --port`);
    }
    const config = {
      projectRoot,
      port: dashboardPort,
      graphqlEndpoint: detectGraphQLEndpoint(graphqlPort),
      mode: "development",
      verbose: options.verbose ?? false
    };
    spinner.text = "Initializing dashboard server...";
    const server = createDashboardServer(config);
    spinner.text = "Starting Next.js development server...";
    await server.start();
    spinner.succeed("Dashboard development server started!");
    console.log(chalk.cyan.bold("\n  Dashboard Dev Server\n"));
    console.log(`  ${chalk.white("URL:")}         ${chalk.green(`http://localhost:${dashboardPort}`)}`);
    console.log(`  ${chalk.white("GraphQL:")}     ${chalk.gray(config.graphqlEndpoint)}`);
    console.log(`  ${chalk.white("Mode:")}        ${chalk.yellow("development")}`);
    console.log();
    console.log(chalk.gray("  Hot reload is enabled. Changes will be reflected automatically."));
    console.log(chalk.gray("  Press Ctrl+C to stop the server."));
    console.log();
    if (options.open) {
      await openBrowser(`http://localhost:${dashboardPort}`);
    }
    await server.waitForShutdown();
  } catch (error) {
    spinner.fail("Failed to start dashboard");
    console.error(chalk.red(`
  Error: ${String(error)}`));
    process.exit(1);
  }
}
async function handleDashboardBuild(options) {
  const projectRoot = process.cwd();
  const spinner = ora("Building dashboard for production...").start();
  try {
    const config = {
      projectRoot,
      port: DEFAULT_DASHBOARD_PORT,
      graphqlEndpoint: detectGraphQLEndpoint(),
      mode: "production",
      outputDir: options.output,
      verbose: options.verbose ?? false
    };
    const server = createDashboardServer(config);
    spinner.text = "Running Next.js build...";
    await server.build();
    spinner.succeed("Dashboard built successfully!");
    const outputPath = options.output ?? join(getDashboardPath(projectRoot), ".next");
    console.log(chalk.cyan.bold("\n  Build Complete\n"));
    console.log(`  ${chalk.white("Output:")}  ${chalk.gray(outputPath)}`);
    console.log();
    console.log(chalk.gray("  To serve the production build:"));
    console.log(chalk.white("    kg dashboard serve"));
    console.log();
  } catch (error) {
    spinner.fail("Failed to build dashboard");
    console.error(chalk.red(`
  Error: ${String(error)}`));
    process.exit(1);
  }
}
async function handleDashboardServe(options) {
  const projectRoot = process.cwd();
  const spinner = ora("Starting production dashboard server...").start();
  try {
    const dashboardPort = typeof options.port === "string" ? parseInt(options.port, 10) : options.port ?? DEFAULT_DASHBOARD_PORT;
    const graphqlPort = typeof options.graphqlPort === "string" ? parseInt(options.graphqlPort, 10) : options.graphqlPort ?? DEFAULT_GRAPHQL_PORT;
    if (isNaN(dashboardPort) || dashboardPort < 1 || dashboardPort > 65535) {
      throw new Error(`Invalid port: ${options.port}`);
    }
    spinner.text = "Checking port availability...";
    const portAvailable = await isPortAvailable(dashboardPort);
    if (!portAvailable) {
      throw new Error(`Port ${dashboardPort} is already in use. Try a different port with --port`);
    }
    const config = {
      projectRoot,
      port: dashboardPort,
      graphqlEndpoint: detectGraphQLEndpoint(graphqlPort),
      mode: "production",
      verbose: options.verbose ?? false
    };
    spinner.text = "Initializing production server...";
    const server = createDashboardServer(config);
    spinner.text = "Starting production server...";
    await server.start();
    spinner.succeed("Dashboard production server started!");
    console.log(chalk.cyan.bold("\n  Dashboard Production Server\n"));
    console.log(`  ${chalk.white("URL:")}         ${chalk.green(`http://localhost:${dashboardPort}`)}`);
    console.log(`  ${chalk.white("GraphQL:")}     ${chalk.gray(config.graphqlEndpoint)}`);
    console.log(`  ${chalk.white("Mode:")}        ${chalk.blue("production")}`);
    console.log();
    console.log(chalk.gray("  Press Ctrl+C to stop the server."));
    console.log();
    if (options.open) {
      await openBrowser(`http://localhost:${dashboardPort}`);
    }
    await server.waitForShutdown();
  } catch (error) {
    spinner.fail("Failed to start production server");
    console.error(chalk.red(`
  Error: ${String(error)}`));
    process.exit(1);
  }
}
async function handleDashboardOpen(options) {
  const spinner = ora("Opening dashboard in browser...").start();
  try {
    const dashboardPort = typeof options.port === "string" ? parseInt(options.port, 10) : options.port ?? DEFAULT_DASHBOARD_PORT;
    const url = `http://localhost:${dashboardPort}`;
    await openBrowser(url);
    spinner.succeed(`Opened ${url} in browser`);
  } catch (error) {
    spinner.fail("Failed to open browser");
    console.error(chalk.red(`
  Error: ${String(error)}`));
    console.log(chalk.gray("\n  Try opening manually: ") + chalk.white(`http://localhost:${options.port ?? DEFAULT_DASHBOARD_PORT}`));
    process.exit(1);
  }
}
async function handleDashboardStatus(options) {
  const spinner = ora("Checking dashboard status...").start();
  try {
    const dashboardPort = typeof options.port === "string" ? parseInt(options.port, 10) : options.port ?? DEFAULT_DASHBOARD_PORT;
    const graphqlPort = typeof options.graphqlPort === "string" ? parseInt(options.graphqlPort, 10) : options.graphqlPort ?? DEFAULT_GRAPHQL_PORT;
    const dashboardAvailable = !await isPortAvailable(dashboardPort);
    const graphqlAvailable = !await isPortAvailable(graphqlPort);
    spinner.stop();
    console.log(chalk.cyan.bold("\n  Dashboard Status\n"));
    const dashboardStatus = dashboardAvailable ? chalk.green("running") : chalk.gray("stopped");
    console.log(`  ${chalk.white("Dashboard:")}     ${dashboardStatus}`);
    if (dashboardAvailable) {
      console.log(`                  ${chalk.gray(`http://localhost:${dashboardPort}`)}`);
    }
    const graphqlStatus = graphqlAvailable ? chalk.green("running") : chalk.gray("stopped");
    console.log(`  ${chalk.white("GraphQL:")}       ${graphqlStatus}`);
    if (graphqlAvailable) {
      console.log(`                  ${chalk.gray(`http://localhost:${graphqlPort}/graphql`)}`);
    }
    console.log();
    if (dashboardAvailable && graphqlAvailable) {
      console.log(chalk.green("  Dashboard is connected to GraphQL server."));
    } else if (dashboardAvailable && !graphqlAvailable) {
      console.log(chalk.yellow("  Dashboard is running but GraphQL server is not available."));
      console.log(chalk.gray("  Start GraphQL server: kg serve --graphql"));
    } else if (!dashboardAvailable && graphqlAvailable) {
      console.log(chalk.gray("  GraphQL server is running. Start dashboard: kg dashboard start"));
    } else {
      console.log(chalk.gray("  No servers are running."));
      console.log(chalk.gray("  Start all: kg serve --all"));
      console.log(chalk.gray("  Start dashboard only: kg dashboard start"));
    }
    console.log();
  } catch (error) {
    spinner.fail("Failed to check status");
    console.error(chalk.red(`
  Error: ${String(error)}`));
    process.exit(1);
  }
}
function createDashboardCommand() {
  const dashboard = new Command("dashboard").description("Manage the Knowledge Graph Dashboard").addHelpText(
    "after",
    `
Examples:
  $ kg dashboard start               # Start dashboard dev server (port 3000)
  $ kg dashboard start --port 8080   # Start on custom port
  $ kg dashboard start --open        # Start and open in browser

  $ kg dashboard build               # Build for production
  $ kg dashboard serve               # Serve production build

  $ kg dashboard open                # Open dashboard in browser
  $ kg dashboard status              # Check dashboard status

Configuration:
  The dashboard auto-detects the GraphQL endpoint from running servers.
  Use --graphql-port to specify a custom GraphQL server port.
`
  );
  dashboard.command("start").description("Start the dashboard development server").option("-p, --port <port>", `Dashboard port (default: ${DEFAULT_DASHBOARD_PORT})`).option("--graphql-port <port>", `GraphQL server port (default: ${DEFAULT_GRAPHQL_PORT})`).option("-o, --open", "Open dashboard in browser").option("-v, --verbose", "Enable verbose logging").action(handleDashboardStart);
  dashboard.command("build").description("Build the dashboard for production").option("-o, --output <path>", "Output directory for build").option("-v, --verbose", "Enable verbose logging").action(handleDashboardBuild);
  dashboard.command("serve").description("Serve the production dashboard build").option("-p, --port <port>", `Dashboard port (default: ${DEFAULT_DASHBOARD_PORT})`).option("--graphql-port <port>", `GraphQL server port (default: ${DEFAULT_GRAPHQL_PORT})`).option("-o, --open", "Open dashboard in browser").option("-v, --verbose", "Enable verbose logging").action(handleDashboardServe);
  dashboard.command("open").description("Open the dashboard in the default browser").option("-p, --port <port>", `Dashboard port (default: ${DEFAULT_DASHBOARD_PORT})`).action(handleDashboardOpen);
  dashboard.command("status").description("Check the dashboard and GraphQL server status").option("-p, --port <port>", `Dashboard port (default: ${DEFAULT_DASHBOARD_PORT})`).option("--graphql-port <port>", `GraphQL server port (default: ${DEFAULT_GRAPHQL_PORT})`).action(handleDashboardStatus);
  dashboard.action(() => {
    console.log(chalk.cyan.bold("\n  Knowledge Graph Dashboard\n"));
    console.log(chalk.gray("  Web interface for exploring and managing the knowledge graph.\n"));
    console.log(chalk.white("  Commands:"));
    console.log(chalk.gray("    start    ") + chalk.white("Start development server"));
    console.log(chalk.gray("    build    ") + chalk.white("Build for production"));
    console.log(chalk.gray("    serve    ") + chalk.white("Serve production build"));
    console.log(chalk.gray("    open     ") + chalk.white("Open in browser"));
    console.log(chalk.gray("    status   ") + chalk.white("Check server status"));
    console.log("\n  Run", chalk.cyan("kg dashboard <command> --help"), "for more information\n");
  });
  return dashboard;
}
export {
  createDashboardCommand
};
//# sourceMappingURL=dashboard.js.map
