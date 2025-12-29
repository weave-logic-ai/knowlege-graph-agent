/**
 * Workflow Status Tool
 *
 * MCP tool for checking the status of a specific workflow
 * or the overall workflow service status.
 *
 * @module mcp-server/tools/workflow/status
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import {
  createWorkflowService,
  type WorkflowService,
  type WorkflowRunMetadata,
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
 * Workflow status tool definition
 *
 * Defines the MCP tool interface for checking workflow status.
 * Can query specific workflow by ID or get service-wide status.
 */
export const workflowStatusTool: Tool = {
  name: 'kg_workflow_status',
  description: 'Check the status of a workflow or the workflow service',
  inputSchema: {
    type: 'object' as const,
    properties: {
      workflowId: {
        type: 'string',
        description: 'Specific workflow ID to check (optional, returns service status if not provided)',
      },
      includeMetrics: {
        type: 'boolean',
        description: 'Include execution metrics and statistics',
        default: false,
      },
      includeConfig: {
        type: 'boolean',
        description: 'Include service configuration details',
        default: false,
      },
    },
  },
};

/**
 * Workflow status response structure
 */
interface WorkflowStatusResponse {
  /** Whether a specific workflow was found */
  found: boolean;
  /** Workflow metadata if found */
  workflow?: WorkflowRunMetadata;
  /** Service-level status */
  service: {
    isRunning: boolean;
    activeWorkflowCount: number;
    watchedPaths: string[];
    lastActivity?: Date;
  };
  /** Execution statistics (if requested) */
  stats?: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageDuration: number;
    successRate: number;
  };
  /** Service configuration (if requested) */
  config?: {
    inactivityTimeout: number;
    autoStartThreshold: number;
    watchPaths: string[];
    debug: boolean;
  };
}

/**
 * Create handler for workflow status tool
 *
 * Creates an async handler that returns the status of a specific
 * workflow or the overall workflow service.
 *
 * @returns ToolHandler function for checking workflow status
 *
 * @example
 * ```typescript
 * const handler = createWorkflowStatusHandler();
 *
 * // Check specific workflow
 * const result = await handler({ workflowId: 'collab-123-abc' });
 *
 * // Check service status with metrics
 * const serviceStatus = await handler({ includeMetrics: true });
 * ```
 */
export function createWorkflowStatusHandler(): ToolHandler {
  return async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const { workflowId, includeMetrics = false, includeConfig = false } = params || {};

    try {
      const service = getWorkflowService();
      const serviceStatus = service.getStatus();

      const response: WorkflowStatusResponse = {
        found: false,
        service: {
          isRunning: serviceStatus.isRunning,
          activeWorkflowCount: serviceStatus.activeWorkflows.length,
          watchedPaths: serviceStatus.watchedPaths,
          lastActivity: serviceStatus.lastActivity,
        },
      };

      // Check specific workflow if ID provided
      if (workflowId && typeof workflowId === 'string') {
        const workflow = service.getWorkflow(workflowId);
        if (workflow) {
          response.found = true;
          response.workflow = workflow;
        }
      }

      // Include execution statistics if requested
      if (includeMetrics) {
        const stats = serviceStatus.stats;
        response.stats = {
          totalExecutions: stats.totalExecutions,
          successfulExecutions: stats.successfulExecutions,
          failedExecutions: stats.failedExecutions,
          averageDuration: stats.averageDuration,
          successRate: stats.totalExecutions > 0
            ? (stats.successfulExecutions / stats.totalExecutions) * 100
            : 0,
        };
      }

      // Include configuration if requested
      if (includeConfig) {
        const config = service.getConfig();
        response.config = {
          inactivityTimeout: config.inactivityTimeout || 300000,
          autoStartThreshold: config.autoStartThreshold || 0.7,
          watchPaths: config.watchPaths || [],
          debug: config.debug || false,
        };
      }

      return {
        success: true,
        data: response,
        metadata: {
          executionTime: Date.now() - startTime,
          requestedWorkflowId: workflowId || null,
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
