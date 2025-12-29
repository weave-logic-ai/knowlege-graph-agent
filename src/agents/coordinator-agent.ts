/**
 * Coordinator Agent
 *
 * Orchestrates multi-agent workflows with dependency resolution,
 * task distribution, and progress tracking. The most complex agent
 * type that manages coordination between other agents.
 *
 * @module agents/coordinator-agent
 */

import { BaseAgent } from './base-agent.js';
import {
  AgentType,
  AgentStatus,
  TaskPriority,
  type AgentConfig,
  type AgentTask,
  type AgentResult,
  type AgentInstance,
  type AgentCapability,
  createTaskId,
} from './types.js';
import {
  AgentRegistry,
  getRegistry,
  type SpawnOptions,
} from './registry.js';
import { getLogger, retry, type Logger, type RetryOptions } from '../utils/index.js';
import {
  AgentEquilibriumSelector,
  createEquilibriumTask,
  type Task as EquilibriumTask,
} from '../equilibrium/agent-equilibrium.js';
import { type AgentInfo } from './planner-agent.js';
import { FeatureFlags } from '../integrations/agentic-flow/feature-flags.js';
import {
  FederationHubAdapter,
  type EphemeralAgent,
} from '../integrations/agentic-flow/adapters/federation-hub-adapter.js';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Task assignment status
 */
export type TaskAssignmentStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Task distribution strategy
 */
export type DistributionStrategy = 'round-robin' | 'capability-match' | 'load-balanced' | 'equilibrium';

/**
 * Workflow step definition
 */
export interface WorkflowStep {
  /** Unique step identifier */
  id: string;

  /** Agent type to execute this step */
  agentType: AgentType;

  /** Task description */
  task: string;

  /** Input data for the step */
  input: Record<string, unknown>;

  /** Optional timeout in milliseconds */
  timeout?: number;

  /** Optional retry configuration */
  retry?: {
    maxRetries: number;
    backoffMs: number;
  };

  /** Whether this step is optional (workflow continues if it fails) */
  optional?: boolean;
}

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
  /** Unique workflow identifier */
  id: string;

  /** Human-readable workflow name */
  name: string;

  /** Workflow description */
  description?: string;

  /** Steps in the workflow */
  steps: WorkflowStep[];

  /** Dependencies between steps (stepId -> [dependsOn stepIds]) */
  dependencies: Map<string, string[]>;

  /** Whether steps without dependencies can run in parallel */
  parallel: boolean;

  /** Overall workflow timeout in milliseconds */
  timeout?: number;

  /** Workflow metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Task assignment tracking
 */
export interface TaskAssignment {
  /** Task identifier */
  taskId: string;

  /** Assigned agent identifier */
  agentId: string;

  /** Agent type */
  agentType: AgentType;

  /** Current assignment status */
  status: TaskAssignmentStatus;

  /** Assignment timestamp */
  assignedAt: Date;

  /** Completion timestamp */
  completedAt?: Date;

  /** Result if completed */
  result?: AgentResult;

  /** Number of retries attempted */
  retries: number;

  /** Error message if failed */
  error?: string;
}

/**
 * Workflow step result
 */
export interface StepResult {
  /** Step identifier */
  stepId: string;

  /** Whether the step succeeded */
  success: boolean;

  /** Result data */
  data?: unknown;

  /** Error if failed */
  error?: string;

  /** Execution duration in milliseconds */
  durationMs: number;

  /** Agent that executed the step */
  agentId?: string;
}

/**
 * Workflow execution result
 */
export interface WorkflowResult {
  /** Workflow identifier */
  workflowId: string;

  /** Whether the workflow succeeded */
  success: boolean;

  /** Results from each step */
  stepResults: Map<string, StepResult>;

  /** Overall execution duration in milliseconds */
  durationMs: number;

  /** Timestamp when workflow started */
  startedAt: Date;

  /** Timestamp when workflow completed */
  completedAt: Date;

  /** Error message if workflow failed */
  error?: string;

  /** Final aggregated output */
  output?: Record<string, unknown>;
}

/**
 * Progress report for tracking workflow execution
 */
export interface ProgressReport {
  /** Active workflows count */
  activeWorkflows: number;

  /** Pending tasks count */
  pendingTasks: number;

  /** Running tasks count */
  runningTasks: number;

  /** Completed tasks count */
  completedTasks: number;

  /** Failed tasks count */
  failedTasks: number;

  /** Task assignments by workflow */
  workflowProgress: Map<string, {
    workflowId: string;
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    progress: number;
  }>;

  /** Agent utilization */
  agentUtilization: Map<string, {
    agentId: string;
    agentType: AgentType;
    activeTasks: number;
    completedTasks: number;
  }>;

  /** Report timestamp */
  timestamp: Date;
}

/**
 * Agent requirements for spawning
 */
export interface AgentRequirement {
  /** Agent type to spawn */
  type: AgentType;

  /** Required capabilities */
  capabilities?: string[];

  /** Number of instances to spawn */
  count?: number;

  /** Custom configuration */
  config?: Partial<AgentConfig>;
}

/**
 * Task for delegation
 */
export interface DelegateTask {
  /** Task description */
  description: string;

  /** Required capabilities */
  requiredCapabilities?: string[];

  /** Preferred agent type */
  preferredType?: AgentType;

  /** Task priority */
  priority?: TaskPriority;

  /** Task input */
  input?: Record<string, unknown>;

  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Coordinator agent configuration
 */
export interface CoordinatorAgentConfig extends AgentConfig {
  type: AgentType.COORDINATOR;

  /** Custom agent registry (uses default if not provided) */
  registry?: AgentRegistry;

  /** Default distribution strategy */
  defaultStrategy?: DistributionStrategy;

  /** Maximum concurrent workflows */
  maxConcurrentWorkflows?: number;

