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
const workflowListTool = {
  name: "kg_workflow_list",
  description: "List all active workflows with optional filtering",
  inputSchema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        description: "Filter by workflow status",
        enum: ["running", "completed", "failed", "suspended", "all"]
      },
      type: {
        type: "string",
        description: "Filter by workflow type",
        enum: ["realtime-collab", "analysis", "sync", "custom", "all"]
      },
      limit: {
        type: "number",
        description: "Maximum number of workflows to return",
        default: 50
      },
      offset: {
        type: "number",
        description: "Number of workflows to skip (for pagination)",
        default: 0
      },
      sortBy: {
        type: "string",
        description: "Field to sort by",
        enum: ["startedAt", "lastEventAt", "status", "type"],
        default: "startedAt"
      },
      sortOrder: {
        type: "string",
        description: "Sort order",
        enum: ["asc", "desc"],
        default: "desc"
      }
    }
  }
};
function filterWorkflows(workflows, options) {
  let filtered = workflows.map((w) => ({
    id: w.id,
    type: w.type,
    startedAt: w.startedAt,
    status: w.status,
    currentStep: w.currentStep,
    lastEventAt: w.lastEventAt,
    duration: w.lastEventAt ? w.lastEventAt.getTime() - w.startedAt.getTime() : Date.now() - w.startedAt.getTime(),
    isActive: w.status === "running" || w.status === "suspended"
  }));
  if (options.status && options.status !== "all") {
    filtered = filtered.filter((w) => w.status === options.status);
  }
  if (options.type && options.type !== "all") {
    filtered = filtered.filter((w) => w.type === options.type);
  }
  const sortBy = options.sortBy || "startedAt";
  const sortOrder = options.sortOrder || "desc";
  const multiplier = sortOrder === "desc" ? -1 : 1;
  filtered.sort((a, b) => {
    let aVal;
    let bVal;
    switch (sortBy) {
      case "startedAt":
        aVal = a.startedAt.getTime();
        bVal = b.startedAt.getTime();
        break;
      case "lastEventAt":
        aVal = a.lastEventAt?.getTime() || 0;
        bVal = b.lastEventAt?.getTime() || 0;
        break;
      case "status":
        aVal = a.status;
        bVal = b.status;
        break;
      case "type":
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
function createWorkflowListHandler() {
  return async (params) => {
    const startTime = Date.now();
    const {
      status = "all",
      type = "all",
      limit = 50,
      offset = 0,
      sortBy = "startedAt",
      sortOrder = "desc"
    } = params || {};
    try {
      const service = getWorkflowService();
      const serviceStatus = service.getStatus();
      const allWorkflows = serviceStatus.activeWorkflows;
      const filteredWorkflows = filterWorkflows(allWorkflows, {
        status,
        type,
        sortBy,
        sortOrder
      });
      const numLimit = typeof limit === "number" ? limit : 50;
      const numOffset = typeof offset === "number" ? offset : 0;
      const paginatedWorkflows = filteredWorkflows.slice(
        numOffset,
        numOffset + numLimit
      );
      const summary = {
        total: allWorkflows.length,
        filtered: filteredWorkflows.length,
        returned: paginatedWorkflows.length,
        byStatus: {
          running: allWorkflows.filter((w) => w.status === "running").length,
          completed: allWorkflows.filter((w) => w.status === "completed").length,
          failed: allWorkflows.filter((w) => w.status === "failed").length,
          suspended: allWorkflows.filter((w) => w.status === "suspended").length
        },
        byType: allWorkflows.reduce((acc, w) => {
          acc[w.type] = (acc[w.type] || 0) + 1;
          return acc;
        }, {})
      };
      const workflows = paginatedWorkflows.map((w) => ({
        id: w.id,
        type: w.type,
        status: w.status,
        currentStep: w.currentStep,
        startedAt: w.startedAt.toISOString(),
        lastEventAt: w.lastEventAt?.toISOString(),
        duration: w.duration,
        isActive: w.isActive
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
            nextOffset: numOffset + numLimit < filteredWorkflows.length ? numOffset + numLimit : null
          },
          serviceStatus: {
            isRunning: serviceStatus.isRunning,
            watchedPaths: serviceStatus.watchedPaths.length,
            lastActivity: serviceStatus.lastActivity?.toISOString()
          }
        },
        metadata: {
          executionTime: Date.now() - startTime,
          filters: {
            status: status || "all",
            type: type || "all",
            sortBy: sortBy || "startedAt",
            sortOrder: sortOrder || "desc"
          },
          itemCount: workflows.length
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
  createWorkflowListHandler,
  workflowListTool
};
//# sourceMappingURL=list.js.map
