/**
 * Workflow Registry
 *
 * Manages workflow definitions and execution tracking.
 */

import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';
import type { WorkflowDefinition, WorkflowExecution, WorkflowTrigger, WorkflowContext, WorkflowStats } from './types.js';

export class WorkflowRegistry {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private maxExecutionHistory = 100; // Keep last 100 executions

  /**
   * Register a workflow
   */
  register(workflow: WorkflowDefinition): void {
    if (this.workflows.has(workflow.id)) {
      logger.warn('Workflow already registered, replacing', { id: workflow.id });
    }

    this.workflows.set(workflow.id, workflow);
    logger.info('Workflow registered', {
      id: workflow.id,
      name: workflow.name,
      triggers: workflow.triggers,
      enabled: workflow.enabled,
    });
  }

  /**
   * Unregister a workflow
   */
  unregister(workflowId: string): void {
    if (!this.workflows.has(workflowId)) {
      logger.warn('Workflow not found for unregistration', { id: workflowId });
      return;
    }

    this.workflows.delete(workflowId);
    logger.info('Workflow unregistered', { id: workflowId });
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get workflows by trigger
   */
  getWorkflowsByTrigger(trigger: WorkflowTrigger): WorkflowDefinition[] {
    return Array.from(this.workflows.values()).filter(
      (w) => w.enabled && (w.triggers.includes(trigger) || w.triggers.includes('file:any'))
    );
  }

  /**
   * Record workflow execution start
   */
  recordExecutionStart(context: WorkflowContext): WorkflowExecution {
    const workflow = this.workflows.get(context.workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${context.workflowId}`);
    }

    const execution: WorkflowExecution = {
      id: randomUUID(),
      workflowId: context.workflowId,
      workflowName: workflow.name,
      trigger: context.trigger,
      status: 'running',
      startedAt: context.triggeredAt,
      fileEvent: context.fileEvent,
    };

    this.executions.set(execution.id, execution);
    this.pruneExecutionHistory();

    return execution;
  }

  /**
   * Record workflow execution completion
   */
  recordExecutionComplete(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (!execution) {
      logger.warn('Execution not found for completion', { id: executionId });
      return;
    }

    execution.status = 'completed';
    execution.completedAt = new Date();
    execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();

    this.executions.set(executionId, execution);
  }

  /**
   * Record workflow execution failure
   */
  recordExecutionFailure(executionId: string, error: Error): void {
    const execution = this.executions.get(executionId);
    if (!execution) {
      logger.warn('Execution not found for failure', { id: executionId });
      return;
    }

    execution.status = 'failed';
    execution.completedAt = new Date();
    execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
    execution.error = error.message;

    this.executions.set(executionId, execution);
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get recent executions
   */
  getRecentExecutions(limit = 10): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get executions by workflow ID
   */
  getExecutionsByWorkflow(workflowId: string, limit = 10): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter((e) => e.workflowId === workflowId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get workflow statistics
   */
  getStats(): WorkflowStats {
    const workflows = Array.from(this.workflows.values());
    const executions = Array.from(this.executions.values());

    return {
      totalWorkflows: workflows.length,
      enabledWorkflows: workflows.filter((w) => w.enabled).length,
      totalExecutions: executions.length,
      successfulExecutions: executions.filter((e) => e.status === 'completed').length,
      failedExecutions: executions.filter((e) => e.status === 'failed').length,
      runningExecutions: executions.filter((e) => e.status === 'running').length,
    };
  }

  /**
   * Prune execution history to prevent memory bloat
   */
  private pruneExecutionHistory(): void {
    const executions = Array.from(this.executions.entries())
      .sort(([, a], [, b]) => b.startedAt.getTime() - a.startedAt.getTime());

    if (executions.length > this.maxExecutionHistory) {
      const toRemove = executions.slice(this.maxExecutionHistory);
      toRemove.forEach(([id]) => this.executions.delete(id));
    }
  }
}
