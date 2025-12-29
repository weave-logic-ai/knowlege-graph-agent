/**
 * Trajectory List Tool
 *
 * MCP tool for listing agent trajectories from the trajectory tracker.
 * Provides access to agent operation history for analysis and learning.
 *
 * @module mcp-server/tools/vector/trajectory
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler } from '../../types/index.js';
import type { TrajectoryTracker } from '../../../vector/services/trajectory-tracker.js';
/**
 * Trajectory list tool definition
 *
 * Lists agent trajectories with optional filtering by agent ID
 * and control over included detail level.
 */
export declare const trajectoryListTool: Tool;
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
export declare function createTrajectoryListHandler(trajectoryTracker?: TrajectoryTracker): ToolHandler;
//# sourceMappingURL=trajectory.d.ts.map