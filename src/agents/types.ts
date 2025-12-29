/**
 * Agent System Types
 *
 * Core type definitions for the agent system including agent types,
 * statuses, configurations, tasks, and message formats.
 *
 * @module agents/types
 */

// ============================================================================
// Agent Type Enumerations
// ============================================================================

/**
 * Agent specialization types
 *
 * Each type represents a specific role in the multi-agent system.
 */
export enum AgentType {
  /** Research agent - gathers information and analyzes requirements */
  RESEARCHER = 'researcher',

  /** Coder agent - implements features and writes code */
  CODER = 'coder',

  /** Tester agent - writes and runs tests */
  TESTER = 'tester',

  /** Analyst agent - analyzes data and patterns */
  ANALYST = 'analyst',

  /** Architect agent - designs system architecture */
  ARCHITECT = 'architect',

  /** Reviewer agent - reviews code and provides feedback */
  REVIEWER = 'reviewer',

  /** Coordinator agent - orchestrates multi-agent workflows */
  COORDINATOR = 'coordinator',

  /** Optimizer agent - optimizes performance and resources */
  OPTIMIZER = 'optimizer',

  /** Documenter agent - generates documentation */
  DOCUMENTER = 'documenter',

  /** Planner agent - plans and coordinates tasks */
  PLANNER = 'planner',

  /** Custom agent - user-defined specialization */
  CUSTOM = 'custom',
}

/**
 * Agent execution status
 */
export enum AgentStatus {
  /** Agent is idle and ready to accept tasks */
  IDLE = 'idle',

  /** Agent is currently executing a task */
  RUNNING = 'running',

  /** Agent has completed its task successfully */
  COMPLETED = 'completed',

  /** Agent has failed to complete its task */
  FAILED = 'failed',

  /** Agent is paused and can be resumed */
  PAUSED = 'paused',

  /** Agent has been terminated */
  TERMINATED = 'terminated',
}

/**
 * Task priority levels
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Message types for agent communication
 */
export enum MessageType {
  /** Request for agent to perform an action */
  REQUEST = 'request',

  /** Response to a request */
  RESPONSE = 'response',

  /** Notification/event broadcast */
  NOTIFICATION = 'notification',

  /** Error message */
  ERROR = 'error',

  /** Status update */
  STATUS = 'status',

  /** Coordination message between agents */
  COORDINATION = 'coordination',
}

// ============================================================================
// Agent Configuration
// ============================================================================

/**
 * Base agent configuration interface
 */
export interface AgentConfig {
  /** Unique agent identifier */
  id?: string;

  /** Agent display name */
  name: string;

  /** Agent type/specialization */
  type: AgentType;

  /** Agent description */
  description?: string;

  /** Agent capabilities */
  capabilities?: string[];

  /** Maximum concurrent tasks */
  maxConcurrentTasks?: number;

  /** Task timeout in milliseconds */
  taskTimeout?: number;

  /** Retry configuration */
  retry?: {
    maxRetries: number;
    backoffMs: number;
    backoffMultiplier?: number;
  };

