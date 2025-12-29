/**
 * Dashboard Server
 *
 * Server integration for the Knowledge Graph Dashboard.
 * Supports running Next.js in development and production modes,
 * with programmatic control and concurrent server support.
 *
 * @module dashboard/server
 */
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
export type DashboardEventType = 'starting' | 'started' | 'stopping' | 'stopped' | 'error' | 'build:started' | 'build:completed' | 'build:failed' | 'graphql:connected' | 'graphql:disconnected';
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
export declare class DashboardServer implements IDashboardServer {
    private config;
    private state;
    private eventEmitter;
    private childProcess;
    private httpServer;
    private graphqlCheckInterval;
    private shutdownPromise;
    private shutdownResolve;
    constructor(config: DashboardConfig);
    /**
     * Detect the dashboard path
     */
    private detectDashboardPath;
    /**
     * Check if dashboard is installed
     */
    private isDashboardInstalled;
    /**
     * Start the dashboard server
     */
    start(): Promise<void>;
    /**
     * Start the development server (Next.js dev)
     */
    private startDevelopmentServer;
    /**
     * Start the production server (Next.js start or static file server)
     */
    private startProductionServer;
    /**
     * Start a fallback static server when dashboard is not installed
     */
    private startFallbackServer;
    /**
     * Handle requests to the fallback server
     */
    private handleFallbackRequest;
    /**
     * Get fallback HTML when dashboard is not fully installed
     */
    private getFallbackHTML;
    /**
     * Stop the dashboard server
     */
    stop(): Promise<void>;
    /**
     * Kill the child process
     */
    private killChildProcess;
    /**
     * Close the HTTP server
     */
    private closeHttpServer;
    /**
     * Build the dashboard for production
     */
    build(): Promise<void>;
    /**
     * Start GraphQL connection monitoring
     */
    private startGraphQLMonitoring;
    /**
     * Stop GraphQL connection monitoring
     */
    private stopGraphQLMonitoring;
    /**
     * Check if GraphQL connection is available
     */
    checkGraphQLConnection(): Promise<boolean>;
    /**
     * Get current server state
     */
    getState(): DashboardState;
    /**
     * Wait for the server to shutdown
     */
    waitForShutdown(): Promise<void>;
    /**
     * Emit an event
     */
    private emit;
    /**
     * Subscribe to events
     */
    on(event: DashboardEventType, listener: (...args: unknown[]) => void): void;
    /**
     * Unsubscribe from events
     */
    off(event: DashboardEventType, listener: (...args: unknown[]) => void): void;
    /**
     * Subscribe to an event once
     */
    once(event: DashboardEventType, listener: (...args: unknown[]) => void): void;
}
/**
 * Create a new dashboard server instance
 */
export declare function createDashboardServer(config: DashboardConfig): DashboardServer;
/**
 * Create dashboard configuration with defaults
 */
export declare function createDashboardConfig(projectRoot: string, overrides?: Partial<DashboardConfig>): DashboardConfig;
//# sourceMappingURL=server.d.ts.map