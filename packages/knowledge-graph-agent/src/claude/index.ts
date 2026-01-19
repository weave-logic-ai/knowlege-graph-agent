/**
 * Claude Interaction Storage Module
 *
 * Exports types and utilities for storing Claude prompts, outputs,
 * and tool calls in a hierarchical knowledge graph structure.
 *
 * @module claude
 */

// Export all types
export * from './types.js';

// Re-export commonly used types for convenience
export type {
  // Identifiers
  SessionId,
  ConversationId,
  MessageId,
  ToolCallId,
  SubAgentId,
  SwarmId,
  WorkflowId,

  // Core entities
  ClaudeSession,
  ClaudeConversation,
  ClaudeMessage,
  ClaudeToolCall,
  ClaudeSubAgent,
  ClaudeSwarm,
  ClaudeWorkflow,

  // Supporting types
  TokenUsage,
  AggregatedTokenUsage,
  BaseMetadata,
  ClaudeGraphEdge,
  ClaudeInteractionFilter,
  ClaudeAnalyticsSummary,
} from './types.js';

// Re-export ID generators
export {
  createSessionId,
  createConversationId,
  createMessageId,
  createToolCallId,
  createSubAgentId,
  createSwarmId,
  createWorkflowId,
} from './types.js';

// Re-export type guards
export {
  isClaudeSession,
  isClaudeConversation,
  isClaudeMessage,
  isClaudeToolCall,
  isClaudeSubAgent,
  isClaudeSwarm,
  isClaudeWorkflow,
} from './types.js';

// Re-export Zod schemas
export {
  TokenUsageSchema,
  BaseMetadataSchema,
  ClaudeSessionSchema,
} from './types.js';

// Export hook capture system
export {
  HookCaptureSystem,
  processHookEvent,
  generateHookConfig,
  DEFAULT_CAPTURE_CONFIG,
  type HookEventType,
  type HookEventData,
  type CaptureConfig,
} from './hook-capture.js';
