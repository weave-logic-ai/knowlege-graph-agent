import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpError, ErrorCode, ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createLogger } from "../utils/logger.js";
import { getToolDefinitions, initializeTools, getToolCount } from "./tools/registry.js";
import { handleToolCall } from "./handlers/index.js";
const logger = createLogger("mcp-server");
function generateErrorRefId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ERR-${timestamp}-${random}`.toUpperCase();
}
const DEFAULT_CONFIG = {
  name: "knowledge-graph-mcp-server",
  version: "0.3.0",
  capabilities: {
    tools: {}
  }
};
class KnowledgeGraphMCPServer {
  server;
  isRunning = false;
  startTime = 0;
  requestCount = 0;
  config;
  // Rate limiting - tracks request counts per minute
  requestCounts = /* @__PURE__ */ new Map();
  MAX_REQUESTS_PER_MINUTE = 100;
  database;
  cache;
  projectRoot;
  /**
   * Create new MCP server instance
   *
   * @param config - Server configuration
   * @param database - Knowledge graph database instance
   * @param cache - Shadow cache instance
   * @param projectRoot - Project root path
   */
  constructor(config, database, cache, projectRoot) {
    this.database = database;
    this.cache = cache;
    this.projectRoot = projectRoot;
    this.config = {
      name: config?.name || DEFAULT_CONFIG.name,
      version: config?.version || DEFAULT_CONFIG.version,
      capabilities: {
        ...DEFAULT_CONFIG.capabilities,
        ...config?.capabilities
      }
    };
    this.server = new Server(
      {
        name: this.config.name,
        version: this.config.version
      },
      {
        capabilities: this.config.capabilities
      }
    );
    this.setupHandlers();
    logger.info("KnowledgeGraphMCPServer initialized", {
      name: this.config.name,
      version: this.config.version
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
  checkRateLimit() {
    const now = Math.floor(Date.now() / 6e4);
    const count = (this.requestCounts.get(now) || 0) + 1;
    for (const key of this.requestCounts.keys()) {
      if (key < now - 1) this.requestCounts.delete(key);
    }
    if (count > this.MAX_REQUESTS_PER_MINUTE) {
      logger.warn("Rate limit exceeded", { requestsThisMinute: count - 1 });
      throw new McpError(
        ErrorCode.InvalidRequest,
        "Rate limit exceeded. Please slow down."
      );
    }
    this.requestCounts.set(now, count);
  }
  /**
   * Setup MCP request handlers
   */
  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        const tools = getToolDefinitions();
        logger.debug(`Listing ${tools.length} tools`);
        return { tools };
      } catch (error) {
        const errorRefId = generateErrorRefId();
        logger.error(
          "Failed to list tools",
          error instanceof Error ? error : new Error(String(error)),
          { errorRefId }
        );
        throw new McpError(
          ErrorCode.InternalError,
          `An internal error occurred [${errorRefId}]`
        );
      }
    });
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      this.checkRateLimit();
      this.requestCount++;
      const toolName = request.params.name;
      try {
        logger.debug(`Handling tool call: ${toolName}`);
        return await handleToolCall(request);
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        const errorRefId = generateErrorRefId();
        logger.error(
          "Tool execution failed",
          error instanceof Error ? error : new Error(String(error)),
          { errorRefId, toolName }
        );
        throw new McpError(
          ErrorCode.InternalError,
          `An internal error occurred [${errorRefId}]`
        );
      }
    });
    logger.debug("Request handlers configured");
  }
  /**
   * Start the MCP server
   *
   * @throws Error if server is already running
   */
  async run() {
    if (this.isRunning) {
      throw new Error("Server is already running");
    }
    try {
      await initializeTools(this.database, this.cache, this.projectRoot);
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      this.isRunning = true;
      this.startTime = Date.now();
      logger.info("KnowledgeGraphMCPServer running on stdio transport");
      logger.info("Ready to accept tool requests from MCP clients");
    } catch (error) {
      logger.error(
        "Failed to start MCP server",
        error instanceof Error ? error : void 0
      );
      throw error;
    }
  }
  /**
   * Shutdown the MCP server gracefully
   */
  async shutdown() {
    if (!this.isRunning) {
      logger.warn("Server is not running, shutdown skipped");
      return;
    }
    try {
      await this.server.close();
      this.isRunning = false;
      const uptime = Date.now() - this.startTime;
      logger.info("KnowledgeGraphMCPServer shutdown complete", {
        uptime: `${(uptime / 1e3).toFixed(2)}s`,
        requestsHandled: this.requestCount
      });
    } catch (error) {
      logger.error(
        "Error during shutdown",
        error instanceof Error ? error : void 0
      );
      throw error;
    }
  }
  /**
   * Get server health status
   *
   * @returns Health status object
   */
  getHealth() {
    return {
      status: this.isRunning ? "healthy" : "unhealthy",
      components: {
        database: !!this.database,
        cache: !!this.cache,
        agents: true
        // Agents are always available
      },
      uptime: this.isRunning ? Date.now() - this.startTime : 0,
      requestCount: this.requestCount,
      toolCount: getToolCount()
    };
  }
  /**
   * Check if server is currently running
   *
   * @returns true if server is running
   */
  isServerRunning() {
    return this.isRunning;
  }
  /**
   * Get server configuration
   *
   * @returns Server configuration
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Get request count
   *
   * @returns Number of requests handled
   */
  getRequestCount() {
    return this.requestCount;
  }
  /**
   * Get server uptime in milliseconds
   *
   * @returns Uptime in milliseconds, 0 if not running
   */
  getUptime() {
    return this.isRunning ? Date.now() - this.startTime : 0;
  }
}
async function createMCPServer(config, database, cache, projectRoot) {
  const server = new KnowledgeGraphMCPServer(config, database, cache, projectRoot);
  await server.run();
  return server;
}
async function runServer(options) {
  const server = new KnowledgeGraphMCPServer(
    options?.config,
    options?.database,
    options?.cache,
    options?.projectRoot
  );
  process.on("SIGINT", async () => {
    logger.info("Received SIGINT, shutting down...");
    await server.shutdown();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    logger.info("Received SIGTERM, shutting down...");
    await server.shutdown();
    process.exit(0);
  });
  process.on("uncaughtException", async (error) => {
    logger.error("Uncaught exception", error);
    await server.shutdown();
    process.exit(1);
  });
  process.on("unhandledRejection", async (reason) => {
    logger.error(
      "Unhandled rejection",
      reason instanceof Error ? reason : void 0
    );
    await server.shutdown();
    process.exit(1);
  });
  await server.run();
}
export {
  KnowledgeGraphMCPServer,
  createMCPServer,
  runServer
};
//# sourceMappingURL=server.js.map
