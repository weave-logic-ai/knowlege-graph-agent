/**
 * Workflow Start Tool
 *
 * MCP tool for starting a new workflow execution.
 * Integrates with the WorkflowService for workflow orchestration.
 *
 * @module mcp-server/tools/workflow/start
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import {
  createWorkflowService,
  type WorkflowService,
} from '../../../workflow/index.js';

/** Singleton workflow service instance */
let workflowServiceInstance: WorkflowService | undefined;

/**
 * Get or create the workflow service instance
 *
 * @returns WorkflowService instance
 */
function getWorkflowService(): WorkflowService {
  if (!workflowServiceInstance) {
    workflowServiceInstance = createWorkflowService();
  }
  return workflowServiceInstance;
}

/**
 * Workflow start tool definition
 *
 * Defines the MCP tool interface for starting workflows.
 * Supports multiple workflow types including collaboration,
 * analysis, and custom workflows.
 */
export const workflowStartTool: Tool = {
  name: 'kg_workflow_start',
  description: 'Start a new workflow for knowledge graph operations',
  inputSchema: {
    type: 'object' as const,
    properties: {
      workflowId: {
        type: 'string',
        description: 'Workflow type to start (collaboration, analysis, sync)',
        enum: ['collaboration', 'analysis', 'sync', 'custom'],
      },
      input: {
        type: 'object',
        description: 'Workflow input data',
        properties: {
          graphId: {
            type: 'string',
            description: 'Knowledge graph identifier',
          },
          docPath: {
            type: 'string',
            description: 'Path to the source document',
          },
          options: {
            type: 'object',
            description: 'Additional workflow options',
            properties: {
              autoStart: {
                type: 'boolean',
                description: 'Auto-start development when ready',
              },
              watchPaths: {
                type: 'array',
                description: 'Paths to watch for changes',
                items: { type: 'string' },
              },
              threshold: {
                type: 'number',
                description: 'Completeness threshold (0-1)',
              },
            },
          },
        },
      },
    },
    required: ['workflowId'],
  },
};

/**
 * Workflow type definitions for different workflow scenarios
 */
type WorkflowType = 'collaboration' | 'analysis' | 'sync' | 'custom';

/**
 * Input structure for workflow execution
 */
interface WorkflowInput {
  graphId?: string;
  docPath?: string;
  options?: {
    autoStart?: boolean;
    watchPaths?: string[];
    threshold?: number;
  };
}

/**
 * Create handler for workflow start tool
 *
 * Creates an async handler that starts the specified workflow type
 * and returns execution metadata.
 *
 * @returns ToolHandler function for starting workflows
 *
 * @example
 * ```typescript
 * const handler = createWorkflowStartHandler();
 * const result = await handler({
 *   workflowId: 'collaboration',
 *   input: {
 *     graphId: 'graph-123',
 *     docPath: './docs/spec.md'
 *   }
 * });
 * ```
 */
export function createWorkflowStartHandler(): ToolHandler {
  return async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const { workflowId, input = {} } = params || {};

    // Validate required parameters
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: 'Workflow ID is required',
        metadata: { executionTime: Date.now() - startTime },
      };
    }

    const validWorkflowTypes: WorkflowType[] = ['collaboration', 'analysis', 'sync', 'custom'];
    if (!validWorkflowTypes.includes(workflowId as WorkflowType)) {
      return {
        success: false,
        error: `Invalid workflow type: ${workflowId}. Valid types: ${validWorkflowTypes.join(', ')}`,
        metadata: { executionTime: Date.now() - startTime },
      };
    }

    try {
      const service = getWorkflowService();
      const typedInput = input as WorkflowInput;

      // Ensure service is started
      const status = service.getStatus();
      if (!status.isRunning) {
        await service.start();
      }

      // Add watch paths if specified
      if (typedInput.options?.watchPaths) {
        for (const path of typedInput.options.watchPaths) {
          service.watch(path);
        }
      }

      let result;
      switch (workflowId as WorkflowType) {
        case 'collaboration':
          // Start collaboration workflow
          result = await service.startCollaborationWorkflow(
            typedInput.graphId || `graph-${Date.now()}`,
            typedInput.docPath || './'
          );
          break;

        case 'analysis':
          // Run gap analysis workflow
          const analysis = await service.analyzeGaps(typedInput.docPath || './');
          result = {
            success: true,
            workflowId: `analysis-${Date.now()}`,
            startedAt: new Date(),
            completedAt: new Date(),
            outcome: 'completed' as const,
            artifacts: analysis.recommendations,
            data: analysis,
          };
          break;

        case 'sync':
          // Sync workflow for file watching
          const watchPaths = typedInput.options?.watchPaths || [typedInput.docPath || './'];
          for (const path of watchPaths) {
            service.watch(path);
          }
          result = {
            success: true,
            workflowId: `sync-${Date.now()}`,
            startedAt: new Date(),
            outcome: 'completed' as const,
            artifacts: watchPaths,
          };
          break;

        case 'custom':
          // Custom workflow using GOAP planning
          const plan = await service.createPlan('start-development');
          result = {
            success: plan.achievable,
            workflowId: `custom-${Date.now()}`,
            startedAt: new Date(),
            completedAt: new Date(),
            outcome: plan.achievable ? 'completed' as const : 'failed' as const,
            artifacts: plan.actionIds,
            data: { plan },
          };
          break;
      }

      return {
        success: result.success,
        data: {
          workflowId: result.workflowId,
          type: workflowId,
          startedAt: result.startedAt,
          completedAt: result.completedAt,
          outcome: result.outcome,
          artifacts: result.artifacts,
          ...(result.error ? { error: result.error } : {}),
        },
        metadata: {
          executionTime: Date.now() - startTime,
          serviceStatus: service.getStatus().isRunning ? 'running' : 'stopped',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { executionTime: Date.now() - startTime },
      };
    }
  };
}
