/**
 * Agent Orchestration - Advanced intelligent agent coordination
 *
 * Provides intelligent orchestration for multi-agent workflows with:
 * - Rule-based conditional execution
 * - Automatic task analysis and splitting
 * - Capability-based agent routing
 * - Dynamic priority management
 * - Intelligent workload balancing
 *
 * @example
 * ```typescript
 * import { createOrchestrator, OrchestrationConfig } from '@weave-nn/weaver/agents/orchestration';
 *
 * const orchestrator = createOrchestrator({
 *   rulesFile: '~/.weaver/agent-rules.json',
 *   enableAutoSplit: true,
 *   enableDynamicPriority: true,
 * });
 *
 * await orchestrator.initialize();
 * const result = await orchestrator.orchestrate(tasks, context);
 * ```
 */

import { RuleEngine, createRuleEngine } from './rule-engine.js';
import { TaskAnalyzer, createTaskAnalyzer } from './task-analyzer.js';
import { Router, createRouter } from './router.js';
import { PrioritySystem, createPrioritySystem } from './priority.js';
import { WorkloadBalancer, createWorkloadBalancer } from './balancer.js';
import { logger } from '../../utils/logger.js';
import type {
  OrchestrationRule,
  RuleContext,
  RuleEvaluationResult,
  ComplexityEstimate,
  RoutingDecision,
  PriorityAdjustment,
  WorkloadDistribution,
  OrchestrationMetrics,
  RuleEngineConfig,
  TaskAnalyzerConfig,
  RouterConfig,
  PrioritySystemConfig,
  BalancerConfig,
} from './types.js';
import type { Task, AgentType } from '../coordinator.js';

/**
 * Orchestrator configuration
 */
export interface OrchestrationConfig {
  ruleEngine?: RuleEngineConfig;
  taskAnalyzer?: TaskAnalyzerConfig;
  router?: RouterConfig;
  prioritySystem?: PrioritySystemConfig;
  balancer?: BalancerConfig;
  enableAutoSplit?: boolean;
  enableDynamicPriority?: boolean;
  enableLoadBalancing?: boolean;
}

/**
 * Orchestration result
 */
export interface OrchestrationResult {
  tasks: Task[];
  routingDecisions: Map<string, RoutingDecision>;
  priorityAdjustments: PriorityAdjustment[];
  ruleResults: Map<string, RuleEvaluationResult[]>;
  splitTasks: Map<string, Task[]>;
  workloadDistribution: WorkloadDistribution[];
  metrics: OrchestrationMetrics;
}

/**
 * Main Orchestrator - Coordinates all orchestration components
 */
export class Orchestrator {
  private ruleEngine: RuleEngine;
  private taskAnalyzer: TaskAnalyzer;
  private router: Router;
  private prioritySystem: PrioritySystem;
  private balancer: WorkloadBalancer;
  private config: Required<OrchestrationConfig>;
  private initialized = false;

  constructor(config: OrchestrationConfig = {}) {
    this.config = {
      ruleEngine: config.ruleEngine ?? {},
      taskAnalyzer: config.taskAnalyzer ?? {},
      router: config.router ?? {},
      prioritySystem: config.prioritySystem ?? {},
      balancer: config.balancer ?? {},
      enableAutoSplit: config.enableAutoSplit ?? true,
      enableDynamicPriority: config.enableDynamicPriority ?? true,
      enableLoadBalancing: config.enableLoadBalancing ?? true,
    };

    this.ruleEngine = createRuleEngine(this.config.ruleEngine);
    this.taskAnalyzer = createTaskAnalyzer(this.config.taskAnalyzer);
    this.router = createRouter(this.config.router);
    this.prioritySystem = createPrioritySystem(this.config.prioritySystem);
    this.balancer = createWorkloadBalancer(this.config.balancer);
  }

  // ========================================================================
  // Initialization
  // ========================================================================

  /**
   * Initialize orchestrator
   */
  async initialize(): Promise<void> {
    logger.info('Initializing orchestrator...');

    // Load rules
    await this.ruleEngine.loadRules();

    // Register agents in balancer
    const agents: AgentType[] = [
      'coder',
      'researcher',
      'architect',
      'tester',
      'analyst',
      'planner',
      'error-detector',
    ];

    for (const agent of agents) {
      this.balancer.registerAgent(agent);
    }

    this.initialized = true;
    logger.info('✅ Orchestrator initialized');
  }

