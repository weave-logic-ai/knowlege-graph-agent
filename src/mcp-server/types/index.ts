/**
 * MCP Server Type Definitions
 *
 * Core types for the Knowledge Graph MCP Server including tool definitions,
 * handlers, results, and configuration.
 *
 * @module mcp-server/types
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool category grouping for organizing related tools
 */
export interface ToolCategory {
  /** Category name */
  name: string;
  /** Category description */
  description: string;
  /** Tools in this category */
  tools: Tool[];
}

/**
 * Tool handler function signature
 * Async function that takes parameters and returns a result
 */
export type ToolHandler = (params: Record<string, unknown>) => Promise<ToolResult>;

/**
 * Tool handler registry entry combining definition with handler
 */
export interface ToolHandlerEntry {
  /** MCP tool definition */
  definition: Tool;
  /** Handler function */
  handler: ToolHandler;
}

/**
 * Standard tool result format
 * All tool handlers return this standardized format
 */
export interface ToolResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Result data (varies by tool) */
  data?: unknown;
  /** Error message if success is false */
  error?: string;
  /** Additional metadata about the execution */
  metadata?: {
    /** Execution time in milliseconds */
    executionTime?: number;
    /** Whether result came from cache */
    cacheHit?: boolean;
    /** Number of items processed */
    itemCount?: number;
    /** Additional tool-specific metadata */
    [key: string]: unknown;
  };
}

/**
 * Tool execution context
 * Provides context information for tool execution
 */
export interface ToolContext {
  /** Name of the tool being executed */
  toolName: string;
  /** Parameters passed to the tool */
  params: Record<string, unknown>;
  /** Timestamp when execution started */
  timestamp: number;
  /** Request ID for tracing */
  requestId?: string;
}

/**
 * MCP Server configuration
 */
export interface MCPServerConfig {
  /** Server name */
  name: string;
  /** Server version */
  version: string;
  /** Server capabilities */
  capabilities: {
    /** Tools capability configuration */
    tools: Record<string, unknown>;
    /** Resources capability configuration */
    resources?: Record<string, unknown>;
    /** Prompts capability configuration */
    prompts?: Record<string, unknown>;
  };
}

/**
 * Server health status
 */
export interface ServerHealth {
  /** Overall health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Component health details */
  components: {
    /** Database connection status */
    database: boolean;
    /** Cache status */
    cache: boolean;
    /** Agents availability */
    agents: boolean;
  };
  /** Server uptime in milliseconds */
  uptime: number;
  /** Total requests handled */
  requestCount: number;
  /** Number of registered tools */
  toolCount: number;
}

/**
 * Tool input validation schema
 */
export interface ToolInputSchema {
  /** JSON Schema type */
  type: 'object';
  /** Property definitions */
  properties: Record<string, {
    type: string;
    description?: string;
    default?: unknown;
    enum?: unknown[];
    items?: unknown;
  }>;
  /** Required property names */
  required?: string[];
}

/**
 * Tool definition with handler
 */
export interface ToolDefinition {
  /** Tool name (unique identifier) */
  name: string;
  /** Tool description */
  description: string;
  /** Input schema */
  inputSchema: ToolInputSchema;
  /** Handler function */
  handler: ToolHandler;
  /** Tool category */
  category?: string;
}

/**
 * Graph query parameters
 */
export interface GraphQueryParams {
  /** Search query string */
  query?: string;
  /** Node type filter */
  type?: string;
  /** Node status filter */
  status?: string;
  /** Tag filter */
  tag?: string;
  /** Maximum results */
  limit?: number;
  /** Include node content */
  includeContent?: boolean;
}

/**
 * Graph node result
 */
export interface GraphNodeResult {
  /** Node ID */
  id: string;
  /** Node path */
  path: string;
  /** Node title */
  title: string;
  /** Node type */
  type: string;
  /** Node status */
  status: string;
  /** Node tags */
  tags: string[];
  /** Word count */
  wordCount: number;
  /** Outgoing link count */
  outgoingLinkCount: number;
  /** Incoming link count */
  incomingLinkCount: number;
  /** Node content (optional) */
  content?: string;
}

/**
 * Agent invocation parameters
 */
export interface AgentInvokeParams {
  /** Agent type */
  agent: string;
  /** Task description */
  task: string;
  /** Additional context */
  context?: Record<string, unknown>;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Agent result
 */
export interface AgentResult {
  /** Agent type that executed */
  agent: string;
  /** Task that was executed */
  task: string;
  /** Execution result */
  result: unknown;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Whether agent completed successfully */
  completed: boolean;
}

/**
 * Workflow execution parameters
 */
export interface WorkflowParams {
  /** Workflow name */
  workflow: string;
  /** Workflow input */
  input: Record<string, unknown>;
  /** Execution options */
  options?: {
    /** Run in parallel */
    parallel?: boolean;
    /** Continue on error */
    continueOnError?: boolean;
    /** Timeout in milliseconds */
    timeout?: number;
  };
}

/**
 * Workflow result
 */
export interface WorkflowResult {
  /** Workflow name */
  workflow: string;
  /** Workflow status */
  status: 'completed' | 'failed' | 'partial';
  /** Step results */
  steps: Array<{
    name: string;
    status: 'completed' | 'failed' | 'skipped';
    result?: unknown;
    error?: string;
    duration: number;
  }>;
  /** Total execution time */
  totalDuration: number;
}

/**
 * Memory operation parameters
 */
export interface MemoryParams {
  /** Operation type */
  operation: 'store' | 'retrieve' | 'search' | 'delete';
  /** Memory key */
  key?: string;
  /** Value to store */
  value?: unknown;
  /** Search pattern */
  pattern?: string;
  /** Memory namespace */
  namespace?: string;
  /** TTL in milliseconds */
  ttl?: number;
}

/**
 * Memory operation result
 */
export interface MemoryResult {
  /** Operation that was performed */
  operation: string;
  /** Whether operation succeeded */
  success: boolean;
  /** Retrieved or stored value */
  value?: unknown;
  /** Search results */
  matches?: Array<{ key: string; value: unknown }>;
  /** Number of affected entries */
  affected?: number;
}
