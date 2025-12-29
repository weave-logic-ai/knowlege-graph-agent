/**
 * Server Manager
 *
 * Orchestrates multiple server instances (MCP, GraphQL, Dashboard) in a single
 * Node.js process. Handles lifecycle management, health monitoring, and
 * graceful shutdown coordination.
 *
 * @module server/manager
 */

import { EventEmitter } from 'events';
import { createServer, Server as HTTPServer } from 'http';
import { createLogger } from '../utils/index.js';
import { KnowledgeGraphMCPServer } from '../mcp-server/server.js';
import { SharedServices, createSharedServices } from './shared-services.js';
import type {
  ServerConfig,
  IServerManager,
  ServerManagerState,
  ServerState,
  ServerStatus,
  HealthStatus,
  ServerEventType,
  ServerEventListener,
  ServerEvent,
  HTTPServerInstance,
  MCPServerInstance,
  DEFAULT_GRAPHQL_PORT,
  DEFAULT_DASHBOARD_PORT,
  SHUTDOWN_TIMEOUT,
} from './types.js';

const logger = createLogger('server-manager');

// ============================================================================
// Constants
// ============================================================================

const GRAPHQL_DEFAULT_PORT = 4000;
const DASHBOARD_DEFAULT_PORT = 3000;
const SHUTDOWN_TIMEOUT_MS = 10000;

// ============================================================================
// Server Manager Implementation
// ============================================================================

/**
 * ServerManager
 *
 * Manages the lifecycle of multiple server instances running concurrently
 * in a single Node.js process. Coordinates shared services and handles
 * graceful shutdown.
 *
 * @example
 * ```typescript
 * const manager = new ServerManager(config);
 * await manager.initialize();
 *
 * // Start servers
 * await manager.startAll();
 *
 * // Handle shutdown
 * process.on('SIGINT', () => manager.gracefulShutdown());
 * ```
 */
export class ServerManager implements IServerManager {
  private config: ServerConfig;
  private services: SharedServices | null = null;
  private eventEmitter: EventEmitter;

  // Server instances
  private mcpServer: MCPServerInstance | null = null;
  private graphqlServer: HTTPServerInstance | null = null;
  private dashboardServer: HTTPServerInstance | null = null;

  // State tracking
  private state: ServerManagerState;
  private shutdownInProgress: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor(config: ServerConfig) {
    this.config = config;
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(50);

    // Initialize state
    this.state = {
      mcp: this.createInitialServerState(),
      graphql: this.createInitialServerState(),
      dashboard: this.createInitialServerState(),
      overall: 'stopped',
    };

    logger.debug('ServerManager created', {
      projectRoot: config.projectRoot,
      mcpEnabled: config.mcp.enabled,
      graphqlEnabled: config.graphql.enabled,
      dashboardEnabled: config.dashboard.enabled,
    });
  }

