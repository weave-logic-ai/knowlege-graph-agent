/**
 * Knowledge Graph MCP Server
 *
 * Model Context Protocol server for knowledge graph operations.
 * Exposes knowledge graph functionality to Claude Desktop and other MCP clients.
 *
 * @module mcp-server
 *
 * @example
 * ```typescript
 * import { createMCPServer, KnowledgeGraphMCPServer } from './mcp-server';
 *
 * // Create and run server
 * const server = await createMCPServer({
 *   name: 'my-kg-server',
 *   version: '1.0.0',
 * });
 *
 * // Check health
 * const health = server.getHealth();
 * console.log('Server status:', health.status);
 * ```
 */

// Main server exports
export {
  KnowledgeGraphMCPServer,
  createMCPServer,
  runServer,
} from './server.js';

// Type exports
export type {
  MCPServerConfig,
  ServerHealth,
  ToolCategory,
  ToolHandler,
  ToolHandlerEntry,
  ToolResult,
  ToolContext,
  ToolInputSchema,
  ToolDefinition,
  GraphQueryParams,
  GraphNodeResult,
  AgentInvokeParams,
  AgentResult,
  WorkflowParams,
  WorkflowResult,
  MemoryParams,
  MemoryResult,
} from './types/index.js';

// Tool registry exports
export {
  initializeTools,
  registerTool,
  getToolHandler,
  getToolDefinition,
  getToolDefinitions,
  getToolCategories,
  hasToolRegistered,
  getToolCount,
  clearRegistry,
  getDatabase,
  getCache,
  getProjectRoot,
} from './tools/index.js';

// Handler exports
export {
  handleToolCall,
  handleError,
  createErrorResult,
  createSuccessResult,
} from './handlers/index.js';
