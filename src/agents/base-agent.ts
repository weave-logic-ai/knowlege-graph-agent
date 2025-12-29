/**
 * Base Agent Implementation
 *
 * Abstract base class for all agents providing common functionality
 * including task execution, input validation, output formatting,
 * error handling, and optional claude-flow integration.
 *
 * @module agents/base-agent
 */

import { getLogger, retry, type Logger, type RetryOptions } from '../utils/index.js';
import {
  AgentType,
  AgentStatus,
  TaskPriority,
  MessageType,
  type AgentConfig,
  type AgentInstance,
  type AgentState,
  type AgentTask,
  type AgentResult,
  type AgentError,
  type AgentMessage,
  type ExecutionMetrics,
  type ResultArtifact,
  createAgentId,
  createTaskId,
} from './types.js';
import {
  TrajectoryTracker,
  type TrajectoryTrackerConfig,
} from '../learning/services/trajectory-tracker.js';
import type { TrajectoryStep } from '../integrations/agentic-flow/adapters/reasoning-bank-adapter.js';

// ============================================================================
// Base Agent Abstract Class
// ============================================================================

/**
 * Abstract base class for all agents
 *
 * Provides common functionality that all agents share, including:
 * - Task execution with timeout and retry handling
 * - Input validation
 * - Output formatting
 * - Error handling and logging
 * - Optional claude-flow hooks integration
 *
 * @example
 * ```typescript
 * class ResearchAgent extends BaseAgent {
 *   protected async executeTask(task: AgentTask): Promise<AgentResult> {
 *     // Implementation specific to researcher agent
 *     const results = await this.searchSources(task.input);
 *     return this.formatOutput(results);
 *   }
 * }
 * ```
 */
export abstract class BaseAgent implements AgentInstance {
  /** Agent configuration */
  public readonly config: AgentConfig;

  /** Agent runtime state */
  private _state: AgentState;

  /** Logger instance */
  protected readonly logger: Logger;

  /** Message handlers for different message types */
  private messageHandlers: Map<MessageType, (message: AgentMessage) => Promise<void>> =
    new Map();

  /** Trajectory tracker for learning */
  protected trajectoryTracker: TrajectoryTracker | null = null;

  /** Current active trajectory ID */
  protected currentTrajectoryId: string | null = null;

  /** Whether to auto-track trajectories */
  protected autoTrackTrajectories: boolean = true;

