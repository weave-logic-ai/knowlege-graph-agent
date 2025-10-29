/**
 * Workflow MCP Tools
 *
 * MCP tools for triggering and monitoring workflow executions.
 * Integrates with the existing workflow engine in src/workflow-engine/
 *
 * Tools implemented:
 * - trigger_workflow: Manually trigger a registered workflow (Task 12)
 * - list_workflows: List all registered workflows with metadata (Task 13)
 * - get_workflow_status: Check execution status of a workflow (Task 14)
 * - get_workflow_history: Get historical execution records (Task 15)
 */

// Task 12: Trigger Workflow
export {
  triggerWorkflowTool,
  createTriggerWorkflowHandler,
} from './trigger-workflow.js';

// Task 13: List Workflows
export {
  listWorkflowsTool,
  createListWorkflowsHandler,
} from './list-workflows.js';

// Task 14: Get Workflow Status
export {
  getWorkflowStatusTool,
  createGetWorkflowStatusHandler,
} from './get-workflow-status.js';

// Task 15: Get Workflow History
export {
  getWorkflowHistoryTool,
  createGetWorkflowHistoryHandler,
} from './get-workflow-history.js';
