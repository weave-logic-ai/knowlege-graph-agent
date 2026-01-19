/**
 * Claude Interaction Storage Schema
 *
 * Hierarchical storage schema for storing Claude prompts, outputs, and tool calls
 * in a knowledge graph. Supports hierarchical nesting from sessions down to
 * individual tool calls and sub-agent operations.
 *
 * @module claude/types
 */

import { z } from 'zod';

// ============================================================================
// Base Identifiers and Enums
// ============================================================================

/**
 * Unique identifier types for different hierarchy levels
 */
export type SessionId = `session_${string}`;
export type ConversationId = `conv_${string}`;
export type MessageId = `msg_${string}`;
export type ToolCallId = `tool_${string}`;
export type SubAgentId = `agent_${string}`;
export type SwarmId = `swarm_${string}`;
export type WorkflowId = `wf_${string}`;

/**
 * Claude model identifiers
 */
export type ClaudeModel =
  | 'claude-opus-4-5-20251101'
  | 'claude-sonnet-4-20250514'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307'
  | string; // Allow for future models

/**
 * Message role in conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Status of a hierarchical node
 */
export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

/**
 * Agent type classification for sub-agents and swarm members
 */
export type ClaudeAgentType =
  | 'researcher'
  | 'coder'
  | 'tester'
  | 'analyst'
  | 'architect'
  | 'reviewer'
  | 'coordinator'
  | 'optimizer'
  | 'documenter'
  | 'planner'
  | 'custom';

/**
 * Swarm topology types from claude-flow
 */
export type SwarmTopology = 'mesh' | 'hierarchical' | 'ring' | 'star';

/**
 * Swarm execution strategy
 */
export type SwarmStrategy = 'parallel' | 'sequential' | 'adaptive';

// ============================================================================
// Token Usage Tracking
// ============================================================================

/**
 * Token usage metrics for cost tracking and optimization
 */
export interface TokenUsage {
  /** Input tokens consumed */
  inputTokens: number;
  /** Output tokens generated */
  outputTokens: number;
  /** Cache read tokens (if using prompt caching) */
  cacheReadTokens?: number;
  /** Cache write tokens (if using prompt caching) */
  cacheWriteTokens?: number;
  /** Total tokens (computed) */
  totalTokens: number;
  /** Estimated cost in USD (based on model pricing) */
  estimatedCostUsd?: number;
}

/**
 * Aggregated token usage across multiple operations
 */
export interface AggregatedTokenUsage extends TokenUsage {
  /** Number of operations aggregated */
  operationCount: number;
  /** Breakdown by model if multiple models used */
  byModel?: Record<ClaudeModel, TokenUsage>;
  /** Breakdown by operation type */
  byOperationType?: Record<string, TokenUsage>;
}

// ============================================================================
// Base Metadata Interface
// ============================================================================

/**
 * Common metadata for all hierarchical nodes
 */
export interface BaseMetadata {
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** User-defined tags for categorization */
  tags: string[];
  /** Custom key-value metadata */
  custom?: Record<string, unknown>;
}

// ============================================================================
// Session Level (Top of Hierarchy)
// ============================================================================

/**
 * Session represents a complete interaction session with Claude
 *
 * Sessions are the top level of the hierarchy and contain multiple conversations.
 * They track overall context, purpose, and aggregated metrics.
 *
 * @example
 * ```typescript
 * const session: ClaudeSession = {
 *   id: 'session_abc123',
 *   name: 'Feature Development Session',
 *   purpose: 'Implement user authentication feature',
 *   startedAt: new Date('2024-01-15T10:00:00Z'),
 *   status: 'running',
 *   conversationIds: ['conv_xyz789'],
 *   tokenUsage: { inputTokens: 5000, outputTokens: 3000, totalTokens: 8000 },
 *   metadata: { tags: ['auth', 'feature'], createdAt: new Date() },
 * };
 * ```
 */