  constructor(config: AgentConfig) {
    // Ensure ID is set
    this.config = {
      ...config,
      id: config.id ?? createAgentId(config.type),
    };

    // Initialize state
    this._state = {
      id: this.config.id!,
      status: AgentStatus.IDLE,
      taskQueue: [],
      completedTasks: [],
      lastActivity: new Date(),
      errorCount: 0,
    };

    // Create logger
    this.logger = getLogger().child(`agent:${this.config.name}`);

    // Register default message handlers
    this.registerDefaultMessageHandlers();
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Get current agent state
   */
  get state(): AgentState {
    return { ...this._state };
  }

  /**
   * Get current agent status
   */
  getStatus(): AgentStatus {
    return this._state.status;
  }

  /**
   * Update agent status
   */
  protected setStatus(status: AgentStatus): void {
    const previousStatus = this._state.status;
    this._state.status = status;
    this._state.lastActivity = new Date();

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
  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = new Date();

    this.logger.info(`Executing task: ${task.id}`, {
      description: task.description,
      priority: task.priority,
    });

    // Run pre-task hook if enabled
    if (this.config.claudeFlow?.hooks?.preTask) {
      await this.runClaudeFlowHook('pre-task', task);
    }

    // Start trajectory tracking if enabled
    if (this.autoTrackTrajectories && this.trajectoryTracker?.isEnabled()) {
      this.startTrajectory(task.id, {
        description: task.description,
        priority: task.priority,
        input: task.input,
      });
      this.recordStep('task_started', `Starting task: ${task.description}`, 1.0);
    }

    try {
      // Validate input
      const validationResult = await this.validateInput(task);
      if (!validationResult.valid) {
        this.recordStep('validation_failed', validationResult.error ?? 'Input validation failed', 0.0);
        await this.completeTrajectory('failure', { validationError: validationResult.error });
        return this.createErrorResult(
          'VALIDATION_ERROR',
          validationResult.error ?? 'Input validation failed',
          startTime
        );
      }

      this.recordStep('validation_passed', 'Input validation successful', 1.0);

      // Set status to running
      this.setStatus(AgentStatus.RUNNING);
      this._state.currentTask = task;

      // Execute with retry if configured
      let result: AgentResult;
      const retryConfig = this.config.retry;

      if (retryConfig && retryConfig.maxRetries > 0) {
        const retryOptions: RetryOptions = {
          maxRetries: retryConfig.maxRetries,
          initialDelay: retryConfig.backoffMs,
          backoffFactor: retryConfig.backoffMultiplier ?? 2,
          isRetryable: (error: unknown) => this.isRetryableError(error),
        };

        result = await retry(
          async () => this.executeWithTimeout(task),
          retryOptions
        );
      } else {
        result = await this.executeWithTimeout(task);
      }

      // Update state on success
      if (result.success) {
        this._state.completedTasks.push(task.id);
        this.setStatus(AgentStatus.COMPLETED);
        this.recordStep('task_completed', 'Task completed successfully', 1.0, { success: true });
        await this.completeTrajectory('success', {
          durationMs: result.metrics?.durationMs,
          artifactCount: result.artifacts?.length ?? 0,
        });
      } else {
        this._state.errorCount++;
        this.setStatus(AgentStatus.FAILED);
        this.recordStep('task_failed', result.error?.message ?? 'Task failed', 0.0, { error: result.error });
        await this.completeTrajectory('failure', {
          errorCode: result.error?.code,
          errorMessage: result.error?.message,
        });
      }

      // Add metrics
      result.metrics = this.calculateMetrics(startTime, new Date());

      // Run post-task hook if enabled
      if (this.config.claudeFlow?.hooks?.postTask) {
        await this.runClaudeFlowHook('post-task', task, result);
      }

      return result;
    } catch (error) {
      this._state.errorCount++;
      this.setStatus(AgentStatus.FAILED);

      const agentError = this.normalizeError(error);
      this.logger.error(`Task execution failed: ${task.id}`, error as Error);

      // Record trajectory failure
      this.recordStep('task_exception', agentError.message, 0.0, {
        errorCode: agentError.code,
        stack: agentError.stack,
      });
      await this.completeTrajectory('failure', {
        exception: true,
        errorCode: agentError.code,
        errorMessage: agentError.message,
      });

      return this.createErrorResult(agentError.code, agentError.message, startTime, {
        stack: agentError.stack,
        retryable: agentError.retryable,
      });
    } finally {
      this._state.currentTask = undefined;
      this._state.lastActivity = new Date();
    }
  }

  /**
   * Execute task with timeout
   */
  private async executeWithTimeout(task: AgentTask): Promise<AgentResult> {
    const timeout = task.timeout ?? this.config.taskTimeout ?? 30000;

    return new Promise<AgentResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Task execution timed out after ${timeout}ms`));
      }, timeout);

      this.executeTask(task)
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Abstract method for actual task execution
   *
   * Subclasses must implement this method with their specific logic.
   */
  protected abstract executeTask(task: AgentTask): Promise<AgentResult>;

  // ============================================================================
  // Input Validation
  // ============================================================================

  /**
   * Validate task input
   *
   * Override this method to implement custom validation logic.
   */
  async validateInput(task: AgentTask): Promise<{ valid: boolean; error?: string }> {
    // Basic validation
    if (!task.id) {
      return { valid: false, error: 'Task ID is required' };
    }

    if (!task.description) {
      return { valid: false, error: 'Task description is required' };
    }

    // Check dependencies are resolved
    if (task.dependencies && task.dependencies.length > 0) {
      const unresolvedDeps = task.dependencies.filter(
        (dep) => !this._state.completedTasks.includes(dep)
      );

      if (unresolvedDeps.length > 0) {
        return {
          valid: false,
          error: `Unresolved dependencies: ${unresolvedDeps.join(', ')}`,
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
  formatOutput<T>(data: T, artifacts?: ResultArtifact[]): AgentResult<T> {
    return {
      success: true,
      data,
      artifacts,
      metadata: {
        agentId: this.config.id,
        agentType: this.config.type,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Create a success result
   */
  protected createSuccessResult<T>(
    data: T,
    startTime: Date,
    artifacts?: ResultArtifact[]
  ): AgentResult<T> {
    return {
      success: true,
      data,
      artifacts,
      metrics: this.calculateMetrics(startTime, new Date()),
      metadata: {
        agentId: this.config.id,
        agentType: this.config.type,
      },
    };
  }

  /**
   * Create an error result
   */
  protected createErrorResult(
    code: string,
    message: string,
    startTime: Date,
    details?: Partial<AgentError>
  ): AgentResult {
    return {
      success: false,
      error: {
        code,
        message,
        ...details,
      },
      metrics: this.calculateMetrics(startTime, new Date()),
      metadata: {
        agentId: this.config.id,
        agentType: this.config.type,
      },
    };
  }

  /**
   * Calculate execution metrics
   */
  private calculateMetrics(startTime: Date, endTime: Date): ExecutionMetrics {
    return {
      startTime,
      endTime,
      durationMs: endTime.getTime() - startTime.getTime(),
      memoryUsage: process.memoryUsage?.().heapUsed,
      retries: 0, // Updated by retry logic if needed
    };
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

  /**
   * Normalize error to AgentError format
   */
  private normalizeError(error: unknown): AgentError {
    if (error instanceof Error) {
      return {
        code: error.name || 'UNKNOWN_ERROR',
        message: error.message,
        stack: error.stack,
        retryable: this.isRetryableError(error),
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: String(error),
      retryable: false,
    };
  }

  /**
   * Check if an error is retryable
   */
  protected isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Network/transient errors
      if (
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('connection') ||
        message.includes('econnreset') ||
        message.includes('rate limit')
      ) {
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
  async pause(): Promise<void> {
    if (this._state.status === AgentStatus.RUNNING) {
      this.logger.info('Pausing agent');
      this.setStatus(AgentStatus.PAUSED);
    }
  }

  /**
   * Resume the agent
   */
  async resume(): Promise<void> {
    if (this._state.status === AgentStatus.PAUSED) {
      this.logger.info('Resuming agent');
      this.setStatus(AgentStatus.IDLE);
    }
  }

  /**
   * Terminate the agent
   */
  async terminate(): Promise<void> {
    this.logger.info('Terminating agent');

    // Clean up any resources
    await this.cleanup();

    this.setStatus(AgentStatus.TERMINATED);
  }

  /**
   * Cleanup resources
   *
   * Override to implement custom cleanup logic.
   */
  protected async cleanup(): Promise<void> {
    // Default: no cleanup needed
  }

  // ============================================================================
  // Messaging
  // ============================================================================

  /**
   * Send a message to another agent
   */
  async sendMessage(message: AgentMessage): Promise<void> {
    this.logger.debug(`Sending message to ${message.to}`, {
      type: message.type,
      correlationId: message.correlationId,
    });

    // In a real implementation, this would use a message bus
    // For now, just log the message
    this.logger.trace('Message payload', { payload: message.payload });
  }

  /**
   * Receive and process a message
   */
  async receiveMessage(message: AgentMessage): Promise<void> {
    this.logger.debug(`Received message from ${message.from}`, {
      type: message.type,
      correlationId: message.correlationId,
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
  protected registerMessageHandler(
    type: MessageType,
    handler: (message: AgentMessage) => Promise<void>
  ): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Register default message handlers
   */
  private registerDefaultMessageHandlers(): void {
    // Handle status requests
    this.registerMessageHandler(MessageType.STATUS, async (message) => {
      await this.sendMessage({
        id: `${Date.now()}`,
        type: MessageType.STATUS,
        from: this.config.id!,
        to: message.from,
        timestamp: new Date(),
        correlationId: message.id,
        payload: {
          agentId: this.config.id,
          status: this._state.status,
          currentTask: this._state.currentTask?.id,
        },
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
  setTrajectoryTracker(tracker: TrajectoryTracker): void {
    this.trajectoryTracker = tracker;
  }

  /**
   * Enable or disable auto-tracking of trajectories
   *
   * @param enabled - Whether to auto-track
   */
  setAutoTrackTrajectories(enabled: boolean): void {
    this.autoTrackTrajectories = enabled;
  }

  /**
   * Start tracking a task trajectory
   *
   * @param taskId - The task ID to track
   * @param metadata - Optional metadata
   * @returns The trajectory ID
   */
  protected startTrajectory(
    taskId: string,
    metadata: Record<string, unknown> = {}
  ): string | null {
    if (!this.trajectoryTracker?.isEnabled()) {
      return null;
    }

    this.currentTrajectoryId = this.trajectoryTracker.startTrajectory(taskId, {
      ...metadata,
      agentId: this.config.id,
      agentType: this.config.type,
      agentName: this.config.name,
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
  protected recordStep(
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
   * @returns The stored trajectory ID, or null
   */
  protected async completeTrajectory(
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
  protected abortTrajectory(reason: string): void {
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

  // ============================================================================
  // Claude-Flow Integration
  // ============================================================================

  /**
   * Run a claude-flow hook
   */
  protected async runClaudeFlowHook(
    hookType: 'pre-task' | 'post-task' | 'post-edit',
    task: AgentTask,
    result?: AgentResult
  ): Promise<void> {
    if (!this.config.claudeFlow?.enabled) {
      return;
    }

    const namespace = this.config.claudeFlow.namespace ?? 'knowledge-graph';

    this.logger.debug(`Running claude-flow hook: ${hookType}`, {
      namespace,
      taskId: task.id,
    });

    // Generate the hook command that would be run
    const hookCommand = this.generateHookCommand(hookType, task, result);

    this.logger.trace('Claude-flow hook command', { command: hookCommand });

    // In production, this would execute via child_process or MCP
    // For now, we just log the intent
  }

  /**
   * Generate claude-flow hook command
   */
  private generateHookCommand(
    hookType: 'pre-task' | 'post-task' | 'post-edit',
    task: AgentTask,
    result?: AgentResult
  ): string {
    const namespace = this.config.claudeFlow?.namespace ?? 'knowledge-graph';

    switch (hookType) {
      case 'pre-task':
        return `npx claude-flow@alpha hooks pre-task --description "${task.description}"`;

      case 'post-task':
        return `npx claude-flow@alpha hooks post-task --task-id "${task.id}"`;

      case 'post-edit':
        return `npx claude-flow@alpha hooks post-edit --memory-key "${namespace}/agent/${this.config.id}/task/${task.id}"`;

      default:
        return '';
    }
  }

  /**
   * Store result in claude-flow memory
   */
  protected async storeInMemory(key: string, value: unknown): Promise<void> {
    if (!this.config.claudeFlow?.enabled) {
      return;
    }

    const namespace = this.config.claudeFlow.namespace ?? 'knowledge-graph';

    this.logger.debug('Storing in claude-flow memory', { namespace, key });

    // This would call the MCP memory_usage tool
    // For now, just log the intent
    this.logger.trace('Memory store', {
      action: 'store',
      namespace,
      key,
      value: JSON.stringify(value).slice(0, 100),
    });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a task with defaults
 */
export function createTask(
  description: string,
  options?: Partial<Omit<AgentTask, 'id' | 'description' | 'createdAt'>>
): AgentTask {
  return {
    id: createTaskId(),
    description,
    priority: options?.priority ?? TaskPriority.MEDIUM,
    input: options?.input ?? {},
    expectedOutput: options?.expectedOutput,
    dependencies: options?.dependencies,
    timeout: options?.timeout,
    metadata: options?.metadata,
    createdAt: new Date(),
    deadline: options?.deadline,
  };
}

/**
 * Type guard for checking if an object is an AgentResult
 */
export function isAgentResult(obj: unknown): obj is AgentResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    typeof (obj as AgentResult).success === 'boolean'
  );
}

/**
 * Type guard for checking if an object is an AgentError
 */
export function isAgentError(obj: unknown): obj is AgentError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'code' in obj &&
    'message' in obj &&
    typeof (obj as AgentError).code === 'string' &&
    typeof (obj as AgentError).message === 'string'
  );
}
