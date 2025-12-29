/**
 * Knowledge Graph MCP Server
 *
 * Main MCP server implementation for exposing knowledge graph functionality
 * to Claude Desktop and other MCP clients.
 *
 * @module mcp-server/server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { createLogger } from '../utils/index.js';
import { getToolDefinitions, initializeTools, getToolCount } from './tools/registry.js';
import { handleToolCall } from './handlers/index.js';
import type { MCPServerConfig, ServerHealth } from './types/index.js';
import type { KnowledgeGraphDatabase } from '../core/database.js';
import type { ShadowCache } from '../core/cache.js';

const logger = createLogger('mcp-server');

/**
 * Generate a unique error reference ID for log correlation
 * @returns A unique error reference ID
 */
function generateErrorRefId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ERR-${timestamp}-${random}`.toUpperCase();
}

/**
 * Default server configuration
 */
const DEFAULT_CONFIG: MCPServerConfig = {
  name: 'knowledge-graph-mcp-server',
  version: '0.3.0',
  capabilities: {
    tools: {},
  },
};

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
export class KnowledgeGraphMCPServer {
  private server: Server;
  private isRunning: boolean = false;
  private startTime: number = 0;
  private requestCount: number = 0;
  private config: MCPServerConfig;

  // Rate limiting - tracks request counts per minute
  private requestCounts: Map<number, number> = new Map();
  private readonly MAX_REQUESTS_PER_MINUTE = 100;

  private database?: KnowledgeGraphDatabase;
  private cache?: ShadowCache;
  private projectRoot?: string;

  /**
   * Create new MCP server instance
   *
   * @param config - Server configuration
   * @param database - Knowledge graph database instance
   * @param cache - Shadow cache instance
   * @param projectRoot - Project root path
   */
  constructor(
    config?: Partial<MCPServerConfig>,
    database?: KnowledgeGraphDatabase,
    cache?: ShadowCache,
    projectRoot?: string
  ) {
    this.database = database;
    this.cache = cache;
    this.projectRoot = projectRoot;

    // Merge with default config
    this.config = {
      name: config?.name || DEFAULT_CONFIG.name,
      version: config?.version || DEFAULT_CONFIG.version,
      capabilities: {
        ...DEFAULT_CONFIG.capabilities,
        ...config?.capabilities,
      },
    };

    // Create MCP server instance
    this.server = new Server(
      {
        name: this.config.name,
        version: this.config.version,
      },
      {
        capabilities: this.config.capabilities,
      }
    );

    // Setup request handlers
    this.setupHandlers();

    logger.info('KnowledgeGraphMCPServer initialized', {
      name: this.config.name,
      version: this.config.version,
    });
  }

  /**
   * Check rate limit and throw if exceeded
   *
   * Implements a fixed-window rate limit of MAX_REQUESTS_PER_MINUTE per minute.
   * Cleans up old entries to prevent memory leaks.
   *
   * @throws McpError if rate limit is exceeded
   */
  private checkRateLimit(): void {
    const now = Math.floor(Date.now() / 60000); // Current minute
    const count = (this.requestCounts.get(now) || 0) + 1;

    // Clean old entries to prevent memory leaks
    for (const key of this.requestCounts.keys()) {
      if (key < now - 1) this.requestCounts.delete(key);
    }

    if (count > this.MAX_REQUESTS_PER_MINUTE) {
      logger.warn('Rate limit exceeded', { requestsThisMinute: count - 1 });
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Rate limit exceeded. Please slow down.'
      );
    }

    this.requestCounts.set(now, count);
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers(): void {
    // Handle ListTools requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        const tools = getToolDefinitions();
        logger.debug(`Listing ${tools.length} tools`);
        return { tools };
      } catch (error) {
        const errorRefId = generateErrorRefId();
        logger.error(
          'Failed to list tools',
          error instanceof Error ? error : new Error(String(error)),
          { errorRefId }
        );
        throw new McpError(
          ErrorCode.InternalError,
          `An internal error occurred [${errorRefId}]`
        );
      }
    });

    // Handle CallTool requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      // Check rate limit before processing
      this.checkRateLimit();

      this.requestCount++;
      const toolName = request.params.name;

      try {
        logger.debug(`Handling tool call: ${toolName}`);
        return await handleToolCall(request);
      } catch (error) {
        // Re-throw MCP errors as they are already sanitized
        if (error instanceof McpError) {
          throw error;
        }

        // Generate error reference for log correlation
        const errorRefId = generateErrorRefId();
        logger.error(
          'Tool execution failed',
          error instanceof Error ? error : new Error(String(error)),
          { errorRefId, toolName }
        );

        // Return sanitized error message with reference ID
        throw new McpError(
          ErrorCode.InternalError,
          `An internal error occurred [${errorRefId}]`
        );
      }
    });

    logger.debug('Request handlers configured');
  }

  /**
   * Start the MCP server
   *
   * @throws Error if server is already running
   */
  async run(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    try {
      // Initialize tools with dependencies
      await initializeTools(this.database, this.cache, this.projectRoot);

      // Create stdio transport
      const transport = new StdioServerTransport();

      // Connect server to transport
      await this.server.connect(transport);

      this.isRunning = true;
      this.startTime = Date.now();

      logger.info('KnowledgeGraphMCPServer running on stdio transport');
      logger.info('Ready to accept tool requests from MCP clients');
    } catch (error) {
      logger.error(
        'Failed to start MCP server',
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  /**
   * Shutdown the MCP server gracefully
   */
  async shutdown(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Server is not running, shutdown skipped');
      return;
    }

    try {
      // Close server connection
      await this.server.close();

      this.isRunning = false;

      const uptime = Date.now() - this.startTime;
      logger.info('KnowledgeGraphMCPServer shutdown complete', {
        uptime: `${(uptime / 1000).toFixed(2)}s`,
        requestsHandled: this.requestCount,
      });
    } catch (error) {
      logger.error(
        'Error during shutdown',
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  /**
   * Get server health status
   *
   * @returns Health status object
   */
  getHealth(): ServerHealth {
    return {
      status: this.isRunning ? 'healthy' : 'unhealthy',
      components: {
        database: !!this.database,
        cache: !!this.cache,
        agents: true, // Agents are always available
      },
      uptime: this.isRunning ? Date.now() - this.startTime : 0,
      requestCount: this.requestCount,
      toolCount: getToolCount(),
    };
  }

  /**
   * Check if server is currently running
   *
   * @returns true if server is running
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get server configuration
   *
   * @returns Server configuration
   */
  getConfig(): MCPServerConfig {
    return { ...this.config };
  }

  /**
   * Get request count
   *
   * @returns Number of requests handled
   */
  getRequestCount(): number {
    return this.requestCount;
  }

  /**
   * Get server uptime in milliseconds
   *
   * @returns Uptime in milliseconds, 0 if not running
   */
  getUptime(): number {
    return this.isRunning ? Date.now() - this.startTime : 0;
  }
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
export async function createMCPServer(
  config?: Partial<MCPServerConfig>,
  database?: KnowledgeGraphDatabase,
  cache?: ShadowCache,
  projectRoot?: string
): Promise<KnowledgeGraphMCPServer> {
  const server = new KnowledgeGraphMCPServer(config, database, cache, projectRoot);
  await server.run();
  return server;
}

/**
 * Run MCP server as standalone process
 *
 * Entry point for running the MCP server from command line.
 *
 * @param options - Server options
 */
export async function runServer(options?: {
  config?: Partial<MCPServerConfig>;
  database?: KnowledgeGraphDatabase;
  cache?: ShadowCache;
  projectRoot?: string;
}): Promise<void> {
  const server = new KnowledgeGraphMCPServer(
    options?.config,
    options?.database,
    options?.cache,
    options?.projectRoot
  );

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down...');
    await server.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down...');
    await server.shutdown();
    process.exit(0);
  });

  // Handle uncaught errors
  process.on('uncaughtException', async (error) => {
    logger.error('Uncaught exception', error);
    await server.shutdown();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason) => {
    logger.error(
      'Unhandled rejection',
      reason instanceof Error ? reason : undefined
    );
    await server.shutdown();
    process.exit(1);
  });

  await server.run();
}