export interface ClaudeSession {
  /** Unique session identifier */
  id: SessionId;
  /** Human-readable session name */
  name: string;
  /** Purpose or goal of the session */
  purpose?: string;
  /** When the session started */
  startedAt: Date;
  /** When the session ended (if completed) */
  endedAt?: Date;
  /** Current session status */
  status: ExecutionStatus;
  /** IDs of conversations in this session */
  conversationIds: ConversationId[];
  /** IDs of swarms spawned during this session */
  swarmIds?: SwarmId[];
  /** IDs of workflows executed during this session */
  workflowIds?: WorkflowId[];
  /** Aggregated token usage for the entire session */
  tokenUsage: AggregatedTokenUsage;
  /** Environment context (working directory, git branch, etc.) */
  environment?: SessionEnvironment;
  /** Session metadata */
  metadata: BaseMetadata;
}

/**
 * Environment context captured at session start
 */
export interface SessionEnvironment {
  /** Working directory path */
  workingDirectory: string;
  /** Git branch if in a repository */
  gitBranch?: string;
  /** Git commit hash at session start */
  gitCommit?: string;
  /** Platform (linux, darwin, win32) */
  platform: string;
  /** Node.js version if applicable */
  nodeVersion?: string;
  /** Claude Code version */
  claudeCodeVersion?: string;
  /** Active MCP servers */
  mcpServers?: string[];
}

// ============================================================================
// Conversation/Thread Level
// ============================================================================

/**
 * Conversation represents a single thread of messages with Claude
 *
 * Conversations are contained within sessions and contain ordered messages.
 * They track the flow of interaction including tool calls and responses.
 *
 * @example
 * ```typescript
 * const conversation: ClaudeConversation = {
 *   id: 'conv_xyz789',
 *   sessionId: 'session_abc123',
 *   title: 'Implement login endpoint',
 *   model: 'claude-opus-4-5-20251101',
 *   messageIds: ['msg_001', 'msg_002'],
 *   status: 'completed',
 *   tokenUsage: { inputTokens: 2000, outputTokens: 1500, totalTokens: 3500 },
 *   metadata: { tags: ['api', 'auth'] },
 * };
 * ```
 */
export interface ClaudeConversation {
  /** Unique conversation identifier */
  id: ConversationId;
  /** Parent session ID */
  sessionId: SessionId;
  /** Conversation title or topic */
  title?: string;
  /** Primary model used in this conversation */
  model: ClaudeModel;
  /** System prompt used (if any) */
  systemPrompt?: string;
  /** Ordered list of message IDs */
  messageIds: MessageId[];
  /** Sub-agent IDs spawned from this conversation */
  subAgentIds?: SubAgentId[];
  /** Current conversation status */
  status: ExecutionStatus;
  /** When conversation started */
  startedAt: Date;
  /** When conversation ended */
  endedAt?: Date;
  /** Total token usage for this conversation */
  tokenUsage: TokenUsage;
  /** Conversation context (file paths, topics, etc.) */
  context?: ConversationContext;
  /** Conversation metadata */
  metadata: BaseMetadata;
}

/**
 * Context information for a conversation
 */
export interface ConversationContext {
  /** Primary files being discussed or edited */
  primaryFiles?: string[];
  /** Related knowledge graph node IDs */
  relatedNodeIds?: string[];
  /** Topic keywords extracted from conversation */
  topics?: string[];
  /** User intent classification */
  intent?: 'query' | 'task' | 'debug' | 'refactor' | 'document' | 'review' | 'other';
}

// ============================================================================
// Message Level
// ============================================================================

/**
 * Message represents a single prompt or response in a conversation
 *
 * Messages are the core unit of interaction and contain the actual content
 * exchanged between user and Claude, including any tool calls made.
 *
 * @example
 * ```typescript
 * const message: ClaudeMessage = {
 *   id: 'msg_001',
 *   conversationId: 'conv_xyz789',
 *   role: 'user',
 *   content: 'Create a login endpoint with JWT authentication',
 *   timestamp: new Date(),
 *   tokenUsage: { inputTokens: 50, outputTokens: 0, totalTokens: 50 },
 *   metadata: { tags: ['request'] },
 * };
 * ```
 */
