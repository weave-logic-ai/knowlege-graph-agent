import { EventEmitter } from "events";
import { createServer } from "http";
import { createLogger } from "../utils/logger.js";
import { KnowledgeGraphMCPServer } from "../mcp-server/server.js";
import { createSharedServices } from "./shared-services.js";
const logger = createLogger("server-manager");
const GRAPHQL_DEFAULT_PORT = 4e3;
const DASHBOARD_DEFAULT_PORT = 3e3;
const SHUTDOWN_TIMEOUT_MS = 1e4;
class ServerManager {
  config;
  services = null;
  eventEmitter;
  // Server instances
  mcpServer = null;
  graphqlServer = null;
  dashboardServer = null;
  // State tracking
  state;
  shutdownInProgress = false;
  initPromise = null;
  constructor(config) {
    this.config = config;
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(50);
    this.state = {
      mcp: this.createInitialServerState(),
      graphql: this.createInitialServerState(),
      dashboard: this.createInitialServerState(),
      overall: "stopped"
    };
    logger.debug("ServerManager created", {
      projectRoot: config.projectRoot,
      mcpEnabled: config.mcp.enabled,
      graphqlEnabled: config.graphql.enabled,
      dashboardEnabled: config.dashboard.enabled
    });
  }
  createInitialServerState() {
    return {
      status: "stopped",
      requestCount: 0
    };
  }
  // ============================================================================
  // Initialization
  // ============================================================================
  /**
   * Initialize shared services
   */
  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }
    if (this.services?.isInitialized()) {
      return;
    }
    this.initPromise = this._doInitialize();
    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }
  async _doInitialize() {
    logger.info("Initializing ServerManager...");
    try {
      this.services = await createSharedServices(this.config);
      this.state.initializedAt = /* @__PURE__ */ new Date();
      this.services.eventBus.on("service:initialized", (data) => {
        this.emitEvent({
          type: "server:starting",
          timestamp: /* @__PURE__ */ new Date(),
          data
        });
      });
      logger.info("ServerManager initialized");
    } catch (error) {
      logger.error(
        "Failed to initialize ServerManager",
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
  // ============================================================================
  // MCP Server Management
  // ============================================================================
  /**
   * Start the MCP server (stdio transport)
   */
  async startMCP() {
    if (!this.services) {
      await this.initialize();
    }
    if (this.mcpServer) {
      logger.warn("MCP server already running");
      return;
    }
    this.updateServerState("mcp", { status: "starting" });
    this.emitEvent({
      type: "server:starting",
      server: "mcp",
      timestamp: /* @__PURE__ */ new Date()
    });
    try {
      logger.info("Starting MCP server...");
      const mcpServer = new KnowledgeGraphMCPServer(
        {
          name: this.config.mcp.name,
          version: this.config.mcp.version
        },
        this.services.database,
        this.services.cache,
        this.services.projectRoot
      );
      await mcpServer.run();
      this.mcpServer = {
        server: mcpServer,
        startedAt: /* @__PURE__ */ new Date()
      };
      this.updateServerState("mcp", {
        status: "running",
        startedAt: /* @__PURE__ */ new Date()
      });
      this.emitEvent({
        type: "server:started",
        server: "mcp",
        timestamp: /* @__PURE__ */ new Date(),
        data: { transport: "stdio" }
      });
      logger.info("MCP server started on stdio");
    } catch (error) {
      this.updateServerState("mcp", {
        status: "error",
        error: error instanceof Error ? error.message : String(error)
      });
      this.emitEvent({
        type: "server:error",
        server: "mcp",
        timestamp: /* @__PURE__ */ new Date(),
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
    this.updateOverallState();
  }
  /**
   * Stop the MCP server
   */
  async stopMCP() {
    if (!this.mcpServer) {
      logger.debug("MCP server not running");
      return;
    }
    this.updateServerState("mcp", { status: "stopping" });
    this.emitEvent({
      type: "server:stopping",
      server: "mcp",
      timestamp: /* @__PURE__ */ new Date()
    });
    try {
      await this.mcpServer.server.shutdown();
      this.mcpServer = null;
      this.updateServerState("mcp", {
        status: "stopped",
        startedAt: void 0
      });
      this.emitEvent({
        type: "server:stopped",
        server: "mcp",
        timestamp: /* @__PURE__ */ new Date()
      });
      logger.info("MCP server stopped");
    } catch (error) {
      logger.error("Error stopping MCP server", error);
      throw error;
    }
    this.updateOverallState();
  }
  // ============================================================================
  // GraphQL Server Management
  // ============================================================================
  /**
   * Start the GraphQL server
   */
  async startGraphQL(port) {
    if (!this.services) {
      await this.initialize();
    }
    if (this.graphqlServer) {
      logger.warn("GraphQL server already running");
      return;
    }
    const serverPort = port ?? this.config.graphql.port ?? GRAPHQL_DEFAULT_PORT;
    this.updateServerState("graphql", { status: "starting" });
    this.emitEvent({
      type: "server:starting",
      server: "graphql",
      timestamp: /* @__PURE__ */ new Date(),
      data: { port: serverPort }
    });
    try {
      logger.info(`Starting GraphQL server on port ${serverPort}...`);
      const httpServer = await this.createGraphQLServer(serverPort);
      this.graphqlServer = {
        server: httpServer,
        port: serverPort,
        type: "graphql",
        startedAt: /* @__PURE__ */ new Date()
      };
      this.updateServerState("graphql", {
        status: "running",
        startedAt: /* @__PURE__ */ new Date(),
        port: serverPort
      });
      this.emitEvent({
        type: "server:started",
        server: "graphql",
        timestamp: /* @__PURE__ */ new Date(),
        data: { port: serverPort }
      });
      logger.info(`GraphQL server started on http://localhost:${serverPort}/graphql`);
    } catch (error) {
      this.updateServerState("graphql", {
        status: "error",
        error: error instanceof Error ? error.message : String(error)
      });
      this.emitEvent({
        type: "server:error",
        server: "graphql",
        timestamp: /* @__PURE__ */ new Date(),
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
    this.updateOverallState();
  }
  /**
   * Create the GraphQL HTTP server
   * Note: This is a placeholder - actual GraphQL schema would be implemented separately
   */
  async createGraphQLServer(port) {
    return new Promise((resolve, reject) => {
      const server = createServer((req, res) => {
        this.state.graphql.requestCount++;
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }
        if (req.url === "/health") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "ok", server: "graphql" }));
          return;
        }
        if (req.url === "/graphql" || req.url?.startsWith("/graphql?")) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              data: null,
              errors: [
                {
                  message: "GraphQL server is running. Schema not yet implemented.",
                  extensions: {
                    code: "NOT_IMPLEMENTED",
                    hint: "The GraphQL schema will be implemented in a future update."
                  }
                }
              ]
            })
          );
          return;
        }
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
      });
      server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
          reject(new Error(`Port ${port} is already in use`));
        } else {
          reject(error);
        }
      });
      server.listen(port, () => {
        resolve(server);
      });
    });
  }
  /**
   * Stop the GraphQL server
   */
  async stopGraphQL() {
    if (!this.graphqlServer) {
      logger.debug("GraphQL server not running");
      return;
    }
    this.updateServerState("graphql", { status: "stopping" });
    this.emitEvent({
      type: "server:stopping",
      server: "graphql",
      timestamp: /* @__PURE__ */ new Date()
    });
    try {
      await this.closeHTTPServer(this.graphqlServer.server);
      this.graphqlServer = null;
      this.updateServerState("graphql", {
        status: "stopped",
        startedAt: void 0,
        port: void 0
      });
      this.emitEvent({
        type: "server:stopped",
        server: "graphql",
        timestamp: /* @__PURE__ */ new Date()
      });
      logger.info("GraphQL server stopped");
    } catch (error) {
      logger.error("Error stopping GraphQL server", error);
      throw error;
    }
    this.updateOverallState();
  }
  // ============================================================================
  // Dashboard Server Management
  // ============================================================================
  /**
   * Start the Dashboard server
   */
  async startDashboard(port) {
    if (!this.services) {
      await this.initialize();
    }
    if (this.dashboardServer) {
      logger.warn("Dashboard server already running");
      return;
    }
    const serverPort = port ?? this.config.dashboard.port ?? DASHBOARD_DEFAULT_PORT;
    this.updateServerState("dashboard", { status: "starting" });
    this.emitEvent({
      type: "server:starting",
      server: "dashboard",
      timestamp: /* @__PURE__ */ new Date(),
      data: { port: serverPort }
    });
    try {
      logger.info(`Starting Dashboard server on port ${serverPort}...`);
      const httpServer = await this.createDashboardServer(serverPort);
      this.dashboardServer = {
        server: httpServer,
        port: serverPort,
        type: "dashboard",
        startedAt: /* @__PURE__ */ new Date()
      };
      this.updateServerState("dashboard", {
        status: "running",
        startedAt: /* @__PURE__ */ new Date(),
        port: serverPort
      });
      this.emitEvent({
        type: "server:started",
        server: "dashboard",
        timestamp: /* @__PURE__ */ new Date(),
        data: { port: serverPort }
      });
      logger.info(`Dashboard server started on http://localhost:${serverPort}`);
    } catch (error) {
      this.updateServerState("dashboard", {
        status: "error",
        error: error instanceof Error ? error.message : String(error)
      });
      this.emitEvent({
        type: "server:error",
        server: "dashboard",
        timestamp: /* @__PURE__ */ new Date(),
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
    this.updateOverallState();
  }
  /**
   * Create the Dashboard HTTP server
   * Note: This is a placeholder - actual dashboard would be implemented separately
   */
  async createDashboardServer(port) {
    return new Promise((resolve, reject) => {
      const server = createServer((req, res) => {
        this.state.dashboard.requestCount++;
        if (req.url === "/api/health") {
          const health = this.getHealth();
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(health));
          return;
        }
        if (req.url === "/api/status") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(this.getState()));
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
<!DOCTYPE html>
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
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 2.5rem; margin-bottom: 1rem; color: #00d4ff; }
    p { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.8; }
    .status {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 2rem;
    }
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 1.5rem;
      min-width: 150px;
    }
    .card h3 { color: #00d4ff; font-size: 0.9rem; margin-bottom: 0.5rem; }
    .card .value { font-size: 1.5rem; font-weight: bold; }
    .healthy { color: #00ff88; }
    .running { color: #00ff88; }
    .stopped { color: #ff6b6b; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Knowledge Graph Dashboard</h1>
    <p>The full dashboard UI is coming soon.</p>
    <div class="status" id="status">Loading...</div>
  </div>
  <script>
    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        const container = document.getElementById('status');
        container.innerHTML = \`
          <div class="card">
            <h3>MCP Server</h3>
            <div class="value \${data.mcp.status}">\${data.mcp.status}</div>
          </div>
          <div class="card">
            <h3>GraphQL Server</h3>
            <div class="value \${data.graphql.status}">\${data.graphql.status}</div>
          </div>
          <div class="card">
            <h3>Dashboard</h3>
            <div class="value \${data.dashboard.status}">\${data.dashboard.status}</div>
          </div>
        \`;
      } catch (e) {
        document.getElementById('status').innerHTML = 'Error loading status';
      }
    }
    fetchStatus();
    setInterval(fetchStatus, 5000);
  <\/script>
</body>
</html>
        `);
      });
      server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
          reject(new Error(`Port ${port} is already in use`));
        } else {
          reject(error);
        }
      });
      server.listen(port, () => {
        resolve(server);
      });
    });
  }
  /**
   * Stop the Dashboard server
   */
  async stopDashboard() {
    if (!this.dashboardServer) {
      logger.debug("Dashboard server not running");
      return;
    }
    this.updateServerState("dashboard", { status: "stopping" });
    this.emitEvent({
      type: "server:stopping",
      server: "dashboard",
      timestamp: /* @__PURE__ */ new Date()
    });
    try {
      await this.closeHTTPServer(this.dashboardServer.server);
      this.dashboardServer = null;
      this.updateServerState("dashboard", {
        status: "stopped",
        startedAt: void 0,
        port: void 0
      });
      this.emitEvent({
        type: "server:stopped",
        server: "dashboard",
        timestamp: /* @__PURE__ */ new Date()
      });
      logger.info("Dashboard server stopped");
    } catch (error) {
      logger.error("Error stopping Dashboard server", error);
      throw error;
    }
    this.updateOverallState();
  }
  // ============================================================================
  // Aggregate Operations
  // ============================================================================
  /**
   * Start all enabled servers
   */
  async startAll() {
    await this.initialize();
    logger.info("Starting all enabled servers...");
    const startPromises = [];
    if (this.config.mcp.enabled) {
      startPromises.push(this.startMCP());
    }
    if (this.config.graphql.enabled) {
      startPromises.push(this.startGraphQL());
    }
    if (this.config.dashboard.enabled) {
      startPromises.push(this.startDashboard());
    }
    if (startPromises.length === 0) {
      logger.warn("No servers enabled in configuration");
      return;
    }
    if (this.config.mcp.enabled && (this.config.graphql.enabled || this.config.dashboard.enabled)) {
      if (this.config.graphql.enabled) {
        await this.startGraphQL();
      }
      if (this.config.dashboard.enabled) {
        await this.startDashboard();
      }
      await this.startMCP();
    } else {
      await Promise.all(startPromises);
    }
    logger.info("All enabled servers started");
  }
  /**
   * Stop a specific server
   */
  async stop(server) {
    switch (server) {
      case "mcp":
        await this.stopMCP();
        break;
      case "graphql":
        await this.stopGraphQL();
        break;
      case "dashboard":
        await this.stopDashboard();
        break;
    }
  }
  /**
   * Graceful shutdown of all servers and services
   */
  async gracefulShutdown() {
    if (this.shutdownInProgress) {
      logger.warn("Shutdown already in progress");
      return;
    }
    this.shutdownInProgress = true;
    logger.info("Starting graceful shutdown...");
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms`));
      }, SHUTDOWN_TIMEOUT_MS);
    });
    try {
      await Promise.race([this._performShutdown(), timeoutPromise]);
      logger.info("Graceful shutdown complete");
    } catch (error) {
      logger.error("Shutdown error or timeout", error);
      process.exit(1);
    }
  }
  async _performShutdown() {
    const stopPromises = [];
    if (this.mcpServer) {
      stopPromises.push(this.stopMCP());
    }
    if (this.graphqlServer) {
      stopPromises.push(this.stopGraphQL());
    }
    if (this.dashboardServer) {
      stopPromises.push(this.stopDashboard());
    }
    await Promise.allSettled(stopPromises);
    if (this.services) {
      await this.services.shutdown();
      this.services = null;
    }
    this.state.overall = "stopped";
  }
  // ============================================================================
  // State & Health
  // ============================================================================
  /**
   * Get current server manager state
   */
  getState() {
    return { ...this.state };
  }
  /**
   * Get comprehensive health status
   */
  getHealth() {
    if (!this.services) {
      return {
        healthy: false,
        status: "unhealthy",
        components: [],
        uptime: 0,
        totalRequests: 0,
        memory: process.memoryUsage()
      };
    }
    const serviceHealth = this.services.getHealth();
    serviceHealth.components.push({
      name: "mcp-server",
      healthy: !this.config.mcp.enabled || this.state.mcp.status === "running",
      message: this.state.mcp.status,
      lastCheck: /* @__PURE__ */ new Date()
    });
    serviceHealth.components.push({
      name: "graphql-server",
      healthy: !this.config.graphql.enabled || this.state.graphql.status === "running",
      message: `${this.state.graphql.status}${this.state.graphql.port ? ` on port ${this.state.graphql.port}` : ""}`,
      lastCheck: /* @__PURE__ */ new Date()
    });
    serviceHealth.components.push({
      name: "dashboard-server",
      healthy: !this.config.dashboard.enabled || this.state.dashboard.status === "running",
      message: `${this.state.dashboard.status}${this.state.dashboard.port ? ` on port ${this.state.dashboard.port}` : ""}`,
      lastCheck: /* @__PURE__ */ new Date()
    });
    serviceHealth.totalRequests = this.state.mcp.requestCount + this.state.graphql.requestCount + this.state.dashboard.requestCount;
    return serviceHealth;
  }
  // ============================================================================
  // Event Management
  // ============================================================================
  /**
   * Subscribe to server events
   */
  on(event, listener) {
    this.eventEmitter.on(event, listener);
  }
  /**
   * Unsubscribe from server events
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
  emitEvent(event) {
    this.eventEmitter.emit(event.type, event);
    if (this.services) {
      this.services.eventBus.emit(`server:${event.type}`, event);
    }
  }
  // ============================================================================
  // Helper Methods
  // ============================================================================
  updateServerState(server, updates) {
    this.state[server] = {
      ...this.state[server],
      ...updates
    };
  }
  updateOverallState() {
    const states = [this.state.mcp.status, this.state.graphql.status, this.state.dashboard.status];
    if (states.some((s) => s === "error")) {
      this.state.overall = "error";
    } else if (states.some((s) => s === "running")) {
      this.state.overall = "running";
    } else if (states.some((s) => s === "starting")) {
      this.state.overall = "starting";
    } else if (states.some((s) => s === "stopping")) {
      this.state.overall = "stopping";
    } else {
      this.state.overall = "stopped";
    }
  }
  async closeHTTPServer(server) {
    return new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
async function createServerManager(config, autoInitialize = true) {
  const manager = new ServerManager(config);
  if (autoInitialize) {
    await manager.initialize();
  }
  return manager;
}
export {
  ServerManager,
  createServerManager
};
//# sourceMappingURL=manager.js.map