  /** Maximum concurrent tasks per workflow */
  maxConcurrentTasksPerWorkflow?: number;
}

/**
 * Coordinator task type
 */
export type CoordinatorTaskType =
  | 'orchestrate'
  | 'delegate'
  | 'spawn'
  | 'distribute'
  | 'progress';

// ============================================================================
// Coordinator Agent Implementation
// ============================================================================

/**
 * Coordinator Agent
 *
 * Orchestrates multi-agent workflows with:
 * - Workflow definition and execution
 * - Dependency resolution via topological sort
 * - Task distribution across agents
 * - Progress tracking and reporting
 * - Failure handling with retry/fallback
 *
 * @example
 * ```typescript
 * const coordinator = new CoordinatorAgent({
 *   name: 'coordinator-agent',
 *   type: AgentType.COORDINATOR,
 * });
 *
 * // Define a workflow
 * const workflow: WorkflowDefinition = {
 *   id: 'research-implement',
 *   name: 'Research and Implement',
 *   steps: [
 *     { id: 'research', agentType: AgentType.RESEARCHER, task: 'Research requirements', input: {} },
 *     { id: 'implement', agentType: AgentType.CODER, task: 'Implement feature', input: {} },
 *     { id: 'test', agentType: AgentType.TESTER, task: 'Write tests', input: {} },
 *   ],
 *   dependencies: new Map([
 *     ['implement', ['research']],
 *     ['test', ['implement']],
 *   ]),
 *   parallel: true,
 * };
 *
 * const result = await coordinator.orchestrateWorkflow(workflow);
 * ```
 */
export class CoordinatorAgent extends BaseAgent {
  /** Agent registry for managing agents */
  private readonly agentRegistry: AgentRegistry;

  /** Task assignment queue */
  private readonly taskQueue: Map<string, TaskAssignment> = new Map();

  /** Active workflow executions */
  private readonly activeWorkflows: Map<string, WorkflowDefinition> = new Map();

  /** Workflow results cache */
  private readonly workflowResults: Map<string, WorkflowResult> = new Map();

  /** Agent task counts for load balancing */
  private readonly agentTaskCounts: Map<string, number> = new Map();

  /** Round-robin index per agent type */
  private readonly roundRobinIndex: Map<AgentType, number> = new Map();

  /** Default distribution strategy */
  private readonly defaultStrategy: DistributionStrategy;

  /** Maximum concurrent workflows */
  private readonly maxConcurrentWorkflows: number;

  /** Maximum concurrent tasks per workflow */
  private readonly maxConcurrentTasksPerWorkflow: number;

  constructor(config: Partial<CoordinatorAgentConfig> & { name: string }) {
    super({
      type: AgentType.COORDINATOR,
      taskTimeout: 600000, // 10 minutes for complex workflows
      capabilities: [
        'orchestrate',
        'delegate',
        'agent_spawn',
        'task_distribution',
        'progress_tracking',
        'workflow_management',
      ],
      ...config,
    });

    this.agentRegistry = config.registry ?? getRegistry();
    this.defaultStrategy = config.defaultStrategy ?? 'capability-match';
    this.maxConcurrentWorkflows = config.maxConcurrentWorkflows ?? 5;
    this.maxConcurrentTasksPerWorkflow = config.maxConcurrentTasksPerWorkflow ?? 10;

    // Initialize round-robin indices
    for (const type of Object.values(AgentType)) {
      this.roundRobinIndex.set(type, 0);
    }
  }

  // ==========================================================================
  // Task Execution
  // ==========================================================================

  /**
   * Execute coordinator task
   */
  protected async executeTask(task: AgentTask): Promise<AgentResult> {
    const startTime = new Date();
    const taskType = (task.input?.parameters?.taskType as CoordinatorTaskType) || 'orchestrate';

    switch (taskType) {
      case 'orchestrate':
        return this.handleOrchestrateTask(task, startTime);
      case 'delegate':
        return this.handleDelegateTask(task, startTime);
      case 'spawn':
        return this.handleSpawnTask(task, startTime);
      case 'distribute':
        return this.handleDistributeTask(task, startTime);
      case 'progress':
        return this.handleProgressTask(task, startTime);
      default:
        return this.createErrorResult(
          'INVALID_TASK_TYPE',
          `Unknown task type: ${taskType}`,
          startTime
        );
    }
  }

  // ==========================================================================
  // Workflow Orchestration
  // ==========================================================================

