/**
 * Server Manager
 *
 * Orchestrates multiple server instances (MCP, GraphQL, Dashboard) in a single
 * Node.js process. Handles lifecycle management, health monitoring, and
 * graceful shutdown coordination.
 *
 * @module server/manager
 */
import type { ServerConfig, IServerManager, ServerManagerState, HealthStatus, ServerEventType, ServerEventListener } from './types.js';
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
export declare class ServerManager implements IServerManager {
    private config;
    private services;
    private eventEmitter;
    private mcpServer;
    private graphqlServer;
    private dashboardServer;
    private state;
    private shutdownInProgress;
    private initPromise;
    constructor(config: ServerConfig);
    private createInitialServerState;
    /**
     * Initialize shared services
     */
    initialize(): Promise<void>;
    private _doInitialize;
    /**
     * Start the MCP server (stdio transport)
     */
    startMCP(): Promise<void>;
    /**
     * Stop the MCP server
     */
    stopMCP(): Promise<void>;
    /**
     * Start the GraphQL server
     */
    startGraphQL(port?: number): Promise<void>;
    /**
     * Create the GraphQL HTTP server
     * Note: This is a placeholder - actual GraphQL schema would be implemented separately
     */
    private createGraphQLServer;
    /**
     * Stop the GraphQL server
     */
    stopGraphQL(): Promise<void>;
    /**
     * Start the Dashboard server
     */
    startDashboard(port?: number): Promise<void>;
    /**
     * Create the Dashboard HTTP server
     * Note: This is a placeholder - actual dashboard would be implemented separately
     */
    private createDashboardServer;
    /**
     * Stop the Dashboard server
     */
    stopDashboard(): Promise<void>;
    /**
     * Start all enabled servers
     */
    startAll(): Promise<void>;
    /**
     * Stop a specific server
     */
    stop(server: 'mcp' | 'graphql' | 'dashboard'): Promise<void>;
    /**
     * Graceful shutdown of all servers and services
     */
    gracefulShutdown(): Promise<void>;
    private _performShutdown;
    /**
     * Get current server manager state
     */
    getState(): ServerManagerState;
    /**
     * Get comprehensive health status
     */
    getHealth(): HealthStatus;
    /**
     * Subscribe to server events
     */
    on(event: ServerEventType, listener: ServerEventListener): void;
    /**
     * Unsubscribe from server events
     */
    off(event: ServerEventType, listener: ServerEventListener): void;
    /**
     * Subscribe to an event once
     */
    once(event: ServerEventType, listener: ServerEventListener): void;
    private emitEvent;
    private updateServerState;
    private updateOverallState;
    private closeHTTPServer;
}
/**
 * Create and optionally initialize a server manager
 */
export declare function createServerManager(config: ServerConfig, autoInitialize?: boolean): Promise<ServerManager>;
//# sourceMappingURL=manager.d.ts.map