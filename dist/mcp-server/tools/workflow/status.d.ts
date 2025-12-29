/**
 * Workflow Status Tool
 *
 * MCP tool for checking the status of a specific workflow
 * or the overall workflow service status.
 *
 * @module mcp-server/tools/workflow/status
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler } from '../../types/index.js';
/**
 * Workflow status tool definition
 *
 * Defines the MCP tool interface for checking workflow status.
 * Can query specific workflow by ID or get service-wide status.
 */
export declare const workflowStatusTool: Tool;
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
export declare function createWorkflowStatusHandler(): ToolHandler;
//# sourceMappingURL=status.d.ts.map