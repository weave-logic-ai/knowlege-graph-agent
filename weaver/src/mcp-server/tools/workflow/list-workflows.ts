/**
 * List Workflows Tool
 *
 * MCP tool for listing registered workflows with metadata and filtering options.
 * Returns workflow details including ID, name, description, enabled status, and triggers.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import type { WorkflowEngine, WorkflowDefinition } from '../../../workflow-engine/index.js';
import { logger } from '../../../utils/logger.js';

/**
 * Parameters for listing workflows
 */
export interface ListWorkflowsParams {
  enabled?: boolean;
  category?: string;
}

/**
 * Workflow metadata returned by the tool
 */
interface WorkflowMetadata {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggers: string[];
  category?: string;
  fileFilter?: string;
}

/**
 * Tool definition for list_workflows
 */
export const listWorkflowsTool: Tool = {
  name: 'list_workflows',
  description: 'List all registered workflows with metadata including ID, name, description, enabled status, and triggers. Supports filtering by enabled status and category.',
  inputSchema: {
    type: 'object',
    properties: {
      enabled: {
        type: 'boolean',
        description: 'Filter by enabled status (true=only enabled, false=only disabled, undefined=all)',
      },
      category: {
        type: 'string',
        description: 'Filter by workflow category (e.g., "example", "proof", "system")',
        enum: ['example', 'proof', 'system'],
      },
    },
    additionalProperties: false,
  },
};

/**
 * Determine workflow category based on ID
 *
 * @param workflowId - Workflow ID
 * @returns Category name
 */
function getWorkflowCategory(workflowId: string): string {
  if (workflowId.startsWith('proof-')) {
    return 'proof';
  } else if (workflowId.startsWith('system-')) {
    return 'system';
  } else {
    return 'example';
  }
}

/**
 * Convert workflow definition to metadata
 *
 * @param workflow - Workflow definition
 * @returns Workflow metadata
 */
function toWorkflowMetadata(workflow: WorkflowDefinition): WorkflowMetadata {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    enabled: workflow.enabled,
    triggers: workflow.triggers,
    category: getWorkflowCategory(workflow.id),
    fileFilter: workflow.fileFilter,
  };
}

/**
 * Create handler function for list_workflows tool
 *
 * @param workflowEngine - Workflow engine instance
 * @returns Tool handler function
 */
export function createListWorkflowsHandler(workflowEngine: WorkflowEngine): ToolHandler {
  return async (params: ListWorkflowsParams): Promise<ToolResult> => {
    const startTime = Date.now();

    try {
      const { enabled, category } = params;

      logger.debug('Listing workflows', {
        enabledFilter: enabled,
        categoryFilter: category,
      });

      // Get all workflows from registry
      let workflows = workflowEngine.getRegistry().getAllWorkflows();

      // Apply enabled filter
      if (enabled !== undefined) {
        workflows = workflows.filter(w => w.enabled === enabled);
      }

      // Convert to metadata
      let workflowsMetadata = workflows.map(toWorkflowMetadata);

      // Apply category filter
      if (category) {
        workflowsMetadata = workflowsMetadata.filter(w => w.category === category);
      }

      // Sort by name for consistent ordering
      workflowsMetadata.sort((a, b) => a.name.localeCompare(b.name));

      const executionTime = Date.now() - startTime;

      logger.debug('Workflows listed', {
        total: workflowsMetadata.length,
        enabled: workflowsMetadata.filter(w => w.enabled).length,
        disabled: workflowsMetadata.filter(w => !w.enabled).length,
        executionTime,
      });

      return {
        success: true,
        data: {
          workflows: workflowsMetadata,
          total: workflowsMetadata.length,
          filters: {
            enabled,
            category,
          },
        },
        metadata: {
          executionTime,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      logger.error('Failed to list workflows', error instanceof Error ? error : new Error(String(error)), {
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