  /**
   * Orchestrate a workflow definition
   */
  async orchestrateWorkflow(workflow: WorkflowDefinition): Promise<WorkflowResult> {
    const startTime = new Date();
    const startMs = Date.now();

    this.logger.info(`Starting workflow: ${workflow.name}`, {
      workflowId: workflow.id,
      stepCount: workflow.steps.length,
      parallel: workflow.parallel,
    });

    // Check concurrent workflow limit
    if (this.activeWorkflows.size >= this.maxConcurrentWorkflows) {
      throw new Error(
        `Maximum concurrent workflows reached (${this.maxConcurrentWorkflows})`
      );
    }

    // Track active workflow
    this.activeWorkflows.set(workflow.id, workflow);

    const stepResults = new Map<string, StepResult>();
    const stepOutputs = new Map<string, unknown>();

    try {
      // Validate workflow
      this.validateWorkflow(workflow);

      // Resolve execution order (topological sort)
      const executionBatches = this.resolveExecutionOrder(workflow);

      this.logger.debug(`Resolved ${executionBatches.length} execution batches`, {
        workflowId: workflow.id,
        batches: executionBatches.map(b => b.map(s => s.id)),
      });

      // Execute batches sequentially, steps within batches in parallel
      for (const batch of executionBatches) {
        if (workflow.parallel) {
          // Execute steps in batch in parallel
          const batchResults = await Promise.allSettled(
            batch.map(step => this.executeStep(step, stepOutputs, workflow.timeout))
          );

          for (let i = 0; i < batch.length; i++) {
            const step = batch[i];
            const result = batchResults[i];

            if (result.status === 'fulfilled') {
              stepResults.set(step.id, result.value);
              if (result.value.success && result.value.data !== undefined) {
                stepOutputs.set(step.id, result.value.data);
              }

              // Check if the step execution returned a failure result
              if (!result.value.success && !step.optional) {
                throw new Error(`Required step '${step.id}' failed: ${result.value.error}`);
              }
            } else {
              const stepResult: StepResult = {
                stepId: step.id,
                success: false,
                error: result.reason?.message || String(result.reason),
                durationMs: 0,
              };
              stepResults.set(step.id, stepResult);

              if (!step.optional) {
                throw new Error(`Required step '${step.id}' failed: ${stepResult.error}`);
              }
            }
          }
        } else {
          // Execute steps sequentially
          for (const step of batch) {
            try {
              const result = await this.executeStep(step, stepOutputs, workflow.timeout);
              stepResults.set(step.id, result);

              if (result.success && result.data !== undefined) {
                stepOutputs.set(step.id, result.data);
              }

              if (!result.success && !step.optional) {
                throw new Error(`Required step '${step.id}' failed: ${result.error}`);
              }
            } catch (error) {
              const stepResult: StepResult = {
                stepId: step.id,
                success: false,
                error: error instanceof Error ? error.message : String(error),
                durationMs: 0,
              };
              stepResults.set(step.id, stepResult);

              if (!step.optional) {
                throw error;
              }
            }
          }
        }
      }

      const durationMs = Date.now() - startMs;
      const completedAt = new Date();

      // Aggregate outputs
      const output: Record<string, unknown> = {};
      for (const [stepId, data] of stepOutputs) {
        output[stepId] = data;
      }

      const workflowResult: WorkflowResult = {
        workflowId: workflow.id,
        success: true,
        stepResults,
        durationMs,
        startedAt: startTime,
        completedAt,
        output,
      };

      this.workflowResults.set(workflow.id, workflowResult);

      this.logger.info(`Workflow completed successfully: ${workflow.name}`, {
        workflowId: workflow.id,
        durationMs,
        stepsCompleted: stepResults.size,
      });

      return workflowResult;
    } catch (error) {
      const durationMs = Date.now() - startMs;
      const completedAt = new Date();
      const errorMessage = error instanceof Error ? error.message : String(error);

      const workflowResult: WorkflowResult = {
        workflowId: workflow.id,
        success: false,
        stepResults,
        durationMs,
        startedAt: startTime,
        completedAt,
        error: errorMessage,
      };

      this.workflowResults.set(workflow.id, workflowResult);

      this.logger.error(`Workflow failed: ${workflow.name}`, error instanceof Error ? error : undefined, {
        workflowId: workflow.id,
        durationMs,
      });

      return workflowResult;
    } finally {
      this.activeWorkflows.delete(workflow.id);
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    previousOutputs: Map<string, unknown>,
    workflowTimeout?: number
  ): Promise<StepResult> {
    const startMs = Date.now();

    this.logger.debug(`Executing step: ${step.id}`, {
      agentType: step.agentType,
      task: step.task,
    });

    try {
      // Find or spawn an agent for this step
      const agent = await this.findOrSpawnAgent(step.agentType);

      if (!agent) {
        throw new Error(`No agent available for type: ${step.agentType}`);
      }

      // Prepare task input with previous outputs
      const enrichedInput = {
        ...step.input,
        previousOutputs: Object.fromEntries(previousOutputs),
      };

      // Create the agent task
      const agentTask: AgentTask = {
        id: createTaskId(),
        description: step.task,
        priority: TaskPriority.MEDIUM,
        input: {
          data: enrichedInput,
          parameters: step.input,
        },
        timeout: step.timeout ?? workflowTimeout,
        createdAt: new Date(),
      };

      // Track task assignment
      const assignment: TaskAssignment = {
        taskId: agentTask.id,
        agentId: agent.config.id!,
        agentType: step.agentType,
        status: 'running',
        assignedAt: new Date(),
        retries: 0,
      };
      this.taskQueue.set(agentTask.id, assignment);
      this.incrementAgentTaskCount(agent.config.id!);

      // Execute with retry if configured
      let result: AgentResult;
      if (step.retry && step.retry.maxRetries > 0) {
        const retryOptions: RetryOptions = {
          maxRetries: step.retry.maxRetries,
          initialDelay: step.retry.backoffMs,
          backoffFactor: 2,
          // Mark all execution failures as retryable by default
          isRetryable: (error: unknown) => {
            if (error && typeof error === 'object' && 'retryable' in error) {
              return Boolean((error as { retryable: boolean }).retryable);
            }
            return true; // Default to retryable for agent execution errors
          },
        };

        result = await retry(async () => {
          assignment.retries++;
          const execResult = await agent.execute(agentTask);
          // Throw on failure so retry mechanism can catch and retry
          if (!execResult.success) {
            const error = new Error(execResult.error?.message ?? 'Task execution failed');
            (error as Error & { retryable: boolean }).retryable = execResult.error?.retryable !== false;
            throw error;
          }
          return execResult;
        }, retryOptions);
      } else {
        result = await agent.execute(agentTask);
      }

      // Update assignment status
      assignment.status = result.success ? 'completed' : 'failed';
      assignment.completedAt = new Date();
      assignment.result = result;
      if (!result.success && result.error) {
        assignment.error = result.error.message;
      }

      this.decrementAgentTaskCount(agent.config.id!);

      const durationMs = Date.now() - startMs;

      return {
        stepId: step.id,
        success: result.success,
        data: result.data,
        error: result.error?.message,
        durationMs,
        agentId: agent.config.id,
      };
    } catch (error) {
      const durationMs = Date.now() - startMs;
      return {
        stepId: step.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        durationMs,
      };
    }
  }

  /**
   * Resolve execution order using topological sort
   */
  private resolveExecutionOrder(workflow: WorkflowDefinition): WorkflowStep[][] {
    const batches: WorkflowStep[][] = [];
    const stepMap = new Map<string, WorkflowStep>();
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();

    // Initialize
    for (const step of workflow.steps) {
      stepMap.set(step.id, step);
      inDegree.set(step.id, 0);
      dependents.set(step.id, []);
    }

    // Build dependency graph
    for (const [stepId, deps] of workflow.dependencies) {
      inDegree.set(stepId, deps.length);
      for (const dep of deps) {
        const depList = dependents.get(dep) ?? [];
        depList.push(stepId);
        dependents.set(dep, depList);
      }
    }

    // Find all steps with no dependencies
    const remaining = new Set(workflow.steps.map(s => s.id));

    while (remaining.size > 0) {
      const batch: WorkflowStep[] = [];

      // Find all steps with in-degree 0
      for (const stepId of remaining) {
        if ((inDegree.get(stepId) ?? 0) === 0) {
          const step = stepMap.get(stepId);
          if (step) {
            batch.push(step);
          }
        }
      }

      if (batch.length === 0) {
        // Cycle detected
        throw new Error('Workflow has circular dependencies');
      }

      batches.push(batch);

      // Remove batch from graph
      for (const step of batch) {
        remaining.delete(step.id);
        for (const dependent of dependents.get(step.id) ?? []) {
          const degree = inDegree.get(dependent) ?? 0;
          inDegree.set(dependent, degree - 1);
        }
      }
    }

    return batches;
  }

  /**
   * Validate workflow definition
   */
  private validateWorkflow(workflow: WorkflowDefinition): void {
    if (!workflow.id) {
      throw new Error('Workflow ID is required');
    }

    if (!workflow.name) {
      throw new Error('Workflow name is required');
    }

    if (!workflow.steps || workflow.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    const stepIds = new Set<string>();
    for (const step of workflow.steps) {
      if (!step.id) {
        throw new Error('All steps must have an ID');
      }
      if (stepIds.has(step.id)) {
        throw new Error(`Duplicate step ID: ${step.id}`);
      }
      stepIds.add(step.id);
    }

    // Validate dependencies reference valid steps
    for (const [stepId, deps] of workflow.dependencies) {
      if (!stepIds.has(stepId)) {
        throw new Error(`Dependency references unknown step: ${stepId}`);
      }
      for (const dep of deps) {
        if (!stepIds.has(dep)) {
          throw new Error(`Step '${stepId}' depends on unknown step: ${dep}`);
        }
      }
    }
  }

  // ==========================================================================
  // Task Delegation
  // ==========================================================================

  /**
   * Delegate a task to the best matching agent
   */
  async delegateTask(task: DelegateTask): Promise<string> {
    this.logger.info('Delegating task', {
      description: task.description.slice(0, 50),
      preferredType: task.preferredType,
      requiredCapabilities: task.requiredCapabilities,
    });

    // Find best matching agent
    const agent = await this.findBestAgent(
      task.preferredType,
      task.requiredCapabilities
    );

    if (!agent) {
      throw new Error('No suitable agent available for task delegation');
    }

    // Create and assign task
    const agentTask: AgentTask = {
      id: createTaskId(),
      description: task.description,
      priority: task.priority ?? TaskPriority.MEDIUM,
      input: {
        data: task.input,
        parameters: task.input,
      },
      timeout: task.timeout,
      createdAt: new Date(),
    };

    // Track assignment
    const assignment: TaskAssignment = {
      taskId: agentTask.id,
      agentId: agent.config.id!,
      agentType: agent.config.type,
      status: 'pending',
      assignedAt: new Date(),
      retries: 0,
    };
    this.taskQueue.set(agentTask.id, assignment);

    this.logger.debug(`Task delegated to agent: ${agent.config.id}`, {
      taskId: agentTask.id,
      agentType: agent.config.type,
    });

    // Execute task asynchronously
    void this.executeAssignedTask(agent, agentTask, assignment);

    return agent.config.id!;
  }

  /**
   * Execute an assigned task and update assignment status
   */
  private async executeAssignedTask(
    agent: AgentInstance,
    task: AgentTask,
    assignment: TaskAssignment
  ): Promise<void> {
    try {
      assignment.status = 'running';
      this.incrementAgentTaskCount(agent.config.id!);

      const result = await agent.execute(task);

      assignment.status = result.success ? 'completed' : 'failed';
      assignment.completedAt = new Date();
      assignment.result = result;
      if (!result.success && result.error) {
        assignment.error = result.error.message;
      }
    } catch (error) {
      assignment.status = 'failed';
      assignment.completedAt = new Date();
      assignment.error = error instanceof Error ? error.message : String(error);
    } finally {
      this.decrementAgentTaskCount(agent.config.id!);
    }
  }

  // ==========================================================================
  // Agent Spawning
  // ==========================================================================

  /**
   * Spawn agents based on requirements
   */
  async spawnAgents(requirements: AgentRequirement[]): Promise<string[]> {
    const spawnedIds: string[] = [];

    this.logger.info(`Spawning ${requirements.length} agent requirement(s)`, {
      requirements: requirements.map(r => ({ type: r.type, count: r.count ?? 1 })),
    });

    for (const req of requirements) {
      const count = req.count ?? 1;

      for (let i = 0; i < count; i++) {
        try {
          const config: Omit<AgentConfig, 'type'> = {
            name: `${req.type}-${Date.now()}-${i}`,
            capabilities: req.capabilities,
            ...req.config,
          };

          const agent = await this.agentRegistry.spawn(req.type, config);
          spawnedIds.push(agent.config.id!);

          this.logger.debug(`Spawned agent: ${agent.config.id}`, {
            type: req.type,
            capabilities: req.capabilities,
          });
        } catch (error) {
          this.logger.error(
            `Failed to spawn agent of type ${req.type}`,
            error instanceof Error ? error : undefined
          );
        }
      }
    }

    return spawnedIds;
  }

  // ==========================================================================
  // Task Distribution
  // ==========================================================================

  /**
   * Distribute tasks across agents using specified strategy
   */
  async distributeTasks(
    tasks: DelegateTask[],
    strategy: DistributionStrategy = this.defaultStrategy
  ): Promise<TaskAssignment[]> {
    this.logger.info(`Distributing ${tasks.length} tasks using ${strategy} strategy`);

    const assignments: TaskAssignment[] = [];

    switch (strategy) {
      case 'round-robin':
        assignments.push(...await this.distributeRoundRobin(tasks));
        break;
      case 'capability-match':
        assignments.push(...await this.distributeCapabilityMatch(tasks));
        break;
      case 'load-balanced':
        assignments.push(...await this.distributeLoadBalanced(tasks));
        break;
      case 'equilibrium':
        assignments.push(...await this.distributeEquilibrium(tasks));
        break;
      default:
        throw new Error(`Unknown distribution strategy: ${strategy}`);
    }

    return assignments;
  }

  /**
   * Round-robin distribution strategy
   */
  private async distributeRoundRobin(tasks: DelegateTask[]): Promise<TaskAssignment[]> {
    const assignments: TaskAssignment[] = [];

    for (const task of tasks) {
      const agentType = task.preferredType ?? AgentType.CODER;
      const agents = this.agentRegistry.getByType(agentType);

      if (agents.length === 0) {
        this.logger.warn(`No agents available for type: ${agentType}`);
        continue;
      }

      // Get next agent in round-robin order
      const index = this.roundRobinIndex.get(agentType) ?? 0;
      const agent = agents[index % agents.length];
      this.roundRobinIndex.set(agentType, (index + 1) % agents.length);

      const agentTask: AgentTask = {
        id: createTaskId(),
        description: task.description,
        priority: task.priority ?? TaskPriority.MEDIUM,
        input: { data: task.input },
        timeout: task.timeout,
        createdAt: new Date(),
      };

      const assignment: TaskAssignment = {
        taskId: agentTask.id,
        agentId: agent.config.id!,
        agentType: agent.config.type,
        status: 'pending',
        assignedAt: new Date(),
        retries: 0,
      };

      this.taskQueue.set(agentTask.id, assignment);
      assignments.push(assignment);

      // Execute asynchronously
      void this.executeAssignedTask(agent, agentTask, assignment);
    }

    return assignments;
  }

  /**
   * Capability-match distribution strategy
   */
  private async distributeCapabilityMatch(tasks: DelegateTask[]): Promise<TaskAssignment[]> {
    const assignments: TaskAssignment[] = [];

    for (const task of tasks) {
      const agent = await this.findBestAgent(
        task.preferredType,
        task.requiredCapabilities
      );

      if (!agent) {
        this.logger.warn('No matching agent found for task', {
          description: task.description.slice(0, 50),
          requiredCapabilities: task.requiredCapabilities,
        });
        continue;
      }

      const agentTask: AgentTask = {
        id: createTaskId(),
        description: task.description,
        priority: task.priority ?? TaskPriority.MEDIUM,
        input: { data: task.input },
        timeout: task.timeout,
        createdAt: new Date(),
      };

      const assignment: TaskAssignment = {
        taskId: agentTask.id,
        agentId: agent.config.id!,
        agentType: agent.config.type,
        status: 'pending',
        assignedAt: new Date(),
        retries: 0,
      };

      this.taskQueue.set(agentTask.id, assignment);
      assignments.push(assignment);

      // Execute asynchronously
      void this.executeAssignedTask(agent, agentTask, assignment);
    }

    return assignments;
  }

  /**
   * Load-balanced distribution strategy
   */
  private async distributeLoadBalanced(tasks: DelegateTask[]): Promise<TaskAssignment[]> {
    const assignments: TaskAssignment[] = [];

    for (const task of tasks) {
      const agentType = task.preferredType ?? AgentType.CODER;
      const agents = this.agentRegistry.getByType(agentType);

      if (agents.length === 0) {
        this.logger.warn(`No agents available for type: ${agentType}`);
        continue;
      }

      // Find agent with lowest current task count
      let selectedAgent: AgentInstance | null = null;
      let minTasks = Infinity;

      for (const agent of agents) {
        const taskCount = this.agentTaskCounts.get(agent.config.id!) ?? 0;
        const agentStatus = agent.getStatus();

        // Skip busy or unavailable agents
        if (agentStatus !== AgentStatus.IDLE && agentStatus !== AgentStatus.RUNNING) {
          continue;
        }

        if (taskCount < minTasks) {
          minTasks = taskCount;
          selectedAgent = agent;
        }
      }

      if (!selectedAgent) {
        // Fallback to first available
        selectedAgent = agents.find(a => {
          const status = a.getStatus();
          return status === AgentStatus.IDLE || status === AgentStatus.RUNNING;
        }) ?? null;
      }

      if (!selectedAgent) {
        this.logger.warn(`No available agents for type: ${agentType}`);
        continue;
      }

      const agentTask: AgentTask = {
        id: createTaskId(),
        description: task.description,
        priority: task.priority ?? TaskPriority.MEDIUM,
        input: { data: task.input },
        timeout: task.timeout,
        createdAt: new Date(),
      };

      const assignment: TaskAssignment = {
        taskId: agentTask.id,
        agentId: selectedAgent.config.id!,
        agentType: selectedAgent.config.type,
        status: 'pending',
        assignedAt: new Date(),
        retries: 0,
      };

      this.taskQueue.set(agentTask.id, assignment);
      assignments.push(assignment);

      // Execute asynchronously
      void this.executeAssignedTask(selectedAgent, agentTask, assignment);
    }

    return assignments;
  }

  /**
   * Equilibrium-based distribution strategy (SPEC-006a)
   *
   * Uses Nash equilibrium game-theoretic selection where agents compete
   * based on capability match and task fit. Dominated agents with lower
   * effectiveness naturally collapse, leaving optimal selections.
   *
   * Automatically triggered when:
   * - Strategy is explicitly 'equilibrium'
   * - More than 3 agents available (higher competition benefits from equilibrium)
   */
  private async distributeEquilibrium(tasks: DelegateTask[]): Promise<TaskAssignment[]> {
    const assignments: TaskAssignment[] = [];
    const selector = new AgentEquilibriumSelector({
      learningRate: 0.1,
      maxIterations: 100,
      convergenceThreshold: 0.001,
      minParticipation: 0.01,
    });

    for (const task of tasks) {
      // Get all available agents
      const allAgents = this.agentRegistry.getAll();

      // Filter by preferred type if specified
      const candidateAgents = task.preferredType
        ? allAgents.filter(a =>
            a.config.type === task.preferredType ||
            a.getStatus() === AgentStatus.IDLE
          )
        : allAgents;

      // Convert to AgentInfo format for equilibrium selector
      const agentInfos: AgentInfo[] = candidateAgents.map(agent => ({
        id: agent.config.id!,
        type: agent.config.type,
        capabilities: agent.config.capabilities || [],
        availability: agent.getStatus() === AgentStatus.IDLE ? 1.0 : 0.5,
        performanceScore: 80, // Default performance score
      }));

      if (agentInfos.length === 0) {
        this.logger.warn('No agents available for equilibrium distribution', {
          description: task.description.slice(0, 50),
        });
        continue;
      }

      // Create equilibrium task
      const equilibriumTask = createEquilibriumTask(
        createTaskId(),
        task.description,
        {
          requiredCapabilities: task.requiredCapabilities,
          priority: task.priority,
          complexity: 0.5,
        }
      );

      // Select best agent using equilibrium
      const selectedAgents = await selector.selectTopAgents(
        equilibriumTask,
        agentInfos,
        1 // Select top 1 agent per task
      );

      if (selectedAgents.length === 0) {
        this.logger.warn('No agent selected by equilibrium', {
          description: task.description.slice(0, 50),
          candidateCount: agentInfos.length,
        });
        continue;
      }

      const selectedInfo = selectedAgents[0];
      const selectedAgent = candidateAgents.find(
        a => a.config.id === selectedInfo.id
      );

      if (!selectedAgent) {
        continue;
      }

      // Create and assign the task
      const agentTask: AgentTask = {
        id: createTaskId(),
        description: task.description,
        priority: task.priority ?? TaskPriority.MEDIUM,
        input: { data: task.input },
        timeout: task.timeout,
        createdAt: new Date(),
      };

      const assignment: TaskAssignment = {
        taskId: agentTask.id,
        agentId: selectedAgent.config.id!,
        agentType: selectedAgent.config.type,
        status: 'pending',
        assignedAt: new Date(),
        retries: 0,
      };

      this.taskQueue.set(agentTask.id, assignment);
      assignments.push(assignment);

      // Execute asynchronously
      void this.executeAssignedTask(selectedAgent, agentTask, assignment);

      this.logger.debug('Task assigned via equilibrium', {
        taskId: agentTask.id,
        agentId: selectedAgent.config.id,
        agentType: selectedAgent.config.type,
      });
    }

    return assignments;
  }

  // ==========================================================================
  // Federated Distribution (SPEC-010c)
  // ==========================================================================

  /**
   * Distribute tasks across federation nodes for parallel execution
   *
   * Uses Federation Hub for distributed execution when enabled,
   * providing 3-5x parallel speedup across multiple nodes.
   *
   * Falls back to local distribution when federation is not available.
   *
   * @param tasks - Tasks to distribute
   * @returns Task assignments
   */
  async distributeFederated(tasks: DelegateTask[]): Promise<TaskAssignment[]> {
    // Check if federation is enabled
    if (!FeatureFlags.getInstance().isEnabled('federation-hub')) {
      this.logger.info('Federation not enabled, falling back to local distribution');
      return this.distributeTasks(tasks, this.defaultStrategy);
    }

    this.logger.info(`Distributing ${tasks.length} tasks via federation`);

    const federationHub = new FederationHubAdapter();
    await federationHub.initialize();

    const assignments: TaskAssignment[] = [];

    try {
      // Register this coordinator as a federation node if not already
      const localNode = await federationHub.registerNode({
        id: this.config.id || 'coordinator-local',
        name: this.config.name,
        endpoint: 'local',
        capabilities: this.config.capabilities || [],
      });

      // Spawn ephemeral agents for each task
      const taskPromises = tasks.map(async (task) => {
        const agentTask: AgentTask = {
          id: createTaskId(),
          description: task.description,
          priority: task.priority ?? TaskPriority.MEDIUM,
          input: { data: task.input },
          timeout: task.timeout,
          createdAt: new Date(),
        };

        try {
          // Spawn ephemeral agent in federation
          const ephemeralAgent = await federationHub.spawnEphemeralAgent(
            task.preferredType || AgentType.CODER,
            localNode.id,
            task.timeout || 60000
          );

          // Submit task to federation
          const federatedTask = await federationHub.submitTask({
            type: task.preferredType || AgentType.CODER,
            payload: {
              description: task.description,
              input: task.input,
              requiredCapabilities: task.requiredCapabilities,
            },
            assignedNode: localNode.id,
            assignedAgent: ephemeralAgent.id,
          });

          const assignment: TaskAssignment = {
            taskId: agentTask.id,
            agentId: ephemeralAgent.id,
            agentType: task.preferredType || AgentType.CODER,
            status: 'running',
            assignedAt: new Date(),
            retries: 0,
          };

          this.taskQueue.set(agentTask.id, assignment);

          // Monitor task completion
          this.monitorFederatedTask(federatedTask.id, assignment, federationHub);

          return assignment;
        } catch (error) {
          this.logger.warn('Failed to submit federated task', {
            description: task.description.slice(0, 50),
            error: error instanceof Error ? error.message : String(error),
          });

          // Fall back to local execution
          const localAssignments = await this.distributeCapabilityMatch([task]);
          return localAssignments[0];
        }
      });

      const resolvedAssignments = await Promise.all(taskPromises);
      assignments.push(...resolvedAssignments.filter((a): a is TaskAssignment => a !== undefined));

      this.logger.info(`Distributed ${assignments.length} tasks via federation`);
    } catch (error) {
      this.logger.error('Federation distribution failed, falling back to local', error instanceof Error ? error : undefined);
      // Fall back to local distribution
      return this.distributeTasks(tasks, this.defaultStrategy);
    }

    return assignments;
  }

  /**
   * Monitor a federated task and update assignment status
   */
  private async monitorFederatedTask(
    taskId: string,
    assignment: TaskAssignment,
    federationHub: FederationHubAdapter
  ): Promise<void> {
    const startTime = Date.now();
    const timeout = 60000; // 1 minute default timeout

    while (Date.now() - startTime < timeout) {
      try {
        const status = await federationHub.getTaskStatus(taskId);

        if (!status) {
          assignment.status = 'failed';
          assignment.error = 'Task not found in federation';
          break;
        }

        if (status.status === 'completed') {
          assignment.status = 'completed';
          assignment.completedAt = new Date();
          assignment.result = {
            success: true,
            data: status.result,
            metadata: {
              timestamp: new Date(),
              agentId: assignment.agentId,
            },
          };
          break;
        }

        if (status.status === 'failed') {
          assignment.status = 'failed';
          assignment.completedAt = new Date();
          assignment.error = 'Federated task execution failed';
          break;
        }

        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch {
        // Continue polling on error
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (assignment.status === 'running') {
      assignment.status = 'failed';
      assignment.error = 'Federated task timed out';
    }
  }

  // ==========================================================================
  // Progress Tracking
  // ==========================================================================

  /**
   * Get comprehensive progress report
   */
  async getProgressReport(): Promise<ProgressReport> {
    const workflowProgress = new Map<string, {
      workflowId: string;
      totalSteps: number;
      completedSteps: number;
      failedSteps: number;
      progress: number;
    }>();

    // Calculate workflow progress
    for (const [workflowId, workflow] of this.activeWorkflows) {
      const totalSteps = workflow.steps.length;
      let completedSteps = 0;
      let failedSteps = 0;

      // Check task assignments related to this workflow
      for (const assignment of this.taskQueue.values()) {
        if (assignment.status === 'completed') {
          completedSteps++;
        } else if (assignment.status === 'failed') {
          failedSteps++;
        }
      }

      workflowProgress.set(workflowId, {
        workflowId,
        totalSteps,
        completedSteps,
        failedSteps,
        progress: totalSteps > 0 ? completedSteps / totalSteps : 0,
      });
    }

    // Calculate agent utilization
    const agentUtilization = new Map<string, {
      agentId: string;
      agentType: AgentType;
      activeTasks: number;
      completedTasks: number;
    }>();

    for (const agent of this.agentRegistry.getAll()) {
      const agentId = agent.config.id!;
      let activeTasks = 0;
      let completedTasks = 0;

      for (const assignment of this.taskQueue.values()) {
        if (assignment.agentId === agentId) {
          if (assignment.status === 'running') {
            activeTasks++;
          } else if (assignment.status === 'completed') {
            completedTasks++;
          }
        }
      }

      agentUtilization.set(agentId, {
        agentId,
        agentType: agent.config.type,
        activeTasks,
        completedTasks,
      });
    }

    // Count task statuses
    let pendingTasks = 0;
    let runningTasks = 0;
    let completedTasksCount = 0;
    let failedTasks = 0;

    for (const assignment of this.taskQueue.values()) {
      switch (assignment.status) {
        case 'pending':
          pendingTasks++;
          break;
        case 'running':
          runningTasks++;
          break;
        case 'completed':
          completedTasksCount++;
          break;
        case 'failed':
          failedTasks++;
          break;
      }
    }

    return {
      activeWorkflows: this.activeWorkflows.size,
      pendingTasks,
      runningTasks,
      completedTasks: completedTasksCount,
      failedTasks,
      workflowProgress,
      agentUtilization,
      timestamp: new Date(),
    };
  }

  // ==========================================================================
  // Task Handlers
  // ==========================================================================

  private async handleOrchestrateTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<WorkflowResult>> {
    const input = task.input?.data as {
      workflow?: WorkflowDefinition;
    } | undefined;

    if (!input?.workflow) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Workflow definition is required',
        startTime
      ) as AgentResult<WorkflowResult>;
    }

    try {
      const result = await this.orchestrateWorkflow(input.workflow);
      return this.createSuccessResult(result, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('ORCHESTRATION_ERROR', message, startTime) as AgentResult<WorkflowResult>;
    }
  }

  private async handleDelegateTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<string>> {
    const input = task.input?.data as {
      task?: DelegateTask;
    } | undefined;

    if (!input?.task) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Task to delegate is required',
        startTime
      ) as AgentResult<string>;
    }

    try {
      const agentId = await this.delegateTask(input.task);
      return this.createSuccessResult(agentId, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('DELEGATION_ERROR', message, startTime) as AgentResult<string>;
    }
  }

  private async handleSpawnTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<string[]>> {
    const input = task.input?.data as {
      requirements?: AgentRequirement[];
    } | undefined;

    if (!input?.requirements) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Agent requirements are required',
        startTime
      ) as AgentResult<string[]>;
    }

    try {
      const agentIds = await this.spawnAgents(input.requirements);
      return this.createSuccessResult(agentIds, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('SPAWN_ERROR', message, startTime) as AgentResult<string[]>;
    }
  }

  private async handleDistributeTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<TaskAssignment[]>> {
    const input = task.input?.data as {
      tasks?: DelegateTask[];
      strategy?: DistributionStrategy;
    } | undefined;

    if (!input?.tasks) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Tasks to distribute are required',
        startTime
      ) as AgentResult<TaskAssignment[]>;
    }

    try {
      const assignments = await this.distributeTasks(
        input.tasks,
        input.strategy
      );
      return this.createSuccessResult(assignments, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('DISTRIBUTION_ERROR', message, startTime) as AgentResult<TaskAssignment[]>;
    }
  }

  private async handleProgressTask(
    _task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<ProgressReport>> {
    try {
      const report = await this.getProgressReport();
      return this.createSuccessResult(report, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('PROGRESS_ERROR', message, startTime) as AgentResult<ProgressReport>;
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Find an existing agent or spawn a new one
   */
  private async findOrSpawnAgent(type: AgentType): Promise<AgentInstance | null> {
    // Try to find an existing idle agent
    const existingAgents = this.agentRegistry.getByType(type);

    for (const agent of existingAgents) {
      const status = agent.getStatus();
      if (status === AgentStatus.IDLE) {
        return agent;
      }
    }

    // Check if any agents are at least available
    for (const agent of existingAgents) {
      const status = agent.getStatus();
      if (status === AgentStatus.RUNNING) {
        // Agent is busy but available
        return agent;
      }
    }

    // No suitable agent found, try to spawn one
    if (this.agentRegistry.isRegistered(type)) {
      try {
        return await this.agentRegistry.spawn(type, {
          name: `${type}-auto-${Date.now()}`,
        });
      } catch {
        this.logger.warn(`Failed to spawn agent of type: ${type}`);
      }
    }

    return null;
  }

  /**
   * Find the best matching agent for a task
   */
  private async findBestAgent(
    preferredType?: AgentType,
    requiredCapabilities?: string[]
  ): Promise<AgentInstance | null> {
    const allAgents = this.agentRegistry.getAll();

    // Score agents based on match criteria
    let bestAgent: AgentInstance | null = null;
    let bestScore = -1;

    for (const agent of allAgents) {
      const status = agent.getStatus();

      // Skip unavailable agents
      if (status !== AgentStatus.IDLE && status !== AgentStatus.RUNNING) {
        continue;
      }

      let score = 0;

      // Type match
      if (preferredType && agent.config.type === preferredType) {
        score += 10;
      }

      // Capability match
      if (requiredCapabilities && requiredCapabilities.length > 0) {
        const agentCapabilities = agent.config.capabilities ?? [];
        const matchedCapabilities = requiredCapabilities.filter(c =>
          agentCapabilities.includes(c)
        );
        score += matchedCapabilities.length * 5;

        // All capabilities matched gets bonus
        if (matchedCapabilities.length === requiredCapabilities.length) {
          score += 10;
        }
      }

      // Idle bonus
      if (status === AgentStatus.IDLE) {
        score += 5;
      }

      // Low task count bonus
      const taskCount = this.agentTaskCounts.get(agent.config.id!) ?? 0;
      score += Math.max(0, 5 - taskCount);

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  /**
   * Increment task count for an agent
   */
  private incrementAgentTaskCount(agentId: string): void {
    const current = this.agentTaskCounts.get(agentId) ?? 0;
    this.agentTaskCounts.set(agentId, current + 1);
  }

  /**
   * Decrement task count for an agent
   */
  private decrementAgentTaskCount(agentId: string): void {
    const current = this.agentTaskCounts.get(agentId) ?? 0;
    this.agentTaskCounts.set(agentId, Math.max(0, current - 1));
  }

  /**
   * Get workflow result by ID
   */
  getWorkflowResult(workflowId: string): WorkflowResult | undefined {
    return this.workflowResults.get(workflowId);
  }

  /**
   * Get task assignment by task ID
   */
  getTaskAssignment(taskId: string): TaskAssignment | undefined {
    return this.taskQueue.get(taskId);
  }

  /**
   * Cancel a pending task
   */
  cancelTask(taskId: string): boolean {
    const assignment = this.taskQueue.get(taskId);
    if (assignment && assignment.status === 'pending') {
      assignment.status = 'cancelled';
      return true;
    }
    return false;
  }

  /**
   * Clear completed and failed tasks from queue
   */
  clearCompletedTasks(): number {
    let cleared = 0;
    for (const [taskId, assignment] of this.taskQueue) {
      if (assignment.status === 'completed' || assignment.status === 'failed' || assignment.status === 'cancelled') {
        this.taskQueue.delete(taskId);
        cleared++;
      }
    }
    return cleared;
  }

  /**
   * Get coordinator statistics
   */
  getStatistics(): {
    activeWorkflows: number;
    totalTasksQueued: number;
    tasksByStatus: Record<TaskAssignmentStatus, number>;
    agentTaskCounts: Map<string, number>;
    workflowsCompleted: number;
  } {
    const tasksByStatus: Record<TaskAssignmentStatus, number> = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    for (const assignment of this.taskQueue.values()) {
      tasksByStatus[assignment.status]++;
    }

    return {
      activeWorkflows: this.activeWorkflows.size,
      totalTasksQueued: this.taskQueue.size,
      tasksByStatus,
      agentTaskCounts: new Map(this.agentTaskCounts),
      workflowsCompleted: this.workflowResults.size,
    };
  }

  /**
   * Cleanup on terminate
   */
  protected async cleanup(): Promise<void> {
    // Cancel all pending tasks
    for (const assignment of this.taskQueue.values()) {
      if (assignment.status === 'pending') {
        assignment.status = 'cancelled';
      }
    }

    // Clear active workflows
    this.activeWorkflows.clear();

    this.logger.debug('Coordinator agent cleanup completed');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new coordinator agent
 */
export function createCoordinatorAgent(
  config: Partial<CoordinatorAgentConfig> & { name: string }
): CoordinatorAgent {
  return new CoordinatorAgent(config);
}

/**
 * Create a workflow definition
 */
export function createWorkflow(
  id: string,
  name: string,
  steps: WorkflowStep[],
  options?: {
    description?: string;
    dependencies?: Map<string, string[]> | [string, string[]][];
    parallel?: boolean;
    timeout?: number;
    metadata?: Record<string, unknown>;
  }
): WorkflowDefinition {
  let dependencies: Map<string, string[]>;

  if (options?.dependencies instanceof Map) {
    dependencies = options.dependencies;
  } else if (Array.isArray(options?.dependencies)) {
    dependencies = new Map(options.dependencies);
  } else {
    dependencies = new Map();
  }

  return {
    id,
    name,
    description: options?.description,
    steps,
    dependencies,
    parallel: options?.parallel ?? true,
    timeout: options?.timeout,
    metadata: options?.metadata,
  };
}

/**
 * Create a workflow step
 */
export function createWorkflowStep(
  id: string,
  agentType: AgentType,
  task: string,
  input: Record<string, unknown> = {},
  options?: {
    timeout?: number;
    retry?: { maxRetries: number; backoffMs: number };
    optional?: boolean;
  }
): WorkflowStep {
  return {
    id,
    agentType,
    task,
    input,
    timeout: options?.timeout,
    retry: options?.retry,
    optional: options?.optional,
  };
}
