import { retry } from "../utils/error-recovery.js";
import { getLogger } from "../utils/logger.js";
import { createAgentId, AgentStatus, MessageType, TaskPriority, createTaskId } from "./types.js";
class BaseAgent {
  /** Agent configuration */
  config;
  /** Agent runtime state */
  _state;
  /** Logger instance */
  logger;
  /** Message handlers for different message types */
  messageHandlers = /* @__PURE__ */ new Map();
  /** Trajectory tracker for learning */
  trajectoryTracker = null;
  /** Current active trajectory ID */
  currentTrajectoryId = null;
  /** Whether to auto-track trajectories */
  autoTrackTrajectories = true;
  constructor(config) {
    this.config = {
      ...config,
      id: config.id ?? createAgentId(config.type)
    };
    this._state = {
      id: this.config.id,
      status: AgentStatus.IDLE,
      taskQueue: [],
      completedTasks: [],
      lastActivity: /* @__PURE__ */ new Date(),
      errorCount: 0
    };
    this.logger = getLogger().child(`agent:${this.config.name}`);
    this.registerDefaultMessageHandlers();
  }
  // ============================================================================
  // State Management
  // ============================================================================
  /**
   * Get current agent state
   */
  get state() {
    return { ...this._state };
  }
  /**
   * Get current agent status
   */
  getStatus() {
    return this._state.status;
  }
  /**
   * Update agent status
   */
  setStatus(status) {
    const previousStatus = this._state.status;
    this._state.status = status;
    this._state.lastActivity = /* @__PURE__ */ new Date();
    if (previousStatus !== status) {
      this.logger.debug(`Status changed: ${previousStatus} -> ${status}`);
    }
  }
  // ============================================================================
  // Task Execution
  // ============================================================================
  /**
   * Execute a task
   *
   * This is the main entry point for task execution. It handles:
   * - Pre-task hooks (if enabled)
   * - Input validation
   * - Retry logic
   * - Timeout handling
   * - Post-task hooks (if enabled)
   * - Error handling and logging
   */
  async execute(task) {
    const startTime = /* @__PURE__ */ new Date();
    this.logger.info(`Executing task: ${task.id}`, {
      description: task.description,
      priority: task.priority
    });
    if (this.config.claudeFlow?.hooks?.preTask) {
      await this.runClaudeFlowHook("pre-task", task);
    }
    if (this.autoTrackTrajectories && this.trajectoryTracker?.isEnabled()) {
      this.startTrajectory(task.id, {
        description: task.description,
        priority: task.priority,
        input: task.input
      });
      this.recordStep("task_started", `Starting task: ${task.description}`, 1);
    }
    try {
      const validationResult = await this.validateInput(task);
      if (!validationResult.valid) {
        this.recordStep("validation_failed", validationResult.error ?? "Input validation failed", 0);
        await this.completeTrajectory("failure", { validationError: validationResult.error });
        return this.createErrorResult(
          "VALIDATION_ERROR",
          validationResult.error ?? "Input validation failed",
          startTime
        );
      }
      this.recordStep("validation_passed", "Input validation successful", 1);
      this.setStatus(AgentStatus.RUNNING);
      this._state.currentTask = task;
      let result;
      const retryConfig = this.config.retry;
      if (retryConfig && retryConfig.maxRetries > 0) {
        const retryOptions = {
          maxRetries: retryConfig.maxRetries,
          initialDelay: retryConfig.backoffMs,
          backoffFactor: retryConfig.backoffMultiplier ?? 2,
          isRetryable: (error) => this.isRetryableError(error)
        };
        result = await retry(
          async () => this.executeWithTimeout(task),
          retryOptions
        );
      } else {
        result = await this.executeWithTimeout(task);
      }
      if (result.success) {
        this._state.completedTasks.push(task.id);
        this.setStatus(AgentStatus.COMPLETED);
        this.recordStep("task_completed", "Task completed successfully", 1, { success: true });
        await this.completeTrajectory("success", {
          durationMs: result.metrics?.durationMs,
          artifactCount: result.artifacts?.length ?? 0
        });
      } else {
        this._state.errorCount++;
        this.setStatus(AgentStatus.FAILED);
        this.recordStep("task_failed", result.error?.message ?? "Task failed", 0, { error: result.error });
        await this.completeTrajectory("failure", {
          errorCode: result.error?.code,
          errorMessage: result.error?.message
        });
      }
      result.metrics = this.calculateMetrics(startTime, /* @__PURE__ */ new Date());
      if (this.config.claudeFlow?.hooks?.postTask) {
        await this.runClaudeFlowHook("post-task", task, result);
      }
      return result;
    } catch (error) {
      this._state.errorCount++;
      this.setStatus(AgentStatus.FAILED);
      const agentError = this.normalizeError(error);
      this.logger.error(`Task execution failed: ${task.id}`, error);
      this.recordStep("task_exception", agentError.message, 0, {
        errorCode: agentError.code,
        stack: agentError.stack
      });
      await this.completeTrajectory("failure", {
        exception: true,
        errorCode: agentError.code,
        errorMessage: agentError.message
      });
      return this.createErrorResult(agentError.code, agentError.message, startTime, {
        stack: agentError.stack,
        retryable: agentError.retryable
      });
    } finally {
      this._state.currentTask = void 0;
      this._state.lastActivity = /* @__PURE__ */ new Date();
    }
  }
  /**
   * Execute task with timeout
   */
  async executeWithTimeout(task) {
    const timeout = task.timeout ?? this.config.taskTimeout ?? 3e4;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Task execution timed out after ${timeout}ms`));
      }, timeout);
      this.executeTask(task).then((result) => {
        clearTimeout(timer);
        resolve(result);
      }).catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }
  // ============================================================================
  // Input Validation
  // ============================================================================
  /**
   * Validate task input
   *
   * Override this method to implement custom validation logic.
   */
  async validateInput(task) {
    if (!task.id) {
      return { valid: false, error: "Task ID is required" };
    }
    if (!task.description) {
      return { valid: false, error: "Task description is required" };
    }
    if (task.dependencies && task.dependencies.length > 0) {
      const unresolvedDeps = task.dependencies.filter(
        (dep) => !this._state.completedTasks.includes(dep)
      );
      if (unresolvedDeps.length > 0) {
        return {
          valid: false,
          error: `Unresolved dependencies: ${unresolvedDeps.join(", ")}`
        };
      }
    }
    return { valid: true };
  }
  // ============================================================================
  // Output Formatting
  // ============================================================================
  /**
   * Format successful output
   */
  formatOutput(data, artifacts) {
    return {
      success: true,
      data,
      artifacts,
      metadata: {
        agentId: this.config.id,
        agentType: this.config.type,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
  }
  /**
   * Create a success result
   */
  createSuccessResult(data, startTime, artifacts) {
    return {
      success: true,
      data,
      artifacts,
      metrics: this.calculateMetrics(startTime, /* @__PURE__ */ new Date()),
      metadata: {
        agentId: this.config.id,
        agentType: this.config.type
      }
    };
  }
  /**
   * Create an error result
   */
  createErrorResult(code, message, startTime, details) {
    return {
      success: false,
      error: {
        code,
        message,
        ...details
      },
      metrics: this.calculateMetrics(startTime, /* @__PURE__ */ new Date()),
      metadata: {
        agentId: this.config.id,
        agentType: this.config.type
      }
    };
  }
  /**
   * Calculate execution metrics
   */
  calculateMetrics(startTime, endTime) {
    return {
      startTime,
      endTime,
      durationMs: endTime.getTime() - startTime.getTime(),
      memoryUsage: process.memoryUsage?.().heapUsed,
      retries: 0
      // Updated by retry logic if needed
    };
  }
  // ============================================================================
  // Error Handling
  // ============================================================================
  /**
   * Normalize error to AgentError format
   */
  normalizeError(error) {
    if (error instanceof Error) {
      return {
        code: error.name || "UNKNOWN_ERROR",
        message: error.message,
        stack: error.stack,
        retryable: this.isRetryableError(error)
      };
    }
    return {
      code: "UNKNOWN_ERROR",
      message: String(error),
      retryable: false
    };
  }
  /**
   * Check if an error is retryable
   */
  isRetryableError(error) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes("timeout") || message.includes("network") || message.includes("connection") || message.includes("econnreset") || message.includes("rate limit")) {
        return true;
      }
    }
    return false;
  }
  // ============================================================================
  // Lifecycle Methods
  // ============================================================================
  /**
   * Pause the agent
   */
  async pause() {
    if (this._state.status === AgentStatus.RUNNING) {
      this.logger.info("Pausing agent");
      this.setStatus(AgentStatus.PAUSED);
    }
  }
  /**
   * Resume the agent
   */
  async resume() {
    if (this._state.status === AgentStatus.PAUSED) {
      this.logger.info("Resuming agent");
      this.setStatus(AgentStatus.IDLE);
    }
  }
  /**
   * Terminate the agent
   */
  async terminate() {
    this.logger.info("Terminating agent");
    await this.cleanup();
    this.setStatus(AgentStatus.TERMINATED);
  }
  /**
   * Cleanup resources
   *
   * Override to implement custom cleanup logic.
   */
  async cleanup() {
  }
  // ============================================================================
  // Messaging
  // ============================================================================
  /**
   * Send a message to another agent
   */
  async sendMessage(message) {
    this.logger.debug(`Sending message to ${message.to}`, {
      type: message.type,
      correlationId: message.correlationId
    });
    this.logger.trace("Message payload", { payload: message.payload });
  }
  /**
   * Receive and process a message
   */
  async receiveMessage(message) {
    this.logger.debug(`Received message from ${message.from}`, {
      type: message.type,
      correlationId: message.correlationId
    });
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      await handler(message);
    } else {
      this.logger.warn(`No handler for message type: ${message.type}`);
    }
  }
  /**
   * Register a message handler
   */
  registerMessageHandler(type, handler) {
    this.messageHandlers.set(type, handler);
  }
  /**
   * Register default message handlers
   */
  registerDefaultMessageHandlers() {
    this.registerMessageHandler(MessageType.STATUS, async (message) => {
      await this.sendMessage({
        id: `${Date.now()}`,
        type: MessageType.STATUS,
        from: this.config.id,
        to: message.from,
        timestamp: /* @__PURE__ */ new Date(),
        correlationId: message.id,
        payload: {
          agentId: this.config.id,
          status: this._state.status,
          currentTask: this._state.currentTask?.id
        }
      });
    });
  }
  // ============================================================================
  // Trajectory Tracking
  // ============================================================================
  /**
   * Set the trajectory tracker for this agent
   *
   * @param tracker - The trajectory tracker instance
   */
  setTrajectoryTracker(tracker) {
    this.trajectoryTracker = tracker;
  }
  /**
   * Enable or disable auto-tracking of trajectories
   *
   * @param enabled - Whether to auto-track
   */
  setAutoTrackTrajectories(enabled) {
    this.autoTrackTrajectories = enabled;
  }
  /**
   * Start tracking a task trajectory
   *
   * @param taskId - The task ID to track
   * @param metadata - Optional metadata
   * @returns The trajectory ID
   */
  startTrajectory(taskId, metadata = {}) {
    if (!this.trajectoryTracker?.isEnabled()) {
      return null;
    }
    this.currentTrajectoryId = this.trajectoryTracker.startTrajectory(taskId, {
      ...metadata,
      agentId: this.config.id,
      agentType: this.config.type,
      agentName: this.config.name
    });
    return this.currentTrajectoryId;
  }
  /**
   * Record a step in the current trajectory
   *
   * @param action - The action taken
   * @param observation - The observation/result
   * @param confidence - Optional confidence score (0-1)
   * @param metadata - Optional step metadata
   */
  recordStep(action, observation, confidence, metadata) {
    if (!this.trajectoryTracker || !this.currentTrajectoryId) {
      return;
    }
    this.trajectoryTracker.recordStep(this.currentTrajectoryId, {
      action,
      observation,
      confidence,
      metadata
    });
  }
  /**
   * Complete the current trajectory
   *
   * @param outcome - The task outcome
   * @param metadata - Optional final metadata
   * @returns The stored trajectory ID, or null
   */
  async completeTrajectory(outcome, metadata = {}) {
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
  abortTrajectory(reason) {
    if (!this.trajectoryTracker || !this.currentTrajectoryId) {
      return;
    }
    this.trajectoryTracker.abortTrajectory(this.currentTrajectoryId, reason);
    this.currentTrajectoryId = null;
  }
  /**
   * Check if trajectory tracking is active
   */
  isTrackingTrajectory() {
    return this.currentTrajectoryId !== null;
  }
  /**
   * Get current trajectory progress
   */
  getTrajectoryProgress() {
    if (!this.trajectoryTracker || !this.currentTrajectoryId) {
      return null;
    }
    return this.trajectoryTracker.getProgress(this.currentTrajectoryId);
  }
  // ============================================================================
  // Claude-Flow Integration
  // ============================================================================
  /**
   * Run a claude-flow hook
   */
  async runClaudeFlowHook(hookType, task, result) {
    if (!this.config.claudeFlow?.enabled) {
      return;
    }
    const namespace = this.config.claudeFlow.namespace ?? "knowledge-graph";
    this.logger.debug(`Running claude-flow hook: ${hookType}`, {
      namespace,
      taskId: task.id
    });
    const hookCommand = this.generateHookCommand(hookType, task, result);
    this.logger.trace("Claude-flow hook command", { command: hookCommand });
  }
  /**
   * Generate claude-flow hook command
   */
  generateHookCommand(hookType, task, result) {
    const namespace = this.config.claudeFlow?.namespace ?? "knowledge-graph";
    switch (hookType) {
      case "pre-task":
        return `npx claude-flow@alpha hooks pre-task --description "${task.description}"`;
      case "post-task":
        return `npx claude-flow@alpha hooks post-task --task-id "${task.id}"`;
      case "post-edit":
        return `npx claude-flow@alpha hooks post-edit --memory-key "${namespace}/agent/${this.config.id}/task/${task.id}"`;
      default:
        return "";
    }
  }
  /**
   * Store result in claude-flow memory
   */
  async storeInMemory(key, value) {
    if (!this.config.claudeFlow?.enabled) {
      return;
    }
    const namespace = this.config.claudeFlow.namespace ?? "knowledge-graph";
    this.logger.debug("Storing in claude-flow memory", { namespace, key });
    this.logger.trace("Memory store", {
      action: "store",
      namespace,
      key,
      value: JSON.stringify(value).slice(0, 100)
    });
  }
}
function createTask(description, options) {
  return {
    id: createTaskId(),
    description,
    priority: options?.priority ?? TaskPriority.MEDIUM,
    input: options?.input ?? {},
    expectedOutput: options?.expectedOutput,
    dependencies: options?.dependencies,
    timeout: options?.timeout,
    metadata: options?.metadata,
    createdAt: /* @__PURE__ */ new Date(),
    deadline: options?.deadline
  };
}
function isAgentResult(obj) {
  return typeof obj === "object" && obj !== null && "success" in obj && typeof obj.success === "boolean";
}
function isAgentError(obj) {
  return typeof obj === "object" && obj !== null && "code" in obj && "message" in obj && typeof obj.code === "string" && typeof obj.message === "string";
}
export {
  BaseAgent,
  createTask,
  isAgentError,
  isAgentResult
};
//# sourceMappingURL=base-agent.js.map
