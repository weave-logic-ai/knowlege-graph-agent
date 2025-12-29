/**
 * Workflows Module
 *
 * Provides workflow registry and execution system for orchestrating
 * complex multi-step operations with dependency management.
 *
 * @module workflows
 */

// Types
export {
  WorkflowStatus,
  type StepContext,
  type StepHandler,
  type RollbackHandler,
  type WorkflowStep,
  type WorkflowDefinition,
  type StepExecution,
  type WorkflowExecution,
  type WorkflowResult,
  type WorkflowExecutionStats,
  type WorkflowRegistryOptions,
  type WorkflowListOptions,
  type ExecutionHistoryOptions,
  type WorkflowEventType,
  type WorkflowEvent,
  type WorkflowEventListener,
} from './types.js';

// Registry
export {
  WorkflowRegistry,
  createWorkflowRegistry,
} from './registry.js';
