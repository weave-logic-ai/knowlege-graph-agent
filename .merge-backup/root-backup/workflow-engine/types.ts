/**
 * Workflow Engine Types
 *
 * Type definitions for the workflow orchestration system.
 */

import type { FileEvent } from '../file-watcher/types.js';

/**
 * Workflow trigger type
 */
export type WorkflowTrigger =
  | 'file:add'
  | 'file:change'
  | 'file:unlink'
  | 'file:any'
  | 'manual'
  | 'scheduled';

/**
 * Workflow context - data passed to workflow execution
 */
export interface WorkflowContext {
  /** Workflow ID */
  workflowId: string;
  /** Trigger that initiated this workflow */
  trigger: WorkflowTrigger;
  /** Timestamp when workflow was triggered */
  triggeredAt: Date;
  /** File event that triggered the workflow (if applicable) */
  fileEvent?: FileEvent;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
  /** Unique workflow ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Workflow description */
  description: string;
  /** Triggers that activate this workflow */
  triggers: WorkflowTrigger[];
  /** Whether workflow is enabled */
  enabled: boolean;
  /** Workflow handler function */
  handler: (context: WorkflowContext) => Promise<void>;
  /** Optional file path filter (glob pattern) */
  fileFilter?: string;
}

/**
 * Workflow execution record
 */
export interface WorkflowExecution {
  /** Execution ID */
  id: string;
  /** Workflow ID */
  workflowId: string;
  /** Workflow name */
  workflowName: string;
  /** Trigger that initiated execution */
  trigger: WorkflowTrigger;
  /** Execution status */
  status: 'pending' | 'running' | 'completed' | 'failed';
  /** Start time */
  startedAt: Date;
  /** End time */
  completedAt?: Date;
  /** Duration in milliseconds */
  duration?: number;
  /** Error if failed */
  error?: string;
  /** File event data (if triggered by file event) */
  fileEvent?: FileEvent;
}

/**
 * Workflow statistics
 */
export interface WorkflowStats {
  /** Total workflows registered */
  totalWorkflows: number;
  /** Enabled workflows */
  enabledWorkflows: number;
  /** Total executions */
  totalExecutions: number;
  /** Successful executions */
  successfulExecutions: number;
  /** Failed executions */
  failedExecutions: number;
  /** Currently running executions */
  runningExecutions: number;
}
