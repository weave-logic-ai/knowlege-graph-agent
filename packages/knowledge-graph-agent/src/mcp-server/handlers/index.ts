/**
 * MCP Tool Request Handler
 *
 * Handles incoming tool call requests from MCP clients.
 * Validates parameters, executes handlers, and formats responses.
 *
 * @module mcp-server/handlers
 */

import {
  ErrorCode,
  McpError,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext, ToolResult } from '../types/index.js';
import { createLogger } from '../../utils/index.js';
import { getToolHandler } from '../tools/registry.js';

const logger = createLogger('mcp-handler');

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
export async function handleToolCall(request: MCPRequest): Promise<CallToolResult> {
  const startTime = Date.now();
  const { name: toolName, arguments: params = {} } = request.params;

  // Log only parameter keys, not values, to avoid exposing sensitive data
  logger.debug('Handling tool call', { toolName, paramKeys: Object.keys(params || {}) });

  const context: ToolContext = {
    toolName,
    params,
    timestamp: startTime,
    requestId: generateRequestId(),
  };

  try {
    // Get handler from registry
    const handler = getToolHandler(toolName);

    if (!handler) {
      logger.warn(`Unknown tool requested: ${toolName}`);
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${toolName}`
      );
    }

    // Validate parameters
    validateParams(params, toolName);

    // Execute handler
    const result = await handler(params);

    const executionTime = Date.now() - startTime;
    logger.debug(`Tool ${toolName} completed in ${executionTime}ms`, {
      success: result.success,
      hasData: !!result.data,
    });

    // Format response
    return formatResponse(result, executionTime);
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error(
      `Tool ${toolName} failed after ${executionTime}ms`,
      error instanceof Error ? error : undefined
    );

    // Re-throw MCP errors as-is
    if (error instanceof McpError) {
      throw error;
    }

    // Wrap other errors
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Security constants for input validation
 *
 * SECURITY: These limits prevent various attack vectors:
 * - MAX_OBJECT_DEPTH: Prevents stack overflow from deeply nested objects
 * - MAX_ARRAY_LENGTH: Prevents memory exhaustion from large arrays
 * - MAX_STRING_LENGTH: Prevents DoS from excessively long strings
 */
const VALIDATION_LIMITS = {
  MAX_OBJECT_DEPTH: 10,
  MAX_ARRAY_LENGTH: 1000,
  MAX_STRING_LENGTH: 100000,
} as const;

/**
 * Validate tool parameters with comprehensive security checks
 *
 * SECURITY: This function performs multi-layered input validation to protect against:
 * 1. Stack overflow attacks via deeply nested objects (max 10 levels)
 * 2. Memory exhaustion via large arrays (max 1000 items)
 * 3. DoS via excessively long strings (max 100000 chars)
 * 4. Path traversal attacks via '..' sequences and null bytes in paths
 *
 * @param params - Parameters to validate
 * @param toolName - Tool name for error messages
 * @throws McpError if parameters are invalid or potentially malicious
 */
function validateParams(params: unknown, toolName: string): void {
  // Null/undefined is valid (empty params)
  if (params === null || params === undefined) {
    return;
  }

  // Must be an object
  if (typeof params !== 'object' || Array.isArray(params)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Invalid parameters for tool ${toolName}: expected object, got ${Array.isArray(params) ? 'array' : typeof params}`
    );
  }

  // SECURITY: Perform recursive validation with depth tracking
  validateValueRecursive(params, toolName, '', 0);
}

/**
 * Recursively validate a value with security checks
 *
 * SECURITY: Validates nested structures to prevent:
 * - Deep nesting attacks (stack overflow)
 * - Large array attacks (memory exhaustion)
 * - Path traversal in string values
 * - Null byte injection
 *
 * @param value - Value to validate
 * @param toolName - Tool name for error context
 * @param path - Current property path for error messages
 * @param depth - Current nesting depth
 * @throws McpError if validation fails
 */