export interface ClaudeMessage {
  /** Unique message identifier */
  id: MessageId;
  /** Parent conversation ID */
  conversationId: ConversationId;
  /** Message role (user prompt or assistant response) */
  role: MessageRole;
  /** Text content of the message */
  content: string;
  /** Structured content blocks (for complex responses) */
  contentBlocks?: MessageContentBlock[];
  /** Tool calls made in this message (assistant only) */
  toolCallIds?: ToolCallId[];
  /** Tool results included in this message (user only, as tool_result) */
  toolResultIds?: ToolCallId[];
  /** When the message was created */
  timestamp: Date;
  /** Token usage for this message */
  tokenUsage: TokenUsage;
  /** Stop reason (for assistant messages) */
  stopReason?: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';
  /** Message metadata */
  metadata: BaseMetadata;
}

/**
 * Content block types for structured message content
 */
export type MessageContentBlock =
  | TextContentBlock
  | CodeContentBlock
  | ToolUseContentBlock
  | ToolResultContentBlock
  | ThinkingContentBlock;

/**
 * Plain text content block
 */
export interface TextContentBlock {
  type: 'text';
  text: string;
}

/**
 * Code content block with language identification
 */
export interface CodeContentBlock {
  type: 'code';
  language: string;
  code: string;
  /** File path if this code is for a specific file */
  filePath?: string;
}

/**
 * Tool use content block
 */
export interface ToolUseContentBlock {
  type: 'tool_use';
  toolCallId: ToolCallId;
  toolName: string;
  input: Record<string, unknown>;
}

/**
 * Tool result content block
 */
export interface ToolResultContentBlock {
  type: 'tool_result';
  toolCallId: ToolCallId;
  content: string;
  isError?: boolean;
}

/**
 * Extended thinking content block (for extended thinking mode)
 */
export interface ThinkingContentBlock {
  type: 'thinking';
  thinking: string;
  /** Summary of the thinking (for display) */
  summary?: string;
}

// ============================================================================
// Tool Call Level
// ============================================================================

/**
 * Tool call represents a single tool invocation by Claude
 *
 * Tool calls are made by assistant messages and track the full lifecycle
 * from invocation through execution to result.
 *
 * @example
 * ```typescript
 * const toolCall: ClaudeToolCall = {
 *   id: 'tool_abc123',
 *   messageId: 'msg_002',
 *   toolName: 'Edit',
 *   toolCategory: 'file',
 *   input: { file_path: '/src/auth.ts', old_string: '...', new_string: '...' },
 *   output: { success: true },
 *   status: 'completed',
 *   executionTimeMs: 150,
 *   metadata: { tags: ['edit'] },
 * };
 * ```
 */
export interface ClaudeToolCall {
  /** Unique tool call identifier */
  id: ToolCallId;
  /** Parent message ID (the assistant message that made this call) */
  messageId: MessageId;
  /** Name of the tool invoked */
  toolName: string;
  /** Category of tool (for grouping and analysis) */
  toolCategory: ToolCategory;
  /** Input parameters passed to the tool */
  input: Record<string, unknown>;
  /** Output/result from the tool */
  output?: unknown;
  /** Error information if tool call failed */
  error?: ToolCallError;
  /** Execution status */
  status: ExecutionStatus;
  /** When the tool call started */
  startedAt: Date;
  /** When the tool call completed */
  completedAt?: Date;
  /** Total execution time in milliseconds */
  executionTimeMs?: number;
  /** Files affected by this tool call */
  affectedFiles?: string[];
  /** Tool call metadata */
  metadata: BaseMetadata;
}

/**
 * Tool categories for grouping and analysis
 */
export type ToolCategory =
  | 'file'        // Read, Write, Edit, Glob, Grep
  | 'bash'        // Bash command execution
  | 'search'      // WebSearch, WebFetch
  | 'mcp'         // MCP server tools
  | 'task'        // Task tool for sub-agents
  | 'notebook'    // NotebookEdit
  | 'todo'        // TodoWrite
  | 'skill'       // Skill invocations
  | 'other';

