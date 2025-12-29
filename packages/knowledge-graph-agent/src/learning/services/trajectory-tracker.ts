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
import {
  ReasoningBankAdapter,
  type Trajectory,
  type TrajectoryStep,
} from '../../integrations/agentic-flow/adapters/reasoning-bank-adapter.js';

// ============================================================================
// Types
// ============================================================================

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

const DEFAULT_CONFIG: TrajectoryTrackerConfig = {
  enabled: true,
  autoStore: true,
  minStepsToStore: 2,
  detailedObservations: true,
  maxObservationLength: 500,
};

/**
 * Active trajectory being tracked
 */
interface ActiveTrajectory {
  /** Trajectory ID */
  trajectoryId: string;

  /** Task ID */
  taskId: string;

  /** Recorded steps */
  steps: TrajectoryStep[];

  /** Start time */
  startTime: Date;

  /** Last step start time for duration calculation */
  lastStepStartTime: number;

  /** Metadata */
  metadata: Record<string, unknown>;
}

/**
 * Events emitted by the trajectory tracker
 */
export interface TrajectoryTrackerEvents {
  'trajectory:started': { trajectoryId: string; taskId: string };
  'trajectory:step': { trajectoryId: string; step: TrajectoryStep; stepIndex: number };
  'trajectory:completed': {
    trajectoryId: string;
    storedId: string | null;
    outcome: 'success' | 'failure' | 'partial';
    stepCount: number;
  };
  'trajectory:aborted': { trajectoryId: string; reason: string };
  'trajectory:skipped': { trajectoryId: string; reason: string };
  'trajectory:error': { trajectoryId: string; error: unknown };
}

// ============================================================================
// Trajectory Tracker
// ============================================================================

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
export class TrajectoryTracker extends EventEmitter {
  private config: TrajectoryTrackerConfig;
  private reasoningBank: ReasoningBankAdapter | null;
  private activeTrajectories: Map<string, ActiveTrajectory>;

  constructor(
    reasoningBank: ReasoningBankAdapter | null,
    config: Partial<TrajectoryTrackerConfig> = {}
  ) {
    super();
    this.reasoningBank = reasoningBank;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.activeTrajectories = new Map();
  }

  /**
   * Check if tracking is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Start tracking a new trajectory for a task
   *
   * @param taskId - Unique identifier for the task
   * @param metadata - Additional metadata to store with the trajectory
   * @returns Trajectory ID for subsequent operations
   */
  startTrajectory(
    taskId: string,
    metadata: Record<string, unknown> = {}
  ): string {
    if (!this.config.enabled) {
      return '';
    }

    const trajectoryId = `traj-${taskId}-${Date.now()}`;
    const now = Date.now();

    this.activeTrajectories.set(trajectoryId, {
      trajectoryId,
      taskId,
      steps: [],
      startTime: new Date(),
      lastStepStartTime: now,
      metadata,
    });

    this.emit('trajectory:started', { trajectoryId, taskId });

    return trajectoryId;
  }

  /**
   * Record a step in the trajectory
   *
   * @param trajectoryId - ID of the trajectory to record to
   * @param step - Step data (action, observation, and optional fields)
   */
  recordStep(
    trajectoryId: string,
    step: Omit<TrajectoryStep, 'timestamp'>
  ): void {
    if (!this.config.enabled || !trajectoryId) {
      return;
    }

    const trajectory = this.activeTrajectories.get(trajectoryId);
    if (!trajectory) {
      console.warn(`Trajectory ${trajectoryId} not found`);
      return;
    }

    const now = Date.now();
    const duration = now - trajectory.lastStepStartTime;

    // Truncate observation if needed
    let observation = step.observation;
    if (this.config.detailedObservations && observation.length > this.config.maxObservationLength) {
      observation = observation.substring(0, this.config.maxObservationLength) + '...';
    }

    const fullStep: TrajectoryStep = {
      action: step.action,
      observation,
      timestamp: new Date(),
      duration: step.duration ?? duration,
      confidence: step.confidence ?? 0.8,
      metadata: step.metadata,
    };

    trajectory.steps.push(fullStep);
    trajectory.lastStepStartTime = now;

    this.emit('trajectory:step', {
      trajectoryId,
      step: fullStep,
      stepIndex: trajectory.steps.length - 1,
    });
  }

