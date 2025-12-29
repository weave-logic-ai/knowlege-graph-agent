/**
 * Workflow Registry
 *
 * Manages workflow definitions, execution, and history tracking.
 * Supports step dependencies, parallel execution, and rollback.
 *
 * @module workflows/registry
 */

import { createLogger } from '../utils/index.js';
import {
  WorkflowStatus,
  type WorkflowDefinition,
  type WorkflowStep,
  type WorkflowExecution,
  type WorkflowResult,
  type WorkflowExecutionStats,
  type StepExecution,
  type StepContext,
  type WorkflowRegistryOptions,
  type WorkflowListOptions,
  type ExecutionHistoryOptions,
  type WorkflowEvent,
  type WorkflowEventType,
  type WorkflowEventListener,
} from './types.js';

const logger = createLogger('workflow-registry');

/**
 * Generate unique execution ID
 */
function generateExecutionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `exec_${timestamp}_${random}`;
}

/**
 * Workflow Registry
 *
 * Central registry for managing workflow definitions and executions.
 *
 * @example
 * ```typescript
 * const registry = new WorkflowRegistry();
 *
 * // Register a workflow
 * registry.register({
 *   id: 'sync-workflow',
 *   name: 'Sync Knowledge Graph',
 *   version: '1.0.0',
 *   steps: [
 *     {
 *       id: 'analyze',
 *       name: 'Analyze Changes',
 *       handler: async (input, ctx) => {
 *         // Analyze logic
 *         return { changes: [] };
 *       },
 *     },
 *     {
 *       id: 'sync',
 *       name: 'Sync to Memory',
 *       dependencies: ['analyze'],
 *       handler: async (input, ctx) => {
 *         const analysis = ctx.previousResults.get('analyze');
 *         // Sync logic
 *       },
 *     },
 *   ],
 * });
 *
 * // Execute workflow
 * const result = await registry.execute('sync-workflow', { projectRoot: '.' });
 * ```
 */
export class WorkflowRegistry {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private history: WorkflowExecution[] = [];
  private activeExecutions: Set<string> = new Set();
  private eventListeners: Map<WorkflowEventType | '*', Set<WorkflowEventListener>> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();

  private options: Required<WorkflowRegistryOptions>;

  constructor(options: WorkflowRegistryOptions = {}) {
    this.options = {
      maxConcurrentExecutions: options.maxConcurrentExecutions ?? 10,
      defaultStepTimeout: options.defaultStepTimeout ?? 300000, // 5 minutes
      defaultRetries: options.defaultRetries ?? 3,
      defaultRetryDelay: options.defaultRetryDelay ?? 1000,
      persistHistory: options.persistHistory ?? true,
      maxHistoryEntries: options.maxHistoryEntries ?? 1000,
      logger: options.logger ?? ((level, msg, data) => {
        if (level === 'error') logger.error(msg, data as Error | undefined);
        else if (level === 'warn') logger.warn(msg, data);
        else if (level === 'debug') logger.debug(msg, data);
        else logger.info(msg, data);
      }),
    };
  }

  /**
   * Register a workflow definition
   */
  register<TInput = unknown, TOutput = unknown>(
    workflow: WorkflowDefinition<TInput, TOutput>
  ): void {
    // Validate workflow
    this.validateWorkflow(workflow as WorkflowDefinition);

    // Check for duplicate
    if (this.workflows.has(workflow.id)) {
      logger.warn('Overwriting existing workflow', { workflowId: workflow.id });
    }

    // Store with type assertion - the generic types are preserved at runtime
    this.workflows.set(workflow.id, workflow as unknown as WorkflowDefinition);
    logger.info('Workflow registered', {
      workflowId: workflow.id,
      version: workflow.version,
      steps: workflow.steps.length,
    });
  }

  /**
   * Unregister a workflow definition
   */
  unregister(workflowId: string): boolean {
    const existed = this.workflows.delete(workflowId);
    if (existed) {
      logger.info('Workflow unregistered', { workflowId });
    }
    return existed;
  }

  /**
   * Get a workflow definition by ID
   */
  get<TInput = unknown, TOutput = unknown>(
    workflowId: string
  ): WorkflowDefinition<TInput, TOutput> | undefined {
    return this.workflows.get(workflowId) as WorkflowDefinition<TInput, TOutput> | undefined;
  }

