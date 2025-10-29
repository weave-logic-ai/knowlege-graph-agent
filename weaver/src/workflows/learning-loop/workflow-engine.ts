/**
 * Workflow orchestration engine
 * Coordinates all learning loop workflows
 */

import { EventEmitter } from 'events';
import type { WorkflowContext, WorkflowResult, WorkflowStage } from './types.js';
import { BaseWorkflow } from './base-workflow.js';
import { PerceptionWorkflow } from './perception-workflow.js';
import { ReasoningWorkflow } from './reasoning-workflow.js';
import { ExecutionWorkflow } from './execution-workflow.js';
import { ReflectionWorkflow } from './reflection-workflow.js';
import { learningLoopWatcher } from './file-watcher.js';
import { templateGenerator } from './template-generator.js';

export class WorkflowEngine extends EventEmitter {
  private workflows: Map<WorkflowStage, BaseWorkflow>;
  private activeWorkflows: Map<string, WorkflowStage>; // sessionId -> current stage

  constructor() {
    super();

    // Initialize workflows
    this.workflows = new Map([
      ['perception', new PerceptionWorkflow()],
      ['reasoning', new ReasoningWorkflow()],
      ['execution', new ExecutionWorkflow()],
      ['reflection', new ReflectionWorkflow()],
    ]);

    this.activeWorkflows = new Map();

    // Connect to file watcher
    this.setupWatcherIntegration();
  }

  /**
   * Setup integration with file watcher
   */
  private setupWatcherIntegration(): void {
    learningLoopWatcher.on('workflow-trigger', async (context: WorkflowContext) => {
      await this.execute(context.stage, context);
    });

    learningLoopWatcher.on('error', ({ error, filePath }) => {
      console.error('[WorkflowEngine] Watcher error:', error, filePath);
      this.emit('error', { error, filePath });
    });
  }

  /**
   * Execute a workflow
   */
  async execute(stage: WorkflowStage, context: WorkflowContext): Promise<WorkflowResult> {
    try {
      const workflow = this.workflows.get(stage);

      if (!workflow) {
        throw new Error(`Unknown workflow stage: ${stage}`);
      }

      console.log(`[WorkflowEngine] Executing ${stage} workflow for session ${context.sessionId}`);

      // Track active workflow
      this.activeWorkflows.set(context.sessionId, stage);

      // Execute workflow
      const result = await workflow.execute(context);

      // Emit result event
      this.emit('workflow-complete', result);

      // If workflow succeeded and has a next stage, generate template
      if (result.success && result.nextStage) {
        console.log(`[WorkflowEngine] Triggering next stage: ${result.nextStage}`);

        await templateGenerator.generateTemplate(
          result.nextStage,
          context.sessionId,
          context.sopId,
          result.data
        );
      }

      // If workflow completed (no next stage), remove from active workflows
      if (!result.nextStage) {
        this.activeWorkflows.delete(context.sessionId);
        console.log(`[WorkflowEngine] Session ${context.sessionId} completed`);
      }

      return result;

    } catch (error) {
      console.error(`[WorkflowEngine] Workflow execution failed:`, error);

      const result: WorkflowResult = {
        success: false,
        stage,
        sessionId: context.sessionId,
        error: error as Error,
        message: `Workflow execution failed: ${(error as Error).message}`,
      };

      this.emit('workflow-error', result);

      return result;
    }
  }

  /**
   * Get workflow for a stage
   */
  getWorkflow(stage: WorkflowStage): BaseWorkflow | undefined {
    return this.workflows.get(stage);
  }

  /**
   * Get active workflow for a session
   */
  getActiveStage(sessionId: string): WorkflowStage | undefined {
    return this.activeWorkflows.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.activeWorkflows.keys());
  }

  /**
   * Check if a session is active
   */
  isSessionActive(sessionId: string): boolean {
    return this.activeWorkflows.has(sessionId);
  }

  /**
   * Start the workflow engine (starts file watcher)
   */
  async start(): Promise<void> {
    console.log('[WorkflowEngine] Starting workflow engine...');

    if (!learningLoopWatcher.isWatcherRunning()) {
      await learningLoopWatcher.start();
    }

    this.emit('started');
    console.log('[WorkflowEngine] Workflow engine started');
  }

  /**
   * Stop the workflow engine (stops file watcher)
   */
  async stop(): Promise<void> {
    console.log('[WorkflowEngine] Stopping workflow engine...');

    if (learningLoopWatcher.isWatcherRunning()) {
      await learningLoopWatcher.stop();
    }

    this.emit('stopped');
    console.log('[WorkflowEngine] Workflow engine stopped');
  }

  /**
   * Get engine status
   */
  getStatus(): {
    isRunning: boolean;
    activeSessions: number;
    activeWorkflows: Array<{ sessionId: string; stage: WorkflowStage }>;
  } {
    return {
      isRunning: learningLoopWatcher.isWatcherRunning(),
      activeSessions: this.activeWorkflows.size,
      activeWorkflows: Array.from(this.activeWorkflows.entries()).map(([sessionId, stage]) => ({
        sessionId,
        stage,
      })),
    };
  }
}

/**
 * Singleton instance
 */
export const workflowEngine = new WorkflowEngine();

/**
 * Event type definitions for TypeScript
 */
declare module './workflow-engine' {
  interface WorkflowEngine {
    on(event: 'started', listener: () => void): this;
    on(event: 'stopped', listener: () => void): this;
    on(event: 'workflow-complete', listener: (result: WorkflowResult) => void): this;
    on(event: 'workflow-error', listener: (result: WorkflowResult) => void): this;
    on(event: 'error', listener: (error: { error: Error; filePath?: string }) => void): this;

    emit(event: 'started'): boolean;
    emit(event: 'stopped'): boolean;
    emit(event: 'workflow-complete', result: WorkflowResult): boolean;
    emit(event: 'workflow-error', result: WorkflowResult): boolean;
    emit(event: 'error', error: { error: Error; filePath?: string }): boolean;
  }
}
