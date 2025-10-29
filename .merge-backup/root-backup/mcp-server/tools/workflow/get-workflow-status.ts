/**
 * Get Workflow Status Tool
 *
 * MCP tool for querying the status of a specific workflow execution.
 * Provides real-time status, progress tracking, and execution metadata.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import type { WorkflowEngine } from '../../../workflow-engine/index.js';
import { logger } from '../../../utils/logger.js';

/**
 * Tool definition for get_workflow_status
 */
export const getWorkflowStatusTool: Tool = {
  name: 'get_workflow_status',
  description: 'Get the execution status of a specific workflow by execution ID. Returns current status, progress, timing information, and error details if the execution failed.',
  inputSchema: {
    type: 'object',
    properties: {
      executionId: {
        type: 'string',
        description: 'The unique execution ID to query (UUID format)',
      },
    },
    required: ['executionId'],
  },
};

/**
 * Parameters for get_workflow_status tool
 */
interface GetWorkflowStatusParams {
  executionId: string;
}

/**
 * Result data for workflow status query
 */
interface WorkflowStatusData {
  executionId: string;
  workflowId: string;
  workflowName: string;
  trigger: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // Percentage 0-100
  startedAt: string; // ISO 8601 timestamp
  completedAt?: string; // ISO 8601 timestamp
  duration?: number; // Milliseconds
  error?: string; // Error message if failed
  fileEvent?: {
    type: string;
    path: string;
  };
}

/**
 * Create handler for get_workflow_status tool
 *
 * @param workflowEngine - Workflow engine instance
 * @returns Tool handler function
 */
export function createGetWorkflowStatusHandler(
  workflowEngine: WorkflowEngine
): ToolHandler {
  return async (params: GetWorkflowStatusParams): Promise<ToolResult> => {
    const startTime = Date.now();

    try {
      logger.debug('Getting workflow status', { executionId: params.executionId });

      // Validate parameters
      if (!params.executionId || typeof params.executionId !== 'string') {
        return {
          success: false,
          error: 'Invalid executionId: must be a non-empty string',
        };
      }

      // Query execution from registry
      const registry = workflowEngine.getRegistry();
      const execution = registry.getExecution(params.executionId);

      if (!execution) {
        return {
          success: false,
          error: `Execution not found: ${params.executionId}`,
        };
      }

      // Calculate progress percentage based on status
      let progress = 0;
      switch (execution.status) {
        case 'pending':
          progress = 0;
          break;
        case 'running':
          progress = 50; // Assume 50% for running workflows
          break;
        case 'completed':
          progress = 100;
          break;
        case 'failed':
          // Calculate progress based on duration if available
          progress = execution.duration ? Math.min(95, Math.floor(execution.duration / 1000)) : 0;
          break;
      }

      // Build result data
      const statusData: WorkflowStatusData = {
        executionId: execution.id,
        workflowId: execution.workflowId,
        workflowName: execution.workflowName,
        trigger: execution.trigger,
        status: execution.status,
        progress,
        startedAt: execution.startedAt.toISOString(),
        completedAt: execution.completedAt?.toISOString(),
        duration: execution.duration,
        error: execution.error,
      };

      // Include file event details if available
      if (execution.fileEvent) {
        statusData.fileEvent = {
          type: execution.fileEvent.type,
          path: execution.fileEvent.relativePath,
        };
      }

      const executionTime = Date.now() - startTime;

      logger.info('Workflow status retrieved', {
        executionId: params.executionId,
        status: execution.status,
        executionTime: `${executionTime}ms`,
      });

      return {
        success: true,
        data: statusData,
        metadata: {
          executionTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get workflow status', err, { executionId: params.executionId });

      return {
        success: false,
        error: `Failed to get workflow status: ${err.message}`,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  };
}
