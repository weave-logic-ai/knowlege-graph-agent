import "../../../workflow/config.js";
import "../../../workflow/adapters/goap-adapter.js";
import { createWorkflowService } from "../../../workflow/services/workflow-service.js";
let workflowServiceInstance;
function getWorkflowService() {
  if (!workflowServiceInstance) {
    workflowServiceInstance = createWorkflowService();
  }
  return workflowServiceInstance;
}
const workflowStatusTool = {
  name: "kg_workflow_status",
  description: "Check the status of a workflow or the workflow service",
  inputSchema: {
    type: "object",
    properties: {
      workflowId: {
        type: "string",
        description: "Specific workflow ID to check (optional, returns service status if not provided)"
      },
      includeMetrics: {
        type: "boolean",
        description: "Include execution metrics and statistics",
        default: false
      },
      includeConfig: {
        type: "boolean",
        description: "Include service configuration details",
        default: false
      }
    }
  }
};
function createWorkflowStatusHandler() {
  return async (params) => {
    const startTime = Date.now();
    const { workflowId, includeMetrics = false, includeConfig = false } = params || {};
    try {
      const service = getWorkflowService();
      const serviceStatus = service.getStatus();
      const response = {
        found: false,
        service: {
          isRunning: serviceStatus.isRunning,
          activeWorkflowCount: serviceStatus.activeWorkflows.length,
          watchedPaths: serviceStatus.watchedPaths,
          lastActivity: serviceStatus.lastActivity
        }
      };
      if (workflowId && typeof workflowId === "string") {
        const workflow = service.getWorkflow(workflowId);
        if (workflow) {
          response.found = true;
          response.workflow = workflow;
        }
      }
      if (includeMetrics) {
        const stats = serviceStatus.stats;
        response.stats = {
          totalExecutions: stats.totalExecutions,
          successfulExecutions: stats.successfulExecutions,
          failedExecutions: stats.failedExecutions,
          averageDuration: stats.averageDuration,
          successRate: stats.totalExecutions > 0 ? stats.successfulExecutions / stats.totalExecutions * 100 : 0
        };
      }
      if (includeConfig) {
        const config = service.getConfig();
        response.config = {
          inactivityTimeout: config.inactivityTimeout || 3e5,
          autoStartThreshold: config.autoStartThreshold || 0.7,
          watchPaths: config.watchPaths || [],
          debug: config.debug || false
        };
      }
      return {
        success: true,
        data: response,
        metadata: {
          executionTime: Date.now() - startTime,
          requestedWorkflowId: workflowId || null
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { executionTime: Date.now() - startTime }
      };
    }
  };
}
export {
  createWorkflowStatusHandler,
  workflowStatusTool
};
//# sourceMappingURL=status.js.map
