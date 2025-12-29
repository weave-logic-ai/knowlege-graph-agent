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
import { AgentType, TaskPriority, type AgentConfig, type AgentTask, type AgentResult } from './types.js';
import { AgentRegistry } from './registry.js';
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
export type CoordinatorTaskType = 'orchestrate' | 'delegate' | 'spawn' | 'distribute' | 'progress';
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
export declare class CoordinatorAgent extends BaseAgent {
    /** Agent registry for managing agents */
    private readonly agentRegistry;
    /** Task assignment queue */
    private readonly taskQueue;
    /** Active workflow executions */
    private readonly activeWorkflows;
    /** Workflow results cache */
    private readonly workflowResults;
    /** Agent task counts for load balancing */
    private readonly agentTaskCounts;
    /** Round-robin index per agent type */
    private readonly roundRobinIndex;
    /** Default distribution strategy */
    private readonly defaultStrategy;
    /** Maximum concurrent workflows */
    private readonly maxConcurrentWorkflows;
    /** Maximum concurrent tasks per workflow */
    private readonly maxConcurrentTasksPerWorkflow;
    constructor(config: Partial<CoordinatorAgentConfig> & {
        name: string;
    });
    /**
     * Execute coordinator task
     */
    protected executeTask(task: AgentTask): Promise<AgentResult>;
    /**
     * Orchestrate a workflow definition
     */
    orchestrateWorkflow(workflow: WorkflowDefinition): Promise<WorkflowResult>;
    /**
     * Execute a single workflow step
     */
    private executeStep;
    /**
     * Resolve execution order using topological sort
     */
    private resolveExecutionOrder;
    /**
     * Validate workflow definition
     */
    private validateWorkflow;
    /**
     * Delegate a task to the best matching agent
     */
    delegateTask(task: DelegateTask): Promise<string>;
    /**
     * Execute an assigned task and update assignment status
     */
    private executeAssignedTask;
    /**
     * Spawn agents based on requirements
     */
    spawnAgents(requirements: AgentRequirement[]): Promise<string[]>;
    /**
     * Distribute tasks across agents using specified strategy
     */
    distributeTasks(tasks: DelegateTask[], strategy?: DistributionStrategy): Promise<TaskAssignment[]>;
    /**
     * Round-robin distribution strategy
     */
    private distributeRoundRobin;
    /**
     * Capability-match distribution strategy
     */
    private distributeCapabilityMatch;
    /**
     * Load-balanced distribution strategy
     */
    private distributeLoadBalanced;
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
    private distributeEquilibrium;
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
    distributeFederated(tasks: DelegateTask[]): Promise<TaskAssignment[]>;
    /**
     * Monitor a federated task and update assignment status
     */
    private monitorFederatedTask;
    /**
     * Get comprehensive progress report
     */
    getProgressReport(): Promise<ProgressReport>;
    private handleOrchestrateTask;
    private handleDelegateTask;
    private handleSpawnTask;
    private handleDistributeTask;
    private handleProgressTask;
    /**
     * Find an existing agent or spawn a new one
     */
    private findOrSpawnAgent;
    /**
     * Find the best matching agent for a task
     */
    private findBestAgent;
    /**
     * Increment task count for an agent
     */
    private incrementAgentTaskCount;
    /**
     * Decrement task count for an agent
     */
    private decrementAgentTaskCount;
    /**
     * Get workflow result by ID
     */
    getWorkflowResult(workflowId: string): WorkflowResult | undefined;
    /**
     * Get task assignment by task ID
     */
    getTaskAssignment(taskId: string): TaskAssignment | undefined;
    /**
     * Cancel a pending task
     */
    cancelTask(taskId: string): boolean;
    /**
     * Clear completed and failed tasks from queue
     */
    clearCompletedTasks(): number;
    /**
     * Get coordinator statistics
     */
    getStatistics(): {
        activeWorkflows: number;
        totalTasksQueued: number;
        tasksByStatus: Record<TaskAssignmentStatus, number>;
        agentTaskCounts: Map<string, number>;
        workflowsCompleted: number;
    };
    /**
     * Cleanup on terminate
     */
    protected cleanup(): Promise<void>;
}
/**
 * Create a new coordinator agent
 */
export declare function createCoordinatorAgent(config: Partial<CoordinatorAgentConfig> & {
    name: string;
}): CoordinatorAgent;
/**
 * Create a workflow definition
 */
export declare function createWorkflow(id: string, name: string, steps: WorkflowStep[], options?: {
    description?: string;
    dependencies?: Map<string, string[]> | [string, string[]][];
    parallel?: boolean;
    timeout?: number;
    metadata?: Record<string, unknown>;
}): WorkflowDefinition;
/**
 * Create a workflow step
 */
export declare function createWorkflowStep(id: string, agentType: AgentType, task: string, input?: Record<string, unknown>, options?: {
    timeout?: number;
    retry?: {
        maxRetries: number;
        backoffMs: number;
    };
    optional?: boolean;
}): WorkflowStep;
//# sourceMappingURL=coordinator-agent.d.ts.map