/**
 * Dashboard Server
 *
 * Server integration for the Knowledge Graph Dashboard.
 * Supports running Next.js in development and production modes,
 * with programmatic control and concurrent server support.
 *
 * @module dashboard/server
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess, exec } from 'child_process';
import { createServer, Server as HTTPServer, IncomingMessage, ServerResponse } from 'http';
import { join, dirname } from 'path';
import { existsSync, readFileSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { createLogger } from '../utils/index.js';
import {
  DEFAULT_DASHBOARD_PORT,
  DEFAULT_GRAPHQL_PORT,
} from '../server/types.js';

/**
 * Execute a command asynchronously
 */
function execAsync(command: string, options?: { cwd?: string; env?: NodeJS.ProcessEnv }): Promise<{ stdout: string; stderr: string }> {
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
const logger = createLogger('dashboard-server');

// ============================================================================
// Types
// ============================================================================

/**
 * Dashboard server mode
 */
export type DashboardMode = 'development' | 'production';

/**
 * Dashboard server configuration
 */
export interface DashboardConfig {
  /** Project root directory */
  projectRoot: string;
  /** Port to listen on */
  port: number;
  /** GraphQL server endpoint URL */
  graphqlEndpoint: string;
  /** Server mode (development or production) */
  mode: DashboardMode;
  /** Output directory for production build */
  outputDir?: string;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Path to dashboard source (defaults to dashboard/ in project) */
  dashboardPath?: string;
}

/**
 * Dashboard server status
 */
export type DashboardStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

/**
 * Dashboard server state
 */
export interface DashboardState {
  /** Current status */
  status: DashboardStatus;
  /** Port the server is listening on */
  port?: number;
  /** GraphQL endpoint being used */
  graphqlEndpoint?: string;
  /** When the server started */
  startedAt?: Date;
  /** Error message if status is 'error' */
  error?: string;
  /** Server mode */
  mode?: DashboardMode;
  /** Whether GraphQL connection is established */
  graphqlConnected?: boolean;
}

/**
 * Dashboard server event types
 */
export type DashboardEventType =
  | 'starting'
  | 'started'
  | 'stopping'
  | 'stopped'
  | 'error'
  | 'build:started'
  | 'build:completed'
  | 'build:failed'
  | 'graphql:connected'
  | 'graphql:disconnected';

/**
 * Dashboard server interface
 */
export interface IDashboardServer {
  /** Start the dashboard server */
  start(): Promise<void>;
  /** Stop the dashboard server */
  stop(): Promise<void>;
  /** Build the dashboard for production */
  build(): Promise<void>;
  /** Get current server state */
  getState(): DashboardState;
  /** Check GraphQL connection */
  checkGraphQLConnection(): Promise<boolean>;
  /** Wait for the server to shutdown (blocks until stopped) */
  waitForShutdown(): Promise<void>;
  /** Subscribe to events */
  on(event: DashboardEventType, listener: (...args: unknown[]) => void): void;
  /** Unsubscribe from events */
  off(event: DashboardEventType, listener: (...args: unknown[]) => void): void;
}

// ============================================================================
// Constants
// ============================================================================

const STARTUP_TIMEOUT = 30000; // 30 seconds
const SHUTDOWN_TIMEOUT = 10000; // 10 seconds
const GRAPHQL_CHECK_INTERVAL = 5000; // 5 seconds
const RECONNECT_DELAY = 3000; // 3 seconds

// MIME types for static file serving
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

// ============================================================================
// Dashboard Server Implementation
// ============================================================================

/**
 * DashboardServer
 *
 * Manages the Knowledge Graph Dashboard web interface.
 * Supports both development (with hot reload) and production modes.
 *
 * @example
 * ```typescript
 * const server = new DashboardServer({
 *   projectRoot: process.cwd(),
 *   port: 3000,
 *   graphqlEndpoint: 'http://localhost:4000/graphql',
 *   mode: 'development',
 * });
 *
 * await server.start();
 *
 * // Later...
 * await server.stop();
 * ```
 */
export class DashboardServer implements IDashboardServer {
  private config: DashboardConfig;
  private state: DashboardState;
  private eventEmitter: EventEmitter;
  private childProcess: ChildProcess | null = null;
  private httpServer: HTTPServer | null = null;
  private graphqlCheckInterval: NodeJS.Timeout | null = null;
  private shutdownPromise: Promise<void> | null = null;
  private shutdownResolve: (() => void) | null = null;

  constructor(config: DashboardConfig) {
    this.config = {
      ...config,
      dashboardPath: config.dashboardPath ?? this.detectDashboardPath(config.projectRoot),
    };

    this.state = {
      status: 'stopped',
    };

    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(50);

    logger.debug('DashboardServer created', {
      port: config.port,
      mode: config.mode,
      graphqlEndpoint: config.graphqlEndpoint,
    });
  }

  // ============================================================================
  // Path Detection
  // ============================================================================

  /**
   * Detect the dashboard path
   */
  private detectDashboardPath(projectRoot: string): string {
    // Check common locations
    const candidates = [
      join(projectRoot, 'dashboard'),
      join(projectRoot, 'src', 'dashboard'),
      join(projectRoot, 'packages', 'dashboard'),
      join(projectRoot, '..', 'dashboard'),
    ];

    for (const candidate of candidates) {
      if (existsSync(join(candidate, 'package.json'))) {
        logger.debug('Found dashboard at', { path: candidate });
        return candidate;
      }
    }

    // Default to projectRoot/dashboard (will be created if needed)
    return join(projectRoot, 'dashboard');
  }

  /**
   * Check if dashboard is installed
   */
  private isDashboardInstalled(): boolean {
    const dashboardPath = this.config.dashboardPath!;
    return existsSync(join(dashboardPath, 'package.json'));
  }

  // ============================================================================
  // Server Lifecycle
  // ============================================================================

  /**
   * Start the dashboard server
   */
  async start(): Promise<void> {
    if (this.state.status === 'running') {
      logger.warn('Dashboard server already running');
      return;
    }

    this.state.status = 'starting';
    this.emit('starting');

    try {
      if (this.config.mode === 'development') {
        await this.startDevelopmentServer();
      } else {
        await this.startProductionServer();
      }

      this.state.status = 'running';
      this.state.port = this.config.port;
      this.state.graphqlEndpoint = this.config.graphqlEndpoint;
      this.state.mode = this.config.mode;
      this.state.startedAt = new Date();

      this.emit('started');

      // Start GraphQL connection monitoring
      this.startGraphQLMonitoring();

      // Setup shutdown promise
      this.shutdownPromise = new Promise((resolve) => {
        this.shutdownResolve = resolve;
      });

      logger.info('Dashboard server started', {
        port: this.config.port,
        mode: this.config.mode,
      });
    } catch (error) {
      this.state.status = 'error';
      this.state.error = error instanceof Error ? error.message : String(error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Start the development server (Next.js dev)
   */
  private async startDevelopmentServer(): Promise<void> {
    const dashboardPath = this.config.dashboardPath!;

    // Check if dashboard is installed
    if (!this.isDashboardInstalled()) {
      // For now, we'll use a fallback static server
      logger.warn('Dashboard not installed, using fallback static server');
      await this.startFallbackServer();
      return;
    }

    // Set environment variables for the dashboard
    const env = {
      ...process.env,
      PORT: String(this.config.port),
      NEXT_PUBLIC_GRAPHQL_ENDPOINT: this.config.graphqlEndpoint,
      NEXT_PUBLIC_API_URL: this.config.graphqlEndpoint.replace('/graphql', ''),
    };

    // Start Next.js dev server
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Dashboard startup timed out after ${STARTUP_TIMEOUT}ms`));
      }, STARTUP_TIMEOUT);

      this.childProcess = spawn('npm', ['run', 'dev'], {
        cwd: dashboardPath,
        env,
        stdio: this.config.verbose ? 'inherit' : 'pipe',
        shell: true,
      });

      this.childProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.childProcess.on('exit', (code) => {
        if (code !== 0 && this.state.status === 'starting') {
          clearTimeout(timeout);
          reject(new Error(`Dashboard process exited with code ${code}`));
        }
      });

      if (this.childProcess.stdout && !this.config.verbose) {
        this.childProcess.stdout.on('data', (data: Buffer) => {
          const output = data.toString();
          if (output.includes('Ready') || output.includes('started')) {
            clearTimeout(timeout);
            resolve();
          }
          if (this.config.verbose) {
            process.stdout.write(data);
          }
        });
      }

      // For verbose mode or fallback, resolve after a delay
      if (this.config.verbose || !this.childProcess.stdout) {
        setTimeout(() => {
          clearTimeout(timeout);
          resolve();
        }, 3000);
      }
    });
  }

  /**
   * Start the production server (Next.js start or static file server)
   */
  private async startProductionServer(): Promise<void> {
    const dashboardPath = this.config.dashboardPath!;
    const buildPath = join(dashboardPath, '.next');

    // Check if production build exists
    if (!existsSync(buildPath)) {
      logger.warn('Production build not found, using fallback server');
      await this.startFallbackServer();
      return;
    }

    // Set environment variables
    const env = {
      ...process.env,
      PORT: String(this.config.port),
      NEXT_PUBLIC_GRAPHQL_ENDPOINT: this.config.graphqlEndpoint,
      NODE_ENV: 'production',
    };

    // Start Next.js production server
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Dashboard startup timed out after ${STARTUP_TIMEOUT}ms`));
      }, STARTUP_TIMEOUT);

      this.childProcess = spawn('npm', ['run', 'start'], {
        cwd: dashboardPath,
        env,
        stdio: this.config.verbose ? 'inherit' : 'pipe',
        shell: true,
      });

      this.childProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      if (this.childProcess.stdout && !this.config.verbose) {
        this.childProcess.stdout.on('data', (data: Buffer) => {
          const output = data.toString();
          if (output.includes('Ready') || output.includes('started')) {
            clearTimeout(timeout);
            resolve();
          }
        });
      }

      // Fallback resolve after delay
      setTimeout(() => {
        clearTimeout(timeout);
        resolve();
      }, 3000);
    });
  }

  /**
   * Start a fallback static server when dashboard is not installed
   */
  private async startFallbackServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
        this.handleFallbackRequest(req, res);
      });

      this.httpServer.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          reject(new Error(`Port ${this.config.port} is already in use`));
        } else {
          reject(error);
        }
      });

      this.httpServer.listen(this.config.port, () => {
        logger.info('Fallback dashboard server started', { port: this.config.port });
        resolve();
      });
    });
  }

  /**
   * Handle requests to the fallback server
   */
  private handleFallbackRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = req.url ?? '/';

    // API endpoints
    if (url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        server: 'dashboard',
        mode: this.config.mode,
        graphqlEndpoint: this.config.graphqlEndpoint,
        graphqlConnected: this.state.graphqlConnected ?? false,
      }));
      return;
    }

    if (url === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.getState()));
      return;
    }

    if (url === '/api/config') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        graphqlEndpoint: this.config.graphqlEndpoint,
        port: this.config.port,
        mode: this.config.mode,
      }));
      return;
    }

    // Serve fallback HTML page
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(this.getFallbackHTML());
  }

  /**
   * Get fallback HTML when dashboard is not fully installed
   */
  private getFallbackHTML(): string {
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
        <div class="value ${mode === 'development' ? 'mode-dev' : 'mode-prod'}">${mode}</div>
      </div>
      <div class="card">
        <h3>Endpoint</h3>
        <div class="value" style="font-size: 0.9rem; word-break: break-all;">${graphqlEndpoint}</div>
      </div>
    </div>

    <div class="actions">
      <a href="${graphqlEndpoint.replace('/graphql', '/graphql')}" target="_blank">GraphQL Playground</a>
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
  </script>
</body>
</html>`;
  }

  /**
   * Stop the dashboard server
   */
  async stop(): Promise<void> {
    if (this.state.status === 'stopped') {
      logger.debug('Dashboard server already stopped');
      return;
    }

    this.state.status = 'stopping';
    this.emit('stopping');

    try {
      // Stop GraphQL monitoring
      this.stopGraphQLMonitoring();

      // Stop child process (Next.js server)
      if (this.childProcess) {
        await this.killChildProcess();
        this.childProcess = null;
      }

      // Stop HTTP server (fallback server)
      if (this.httpServer) {
        await this.closeHttpServer();
        this.httpServer = null;
      }

      this.state.status = 'stopped';
      this.state.port = undefined;
      this.state.startedAt = undefined;
      this.state.graphqlConnected = undefined;

      this.emit('stopped');

      // Resolve shutdown promise
      if (this.shutdownResolve) {
        this.shutdownResolve();
        this.shutdownResolve = null;
        this.shutdownPromise = null;
      }

      logger.info('Dashboard server stopped');
    } catch (error) {
      this.state.status = 'error';
      this.state.error = error instanceof Error ? error.message : String(error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Kill the child process
   */
  private async killChildProcess(): Promise<void> {
    if (!this.childProcess) return;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        // Force kill if graceful shutdown fails
        this.childProcess?.kill('SIGKILL');
        resolve();
      }, SHUTDOWN_TIMEOUT);

      this.childProcess?.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });

      // Send SIGTERM for graceful shutdown
      this.childProcess?.kill('SIGTERM');
    });
  }

  /**
   * Close the HTTP server
   */
  private async closeHttpServer(): Promise<void> {
    if (!this.httpServer) return;

    return new Promise((resolve, reject) => {
      this.httpServer!.close((err) => {
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
  async build(): Promise<void> {
    const dashboardPath = this.config.dashboardPath!;

    if (!this.isDashboardInstalled()) {
      throw new Error('Dashboard not installed. Run npm run dashboard:install first.');
    }

    this.emit('build:started');

    try {
      // Set environment variables
      const env = {
        ...process.env,
        NEXT_PUBLIC_GRAPHQL_ENDPOINT: this.config.graphqlEndpoint,
        NODE_ENV: 'production',
      };

      // Run build command
      await execAsync('npm run build', {
        cwd: dashboardPath,
        env,
      });

      this.emit('build:completed');
      logger.info('Dashboard build completed');
    } catch (error) {
      this.emit('build:failed', error);
      throw error;
    }
  }

  // ============================================================================
  // GraphQL Connection Monitoring
  // ============================================================================

  /**
   * Start GraphQL connection monitoring
   */
  private startGraphQLMonitoring(): void {
    // Initial check
    this.checkGraphQLConnection().then((connected) => {
      this.state.graphqlConnected = connected;
      if (connected) {
        this.emit('graphql:connected');
      } else {
        this.emit('graphql:disconnected');
      }
    });

    // Periodic checks
    this.graphqlCheckInterval = setInterval(async () => {
      const wasConnected = this.state.graphqlConnected;
      const isConnected = await this.checkGraphQLConnection();

      if (wasConnected !== isConnected) {
        this.state.graphqlConnected = isConnected;
        if (isConnected) {
          this.emit('graphql:connected');
          logger.info('GraphQL connection established');
        } else {
          this.emit('graphql:disconnected');
          logger.warn('GraphQL connection lost');
        }
      }
    }, GRAPHQL_CHECK_INTERVAL);
  }

  /**
   * Stop GraphQL connection monitoring
   */
  private stopGraphQLMonitoring(): void {
    if (this.graphqlCheckInterval) {
      clearInterval(this.graphqlCheckInterval);
      this.graphqlCheckInterval = null;
    }
  }

  /**
   * Check if GraphQL connection is available
   */
  async checkGraphQLConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(this.config.graphqlEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ __typename }' }),
        signal: controller.signal,
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
  getState(): DashboardState {
    return { ...this.state };
  }

  /**
   * Wait for the server to shutdown
   */
  async waitForShutdown(): Promise<void> {
    if (this.shutdownPromise) {
      return this.shutdownPromise;
    }

    // If not running, resolve immediately
    if (this.state.status === 'stopped') {
      return Promise.resolve();
    }

    // Create new promise if somehow missing
    return new Promise((resolve) => {
      this.shutdownResolve = resolve;
    });
  }

  /**
   * Emit an event
   */
  private emit(event: DashboardEventType, data?: unknown): void {
    this.eventEmitter.emit(event, data);
  }

  /**
   * Subscribe to events
   */
  on(event: DashboardEventType, listener: (...args: unknown[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Unsubscribe from events
   */
  off(event: DashboardEventType, listener: (...args: unknown[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Subscribe to an event once
   */
  once(event: DashboardEventType, listener: (...args: unknown[]) => void): void {
    this.eventEmitter.once(event, listener);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new dashboard server instance
 */
export function createDashboardServer(config: DashboardConfig): DashboardServer {
  return new DashboardServer(config);
}

/**
 * Create dashboard configuration with defaults
 */
export function createDashboardConfig(
  projectRoot: string,
  overrides?: Partial<DashboardConfig>
): DashboardConfig {
  return {
    projectRoot,
    port: DEFAULT_DASHBOARD_PORT,
    graphqlEndpoint: `http://localhost:${DEFAULT_GRAPHQL_PORT}/graphql`,
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    ...overrides,
  };
}
