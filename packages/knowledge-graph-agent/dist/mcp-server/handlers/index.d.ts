/**
 * MCP Tool Request Handler
 *
 * Handles incoming tool call requests from MCP clients.
 * Validates parameters, executes handlers, and formats responses.
 *
 * @module mcp-server/handlers
 */
import { McpError, type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext, ToolResult } from '../types/index.js';
/**
 * MCP CallToolRequest params structure
 */
interface CallToolParams {
    name: string;
    arguments?: Record<string, unknown>;
}
/**
 * MCP request structure
 */
interface MCPRequest {
    params: CallToolParams;
}
/**
 * Handle tool call requests from MCP clients
 *
 * @param request - MCP call tool request
 * @returns MCP response with tool result
 * @throws McpError if tool not found or execution fails
 */
export declare function handleToolCall(request: MCPRequest): Promise<CallToolResult>;
/**
 * Handle errors and convert to MCP errors
 *
 * @param error - Original error
 * @param context - Tool execution context
 * @returns MCP error
 */
export declare function handleError(error: unknown, context: ToolContext): McpError;
/**
 * Create error response for tool failures
 *
 * @param error - Error message or object
 * @param toolName - Tool that failed
 * @returns Tool result indicating failure
 */
export declare function createErrorResult(error: unknown, toolName: string): ToolResult;
/**
 * Create success response for tool results
 *
 * @param data - Result data
 * @param metadata - Additional metadata
 * @returns Tool result indicating success
 */
export declare function createSuccessResult(data: unknown, metadata?: Record<string, unknown>): ToolResult;
export {};
//# sourceMappingURL=index.d.ts.map