/**
 * Error information for failed tool calls
 */
export interface ToolCallError {
  /** Error type/code */
  type: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** Whether the error is recoverable */
  recoverable?: boolean;
}

// ============================================================================
// Sub-Agent Level (Task Tool Spawns)
// ============================================================================

/**
 * Sub-agent represents an agent spawned via the Task tool
 *
 * Sub-agents are child agents created during a conversation to handle
 * specific tasks. They have their own conversation context and can
 * spawn further sub-agents.
 *
 * @example
 * ```typescript
 * const subAgent: ClaudeSubAgent = {
 *   id: 'agent_def456',
 *   parentConversationId: 'conv_xyz789',
 *   parentMessageId: 'msg_002',
 *   agentType: 'coder',
 *   name: 'Backend Implementation Agent',
 *   task: 'Implement the login endpoint with proper validation',
 *   model: 'claude-sonnet-4-20250514',
 *   conversationId: 'conv_sub001',
 *   status: 'completed',
 *   result: { success: true, filesCreated: ['src/auth.ts'] },
 *   tokenUsage: { inputTokens: 1000, outputTokens: 800, totalTokens: 1800 },
 *   metadata: { tags: ['backend'] },
 * };
 * ```
 */
export interface ClaudeSubAgent {
  /** Unique sub-agent identifier */
  id: SubAgentId;
  /** Parent conversation that spawned this agent */
  parentConversationId: ConversationId;
  /** Specific message that spawned this agent */
  parentMessageId: MessageId;
  /** Tool call ID that created this agent */
  toolCallId: ToolCallId;
  /** Agent type/specialization */
  agentType: ClaudeAgentType;
  /** Agent name (for identification) */
  name: string;
  /** Task description given to the agent */
  task: string;
  /** Model used by this sub-agent */
  model: ClaudeModel;
  /** Conversation ID for this agent's work */
  conversationId?: ConversationId;
  /** Child sub-agent IDs spawned by this agent */
  childAgentIds?: SubAgentId[];
  /** Execution status */
  status: ExecutionStatus;
  /** When the agent started */
  startedAt: Date;
  /** When the agent completed */
  completedAt?: Date;
  /** Result/output from the agent */
  result?: SubAgentResult;
  /** Token usage for this agent's work */
  tokenUsage: TokenUsage;
  /** Agent metadata */
  metadata: BaseMetadata;
}

/**
 * Result from a sub-agent execution
 */
export interface SubAgentResult {
  /** Whether the task was successful */
  success: boolean;
  /** Summary of what was accomplished */
  summary?: string;
  /** Files created by the agent */
  filesCreated?: string[];
  /** Files modified by the agent */
  filesModified?: string[];
  /** Files deleted by the agent */
  filesDeleted?: string[];
  /** Error message if failed */
  error?: string;
  /** Structured output data */
  data?: unknown;
}

// ============================================================================
// Swarm Level (Claude-Flow Swarms)
// ============================================================================

/**
 * Swarm represents a claude-flow swarm coordination
 *
 * Swarms are multi-agent orchestrations that coordinate multiple agents
 * working together on complex tasks.
 *
 * @example
 * ```typescript
 * const swarm: ClaudeSwarm = {
 *   id: 'swarm_ghi789',
 *   sessionId: 'session_abc123',
 *   name: 'Full Stack Development Swarm',
 *   topology: 'mesh',
 *   strategy: 'adaptive',
 *   maxAgents: 5,
 *   agentIds: ['agent_001', 'agent_002', 'agent_003'],
 *   task: 'Implement complete user management module',
 *   status: 'running',
 *   tokenUsage: { inputTokens: 10000, outputTokens: 8000, totalTokens: 18000, operationCount: 5 },
 *   metadata: { tags: ['fullstack'] },
 * };
 * ```
 */