  private createInitialServerState(): ServerState {
    return {
      status: 'stopped',
      requestCount: 0,
    };
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  /**
   * Initialize shared services
   */
  async initialize(): Promise<void> {
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

  private async _doInitialize(): Promise<void> {
    logger.info('Initializing ServerManager...');

    try {
      this.services = await createSharedServices(this.config);
      this.state.initializedAt = new Date();

      // Forward service events
      this.services.eventBus.on('service:initialized', (data) => {
        this.emitEvent({
          type: 'server:starting',
          timestamp: new Date(),
          data,
        });
      });

      logger.info('ServerManager initialized');
    } catch (error) {
      logger.error(
        'Failed to initialize ServerManager',
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
  async startMCP(): Promise<void> {
    if (!this.services) {
      await this.initialize();
    }

    if (this.mcpServer) {
      logger.warn('MCP server already running');
      return;
    }

    this.updateServerState('mcp', { status: 'starting' });
    this.emitEvent({
      type: 'server:starting',
      server: 'mcp',
      timestamp: new Date(),
    });

    try {
      logger.info('Starting MCP server...');

      const mcpServer = new KnowledgeGraphMCPServer(
        {
          name: this.config.mcp.name,
          version: this.config.mcp.version,
        },
        this.services!.database,
        this.services!.cache,
        this.services!.projectRoot
      );

      await mcpServer.run();

      this.mcpServer = {
        server: mcpServer,
        startedAt: new Date(),
      };

      this.updateServerState('mcp', {
        status: 'running',
        startedAt: new Date(),
      });

      this.emitEvent({
        type: 'server:started',
        server: 'mcp',
        timestamp: new Date(),
        data: { transport: 'stdio' },
      });

      logger.info('MCP server started on stdio');
    } catch (error) {
      this.updateServerState('mcp', {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });

      this.emitEvent({
        type: 'server:error',
        server: 'mcp',
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
      });

      throw error;
    }

    this.updateOverallState();
  }

  /**
   * Stop the MCP server
   */
  async stopMCP(): Promise<void> {
    if (!this.mcpServer) {
      logger.debug('MCP server not running');
      return;
    }

    this.updateServerState('mcp', { status: 'stopping' });
    this.emitEvent({
      type: 'server:stopping',
      server: 'mcp',
      timestamp: new Date(),
    });

    try {
      await this.mcpServer.server.shutdown();
      this.mcpServer = null;

      this.updateServerState('mcp', {
        status: 'stopped',
        startedAt: undefined,
      });

      this.emitEvent({
        type: 'server:stopped',
        server: 'mcp',
        timestamp: new Date(),
      });

      logger.info('MCP server stopped');
    } catch (error) {
      logger.error('Error stopping MCP server', error as Error);
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
  async startGraphQL(port?: number): Promise<void> {
    if (!this.services) {
      await this.initialize();
    }

    if (this.graphqlServer) {
      logger.warn('GraphQL server already running');
      return;
    }

    const serverPort = port ?? this.config.graphql.port ?? GRAPHQL_DEFAULT_PORT;

    this.updateServerState('graphql', { status: 'starting' });
    this.emitEvent({
      type: 'server:starting',
      server: 'graphql',
      timestamp: new Date(),
      data: { port: serverPort },
    });

    try {
      logger.info(`Starting GraphQL server on port ${serverPort}...`);

      const httpServer = await this.createGraphQLServer(serverPort);

      this.graphqlServer = {
        server: httpServer,
        port: serverPort,
        type: 'graphql',
        startedAt: new Date(),
      };

      this.updateServerState('graphql', {
        status: 'running',
        startedAt: new Date(),
        port: serverPort,
      });

      this.emitEvent({
        type: 'server:started',
        server: 'graphql',
        timestamp: new Date(),
        data: { port: serverPort },
      });

      logger.info(`GraphQL server started on http://localhost:${serverPort}/graphql`);
    } catch (error) {
      this.updateServerState('graphql', {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });

      this.emitEvent({
        type: 'server:error',
        server: 'graphql',
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
      });

      throw error;
    }

    this.updateOverallState();
  }

  /**
   * Create the GraphQL HTTP server
   * Note: This is a placeholder - actual GraphQL schema would be implemented separately
   */
  private async createGraphQLServer(port: number): Promise<HTTPServer> {
    return new Promise((resolve, reject) => {
      const server = createServer((req, res) => {
        // Track requests
        this.state.graphql.requestCount++;

        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        // Health check endpoint
        if (req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', server: 'graphql' }));
          return;
        }

        // GraphQL endpoint placeholder
        if (req.url === '/graphql' || req.url?.startsWith('/graphql?')) {
          // Note: In production, this would integrate with a GraphQL library
          // like Apollo Server or graphql-yoga
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              data: null,
              errors: [
                {
                  message: 'GraphQL server is running. Schema not yet implemented.',
                  extensions: {
                    code: 'NOT_IMPLEMENTED',
                    hint: 'The GraphQL schema will be implemented in a future update.',
                  },
                },
              ],
            })
          );
          return;
        }

        // 404 for other routes
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      });

      server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
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
  async stopGraphQL(): Promise<void> {
    if (!this.graphqlServer) {
      logger.debug('GraphQL server not running');
      return;
    }

    this.updateServerState('graphql', { status: 'stopping' });
    this.emitEvent({
      type: 'server:stopping',
      server: 'graphql',
      timestamp: new Date(),
    });

    try {
      await this.closeHTTPServer(this.graphqlServer.server);
      this.graphqlServer = null;

      this.updateServerState('graphql', {
        status: 'stopped',
        startedAt: undefined,
        port: undefined,
      });

      this.emitEvent({
        type: 'server:stopped',
        server: 'graphql',
        timestamp: new Date(),
      });

      logger.info('GraphQL server stopped');
    } catch (error) {
      logger.error('Error stopping GraphQL server', error as Error);
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
  async startDashboard(port?: number): Promise<void> {
    if (!this.services) {
      await this.initialize();
    }

    if (this.dashboardServer) {
      logger.warn('Dashboard server already running');
      return;
    }

    const serverPort = port ?? this.config.dashboard.port ?? DASHBOARD_DEFAULT_PORT;

    this.updateServerState('dashboard', { status: 'starting' });
    this.emitEvent({
      type: 'server:starting',
      server: 'dashboard',
      timestamp: new Date(),
      data: { port: serverPort },
    });

    try {
      logger.info(`Starting Dashboard server on port ${serverPort}...`);

      const httpServer = await this.createDashboardServer(serverPort);

      this.dashboardServer = {
        server: httpServer,
        port: serverPort,
        type: 'dashboard',
        startedAt: new Date(),
      };

      this.updateServerState('dashboard', {
        status: 'running',
        startedAt: new Date(),
        port: serverPort,
      });

      this.emitEvent({
        type: 'server:started',
        server: 'dashboard',
        timestamp: new Date(),
        data: { port: serverPort },
      });

      logger.info(`Dashboard server started on http://localhost:${serverPort}`);
    } catch (error) {
      this.updateServerState('dashboard', {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });

      this.emitEvent({
        type: 'server:error',
        server: 'dashboard',
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
      });

      throw error;
    }

    this.updateOverallState();
  }

  /**
   * Create the Dashboard HTTP server
   * Note: This is a placeholder - actual dashboard would be implemented separately
   */
  private async createDashboardServer(port: number): Promise<HTTPServer> {
    return new Promise((resolve, reject) => {
      const server = createServer((req, res) => {
        // Track requests
        this.state.dashboard.requestCount++;

        // Health check
        if (req.url === '/api/health') {
          const health = this.getHealth();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(health));
          return;
        }

        // Server status API
        if (req.url === '/api/status') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(this.getState()));
          return;
        }

        // Dashboard placeholder
        res.writeHead(200, { 'Content-Type': 'text/html' });
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
  </script>
</body>
</html>
        `);
      });

      server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
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
  async stopDashboard(): Promise<void> {
    if (!this.dashboardServer) {
      logger.debug('Dashboard server not running');
      return;
    }

    this.updateServerState('dashboard', { status: 'stopping' });
    this.emitEvent({
      type: 'server:stopping',
      server: 'dashboard',
      timestamp: new Date(),
    });

    try {
      await this.closeHTTPServer(this.dashboardServer.server);
      this.dashboardServer = null;

      this.updateServerState('dashboard', {
        status: 'stopped',
        startedAt: undefined,
        port: undefined,
      });

      this.emitEvent({
        type: 'server:stopped',
        server: 'dashboard',
        timestamp: new Date(),
      });

      logger.info('Dashboard server stopped');
    } catch (error) {
      logger.error('Error stopping Dashboard server', error as Error);
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
  async startAll(): Promise<void> {
    await this.initialize();

    logger.info('Starting all enabled servers...');

    const startPromises: Promise<void>[] = [];

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
      logger.warn('No servers enabled in configuration');
      return;
    }

    // Note: MCP uses stdio, so it blocks the main thread in a specific way.
    // HTTP servers (GraphQL, Dashboard) can run alongside each other.
    // We need to be careful about starting MCP with HTTP servers.
    //
    // If MCP is enabled with HTTP servers:
    // - Start HTTP servers first (they're non-blocking)
    // - Start MCP last (it consumes stdio)

    if (this.config.mcp.enabled && (this.config.graphql.enabled || this.config.dashboard.enabled)) {
      // Start HTTP servers first
      if (this.config.graphql.enabled) {
        await this.startGraphQL();
      }
      if (this.config.dashboard.enabled) {
        await this.startDashboard();
      }
      // Then start MCP (which will consume stdio)
      await this.startMCP();
    } else {
      // No special ordering needed
      await Promise.all(startPromises);
    }

    logger.info('All enabled servers started');
  }

  /**
   * Stop a specific server
   */
  async stop(server: 'mcp' | 'graphql' | 'dashboard'): Promise<void> {
    switch (server) {
      case 'mcp':
        await this.stopMCP();
        break;
      case 'graphql':
        await this.stopGraphQL();
        break;
      case 'dashboard':
        await this.stopDashboard();
        break;
    }
  }

  /**
   * Graceful shutdown of all servers and services
   */
  async gracefulShutdown(): Promise<void> {
    if (this.shutdownInProgress) {
      logger.warn('Shutdown already in progress');
      return;
    }

    this.shutdownInProgress = true;
    logger.info('Starting graceful shutdown...');

    // Create a timeout promise
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms`));
      }, SHUTDOWN_TIMEOUT_MS);
    });

    try {
      await Promise.race([this._performShutdown(), timeoutPromise]);
      logger.info('Graceful shutdown complete');
    } catch (error) {
      logger.error('Shutdown error or timeout', error as Error);
      // Force exit on timeout
      process.exit(1);
    }
  }

  private async _performShutdown(): Promise<void> {
    // Stop servers in reverse order of startup
    const stopPromises: Promise<void>[] = [];

    if (this.mcpServer) {
      stopPromises.push(this.stopMCP());
    }

    if (this.graphqlServer) {
      stopPromises.push(this.stopGraphQL());
    }

    if (this.dashboardServer) {
      stopPromises.push(this.stopDashboard());
    }

    // Wait for all servers to stop
    await Promise.allSettled(stopPromises);

    // Shutdown shared services
    if (this.services) {
      await this.services.shutdown();
      this.services = null;
    }

    this.state.overall = 'stopped';
  }

  // ============================================================================
  // State & Health
  // ============================================================================

  /**
   * Get current server manager state
   */
  getState(): ServerManagerState {
    return { ...this.state };
  }

  /**
   * Get comprehensive health status
   */
  getHealth(): HealthStatus {
    if (!this.services) {
      return {
        healthy: false,
        status: 'unhealthy',
        components: [],
        uptime: 0,
        totalRequests: 0,
        memory: process.memoryUsage() as HealthStatus['memory'],
      };
    }

    const serviceHealth = this.services.getHealth();

    // Add server-specific components
    serviceHealth.components.push({
      name: 'mcp-server',
      healthy: !this.config.mcp.enabled || this.state.mcp.status === 'running',
      message: this.state.mcp.status,
      lastCheck: new Date(),
    });

    serviceHealth.components.push({
      name: 'graphql-server',
      healthy: !this.config.graphql.enabled || this.state.graphql.status === 'running',
      message: `${this.state.graphql.status}${this.state.graphql.port ? ` on port ${this.state.graphql.port}` : ''}`,
      lastCheck: new Date(),
    });

    serviceHealth.components.push({
      name: 'dashboard-server',
      healthy: !this.config.dashboard.enabled || this.state.dashboard.status === 'running',
      message: `${this.state.dashboard.status}${this.state.dashboard.port ? ` on port ${this.state.dashboard.port}` : ''}`,
      lastCheck: new Date(),
    });

    // Update total requests
    serviceHealth.totalRequests =
      this.state.mcp.requestCount +
      this.state.graphql.requestCount +
      this.state.dashboard.requestCount;

    return serviceHealth;
  }

  // ============================================================================
  // Event Management
  // ============================================================================

  /**
   * Subscribe to server events
   */
  on(event: ServerEventType, listener: ServerEventListener): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Unsubscribe from server events
   */
  off(event: ServerEventType, listener: ServerEventListener): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Subscribe to an event once
   */
  once(event: ServerEventType, listener: ServerEventListener): void {
    this.eventEmitter.once(event, listener);
  }

  private emitEvent(event: ServerEvent): void {
    this.eventEmitter.emit(event.type, event);
    // Also emit to services event bus for cross-service communication
    if (this.services) {
      this.services.eventBus.emit(`server:${event.type}`, event);
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private updateServerState(
    server: 'mcp' | 'graphql' | 'dashboard',
    updates: Partial<ServerState>
  ): void {
    this.state[server] = {
      ...this.state[server],
      ...updates,
    };
  }

  private updateOverallState(): void {
    const states = [this.state.mcp.status, this.state.graphql.status, this.state.dashboard.status];

    if (states.some((s) => s === 'error')) {
      this.state.overall = 'error';
    } else if (states.some((s) => s === 'running')) {
      this.state.overall = 'running';
    } else if (states.some((s) => s === 'starting')) {
      this.state.overall = 'starting';
    } else if (states.some((s) => s === 'stopping')) {
      this.state.overall = 'stopping';
    } else {
      this.state.overall = 'stopped';
    }
  }

  private async closeHTTPServer(server: HTTPServer): Promise<void> {
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

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create and optionally initialize a server manager
 */
export async function createServerManager(
  config: ServerConfig,
  autoInitialize: boolean = true
): Promise<ServerManager> {
  const manager = new ServerManager(config);

  if (autoInitialize) {
    await manager.initialize();
  }

  return manager;
}
