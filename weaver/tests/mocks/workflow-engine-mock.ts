/**
 * Mock Workflow Engine
 *
 * Mock implementation of WorkflowEngine for testing workflow MCP tools.
 * Provides in-memory workflow registry and execution tracking.
 */

import type {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowContext,
  WorkflowTrigger,
  WorkflowStats,
} from '../../src/workflow-engine/types.js';
import type { WorkflowRegistry } from '../../src/workflow-engine/registry.js';

/**
 * Mock Workflow Registry
 */
export class MockWorkflowRegistry implements WorkflowRegistry {
  private workflows = new Map<string, WorkflowDefinition>();
  private executions = new Map<string, WorkflowExecution>();
  private executionCounter = 0;

  register(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
  }

  unregister(workflowId: string): void {
    this.workflows.delete(workflowId);
  }

  getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId);
  }

  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  getWorkflowsByTrigger(trigger: WorkflowTrigger): WorkflowDefinition[] {
    return Array.from(this.workflows.values()).filter(
      (w) => w.enabled && (w.triggers.includes(trigger) || w.triggers.includes('file:any'))
    );
  }

  recordExecutionStart(context: WorkflowContext): WorkflowExecution {
    const workflow = this.workflows.get(context.workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${context.workflowId}`);
    }

    const execution: WorkflowExecution = {
      id: `exec-${++this.executionCounter}`,
      workflowId: context.workflowId,
      workflowName: workflow.name,
      trigger: context.trigger,
      status: 'running',
      startedAt: context.triggeredAt,
      fileEvent: context.fileEvent,
    };

    this.executions.set(execution.id, execution);
    return execution;
  }

  recordExecutionComplete(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.status = 'completed';
    execution.completedAt = new Date();
    execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
  }

  recordExecutionFailure(executionId: string, error: Error): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.status = 'failed';
    execution.completedAt = new Date();
    execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
    execution.error = error.message;
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  getRecentExecutions(limit = 10): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  getExecutionsByWorkflow(workflowId: string, limit = 10): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter((e) => e.workflowId === workflowId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

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

  // Test helper methods
  clearExecutions(): void {
    this.executions.clear();
    this.executionCounter = 0;
  }

  clearWorkflows(): void {
    this.workflows.clear();
  }

  addMockExecution(execution: WorkflowExecution): void {
    this.executions.set(execution.id, execution);
  }
}

/**
 * Mock Workflow Engine
 */
export class MockWorkflowEngine {
  private registry: MockWorkflowRegistry;
  private isRunning = false;

  constructor() {
    this.registry = new MockWorkflowRegistry();
  }

  async start(): Promise<void> {
    this.isRunning = true;
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  registerWorkflow(workflow: WorkflowDefinition): void {
    this.registry.register(workflow);
  }

  unregisterWorkflow(workflowId: string): void {
    this.registry.unregister(workflowId);
  }

  async triggerManual(workflowId: string, metadata?: Record<string, unknown>): Promise<void> {
    const workflow = this.registry.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (!workflow.enabled) {
      throw new Error(`Workflow is disabled: ${workflowId}`);
    }

    const context: WorkflowContext = {
      workflowId,
      trigger: 'manual',
      triggeredAt: new Date(),
      metadata,
    };

    const execution = this.registry.recordExecutionStart(context);

    try {
      await workflow.handler(context);
      this.registry.recordExecutionComplete(execution.id);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.registry.recordExecutionFailure(execution.id, err);
      throw err;
    }
  }

  getRegistry(): MockWorkflowRegistry {
    return this.registry;
  }

  getStats() {
    return this.registry.getStats();
  }
}

/**
 * Create mock workflow definitions for testing
 */
export function createMockWorkflows(): WorkflowDefinition[] {
  return [
    {
      id: 'test-workflow-1',
      name: 'Test Workflow 1',
      description: 'A test workflow for unit testing',
      triggers: ['file:add', 'manual'],
      enabled: true,
      fileFilter: '**/*.md',
      handler: async (context: WorkflowContext) => {
        // Simple test handler
        await new Promise((resolve) => setTimeout(resolve, 10));
      },
    },
    {
      id: 'test-workflow-2',
      name: 'Test Workflow 2',
      description: 'Another test workflow',
      triggers: ['file:change'],
      enabled: true,
      handler: async (context: WorkflowContext) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      },
    },
    {
      id: 'test-workflow-disabled',
      name: 'Disabled Test Workflow',
      description: 'A disabled workflow for testing filters',
      triggers: ['manual'],
      enabled: false,
      handler: async (context: WorkflowContext) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      },
    },
    {
      id: 'test-workflow-failing',
      name: 'Failing Test Workflow',
      description: 'A workflow that always fails for error testing',
      triggers: ['manual'],
      enabled: true,
      handler: async (context: WorkflowContext) => {
        throw new Error('Intentional test failure');
      },
    },
  ];
}

/**
 * Create mock execution records for testing
 */
export function createMockExecutions(): WorkflowExecution[] {
  const now = new Date();
  const hour = 3600000;

  return [
    {
      id: 'exec-completed-1',
      workflowId: 'test-workflow-1',
      workflowName: 'Test Workflow 1',
      trigger: 'manual',
      status: 'completed',
      startedAt: new Date(now.getTime() - hour * 2),
      completedAt: new Date(now.getTime() - hour * 2 + 1000),
      duration: 1000,
    },
    {
      id: 'exec-failed-1',
      workflowId: 'test-workflow-failing',
      workflowName: 'Failing Test Workflow',
      trigger: 'manual',
      status: 'failed',
      startedAt: new Date(now.getTime() - hour),
      completedAt: new Date(now.getTime() - hour + 500),
      duration: 500,
      error: 'Intentional test failure',
    },
    {
      id: 'exec-running-1',
      workflowId: 'test-workflow-2',
      workflowName: 'Test Workflow 2',
      trigger: 'file:change',
      status: 'running',
      startedAt: new Date(now.getTime() - 5000),
    },
  ];
}

/**
 * Setup a mock workflow engine with test data
 */
export function setupMockWorkflowEngine(): MockWorkflowEngine {
  const engine = new MockWorkflowEngine();

  // Register mock workflows
  const workflows = createMockWorkflows();
  workflows.forEach((workflow) => engine.registerWorkflow(workflow));

  // Add mock execution history
  const executions = createMockExecutions();
  executions.forEach((execution) => engine.getRegistry().addMockExecution(execution));

  return engine;
}