export interface ClaudeSwarm {
  /** Unique swarm identifier */
  id: SwarmId;
  /** Parent session ID */
  sessionId: SessionId;
  /** Swarm name */
  name: string;
  /** Network topology */
  topology: SwarmTopology;
  /** Execution strategy */
  strategy: SwarmStrategy;
  /** Maximum agents in the swarm */
  maxAgents: number;
  /** IDs of agents in this swarm */
  agentIds: SubAgentId[];
  /** High-level task for the swarm */
  task: string;
  /** Execution status */
  status: ExecutionStatus;
  /** When the swarm was initialized */
  startedAt: Date;
  /** When the swarm completed */
  completedAt?: Date;
  /** Aggregated result from all agents */
  result?: SwarmResult;
  /** Aggregated token usage */
  tokenUsage: AggregatedTokenUsage;
  /** MCP tool calls made for swarm coordination */
  coordinationCallIds?: ToolCallId[];
  /** Swarm metadata */
  metadata: BaseMetadata;
}

/**
 * Aggregated result from a swarm execution
 */
export interface SwarmResult {
  /** Overall success status */
  success: boolean;
  /** Summary of swarm accomplishments */
  summary?: string;
  /** Individual agent results */
  agentResults: Record<SubAgentId, SubAgentResult>;
  /** Total files affected */
  totalFilesAffected: number;
  /** Metrics about the swarm execution */
  metrics?: SwarmMetrics;
}

/**
 * Metrics for swarm execution
 */
export interface SwarmMetrics {
  /** Number of agents that completed successfully */
  successfulAgents: number;
  /** Number of agents that failed */
  failedAgents: number;
  /** Total execution time in milliseconds */
  totalExecutionTimeMs: number;
  /** Average time per agent */
  avgAgentTimeMs: number;
  /** Coordination overhead time */
  coordinationOverheadMs?: number;
}

// ============================================================================
// Workflow Level (Script/Workflow Executions)
// ============================================================================

/**
 * Workflow represents a script or structured workflow execution
 *
 * Workflows are structured sequences of operations that may involve
 * multiple tools, agents, or manual steps.
 *
 * @example
 * ```typescript
 * const workflow: ClaudeWorkflow = {
 *   id: 'wf_jkl012',
 *   sessionId: 'session_abc123',
 *   name: 'CI/CD Pipeline Setup',
 *   type: 'skill',
 *   skillName: 'github-workflow-automation',
 *   steps: [...],
 *   status: 'completed',
 *   tokenUsage: { inputTokens: 3000, outputTokens: 2000, totalTokens: 5000, operationCount: 3 },
 *   metadata: { tags: ['ci', 'github'] },
 * };
 * ```
 */
export interface ClaudeWorkflow {
  /** Unique workflow identifier */
  id: WorkflowId;
  /** Parent session ID */
  sessionId: SessionId;
  /** Workflow name */
  name: string;
  /** Type of workflow */
  type: 'skill' | 'script' | 'manual' | 'automated';
  /** Skill name if type is 'skill' */
  skillName?: string;
  /** Script path if type is 'script' */
  scriptPath?: string;
  /** Workflow steps */
  steps: WorkflowStep[];
  /** Current step index (if running) */
  currentStepIndex?: number;
  /** Execution status */
  status: ExecutionStatus;
  /** When workflow started */
  startedAt: Date;
  /** When workflow completed */
  completedAt?: Date;
  /** Workflow result */
  result?: WorkflowResult;
  /** Aggregated token usage */
  tokenUsage: AggregatedTokenUsage;
  /** Related conversation IDs */
  conversationIds?: ConversationId[];
  /** Related tool call IDs */
  toolCallIds?: ToolCallId[];
  /** Workflow metadata */
  metadata: BaseMetadata;
}

/**
 * Individual step in a workflow
 */
