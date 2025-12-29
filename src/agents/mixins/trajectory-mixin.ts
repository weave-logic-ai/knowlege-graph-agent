/**
 * Trajectory Mixin for Agents
 *
 * Provides trajectory tracking capabilities to agents via mixin pattern.
 * This allows any agent to track task execution trajectories for learning
 * and verdict judgment purposes.
 *
 * @module agents/mixins/trajectory-mixin
 */

import {
  TrajectoryTracker,
  type TrajectoryTrackerConfig,
} from '../../learning/services/trajectory-tracker.js';
import type { TrajectoryStep } from '../../integrations/agentic-flow/adapters/reasoning-bank-adapter.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Constructor type for mixin pattern
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  recordTrajectoryStep(
    action: string,
    observation: string,
    confidence?: number,
    metadata?: Record<string, unknown>
  ): void;

  /** Complete the current trajectory */
  completeTaskTrajectory(
    outcome: 'success' | 'failure' | 'partial',
    metadata?: Record<string, unknown>
  ): Promise<string | null>;

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

const DEFAULT_MIXIN_CONFIG: TrajectoryMixinConfig = {
  autoStartOnTask: true,
  autoCompleteOnTask: true,
};

// ============================================================================
// Trajectory Mixin
// ============================================================================

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
export function applyTrajectoryMixin<TBase extends Constructor>(
  Base: TBase,
  config: Partial<TrajectoryMixinConfig> = {}
): TBase & Constructor<TrajectoryCapable> {
  const mixinConfig = { ...DEFAULT_MIXIN_CONFIG, ...config };

  return class TrajectoryMixedAgent extends Base implements TrajectoryCapable {
    /** The trajectory tracker instance */
    trajectoryTracker: TrajectoryTracker | null = null;

    /** Current active trajectory ID */
    currentTrajectoryId: string | null = null;

    /** Mixin configuration */
    private trajectoryMixinConfig: TrajectoryMixinConfig = mixinConfig;

    /**
     * Set the trajectory tracker
     *
     * @param tracker - The trajectory tracker to use
     */
    setTrajectoryTracker(tracker: TrajectoryTracker): void {
      this.trajectoryTracker = tracker;
    }

    /**
     * Start tracking a task trajectory
     *
     * @param taskId - The task ID to track
     * @param metadata - Optional metadata to include
     */
    startTaskTrajectory(
      taskId: string,
      metadata: Record<string, unknown> = {}
    ): void {
      if (!this.trajectoryTracker?.isEnabled()) {
        return;
      }

      // Combine default metadata with provided metadata
      const combinedMetadata = {
        ...this.trajectoryMixinConfig.defaultMetadata,
        ...metadata,
        // Include agent info if available from parent class
        agentId: (this as unknown as { config?: { id?: string } }).config?.id,
        agentType: (this as unknown as { config?: { type?: string } }).config?.type,
      };

      this.currentTrajectoryId = this.trajectoryTracker.startTrajectory(
        taskId,
        combinedMetadata
      );
    }

    /**
     * Record a step in the current trajectory
     *
     * @param action - The action taken
     * @param observation - The observation/result of the action
     * @param confidence - Optional confidence score (0-1)
     * @param metadata - Optional step metadata
     */
    recordTrajectoryStep(
      action: string,
      observation: string,
      confidence?: number,
      metadata?: Record<string, unknown>
    ): void {
      if (!this.trajectoryTracker || !this.currentTrajectoryId) {
        return;
      }

      this.trajectoryTracker.recordStep(this.currentTrajectoryId, {
        action,
        observation,
        confidence,
        metadata,
      });
    }

    /**
     * Complete the current trajectory
     *
     * @param outcome - The task outcome
     * @param metadata - Optional final metadata
     * @returns The stored trajectory ID, or null if not stored
     */
    async completeTaskTrajectory(
      outcome: 'success' | 'failure' | 'partial',
      metadata: Record<string, unknown> = {}
    ): Promise<string | null> {
      if (!this.trajectoryTracker || !this.currentTrajectoryId) {
        return null;
      }

      const storedId = await this.trajectoryTracker.completeTrajectory(
        this.currentTrajectoryId,
        outcome,
        metadata
      );

      this.currentTrajectoryId = null;
      return storedId;
    }

    /**
     * Abort the current trajectory
     *
     * @param reason - The reason for aborting
     */
    abortTaskTrajectory(reason: string): void {
      if (!this.trajectoryTracker || !this.currentTrajectoryId) {
        return;
      }

      this.trajectoryTracker.abortTrajectory(this.currentTrajectoryId, reason);
      this.currentTrajectoryId = null;
    }

    /**
     * Check if trajectory tracking is active
     */
    isTrackingTrajectory(): boolean {
      return this.currentTrajectoryId !== null;
    }

    /**
     * Get current trajectory progress
     */
    getTrajectoryProgress(): {
      stepCount: number;
      duration: number;
      lastStep?: TrajectoryStep;
    } | null {
      if (!this.trajectoryTracker || !this.currentTrajectoryId) {
        return null;
      }

      return this.trajectoryTracker.getProgress(this.currentTrajectoryId);
    }

    /**
     * Get mixin configuration
     */
    getTrajectoryMixinConfig(): TrajectoryMixinConfig {
      return { ...this.trajectoryMixinConfig };
    }

    /**
     * Update mixin configuration
     */
    updateTrajectoryMixinConfig(
      config: Partial<TrajectoryMixinConfig>
    ): void {
      this.trajectoryMixinConfig = { ...this.trajectoryMixinConfig, ...config };
    }
  };
}