function validateValueRecursive(
  value: unknown,
  toolName: string,
  path: string,
  depth: number
): void {
  // SECURITY: Prevent stack overflow from deeply nested objects
  // Attackers may send deeply nested JSON to exhaust call stack
  if (depth > VALIDATION_LIMITS.MAX_OBJECT_DEPTH) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Parameter nesting too deep at ${path || 'root'} for tool ${toolName}: ` +
        `maximum depth is ${VALIDATION_LIMITS.MAX_OBJECT_DEPTH} levels`
    );
  }

  // Handle null/undefined (valid leaf values)
  if (value === null || value === undefined) {
    return;
  }

  // Validate based on type
  if (typeof value === 'string') {
    validateString(value, toolName, path);
  } else if (Array.isArray(value)) {
    validateArray(value, toolName, path, depth);
  } else if (typeof value === 'object') {
    validateObject(value as Record<string, unknown>, toolName, path, depth);
  }
  // Primitives (number, boolean) are always valid
}

/**
 * Validate string values for security issues
 *
 * SECURITY: Checks for:
 * - Excessive length (DoS prevention)
 * - Path traversal sequences (..)
 * - Null byte injection (\x00)
 *
 * @param value - String value to validate
 * @param toolName - Tool name for error context
 * @param path - Property path for error messages
 * @throws McpError if string contains malicious content
 */
function validateString(value: string, toolName: string, path: string): void {
  const paramName = path || 'value';

  // SECURITY: Check for excessively long strings (potential DoS)
  // Large strings can exhaust memory or cause slow processing
  if (value.length > VALIDATION_LIMITS.MAX_STRING_LENGTH) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Parameter ${paramName} exceeds maximum length (${VALIDATION_LIMITS.MAX_STRING_LENGTH} characters) for tool ${toolName}`
    );
  }

  // SECURITY: Check for path traversal attacks
  // Detects attempts to escape directory boundaries using '..' sequences
  // This prevents unauthorized file system access
  if (isPathLike(path) && containsPathTraversal(value)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Parameter ${paramName} contains invalid path traversal sequence for tool ${toolName}`
    );
  }

  // SECURITY: Check for null byte injection
  // Null bytes can truncate strings in C-based systems, potentially bypassing validation
  // They have no legitimate use in parameter values
  if (value.includes('\x00')) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Parameter ${paramName} contains invalid null byte for tool ${toolName}`
    );
  }
}

/**
 * Validate array values for security issues
 *
 * SECURITY: Prevents memory exhaustion from excessively large arrays
 *
 * @param value - Array to validate
 * @param toolName - Tool name for error context
 * @param path - Property path for error messages
 * @param depth - Current nesting depth
 * @throws McpError if array is too large or contains invalid items
 */
