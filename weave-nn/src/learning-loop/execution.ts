/**
 * Execution System
 * Executes plans using workflow engine and MCP tools
 */

import type {
  Plan,
  Outcome,
  ExecutionInput,
  ExecutionResult,
  ExecutionMetrics,
  WorkflowDefinition,
  ExecutionError,
} from './types';

interface ClaudeFlowClient {
  workflow_create: (params: any) => Promise<any>;
  workflow_execute: (params: any) => Promise<any>;
  workflow_status: (params: any) => Promise<any>;
  daa_fault_tolerance: (params: any) => Promise<any>;
}

interface WorkflowEngine {
  registerWorkflow: (workflow: WorkflowDefinition) => Promise<void>;
  executeWorkflow: (id: string, context: any) => Promise<any>;
}

/**
 * Execution System
 * Translates plans into actions and monitors results
 */
export class ExecutionSystem {
  constructor(
    private claudeFlow: ClaudeFlowClient,
    private workflowEngine?: WorkflowEngine
  ) {}

  /**
   * Execute plan and return outcome
   */
  async execute(input: ExecutionInput): Promise<Outcome> {
    const { plan, monitoring = true, retryOnFailure = true } = input;

    const startTime = Date.now();
    const logs: string[] = [];

    try {
      logs.push(`Starting execution of plan: ${plan.id}`);
      logs.push(`Steps to execute: ${plan.steps.length}`);

      // Create workflow from plan
      const workflow = await this.createWorkflow(plan);
      logs.push(`Created workflow: ${workflow.id}`);

      // Execute workflow with monitoring
      const result = monitoring
        ? await this.executeWithMonitoring(workflow.id)
        : await this.executeWorkflowDirect(workflow.id);

      const endTime = Date.now();
      const duration = endTime - startTime;

      logs.push(`Execution completed in ${duration}ms`);

      // Build outcome
      const outcome: Outcome = {
        success: result.success,
        data: result.data,
        error: result.error,
        duration,
        metrics: this.buildMetrics(startTime, endTime, plan, result),
        logs,
        timestamp: endTime,
      };

      return outcome;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      logs.push(`Execution failed: ${error.message}`);

      // Try fault tolerance recovery if enabled
      if (retryOnFailure) {
        try {
          logs.push('Attempting fault tolerance recovery...');
          const recovery = await this.recoverFromFailure(plan, error);

          if (recovery.success) {
            logs.push('✓ Recovery successful');
            return {
              success: true,
              data: recovery.data,
              duration: Date.now() - startTime,
              metrics: this.buildMetrics(startTime, Date.now(), plan, recovery),
              logs,
              timestamp: Date.now(),
            };
          }
        } catch (recoveryError) {
          logs.push(`Recovery failed: ${recoveryError.message}`);
        }
      }

      // Return failure outcome
      return {
        success: false,
        error: error as Error,
        duration,
        metrics: this.buildMetrics(startTime, endTime, plan, { success: false, stepsCompleted: 0 }),
        logs,
        timestamp: endTime,
      };
    }
  }

  /**
   * Create workflow from plan using MCP
   */
  private async createWorkflow(plan: Plan): Promise<{ id: string }> {
    try {
      // Convert plan steps to workflow format
      const workflowSteps = plan.steps.map((step) => ({
        name: step.name,
        action: step.action,
        params: step.params,
      }));

      // Create workflow via Claude-Flow
      const workflow = await this.claudeFlow.workflow_create({
        name: `task_${plan.taskId}`,
        steps: workflowSteps,
        triggers: ['manual'],
      });

      return { id: workflow.id };
    } catch (error) {
      throw new (ExecutionError as any)(
        `Failed to create workflow: ${error.message}`,
        { plan, error }
      );
    }
  }

  /**
   * Execute workflow with real-time monitoring
   */
  private async executeWithMonitoring(workflowId: string): Promise<any> {
    // Start async execution
    const execution = await this.claudeFlow.workflow_execute({
      workflow_id: workflowId,
      async: true,
    });

    // Poll for completion with timeout
    const maxWaitMs = 300000; // 5 minutes
    const pollIntervalMs = 1000; // 1 second
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const status = await this.claudeFlow.workflow_status({
        workflow_id: workflowId,
        execution_id: execution.id,
      });

      if (status.status === 'completed') {
        return {
          success: true,
          data: status.result,
          stepsCompleted: status.stepsCompleted || 0,
        };
      }

      if (status.status === 'failed') {
        return {
          success: false,
          error: new Error(status.error || 'Workflow execution failed'),
          stepsCompleted: status.stepsCompleted || 0,
        };
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error('Workflow execution timeout');
  }

  /**
   * Execute workflow directly without monitoring
   */
  private async executeWorkflowDirect(workflowId: string): Promise<any> {
    const result = await this.claudeFlow.workflow_execute({
      workflow_id: workflowId,
      async: false,
    });

    return {
      success: result.success,
      data: result.data,
      error: result.error,
      stepsCompleted: result.stepsCompleted || 0,
    };
  }

  /**
   * Attempt to recover from execution failure
   */
  private async recoverFromFailure(plan: Plan, error: any): Promise<any> {
    try {
      const recovery = await this.claudeFlow.daa_fault_tolerance({
        agentId: plan.id,
        strategy: 'retry',
      });

      return {
        success: recovery.success,
        data: recovery.data,
        stepsCompleted: recovery.stepsCompleted || 0,
      };
    } catch (recoveryError) {
      return {
        success: false,
        error: recoveryError,
        stepsCompleted: 0,
      };
    }
  }

  /**
   * Build execution metrics
   */
  private buildMetrics(
    startTime: number,
    endTime: number,
    plan: Plan,
    result: any
  ): ExecutionMetrics {
    const duration = endTime - startTime;
    const stepsCompleted = result.stepsCompleted || 0;
    const stepsTotal = plan.steps.length;
    const successRate = stepsTotal > 0 ? stepsCompleted / stepsTotal : 0;
    const errorCount = result.success ? 0 : 1;

    return {
      startTime,
      endTime,
      duration,
      stepsCompleted,
      stepsTotal,
      successRate,
      errorCount,
    };
  }
}
