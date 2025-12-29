import { createLogger } from "../utils/logger.js";
import { WorkflowStatus } from "./types.js";
const logger = createLogger("workflow-registry");
function generateExecutionId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `exec_${timestamp}_${random}`;
}
class WorkflowRegistry {
  workflows = /* @__PURE__ */ new Map();
  executions = /* @__PURE__ */ new Map();
  history = [];
  activeExecutions = /* @__PURE__ */ new Set();
  eventListeners = /* @__PURE__ */ new Map();
  abortControllers = /* @__PURE__ */ new Map();
  options;
  constructor(options = {}) {
    this.options = {
      maxConcurrentExecutions: options.maxConcurrentExecutions ?? 10,
      defaultStepTimeout: options.defaultStepTimeout ?? 3e5,
      // 5 minutes
      defaultRetries: options.defaultRetries ?? 3,
      defaultRetryDelay: options.defaultRetryDelay ?? 1e3,
      persistHistory: options.persistHistory ?? true,
      maxHistoryEntries: options.maxHistoryEntries ?? 1e3,
      logger: options.logger ?? ((level, msg, data) => {
        if (level === "error") logger.error(msg, data);
        else if (level === "warn") logger.warn(msg, data);
        else if (level === "debug") logger.debug(msg, data);
        else logger.info(msg, data);
      })
    };
  }
  /**
   * Register a workflow definition
   */
  register(workflow) {
    this.validateWorkflow(workflow);
    if (this.workflows.has(workflow.id)) {
      logger.warn("Overwriting existing workflow", { workflowId: workflow.id });
    }
    this.workflows.set(workflow.id, workflow);
    logger.info("Workflow registered", {
      workflowId: workflow.id,
      version: workflow.version,
      steps: workflow.steps.length
    });
  }
  /**
   * Unregister a workflow definition
   */
  unregister(workflowId) {
    const existed = this.workflows.delete(workflowId);
    if (existed) {
      logger.info("Workflow unregistered", { workflowId });
    }
    return existed;
  }
  /**
   * Get a workflow definition by ID
   */
  get(workflowId) {
    return this.workflows.get(workflowId);
  }
  /**
   * List all registered workflows
   */
  list(options = {}) {
    let workflows = Array.from(this.workflows.values());
    if (options.tags && options.tags.length > 0) {
      workflows = workflows.filter(
        (w) => w.tags?.some((t) => options.tags.includes(t))
      );
    }
    if (options.version) {
      const versionPattern = new RegExp(options.version);
      workflows = workflows.filter((w) => versionPattern.test(w.version));
    }
    if (options.namePattern) {
      const namePattern = new RegExp(options.namePattern, "i");
      workflows = workflows.filter((w) => namePattern.test(w.name));
    }
    const offset = options.offset ?? 0;
    const limit = options.limit ?? workflows.length;
    workflows = workflows.slice(offset, offset + limit);
    return workflows;
  }
  /**
   * Execute a workflow
   */
  async execute(workflowId, input, options = {}) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    if (this.activeExecutions.size >= this.options.maxConcurrentExecutions) {
      throw new Error("Maximum concurrent executions reached");
    }
    const executionId = generateExecutionId();
    const abortController = new AbortController();
    this.abortControllers.set(executionId, abortController);
    const execution = {
      id: executionId,
      workflowId,
      status: WorkflowStatus.Pending,
      input,
      state: { ...workflow.initialState },
      steps: /* @__PURE__ */ new Map(),
      createdAt: /* @__PURE__ */ new Date(),
      metadata: options.metadata,
      progress: 0
    };
    for (const step of workflow.steps) {
      execution.steps.set(step.id, {
        stepId: step.id,
        status: WorkflowStatus.Pending,
        attempts: 0
      });
    }
    this.executions.set(executionId, execution);
    this.activeExecutions.add(executionId);
    try {
      execution.status = WorkflowStatus.Running;
      execution.startedAt = /* @__PURE__ */ new Date();
      this.emitEvent("workflow:started", executionId, workflowId);
      const context = {
        workflowId,
        stepId: "",
        previousResults: /* @__PURE__ */ new Map(),
        state: execution.state,
        log: (message, data) => {
          this.options.logger("info", `[${workflowId}] ${message}`, data);
        },
        signal: abortController.signal
      };
      if (workflow.onStart) {
        await workflow.onStart(input, context);
      }
      const completedSteps = /* @__PURE__ */ new Set();
      const stepResults = /* @__PURE__ */ new Map();
      await this.executeSteps(
        workflow,
        execution,
        context,
        completedSteps,
        stepResults
      );
      const output = workflow.transformOutput ? workflow.transformOutput(stepResults) : stepResults.get(workflow.steps[workflow.steps.length - 1]?.id);
      execution.output = output;
      execution.status = WorkflowStatus.Completed;
      execution.completedAt = /* @__PURE__ */ new Date();
      execution.durationMs = execution.completedAt.getTime() - execution.startedAt.getTime();
      execution.progress = 100;
      if (workflow.onComplete) {
        await workflow.onComplete(output, context);
      }
      this.emitEvent("workflow:completed", executionId, workflowId);
      return this.createResult(execution, stepResults);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : void 0;
      execution.error = errorMessage;
      execution.errorStack = errorStack;
      execution.status = WorkflowStatus.Failed;
      execution.completedAt = /* @__PURE__ */ new Date();
      execution.durationMs = execution.startedAt ? execution.completedAt.getTime() - execution.startedAt.getTime() : 0;
      if (workflow.onError) {
        const context = {
          workflowId,
          stepId: "",
          previousResults: /* @__PURE__ */ new Map(),
          state: execution.state,
          log: (message, data) => {
            this.options.logger("info", `[${workflowId}] ${message}`, data);
          }
        };
        await workflow.onError(error instanceof Error ? error : new Error(errorMessage), context);
      }
      if (workflow.enableRollback) {
        await this.rollback(execution, workflow);
      }
      this.emitEvent("workflow:failed", executionId, workflowId, void 0, { error: errorMessage });
      return this.createResult(execution, /* @__PURE__ */ new Map());
    } finally {
      this.activeExecutions.delete(executionId);
      this.abortControllers.delete(executionId);
      if (this.options.persistHistory) {
        this.history.push(execution);
        if (this.history.length > this.options.maxHistoryEntries) {
          this.history.shift();
        }
      }
    }
  }
  /**
   * Cancel a running workflow execution
   */
  cancel(executionId) {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== WorkflowStatus.Running) {
      return false;
    }
    const abortController = this.abortControllers.get(executionId);
    if (abortController) {
      abortController.abort();
    }
    execution.status = WorkflowStatus.Cancelled;
    execution.completedAt = /* @__PURE__ */ new Date();
    this.emitEvent("workflow:cancelled", executionId, execution.workflowId);
    return true;
  }
  /**
   * Get execution by ID
   */
  getExecution(executionId) {
    return this.executions.get(executionId);
  }
  /**
   * Get execution history
   */
  getHistory(options = {}) {
    let history = [...this.history];
    if (options.workflowId) {
      history = history.filter((e) => e.workflowId === options.workflowId);
    }
    if (options.status) {
      history = history.filter((e) => e.status === options.status);
    }
    if (options.after) {
      history = history.filter((e) => e.startedAt && e.startedAt >= options.after);
    }
    if (options.before) {
      history = history.filter((e) => e.startedAt && e.startedAt <= options.before);
    }
    history.sort((a, b) => {
      const aTime = a.startedAt?.getTime() ?? a.createdAt.getTime();
      const bTime = b.startedAt?.getTime() ?? b.createdAt.getTime();
      return options.sortOrder === "asc" ? aTime - bTime : bTime - aTime;
    });
    const offset = options.offset ?? 0;
    const limit = options.limit ?? history.length;
    return history.slice(offset, offset + limit);
  }
  /**
   * Add event listener
   */
  on(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, /* @__PURE__ */ new Set());
    }
    this.eventListeners.get(event).add(listener);
  }
  /**
   * Remove event listener
   */
  off(event, listener) {
    this.eventListeners.get(event)?.delete(listener);
  }
  /**
   * Clear all executions and history
   */
  clear() {
    this.executions.clear();
    this.history = [];
    this.activeExecutions.clear();
  }
  // Private methods
  validateWorkflow(workflow) {
    if (!workflow.id) {
      throw new Error("Workflow must have an id");
    }
    if (!workflow.name) {
      throw new Error("Workflow must have a name");
    }
    if (!workflow.version) {
      throw new Error("Workflow must have a version");
    }
    if (!workflow.steps || workflow.steps.length === 0) {
      throw new Error("Workflow must have at least one step");
    }
    const stepIds = /* @__PURE__ */ new Set();
    for (const step of workflow.steps) {
      if (!step.id) {
        throw new Error("Step must have an id");
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
    for (const step of workflow.steps) {
      if (step.dependencies) {
        for (const dep of step.dependencies) {
          if (!stepIds.has(dep)) {
            throw new Error(`Step ${step.id} depends on unknown step: ${dep}`);
          }
        }
      }
    }
    this.checkCircularDependencies(workflow.steps);
  }
  checkCircularDependencies(steps) {
    const visited = /* @__PURE__ */ new Set();
    const recursionStack = /* @__PURE__ */ new Set();
    const dfs = (stepId) => {
      visited.add(stepId);
      recursionStack.add(stepId);
      const step = steps.find((s) => s.id === stepId);
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
  async executeSteps(workflow, execution, context, completedSteps, stepResults) {
    const remainingSteps = workflow.steps.filter((s) => !completedSteps.has(s.id));
    if (remainingSteps.length === 0) {
      return;
    }
    const executableSteps = remainingSteps.filter((step) => {
      if (!step.dependencies || step.dependencies.length === 0) {
        return true;
      }
      return step.dependencies.every((dep) => completedSteps.has(dep));
    });
    if (executableSteps.length === 0) {
      throw new Error("No executable steps found but workflow not complete");
    }
    const parallelSteps = executableSteps.filter((s) => s.parallel !== false);
    const sequentialSteps = executableSteps.filter((s) => s.parallel === false);
    if (parallelSteps.length > 0) {
      await Promise.all(
        parallelSteps.map(
          (step) => this.executeStep(step, workflow, execution, context, stepResults)
        )
      );
      parallelSteps.forEach((s) => completedSteps.add(s.id));
    }
    for (const step of sequentialSteps) {
      await this.executeStep(step, workflow, execution, context, stepResults);
      completedSteps.add(step.id);
    }
    execution.progress = Math.round(completedSteps.size / workflow.steps.length * 100);
    await this.executeSteps(workflow, execution, context, completedSteps, stepResults);
  }
  async executeStep(step, workflow, execution, context, stepResults) {
    const stepExecution = execution.steps.get(step.id);
    execution.currentStep = step.id;
    if (context.signal?.aborted) {
      throw new Error("Workflow cancelled");
    }
    context.stepId = step.id;
    context.previousResults = new Map(stepResults);
    if (step.condition) {
      const shouldRun = await step.condition(context);
      if (!shouldRun) {
        stepExecution.status = WorkflowStatus.Completed;
        stepExecution.skipped = true;
        stepExecution.skipReason = "Condition not met";
        this.emitEvent("step:skipped", execution.id, workflow.id, step.id);
        return;
      }
    }
    stepExecution.status = WorkflowStatus.Running;
    stepExecution.startedAt = /* @__PURE__ */ new Date();
    this.emitEvent("step:started", execution.id, workflow.id, step.id);
    const timeout = step.timeout ?? this.options.defaultStepTimeout;
    const maxRetries = step.retries ?? this.options.defaultRetries;
    const retryDelay = step.retryDelay ?? this.options.defaultRetryDelay;
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      stepExecution.attempts = attempt + 1;
      try {
        const input = step.transformInput ? step.transformInput(context.previousResults) : context.previousResults.get(step.dependencies?.[0] ?? "");
        const result = await this.executeWithTimeout(
          step.handler(input, context),
          timeout,
          `Step ${step.id} timed out after ${timeout}ms`
        );
        stepExecution.result = result;
        stepExecution.status = WorkflowStatus.Completed;
        stepExecution.completedAt = /* @__PURE__ */ new Date();
        stepExecution.durationMs = stepExecution.completedAt.getTime() - stepExecution.startedAt.getTime();
        stepResults.set(step.id, result);
        this.emitEvent("step:completed", execution.id, workflow.id, step.id);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries) {
          this.emitEvent("step:retrying", execution.id, workflow.id, step.id, {
            attempt: attempt + 1,
            error: lastError.message
          });
          await this.sleep(retryDelay * Math.pow(2, attempt));
        }
      }
    }
    stepExecution.error = lastError?.message ?? "Unknown error";
    stepExecution.errorStack = lastError?.stack;
    stepExecution.status = WorkflowStatus.Failed;
    stepExecution.completedAt = /* @__PURE__ */ new Date();
    stepExecution.durationMs = stepExecution.completedAt.getTime() - stepExecution.startedAt.getTime();
    this.emitEvent("step:failed", execution.id, workflow.id, step.id, {
      error: stepExecution.error
    });
    if (step.optional) {
      stepExecution.skipped = true;
      stepExecution.skipReason = "Failed but optional";
      return;
    }
    throw lastError ?? new Error(`Step ${step.id} failed`);
  }
  async rollback(execution, workflow) {
    execution.status = WorkflowStatus.RollingBack;
    this.emitEvent("rollback:started", execution.id, workflow.id);
    const context = {
      workflowId: workflow.id,
      stepId: "",
      previousResults: /* @__PURE__ */ new Map(),
      state: execution.state,
      log: (message, data) => {
        this.options.logger("info", `[${workflow.id}] ${message}`, data);
      }
    };
    const completedSteps = workflow.steps.filter((s) => {
      const stepExec = execution.steps.get(s.id);
      return stepExec?.status === WorkflowStatus.Completed && !stepExec.skipped;
    }).reverse();
    let rollbackFailed = false;
    for (const step of completedSteps) {
      if (!step.rollback) continue;
      context.stepId = step.id;
      const stepExec = execution.steps.get(step.id);
      try {
        await step.rollback(stepExec.result, context);
        logger.info("Step rolled back", { stepId: step.id });
      } catch (error) {
        logger.error(
          "Rollback failed for step",
          error instanceof Error ? error : new Error(String(error)),
          { stepId: step.id }
        );
        rollbackFailed = true;
      }
    }
    execution.rolledBack = true;
    execution.status = rollbackFailed ? WorkflowStatus.Failed : WorkflowStatus.RolledBack;
    this.emitEvent(
      rollbackFailed ? "rollback:failed" : "rollback:completed",
      execution.id,
      workflow.id
    );
  }
  async executeWithTimeout(promise, timeoutMs, errorMessage) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]);
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  createResult(execution, stepResults) {
    const stepErrors = /* @__PURE__ */ new Map();
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
    const stats = {
      totalSteps: execution.steps.size,
      completedSteps,
      failedSteps,
      skippedSteps,
      totalRetries,
      startTime: execution.startedAt ?? execution.createdAt,
      endTime: execution.completedAt ?? /* @__PURE__ */ new Date(),
      totalDurationMs: execution.durationMs ?? 0,
      avgStepDurationMs: completedSteps > 0 ? (execution.durationMs ?? 0) / completedSteps : 0
    };
    return {
      success: execution.status === WorkflowStatus.Completed,
      executionId: execution.id,
      workflowId: execution.workflowId,
      status: execution.status,
      output: execution.output,
      error: execution.error,
      errorStack: execution.errorStack,
      durationMs: execution.durationMs ?? 0,
      stepResults,
      stepErrors,
      rolledBack: execution.rolledBack ?? false,
      stats
    };
  }
  emitEvent(type, executionId, workflowId, stepId, data) {
    const event = {
      type,
      executionId,
      workflowId,
      stepId,
      timestamp: /* @__PURE__ */ new Date(),
      data,
      error: data?.error
    };
    const specificListeners = this.eventListeners.get(type);
    if (specificListeners) {
      for (const listener of specificListeners) {
        try {
          const result = listener(event);
          if (result instanceof Promise) {
            result.catch((err) => logger.error("Event listener error", err));
          }
        } catch (error) {
          logger.error("Event listener error", error);
        }
      }
    }
    const wildcardListeners = this.eventListeners.get("*");
    if (wildcardListeners) {
      for (const listener of wildcardListeners) {
        try {
          const result = listener(event);
          if (result instanceof Promise) {
            result.catch((err) => logger.error("Event listener error", err));
          }
        } catch (error) {
          logger.error("Event listener error", error);
        }
      }
    }
  }
}
function createWorkflowRegistry(options) {
  return new WorkflowRegistry(options);
}
export {
  WorkflowRegistry,
  createWorkflowRegistry
};
//# sourceMappingURL=registry.js.map
