/**
 * Trajectory List Tool
 *
 * MCP tool for listing agent trajectories from the trajectory tracker.
 * Provides access to agent operation history for analysis and learning.
 *
 * @module mcp-server/tools/vector/trajectory
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import type { TrajectoryTracker } from '../../../vector/services/trajectory-tracker.js';
import type { AgentTrajectory, TrajectoryStep } from '../../../vector/types.js';

/**
 * Trajectory list tool definition
 *
 * Lists agent trajectories with optional filtering by agent ID
 * and control over included detail level.
 */
export const trajectoryListTool: Tool = {
  name: 'kg_trajectory_list',
  description:
    'List agent operation trajectories from the trajectory tracker. Trajectories record agent actions for pattern learning and optimization.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      agentId: {
        type: 'string',
        description: 'Filter trajectories by specific agent ID',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of trajectories to return (default: 20, max: 100)',
        default: 20,
        minimum: 1,
        maximum: 100,
      },
      includeSteps: {
        type: 'boolean',
        description: 'Include detailed step information for each trajectory (default: false)',
        default: false,
      },
      workflowId: {
        type: 'string',
        description: 'Filter trajectories by workflow ID',
      },
      successOnly: {
        type: 'boolean',
        description: 'Only include successful trajectories (default: false)',
        default: false,
      },
      includeStats: {
        type: 'boolean',
        description: 'Include aggregate statistics about trajectories (default: true)',
        default: true,
      },
    },
  },
};

/**
 * Parameters for trajectory list
 */
interface TrajectoryListParams {
  /** Filter by agent ID */
  agentId?: string;
  /** Maximum results */
  limit?: number;
  /** Include step details */
  includeSteps?: boolean;
  /** Filter by workflow */
  workflowId?: string;
  /** Only successful trajectories */
  successOnly?: boolean;
  /** Include statistics */
  includeStats?: boolean;
}

/**
 * Format a trajectory step for output
 *
 * Formats step data for API response, including duration formatting.
 *
 * @param step - Trajectory step to format
 * @returns Formatted step object
 * @internal
 */
function formatStep(step: TrajectoryStep): Record<string, unknown> {
  return {
    action: step.action,
    outcome: step.outcome,
    duration: step.duration,
    durationFormatted: formatDuration(step.duration),
    timestamp: step.timestamp.toISOString(),
    state: step.state,
    ...(step.metadata ? { metadata: step.metadata } : {}),
  };
}

/**
 * Format duration in human-readable form
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string
 * @internal
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(1);
  return `${minutes}m ${seconds}s`;
}

/**
 * Format a trajectory for output
 *
 * Creates a formatted trajectory object suitable for API response.
 *
 * @param trajectory - Trajectory to format
 * @param includeSteps - Whether to include detailed steps
 * @returns Formatted trajectory object
 * @internal
 */
function formatTrajectory(
  trajectory: AgentTrajectory,
  includeSteps: boolean
): Record<string, unknown> {
  const formatted: Record<string, unknown> = {
    id: trajectory.id,
    agentId: trajectory.agentId,
    success: trajectory.success,
    stepCount: trajectory.steps.length,
    totalDuration: trajectory.totalDuration,
    totalDurationFormatted: formatDuration(trajectory.totalDuration),
    startedAt: trajectory.startedAt.toISOString(),
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
    // Include just action summary when steps not requested
    formatted.actionSummary = trajectory.steps.map((s) => s.action);
  }

  return formatted;
}

/**
 * Create trajectory list handler
 *
 * Creates a handler function that lists agent trajectories from the
 * trajectory tracker. Supports filtering and pagination.
 *
 * @param trajectoryTracker - Trajectory tracker instance
 * @returns Tool handler function
 *
 * @example
 * ```typescript
 * const handler = createTrajectoryListHandler(tracker);
 * const result = await handler({
 *   agentId: 'researcher-1',
 *   limit: 10,
 *   includeSteps: true,
 * });
 * ```
 */
export function createTrajectoryListHandler(
  trajectoryTracker?: TrajectoryTracker
): ToolHandler {
  return async (params: Record<string, unknown>): Promise<ToolResult> => {
    const startTime = Date.now();
    const {
      agentId,
      limit = 20,
      includeSteps = false,
      workflowId,
      successOnly = false,
      includeStats = true,
    } = params as TrajectoryListParams;

    try {
      // Check trajectory tracker availability
      if (!trajectoryTracker) {
        return {
          success: false,
          error: 'Trajectory tracker not initialized. Configure trajectory tracking first.',
          metadata: { executionTime: Date.now() - startTime },
        };
      }

      // Enforce limits
      const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);

      // Get trajectories based on filters
      let trajectories: AgentTrajectory[];

      if (agentId && typeof agentId === 'string') {
        trajectories = trajectoryTracker.getAgentTrajectories(agentId);
      } else if (workflowId && typeof workflowId === 'string') {
        trajectories = trajectoryTracker.getWorkflowTrajectories(workflowId);
      } else {
        // Get all trajectories via stats (no direct getAllTrajectories method)
        // Use export to get all trajectories
        const exported = trajectoryTracker.export();
        trajectories = exported.trajectories;
      }

      // Apply success filter
      if (successOnly) {
        trajectories = trajectories.filter((t) => t.success);
      }

      // Sort by start time (most recent first)
      trajectories.sort(
        (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
      );

      // Apply limit
      trajectories = trajectories.slice(0, safeLimit);

      // Format trajectories
      const formattedTrajectories = trajectories.map((t) =>
        formatTrajectory(t, includeSteps)
      );

      // Build response data
      const responseData: Record<string, unknown> = {
        trajectories: formattedTrajectories,
        count: formattedTrajectories.length,
        filters: {
          agentId: agentId || null,
          workflowId: workflowId || null,
          successOnly,
        },
      };

      // Include stats if requested
      if (includeStats) {
        const stats = trajectoryTracker.getStats();
        responseData.stats = {
          totalTrajectories: stats.completedTrajectories,
          activeTrajectories: stats.activeTrajectories,
          successRate: Math.round(stats.successRate * 10000) / 100, // percentage
          avgDuration: Math.round(stats.avgDuration),
          avgDurationFormatted: formatDuration(Math.round(stats.avgDuration)),
          detectedPatterns: stats.detectedPatterns,
          learningRecords: stats.learningRecords,
        };
      }

      return {
        success: true,
        data: responseData,
        metadata: {
          executionTime: Date.now() - startTime,
          includeSteps,
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
