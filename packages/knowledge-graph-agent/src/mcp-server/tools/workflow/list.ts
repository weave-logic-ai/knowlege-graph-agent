/**
 * Workflow List Tool
 *
 * MCP tool for listing all active workflows with filtering
 * and sorting capabilities.
 *
 * @module mcp-server/tools/workflow/list
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
 * Workflow list tool definition
 *
 * Defines the MCP tool interface for listing workflows.
 * Supports filtering by status and type with pagination.
 */
export const workflowListTool: Tool = {
  name: 'kg_workflow_list',
  description: 'List all active workflows with optional filtering',
  inputSchema: {
    type: 'object' as const,
    properties: {
      status: {
        type: 'string',
        description: 'Filter by workflow status',
        enum: ['running', 'completed', 'failed', 'suspended', 'all'],
      },
      type: {
        type: 'string',
        description: 'Filter by workflow type',
        enum: ['realtime-collab', 'analysis', 'sync', 'custom', 'all'],
      },
      limit: {
        type: 'number',
        description: 'Maximum number of workflows to return',
        default: 50,
      },
      offset: {
        type: 'number',
        description: 'Number of workflows to skip (for pagination)',
        default: 0,
      },
      sortBy: {
        type: 'string',
        description: 'Field to sort by',
        enum: ['startedAt', 'lastEventAt', 'status', 'type'],
        default: 'startedAt',
      },
      sortOrder: {
        type: 'string',
        description: 'Sort order',
        enum: ['asc', 'desc'],
        default: 'desc',
      },
    },
  },
};

/**
 * Workflow filter options
 */
interface WorkflowFilterOptions {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Extended workflow info with computed fields
 */
interface WorkflowInfo {
  /** Unique run identifier */
  id: string;
  /** Type of workflow being executed */
  type: string;
  /** Timestamp when the workflow started */
  startedAt: Date;
  /** Current status of the workflow */
  status: 'running' | 'completed' | 'failed' | 'suspended';
  /** ID of the currently executing step */
  currentStep?: string;
  /** Timestamp of the last event in this workflow */
  lastEventAt?: Date;
  /** Computed duration in milliseconds */
  duration?: number;
  /** Whether workflow is currently active */
  isActive: boolean;
}

/**
 * Filter workflows based on provided options
 *
 * @param workflows - Array of workflow metadata
 * @param options - Filter options
 * @returns Filtered array of workflows
 */
function filterWorkflows(
  workflows: WorkflowRunMetadata[],
  options: WorkflowFilterOptions
): WorkflowInfo[] {
  let filtered: WorkflowInfo[] = workflows.map(w => ({
    id: w.id,
    type: w.type,
    startedAt: w.startedAt,
    status: w.status,
    currentStep: w.currentStep,
    lastEventAt: w.lastEventAt,
    duration: w.lastEventAt
      ? w.lastEventAt.getTime() - w.startedAt.getTime()
      : Date.now() - w.startedAt.getTime(),
    isActive: w.status === 'running' || w.status === 'suspended',
  }));

  // Filter by status
  if (options.status && options.status !== 'all') {
    filtered = filtered.filter(w => w.status === options.status);
  }

  // Filter by type
  if (options.type && options.type !== 'all') {
    filtered = filtered.filter(w => w.type === options.type);
  }

  // Sort
  const sortBy = options.sortBy || 'startedAt';
  const sortOrder = options.sortOrder || 'desc';
  const multiplier = sortOrder === 'desc' ? -1 : 1;

  filtered.sort((a, b) => {
    let aVal: string | number | Date;
    let bVal: string | number | Date;

    switch (sortBy) {
      case 'startedAt':
        aVal = a.startedAt.getTime();
        bVal = b.startedAt.getTime();
        break;
      case 'lastEventAt':
        aVal = a.lastEventAt?.getTime() || 0;
        bVal = b.lastEventAt?.getTime() || 0;
        break;
      case 'status':
        aVal = a.status;
        bVal = b.status;
        break;
      case 'type':
        aVal = a.type;
        bVal = b.type;
        break;
      default:
        aVal = a.startedAt.getTime();
        bVal = b.startedAt.getTime();
    }

    if (aVal < bVal) return -1 * multiplier;
    if (aVal > bVal) return 1 * multiplier;
    return 0;
  });

  return filtered;
}

/**
 * Create handler for workflow list tool
 *
 * Creates an async handler that lists all workflows with
 * optional filtering, sorting, and pagination.
 *
 * @returns ToolHandler function for listing workflows
 *
 * @example
 * ```typescript
 * const handler = createWorkflowListHandler();
 *
 * // List all running workflows
 * const running = await handler({ status: 'running' });
 *
 * // List with pagination
 * const page2 = await handler({ limit: 10, offset: 10 });
 *
 * // List sorted by type
 * const byType = await handler({ sortBy: 'type', sortOrder: 'asc' });
 * ```
 */
export function createWorkflowListHandler(): ToolHandler {
  return async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const {
      status = 'all',
      type = 'all',
      limit = 50,
      offset = 0,
      sortBy = 'startedAt',
      sortOrder = 'desc',
    } = params || {};

    try {
      const service = getWorkflowService();
      const serviceStatus = service.getStatus();

      // Get all active workflows
      const allWorkflows = serviceStatus.activeWorkflows;

      // Apply filters
      const filteredWorkflows = filterWorkflows(allWorkflows, {
        status: status as string,
        type: type as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      // Apply pagination
      const numLimit = typeof limit === 'number' ? limit : 50;
      const numOffset = typeof offset === 'number' ? offset : 0;
      const paginatedWorkflows = filteredWorkflows.slice(
        numOffset,
        numOffset + numLimit
      );

      // Compute summary statistics
      const summary = {
        total: allWorkflows.length,
        filtered: filteredWorkflows.length,
        returned: paginatedWorkflows.length,
        byStatus: {
          running: allWorkflows.filter(w => w.status === 'running').length,
          completed: allWorkflows.filter(w => w.status === 'completed').length,
          failed: allWorkflows.filter(w => w.status === 'failed').length,
          suspended: allWorkflows.filter(w => w.status === 'suspended').length,
        },
        byType: allWorkflows.reduce((acc, w) => {
          acc[w.type] = (acc[w.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      // Format workflow data for response
      const workflows = paginatedWorkflows.map(w => ({
        id: w.id,
        type: w.type,
        status: w.status,
        currentStep: w.currentStep,
        startedAt: w.startedAt.toISOString(),
        lastEventAt: w.lastEventAt?.toISOString(),
        duration: w.duration,
        isActive: w.isActive,
      }));

      return {
        success: true,
        data: {
          workflows,
          summary,
          pagination: {
            limit: numLimit,
            offset: numOffset,
            hasMore: numOffset + numLimit < filteredWorkflows.length,
            nextOffset: numOffset + numLimit < filteredWorkflows.length
              ? numOffset + numLimit
              : null,
          },
          serviceStatus: {
            isRunning: serviceStatus.isRunning,
            watchedPaths: serviceStatus.watchedPaths.length,
            lastActivity: serviceStatus.lastActivity?.toISOString(),
          },
        },
        metadata: {
          executionTime: Date.now() - startTime,
          filters: {
            status: status || 'all',
            type: type || 'all',
            sortBy: sortBy || 'startedAt',
            sortOrder: sortOrder || 'desc',
          },
          itemCount: workflows.length,
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
