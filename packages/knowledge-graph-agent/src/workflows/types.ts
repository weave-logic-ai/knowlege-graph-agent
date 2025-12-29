/**
 * Workflow Types
 *
 * Type definitions for the workflow registry and execution system.
 *
 * @module workflows/types
 */

/**
 * Workflow execution status
 */
export enum WorkflowStatus {
  /** Workflow has not started */
  Pending = 'pending',
  /** Workflow is currently running */
  Running = 'running',
  /** Workflow completed successfully */
  Completed = 'completed',
  /** Workflow failed with error */
  Failed = 'failed',
  /** Workflow was cancelled */
  Cancelled = 'cancelled',
  /** Workflow is paused */
  Paused = 'paused',
  /** Workflow is waiting for dependencies */
  Waiting = 'waiting',
  /** Workflow is rolling back due to failure */
  RollingBack = 'rolling-back',
  /** Workflow rollback completed */
  RolledBack = 'rolled-back',
}

/**
 * Step execution context passed to step handlers
 */
export interface StepContext {
  /** Workflow ID */
  workflowId: string;
  /** Current step ID */
  stepId: string;
  /** Results from previous steps */
  previousResults: Map<string, unknown>;
  /** Shared workflow state */
  state: Record<string, unknown>;
  /** Logger function */
  log: (message: string, data?: Record<string, unknown>) => void;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Step handler function type
 */
export type StepHandler<TInput = unknown, TOutput = unknown> = (
  input: TInput,
  context: StepContext
) => Promise<TOutput>;

/**
 * Rollback handler function type
 */
export type RollbackHandler<TOutput = unknown> = (
  result: TOutput,
  context: StepContext
) => Promise<void>;

/**
 * Workflow step definition
 */
export interface WorkflowStep<TInput = unknown, TOutput = unknown> {
  /** Unique step identifier */
  id: string;
  /** Human-readable step name */
  name: string;
  /** Step description */
  description?: string;
  /** Step execution handler */
  handler: StepHandler<TInput, TOutput>;
  /** Rollback handler for failure recovery */
  rollback?: RollbackHandler<TOutput>;
  /** IDs of steps this step depends on */
  dependencies?: string[];
  /** Timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts */
  retries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Whether step can run in parallel with siblings */
  parallel?: boolean;
  /** Whether step is optional (failure won't stop workflow) */
  optional?: boolean;
  /** Condition function to determine if step should run */
  condition?: (context: StepContext) => boolean | Promise<boolean>;
  /** Input transformer */
  transformInput?: (previousResults: Map<string, unknown>) => TInput;
  /** Metadata for the step */
  metadata?: Record<string, unknown>;
}

/**
 * Workflow definition
 */
export interface WorkflowDefinition<TInput = unknown, TOutput = unknown> {
  /** Unique workflow identifier */
  id: string;
  /** Workflow name */
  name: string;
  /** Workflow description */
  description?: string;
  /** Workflow version */
  version: string;
  /** Workflow steps */
  steps: WorkflowStep[];
  /** Default input for the workflow */
  defaultInput?: TInput;
  /** Initial state for the workflow */
  initialState?: Record<string, unknown>;
  /** Global timeout for entire workflow */
  timeout?: number;
  /** Whether to enable rollback on failure */
  enableRollback?: boolean;
  /** Handler called before workflow starts */
  onStart?: (input: TInput, context: StepContext) => Promise<void>;
  /** Handler called after workflow completes */
  onComplete?: (result: TOutput, context: StepContext) => Promise<void>;
  /** Handler called on workflow failure */
  onError?: (error: Error, context: StepContext) => Promise<void>;
  /** Output transformer */
  transformOutput?: (results: Map<string, unknown>) => TOutput;
  /** Workflow metadata */
  metadata?: Record<string, unknown>;
  /** Tags for categorization */
  tags?: string[];
}

/**
 * Step execution record
 */
export interface StepExecution {
  /** Step ID */
  stepId: string;
  /** Step status */
  status: WorkflowStatus;
  /** Step result */
  result?: unknown;
  /** Error if failed */
  error?: string;
  /** Error stack trace */
  errorStack?: string;
  /** Start timestamp */
  startedAt?: Date;
  /** End timestamp */
  completedAt?: Date;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Number of attempts */
  attempts: number;
  /** Whether step was skipped */
  skipped?: boolean;
  /** Skip reason */
  skipReason?: string;
}

/**
 * Workflow execution record
 */
export interface WorkflowExecution<TInput = unknown, TOutput = unknown> {
  /** Unique execution ID */
  id: string;
  /** Workflow definition ID */
  workflowId: string;
  /** Execution status */
  status: WorkflowStatus;
  /** Input provided to workflow */
  input: TInput;
  /** Final output (if completed) */
  output?: TOutput;
  /** Shared workflow state */
  state: Record<string, unknown>;
  /** Step execution records */
  steps: Map<string, StepExecution>;
  /** Overall error (if failed) */
  error?: string;
  /** Error stack trace */
  errorStack?: string;
  /** Created timestamp */
  createdAt: Date;
  /** Started timestamp */
  startedAt?: Date;
  /** Completed timestamp */
  completedAt?: Date;
  /** Total duration in milliseconds */
  durationMs?: number;
  /** Execution metadata */
  metadata?: Record<string, unknown>;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current step being executed */
  currentStep?: string;
  /** Whether rollback was performed */
  rolledBack?: boolean;
}

/**
 * Workflow execution result
 */
export interface WorkflowResult<TOutput = unknown> {
  /** Whether workflow completed successfully */
  success: boolean;
  /** Execution ID */
  executionId: string;
  /** Workflow ID */
  workflowId: string;
  /** Final status */
  status: WorkflowStatus;
  /** Output result (if successful) */
  output?: TOutput;
  /** Error message (if failed) */
  error?: string;
  /** Error stack trace */
  errorStack?: string;
  /** Total duration in milliseconds */
  durationMs: number;
  /** Step results */
  stepResults: Map<string, unknown>;
  /** Step errors */
  stepErrors: Map<string, string>;
  /** Whether rollback was performed */
  rolledBack: boolean;
  /** Execution statistics */
  stats: WorkflowExecutionStats;
}

/**
 * Workflow execution statistics
 */
export interface WorkflowExecutionStats {
  /** Total steps */
  totalSteps: number;
  /** Completed steps */
  completedSteps: number;
  /** Failed steps */
  failedSteps: number;
  /** Skipped steps */
  skippedSteps: number;
  /** Total retry attempts across all steps */
  totalRetries: number;
  /** Start time */
  startTime: Date;
  /** End time */
  endTime: Date;
  /** Total duration in milliseconds */
  totalDurationMs: number;
  /** Average step duration in milliseconds */
  avgStepDurationMs: number;
}

/**
 * Workflow registry options
 */
export interface WorkflowRegistryOptions {
  /** Maximum concurrent workflow executions */
  maxConcurrentExecutions?: number;
  /** Default step timeout in milliseconds */
  defaultStepTimeout?: number;
  /** Default retry count */
  defaultRetries?: number;
  /** Default retry delay in milliseconds */
  defaultRetryDelay?: number;
  /** Whether to persist execution history */
  persistHistory?: boolean;
  /** Maximum history entries to keep */
  maxHistoryEntries?: number;
  /** Logger function */
  logger?: (level: string, message: string, data?: Record<string, unknown>) => void;
}

/**
 * Workflow list filter options
 */
export interface WorkflowListOptions {
  /** Filter by tags */
  tags?: string[];
  /** Filter by version pattern */
  version?: string;
  /** Include only workflows matching name pattern */
  namePattern?: string;
  /** Limit results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Execution history query options
 */
export interface ExecutionHistoryOptions {
  /** Filter by workflow ID */
  workflowId?: string;
  /** Filter by status */
  status?: WorkflowStatus;
  /** Filter by start date (after) */
  after?: Date;
  /** Filter by start date (before) */
  before?: Date;
  /** Limit results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Workflow event types
 */
export type WorkflowEventType =
  | 'workflow:started'
  | 'workflow:completed'
  | 'workflow:failed'
  | 'workflow:cancelled'
  | 'workflow:paused'
  | 'workflow:resumed'
  | 'step:started'
  | 'step:completed'
  | 'step:failed'
  | 'step:skipped'
  | 'step:retrying'
  | 'rollback:started'
  | 'rollback:completed'
  | 'rollback:failed';

/**
 * Workflow event
 */
export interface WorkflowEvent {
  /** Event type */
  type: WorkflowEventType;
  /** Execution ID */
  executionId: string;
  /** Workflow ID */
  workflowId: string;
  /** Step ID (if step event) */
  stepId?: string;
  /** Event timestamp */
  timestamp: Date;
  /** Event data */
  data?: Record<string, unknown>;
  /** Error (if applicable) */
  error?: string;
}

/**
 * Workflow event listener
 */
export type WorkflowEventListener = (event: WorkflowEvent) => void | Promise<void>;
