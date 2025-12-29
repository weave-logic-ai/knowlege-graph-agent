/**
 * MCP Clients Module
 *
 * Provides MCP client adapters for integrating with claude-flow
 * and other MCP-compatible tools.
 *
 * @module mcp/clients
 */

// MCP Client Adapter
export {
  McpClientAdapter,
  createMcpClientAdapter,
  type McpClientConfig,
  type MemoryOperationResult,
} from './mcp-client-adapter.js';

// Claude-Flow Memory Client
export {
  ClaudeFlowMemoryClient,
  createClaudeFlowMemoryClient,
  type ClaudeFlowMemoryClientConfig,
  type MemoryNodeEntry,
  type MemoryIndexEntry,
  type MemoryMetadata,
  type MemoryGraphStats,
  type BatchOperationResult,
} from './claude-flow-memory-client.js';
