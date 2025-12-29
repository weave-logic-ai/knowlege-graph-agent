const trajectoryListTool = {
  name: "kg_trajectory_list",
  description: "List agent operation trajectories from the trajectory tracker. Trajectories record agent actions for pattern learning and optimization.",
  inputSchema: {
    type: "object",
    properties: {
      agentId: {
        type: "string",
        description: "Filter trajectories by specific agent ID"
      },
      limit: {
        type: "number",
        description: "Maximum number of trajectories to return (default: 20, max: 100)",
        default: 20,
        minimum: 1,
        maximum: 100
      },
      includeSteps: {
        type: "boolean",
        description: "Include detailed step information for each trajectory (default: false)",
        default: false
      },
      workflowId: {
        type: "string",
        description: "Filter trajectories by workflow ID"
      },
      successOnly: {
        type: "boolean",
        description: "Only include successful trajectories (default: false)",
        default: false
      },
      includeStats: {
        type: "boolean",
        description: "Include aggregate statistics about trajectories (default: true)",
        default: true
      }
    }
  }
};
function formatStep(step) {
  return {
    action: step.action,
    outcome: step.outcome,
    duration: step.duration,
    durationFormatted: formatDuration(step.duration),
    timestamp: step.timestamp.toISOString(),
    state: step.state,
    ...step.metadata ? { metadata: step.metadata } : {}
  };
}
function formatDuration(ms) {
  if (ms < 1e3) {
    return `${ms}ms`;
  }
  if (ms < 6e4) {
    return `${(ms / 1e3).toFixed(2)}s`;
  }
  const minutes = Math.floor(ms / 6e4);
  const seconds = (ms % 6e4 / 1e3).toFixed(1);
  return `${minutes}m ${seconds}s`;
}
function formatTrajectory(trajectory, includeSteps) {
  const formatted = {
    id: trajectory.id,
    agentId: trajectory.agentId,
    success: trajectory.success,
    stepCount: trajectory.steps.length,
    totalDuration: trajectory.totalDuration,
    totalDurationFormatted: formatDuration(trajectory.totalDuration),
    startedAt: trajectory.startedAt.toISOString()
  };
  if (trajectory.workflowId) {
    formatted.workflowId = trajectory.workflowId;
  }
  if (trajectory.completedAt) {
    formatted.completedAt = trajectory.completedAt.toISOString();
  }
  if (trajectory.metadata && Object.keys(trajectory.metadata).length > 0) {
    formatted.metadata = trajectory.metadata;
  }
  if (includeSteps) {
    formatted.steps = trajectory.steps.map(formatStep);
  } else {
    formatted.actionSummary = trajectory.steps.map((s) => s.action);
  }
  return formatted;
}
function createTrajectoryListHandler(trajectoryTracker) {
  return async (params) => {
    const startTime = Date.now();
    const {
      agentId,
      limit = 20,
      includeSteps = false,
      workflowId,
      successOnly = false,
      includeStats = true
    } = params;
    try {
      if (!trajectoryTracker) {
        return {
          success: false,
          error: "Trajectory tracker not initialized. Configure trajectory tracking first.",
          metadata: { executionTime: Date.now() - startTime }
        };
      }
      const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);
      let trajectories;
      if (agentId && typeof agentId === "string") {
        trajectories = trajectoryTracker.getAgentTrajectories(agentId);
      } else if (workflowId && typeof workflowId === "string") {
        trajectories = trajectoryTracker.getWorkflowTrajectories(workflowId);
      } else {
        const exported = trajectoryTracker.export();
        trajectories = exported.trajectories;
      }
      if (successOnly) {
        trajectories = trajectories.filter((t) => t.success);
      }
      trajectories.sort(
        (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
      );
      trajectories = trajectories.slice(0, safeLimit);
      const formattedTrajectories = trajectories.map(
        (t) => formatTrajectory(t, includeSteps)
      );
      const responseData = {
        trajectories: formattedTrajectories,
        count: formattedTrajectories.length,
        filters: {
          agentId: agentId || null,
          workflowId: workflowId || null,
          successOnly
        }
      };
      if (includeStats) {
        const stats = trajectoryTracker.getStats();
        responseData.stats = {
          totalTrajectories: stats.completedTrajectories,
          activeTrajectories: stats.activeTrajectories,
          successRate: Math.round(stats.successRate * 1e4) / 100,
          // percentage
          avgDuration: Math.round(stats.avgDuration),
          avgDurationFormatted: formatDuration(Math.round(stats.avgDuration)),
          detectedPatterns: stats.detectedPatterns,
          learningRecords: stats.learningRecords
        };
      }
      return {
        success: true,
        data: responseData,
        metadata: {
          executionTime: Date.now() - startTime,
          includeSteps
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
  createTrajectoryListHandler,
  trajectoryListTool
};
//# sourceMappingURL=trajectory.js.map