function validateArray(
  value: unknown[],
  toolName: string,
  path: string,
  depth: number
): void {
  const paramName = path || 'array';

  // SECURITY: Check for excessively large arrays (memory exhaustion prevention)
  // Large arrays can consume excessive memory during processing
  if (value.length > VALIDATION_LIMITS.MAX_ARRAY_LENGTH) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Parameter ${paramName} exceeds maximum array length (${VALIDATION_LIMITS.MAX_ARRAY_LENGTH} items) for tool ${toolName}`
    );
  }

  // Recursively validate each array element
  for (let i = 0; i < value.length; i++) {
    validateValueRecursive(value[i], toolName, `${path}[${i}]`, depth + 1);
  }
}

/**
 * Validate object values recursively
 *
 * @param value - Object to validate
 * @param toolName - Tool name for error context
 * @param path - Property path for error messages
 * @param depth - Current nesting depth
 * @throws McpError if object contains invalid values
 */
function validateObject(
  value: Record<string, unknown>,
  toolName: string,
  path: string,
  depth: number
): void {
  for (const [key, propValue] of Object.entries(value)) {
    const propPath = path ? `${path}.${key}` : key;
    validateValueRecursive(propValue, toolName, propPath, depth + 1);
  }
}

/**
 * Check if a parameter path suggests it contains a file/directory path
 *
 * SECURITY: Identifies path-like parameters that should be checked for traversal attacks
 *
 * @param paramPath - The parameter's property path (e.g., "config.filePath")
 * @returns True if the parameter name suggests it's a path
 */
function isPathLike(paramPath: string): boolean {
  const pathIndicators = [
    'path',
    'file',
    'dir',
    'directory',
    'folder',
    'location',
    'source',
    'dest',
    'destination',
    'target',
    'uri',
    'url',
  ];

  const lowerPath = paramPath.toLowerCase();
  return pathIndicators.some(
    (indicator) => lowerPath.includes(indicator) || lowerPath.endsWith(indicator)
  );
}

/**
 * Check if a string contains path traversal sequences
 *
 * SECURITY: Detects various forms of path traversal attacks:
 * - Direct '..' sequences
 * - URL-encoded '..' (%2e%2e)
 * - Mixed encoding
 *
 * @param value - String to check for path traversal
 * @returns True if path traversal detected
 */
function containsPathTraversal(value: string): boolean {
  // SECURITY: Check for literal '..' path traversal
  if (value.includes('..')) {
    return true;
  }

  // SECURITY: Check for URL-encoded path traversal
  // %2e is URL-encoded '.', so %2e%2e or %2e. or .%2e are all '..'
  try {
    const decoded = decodeURIComponent(value.toLowerCase());
    if (decoded.includes('..')) {
      return true;
    }
  } catch {
    // If decoding fails, the string may contain malformed encoding
    // which is suspicious but not necessarily path traversal
  }

  return false;
}

/**
 * Format tool result as MCP response
 *
 * @param result - Tool execution result
 * @param executionTime - Execution time in milliseconds
 * @returns Formatted MCP response
 */
function formatResponse(result: ToolResult, executionTime: number): CallToolResult {
  // Add execution time to metadata
  const enrichedResult: ToolResult = {
    ...result,
    metadata: {
      ...result.metadata,
      executionTime,
    },
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(enrichedResult, null, 2),
      },
    ],
  };
}

/**
 * Generate unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Handle errors and convert to MCP errors
 *
 * @param error - Original error
 * @param context - Tool execution context
 * @returns MCP error
 */
export function handleError(error: unknown, context: ToolContext): McpError {
  logger.error(
    `Tool execution error: ${context.toolName}`,
    error instanceof Error ? error : undefined,
    { requestId: context.requestId }
  );

  // Return as-is if already MCP error
  if (error instanceof McpError) {
    return error;
  }

  // Handle specific error types
  if (error instanceof Error) {
    // Check for known error patterns
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      return new McpError(
        ErrorCode.InvalidParams,
        `${context.toolName} failed: ${error.message}`
      );
    }

    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      return new McpError(
        ErrorCode.InvalidRequest,
        `${context.toolName} failed: ${error.message}`
      );
    }

    if (error.message.includes('timeout')) {
      return new McpError(
        ErrorCode.InternalError,
        `${context.toolName} timed out: ${error.message}`
      );
    }

    // Generic error
    return new McpError(
      ErrorCode.InternalError,
      `${context.toolName} failed: ${error.message}`
    );
  }

  // Unknown error type
  return new McpError(
    ErrorCode.InternalError,
    `${context.toolName} failed: ${String(error)}`
  );
}

/**
 * Create error response for tool failures
 *
 * @param error - Error message or object
 * @param toolName - Tool that failed
 * @returns Tool result indicating failure
 */
export function createErrorResult(error: unknown, toolName: string): ToolResult {
  return {
    success: false,
    error: error instanceof Error ? error.message : String(error),
    metadata: {
      toolName,
      timestamp: Date.now(),
    },
  };
}

/**
 * Create success response for tool results
 *
 * @param data - Result data
 * @param metadata - Additional metadata
 * @returns Tool result indicating success
 */
export function createSuccessResult(
  data: unknown,
  metadata?: Record<string, unknown>
): ToolResult {
  return {
    success: true,
    data,
    metadata: {
      ...metadata,
      timestamp: Date.now(),
    },
  };
}