  /**
   * List all registered workflows
   */
  list(options: WorkflowListOptions = {}): WorkflowDefinition[] {
    let workflows = Array.from(this.workflows.values());

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      workflows = workflows.filter(w =>
        w.tags?.some(t => options.tags!.includes(t))
      );
    }

    // Filter by version
    if (options.version) {
      const versionPattern = new RegExp(options.version);
      workflows = workflows.filter(w => versionPattern.test(w.version));
    }

    // Filter by name pattern
    if (options.namePattern) {
      const namePattern = new RegExp(options.namePattern, 'i');
      workflows = workflows.filter(w => namePattern.test(w.name));
    }

    // Apply pagination
    const offset = options.offset ?? 0;
    const limit = options.limit ?? workflows.length;
    workflows = workflows.slice(offset, offset + limit);

    return workflows;
  }

  /**
   * Execute a workflow
   */
  async execute<TInput = unknown, TOutput = unknown>(
    workflowId: string,
    input: TInput,
    options: { metadata?: Record<string, unknown> } = {}
  ): Promise<WorkflowResult<TOutput>> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Check concurrent execution limit
    if (this.activeExecutions.size >= this.options.maxConcurrentExecutions) {
      throw new Error('Maximum concurrent executions reached');
    }

    // Create execution record
    const executionId = generateExecutionId();
    const abortController = new AbortController();
    this.abortControllers.set(executionId, abortController);

    const execution: WorkflowExecution<TInput, TOutput> = {
      id: executionId,
      workflowId,
      status: WorkflowStatus.Pending,
      input,
      state: { ...workflow.initialState },
      steps: new Map(),
      createdAt: new Date(),
      metadata: options.metadata,
      progress: 0,
    };

    // Initialize step executions
    for (const step of workflow.steps) {
      execution.steps.set(step.id, {
        stepId: step.id,
        status: WorkflowStatus.Pending,
        attempts: 0,
      });
    }

    this.executions.set(executionId, execution as WorkflowExecution);
    this.activeExecutions.add(executionId);

    try {
      // Start execution
      execution.status = WorkflowStatus.Running;
      execution.startedAt = new Date();
      this.emitEvent('workflow:started', executionId, workflowId);

      // Create step context
      const context: StepContext = {
        workflowId,
        stepId: '',
        previousResults: new Map(),
        state: execution.state,
        log: (message, data) => {
          this.options.logger('info', `[${workflowId}] ${message}`, data);
        },
        signal: abortController.signal,
      };

      // Call onStart hook
      if (workflow.onStart) {
        await workflow.onStart(input as never, context);
      }

      // Execute steps in dependency order
      const completedSteps: Set<string> = new Set();
      const stepResults = new Map<string, unknown>();

      await this.executeSteps(
        workflow,
        execution as WorkflowExecution,
        context,
        completedSteps,
        stepResults
      );

      // Transform output
      const output = workflow.transformOutput
        ? workflow.transformOutput(stepResults)
        : stepResults.get(workflow.steps[workflow.steps.length - 1]?.id);

      execution.output = output as TOutput;
      execution.status = WorkflowStatus.Completed;
      execution.completedAt = new Date();
      execution.durationMs = execution.completedAt.getTime() - execution.startedAt.getTime();
      execution.progress = 100;

      // Call onComplete hook
      if (workflow.onComplete) {
        await workflow.onComplete(output as never, context);
      }

      this.emitEvent('workflow:completed', executionId, workflowId);

      return this.createResult(execution as WorkflowExecution, stepResults);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      execution.error = errorMessage;
      execution.errorStack = errorStack;
      execution.status = WorkflowStatus.Failed;
      execution.completedAt = new Date();
      execution.durationMs = execution.startedAt
        ? execution.completedAt.getTime() - execution.startedAt.getTime()
        : 0;

      // Call onError hook
      if (workflow.onError) {
        const context: StepContext = {
          workflowId,
          stepId: '',
          previousResults: new Map(),
          state: execution.state,
          log: (message, data) => {
            this.options.logger('info', `[${workflowId}] ${message}`, data);
          },
        };
        await workflow.onError(error instanceof Error ? error : new Error(errorMessage), context);
      }

      // Attempt rollback if enabled
      if (workflow.enableRollback) {
        await this.rollback(execution as WorkflowExecution, workflow);
      }

      this.emitEvent('workflow:failed', executionId, workflowId, undefined, { error: errorMessage });

      return this.createResult(execution as WorkflowExecution, new Map());
    } finally {
      this.activeExecutions.delete(executionId);
      this.abortControllers.delete(executionId);

      // Add to history
      if (this.options.persistHistory) {
        this.history.push(execution as WorkflowExecution);
        if (this.history.length > this.options.maxHistoryEntries) {
          this.history.shift();
        }
      }
    }
  }

  /**
   * Cancel a running workflow execution
   */
  cancel(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== WorkflowStatus.Running) {
      return false;
    }

    const abortController = this.abortControllers.get(executionId);
    if (abortController) {
      abortController.abort();
    }

    execution.status = WorkflowStatus.Cancelled;
    execution.completedAt = new Date();
    this.emitEvent('workflow:cancelled', executionId, execution.workflowId);

    return true;
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get execution history
   */
  getHistory(options: ExecutionHistoryOptions = {}): WorkflowExecution[] {
    let history = [...this.history];

    // Apply filters
    if (options.workflowId) {
      history = history.filter(e => e.workflowId === options.workflowId);
    }
    if (options.status) {
      history = history.filter(e => e.status === options.status);
    }
    if (options.after) {
      history = history.filter(e => e.startedAt && e.startedAt >= options.after!);
    }
    if (options.before) {
      history = history.filter(e => e.startedAt && e.startedAt <= options.before!);
    }

    // Sort
    history.sort((a, b) => {
      const aTime = a.startedAt?.getTime() ?? a.createdAt.getTime();
      const bTime = b.startedAt?.getTime() ?? b.createdAt.getTime();
      return options.sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
    });

    // Apply pagination
    const offset = options.offset ?? 0;
    const limit = options.limit ?? history.length;
    return history.slice(offset, offset + limit);
  }

  /**
   * Add event listener
   */
  on(event: WorkflowEventType | '*', listener: WorkflowEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  off(event: WorkflowEventType | '*', listener: WorkflowEventListener): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  /**
   * Clear all executions and history
   */
  clear(): void {
    this.executions.clear();
    this.history = [];
    this.activeExecutions.clear();
  }

  // Private methods

  private validateWorkflow(workflow: WorkflowDefinition): void {
    if (!workflow.id) {
      throw new Error('Workflow must have an id');
    }
    if (!workflow.name) {
      throw new Error('Workflow must have a name');
    }
    if (!workflow.version) {
      throw new Error('Workflow must have a version');
    }
    if (!workflow.steps || workflow.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    // Validate steps
    const stepIds = new Set<string>();
    for (const step of workflow.steps) {
      if (!step.id) {
        throw new Error('Step must have an id');
      }
      if (!step.name) {
        throw new Error(`Step ${step.id} must have a name`);
      }
      if (!step.handler) {
        throw new Error(`Step ${step.id} must have a handler`);
      }
      if (stepIds.has(step.id)) {
        throw new Error(`Duplicate step id: ${step.id}`);
      }
      stepIds.add(step.id);
    }

    // Validate dependencies
    for (const step of workflow.steps) {
      if (step.dependencies) {
        for (const dep of step.dependencies) {
          if (!stepIds.has(dep)) {
            throw new Error(`Step ${step.id} depends on unknown step: ${dep}`);
          }
        }
      }
    }

    // Check for circular dependencies
    this.checkCircularDependencies(workflow.steps);
  }

  private checkCircularDependencies(steps: WorkflowStep[]): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (stepId: string): boolean => {
      visited.add(stepId);
      recursionStack.add(stepId);

      const step = steps.find(s => s.id === stepId);
      if (step?.dependencies) {
        for (const dep of step.dependencies) {
          if (!visited.has(dep)) {
            if (dfs(dep)) return true;
          } else if (recursionStack.has(dep)) {
            return true;
          }
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    for (const step of steps) {
      if (!visited.has(step.id)) {
        if (dfs(step.id)) {
          throw new Error(`Circular dependency detected involving step: ${step.id}`);
        }
      }
    }
  }

  private async executeSteps(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    context: StepContext,
    completedSteps: Set<string>,
    stepResults: Map<string, unknown>
  ): Promise<void> {
    const remainingSteps = workflow.steps.filter(s => !completedSteps.has(s.id));

    if (remainingSteps.length === 0) {
      return;
    }

    // Find steps that can be executed (all dependencies completed)
    const executableSteps = remainingSteps.filter(step => {
      if (!step.dependencies || step.dependencies.length === 0) {
        return true;
      }
      return step.dependencies.every(dep => completedSteps.has(dep));
    });

    if (executableSteps.length === 0) {
      // This shouldn't happen if dependency validation is correct
      throw new Error('No executable steps found but workflow not complete');
    }

    // Group parallel steps
    const parallelSteps = executableSteps.filter(s => s.parallel !== false);
    const sequentialSteps = executableSteps.filter(s => s.parallel === false);

    // Execute parallel steps concurrently
    if (parallelSteps.length > 0) {
      await Promise.all(
        parallelSteps.map(step =>
          this.executeStep(step, workflow, execution, context, stepResults)
        )
      );
      parallelSteps.forEach(s => completedSteps.add(s.id));
    }

    // Execute sequential steps one by one
    for (const step of sequentialSteps) {
      await this.executeStep(step, workflow, execution, context, stepResults);
      completedSteps.add(step.id);
    }

    // Update progress
    execution.progress = Math.round((completedSteps.size / workflow.steps.length) * 100);

    // Continue with remaining steps
    await this.executeSteps(workflow, execution, context, completedSteps, stepResults);
  }

  private async executeStep(
    step: WorkflowStep,
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    context: StepContext,
    stepResults: Map<string, unknown>
  ): Promise<void> {
    const stepExecution = execution.steps.get(step.id)!;
    execution.currentStep = step.id;

    // Check abort signal
    if (context.signal?.aborted) {
      throw new Error('Workflow cancelled');
    }

    // Update context
    context.stepId = step.id;
    context.previousResults = new Map(stepResults);

    // Check condition
    if (step.condition) {
      const shouldRun = await step.condition(context);
      if (!shouldRun) {
        stepExecution.status = WorkflowStatus.Completed;
        stepExecution.skipped = true;
        stepExecution.skipReason = 'Condition not met';
        this.emitEvent('step:skipped', execution.id, workflow.id, step.id);
        return;
      }
    }

    stepExecution.status = WorkflowStatus.Running;
    stepExecution.startedAt = new Date();
    this.emitEvent('step:started', execution.id, workflow.id, step.id);

    const timeout = step.timeout ?? this.options.defaultStepTimeout;
    const maxRetries = step.retries ?? this.options.defaultRetries;
    const retryDelay = step.retryDelay ?? this.options.defaultRetryDelay;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      stepExecution.attempts = attempt + 1;

      try {
        // Get input
        const input = step.transformInput
          ? step.transformInput(context.previousResults)
          : context.previousResults.get(step.dependencies?.[0] ?? '');

        // Execute with timeout
        const result = await this.executeWithTimeout(
          step.handler(input, context),
          timeout,
          `Step ${step.id} timed out after ${timeout}ms`
        );

        stepExecution.result = result;
        stepExecution.status = WorkflowStatus.Completed;
        stepExecution.completedAt = new Date();
        stepExecution.durationMs =
          stepExecution.completedAt.getTime() - stepExecution.startedAt!.getTime();

        stepResults.set(step.id, result);
        this.emitEvent('step:completed', execution.id, workflow.id, step.id);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          this.emitEvent('step:retrying', execution.id, workflow.id, step.id, {
            attempt: attempt + 1,
            error: lastError.message,
          });
          await this.sleep(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    // All retries exhausted
    stepExecution.error = lastError?.message ?? 'Unknown error';
    stepExecution.errorStack = lastError?.stack;
    stepExecution.status = WorkflowStatus.Failed;
    stepExecution.completedAt = new Date();
    stepExecution.durationMs =
      stepExecution.completedAt.getTime() - stepExecution.startedAt!.getTime();

    this.emitEvent('step:failed', execution.id, workflow.id, step.id, {
      error: stepExecution.error,
    });

    // If step is optional, don't throw
    if (step.optional) {
      stepExecution.skipped = true;
      stepExecution.skipReason = 'Failed but optional';
      return;
    }

    throw lastError ?? new Error(`Step ${step.id} failed`);
  }

  private async rollback(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition
  ): Promise<void> {
    execution.status = WorkflowStatus.RollingBack;
    this.emitEvent('rollback:started', execution.id, workflow.id);

    const context: StepContext = {
      workflowId: workflow.id,
      stepId: '',
      previousResults: new Map(),
      state: execution.state,
      log: (message, data) => {
        this.options.logger('info', `[${workflow.id}] ${message}`, data);
      },
    };

    // Get completed steps in reverse order
    const completedSteps = workflow.steps
      .filter(s => {
        const stepExec = execution.steps.get(s.id);
        return stepExec?.status === WorkflowStatus.Completed && !stepExec.skipped;
      })
      .reverse();

    let rollbackFailed = false;

    for (const step of completedSteps) {
      if (!step.rollback) continue;

      context.stepId = step.id;
      const stepExec = execution.steps.get(step.id)!;

      try {
        await step.rollback(stepExec.result, context);
        logger.info('Step rolled back', { stepId: step.id });
      } catch (error) {
        logger.error(
          'Rollback failed for step',
          error instanceof Error ? error : new Error(String(error)),
          { stepId: step.id }
        );
        rollbackFailed = true;
      }
    }

    execution.rolledBack = true;
    execution.status = rollbackFailed ? WorkflowStatus.Failed : WorkflowStatus.RolledBack;
    this.emitEvent(
      rollbackFailed ? 'rollback:failed' : 'rollback:completed',
      execution.id,
      workflow.id
    );
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createResult<TOutput>(
    execution: WorkflowExecution,
    stepResults: Map<string, unknown>
  ): WorkflowResult<TOutput> {
    const stepErrors = new Map<string, string>();
    let completedSteps = 0;
    let failedSteps = 0;
    let skippedSteps = 0;
    let totalRetries = 0;

    for (const [stepId, stepExec] of execution.steps) {
      if (stepExec.status === WorkflowStatus.Completed) {
        if (stepExec.skipped) {
          skippedSteps++;
        } else {
          completedSteps++;
        }
      } else if (stepExec.status === WorkflowStatus.Failed) {
        failedSteps++;
        if (stepExec.error) {
          stepErrors.set(stepId, stepExec.error);
        }
      }
      totalRetries += Math.max(0, stepExec.attempts - 1);
    }

    const stats: WorkflowExecutionStats = {
      totalSteps: execution.steps.size,
      completedSteps,
      failedSteps,
      skippedSteps,
      totalRetries,
      startTime: execution.startedAt ?? execution.createdAt,
      endTime: execution.completedAt ?? new Date(),
      totalDurationMs: execution.durationMs ?? 0,
      avgStepDurationMs: completedSteps > 0 ? (execution.durationMs ?? 0) / completedSteps : 0,
    };

    return {
      success: execution.status === WorkflowStatus.Completed,
      executionId: execution.id,
      workflowId: execution.workflowId,
      status: execution.status,
      output: execution.output as TOutput,
      error: execution.error,
      errorStack: execution.errorStack,
      durationMs: execution.durationMs ?? 0,
      stepResults,
      stepErrors,
      rolledBack: execution.rolledBack ?? false,
      stats,
    };
  }

  private emitEvent(
    type: WorkflowEventType,
    executionId: string,
    workflowId: string,
    stepId?: string,
    data?: Record<string, unknown>
  ): void {
    const event: WorkflowEvent = {
      type,
      executionId,
      workflowId,
      stepId,
      timestamp: new Date(),
      data,
      error: data?.error as string | undefined,
    };

    // Emit to specific listeners
    const specificListeners = this.eventListeners.get(type);
    if (specificListeners) {
      for (const listener of specificListeners) {
        try {
          const result = listener(event);
          if (result instanceof Promise) {
            result.catch(err => logger.error('Event listener error', err));
          }
        } catch (error) {
          logger.error('Event listener error', error as Error);
        }
      }
    }

    // Emit to wildcard listeners
    const wildcardListeners = this.eventListeners.get('*');
    if (wildcardListeners) {
      for (const listener of wildcardListeners) {
        try {
          const result = listener(event);
          if (result instanceof Promise) {
            result.catch(err => logger.error('Event listener error', err));
          }
        } catch (error) {
          logger.error('Event listener error', error as Error);
        }
      }
    }
  }
}

/**
 * Create a workflow registry instance
 */
export function createWorkflowRegistry(
  options?: WorkflowRegistryOptions
): WorkflowRegistry {
  return new WorkflowRegistry(options);
}
