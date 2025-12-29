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
import type { TrajectoryStep, AgentTrajectory, SonaLearningRecord } from '../types.js';
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
export declare class TrajectoryTracker {
    private config;
    private activeTrajectories;
    private completedTrajectories;
    private learningRecords;
    private detectedPatterns;
    /**
     * Create a new TrajectoryTracker instance
     *
     * @param config - Configuration options for the tracker
     */
    constructor(config?: TrajectoryTrackerConfig);
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
    startTrajectory(agentId: string, workflowId?: string, metadata?: Record<string, unknown>): string;
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
    addStep(trajectoryId: string, step: Omit<TrajectoryStep, 'timestamp'>): void;
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
    finalizeTrajectory(trajectoryId: string, options: {
        success: boolean;
        metadata?: Record<string, unknown>;
    }): AgentTrajectory | null;
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
    private learnFromTrajectory;
    /**
     * Generate a pattern ID from action sequence
     *
     * Creates a unique identifier for a pattern by joining action names.
     *
     * @param actions - Array of action names
     * @returns Pattern identifier string
     * @internal
     */
    private generatePatternId;
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
    getRecommendedActions(currentAction: string, context?: Record<string, unknown>): Array<{
        action: string;
        confidence: number;
        basedOn: string;
    }>;
    /**
     * Get trajectory by ID
     *
     * Retrieves a trajectory from either active or completed trajectories.
     *
     * @param trajectoryId - The trajectory ID to look up
     * @returns The trajectory if found, null otherwise
     */
    getTrajectory(trajectoryId: string): AgentTrajectory | null;
    /**
     * Get all trajectories for an agent
     *
     * Retrieves all completed trajectories that were executed by a specific agent.
     *
     * @param agentId - The agent ID to filter by
     * @returns Array of trajectories for the agent
     */
    getAgentTrajectories(agentId: string): AgentTrajectory[];
    /**
     * Get trajectories for a workflow
     *
     * Retrieves all completed trajectories that belong to a specific workflow.
     *
     * @param workflowId - The workflow ID to filter by
     * @returns Array of trajectories for the workflow
     */
    getWorkflowTrajectories(workflowId: string): AgentTrajectory[];
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
    }): DetectedPattern[];
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
    }): SonaLearningRecord[];
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
    };
    /**
     * Clear all trajectory data
     *
     * Removes all active trajectories, completed trajectories, learning records,
     * and detected patterns. Use with caution as this is irreversible.
     */
    clear(): void;
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
    };
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
    }): void;
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
export declare function createTrajectoryTracker(config?: TrajectoryTrackerConfig): TrajectoryTracker;
//# sourceMappingURL=trajectory-tracker.d.ts.map