  /**
   * Complete and store the trajectory
   *
   * @param trajectoryId - ID of the trajectory to complete
   * @param outcome - Final outcome of the task
   * @param finalMetadata - Additional metadata to include
   * @returns ID of the stored trajectory, or null if not stored
   */
  async completeTrajectory(
    trajectoryId: string,
    outcome: 'success' | 'failure' | 'partial',
    finalMetadata: Record<string, unknown> = {}
  ): Promise<string | null> {
    if (!this.config.enabled || !trajectoryId) {
      return null;
    }

    const trajectory = this.activeTrajectories.get(trajectoryId);
    if (!trajectory) {
      console.warn(`Trajectory ${trajectoryId} not found`);
      return null;
    }

    // Remove from active
    this.activeTrajectories.delete(trajectoryId);

    // Check if worth storing
    if (trajectory.steps.length < this.config.minStepsToStore) {
      this.emit('trajectory:skipped', { trajectoryId, reason: 'too-few-steps' });
      return null;
    }

    // Store if enabled and ReasoningBank available
    if (this.config.autoStore && this.reasoningBank?.isAvailable()) {
      try {
        const storedId = await this.reasoningBank.storeTrajectory({
          taskId: trajectory.taskId,
          steps: trajectory.steps,
          outcome,
          metadata: {
            ...trajectory.metadata,
            ...finalMetadata,
            duration: Date.now() - trajectory.startTime.getTime(),
            stepCount: trajectory.steps.length,
          },
        });

        this.emit('trajectory:completed', {
          trajectoryId,
          storedId,
          outcome,
          stepCount: trajectory.steps.length,
        });

        return storedId;
      } catch (error) {
        this.emit('trajectory:error', { trajectoryId, error });
        return null;
      }
    }

    this.emit('trajectory:completed', {
      trajectoryId,
      storedId: null,
      outcome,
      stepCount: trajectory.steps.length,
    });

    return null;
  }

  /**
   * Abort a trajectory without storing
   *
   * @param trajectoryId - ID of the trajectory to abort
   * @param reason - Reason for aborting
   */
  abortTrajectory(trajectoryId: string, reason: string): void {
    if (!trajectoryId) return;

    const trajectory = this.activeTrajectories.get(trajectoryId);
    if (!trajectory) return;

    this.activeTrajectories.delete(trajectoryId);
    this.emit('trajectory:aborted', { trajectoryId, reason });
  }

  /**
   * Get count of active trajectories
   */
  getActiveCount(): number {
    return this.activeTrajectories.size;
  }

  /**
   * Get all active trajectory IDs
   */
  getActiveIds(): string[] {
    return Array.from(this.activeTrajectories.keys());
  }

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
  } | null {
    const trajectory = this.activeTrajectories.get(trajectoryId);
    if (!trajectory) return null;

    return {
      stepCount: trajectory.steps.length,
      duration: Date.now() - trajectory.startTime.getTime(),
      lastStep: trajectory.steps[trajectory.steps.length - 1],
    };
  }

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
  } | null {
    const trajectory = this.activeTrajectories.get(trajectoryId);
    if (!trajectory) return null;

    return {
      taskId: trajectory.taskId,
      stepCount: trajectory.steps.length,
      startTime: trajectory.startTime,
      metadata: trajectory.metadata,
    };
  }

  /**
   * Clear all active trajectories (for cleanup)
   */
  clearActive(): void {
    for (const trajectoryId of this.activeTrajectories.keys()) {
      this.abortTrajectory(trajectoryId, 'cleanup');
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TrajectoryTrackerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): TrajectoryTrackerConfig {
    return { ...this.config };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a trajectory tracker instance
 */
export function createTrajectoryTracker(
  reasoningBank: ReasoningBankAdapter | null,
  config?: Partial<TrajectoryTrackerConfig>
): TrajectoryTracker {
  return new TrajectoryTracker(reasoningBank, config);
}

// ============================================================================
// Exports
// ============================================================================

// Types are already exported at their interface definitions above
