import { createLogger } from "../../utils/logger.js";
const logger = createLogger("trajectory-tracker");
class TrajectoryTracker {
  config;
  activeTrajectories = /* @__PURE__ */ new Map();
  completedTrajectories = [];
  learningRecords = [];
  detectedPatterns = /* @__PURE__ */ new Map();
  /**
   * Create a new TrajectoryTracker instance
   *
   * @param config - Configuration options for the tracker
   */
  constructor(config = {}) {
    this.config = {
      maxTrajectories: config.maxTrajectories ?? 1e3,
      maxStepsPerTrajectory: config.maxStepsPerTrajectory ?? 100,
      enableAutoLearning: config.enableAutoLearning ?? true,
      minSuccessRateForLearning: config.minSuccessRateForLearning ?? 0.7,
      patternThreshold: config.patternThreshold ?? 3
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
  startTrajectory(agentId, workflowId, metadata) {
    const trajectoryId = `traj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const trajectory = {
      id: trajectoryId,
      agentId,
      workflowId,
      steps: [],
      startedAt: /* @__PURE__ */ new Date(),
      success: false,
      totalDuration: 0,
      metadata
    };
    this.activeTrajectories.set(trajectoryId, {
      trajectory,
      startTime: Date.now()
    });
    logger.debug("Started trajectory", { trajectoryId, agentId, workflowId });
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
  addStep(trajectoryId, step) {
    const active = this.activeTrajectories.get(trajectoryId);
    if (!active) {
      logger.warn("Trajectory not found", { trajectoryId });
      return;
    }
    if (active.trajectory.steps.length >= this.config.maxStepsPerTrajectory) {
      logger.warn("Max steps reached for trajectory", { trajectoryId });
      return;
    }
    const fullStep = {
      ...step,
      timestamp: /* @__PURE__ */ new Date()
    };
    active.trajectory.steps.push(fullStep);
    logger.debug("Added step to trajectory", {
      trajectoryId,
      action: step.action,
      outcome: step.outcome
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
  finalizeTrajectory(trajectoryId, options) {
    const active = this.activeTrajectories.get(trajectoryId);
    if (!active) {
      logger.warn("Trajectory not found for finalization", { trajectoryId });
      return null;
    }
    const trajectory = active.trajectory;
    trajectory.completedAt = /* @__PURE__ */ new Date();
    trajectory.success = options.success;
    trajectory.totalDuration = Date.now() - active.startTime;
    if (options.metadata) {
      trajectory.metadata = { ...trajectory.metadata, ...options.metadata };
    }
    this.activeTrajectories.delete(trajectoryId);
    this.completedTrajectories.push(trajectory);
    while (this.completedTrajectories.length > this.config.maxTrajectories) {
      this.completedTrajectories.shift();
    }
    if (this.config.enableAutoLearning && options.success) {
      this.learnFromTrajectory(trajectory);
    }
    logger.info("Finalized trajectory", {
      trajectoryId,
      success: options.success,
      steps: trajectory.steps.length,
      duration: trajectory.totalDuration
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
  learnFromTrajectory(trajectory) {
    if (trajectory.steps.length < 2) return;
    const actions = trajectory.steps.map((s) => s.action);
    const patternId = this.generatePatternId(actions);
    const existing = this.detectedPatterns.get(patternId);
    if (existing) {
      existing.frequency++;
      existing.avgDuration = (existing.avgDuration + trajectory.totalDuration) / 2;
      existing.successRate = trajectory.success ? (existing.successRate * (existing.frequency - 1) + 1) / existing.frequency : existing.successRate * (existing.frequency - 1) / existing.frequency;
      existing.confidence = Math.min(1, existing.frequency / 10);
    } else {
      const pattern = {
        id: patternId,
        type: "success",
        actions,
        frequency: 1,
        avgDuration: trajectory.totalDuration,
        successRate: trajectory.success ? 1 : 0,
        confidence: 0.1,
        metadata: {}
      };
      this.detectedPatterns.set(patternId, pattern);
    }
    if (this.detectedPatterns.get(patternId).frequency >= this.config.patternThreshold) {
      const record = {
        trajectoryId: trajectory.id,
        patternId,
        patternType: "success",
        confidence: this.detectedPatterns.get(patternId).confidence,
        learnedAt: /* @__PURE__ */ new Date(),
        appliedCount: 0
      };
      this.learningRecords.push(record);
      logger.info("Learned pattern from trajectory", {
        patternId,
        frequency: this.detectedPatterns.get(patternId).frequency
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
  generatePatternId(actions) {
    return actions.join("->");
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
  getRecommendedActions(currentAction, context) {
    const recommendations = [];
    for (const [patternId, pattern] of this.detectedPatterns) {
      const actionIndex = pattern.actions.indexOf(currentAction);
      if (actionIndex >= 0 && actionIndex < pattern.actions.length - 1) {
        const nextAction = pattern.actions[actionIndex + 1];
        recommendations.push({
          action: nextAction,
          confidence: pattern.confidence * pattern.successRate,
          basedOn: patternId
        });
      }
    }
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
  getTrajectory(trajectoryId) {
    const active = this.activeTrajectories.get(trajectoryId);
    if (active) return active.trajectory;
    return this.completedTrajectories.find((t) => t.id === trajectoryId) || null;
  }
  /**
   * Get all trajectories for an agent
   *
   * Retrieves all completed trajectories that were executed by a specific agent.
   *
   * @param agentId - The agent ID to filter by
   * @returns Array of trajectories for the agent
   */
  getAgentTrajectories(agentId) {
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
  getWorkflowTrajectories(workflowId) {
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
  getPatterns(options) {
    let patterns = Array.from(this.detectedPatterns.values());
    if (options?.minConfidence !== void 0) {
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
  getLearningRecords(options) {
    let records = [...this.learningRecords];
    if (options?.patternId) {
      records = records.filter((r) => r.patternId === options.patternId);
    }
    if (options?.since !== void 0) {
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
  getStats() {
    const completed = this.completedTrajectories;
    const successCount = completed.filter((t) => t.success).length;
    const totalDuration = completed.reduce((sum, t) => sum + t.totalDuration, 0);
    return {
      activeTrajectories: this.activeTrajectories.size,
      completedTrajectories: completed.length,
      detectedPatterns: this.detectedPatterns.size,
      learningRecords: this.learningRecords.length,
      successRate: completed.length > 0 ? successCount / completed.length : 0,
      avgDuration: completed.length > 0 ? totalDuration / completed.length : 0
    };
  }
  /**
   * Clear all trajectory data
   *
   * Removes all active trajectories, completed trajectories, learning records,
   * and detected patterns. Use with caution as this is irreversible.
   */
  clear() {
    this.activeTrajectories.clear();
    this.completedTrajectories = [];
    this.learningRecords = [];
    this.detectedPatterns.clear();
    logger.info("Trajectory tracker cleared");
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
  export() {
    return {
      trajectories: [...this.completedTrajectories],
      patterns: Array.from(this.detectedPatterns.values()),
      learningRecords: [...this.learningRecords]
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
  import(data) {
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
    logger.info("Imported trajectory data", {
      trajectories: this.completedTrajectories.length,
      patterns: this.detectedPatterns.size,
      learningRecords: this.learningRecords.length
    });
  }
}
function createTrajectoryTracker(config) {
  return new TrajectoryTracker(config);
}
export {
  TrajectoryTracker,
  createTrajectoryTracker
};
//# sourceMappingURL=trajectory-tracker.js.map