// ============================================================================
// Standalone Trajectory Wrapper
// ============================================================================

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
export class TrajectoryWrapper implements TrajectoryCapable {
  trajectoryTracker: TrajectoryTracker | null;
  currentTrajectoryId: string | null = null;

  constructor(tracker: TrajectoryTracker | null = null) {
    this.trajectoryTracker = tracker;
  }

  setTrajectoryTracker(tracker: TrajectoryTracker): void {
    this.trajectoryTracker = tracker;
  }

  startTaskTrajectory(
    taskId: string,
    metadata: Record<string, unknown> = {}
  ): void {
    if (!this.trajectoryTracker?.isEnabled()) {
      return;
    }

    this.currentTrajectoryId = this.trajectoryTracker.startTrajectory(
      taskId,
      metadata
    );
  }

  recordTrajectoryStep(
    action: string,
    observation: string,
    confidence?: number,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.trajectoryTracker || !this.currentTrajectoryId) {
      return;
    }

    this.trajectoryTracker.recordStep(this.currentTrajectoryId, {
      action,
      observation,
      confidence,
      metadata,
    });
  }

  async completeTaskTrajectory(
    outcome: 'success' | 'failure' | 'partial',
    metadata: Record<string, unknown> = {}
  ): Promise<string | null> {
    if (!this.trajectoryTracker || !this.currentTrajectoryId) {
      return null;
    }

    const storedId = await this.trajectoryTracker.completeTrajectory(
      this.currentTrajectoryId,
      outcome,
      metadata
    );

    this.currentTrajectoryId = null;
    return storedId;
  }

  abortTaskTrajectory(reason: string): void {
    if (!this.trajectoryTracker || !this.currentTrajectoryId) {
      return;
    }

    this.trajectoryTracker.abortTrajectory(this.currentTrajectoryId, reason);
    this.currentTrajectoryId = null;
  }

  isTrackingTrajectory(): boolean {
    return this.currentTrajectoryId !== null;
  }

  getTrajectoryProgress(): {
    stepCount: number;
    duration: number;
    lastStep?: TrajectoryStep;
  } | null {
    if (!this.trajectoryTracker || !this.currentTrajectoryId) {
      return null;
    }

    return this.trajectoryTracker.getProgress(this.currentTrajectoryId);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a trajectory wrapper instance
 */
export function createTrajectoryWrapper(
  tracker?: TrajectoryTracker | null
): TrajectoryWrapper {
  return new TrajectoryWrapper(tracker ?? null);
}

/**
 * Check if an object has trajectory capabilities
 */
export function hasTrajectoryCapability(obj: unknown): obj is TrajectoryCapable {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'trajectoryTracker' in obj &&
    'setTrajectoryTracker' in obj &&
    'startTaskTrajectory' in obj &&
    'recordTrajectoryStep' in obj &&
    'completeTaskTrajectory' in obj
  );
}
