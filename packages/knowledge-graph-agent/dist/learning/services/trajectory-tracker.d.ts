/**
 * Trajectory Tracker Service
 *
 * Tracks task execution trajectories for agents, storing them in the
 * ReasoningBank for future learning and verdict judgment.
 *
 * Each trajectory represents a complete task execution with all steps,
 * observations, and the final outcome.
 *
 * @module learning/services/trajectory-tracker
 */
import { EventEmitter } from 'events';
import { ReasoningBankAdapter, type TrajectoryStep } from '../../integrations/agentic-flow/adapters/reasoning-bank-adapter.js';
/**
 * Configuration for the trajectory tracker
 */
export interface TrajectoryTrackerConfig {
    /** Enable trajectory tracking */
    enabled: boolean;
    /** Automatically store trajectories on completion */
    autoStore: boolean;
    /** Minimum steps required to store a trajectory */
    minStepsToStore: number;
    /** Include detailed observations in steps */
    detailedObservations: boolean;
    /** Maximum observation length */
    maxObservationLength: number;
}
/**
 * Events emitted by the trajectory tracker
 */
export interface TrajectoryTrackerEvents {
    'trajectory:started': {
        trajectoryId: string;
        taskId: string;
    };
    'trajectory:step': {
        trajectoryId: string;
        step: TrajectoryStep;
        stepIndex: number;
    };
    'trajectory:completed': {
        trajectoryId: string;
        storedId: string | null;
        outcome: 'success' | 'failure' | 'partial';
        stepCount: number;
    };
    'trajectory:aborted': {
        trajectoryId: string;
        reason: string;
    };
    'trajectory:skipped': {
        trajectoryId: string;
        reason: string;
    };
    'trajectory:error': {
        trajectoryId: string;
        error: unknown;
    };
}
/**
 * Tracks task execution trajectories for learning
 *
 * @example
 * ```typescript
 * const tracker = new TrajectoryTracker(reasoningBank, { enabled: true });
 *
 * // Start tracking a task
 * const trajectoryId = tracker.startTrajectory('task-123', { agentType: 'coder' });
 *
 * // Record steps as the task executes
 * tracker.recordStep(trajectoryId, {
 *   action: 'analyze',
 *   observation: 'Found 5 code issues',
 * });
 *
 * tracker.recordStep(trajectoryId, {
 *   action: 'fix',
 *   observation: 'Applied 5 fixes',
 * });
 *
 * // Complete the trajectory
 * await tracker.completeTrajectory(trajectoryId, 'success', { quality: 0.95 });
 * ```
 */
export declare class TrajectoryTracker extends EventEmitter {
    private config;
    private reasoningBank;
    private activeTrajectories;
    constructor(reasoningBank: ReasoningBankAdapter | null, config?: Partial<TrajectoryTrackerConfig>);
    /**
     * Check if tracking is enabled
     */
    isEnabled(): boolean;
    /**
     * Start tracking a new trajectory for a task
     *
     * @param taskId - Unique identifier for the task
     * @param metadata - Additional metadata to store with the trajectory
     * @returns Trajectory ID for subsequent operations
     */
    startTrajectory(taskId: string, metadata?: Record<string, unknown>): string;
    /**
     * Record a step in the trajectory
     *
     * @param trajectoryId - ID of the trajectory to record to
     * @param step - Step data (action, observation, and optional fields)
     */
    recordStep(trajectoryId: string, step: Omit<TrajectoryStep, 'timestamp'>): void;
    /**
     * Complete and store the trajectory
     *
     * @param trajectoryId - ID of the trajectory to complete
     * @param outcome - Final outcome of the task
     * @param finalMetadata - Additional metadata to include
     * @returns ID of the stored trajectory, or null if not stored
     */
    completeTrajectory(trajectoryId: string, outcome: 'success' | 'failure' | 'partial', finalMetadata?: Record<string, unknown>): Promise<string | null>;
    /**
     * Abort a trajectory without storing
     *
     * @param trajectoryId - ID of the trajectory to abort
     * @param reason - Reason for aborting
     */
    abortTrajectory(trajectoryId: string, reason: string): void;
    /**
     * Get count of active trajectories
     */
    getActiveCount(): number;
    /**
     * Get all active trajectory IDs
     */
    getActiveIds(): string[];
    /**
     * Get progress of a trajectory
     *
     * @param trajectoryId - ID of the trajectory
     * @returns Progress info or null if not found
     */
    getProgress(trajectoryId: string): {
        stepCount: number;
        duration: number;
        lastStep?: TrajectoryStep;
    } | null;
    /**
     * Get a snapshot of an active trajectory
     *
     * @param trajectoryId - ID of the trajectory
     * @returns Active trajectory data or null
     */
    getActiveTrajectory(trajectoryId: string): {
        taskId: string;
        stepCount: number;
        startTime: Date;
        metadata: Record<string, unknown>;
    } | null;
    /**
     * Clear all active trajectories (for cleanup)
     */
    clearActive(): void;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<TrajectoryTrackerConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): TrajectoryTrackerConfig;
}
/**
 * Create a trajectory tracker instance
 */
export declare function createTrajectoryTracker(reasoningBank: ReasoningBankAdapter | null, config?: Partial<TrajectoryTrackerConfig>): TrajectoryTracker;
//# sourceMappingURL=trajectory-tracker.d.ts.map