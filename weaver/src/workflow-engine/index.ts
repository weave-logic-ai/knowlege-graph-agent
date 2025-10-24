/**
 * Workflow Engine
 *
 * Orchestrates durable workflows triggered by file events and other triggers.
 */

import { logger } from '../utils/logger.js';
import { WorkflowRegistry } from './registry.js';
import type { WorkflowDefinition, WorkflowTrigger, WorkflowContext } from './types.js';
import type { FileEvent } from '../file-watcher/types.js';

export class WorkflowEngine {
  private registry: WorkflowRegistry;
  private isRunning = false;

  constructor() {
    this.registry = new WorkflowRegistry();
  }

  /**
   * Start the workflow engine
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Workflow engine already running');
      return;
    }

    this.isRunning = true;
    logger.info('✅ Workflow engine started');
  }

  /**
   * Stop the workflow engine
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info('Workflow engine stopped');
  }

  /**
   * Register a workflow
   */
  registerWorkflow(workflow: WorkflowDefinition): void {
    this.registry.register(workflow);
  }

  /**
   * Unregister a workflow
   */
  unregisterWorkflow(workflowId: string): void {
    this.registry.unregister(workflowId);
  }

  /**
   * Trigger workflows based on file event
   */
  async triggerFileEvent(fileEvent: FileEvent): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Workflow engine not running, ignoring file event');
      return;
    }

    // Map file event type to workflow trigger
    const trigger = this.mapFileEventToTrigger(fileEvent.type);
    const workflows = this.registry.getWorkflowsByTrigger(trigger);

    if (workflows.length === 0) {
      logger.debug('No workflows registered for trigger', { trigger, event: fileEvent.type });
      return;
    }

    logger.debug('Triggering workflows', {
      trigger,
      count: workflows.length,
      file: fileEvent.relativePath,
    });

    // Execute workflows in parallel
    const executions = workflows.map((workflow) =>
      this.executeWorkflow(workflow, trigger, fileEvent)
    );

    await Promise.allSettled(executions);
  }

  /**
   * Manually trigger a workflow
   */
  async triggerManual(workflowId: string, metadata?: Record<string, unknown>): Promise<void> {
    const workflow = this.registry.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (!workflow.enabled) {
      throw new Error(`Workflow is disabled: ${workflowId}`);
    }

    await this.executeWorkflow(workflow, 'manual', undefined, metadata);
  }

  /**
   * Execute a workflow
   */
  private async executeWorkflow(
    workflow: WorkflowDefinition,
    trigger: WorkflowTrigger,
    fileEvent?: FileEvent,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const context: WorkflowContext = {
      workflowId: workflow.id,
      trigger,
      triggeredAt: new Date(),
      fileEvent,
      metadata,
    };

    const execution = this.registry.recordExecutionStart(context);

    logger.info('⚙️ Workflow execution started', {
      executionId: execution.id,
      workflowId: workflow.id,
      workflowName: workflow.name,
      trigger,
      file: fileEvent?.relativePath,
    });

    try {
      await workflow.handler(context);

      this.registry.recordExecutionComplete(execution.id);

      logger.info('✅ Workflow execution completed', {
        executionId: execution.id,
        workflowId: workflow.id,
        workflowName: workflow.name,
        duration: this.registry.getExecution(execution.id)?.duration,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.registry.recordExecutionFailure(execution.id, err);

      logger.error('❌ Workflow execution failed', err, {
        executionId: execution.id,
        workflowId: workflow.id,
        workflowName: workflow.name,
      });
    }
  }

  /**
   * Map file event type to workflow trigger
   */
  private mapFileEventToTrigger(eventType: string): WorkflowTrigger {
    switch (eventType) {
      case 'add':
        return 'file:add';
      case 'change':
        return 'file:change';
      case 'unlink':
        return 'file:unlink';
      default:
        return 'file:any';
    }
  }

  /**
   * Get workflow registry (for querying)
   */
  getRegistry(): WorkflowRegistry {
    return this.registry;
  }

  /**
   * Get workflow statistics
   */
  getStats() {
    return this.registry.getStats();
  }
}

/**
 * Create a workflow engine instance
 */
export function createWorkflowEngine(): WorkflowEngine {
  return new WorkflowEngine();
}

// Re-export types
export type { WorkflowDefinition, WorkflowContext, WorkflowTrigger, WorkflowExecution, WorkflowStats } from './types.js';