  /** Claude-flow integration settings */
  claudeFlow?: {
    enabled: boolean;
    namespace?: string;
    hooks?: {
      preTask?: boolean;
      postTask?: boolean;
      postEdit?: boolean;
    };
  };

  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Extended configuration for specific agent types
 */
export interface ResearcherAgentConfig extends AgentConfig {
  type: AgentType.RESEARCHER;
  searchDepth?: number;
  sources?: string[];
}

export interface CoderAgentConfig extends AgentConfig {
  type: AgentType.CODER;
  language?: string;
  framework?: string;
  codeStyle?: string;
}

export interface TesterAgentConfig extends AgentConfig {
  type: AgentType.TESTER;
  testFramework?: string;
  coverageThreshold?: number;
}

export interface AnalystAgentConfig extends AgentConfig {
  type: AgentType.ANALYST;
  analysisType?: 'code' | 'data' | 'performance' | 'security';
}

export interface ArchitectAgentConfig extends AgentConfig {
  type: AgentType.ARCHITECT;
  patterns?: string[];
  constraints?: string[];
}

export interface PlannerAgentConfig extends AgentConfig {
  type: AgentType.PLANNER;
  /** Default timeline estimation strategy */
  estimationStrategy?: 'optimistic' | 'pessimistic' | 'realistic';
  /** Include risk assessment by default */
  includeRiskAssessment?: boolean;
  /** Maximum parallel tasks to consider */
  maxParallelTasks?: number;
}

/**
 * Union type for all agent configurations
 */
export type SpecializedAgentConfig =
  | ResearcherAgentConfig
  | CoderAgentConfig
  | TesterAgentConfig
  | AnalystAgentConfig
  | ArchitectAgentConfig
  | PlannerAgentConfig
  | AgentConfig;

// ============================================================================
// Agent Task Types
// ============================================================================

/**
 * Task input definition
 */
export interface TaskInput {
  /** Input data */
  data?: unknown;

  /** Input files/paths */
  files?: string[];

  /** Context from previous tasks */
  context?: Record<string, unknown>;

  /** Parameters for the task */
  parameters?: Record<string, unknown>;
}

/**
 * Task definition for agents
 */
export interface AgentTask {
  /** Unique task identifier */
  id: string;

  /** Human-readable task description */
  description: string;

  /** Task priority */
  priority: TaskPriority;

  /** Task input data */
  input: TaskInput;

  /** Expected output format */
  expectedOutput?: {
    type: 'file' | 'data' | 'message' | 'action';
    schema?: Record<string, unknown>;
  };

  /** Task dependencies (IDs of tasks that must complete first) */
  dependencies?: string[];

  /** Task timeout in milliseconds */
  timeout?: number;

  /** Task metadata */
  metadata?: Record<string, unknown>;

  /** Creation timestamp */
  createdAt: Date;

  /** Deadline timestamp */
  deadline?: Date;
}

// ============================================================================
// Agent Result Types
// ============================================================================

/**
 * Standard result format for agent operations
 */
export interface AgentResult<T = unknown> {
  /** Whether the operation succeeded */
  success: boolean;

  /** Result data */
  data?: T;

  /** Error if operation failed */
  error?: AgentError;

  /** Execution metrics */
  metrics?: ExecutionMetrics;

  /** Output artifacts (files, logs, etc.) */
  artifacts?: ResultArtifact[];

  /** Result metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Agent error structure
 */
export interface AgentError {
  /** Error code */
  code: string;

  /** Human-readable message */
  message: string;

  /** Additional error details */
  details?: Record<string, unknown>;

  /** Stack trace if available */
  stack?: string;

  /** Whether the error is retryable */
  retryable?: boolean;
}

/**
 * Execution metrics for tracking performance
 */
export interface ExecutionMetrics {
  /** Start time */
  startTime: Date;

  /** End time */
  endTime: Date;

  /** Duration in milliseconds */
  durationMs: number;

  /** Memory usage in bytes */
  memoryUsage?: number;

  /** Number of retries */
  retries?: number;

  /** Token usage (for LLM operations) */
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
}

/**
 * Result artifact (file, log, etc.)
 */
export interface ResultArtifact {
  /** Artifact type */
  type: 'file' | 'log' | 'report' | 'code' | 'data';

  /** Artifact name */
  name: string;

  /** Artifact path or content */
  content: string;

  /** MIME type */
  mimeType?: string;

  /** Artifact metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Agent Message Types
// ============================================================================

/**
 * Base message interface for agent communication
 */
export interface AgentMessage {
  /** Message ID */
  id: string;

  /** Message type */
  type: MessageType;

  /** Sender agent ID */
  from: string;

  /** Recipient agent ID (or 'broadcast' for all) */
  to: string;

  /** Message timestamp */
  timestamp: Date;

