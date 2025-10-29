/**
 * MCP Server Type Definitions
 *
 * Type definitions for the Weaver MCP Server implementation.
 * Provides type safety for tool definitions, handlers, and requests.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool category grouping for organization
 */
export interface ToolCategory {
  name: string;
  description: string;
  tools: Tool[];
}

/**
 * Tool handler function signature
 */
export type ToolHandler = (params: any) => Promise<ToolResult>;

/**
 * Tool handler registry entry
 */
export interface ToolHandlerEntry {
  definition: Tool;
  handler: ToolHandler;
}

/**
 * Standard tool result format
 */
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime?: number;
    cacheHit?: boolean;
    [key: string]: any;
  };
}

/**
 * Tool execution context
 */
export interface ToolContext {
  toolName: string;
  params: any;
  timestamp: number;
}

/**
 * MCP Server configuration
 */
export interface MCPServerConfig {
  name: string;
  version: string;
  capabilities: {
    tools: Record<string, any>;
  };
}

/**
 * Server health status
 */
export interface ServerHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    shadowCache: boolean;
    workflowEngine: boolean;
    fileSystem: boolean;
  };
  uptime: number;
  requestCount: number;
}
