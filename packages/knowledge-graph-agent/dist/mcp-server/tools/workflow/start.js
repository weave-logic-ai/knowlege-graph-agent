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
const workflowStartTool = {
  name: "kg_workflow_start",
  description: "Start a new workflow for knowledge graph operations",
  inputSchema: {
    type: "object",
    properties: {
      workflowId: {
        type: "string",
        description: "Workflow type to start (collaboration, analysis, sync)",
        enum: ["collaboration", "analysis", "sync", "custom"]
      },
      input: {
        type: "object",
        description: "Workflow input data",
        properties: {
          graphId: {
            type: "string",
            description: "Knowledge graph identifier"
          },
          docPath: {
            type: "string",
            description: "Path to the source document"
          },
          options: {
            type: "object",
            description: "Additional workflow options",
            properties: {
              autoStart: {
                type: "boolean",
                description: "Auto-start development when ready"
              },
              watchPaths: {
                type: "array",
                description: "Paths to watch for changes",
                items: { type: "string" }
              },
              threshold: {
                type: "number",
                description: "Completeness threshold (0-1)"
              }
            }
          }
        }
      }
    },
    required: ["workflowId"]
  }
};
function createWorkflowStartHandler() {
  return async (params) => {
    const startTime = Date.now();
    const { workflowId, input = {} } = params || {};
    if (!workflowId || typeof workflowId !== "string") {
      return {
        success: false,
        error: "Workflow ID is required",
        metadata: { executionTime: Date.now() - startTime }
      };
    }
    const validWorkflowTypes = ["collaboration", "analysis", "sync", "custom"];
    if (!validWorkflowTypes.includes(workflowId)) {
      return {
        success: false,
        error: `Invalid workflow type: ${workflowId}. Valid types: ${validWorkflowTypes.join(", ")}`,
        metadata: { executionTime: Date.now() - startTime }
      };
    }
    try {
      const service = getWorkflowService();
      const typedInput = input;
      const status = service.getStatus();
      if (!status.isRunning) {
        await service.start();
      }
      if (typedInput.options?.watchPaths) {
        for (const path of typedInput.options.watchPaths) {
          service.watch(path);
        }
      }
      let result;
      switch (workflowId) {
        case "collaboration":
          result = await service.startCollaborationWorkflow(
            typedInput.graphId || `graph-${Date.now()}`,
            typedInput.docPath || "./"
          );
          break;
        case "analysis":
          const analysis = await service.analyzeGaps(typedInput.docPath || "./");
          result = {
            success: true,
            workflowId: `analysis-${Date.now()}`,
            startedAt: /* @__PURE__ */ new Date(),
            completedAt: /* @__PURE__ */ new Date(),
            outcome: "completed",
            artifacts: analysis.recommendations,
            data: analysis
          };
          break;
        case "sync":
          const watchPaths = typedInput.options?.watchPaths || [typedInput.docPath || "./"];
          for (const path of watchPaths) {
            service.watch(path);
          }
          result = {
            success: true,
            workflowId: `sync-${Date.now()}`,
            startedAt: /* @__PURE__ */ new Date(),
            outcome: "completed",
            artifacts: watchPaths
          };
          break;
        case "custom":
          const plan = await service.createPlan("start-development");
          result = {
            success: plan.achievable,
            workflowId: `custom-${Date.now()}`,
            startedAt: /* @__PURE__ */ new Date(),
            completedAt: /* @__PURE__ */ new Date(),
            outcome: plan.achievable ? "completed" : "failed",
            artifacts: plan.actionIds,
            data: { plan }
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
          ...result.error ? { error: result.error } : {}
        },
        metadata: {
          executionTime: Date.now() - startTime,
          serviceStatus: service.getStatus().isRunning ? "running" : "stopped"
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
  createWorkflowStartHandler,
  workflowStartTool
};
//# sourceMappingURL=start.js.map
