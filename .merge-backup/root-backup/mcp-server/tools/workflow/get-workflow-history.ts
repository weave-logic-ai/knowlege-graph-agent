/**
 * Get Workflow History Tool
 *
 * MCP tool for querying historical workflow execution records.
 * Supports filtering by workflow ID, time range, and pagination.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import type { WorkflowEngine } from '../../../workflow-engine/index.js';
import type { WorkflowExecution } from '../../../workflow-engine/types.js';
import { logger } from '../../../utils/logger.js';

/**
 * Tool definition for get_workflow_history
 */
export const getWorkflowHistoryTool: Tool = {
  name: 'get_workflow_history',
  description: 'Get historical execution records for workflows. Supports filtering by workflow ID, time range, and pagination. Returns a list of past executions with status, timing, and metadata.',
  inputSchema: {
    type: 'object',
    properties: {
      workflowId: {
        type: 'string',
        description: 'Optional workflow ID to filter executions (if not provided, returns all workflows)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10, max: 100)',
        minimum: 1,
        maximum: 100,
      },
      since: {
        type: 'string',
        description: 'Optional ISO 8601 timestamp to filter executions after this time',
      },
    },
    required: [],
  },
};

/**
 * Parameters for get_workflow_history tool
 */
interface GetWorkflowHistoryParams {
  workflowId?: string;
  limit?: number;
  since?: string;
}

/**
 * Execution record in history response
 */
interface HistoryExecutionRecord {
  executionId: string;
  workflowId: string;
  workflowName: string;
  trigger: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  fileEvent?: {
    type: string;
    path: string;
  };
}

/**
 * Result data for workflow history query
 */
interface WorkflowHistoryData {
  executions: HistoryExecutionRecord[];
  totalCount: number;
  filteredCount: number;
  filters: {
    workflowId?: string;
    since?: string;
    limit: number;
  };
}

/**
 * Create handler for get_workflow_history tool
 *
 * @param workflowEngine - Workflow engine instance
 * @returns Tool handler function
 */
export function createGetWorkflowHistoryHandler(
  workflowEngine: WorkflowEngine
): ToolHandler {
  return async (params: GetWorkflowHistoryParams): Promise<ToolResult> => {
    const startTime = Date.now();

    try {
      logger.debug('Getting workflow history', params as Record<string, unknown>);

      // Validate and normalize parameters
      const limit = Math.min(Math.max(params.limit ?? 10, 1), 100);
      let sinceDate: Date | undefined;

      if (params.since) {
        try {
          sinceDate = new Date(params.since);
          if (isNaN(sinceDate.getTime())) {
            return {
              success: false,
              error: `Invalid since timestamp: ${params.since}`,
            };
          }
        } catch {
          return {
            success: false,
            error: `Invalid since timestamp: ${params.since}`,
          };
        }
      }

      // Query executions from registry
      const registry = workflowEngine.getRegistry();
      let executions: WorkflowExecution[];

      if (params.workflowId) {
        // Filter by workflow ID
        executions = registry.getExecutionsByWorkflow(params.workflowId, 100);
      } else {
        // Get all recent executions
        executions = registry.getRecentExecutions(100);
      }

      // Store total count before filtering
      const totalCount = executions.length;

      // Apply time range filter if provided
      if (sinceDate) {
        executions = executions.filter(
          (exec) => exec.startedAt.getTime() >= sinceDate!.getTime()
        );
      }

      const filteredCount = executions.length;

      // Apply limit
      executions = executions.slice(0, limit);

      // Transform to history records
      const historyRecords: HistoryExecutionRecord[] = executions.map((exec) => {
        const record: HistoryExecutionRecord = {
          executionId: exec.id,
          workflowId: exec.workflowId,
          workflowName: exec.workflowName,
          trigger: exec.trigger,
          status: exec.status,
          startedAt: exec.startedAt.toISOString(),
          completedAt: exec.completedAt?.toISOString(),
          duration: exec.duration,
          error: exec.error,
        };

        // Include file event details if available
        if (exec.fileEvent) {
          record.fileEvent = {
            type: exec.fileEvent.type,
            path: exec.fileEvent.relativePath,
          };
        }

        return record;
      });

      // Build result data
      const historyData: WorkflowHistoryData = {
        executions: historyRecords,
        totalCount,
        filteredCount,
        filters: {
          workflowId: params.workflowId,
          since: params.since,
          limit,
        },
      };

      const executionTime = Date.now() - startTime;

      logger.info('Workflow history retrieved', {
        workflowId: params.workflowId ?? 'all',
        resultCount: historyRecords.length,
        filteredCount,
        totalCount,
        executionTime: `${executionTime}ms`,
      });

      return {
        success: true,
        data: historyData,
        metadata: {
          executionTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const errorContext = { ...params } as Record<string, unknown>;
      logger.error('Failed to get workflow history', err, errorContext);

      return {
        success: false,
        error: `Failed to get workflow history: ${err.message}`,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  };
}
