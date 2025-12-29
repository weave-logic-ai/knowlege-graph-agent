/**
 * Trajectory Tracker
 *
 * Records agent operation sequences for pattern learning.
 * Integrates with the SONA (Self-Optimizing Neural Architecture) engine.
 *
 * The trajectory tracker provides:
 * - Recording of agent operation trajectories
 * - Pattern detection from historical trajectories
 * - Learning records for SONA integration
 * - Success/failure analysis
 * - Recommendations based on learned patterns
 *
 * @module vector/services/trajectory-tracker
 *
 * @example
 * ```typescript
 * import { createTrajectoryTracker } from './trajectory-tracker.js';
 *
 * const tracker = createTrajectoryTracker({
 *   maxTrajectories: 1000,
 *   enableAutoLearning: true,
 * });
 *
 * // Start a new trajectory
 * const trajectoryId = tracker.startTrajectory('agent-1', 'workflow-1');
 *
 * // Add steps as the agent works
 * tracker.addStep(trajectoryId, {
 *   action: 'analyze_document',
 *   state: { documentId: 'doc-123', status: 'processing' },
 *   outcome: 'success',
 *   duration: 1500,
 * });
 *
 * // Finalize when done
 * tracker.finalizeTrajectory(trajectoryId, { success: true });
 *
 * // Get recommendations for future actions
 * const recommendations = tracker.getRecommendedActions('analyze_document');
 * ```
 */

import type {
  TrajectoryStep,
  AgentTrajectory,
  SonaLearningRecord,
} from '../types.js';
import { createLogger } from '../../utils/index.js';

const logger = createLogger('trajectory-tracker');

/**
 * Trajectory tracker configuration
 *
 * @property maxTrajectories - Maximum number of trajectories to keep in memory
 * @property maxStepsPerTrajectory - Maximum steps per trajectory
 * @property enableAutoLearning - Enable auto-learning from successful trajectories
 * @property minSuccessRateForLearning - Minimum success rate to learn from
 * @property patternThreshold - Number of occurrences before pattern is learned
 */
export interface TrajectoryTrackerConfig {
  /** Maximum number of trajectories to keep in memory */
  maxTrajectories?: number;
  /** Maximum steps per trajectory */
  maxStepsPerTrajectory?: number;
  /** Enable auto-learning from successful trajectories */
  enableAutoLearning?: boolean;
  /** Minimum success rate to learn from */
  minSuccessRateForLearning?: number;
  /** Pattern extraction threshold */
  patternThreshold?: number;
}

/**
 * Active trajectory being recorded
 * @internal
 */
interface ActiveTrajectory {
  trajectory: AgentTrajectory;
  startTime: number;
}

/**
 * Pattern detected from trajectories
 *
 * Represents a sequence of actions that has been observed multiple times
 * and can be used to predict or recommend future actions.
 */
export interface DetectedPattern {
  /** Unique identifier for this pattern */
  id: string;

  /** Type of pattern (success, failure, or optimization opportunity) */
  type: 'success' | 'failure' | 'optimization';

  /** Sequence of actions in this pattern */
  actions: string[];

  /** Number of times this pattern has been observed */
  frequency: number;

  /** Average duration of trajectories with this pattern */
  avgDuration: number;

  /** Success rate of trajectories with this pattern */
  successRate: number;

  /** Confidence level in this pattern (0-1) */
  confidence: number;

  /** Additional metadata about the pattern */
  metadata: Record<string, unknown>;
}

/**
 * Trajectory Tracker class
 *
 * Provides comprehensive tracking and learning from agent operation sequences.
 * This is a core component for the SONA (Self-Optimizing Neural Architecture)
 * system, enabling agents to learn from past experiences and improve over time.
 *
 * Key capabilities:
 * - **Recording**: Track agent operations as trajectories
 * - **Pattern Detection**: Identify recurring action sequences
 * - **Learning**: Create learning records from successful patterns
 * - **Recommendations**: Suggest next actions based on patterns
 * - **Analytics**: Provide statistics on trajectory performance
 *
 * @example
 * ```typescript
 * const tracker = new TrajectoryTracker({
 *   maxTrajectories: 500,
 *   enableAutoLearning: true,
 *   patternThreshold: 5,
 * });
 *
 * // Use throughout agent lifecycle
 * const id = tracker.startTrajectory('my-agent');
 * tracker.addStep(id, { action: 'step1', outcome: 'success' });
 * tracker.addStep(id, { action: 'step2', outcome: 'success' });
 * const trajectory = tracker.finalizeTrajectory(id, { success: true });
 *
 * // Analyze patterns
 * const patterns = tracker.getPatterns({ minConfidence: 0.8 });
 * ```
 */
