import { EventEmitter } from "events";
import { spawn, exec } from "child_process";
import { createServer } from "http";
import { join } from "path";
import { existsSync } from "fs";
import { createLogger } from "../utils/logger.js";
function execAsync(command, options) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
      }
    });
  });
}
const logger = createLogger("dashboard-server");
const STARTUP_TIMEOUT = 3e4;
const SHUTDOWN_TIMEOUT = 1e4;
const GRAPHQL_CHECK_INTERVAL = 5e3;
class DashboardServer {
  config;
  state;
  eventEmitter;
  childProcess = null;
  httpServer = null;
  graphqlCheckInterval = null;
  shutdownPromise = null;
  shutdownResolve = null;
  constructor(config) {
    this.config = {
      ...config,
      dashboardPath: config.dashboardPath ?? this.detectDashboardPath(config.projectRoot)
    };
    this.state = {
      status: "stopped"
    };
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(50);
    logger.debug("DashboardServer created", {
      port: config.port,
      mode: config.mode,
      graphqlEndpoint: config.graphqlEndpoint
    });
  }
  // ============================================================================
  // Path Detection
  // ============================================================================
  /**
   * Detect the dashboard path
   */
  detectDashboardPath(projectRoot) {
    const candidates = [
      join(projectRoot, "dashboard"),
      join(projectRoot, "src", "dashboard"),
      join(projectRoot, "packages", "dashboard"),
      join(projectRoot, "..", "dashboard")
    ];
    for (const candidate of candidates) {
      if (existsSync(join(candidate, "package.json"))) {
        logger.debug("Found dashboard at", { path: candidate });
        return candidate;
      }
    }
    return join(projectRoot, "dashboard");
  }
  /**
   * Check if dashboard is installed
   */
  isDashboardInstalled() {
    const dashboardPath = this.config.dashboardPath;
    return existsSync(join(dashboardPath, "package.json"));
  }
  // ============================================================================
  // Server Lifecycle
  // ============================================================================
  /**
   * Start the dashboard server
   */
  async start() {
    if (this.state.status === "running") {
      logger.warn("Dashboard server already running");
      return;
    }
    this.state.status = "starting";
    this.emit("starting");
    try {
      if (this.config.mode === "development") {
        await this.startDevelopmentServer();
      } else {
        await this.startProductionServer();
      }
      this.state.status = "running";
      this.state.port = this.config.port;
      this.state.graphqlEndpoint = this.config.graphqlEndpoint;
      this.state.mode = this.config.mode;
      this.state.startedAt = /* @__PURE__ */ new Date();
      this.emit("started");
      this.startGraphQLMonitoring();
      this.shutdownPromise = new Promise((resolve) => {
        this.shutdownResolve = resolve;
      });
      logger.info("Dashboard server started", {
        port: this.config.port,
        mode: this.config.mode
      });
    } catch (error) {
      this.state.status = "error";
      this.state.error = error instanceof Error ? error.message : String(error);
      this.emit("error", error);
      throw error;
    }
  }
  /**
   * Start the development server (Next.js dev)
   */
  async startDevelopmentServer() {
    const dashboardPath = this.config.dashboardPath;
    if (!this.isDashboardInstalled()) {
      logger.warn("Dashboard not installed, using fallback static server");
      await this.startFallbackServer();
      return;
    }
    const env = {
      ...process.env,
      PORT: String(this.config.port),
      NEXT_PUBLIC_GRAPHQL_ENDPOINT: this.config.graphqlEndpoint,
      NEXT_PUBLIC_API_URL: this.config.graphqlEndpoint.replace("/graphql", "")
    };
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Dashboard startup timed out after ${STARTUP_TIMEOUT}ms`));
      }, STARTUP_TIMEOUT);
      this.childProcess = spawn("npm", ["run", "dev"], {
        cwd: dashboardPath,
        env,
        stdio: this.config.verbose ? "inherit" : "pipe",
        shell: true
      });
      this.childProcess.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      this.childProcess.on("exit", (code) => {
        if (code !== 0 && this.state.status === "starting") {
          clearTimeout(timeout);
          reject(new Error(`Dashboard process exited with code ${code}`));
        }
      });
      if (this.childProcess.stdout && !this.config.verbose) {
        this.childProcess.stdout.on("data", (data) => {
          const output = data.toString();
          if (output.includes("Ready") || output.includes("started")) {
            clearTimeout(timeout);
            resolve();
          }
          if (this.config.verbose) {
            process.stdout.write(data);
          }
        });
      }
      if (this.config.verbose || !this.childProcess.stdout) {
        setTimeout(() => {
          clearTimeout(timeout);
          resolve();
        }, 3e3);
      }
    });
  }
  /**
   * Start the production server (Next.js start or static file server)
   */
  async startProductionServer() {
    const dashboardPath = this.config.dashboardPath;
    const buildPath = join(dashboardPath, ".next");
    if (!existsSync(buildPath)) {
      logger.warn("Production build not found, using fallback server");
      await this.startFallbackServer();
      return;
    }
    const env = {
      ...process.env,
      PORT: String(this.config.port),
      NEXT_PUBLIC_GRAPHQL_ENDPOINT: this.config.graphqlEndpoint,
      NODE_ENV: "production"
    };
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Dashboard startup timed out after ${STARTUP_TIMEOUT}ms`));
      }, STARTUP_TIMEOUT);
      this.childProcess = spawn("npm", ["run", "start"], {
        cwd: dashboardPath,
        env,
        stdio: this.config.verbose ? "inherit" : "pipe",
        shell: true
      });
      this.childProcess.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      if (this.childProcess.stdout && !this.config.verbose) {
        this.childProcess.stdout.on("data", (data) => {
          const output = data.toString();
          if (output.includes("Ready") || output.includes("started")) {
            clearTimeout(timeout);
            resolve();
          }
        });
      }
      setTimeout(() => {
        clearTimeout(timeout);
        resolve();
      }, 3e3);
    });
  }
  /**
   * Start a fallback static server when dashboard is not installed
   */
  async startFallbackServer() {
    return new Promise((resolve, reject) => {
      this.httpServer = createServer((req, res) => {
        this.handleFallbackRequest(req, res);
      });
      this.httpServer.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
          reject(new Error(`Port ${this.config.port} is already in use`));
        } else {
          reject(error);
        }
      });
      this.httpServer.listen(this.config.port, () => {
        logger.info("Fallback dashboard server started", { port: this.config.port });
        resolve();
      });
    });
  }
  /**
   * Handle requests to the fallback server
   */
  handleFallbackRequest(req, res) {
    const url = req.url ?? "/";
    if (url === "/api/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: "ok",
        server: "dashboard",
        mode: this.config.mode,
        graphqlEndpoint: this.config.graphqlEndpoint,
        graphqlConnected: this.state.graphqlConnected ?? false
      }));
      return;
    }
    if (url === "/api/status") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(this.getState()));
      return;
    }
    if (url === "/api/config") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        graphqlEndpoint: this.config.graphqlEndpoint,
        port: this.config.port,
        mode: this.config.mode
      }));
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(this.getFallbackHTML());
  }
  /**
   * Get fallback HTML when dashboard is not fully installed
   */
  getFallbackHTML() {
    const graphqlEndpoint = this.config.graphqlEndpoint;
    const mode = this.config.mode;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Knowledge Graph Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #e0e0e0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .container { text-align: center; padding: 2rem; max-width: 600px; }
    h1 { font-size: 2.5rem; margin-bottom: 1rem; color: #00d4ff; }
    p { font-size: 1.1rem; margin-bottom: 1.5rem; opacity: 0.8; line-height: 1.6; }
    .status {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      flex-wrap: wrap;
      margin: 2rem 0;
    }
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 1.5rem;
      min-width: 180px;
      transition: transform 0.2s, border-color 0.2s;
    }
    .card:hover {
      transform: translateY(-2px);
      border-color: rgba(0, 212, 255, 0.3);
    }
    .card h3 { color: #00d4ff; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; }
    .card .value { font-size: 1.4rem; font-weight: 600; }
    .connected { color: #00ff88; }
    .disconnected { color: #ff6b6b; }
    .mode-dev { color: #ffcc00; }
    .mode-prod { color: #00d4ff; }
    .indicator {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 8px;
      animation: pulse 2s infinite;
    }
    .indicator.connected { background: #00ff88; }
    .indicator.disconnected { background: #ff6b6b; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .actions {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .actions a {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #00d4ff 0%, #0066ff 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      margin: 0.5rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .actions a:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
    }
    .info {
      margin-top: 2rem;
      font-size: 0.9rem;
      opacity: 0.6;
    }
    code {
      background: rgba(255,255,255,0.1);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.85em;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Knowledge Graph Dashboard</h1>
    <p>The dashboard server is running. Connect to explore your knowledge graph visually.</p>

    <div class="status" id="status">
      <div class="card">
        <h3>GraphQL Server</h3>
        <div class="value" id="graphql-status">
          <span class="indicator disconnected" id="graphql-indicator"></span>
          <span id="graphql-text">Checking...</span>
        </div>
      </div>
      <div class="card">
        <h3>Dashboard Mode</h3>
        <div class="value ${mode === "development" ? "mode-dev" : "mode-prod"}">${mode}</div>
      </div>
      <div class="card">
        <h3>Endpoint</h3>
        <div class="value" style="font-size: 0.9rem; word-break: break-all;">${graphqlEndpoint}</div>
      </div>
    </div>

    <div class="actions">
      <a href="${graphqlEndpoint.replace("/graphql", "/graphql")}" target="_blank">GraphQL Playground</a>
      <a href="/api/health">Health Check</a>
    </div>

    <div class="info">
      <p>For the full dashboard experience, install the dashboard package:</p>
      <p><code>npm run dashboard:install</code></p>
    </div>
  </div>

  <script>
    async function checkGraphQL() {
      const indicator = document.getElementById('graphql-indicator');
      const text = document.getElementById('graphql-text');

      try {
        const res = await fetch('${graphqlEndpoint}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: '{ __typename }' }),
        });

        if (res.ok) {
          indicator.className = 'indicator connected';
          text.textContent = 'Connected';
          text.className = 'connected';
        } else {
          throw new Error('Not OK');
        }
      } catch (e) {
        indicator.className = 'indicator disconnected';
        text.textContent = 'Disconnected';
        text.className = 'disconnected';
      }
    }

    // Initial check
    checkGraphQL();

    // Check every 5 seconds
    setInterval(checkGraphQL, 5000);
  <\/script>
</body>
</html>`;
  }
  /**
   * Stop the dashboard server
   */
  async stop() {
    if (this.state.status === "stopped") {
      logger.debug("Dashboard server already stopped");
      return;
    }
    this.state.status = "stopping";
    this.emit("stopping");
    try {
      this.stopGraphQLMonitoring();
      if (this.childProcess) {
        await this.killChildProcess();
        this.childProcess = null;
      }
      if (this.httpServer) {
        await this.closeHttpServer();
        this.httpServer = null;
      }
      this.state.status = "stopped";
      this.state.port = void 0;
      this.state.startedAt = void 0;
      this.state.graphqlConnected = void 0;
      this.emit("stopped");
      if (this.shutdownResolve) {
        this.shutdownResolve();
        this.shutdownResolve = null;
        this.shutdownPromise = null;
      }
      logger.info("Dashboard server stopped");
    } catch (error) {
      this.state.status = "error";
      this.state.error = error instanceof Error ? error.message : String(error);
      this.emit("error", error);
      throw error;
    }
  }
  /**
   * Kill the child process
   */
  async killChildProcess() {
    if (!this.childProcess) return;
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.childProcess?.kill("SIGKILL");
        resolve();
      }, SHUTDOWN_TIMEOUT);
      this.childProcess?.on("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
      this.childProcess?.kill("SIGTERM");
    });
  }
  /**
   * Close the HTTP server
   */
  async closeHttpServer() {
    if (!this.httpServer) return;
    return new Promise((resolve, reject) => {
      this.httpServer.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  // ============================================================================
  // Build
  // ============================================================================
  /**
   * Build the dashboard for production
   */
  async build() {
    const dashboardPath = this.config.dashboardPath;
    if (!this.isDashboardInstalled()) {
      throw new Error("Dashboard not installed. Run npm run dashboard:install first.");
    }
    this.emit("build:started");
    try {
      const env = {
        ...process.env,
        NEXT_PUBLIC_GRAPHQL_ENDPOINT: this.config.graphqlEndpoint,
        NODE_ENV: "production"
      };
      await execAsync("npm run build", {
        cwd: dashboardPath,
        env
      });
      this.emit("build:completed");
      logger.info("Dashboard build completed");
    } catch (error) {
      this.emit("build:failed", error);
      throw error;
    }
  }
  // ============================================================================
  // GraphQL Connection Monitoring
  // ============================================================================
  /**
   * Start GraphQL connection monitoring
   */
  startGraphQLMonitoring() {
    this.checkGraphQLConnection().then((connected) => {
      this.state.graphqlConnected = connected;
      if (connected) {
        this.emit("graphql:connected");
      } else {
        this.emit("graphql:disconnected");
      }
    });
    this.graphqlCheckInterval = setInterval(async () => {
      const wasConnected = this.state.graphqlConnected;
      const isConnected = await this.checkGraphQLConnection();
      if (wasConnected !== isConnected) {
        this.state.graphqlConnected = isConnected;
        if (isConnected) {
          this.emit("graphql:connected");
          logger.info("GraphQL connection established");
        } else {
          this.emit("graphql:disconnected");
          logger.warn("GraphQL connection lost");
        }
      }
    }, GRAPHQL_CHECK_INTERVAL);
  }
  /**
   * Stop GraphQL connection monitoring
   */
  stopGraphQLMonitoring() {
    if (this.graphqlCheckInterval) {
      clearInterval(this.graphqlCheckInterval);
      this.graphqlCheckInterval = null;
    }
  }
  /**
   * Check if GraphQL connection is available
   */
  async checkGraphQLConnection() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3e3);
      const response = await fetch(this.config.graphqlEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "{ __typename }" }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }
  // ============================================================================
  // State & Events
  // ============================================================================
  /**
   * Get current server state
   */
  getState() {
    return { ...this.state };
  }
  /**
   * Wait for the server to shutdown
   */
  async waitForShutdown() {
    if (this.shutdownPromise) {
      return this.shutdownPromise;
    }
    if (this.state.status === "stopped") {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.shutdownResolve = resolve;
    });
  }
  /**
   * Emit an event
   */
  emit(event, data) {
    this.eventEmitter.emit(event, data);
  }
  /**
   * Subscribe to events
   */
  on(event, listener) {
    this.eventEmitter.on(event, listener);
  }
  /**
   * Unsubscribe from events
   */
  off(event, listener) {
    this.eventEmitter.off(event, listener);
  }
  /**
   * Subscribe to an event once
   */
  once(event, listener) {
    this.eventEmitter.once(event, listener);
  }
}
function createDashboardServer(config) {
  return new DashboardServer(config);
}
export {
  DashboardServer,
  createDashboardServer
};
//# sourceMappingURL=server.js.map
