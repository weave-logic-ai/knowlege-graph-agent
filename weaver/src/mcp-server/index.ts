/**
 * Weaver MCP Server
 *
 * Main MCP server implementation for exposing Weaver functionality
 * to Claude Desktop and other MCP clients.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';
import { getToolDefinitions, initializeTools } from './tools/registry.js';
import { handleToolCall } from './handlers/index.js';
import type { MCPServerConfig, ServerHealth } from './types/index.js';

/**
 * Weaver MCP Server
 *
 * Implements the Model Context Protocol server for Weaver.
 * Exposes shadow cache queries and workflow operations as MCP tools.
 */
export class WeaverMCPServer {
  private server: Server;
  private isRunning: boolean = false;
  private startTime: number = 0;
  private requestCount: number = 0;
  private shadowCache?: any;
  private vaultPath?: string;
  private workflowEngine?: any;

  /**
   * Create a new Weaver MCP Server
   *
   * @param config - Server configuration (optional)
   * @param shadowCache - Shadow cache instance (optional)
   * @param vaultPath - Vault root path (optional)
   * @param workflowEngine - Workflow engine instance (optional)
   */
  constructor(config?: Partial<MCPServerConfig>, shadowCache?: any, vaultPath?: string, workflowEngine?: any) {
    this.shadowCache = shadowCache;
    this.vaultPath = vaultPath;
    this.workflowEngine = workflowEngine;
    const serverConfig: MCPServerConfig = {
      name: config?.name || 'weaver-mcp-server',
      version: config?.version || '0.1.0',
      capabilities: {
        tools: {},
        ...config?.capabilities,
      },
    };

    this.server = new Server(
      {
        name: serverConfig.name,
        version: serverConfig.version,
      },
      {
        capabilities: serverConfig.capabilities,
      }
    );

    this.setupHandlers();
    logger.info('WeaverMCPServer initialized', { name: serverConfig.name, version: serverConfig.version });
  }

  /**
   * Set up MCP request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        const tools = getToolDefinitions();
        logger.debug(`Listing ${tools.length} tools`);
        return { tools };
      } catch (error) {
        logger.error('Error listing tools:', error as Error);
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to list tools: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      this.requestCount++;

      try {
        logger.debug(`Handling tool call: ${request.params.name}`);
        return await handleToolCall(request);
      } catch (error) {
        logger.error(`Error handling tool call ${request.params.name}:`, error as Error);

        // Re-throw MCP errors as-is
        if (error instanceof McpError) {
          throw error;
        }

        // Convert other errors to MCP errors
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

    logger.debug('Request handlers configured');
  }

  /**
   * Start the MCP server
   *
   * Initializes tools and starts the stdio transport.
   */
  async run(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    try {
      // Initialize all tools with shadow cache, vault path, and workflow engine
      await initializeTools(this.shadowCache, this.vaultPath, this.workflowEngine);

      // Create and connect stdio transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      this.isRunning = true;
      this.startTime = Date.now();

      logger.info('WeaverMCPServer running on stdio transport');
      logger.info('Ready to accept tool requests from MCP clients');
    } catch (error) {
      logger.error('Failed to start MCP server:', error as Error);
      throw error;
    }
  }

  /**
   * Shutdown the MCP server
   *
   * Performs graceful shutdown and cleanup.
   */
  async shutdown(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Server is not running, shutdown skipped');
      return;
    }

    try {
      await this.server.close();
      this.isRunning = false;

      const uptime = Date.now() - this.startTime;
      logger.info('WeaverMCPServer shutdown complete', {
        uptime: `${(uptime / 1000).toFixed(2)}s`,
        requestsHandled: this.requestCount,
      });
    } catch (error) {
      logger.error('Error during shutdown:', error as Error);
      throw error;
    }
  }

  /**
   * Get server health status
   *
   * @returns Server health information
   */
  getHealth(): ServerHealth {
    return {
      status: this.isRunning ? 'healthy' : 'unhealthy',
      components: {
        shadowCache: true, // TODO: Check actual shadow cache status
        workflowEngine: true, // TODO: Check actual workflow engine status
        fileSystem: true, // TODO: Check actual file system access
      },
      uptime: this.isRunning ? Date.now() - this.startTime : 0,
      requestCount: this.requestCount,
    };
  }

  /**
   * Check if server is running
   *
   * @returns True if server is running
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }
}

/**
 * Create and start a new Weaver MCP Server
 *
 * @param config - Server configuration (optional)
 * @param shadowCache - Shadow cache instance (optional)
 * @param vaultPath - Vault root path (optional)
 * @param workflowEngine - Workflow engine instance (optional)
 * @returns Server instance
 */
export async function createServer(
  config?: Partial<MCPServerConfig>,
  shadowCache?: any,
  vaultPath?: string,
  workflowEngine?: any
): Promise<WeaverMCPServer> {
  const server = new WeaverMCPServer(config, shadowCache, vaultPath, workflowEngine);
  await server.run();
  return server;
}
