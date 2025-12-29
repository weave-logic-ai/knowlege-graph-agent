/**
 * Workflow Start Tool
 *
 * MCP tool for starting a new workflow execution.
 * Integrates with the WorkflowService for workflow orchestration.
 *
 * @module mcp-server/tools/workflow/start
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler } from '../../types/index.js';
/**
 * Workflow start tool definition
 *
 * Defines the MCP tool interface for starting workflows.
 * Supports multiple workflow types including collaboration,
 * analysis, and custom workflows.
 */
export declare const workflowStartTool: Tool;
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
export declare function createWorkflowStartHandler(): ToolHandler;
//# sourceMappingURL=start.d.ts.map