  /**
   * Ensure orchestrator is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Orchestrator not initialized. Call initialize() first.');
    }
  }

  // ========================================================================
  // Main Orchestration
  // ========================================================================

  /**
   * Orchestrate tasks with full intelligence
   */
  async orchestrate(
    tasks: Task[],
    context: Partial<RuleContext>
  ): Promise<OrchestrationResult> {
    this.ensureInitialized();

    logger.info('Starting orchestration', { taskCount: tasks.length });

    const result: OrchestrationResult = {
      tasks: [],
      routingDecisions: new Map(),
      priorityAdjustments: [],
      ruleResults: new Map(),
      splitTasks: new Map(),
      workloadDistribution: [],
      metrics: this.ruleEngine.getMetrics(),
    };

    // Build dependency graph
    const dependencyGraph = this.taskAnalyzer.analyzeDependencies(tasks);

    // Prepare rule context
    const agentWorkload = new Map<AgentType, number>();
    const availableAgents = this.balancer.getRegisteredAgents();

    for (const agent of availableAgents) {
      const workload = this.balancer.getAgentWorkload(agent);
      agentWorkload.set(agent, workload?.activeTasks.size ?? 0);
    }

    const fullContext: RuleContext = {
      task: tasks[0]!, // Will be updated per task
      agentWorkload,
      availableAgents,
      currentTime: new Date(),
      projectDeadline: context.projectDeadline,
      metadata: context.metadata,
    };

    // Process each task
    for (const task of tasks) {
      // Update context for this task
      fullContext.task = task;

      // 1. Evaluate rules
      const ruleResults = await this.ruleEngine.evaluateTask(task, fullContext);
      result.ruleResults.set(task.id, ruleResults);

      // 2. Check for task splitting
      if (this.config.enableAutoSplit) {
        const splitResult = ruleResults.find(r => r.matched && r.action === 'split_parallel');
        if (splitResult) {
          const complexity = this.taskAnalyzer.estimateComplexity(task);
          if (complexity.canSplit) {
            const subtasks = this.taskAnalyzer.splitTask(
              task,
              splitResult.splitTasks?.length
            );
            if (subtasks.length > 0) {
              result.splitTasks.set(task.id, subtasks);
              result.tasks.push(...subtasks);
              continue; // Skip main task, use subtasks instead
            }
          }
        }
      }

      result.tasks.push(task);
    }

    // 3. Adjust priorities
    if (this.config.enableDynamicPriority) {
      const adjustments = await this.prioritySystem.adjustPriorities(
        result.tasks,
        dependencyGraph,
        context.projectDeadline
      );
      result.priorityAdjustments = adjustments;

      // Apply adjustments to tasks
      for (const adjustment of adjustments) {
        const task = result.tasks.find(t => t.id === adjustment.taskId);
        if (task) {
          task.priority = adjustment.newPriority;
        }
      }
    }

    // 4. Route tasks to agents
    for (const task of result.tasks) {
      fullContext.task = task;

      // Check for explicit agent assignment from rules
      const taskRules = result.ruleResults.get(task.id) ?? [];
      const routeRule = taskRules.find(r => r.matched && r.action === 'route_to_agent');

      const preferredAgent = routeRule?.agent;

      // Route task
      const routing = await this.router.routeTask(task, fullContext);
      result.routingDecisions.set(task.id, routing);

      // Assign to balancer if enabled
      if (this.config.enableLoadBalancing) {
        this.balancer.assignTask(task, availableAgents, preferredAgent ?? routing.selectedAgent);
      }
    }

    // 5. Get final workload distribution
    result.workloadDistribution = this.balancer.getWorkloadDistribution();

    // 6. Update metrics
    result.metrics = this.ruleEngine.getMetrics();

    logger.info('✅ Orchestration complete', {
      totalTasks: result.tasks.length,
      splitTasks: result.splitTasks.size,
      priorityAdjustments: result.priorityAdjustments.length,
      routingDecisions: result.routingDecisions.size,
    });

    return result;
  }

  // ========================================================================
  // Component Access
  // ========================================================================

  /**
   * Get rule engine
   */
  getRuleEngine(): RuleEngine {
    return this.ruleEngine;
  }

  /**
   * Get task analyzer
   */
  getTaskAnalyzer(): TaskAnalyzer {
    return this.taskAnalyzer;
  }

  /**
   * Get router
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Get priority system
   */
  getPrioritySystem(): PrioritySystem {
    return this.prioritySystem;
  }

  /**
   * Get workload balancer
   */
  getBalancer(): WorkloadBalancer {
    return this.balancer;
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Analyze single task complexity
   */
  analyzeTask(task: Task): ComplexityEstimate {
    return this.taskAnalyzer.estimateComplexity(task);
  }

  /**
   * Get execution order for tasks
   */
  getExecutionOrder(tasks: Task[]): Task[] {
    const dependencyGraph = this.taskAnalyzer.analyzeDependencies(tasks);
    return this.prioritySystem.getExecutionOrder(tasks, dependencyGraph);
  }

  /**
   * Record task completion (for performance tracking)
   */
  recordTaskCompletion(
    taskId: string,
    agentType: AgentType,
    success: boolean,
    duration: number
  ): void {
    // Update router performance
    this.router.recordTaskResult(agentType, success, duration);

    // Update balancer
    this.balancer.completeTask(taskId, agentType, duration);
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics(): {
    rules: OrchestrationMetrics;
    workload: WorkloadDistribution[];
    queue: ReturnType<WorkloadBalancer['getQueueStatus']>;
  } {
    return {
      rules: this.ruleEngine.getMetrics(),
      workload: this.balancer.getWorkloadDistribution(),
      queue: this.balancer.getQueueStatus(),
    };
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.ruleEngine.clearCache();
    this.ruleEngine.resetMetrics();
    this.prioritySystem.clearHistory();
    this.router.resetPerformance();
    this.balancer.reset();
  }
}

/**
 * Create orchestrator instance
 */
export function createOrchestrator(config?: OrchestrationConfig): Orchestrator {
  return new Orchestrator(config);
}

// Re-export types
export type {
  OrchestrationRule,
  RuleContext,
  RuleEvaluationResult,
  ComplexityEstimate,
  RoutingDecision,
  PriorityAdjustment,
  WorkloadDistribution,
  OrchestrationMetrics,
  RuleEngineConfig,
  TaskAnalyzerConfig,
  RouterConfig,
  PrioritySystemConfig,
  BalancerConfig,
} from './types.js';

// Re-export classes
export { RuleEngine, TaskAnalyzer, Router, PrioritySystem, WorkloadBalancer };