export interface WorkflowStep {
  /** Step index (0-based) */
  index: number;
  /** Step name */
  name: string;
  /** Step description */
  description?: string;
  /** Type of step */
  type: 'tool' | 'agent' | 'manual' | 'condition' | 'loop';
  /** Tool name if type is 'tool' */
  toolName?: string;
  /** Tool call ID if executed */
  toolCallId?: ToolCallId;
  /** Agent ID if type is 'agent' */
  agentId?: SubAgentId;
  /** Step status */
  status: ExecutionStatus;
  /** Step input */
  input?: unknown;
  /** Step output */
  output?: unknown;
  /** Execution time in milliseconds */
  executionTimeMs?: number;
  /** Error if failed */
  error?: string;
}

/**
 * Result from a workflow execution
 */
export interface WorkflowResult {
  /** Overall success */
  success: boolean;
  /** Summary of workflow completion */
  summary?: string;
  /** Number of steps completed */
  stepsCompleted: number;
  /** Total steps in workflow */
  totalSteps: number;
  /** Output data */
  data?: unknown;
  /** Error if failed */
  error?: string;
}

// ============================================================================
// Graph Edge Types for Relationships
// ============================================================================

/**
 * Edge types for hierarchical relationships in the knowledge graph
 */
export type ClaudeGraphEdgeType =
  | 'session_contains_conversation'
  | 'session_contains_swarm'
  | 'session_contains_workflow'
  | 'conversation_contains_message'
  | 'conversation_spawns_agent'
  | 'message_contains_tool_call'
  | 'message_has_tool_result'
  | 'agent_has_conversation'
  | 'agent_spawns_child'
  | 'swarm_contains_agent'
  | 'workflow_contains_step'
  | 'workflow_uses_tool'
  | 'workflow_uses_agent'
  | 'references_file'
  | 'references_node'
  | 'related_to';

/**
 * Graph edge for Claude interaction hierarchy
 */
export interface ClaudeGraphEdge {
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Relationship type */
  type: ClaudeGraphEdgeType;
  /** Edge weight (for relevance scoring) */
  weight: number;
  /** Additional context about the relationship */
  context?: string;
  /** When this relationship was created */
  createdAt: Date;
}

// ============================================================================
// Query and Filter Types
// ============================================================================

/**
 * Filter options for querying Claude interactions
 */
export interface ClaudeInteractionFilter {
  /** Filter by session IDs */
  sessionIds?: SessionId[];
  /** Filter by conversation IDs */
  conversationIds?: ConversationId[];
  /** Filter by date range */
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  /** Filter by status */
  status?: ExecutionStatus[];
  /** Filter by tags */
  tags?: string[];
  /** Filter by model */
  models?: ClaudeModel[];
  /** Filter by agent type */
  agentTypes?: ClaudeAgentType[];
  /** Filter by tool names */
  toolNames?: string[];
  /** Full-text search query */
  textQuery?: string;
  /** Minimum token count */
  minTokens?: number;
  /** Maximum token count */
  maxTokens?: number;
}

/**
 * Sort options for query results
 */
export interface ClaudeInteractionSort {
  /** Field to sort by */
  field: 'createdAt' | 'updatedAt' | 'tokenUsage' | 'executionTime';
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  /** Number of items per page */
  limit: number;
  /** Offset for pagination */
  offset: number;
}

// ============================================================================
// Analytics Types
// ============================================================================

/**
 * Analytics summary for Claude interactions
 */
export interface ClaudeAnalyticsSummary {
  /** Total sessions */
  totalSessions: number;
  /** Total conversations */
  totalConversations: number;
  /** Total messages */
  totalMessages: number;
  /** Total tool calls */
  totalToolCalls: number;
  /** Total sub-agents spawned */
  totalSubAgents: number;
  /** Total swarms */
  totalSwarms: number;
  /** Total workflows */
  totalWorkflows: number;
  /** Aggregated token usage */
  tokenUsage: AggregatedTokenUsage;
  /** Breakdown by model */
  byModel: Record<ClaudeModel, { count: number; tokenUsage: TokenUsage }>;
  /** Breakdown by tool category */
  byToolCategory: Record<ToolCategory, { count: number; avgExecutionTimeMs: number }>;
  /** Success rate */
  successRate: number;
  /** Date range of data */
  dateRange: {
    earliest: Date;
    latest: Date;
  };
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

/**
 * Zod schema for token usage validation
 */
export const TokenUsageSchema = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  cacheReadTokens: z.number().int().nonnegative().optional(),
  cacheWriteTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative(),
  estimatedCostUsd: z.number().nonnegative().optional(),
});

