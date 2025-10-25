/**
 * MCP Tool Request Handler
 *
 * Handles MCP protocol tool call requests including execution and error handling.
 */

import {
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../types/index.js';
import { logger } from '../../utils/logger.js';
import { getToolHandler } from '../tools/registry.js';

/**
 * Handle tool call requests
 *
 * @param request - MCP CallTool request
 * @returns Tool execution result
 */
export async function handleToolCall(request: any): Promise<{ content: any[] }> {
  const startTime = Date.now();
  const { name: toolName, arguments: params } = request.params;

  logger.debug('Handling tool call', { toolName, params });

  try {
    // Get tool handler from registry
    const handler = getToolHandler(toolName);

    if (!handler) {
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${toolName}`
      );
    }

    // Validate parameters
    validateParams(params, toolName);

    // Execute tool handler
    const result = await handler(params);

    const executionTime = Date.now() - startTime;
    logger.debug(`Tool ${toolName} completed in ${executionTime}ms`);

    // Return result in MCP format
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error(`Tool ${toolName} failed after ${executionTime}ms:`, error as Error);

    // Convert error to MCP error
    if (error instanceof McpError) {
      throw error;
    }

    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Validate tool parameters
 *
 * @param params - Tool parameters
 * @param toolName - Tool name for context
 */
function validateParams(params: any, toolName: string): void {
  if (params === null || params === undefined) {
    return; // No params is valid for some tools
  }

  if (typeof params !== 'object') {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Invalid parameters for tool ${toolName}: expected object, got ${typeof params}`
    );
  }
}

/**
 * Handle errors and convert to MCP format
 *
 * @param error - Error to handle
 * @param context - Tool context
 * @returns MCP error
 */
export function handleError(error: unknown, context: ToolContext): McpError {
  logger.error('Tool execution error', error as Error);

  if (error instanceof McpError) {
    return error;
  }

  if (error instanceof Error) {
    return new McpError(
      ErrorCode.InternalError,
      `${context.toolName} failed: ${error.message}`
    );
  }

  return new McpError(
    ErrorCode.InternalError,
    `${context.toolName} failed: ${String(error)}`
  );
}
