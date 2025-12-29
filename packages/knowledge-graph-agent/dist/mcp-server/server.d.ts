/**
 * Knowledge Graph MCP Server
 *
 * Main MCP server implementation for exposing knowledge graph functionality
 * to Claude Desktop and other MCP clients.
 *
 * @module mcp-server/server
 */
import type { MCPServerConfig, ServerHealth } from './types/index.js';
import type { KnowledgeGraphDatabase } from '../core/database.js';
import type { ShadowCache } from '../core/cache.js';
/**
 * Knowledge Graph MCP Server
 *
 * Provides MCP protocol implementation for knowledge graph operations.
 * Supports tool listing and execution over stdio transport.
 *
 * @example
 * ```typescript
 * const server = new KnowledgeGraphMCPServer();
 * await server.run();
 * ```
 */
export declare class KnowledgeGraphMCPServer {
    private server;
    private isRunning;
    private startTime;
    private requestCount;
    private config;
    private requestCounts;
    private readonly MAX_REQUESTS_PER_MINUTE;
    private database?;
    private cache?;
    private projectRoot?;
    /**
     * Create new MCP server instance
     *
     * @param config - Server configuration
     * @param database - Knowledge graph database instance
     * @param cache - Shadow cache instance
     * @param projectRoot - Project root path
     */
    constructor(config?: Partial<MCPServerConfig>, database?: KnowledgeGraphDatabase, cache?: ShadowCache, projectRoot?: string);
    /**
     * Check rate limit and throw if exceeded
     *
     * Implements a fixed-window rate limit of MAX_REQUESTS_PER_MINUTE per minute.
     * Cleans up old entries to prevent memory leaks.
     *
     * @throws McpError if rate limit is exceeded
     */
    private checkRateLimit;
    /**
     * Setup MCP request handlers
     */
    private setupHandlers;
    /**
     * Start the MCP server
     *
     * @throws Error if server is already running
     */
    run(): Promise<void>;
    /**
     * Shutdown the MCP server gracefully
     */
    shutdown(): Promise<void>;
    /**
     * Get server health status
     *
     * @returns Health status object
     */
    getHealth(): ServerHealth;
    /**
     * Check if server is currently running
     *
     * @returns true if server is running
     */
    isServerRunning(): boolean;
    /**
     * Get server configuration
     *
     * @returns Server configuration
     */
    getConfig(): MCPServerConfig;
    /**
     * Get request count
     *
     * @returns Number of requests handled
     */
    getRequestCount(): number;
    /**
     * Get server uptime in milliseconds
     *
     * @returns Uptime in milliseconds, 0 if not running
     */
    getUptime(): number;
}
/**
 * Create and start an MCP server
 *
 * Convenience function for creating and running an MCP server in one call.
 *
 * @param config - Server configuration
 * @param database - Knowledge graph database instance
 * @param cache - Shadow cache instance
 * @param projectRoot - Project root path
 * @returns Running MCP server instance
 *
 * @example
 * ```typescript
 * const server = await createMCPServer(
 *   { name: 'my-kg-server' },
 *   database,
 *   cache,
 *   '/my/project'
 * );
 * ```
 */
export declare function createMCPServer(config?: Partial<MCPServerConfig>, database?: KnowledgeGraphDatabase, cache?: ShadowCache, projectRoot?: string): Promise<KnowledgeGraphMCPServer>;
/**
 * Run MCP server as standalone process
 *
 * Entry point for running the MCP server from command line.
 *
 * @param options - Server options
 */
export declare function runServer(options?: {
    config?: Partial<MCPServerConfig>;
    database?: KnowledgeGraphDatabase;
    cache?: ShadowCache;
    projectRoot?: string;
}): Promise<void>;
//# sourceMappingURL=server.d.ts.map