/**
 * Zod schema for base metadata validation
 */
export const BaseMetadataSchema = z.object({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  tags: z.array(z.string()),
  custom: z.record(z.unknown()).optional(),
});

/**
 * Zod schema for session validation
 */
export const ClaudeSessionSchema = z.object({
  id: z.string().startsWith('session_'),
  name: z.string().min(1),
  purpose: z.string().optional(),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled', 'timeout']),
  conversationIds: z.array(z.string().startsWith('conv_')),
  swarmIds: z.array(z.string().startsWith('swarm_')).optional(),
  workflowIds: z.array(z.string().startsWith('wf_')).optional(),
  tokenUsage: TokenUsageSchema.extend({
    operationCount: z.number().int().nonnegative(),
    byModel: z.record(TokenUsageSchema).optional(),
    byOperationType: z.record(TokenUsageSchema).optional(),
  }),
  metadata: BaseMetadataSchema,
});

// ============================================================================
// Helper Functions for ID Generation
// ============================================================================

/**
 * Generate a unique session ID
 */
export function createSessionId(): SessionId {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` as SessionId;
}

/**
 * Generate a unique conversation ID
 */
export function createConversationId(): ConversationId {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` as ConversationId;
}

/**
 * Generate a unique message ID
 */
export function createMessageId(): MessageId {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` as MessageId;
}

/**
 * Generate a unique tool call ID
 */
export function createToolCallId(): ToolCallId {
  return `tool_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` as ToolCallId;
}

/**
 * Generate a unique sub-agent ID
 */
export function createSubAgentId(): SubAgentId {
  return `agent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` as SubAgentId;
}

/**
 * Generate a unique swarm ID
 */
export function createSwarmId(): SwarmId {
  return `swarm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` as SwarmId;
}

/**
 * Generate a unique workflow ID
 */
export function createWorkflowId(): WorkflowId {
  return `wf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` as WorkflowId;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for ClaudeSession
 */
export function isClaudeSession(obj: unknown): obj is ClaudeSession {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as ClaudeSession).id === 'string' &&
    (obj as ClaudeSession).id.startsWith('session_')
  );
}

/**
 * Type guard for ClaudeConversation
 */
export function isClaudeConversation(obj: unknown): obj is ClaudeConversation {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as ClaudeConversation).id === 'string' &&
    (obj as ClaudeConversation).id.startsWith('conv_')
  );
}

/**
 * Type guard for ClaudeMessage
 */
export function isClaudeMessage(obj: unknown): obj is ClaudeMessage {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as ClaudeMessage).id === 'string' &&
    (obj as ClaudeMessage).id.startsWith('msg_')
  );
}

/**
 * Type guard for ClaudeToolCall
 */
export function isClaudeToolCall(obj: unknown): obj is ClaudeToolCall {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as ClaudeToolCall).id === 'string' &&
    (obj as ClaudeToolCall).id.startsWith('tool_')
  );
}

/**
 * Type guard for ClaudeSubAgent
 */
export function isClaudeSubAgent(obj: unknown): obj is ClaudeSubAgent {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as ClaudeSubAgent).id === 'string' &&
    (obj as ClaudeSubAgent).id.startsWith('agent_')
  );
}

/**
 * Type guard for ClaudeSwarm
 */
export function isClaudeSwarm(obj: unknown): obj is ClaudeSwarm {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as ClaudeSwarm).id === 'string' &&
    (obj as ClaudeSwarm).id.startsWith('swarm_')
  );
}

/**
 * Type guard for ClaudeWorkflow
 */
export function isClaudeWorkflow(obj: unknown): obj is ClaudeWorkflow {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as ClaudeWorkflow).id === 'string' &&
    (obj as ClaudeWorkflow).id.startsWith('wf_')
  );
}
