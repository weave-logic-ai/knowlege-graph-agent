/**
 * Workflow List Tool
 *
 * MCP tool for listing all active workflows with filtering
 * and sorting capabilities.
 *
 * @module mcp-server/tools/workflow/list
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler } from '../../types/index.js';
/**
 * Workflow list tool definition
 *
 * Defines the MCP tool interface for listing workflows.
 * Supports filtering by status and type with pagination.
 */
export declare const workflowListTool: Tool;
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
export declare function createWorkflowListHandler(): ToolHandler;
//# sourceMappingURL=list.d.ts.map