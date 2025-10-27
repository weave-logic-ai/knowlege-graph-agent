/**
 * MCP Server Activity Logging Middleware
 *
 * Automatically logs all MCP tool calls for 100% transparency
 */

import { getActivityLogger } from '../../vault-logger/activity-logger';
import { logger } from '../../utils/logger';

export interface ToolExecutionContext {
  tool: string;
  params: Record<string, unknown>;
  startTime: number;
}

/**
 * Middleware to log MCP tool calls before execution
 */
export async function logToolCallStart(
  tool: string,
  params: Record<string, unknown>
): Promise<ToolExecutionContext> {
  const startTime = Date.now();

  try {
    const activityLogger = getActivityLogger();
    activityLogger.setTask(`MCP Tool: ${tool}`);

    await activityLogger.logPrompt(`Executing MCP tool: ${tool}`, {
      tool,
      params,
      timestamp: new Date().toISOString(),
    });

    logger.debug('MCP tool call started', { tool, params });

    return { tool, params, startTime };
  } catch (error) {
    logger.warn('Failed to log tool call start', { error, tool });
    return { tool, params, startTime };
  }
}

/**
 * Middleware to log MCP tool call results
 */
export async function logToolCallEnd(
  context: ToolExecutionContext,
  result?: unknown,
  error?: Error
): Promise<void> {
  const duration = Date.now() - context.startTime;

  try {
    const activityLogger = getActivityLogger();

    await activityLogger.logToolCall(
      `mcp.${context.tool}`,
      context.params,
      result,
      duration,
      error ? error.message : undefined
    );

    if (error) {
      await activityLogger.logError(error, {
        tool: context.tool,
        params: context.params,
        duration_ms: duration,
      });
    } else {
      await activityLogger.logResults({
        tool: context.tool,
        success: true,
        duration_ms: duration,
      });
    }

    logger.debug('MCP tool call completed', {
      tool: context.tool,
      duration_ms: duration,
      success: !error,
    });
  } catch (logError) {
    logger.warn('Failed to log tool call end', {
      error: logError,
      tool: context.tool,
    });
  }
}

/**
 * Wrap a tool handler with activity logging
 */
export function withActivityLogging<T extends (...args: any[]) => Promise<any>>(
  toolName: string,
  handler: T
): T {
  return (async (...args: any[]) => {
    const params = args[0] || {};
    const context = await logToolCallStart(toolName, params);

    try {
      const result = await handler(...args);
      await logToolCallEnd(context, result);
      return result;
    } catch (error) {
      await logToolCallEnd(context, undefined, error as Error);
      throw error;
    }
  }) as T;
}

/**
 * Log server lifecycle events
 */
export async function logServerEvent(
  event: 'start' | 'stop' | 'error',
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const activityLogger = getActivityLogger();
    activityLogger.setTask(`MCP Server: ${event}`);

    if (event === 'error' && metadata?.['error']) {
      await activityLogger.logError(metadata['error'] as Error, metadata);
    } else {
      await activityLogger.logPrompt(`MCP Server ${event}`, metadata);
    }
  } catch (error) {
    logger.warn('Failed to log server event', { error, event });
  }
}

/**
 * Log request/response for debugging
 */
export async function logMCPRequest(
  method: string,
  params: unknown
): Promise<void> {
  try {
    const activityLogger = getActivityLogger();

    await activityLogger.logPrompt(`MCP Request: ${method}`, {
      method,
      params,
      protocol: 'MCP',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.warn('Failed to log MCP request', { error, method });
  }
}

export async function logMCPResponse(
  method: string,
  response: unknown
): Promise<void> {
  try {
    const activityLogger = getActivityLogger();

    await activityLogger.logResults({
      method,
      response,
      protocol: 'MCP',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.warn('Failed to log MCP response', { error, method });
  }
}