  /** Message payload */
  payload: unknown;

  /** Correlation ID for request/response matching */
  correlationId?: string;

  /** Message metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Request message for task delegation
 */
export interface TaskRequestMessage extends AgentMessage {
  type: MessageType.REQUEST;
  payload: {
    task: AgentTask;
    urgent?: boolean;
  };
}

/**
 * Response message for completed tasks
 */
export interface TaskResponseMessage extends AgentMessage {
  type: MessageType.RESPONSE;
  payload: {
    taskId: string;
    result: AgentResult;
  };
}

/**
 * Status update message
 */
export interface StatusMessage extends AgentMessage {
  type: MessageType.STATUS;
  payload: {
    agentId: string;
    status: AgentStatus;
    currentTask?: string;
    progress?: number;
  };
}

/**
 * Error message
 */
export interface ErrorMessage extends AgentMessage {
  type: MessageType.ERROR;
  payload: {
    error: AgentError;
    taskId?: string;
    recoverable?: boolean;
  };
}

/**
 * Coordination message for multi-agent workflows
 */
export interface CoordinationMessage extends AgentMessage {
  type: MessageType.COORDINATION;
  payload: {
    action: 'sync' | 'handoff' | 'merge' | 'split' | 'barrier';
    data: unknown;
  };
}

/**
 * Union type for all message types
 */
export type AgentMessageUnion =
  | TaskRequestMessage
  | TaskResponseMessage
  | StatusMessage
  | ErrorMessage
  | CoordinationMessage;

// ============================================================================
// Agent State Types
// ============================================================================

/**
 * Agent runtime state
 */
export interface AgentState {
  /** Agent ID */
  id: string;

  /** Current status */
  status: AgentStatus;

  /** Current task being executed */
  currentTask?: AgentTask;

  /** Queued tasks */
  taskQueue: AgentTask[];

  /** Completed task history */
  completedTasks: string[];

  /** Last activity timestamp */
  lastActivity: Date;

  /** Error count */
  errorCount: number;

  /** Custom state data */
  custom?: Record<string, unknown>;
}

// ============================================================================
// Agent Factory Types
// ============================================================================

/**
 * Agent factory function type
 */
export type AgentFactory<T extends AgentConfig = AgentConfig> = (
  config: T
) => Promise<AgentInstance>;

/**
 * Agent instance interface
 */
export interface AgentInstance {
  /** Agent configuration */
  readonly config: AgentConfig;

  /** Agent state */
  readonly state: AgentState;

  /** Execute a task */
  execute(task: AgentTask): Promise<AgentResult>;

  /** Pause the agent */
  pause(): Promise<void>;

  /** Resume the agent */
  resume(): Promise<void>;

  /** Terminate the agent */
  terminate(): Promise<void>;

  /** Get agent status */
  getStatus(): AgentStatus;

  /** Send a message to another agent */
  sendMessage?(message: AgentMessage): Promise<void>;

  /** Receive and process a message */
  receiveMessage?(message: AgentMessage): Promise<void>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Agent capability descriptor
 */
export interface AgentCapability {
  /** Capability name */
  name: string;

  /** Capability description */
  description: string;

  /** Required for this agent type */
  required?: boolean;

  /** Capability version */
  version?: string;
}

/**
 * Agent health check result
 */
export interface AgentHealthCheck {
  /** Agent ID */
  agentId: string;

  /** Health status */
  healthy: boolean;

  /** Status details */
  status: AgentStatus;

  /** Last heartbeat */
  lastHeartbeat: Date;

  /** Error message if unhealthy */
  error?: string;

  /** Metrics snapshot */
  metrics?: Partial<ExecutionMetrics>;
}

/**
 * Helper function to create a unique message ID
 */
export function createMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Helper function to create a unique task ID
 */
export function createTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Helper function to create a unique agent ID
 */
export function createAgentId(type: AgentType): string {
  return `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
