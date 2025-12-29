/**
 * Base Agent Implementation
 *
 * Abstract base class for all agents providing common functionality
 * including task execution, input validation, output formatting,
 * error handling, and optional claude-flow integration.
 *
 * @module agents/base-agent
 */
import { type Logger } from '../utils/index.js';
import { AgentStatus, MessageType, type AgentConfig, type AgentInstance, type AgentState, type AgentTask, type AgentResult, type AgentError, type AgentMessage, type ResultArtifact } from './types.js';
import { TrajectoryTracker } from '../learning/services/trajectory-tracker.js';
import type { TrajectoryStep } from '../integrations/agentic-flow/adapters/reasoning-bank-adapter.js';
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
export declare abstract class BaseAgent implements AgentInstance {
    /** Agent configuration */
    readonly config: AgentConfig;
    /** Agent runtime state */
    private _state;
    /** Logger instance */
    protected readonly logger: Logger;
    /** Message handlers for different message types */
    private messageHandlers;
    /** Trajectory tracker for learning */
    protected trajectoryTracker: TrajectoryTracker | null;
    /** Current active trajectory ID */
    protected currentTrajectoryId: string | null;
    /** Whether to auto-track trajectories */
    protected autoTrackTrajectories: boolean;
    constructor(config: AgentConfig);
    /**
     * Get current agent state
     */
    get state(): AgentState;
    /**
     * Get current agent status
     */
    getStatus(): AgentStatus;
    /**
     * Update agent status
     */
    protected setStatus(status: AgentStatus): void;
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
    execute(task: AgentTask): Promise<AgentResult>;
    /**
     * Execute task with timeout
     */
    private executeWithTimeout;
    /**
     * Abstract method for actual task execution
     *
     * Subclasses must implement this method with their specific logic.
     */
    protected abstract executeTask(task: AgentTask): Promise<AgentResult>;
    /**
     * Validate task input
     *
     * Override this method to implement custom validation logic.
     */
    validateInput(task: AgentTask): Promise<{
        valid: boolean;
        error?: string;
    }>;
    /**
     * Format successful output
     */
    formatOutput<T>(data: T, artifacts?: ResultArtifact[]): AgentResult<T>;
    /**
     * Create a success result
     */
    protected createSuccessResult<T>(data: T, startTime: Date, artifacts?: ResultArtifact[]): AgentResult<T>;
    /**
     * Create an error result
     */
    protected createErrorResult(code: string, message: string, startTime: Date, details?: Partial<AgentError>): AgentResult;
    /**
     * Calculate execution metrics
     */
    private calculateMetrics;
    /**
     * Normalize error to AgentError format
     */
    private normalizeError;
    /**
     * Check if an error is retryable
     */
    protected isRetryableError(error: unknown): boolean;
    /**
     * Pause the agent
     */
    pause(): Promise<void>;
    /**
     * Resume the agent
     */
    resume(): Promise<void>;
    /**
     * Terminate the agent
     */
    terminate(): Promise<void>;
    /**
     * Cleanup resources
     *
     * Override to implement custom cleanup logic.
     */
    protected cleanup(): Promise<void>;
    /**
     * Send a message to another agent
     */
    sendMessage(message: AgentMessage): Promise<void>;
    /**
     * Receive and process a message
     */
    receiveMessage(message: AgentMessage): Promise<void>;
    /**
     * Register a message handler
     */
    protected registerMessageHandler(type: MessageType, handler: (message: AgentMessage) => Promise<void>): void;
    /**
     * Register default message handlers
     */
    private registerDefaultMessageHandlers;
    /**
     * Set the trajectory tracker for this agent
     *
     * @param tracker - The trajectory tracker instance
     */
    setTrajectoryTracker(tracker: TrajectoryTracker): void;
    /**
     * Enable or disable auto-tracking of trajectories
     *
     * @param enabled - Whether to auto-track
     */
    setAutoTrackTrajectories(enabled: boolean): void;
    /**
     * Start tracking a task trajectory
     *
     * @param taskId - The task ID to track
     * @param metadata - Optional metadata
     * @returns The trajectory ID
     */
    protected startTrajectory(taskId: string, metadata?: Record<string, unknown>): string | null;
    /**
     * Record a step in the current trajectory
     *
     * @param action - The action taken
     * @param observation - The observation/result
     * @param confidence - Optional confidence score (0-1)
     * @param metadata - Optional step metadata
     */
    protected recordStep(action: string, observation: string, confidence?: number, metadata?: Record<string, unknown>): void;
    /**
     * Complete the current trajectory
     *
     * @param outcome - The task outcome
     * @param metadata - Optional final metadata
     * @returns The stored trajectory ID, or null
     */
    protected completeTrajectory(outcome: 'success' | 'failure' | 'partial', metadata?: Record<string, unknown>): Promise<string | null>;
    /**
     * Abort the current trajectory
     *
     * @param reason - The reason for aborting
     */
    protected abortTrajectory(reason: string): void;
    /**
     * Check if trajectory tracking is active
     */
    isTrackingTrajectory(): boolean;
    /**
     * Get current trajectory progress
     */
    getTrajectoryProgress(): {
        stepCount: number;
        duration: number;
        lastStep?: TrajectoryStep;
    } | null;
    /**
     * Run a claude-flow hook
     */
    protected runClaudeFlowHook(hookType: 'pre-task' | 'post-task' | 'post-edit', task: AgentTask, result?: AgentResult): Promise<void>;
    /**
     * Generate claude-flow hook command
     */
    private generateHookCommand;
    /**
     * Store result in claude-flow memory
     */
    protected storeInMemory(key: string, value: unknown): Promise<void>;
}
/**
 * Create a task with defaults
 */
export declare function createTask(description: string, options?: Partial<Omit<AgentTask, 'id' | 'description' | 'createdAt'>>): AgentTask;
/**
 * Type guard for checking if an object is an AgentResult
 */
export declare function isAgentResult(obj: unknown): obj is AgentResult;
/**
 * Type guard for checking if an object is an AgentError
 */
export declare function isAgentError(obj: unknown): obj is AgentError;
//# sourceMappingURL=base-agent.d.ts.map