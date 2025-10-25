/**
 * Trigger Workflow Tool
 *
 * MCP tool for manually triggering registered workflows with optional input data.
 * Supports both synchronous and asynchronous execution modes.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import type { WorkflowEngine } from '../../../workflow-engine/index.js';
import { logger } from '../../../utils/logger.js';

/**
 * Parameters for triggering a workflow
 */
export interface TriggerWorkflowParams {
  workflowId: string;
  input?: Record<string, unknown>;
  async?: boolean;
}

/**
 * Tool definition for trigger_workflow
 */
export const triggerWorkflowTool: Tool = {
  name: 'trigger_workflow',
  description: 'Manually trigger a registered workflow with optional input data. Returns execution ID for async mode or result for sync mode.',
  inputSchema: {
    type: 'object',
    properties: {
      workflowId: {
        type: 'string',
        description: 'ID of the workflow to trigger',
        enum: [
          'file-change-logger',
          'markdown-analyzer',
          'concept-tracker',
          'file-deletion-monitor',
          'proof-daily-digest',
          'proof-task-complete',
          'proof-spec-kit-review',
        ],
      },
      input: {
        type: 'object',
        description: 'Optional input data/metadata to pass to the workflow',
        additionalProperties: true,
      },
      async: {
        type: 'boolean',
        description: 'Execute workflow asynchronously and return execution ID immediately (default: false)',
        default: false,
      },
    },
    required: ['workflowId'],
    additionalProperties: false,
  },
};

/**
 * Create handler function for trigger_workflow tool
 *
 * @param workflowEngine - Workflow engine instance
 * @returns Tool handler function
 */
export function createTriggerWorkflowHandler(workflowEngine: WorkflowEngine): ToolHandler {
  return async (params: TriggerWorkflowParams): Promise<ToolResult> => {
    const startTime = Date.now();

    try {
      const { workflowId, input, async = false } = params;

      logger.debug('Triggering workflow', {
        workflowId,
        hasInput: !!input,
        async,
      });

      // Validate workflow exists
      const workflow = workflowEngine.getRegistry().getWorkflow(workflowId);
      if (!workflow) {
        return {
          success: false,
          error: `Workflow not found: ${workflowId}`,
          metadata: {
            executionTime: Date.now() - startTime,
          },
        };
      }

      // Check if workflow is enabled
      if (!workflow.enabled) {
        return {
          success: false,
          error: `Workflow is disabled: ${workflowId}`,
          metadata: {
            executionTime: Date.now() - startTime,
          },
        };
      }

      if (async) {
        // Async execution - trigger and return immediately
        // Note: We don't await here, so execution happens in background
        const executionPromise = workflowEngine.triggerManual(workflowId, input);

        // Give it a moment to start and record the execution
        await new Promise(resolve => setTimeout(resolve, 50));

        // Get the most recent execution for this workflow
        const executions = workflowEngine.getRegistry().getExecutionsByWorkflow(workflowId, 1);
        const executionId = executions[0]?.id || 'unknown';

        logger.info('Workflow triggered asynchronously', {
          workflowId,
          executionId,
        });

        // Don't block on completion
        executionPromise.catch(error => {
          logger.error('Async workflow execution failed', error instanceof Error ? error : new Error(String(error)), {
            workflowId,
            executionId,
          });
        });

        return {
          success: true,
          data: {
            executionId,
            workflowId,
            workflowName: workflow.name,
            mode: 'async',
            message: 'Workflow execution started',
          },
          metadata: {
            executionTime: Date.now() - startTime,
          },
        };
      } else {
        // Sync execution - wait for completion
        await workflowEngine.triggerManual(workflowId, input);

        // Get the most recent execution to return details
        const executions = workflowEngine.getRegistry().getExecutionsByWorkflow(workflowId, 1);
        const execution = executions[0];

        logger.info('Workflow executed synchronously', {
          workflowId,
          executionId: execution?.id,
          status: execution?.status,
          duration: execution?.duration,
        });

        return {
          success: true,
          data: {
            executionId: execution?.id,
            workflowId,
            workflowName: workflow.name,
            mode: 'sync',
            status: execution?.status,
            duration: execution?.duration,
            message: 'Workflow execution completed',
          },
          metadata: {
            executionTime: Date.now() - startTime,
          },
        };
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;

      logger.error('Failed to trigger workflow', error instanceof Error ? error : new Error(String(error)), {
        params,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          executionTime,
        },
      };
    }
  };
}
