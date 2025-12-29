/**
 * Trajectory Mixin for Agents
 *
 * Provides trajectory tracking capabilities to agents via mixin pattern.
 * This allows any agent to track task execution trajectories for learning
 * and verdict judgment purposes.
 *
 * @module agents/mixins/trajectory-mixin
 */
import { TrajectoryTracker } from '../../learning/services/trajectory-tracker.js';
import type { TrajectoryStep } from '../../integrations/agentic-flow/adapters/reasoning-bank-adapter.js';
/**
 * Constructor type for mixin pattern
 */
type Constructor<T = object> = new (...args: any[]) => T;
/**
 * Interface for trajectory mixin capabilities
 */
export interface TrajectoryCapable {
    /** The trajectory tracker instance */
    trajectoryTracker: TrajectoryTracker | null;
    /** Current active trajectory ID */
    currentTrajectoryId: string | null;
    /** Set the trajectory tracker */
    setTrajectoryTracker(tracker: TrajectoryTracker): void;
    /** Start tracking a task trajectory */
    startTaskTrajectory(taskId: string, metadata?: Record<string, unknown>): void;
    /** Record a step in the current trajectory */
    recordTrajectoryStep(action: string, observation: string, confidence?: number, metadata?: Record<string, unknown>): void;
    /** Complete the current trajectory */
    completeTaskTrajectory(outcome: 'success' | 'failure' | 'partial', metadata?: Record<string, unknown>): Promise<string | null>;
    /** Abort the current trajectory */
    abortTaskTrajectory(reason: string): void;
    /** Check if trajectory tracking is active */
    isTrackingTrajectory(): boolean;
    /** Get current trajectory progress */
    getTrajectoryProgress(): {
        stepCount: number;
        duration: number;
        lastStep?: TrajectoryStep;
    } | null;
}
/**
 * Configuration for trajectory mixin
 */
export interface TrajectoryMixinConfig {
    /** Auto-start trajectory on task execution */
    autoStartOnTask: boolean;
    /** Auto-complete trajectory after task */
    autoCompleteOnTask: boolean;
    /** Default metadata to include with trajectories */
    defaultMetadata?: Record<string, unknown>;
}
/**
 * Apply trajectory tracking capabilities to an agent class
 *
 * @example
 * ```typescript
 * class ResearchAgent extends applyTrajectoryMixin(BaseAgent) {
 *   async executeTask(task: AgentTask): Promise<AgentResult> {
 *     // Trajectory tracking is automatic if autoStartOnTask is true
 *     // Or manually record steps:
 *     this.recordTrajectoryStep('research', 'Found 10 relevant sources');
 *     this.recordTrajectoryStep('analyze', 'Synthesized findings');
 *
 *     return this.formatOutput(results);
 *   }
 * }
 * ```
 *
 * @param Base - The base class to extend
 * @param config - Optional mixin configuration
 * @returns A class with trajectory tracking capabilities
 */
export declare function applyTrajectoryMixin<TBase extends Constructor>(Base: TBase, config?: Partial<TrajectoryMixinConfig>): TBase & Constructor<TrajectoryCapable>;
/**
 * Standalone trajectory wrapper for objects that cannot use mixins
 *
 * @example
 * ```typescript
 * const wrapper = new TrajectoryWrapper(tracker);
 * wrapper.startTrajectory('task-123', { agentType: 'coder' });
 * wrapper.recordStep('analyze', 'Found 5 issues');
 * await wrapper.complete('success');
 * ```
 */
export declare class TrajectoryWrapper implements TrajectoryCapable {
    trajectoryTracker: TrajectoryTracker | null;
    currentTrajectoryId: string | null;
    constructor(tracker?: TrajectoryTracker | null);
    setTrajectoryTracker(tracker: TrajectoryTracker): void;
    startTaskTrajectory(taskId: string, metadata?: Record<string, unknown>): void;
    recordTrajectoryStep(action: string, observation: string, confidence?: number, metadata?: Record<string, unknown>): void;
    completeTaskTrajectory(outcome: 'success' | 'failure' | 'partial', metadata?: Record<string, unknown>): Promise<string | null>;
    abortTaskTrajectory(reason: string): void;
    isTrackingTrajectory(): boolean;
    getTrajectoryProgress(): {
        stepCount: number;
        duration: number;
        lastStep?: TrajectoryStep;
    } | null;
}
/**
 * Create a trajectory wrapper instance
 */
export declare function createTrajectoryWrapper(tracker?: TrajectoryTracker | null): TrajectoryWrapper;
/**
 * Check if an object has trajectory capabilities
 */
export declare function hasTrajectoryCapability(obj: unknown): obj is TrajectoryCapable;
export {};
//# sourceMappingURL=trajectory-mixin.d.ts.map