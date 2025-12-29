import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { createLogger } from "../../utils/logger.js";
import { getToolHandler } from "../tools/registry.js";
const logger = createLogger("mcp-handler");
async function handleToolCall(request) {
  const startTime = Date.now();
  const { name: toolName, arguments: params = {} } = request.params;
  logger.debug("Handling tool call", { toolName, paramKeys: Object.keys(params || {}) });
  ({
    requestId: generateRequestId()
  });
  try {
    const handler = getToolHandler(toolName);
    if (!handler) {
      logger.warn(`Unknown tool requested: ${toolName}`);
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${toolName}`
      );
    }
    validateParams(params, toolName);
    const result = await handler(params);
    const executionTime = Date.now() - startTime;
    logger.debug(`Tool ${toolName} completed in ${executionTime}ms`, {
      success: result.success,
      hasData: !!result.data
    });
    return formatResponse(result, executionTime);
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error(
      `Tool ${toolName} failed after ${executionTime}ms`,
      error instanceof Error ? error : void 0
    );
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
const VALIDATION_LIMITS = {
  MAX_OBJECT_DEPTH: 10,
  MAX_ARRAY_LENGTH: 1e3,
  MAX_STRING_LENGTH: 1e5
};
function validateParams(params, toolName) {
  if (params === null || params === void 0) {
    return;
  }
  if (typeof params !== "object" || Array.isArray(params)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Invalid parameters for tool ${toolName}: expected object, got ${Array.isArray(params) ? "array" : typeof params}`
    );
  }
  validateValueRecursive(params, toolName, "", 0);
}
function validateValueRecursive(value, toolName, path, depth) {
  if (depth > VALIDATION_LIMITS.MAX_OBJECT_DEPTH) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Parameter nesting too deep at ${path || "root"} for tool ${toolName}: maximum depth is ${VALIDATION_LIMITS.MAX_OBJECT_DEPTH} levels`
    );
  }
  if (value === null || value === void 0) {
    return;
  }
  if (typeof value === "string") {
    validateString(value, toolName, path);
  } else if (Array.isArray(value)) {
    validateArray(value, toolName, path, depth);
  } else if (typeof value === "object") {
    validateObject(value, toolName, path, depth);
  }
}
function validateString(value, toolName, path) {
  const paramName = path || "value";
  if (value.length > VALIDATION_LIMITS.MAX_STRING_LENGTH) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Parameter ${paramName} exceeds maximum length (${VALIDATION_LIMITS.MAX_STRING_LENGTH} characters) for tool ${toolName}`
    );
  }
  if (isPathLike(path) && containsPathTraversal(value)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Parameter ${paramName} contains invalid path traversal sequence for tool ${toolName}`
    );
  }
  if (value.includes("\0")) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Parameter ${paramName} contains invalid null byte for tool ${toolName}`
    );
  }
}
function validateArray(value, toolName, path, depth) {
  const paramName = path || "array";
  if (value.length > VALIDATION_LIMITS.MAX_ARRAY_LENGTH) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Parameter ${paramName} exceeds maximum array length (${VALIDATION_LIMITS.MAX_ARRAY_LENGTH} items) for tool ${toolName}`
    );
  }
  for (let i = 0; i < value.length; i++) {
    validateValueRecursive(value[i], toolName, `${path}[${i}]`, depth + 1);
  }
}
function validateObject(value, toolName, path, depth) {
  for (const [key, propValue] of Object.entries(value)) {
    const propPath = path ? `${path}.${key}` : key;
    validateValueRecursive(propValue, toolName, propPath, depth + 1);
  }
}
function isPathLike(paramPath) {
  const pathIndicators = [
    "path",
    "file",
    "dir",
    "directory",
    "folder",
    "location",
    "source",
    "dest",
    "destination",
    "target",
    "uri",
    "url"
  ];
  const lowerPath = paramPath.toLowerCase();
  return pathIndicators.some(
    (indicator) => lowerPath.includes(indicator) || lowerPath.endsWith(indicator)
  );
}
function containsPathTraversal(value) {
  if (value.includes("..")) {
    return true;
  }
  try {
    const decoded = decodeURIComponent(value.toLowerCase());
    if (decoded.includes("..")) {
      return true;
    }
  } catch {
  }
  return false;
}
function formatResponse(result, executionTime) {
  const enrichedResult = {
    ...result,
    metadata: {
      ...result.metadata,
      executionTime
    }
  };
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(enrichedResult, null, 2)
      }
    ]
  };
}
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
function handleError(error, context) {
  logger.error(
    `Tool execution error: ${context.toolName}`,
    error instanceof Error ? error : void 0,
    { requestId: context.requestId }
  );
  if (error instanceof McpError) {
    return error;
  }
  if (error instanceof Error) {
    if (error.message.includes("not found") || error.message.includes("does not exist")) {
      return new McpError(
        ErrorCode.InvalidParams,
        `${context.toolName} failed: ${error.message}`
      );
    }
    if (error.message.includes("permission") || error.message.includes("unauthorized")) {
      return new McpError(
        ErrorCode.InvalidRequest,
        `${context.toolName} failed: ${error.message}`
      );
    }
    if (error.message.includes("timeout")) {
      return new McpError(
        ErrorCode.InternalError,
        `${context.toolName} timed out: ${error.message}`
      );
    }
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
function createErrorResult(error, toolName) {
  return {
    success: false,
    error: error instanceof Error ? error.message : String(error),
    metadata: {
      toolName,
      timestamp: Date.now()
    }
  };
}
function createSuccessResult(data, metadata) {
  return {
    success: true,
    data,
    metadata: {
      ...metadata,
      timestamp: Date.now()
    }
  };
}
export {
  createErrorResult,
  createSuccessResult,
  handleError,
  handleToolCall
};
//# sourceMappingURL=index.js.map