export class TrajectoryTracker {
  private config: Required<TrajectoryTrackerConfig>;
  private activeTrajectories: Map<string, ActiveTrajectory> = new Map();
  private completedTrajectories: AgentTrajectory[] = [];
  private learningRecords: SonaLearningRecord[] = [];
  private detectedPatterns: Map<string, DetectedPattern> = new Map();

  /**
   * Create a new TrajectoryTracker instance
   *
   * @param config - Configuration options for the tracker
   */
  constructor(config: TrajectoryTrackerConfig = {}) {
    this.config = {
      maxTrajectories: config.maxTrajectories ?? 1000,
      maxStepsPerTrajectory: config.maxStepsPerTrajectory ?? 100,
      enableAutoLearning: config.enableAutoLearning ?? true,
      minSuccessRateForLearning: config.minSuccessRateForLearning ?? 0.7,
      patternThreshold: config.patternThreshold ?? 3,
    };
  }

  /**
   * Start a new trajectory for an agent
   *
   * Creates a new trajectory record that will track the agent's operations.
   * The trajectory must be finalized with `finalizeTrajectory` when complete.
   *
   * @param agentId - Unique identifier for the agent
   * @param workflowId - Optional workflow this trajectory belongs to
   * @param metadata - Optional additional metadata
   * @returns The unique trajectory ID for tracking
   *
   * @example
   * ```typescript
   * const trajectoryId = tracker.startTrajectory(
   *   'researcher-agent-1',
   *   'research-workflow-123',
   *   { priority: 'high', source: 'user-request' }
   * );
   * ```
   */
  startTrajectory(
    agentId: string,
    workflowId?: string,
    metadata?: Record<string, unknown>
  ): string {
    const trajectoryId = `traj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const trajectory: AgentTrajectory = {
      id: trajectoryId,
      agentId,
      workflowId,
      steps: [],
      startedAt: new Date(),
      success: false,
      totalDuration: 0,
      metadata,
    };

    this.activeTrajectories.set(trajectoryId, {
      trajectory,
      startTime: Date.now(),
    });

    logger.debug('Started trajectory', { trajectoryId, agentId, workflowId });
    return trajectoryId;
  }

  /**
   * Add a step to an active trajectory
   *
   * Records a single operation/action taken by the agent as part of
   * the trajectory. Steps are added in order and include timing information.
   *
   * @param trajectoryId - The trajectory to add the step to
   * @param step - The step data (timestamp is auto-added)
   *
   * @example
   * ```typescript
   * tracker.addStep(trajectoryId, {
   *   action: 'analyze_document',
   *   state: { documentId: 'doc-123', status: 'processing', progress: 0.5 },
   *   outcome: 'success',
   *   duration: 2500,
   *   metadata: { model: 'claude-3-opus' }
   * });
   * ```
   */
  addStep(
    trajectoryId: string,
    step: Omit<TrajectoryStep, 'timestamp'>
  ): void {
    const active = this.activeTrajectories.get(trajectoryId);
    if (!active) {
      logger.warn('Trajectory not found', { trajectoryId });
      return;
    }

    if (active.trajectory.steps.length >= this.config.maxStepsPerTrajectory) {
      logger.warn('Max steps reached for trajectory', { trajectoryId });
      return;
    }

    const fullStep: TrajectoryStep = {
      ...step,
      timestamp: new Date(),
    };

    active.trajectory.steps.push(fullStep);
    logger.debug('Added step to trajectory', {
      trajectoryId,
      action: step.action,
      outcome: step.outcome,
    });
  }

  /**
   * Finalize a trajectory
   *
   * Marks a trajectory as complete, calculates total duration, and
   * optionally triggers pattern learning if auto-learning is enabled.
   *
   * @param trajectoryId - The trajectory to finalize
   * @param options - Finalization options including success status
   * @returns The finalized trajectory, or null if not found
   *
   * @example
   * ```typescript
   * const trajectory = tracker.finalizeTrajectory(trajectoryId, {
   *   success: true,
   *   metadata: { finalScore: 0.95 }
   * });
   *
   * if (trajectory) {
   *   console.log(`Completed in ${trajectory.totalDuration}ms`);
   * }
   * ```
   */
  finalizeTrajectory(
    trajectoryId: string,
    options: {
      success: boolean;
      metadata?: Record<string, unknown>;
    }
  ): AgentTrajectory | null {
    const active = this.activeTrajectories.get(trajectoryId);
    if (!active) {
      logger.warn('Trajectory not found for finalization', { trajectoryId });
      return null;
    }

    const trajectory = active.trajectory;
    trajectory.completedAt = new Date();
    trajectory.success = options.success;
    trajectory.totalDuration = Date.now() - active.startTime;

    if (options.metadata) {
      trajectory.metadata = { ...trajectory.metadata, ...options.metadata };
    }

    // Move to completed
    this.activeTrajectories.delete(trajectoryId);
    this.completedTrajectories.push(trajectory);

    // Prune old trajectories
    while (this.completedTrajectories.length > this.config.maxTrajectories) {
      this.completedTrajectories.shift();
    }

    // Auto-learn if enabled
    if (this.config.enableAutoLearning && options.success) {
      this.learnFromTrajectory(trajectory);
    }

    logger.info('Finalized trajectory', {
      trajectoryId,
      success: options.success,
      steps: trajectory.steps.length,
      duration: trajectory.totalDuration,
    });

    return trajectory;
  }

  /**
   * Learn patterns from a successful trajectory
   *
   * Extracts action sequences from the trajectory and updates pattern
   * frequency and confidence metrics. Creates learning records when
   * patterns exceed the configured threshold.
   *
   * @param trajectory - The trajectory to learn from
   * @internal
   */
  private learnFromTrajectory(trajectory: AgentTrajectory): void {
    if (trajectory.steps.length < 2) return;

    // Extract action sequence
    const actions = trajectory.steps.map((s) => s.action);
    const patternId = this.generatePatternId(actions);

    // Check if pattern exists
    const existing = this.detectedPatterns.get(patternId);
    if (existing) {
      // Update existing pattern
      existing.frequency++;
      existing.avgDuration =
        (existing.avgDuration + trajectory.totalDuration) / 2;
      existing.successRate = trajectory.success
        ? (existing.successRate * (existing.frequency - 1) + 1) /
          existing.frequency
        : (existing.successRate * (existing.frequency - 1)) /
          existing.frequency;
      existing.confidence = Math.min(1, existing.frequency / 10);
    } else {
      // Create new pattern
      const pattern: DetectedPattern = {
        id: patternId,
        type: 'success',
        actions,
        frequency: 1,
        avgDuration: trajectory.totalDuration,
        successRate: trajectory.success ? 1 : 0,
        confidence: 0.1,
        metadata: {},
      };
      this.detectedPatterns.set(patternId, pattern);
    }

    // Create learning record when pattern exceeds threshold
    if (
      this.detectedPatterns.get(patternId)!.frequency >=
      this.config.patternThreshold
    ) {
      const record: SonaLearningRecord = {
        trajectoryId: trajectory.id,
        patternId,
        patternType: 'success',
        confidence: this.detectedPatterns.get(patternId)!.confidence,
        learnedAt: new Date(),
        appliedCount: 0,
      };
      this.learningRecords.push(record);

      logger.info('Learned pattern from trajectory', {
        patternId,
        frequency: this.detectedPatterns.get(patternId)!.frequency,
      });
    }
  }

  /**
   * Generate a pattern ID from action sequence
   *
   * Creates a unique identifier for a pattern by joining action names.
   *
   * @param actions - Array of action names
   * @returns Pattern identifier string
   * @internal
   */
  private generatePatternId(actions: string[]): string {
    return actions.join('->');
  }

  /**
   * Get recommended actions based on current state
   *
   * Analyzes detected patterns to suggest the most likely next actions
   * based on the current action being performed.
   *
   * @param currentAction - The action currently being performed
   * @param context - Optional context for more targeted recommendations
   * @returns Array of recommended actions sorted by confidence
   *
   * @example
   * ```typescript
   * const recommendations = tracker.getRecommendedActions('analyze_document');
   *
   * for (const rec of recommendations) {
   *   console.log(`Suggested: ${rec.action} (${rec.confidence.toFixed(2)} confidence)`);
   * }
   * ```
   */
  getRecommendedActions(
    currentAction: string,
    context?: Record<string, unknown>
  ): Array<{ action: string; confidence: number; basedOn: string }> {
    const recommendations: Array<{
      action: string;
      confidence: number;
      basedOn: string;
    }> = [];

    for (const [patternId, pattern] of this.detectedPatterns) {
      const actionIndex = pattern.actions.indexOf(currentAction);
      if (actionIndex >= 0 && actionIndex < pattern.actions.length - 1) {
        const nextAction = pattern.actions[actionIndex + 1];
        recommendations.push({
          action: nextAction,
          confidence: pattern.confidence * pattern.successRate,
          basedOn: patternId,
        });
      }
    }

    // Sort by confidence (highest first)
    recommendations.sort((a, b) => b.confidence - a.confidence);
    return recommendations.slice(0, 5);
  }

  /**
   * Get trajectory by ID
   *
   * Retrieves a trajectory from either active or completed trajectories.
   *
   * @param trajectoryId - The trajectory ID to look up
   * @returns The trajectory if found, null otherwise
   */
  getTrajectory(trajectoryId: string): AgentTrajectory | null {
    // Check active first
    const active = this.activeTrajectories.get(trajectoryId);
    if (active) return active.trajectory;

    // Check completed
    return (
      this.completedTrajectories.find((t) => t.id === trajectoryId) || null
    );
  }

  /**
   * Get all trajectories for an agent
   *
   * Retrieves all completed trajectories that were executed by a specific agent.
   *
   * @param agentId - The agent ID to filter by
   * @returns Array of trajectories for the agent
   */
  getAgentTrajectories(agentId: string): AgentTrajectory[] {
    return this.completedTrajectories.filter((t) => t.agentId === agentId);
  }

  /**
   * Get trajectories for a workflow
   *
   * Retrieves all completed trajectories that belong to a specific workflow.
   *
   * @param workflowId - The workflow ID to filter by
   * @returns Array of trajectories for the workflow
   */
  getWorkflowTrajectories(workflowId: string): AgentTrajectory[] {
    return this.completedTrajectories.filter((t) => t.workflowId === workflowId);
  }

  /**
   * Get detected patterns
   *
   * Retrieves patterns that have been detected from trajectory analysis,
   * optionally filtered by confidence level or pattern type.
   *
   * @param options - Filter options
   * @returns Array of patterns sorted by confidence
   *
   * @example
   * ```typescript
   * // Get high-confidence success patterns
   * const patterns = tracker.getPatterns({
   *   minConfidence: 0.8,
   *   type: 'success'
   * });
   * ```
   */
  getPatterns(options?: {
    minConfidence?: number;
    type?: 'success' | 'failure' | 'optimization';
  }): DetectedPattern[] {
    let patterns = Array.from(this.detectedPatterns.values());

    if (options?.minConfidence !== undefined) {
      const minConf = options.minConfidence;
      patterns = patterns.filter((p) => p.confidence >= minConf);
    }

    if (options?.type) {
      patterns = patterns.filter((p) => p.type === options.type);
    }

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get learning records
   *
   * Retrieves SONA learning records, optionally filtered by pattern ID
   * or time range.
   *
   * @param options - Filter options
   * @returns Array of learning records
   *
   * @example
   * ```typescript
   * // Get recent learning records
   * const records = tracker.getLearningRecords({
   *   since: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
   * });
   * ```
   */
  getLearningRecords(options?: {
    patternId?: string;
    since?: Date;
  }): SonaLearningRecord[] {
    let records = [...this.learningRecords];

    if (options?.patternId) {
      records = records.filter((r) => r.patternId === options.patternId);
    }

    if (options?.since !== undefined) {
      const sinceDate = options.since;
      records = records.filter((r) => r.learnedAt >= sinceDate);
    }

    return records;
  }

  /**
   * Get statistics about trajectory tracking
   *
   * Provides aggregate statistics about trajectories, patterns,
   * and learning performance.
   *
   * @returns Statistics object with counts and rates
   *
   * @example
   * ```typescript
   * const stats = tracker.getStats();
   * console.log(`Success rate: ${(stats.successRate * 100).toFixed(1)}%`);
   * console.log(`Patterns detected: ${stats.detectedPatterns}`);
   * ```
   */
  getStats(): {
    activeTrajectories: number;
    completedTrajectories: number;
    detectedPatterns: number;
    learningRecords: number;
    successRate: number;
    avgDuration: number;
  } {
    const completed = this.completedTrajectories;
    const successCount = completed.filter((t) => t.success).length;
    const totalDuration = completed.reduce((sum, t) => sum + t.totalDuration, 0);

    return {
      activeTrajectories: this.activeTrajectories.size,
      completedTrajectories: completed.length,
      detectedPatterns: this.detectedPatterns.size,
      learningRecords: this.learningRecords.length,
      successRate: completed.length > 0 ? successCount / completed.length : 0,
      avgDuration: completed.length > 0 ? totalDuration / completed.length : 0,
    };
  }

  /**
   * Clear all trajectory data
   *
   * Removes all active trajectories, completed trajectories, learning records,
   * and detected patterns. Use with caution as this is irreversible.
   */
  clear(): void {
    this.activeTrajectories.clear();
    this.completedTrajectories = [];
    this.learningRecords = [];
    this.detectedPatterns.clear();
    logger.info('Trajectory tracker cleared');
  }

  /**
   * Export data for persistence
   *
   * Serializes all trajectory data for storage or transfer.
   * Use with `import()` to restore data.
   *
   * @returns Exportable data object
   *
   * @example
   * ```typescript
   * const data = tracker.export();
   * await fs.writeFile('trajectories.json', JSON.stringify(data));
   * ```
   */
  export(): {
    trajectories: AgentTrajectory[];
    patterns: DetectedPattern[];
    learningRecords: SonaLearningRecord[];
  } {
    return {
      trajectories: [...this.completedTrajectories],
      patterns: Array.from(this.detectedPatterns.values()),
      learningRecords: [...this.learningRecords],
    };
  }

  /**
   * Import data from persistence
   *
   * Restores trajectory data from a previous export.
   *
   * @param data - Previously exported data object
   *
   * @example
   * ```typescript
   * const data = JSON.parse(await fs.readFile('trajectories.json', 'utf-8'));
   * tracker.import(data);
   * ```
   */
  import(data: {
    trajectories?: AgentTrajectory[];
    patterns?: DetectedPattern[];
    learningRecords?: SonaLearningRecord[];
  }): void {
    if (data.trajectories) {
      this.completedTrajectories = data.trajectories.slice(
        -this.config.maxTrajectories
      );
    }
    if (data.patterns) {
      for (const pattern of data.patterns) {
        this.detectedPatterns.set(pattern.id, pattern);
      }
    }
    if (data.learningRecords) {
      this.learningRecords = data.learningRecords;
    }
    logger.info('Imported trajectory data', {
      trajectories: this.completedTrajectories.length,
      patterns: this.detectedPatterns.size,
      learningRecords: this.learningRecords.length,
    });
  }
}

/**
 * Create a trajectory tracker instance
 *
 * Factory function for creating a TrajectoryTracker with the specified
 * configuration.
 *
 * @param config - Optional configuration options
 * @returns New TrajectoryTracker instance
 *
 * @example
 * ```typescript
 * import { createTrajectoryTracker } from './trajectory-tracker.js';
 *
 * const tracker = createTrajectoryTracker({
 *   maxTrajectories: 500,
 *   enableAutoLearning: true,
 *   patternThreshold: 5,
 * });
 * ```
 */
export function createTrajectoryTracker(
  config?: TrajectoryTrackerConfig
): TrajectoryTracker {
  return new TrajectoryTracker(config);
}
