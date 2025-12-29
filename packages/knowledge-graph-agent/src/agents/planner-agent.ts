/**
 * Planner Agent
 *
 * Specialized agent for task planning, decomposition, dependency analysis,
 * resource allocation, timeline estimation, and risk assessment.
 * Extends BaseAgent with planning capabilities and knowledge graph integration.
 *
 * @module agents/planner-agent
 */

import { BaseAgent } from './base-agent.js';
import {
  AgentType,
  type AgentTask,
  type AgentResult,
  type PlannerAgentConfig,
  type ResultArtifact,
} from './types.js';
import { KnowledgeGraphManager } from '../core/graph.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Task priority levels for planning
 */
export type PlannerPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Dependency relationship types
 */
export type DependencyType = 'blocks' | 'requires' | 'suggests';

/**
 * Risk probability levels
 */
export type RiskProbability = 'high' | 'medium' | 'low';

/**
 * Risk impact levels
 */
export type RiskImpact = 'high' | 'medium' | 'low';

/**
 * Task effort estimation
 */
export interface EffortEstimate {
  /** Minimum hours */
  min: number;
  /** Most likely hours */
  likely: number;
  /** Maximum hours */
  max: number;
  /** Calculated expected value (PERT) */
  expected: number;
}

/**
 * Subtask definition
 */
export interface Subtask {
  /** Unique subtask identifier */
  id: string;
  /** Task description */
  description: string;
  /** Estimated effort */
  estimatedEffort: string;
  /** Parsed effort estimate */
  effortEstimate: EffortEstimate;
  /** Required capabilities to execute */
  requiredCapabilities: string[];
  /** Dependencies on other subtask IDs */
  dependencies: string[];
  /** Task priority */
  priority: PlannerPriority;
  /** Optional assigned agent type */
  assignedAgentType?: AgentType;
}

/**
 * Task decomposition result
 */
export interface TaskDecomposition {
  /** Original root task description */
  rootTask: string;
  /** Decomposed subtasks */
  subtasks: Subtask[];
  /** Total estimated effort */
  totalEstimate: string;
  /** Total effort in hours */
  totalHours: number;
  /** Decomposition timestamp */
  timestamp: Date;
}

/**
 * Dependency graph node
 */
export interface DependencyNode {
  /** Node identifier */
  id: string;
  /** Node label/description */
  label: string;
  /** Node metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Dependency graph edge
 */
export interface DependencyEdge {
  /** Source node ID */
  from: string;
  /** Target node ID */
  to: string;
  /** Relationship type */
  type: DependencyType;
}

/**
 * Dependency graph analysis result
 */
export interface DependencyGraph {
  /** Graph nodes */
  nodes: DependencyNode[];
  /** Graph edges */
  edges: DependencyEdge[];
  /** Critical path (longest path through graph) */
  criticalPath: string[];
  /** Sets of parallelizable tasks */
  parallelizable: string[][];
  /** Topological order for execution */
  executionOrder: string[];
  /** Detected cycles (should be empty for valid DAG) */
  cycles: string[][];
}

/**
 * Agent information for resource allocation
 */
export interface AgentInfo {
  /** Agent identifier */
  id: string;
  /** Agent type */
  type: AgentType;
  /** Agent capabilities */
  capabilities: string[];
  /** Current availability (0-1) */
  availability: number;
  /** Performance score (0-100) */
  performanceScore?: number;
}

/**
 * Resource assignment
 */
export interface ResourceAssignment {
  /** Task identifier */
  taskId: string;
  /** Assigned agent identifier */
  agentId: string;
  /** Agent type */
  agentType: AgentType;
  /** Planned start time */
  startTime?: Date;
  /** Estimated duration */
  estimatedDuration: string;
  /** Duration in hours */
  durationHours: number;
  /** Assignment confidence score */
  confidence: number;
}

/**
 * Resource allocation result
 */
export interface ResourceAllocation {
  /** Task-to-agent assignments */
  assignments: ResourceAssignment[];
  /** Agent utilization map (agent ID -> utilization percentage) */
  utilization: Map<string, number>;
  /** Identified bottlenecks */
  bottlenecks: string[];
  /** Unassigned tasks (no matching capability) */
  unassignedTasks: string[];
  /** Allocation timestamp */
  timestamp: Date;
}

/**
 * Milestone definition
 */
export interface Milestone {
  /** Milestone name */
  name: string;
  /** Target date */
  date: Date;
  /** Deliverables for this milestone */
  deliverables: string[];
  /** Task IDs that must complete for milestone */
  requiredTasks: string[];
}

/**
 * Phase definition
 */
export interface Phase {
  /** Phase name */
  name: string;
  /** Phase start date */
  start: Date;
  /** Phase end date */
  end: Date;
  /** Tasks in this phase */
  tasks: string[];
  /** Phase description */
  description?: string;
}

/**
 * Timeline estimate result
 */
export interface TimelineEstimate {
  /** Project start date */
  startDate: Date;
  /** Project end date */
  endDate: Date;
  /** Total duration in business days */
  totalDays: number;
  /** Project milestones */
  milestones: Milestone[];
  /** Project phases */
  phases: Phase[];
  /** Estimation confidence (0-100) */
  confidence: number;
  /** Buffer percentage included */
  bufferPercentage: number;
  /** Estimation timestamp */
  timestamp: Date;
}

/**
 * Risk definition
 */
export interface Risk {
  /** Risk identifier */
  id: string;
  /** Risk description */
  description: string;
  /** Probability of occurrence */
  probability: RiskProbability;
  /** Impact if it occurs */
  impact: RiskImpact;
  /** Risk score (probability * impact) */
  score: number;
  /** Mitigation strategy */
  mitigation: string;
  /** Contingency plan */
  contingency: string;
  /** Related task IDs */
  relatedTasks?: string[];
  /** Risk category */
  category: 'technical' | 'resource' | 'schedule' | 'scope' | 'external';
}

/**
 * Risk assessment result
 */
export interface RiskAssessment {
  /** Identified risks */
  risks: Risk[];
  /** Overall risk level */
  overallRisk: RiskProbability;
  /** Risk score (0-100) */
  riskScore: number;
  /** Recommendations for risk mitigation */
  recommendations: string[];
  /** Assessment timestamp */
  timestamp: Date;
}

/**
 * Complete execution plan
 */
export interface ExecutionPlan {
  /** Plan identifier */
  id: string;
  /** Plan name */
  name: string;
  /** Task decomposition */
  decomposition: TaskDecomposition;
  /** Dependency graph */
  dependencies: DependencyGraph;
  /** Resource allocation */
  resources: ResourceAllocation;
  /** Timeline estimate */
  timeline: TimelineEstimate;
  /** Risk assessment */
  risks: RiskAssessment;
  /** Plan status */
  status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  /** Plan creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Planner task type
 */
export type PlannerTaskType =
  | 'decompose'
  | 'dependencies'
  | 'allocate'
  | 'timeline'
  | 'risks'
  | 'plan';

// ============================================================================
// Planner Agent
// ============================================================================

/**
 * Planner Agent
 *
 * Capabilities:
 * - Hierarchical task decomposition
 * - Dependency graph analysis with critical path
 * - Capability-based resource allocation
 * - Timeline estimation with milestones
 * - Risk assessment with mitigations
 *
 * @example
 * ```typescript
 * const planner = new PlannerAgent({
 *   name: 'planner-agent',
 *   estimationStrategy: 'realistic',
 * });
 *
 * const decomposition = await planner.decomposeTask(
 *   'Build a REST API with authentication'
 * );
 *
 * const plan = await planner.createExecutionPlan(
 *   'API Project',
 *   'Build a REST API with authentication',
 *   availableAgents
 * );
 * ```
 */
export class PlannerAgent extends BaseAgent {
  /** Knowledge graph reference */
  private knowledgeGraph: KnowledgeGraphManager | null = null;

  /** Estimation strategy */
  private readonly estimationStrategy: 'optimistic' | 'pessimistic' | 'realistic';

  /** Include risk assessment by default */
  private readonly includeRiskAssessment: boolean;

  /** Maximum parallel tasks */
  private readonly maxParallelTasks: number;

  /** Task ID counter */
  private taskIdCounter: number = 0;

  constructor(config: Partial<PlannerAgentConfig> & { name: string }) {
    super({
      type: AgentType.PLANNER,
      taskTimeout: 300000, // 5 minutes for complex planning
      capabilities: [
        'task_decomposition',
        'dependency_analysis',
        'resource_allocation',
        'timeline_estimation',
        'risk_assessment',
      ],
      ...config,
    });

    this.estimationStrategy = config.estimationStrategy ?? 'realistic';
    this.includeRiskAssessment = config.includeRiskAssessment ?? true;
    this.maxParallelTasks = config.maxParallelTasks ?? 5;
  }

  // ==========================================================================
  // Knowledge Graph Integration
  // ==========================================================================

  /**
   * Set knowledge graph for context-aware planning
   */
  setKnowledgeGraph(graph: KnowledgeGraphManager): void {
    this.knowledgeGraph = graph;
    this.logger.debug('Knowledge graph attached', {
      nodeCount: graph.getMetadata().nodeCount,
    });
  }

  // ==========================================================================
  // Task Execution
  // ==========================================================================

  /**
   * Execute planner task
   */
  protected async executeTask(task: AgentTask): Promise<AgentResult> {
    const startTime = new Date();
    const taskType = (task.input?.parameters?.taskType as PlannerTaskType) || 'decompose';

    switch (taskType) {
      case 'decompose':
        return this.handleDecomposeTask(task, startTime);
      case 'dependencies':
        return this.handleDependenciesTask(task, startTime);
      case 'allocate':
        return this.handleAllocateTask(task, startTime);
      case 'timeline':
        return this.handleTimelineTask(task, startTime);
      case 'risks':
        return this.handleRisksTask(task, startTime);
      case 'plan':
        return this.handlePlanTask(task, startTime);
      default:
        return this.createErrorResult(
          'INVALID_TASK_TYPE',
          `Unknown task type: ${taskType}`,
          startTime
        );
    }
  }

  // ==========================================================================
  // Public Methods - Task Decomposition
  // ==========================================================================

  /**
   * Decompose a complex task into subtasks
   *
   * Uses hierarchical decomposition to break down tasks
   * into manageable, estimable units.
   */
  async decomposeTask(task: string): Promise<TaskDecomposition> {
    this.logger.info('Decomposing task', { task: task.slice(0, 100) });

    const subtasks = this.generateSubtasks(task);
    const totalHours = subtasks.reduce((sum, st) => sum + st.effortEstimate.expected, 0);

    return {
      rootTask: task,
      subtasks,
      totalEstimate: this.formatDuration(totalHours),
      totalHours,
      timestamp: new Date(),
    };
  }

  /**
   * Generate subtasks from a task description
   */
  private generateSubtasks(task: string): Subtask[] {
    const subtasks: Subtask[] = [];
    const taskLower = task.toLowerCase();

    // Analyze task keywords to generate appropriate subtasks
    const patterns = this.identifyTaskPatterns(taskLower);

    // Always start with planning/specification
    subtasks.push(this.createSubtask({
      description: 'Requirements analysis and specification',
      effort: { min: 2, likely: 4, max: 8 },
      capabilities: ['requirements_analysis', 'documentation'],
      priority: 'critical',
      agentType: AgentType.RESEARCHER,
    }));

    // Add pattern-specific subtasks
    if (patterns.includes('api') || patterns.includes('backend')) {
      subtasks.push(...this.generateApiSubtasks());
    }

    if (patterns.includes('auth') || patterns.includes('authentication')) {
      subtasks.push(...this.generateAuthSubtasks());
    }

    if (patterns.includes('database') || patterns.includes('data')) {
      subtasks.push(...this.generateDatabaseSubtasks());
    }

    if (patterns.includes('ui') || patterns.includes('frontend')) {
      subtasks.push(...this.generateUiSubtasks());
    }

    if (patterns.includes('test')) {
      subtasks.push(...this.generateTestSubtasks());
    }

    // Always add testing if not explicitly mentioned
    if (!patterns.includes('test')) {
      subtasks.push(this.createSubtask({
        description: 'Write unit and integration tests',
        effort: { min: 4, likely: 8, max: 16 },
        capabilities: ['testing', 'test_automation'],
        priority: 'high',
        dependencies: subtasks.slice(1).map(s => s.id),
        agentType: AgentType.TESTER,
      }));
    }

    // Add documentation subtask
    subtasks.push(this.createSubtask({
      description: 'Documentation and API documentation',
      effort: { min: 2, likely: 4, max: 8 },
      capabilities: ['documentation', 'technical_writing'],
      priority: 'medium',
      dependencies: subtasks.map(s => s.id),
      agentType: AgentType.DOCUMENTER,
    }));

    // Add code review subtask
    subtasks.push(this.createSubtask({
      description: 'Code review and quality assurance',
      effort: { min: 2, likely: 4, max: 8 },
      capabilities: ['code_review', 'quality_assurance'],
      priority: 'high',
      dependencies: subtasks.slice(0, -1).map(s => s.id),
      agentType: AgentType.REVIEWER,
    }));

    // Set up proper dependencies
    this.setupDependencies(subtasks);

    return subtasks;
  }

  private identifyTaskPatterns(task: string): string[] {
    const patterns: string[] = [];

    const keywords: Record<string, string[]> = {
      api: ['api', 'rest', 'endpoint', 'route', 'graphql'],
      backend: ['backend', 'server', 'service'],
      frontend: ['frontend', 'ui', 'interface', 'component', 'react', 'vue'],
      auth: ['auth', 'login', 'jwt', 'oauth', 'session', 'permission'],
      database: ['database', 'db', 'sql', 'mongo', 'postgres', 'schema', 'model'],
      test: ['test', 'testing', 'spec', 'coverage'],
    };

    for (const [pattern, words] of Object.entries(keywords)) {
      if (words.some(word => task.includes(word))) {
        patterns.push(pattern);
      }
    }

    // Default to api + backend if no patterns found
    if (patterns.length === 0) {
      patterns.push('api', 'backend');
    }

    return patterns;
  }

  private generateApiSubtasks(): Subtask[] {
    return [
      this.createSubtask({
        description: 'Design API architecture and endpoints',
        effort: { min: 2, likely: 4, max: 8 },
        capabilities: ['api_design', 'architecture'],
        priority: 'high',
        agentType: AgentType.ARCHITECT,
      }),
      this.createSubtask({
        description: 'Implement API endpoints',
        effort: { min: 8, likely: 16, max: 32 },
        capabilities: ['backend', 'api_development'],
        priority: 'high',
        agentType: AgentType.CODER,
      }),
      this.createSubtask({
        description: 'Implement error handling and validation',
        effort: { min: 4, likely: 8, max: 16 },
        capabilities: ['backend', 'error_handling'],
        priority: 'high',
        agentType: AgentType.CODER,
      }),
    ];
  }

  private generateAuthSubtasks(): Subtask[] {
    return [
      this.createSubtask({
        description: 'Design authentication flow',
        effort: { min: 2, likely: 4, max: 8 },
        capabilities: ['security', 'architecture'],
        priority: 'critical',
        agentType: AgentType.ARCHITECT,
      }),
      this.createSubtask({
        description: 'Implement authentication middleware',
        effort: { min: 4, likely: 8, max: 16 },
        capabilities: ['security', 'backend'],
        priority: 'critical',
        agentType: AgentType.CODER,
      }),
      this.createSubtask({
        description: 'Implement authorization and permissions',
        effort: { min: 4, likely: 8, max: 16 },
        capabilities: ['security', 'backend'],
        priority: 'high',
        agentType: AgentType.CODER,
      }),
    ];
  }

  private generateDatabaseSubtasks(): Subtask[] {
    return [
      this.createSubtask({
        description: 'Design database schema',
        effort: { min: 2, likely: 4, max: 8 },
        capabilities: ['database', 'architecture'],
        priority: 'high',
        agentType: AgentType.ARCHITECT,
      }),
      this.createSubtask({
        description: 'Implement data models and migrations',
        effort: { min: 4, likely: 8, max: 16 },
        capabilities: ['database', 'backend'],
        priority: 'high',
        agentType: AgentType.CODER,
      }),
      this.createSubtask({
        description: 'Implement data access layer',
        effort: { min: 4, likely: 8, max: 16 },
        capabilities: ['database', 'backend'],
        priority: 'high',
        agentType: AgentType.CODER,
      }),
    ];
  }

  private generateUiSubtasks(): Subtask[] {
    return [
      this.createSubtask({
        description: 'Design UI/UX wireframes',
        effort: { min: 4, likely: 8, max: 16 },
        capabilities: ['ui_design', 'ux'],
        priority: 'high',
        agentType: AgentType.ARCHITECT,
      }),
      this.createSubtask({
        description: 'Implement UI components',
        effort: { min: 8, likely: 16, max: 32 },
        capabilities: ['frontend', 'ui_development'],
        priority: 'high',
        agentType: AgentType.CODER,
      }),
      this.createSubtask({
        description: 'Implement state management',
        effort: { min: 4, likely: 8, max: 16 },
        capabilities: ['frontend', 'state_management'],
        priority: 'medium',
        agentType: AgentType.CODER,
      }),
    ];
  }

  private generateTestSubtasks(): Subtask[] {
    return [
      this.createSubtask({
        description: 'Design test strategy and plan',
        effort: { min: 2, likely: 4, max: 8 },
        capabilities: ['testing', 'test_planning'],
        priority: 'high',
        agentType: AgentType.TESTER,
      }),
      this.createSubtask({
        description: 'Write unit tests',
        effort: { min: 8, likely: 16, max: 32 },
        capabilities: ['testing', 'unit_testing'],
        priority: 'high',
        agentType: AgentType.TESTER,
      }),
      this.createSubtask({
        description: 'Write integration tests',
        effort: { min: 4, likely: 8, max: 16 },
        capabilities: ['testing', 'integration_testing'],
        priority: 'high',
        agentType: AgentType.TESTER,
      }),
      this.createSubtask({
        description: 'Set up CI/CD test pipeline',
        effort: { min: 2, likely: 4, max: 8 },
        capabilities: ['devops', 'ci_cd'],
        priority: 'medium',
        agentType: AgentType.CODER,
      }),
    ];
  }

  private createSubtask(params: {
    description: string;
    effort: { min: number; likely: number; max: number };
    capabilities: string[];
    priority: PlannerPriority;
    dependencies?: string[];
    agentType?: AgentType;
  }): Subtask {
    const id = `task_${++this.taskIdCounter}`;
    const effortEstimate = this.calculateEffortEstimate(params.effort);

    return {
      id,
      description: params.description,
      estimatedEffort: this.formatDuration(effortEstimate.expected),
      effortEstimate,
      requiredCapabilities: params.capabilities,
      dependencies: params.dependencies ?? [],
      priority: params.priority,
      assignedAgentType: params.agentType,
    };
  }

  private calculateEffortEstimate(effort: { min: number; likely: number; max: number }): EffortEstimate {
    // PERT formula: (min + 4*likely + max) / 6
    let expected: number;

    switch (this.estimationStrategy) {
      case 'optimistic':
        expected = (effort.min * 2 + effort.likely * 3 + effort.max) / 6;
        break;
      case 'pessimistic':
        expected = (effort.min + effort.likely * 3 + effort.max * 2) / 6;
        break;
      case 'realistic':
      default:
        expected = (effort.min + 4 * effort.likely + effort.max) / 6;
    }

    return {
      min: effort.min,
      likely: effort.likely,
      max: effort.max,
      expected: Math.round(expected * 10) / 10,
    };
  }

  private setupDependencies(subtasks: Subtask[]): void {
    // Ensure first task (requirements) has no dependencies
    if (subtasks.length > 0) {
      subtasks[0].dependencies = [];
    }

    // Set up sequential dependencies for critical path
    for (let i = 1; i < subtasks.length; i++) {
      const current = subtasks[i];
      // If no dependencies set, depend on previous high-priority tasks
      if (current.dependencies.length === 0 && i > 0) {
        // Requirements task is prerequisite for architecture/design tasks
        if (current.description.includes('Design') || current.description.includes('architecture')) {
          current.dependencies = [subtasks[0].id];
        }
      }
    }
  }

  // ==========================================================================
  // Public Methods - Dependency Analysis
  // ==========================================================================

  /**
   * Analyze dependencies between tasks and build a dependency graph
   */
  async analyzeDependencies(subtasks: Subtask[]): Promise<DependencyGraph> {
    this.logger.info('Analyzing dependencies', { taskCount: subtasks.length });

    const nodes = this.buildNodes(subtasks);
    const edges = this.buildEdges(subtasks);
    const cycles = this.detectCycles(subtasks);
    const executionOrder = this.topologicalSort(subtasks);
    const criticalPath = this.findCriticalPath(subtasks);
    const parallelizable = this.findParallelGroups(subtasks, executionOrder);

    return {
      nodes,
      edges,
      criticalPath,
      parallelizable,
      executionOrder,
      cycles,
    };
  }

  private buildNodes(subtasks: Subtask[]): DependencyNode[] {
    return subtasks.map(task => ({
      id: task.id,
      label: task.description,
      metadata: {
        priority: task.priority,
        effort: task.estimatedEffort,
        capabilities: task.requiredCapabilities,
      },
    }));
  }

  private buildEdges(subtasks: Subtask[]): DependencyEdge[] {
    const edges: DependencyEdge[] = [];

    for (const task of subtasks) {
      for (const dep of task.dependencies) {
        edges.push({
          from: dep,
          to: task.id,
          type: task.priority === 'critical' ? 'blocks' : 'requires',
        });
      }
    }

    return edges;
  }

  private detectCycles(subtasks: Subtask[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const taskMap = new Map(subtasks.map(t => [t.id, t]));
    const validTaskIds = new Set(subtasks.map(t => t.id));

    const dfs = (taskId: string, path: string[]): void => {
      // Only process tasks that exist in our subtask list
      if (!validTaskIds.has(taskId)) return;

      visited.add(taskId);
      recursionStack.add(taskId);
      path.push(taskId);

      const task = taskMap.get(taskId);
      if (task) {
        for (const dep of task.dependencies) {
          // Only follow dependencies that are in our task list
          if (!validTaskIds.has(dep)) continue;

          if (!visited.has(dep)) {
            dfs(dep, [...path]);
          } else if (recursionStack.has(dep)) {
            // Found cycle
            const cycleStart = path.indexOf(dep);
            if (cycleStart !== -1) {
              cycles.push([...path.slice(cycleStart), dep]);
            }
          }
        }
      }

      path.pop();
      recursionStack.delete(taskId);
    };

    for (const task of subtasks) {
      if (!visited.has(task.id)) {
        dfs(task.id, []);
      }
    }

    return cycles;
  }

  private topologicalSort(subtasks: Subtask[]): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const inProgress = new Set<string>();
    const taskMap = new Map(subtasks.map(t => [t.id, t]));
    const validTaskIds = new Set(subtasks.map(t => t.id));

    const visit = (taskId: string): void => {
      // Skip if already processed or not a valid task
      if (visited.has(taskId) || !validTaskIds.has(taskId)) return;
      // Cycle detection - skip if we're already processing this node
      if (inProgress.has(taskId)) return;

      inProgress.add(taskId);

      const task = taskMap.get(taskId);
      if (task) {
        for (const dep of task.dependencies) {
          // Only follow valid dependencies
          if (validTaskIds.has(dep)) {
            visit(dep);
          }
        }
      }

      inProgress.delete(taskId);
      visited.add(taskId);
      result.push(taskId);
    };

    for (const task of subtasks) {
      visit(task.id);
    }

    return result;
  }

  private findCriticalPath(subtasks: Subtask[]): string[] {
    if (subtasks.length === 0) return [];

    const taskMap = new Map(subtasks.map(t => [t.id, t]));
    const validTaskIds = new Set(subtasks.map(t => t.id));
    const earliestStart = new Map<string, number>();
    const earliestFinish = new Map<string, number>();

    // Forward pass - calculate earliest times
    const order = this.topologicalSort(subtasks);

    for (const taskId of order) {
      const task = taskMap.get(taskId);
      if (!task) continue;

      let start = 0;

      for (const dep of task.dependencies) {
        // Only consider valid dependencies
        if (validTaskIds.has(dep)) {
          const depFinish = earliestFinish.get(dep) ?? 0;
          start = Math.max(start, depFinish);
        }
      }

      earliestStart.set(taskId, start);
      earliestFinish.set(taskId, start + task.effortEstimate.expected);
    }

    // Find the longest path
    let maxFinish = 0;
    let lastTask = '';

    for (const [taskId, finish] of earliestFinish) {
      if (finish > maxFinish) {
        maxFinish = finish;
        lastTask = taskId;
      }
    }

    if (!lastTask) return [];

    // Trace back to find critical path with cycle protection
    const criticalPath: string[] = [lastTask];
    const visited = new Set<string>([lastTask]);
    let currentTask = taskMap.get(lastTask);

    while (currentTask && currentTask.dependencies.length > 0) {
      let criticalPredecessor = '';
      let maxPredFinish = -1;

      for (const dep of currentTask.dependencies) {
        // Only consider valid, unvisited dependencies
        if (!validTaskIds.has(dep) || visited.has(dep)) continue;

        const finish = earliestFinish.get(dep) ?? 0;
        if (finish > maxPredFinish) {
          maxPredFinish = finish;
          criticalPredecessor = dep;
        }
      }

      if (criticalPredecessor && !visited.has(criticalPredecessor)) {
        visited.add(criticalPredecessor);
        criticalPath.unshift(criticalPredecessor);
        currentTask = taskMap.get(criticalPredecessor);
      } else {
        break;
      }
    }

    return criticalPath;
  }

  private findParallelGroups(subtasks: Subtask[], executionOrder: string[]): string[][] {
    const taskMap = new Map(subtasks.map(t => [t.id, t]));
    const validTaskIds = new Set(subtasks.map(t => t.id));
    const groups: string[][] = [];

    // Group tasks that can run in parallel (same level in dependency tree)
    const levels = new Map<string, number>();

    for (const taskId of executionOrder) {
      const task = taskMap.get(taskId);
      if (!task) continue;

      let level = 0;

      for (const dep of task.dependencies) {
        if (validTaskIds.has(dep)) {
          level = Math.max(level, (levels.get(dep) ?? 0) + 1);
        }
      }

      levels.set(taskId, level);
    }

    // Group by level
    const levelGroups = new Map<number, string[]>();
    for (const [taskId, level] of levels) {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(taskId);
    }

    // Create groups respecting max parallel tasks
    for (const [, tasks] of [...levelGroups.entries()].sort((a, b) => a[0] - b[0])) {
      for (let i = 0; i < tasks.length; i += this.maxParallelTasks) {
        const group = tasks.slice(i, i + this.maxParallelTasks);
        if (group.length > 1) {
          groups.push(group);
        }
      }
    }

    return groups;
  }

  // ==========================================================================
  // Public Methods - Resource Allocation
  // ==========================================================================

  /**
   * Allocate resources (agents) to tasks based on capabilities
   */
  async allocateResources(
    subtasks: Subtask[],
    availableAgents: AgentInfo[]
  ): Promise<ResourceAllocation> {
    this.logger.info('Allocating resources', {
      taskCount: subtasks.length,
      agentCount: availableAgents.length,
    });

    const assignments: ResourceAssignment[] = [];
    const utilization = new Map<string, number>();
    const bottlenecks: string[] = [];
    const unassignedTasks: string[] = [];

    // Initialize utilization
    for (const agent of availableAgents) {
      utilization.set(agent.id, 0);
    }

    // Sort tasks by priority for allocation
    const sortedTasks = [...subtasks].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    for (const task of sortedTasks) {
      const bestAgent = this.findBestAgent(task, availableAgents, utilization);

      if (bestAgent) {
        const currentUtil = utilization.get(bestAgent.id) ?? 0;
        const newUtil = currentUtil + task.effortEstimate.expected;
        utilization.set(bestAgent.id, newUtil);

        assignments.push({
          taskId: task.id,
          agentId: bestAgent.id,
          agentType: bestAgent.type,
          estimatedDuration: task.estimatedEffort,
          durationHours: task.effortEstimate.expected,
          confidence: this.calculateAssignmentConfidence(task, bestAgent),
        });
      } else {
        unassignedTasks.push(task.id);
      }
    }

    // Identify bottlenecks (agents with > 80% utilization relative to average)
    const avgUtilization = [...utilization.values()].reduce((a, b) => a + b, 0) / utilization.size;
    for (const [agentId, util] of utilization) {
      if (util > avgUtilization * 1.5) {
        const agent = availableAgents.find(a => a.id === agentId);
        bottlenecks.push(`${agent?.type ?? agentId} is overloaded (${Math.round(util)} hours)`);
      }
    }

    if (unassignedTasks.length > 0) {
      bottlenecks.push(`${unassignedTasks.length} tasks could not be assigned due to missing capabilities`);
    }

    return {
      assignments,
      utilization,
      bottlenecks,
      unassignedTasks,
      timestamp: new Date(),
    };
  }

  private findBestAgent(
    task: Subtask,
    agents: AgentInfo[],
    utilization: Map<string, number>
  ): AgentInfo | null {
    let bestAgent: AgentInfo | null = null;
    let bestScore = -1;

    for (const agent of agents) {
      // Check capability match
      const capabilityMatch = this.calculateCapabilityMatch(
        task.requiredCapabilities,
        agent.capabilities
      );

      if (capabilityMatch === 0) continue;

      // Check agent type match
      const typeMatch = task.assignedAgentType === agent.type ? 1 : 0.5;

      // Check availability
      const currentUtil = utilization.get(agent.id) ?? 0;
      const availabilityScore = Math.max(0, 1 - currentUtil / 100);

      // Calculate overall score
      const score =
        capabilityMatch * 0.4 +
        typeMatch * 0.3 +
        availabilityScore * 0.2 +
        (agent.performanceScore ?? 50) / 100 * 0.1;

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  private calculateCapabilityMatch(required: string[], available: string[]): number {
    if (required.length === 0) return 1;

    const availableSet = new Set(available.map(c => c.toLowerCase()));
    let matched = 0;

    for (const req of required) {
      if (availableSet.has(req.toLowerCase())) {
        matched++;
      }
    }

    return matched / required.length;
  }

  private calculateAssignmentConfidence(task: Subtask, agent: AgentInfo): number {
    const capabilityMatch = this.calculateCapabilityMatch(
      task.requiredCapabilities,
      agent.capabilities
    );
    const typeMatch = task.assignedAgentType === agent.type ? 1 : 0.7;
    const performanceScore = (agent.performanceScore ?? 70) / 100;

    return Math.round((capabilityMatch * 0.5 + typeMatch * 0.3 + performanceScore * 0.2) * 100);
  }

  // ==========================================================================
  // Public Methods - Timeline Estimation
  // ==========================================================================

  /**
   * Estimate project timeline with milestones
   */
  async estimateTimeline(decomposition: TaskDecomposition): Promise<TimelineEstimate> {
    this.logger.info('Estimating timeline', { totalHours: decomposition.totalHours });

    const dependencyGraph = await this.analyzeDependencies(decomposition.subtasks);
    const startDate = new Date();

    // Calculate working hours per day (8 hours)
    const hoursPerDay = 8;
    const bufferPercentage = this.estimationStrategy === 'pessimistic' ? 30 :
                            this.estimationStrategy === 'optimistic' ? 10 : 20;

    // Calculate critical path duration
    let criticalPathHours = 0;
    for (const taskId of dependencyGraph.criticalPath) {
      const task = decomposition.subtasks.find(t => t.id === taskId);
      if (task) {
        criticalPathHours += task.effortEstimate.expected;
      }
    }

    // Add buffer
    const totalHoursWithBuffer = criticalPathHours * (1 + bufferPercentage / 100);
    const totalDays = Math.ceil(totalHoursWithBuffer / hoursPerDay);

    const endDate = this.addBusinessDays(startDate, totalDays);

    // Create phases
    const phases = this.createPhases(decomposition.subtasks, startDate, totalDays);

    // Create milestones
    const milestones = this.createMilestones(decomposition.subtasks, phases);

    // Calculate confidence based on estimation variance
    const confidence = this.calculateTimelineConfidence(decomposition.subtasks);

    return {
      startDate,
      endDate,
      totalDays,
      milestones,
      phases,
      confidence,
      bufferPercentage,
      timestamp: new Date(),
    };
  }

  private createPhases(subtasks: Subtask[], startDate: Date, totalDays: number): Phase[] {
    const phases: Phase[] = [];

    // Group tasks into phases
    const planning = subtasks.filter(t =>
      t.description.toLowerCase().includes('requirement') ||
      t.description.toLowerCase().includes('specification') ||
      t.description.toLowerCase().includes('design')
    );

    const implementation = subtasks.filter(t =>
      t.description.toLowerCase().includes('implement') ||
      t.description.toLowerCase().includes('develop') ||
      t.assignedAgentType === AgentType.CODER
    );

    const testing = subtasks.filter(t =>
      t.description.toLowerCase().includes('test') ||
      t.assignedAgentType === AgentType.TESTER
    );

    const documentation = subtasks.filter(t =>
      t.description.toLowerCase().includes('document') ||
      t.description.toLowerCase().includes('review') ||
      t.assignedAgentType === AgentType.DOCUMENTER ||
      t.assignedAgentType === AgentType.REVIEWER
    );

    // Calculate phase durations as percentages
    const planningDays = Math.ceil(totalDays * 0.15);
    const implementationDays = Math.ceil(totalDays * 0.50);
    const testingDays = Math.ceil(totalDays * 0.25);
    const documentationDays = Math.ceil(totalDays * 0.10);

    let currentDate = new Date(startDate);

    if (planning.length > 0) {
      const phaseEnd = this.addBusinessDays(currentDate, planningDays);
      phases.push({
        name: 'Planning & Design',
        start: new Date(currentDate),
        end: phaseEnd,
        tasks: planning.map(t => t.id),
        description: 'Requirements analysis and system design',
      });
      currentDate = phaseEnd;
    }

    if (implementation.length > 0) {
      const phaseEnd = this.addBusinessDays(currentDate, implementationDays);
      phases.push({
        name: 'Implementation',
        start: new Date(currentDate),
        end: phaseEnd,
        tasks: implementation.map(t => t.id),
        description: 'Core development and feature implementation',
      });
      currentDate = phaseEnd;
    }

    if (testing.length > 0) {
      const phaseEnd = this.addBusinessDays(currentDate, testingDays);
      phases.push({
        name: 'Testing & QA',
        start: new Date(currentDate),
        end: phaseEnd,
        tasks: testing.map(t => t.id),
        description: 'Testing, bug fixes, and quality assurance',
      });
      currentDate = phaseEnd;
    }

    if (documentation.length > 0) {
      const phaseEnd = this.addBusinessDays(currentDate, documentationDays);
      phases.push({
        name: 'Documentation & Review',
        start: new Date(currentDate),
        end: phaseEnd,
        tasks: documentation.map(t => t.id),
        description: 'Documentation and final code review',
      });
    }

    return phases;
  }

  private createMilestones(subtasks: Subtask[], phases: Phase[]): Milestone[] {
    const milestones: Milestone[] = [];

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      milestones.push({
        name: `${phase.name} Complete`,
        date: phase.end,
        deliverables: this.getPhaseDeliverables(phase.name),
        requiredTasks: phase.tasks,
      });
    }

    return milestones;
  }

  private getPhaseDeliverables(phaseName: string): string[] {
    const deliverables: Record<string, string[]> = {
      'Planning & Design': [
        'Requirements document',
        'Architecture design',
        'Technical specification',
      ],
      'Implementation': [
        'Core features implemented',
        'API endpoints',
        'Database models',
      ],
      'Testing & QA': [
        'Unit tests',
        'Integration tests',
        'Bug fixes',
      ],
      'Documentation & Review': [
        'API documentation',
        'User guide',
        'Code review complete',
      ],
    };

    return deliverables[phaseName] ?? ['Phase deliverables'];
  }

  private calculateTimelineConfidence(subtasks: Subtask[]): number {
    // Calculate confidence based on effort estimate variance
    let totalVariance = 0;
    let totalEstimate = 0;

    for (const task of subtasks) {
      const { min, max, expected } = task.effortEstimate;
      const variance = Math.pow((max - min) / 6, 2); // Standard deviation squared
      totalVariance += variance;
      totalEstimate += expected;
    }

    // Coefficient of variation
    const cv = Math.sqrt(totalVariance) / totalEstimate;

    // Convert to confidence (lower variance = higher confidence)
    const confidence = Math.max(50, Math.min(95, 100 - cv * 100));

    return Math.round(confidence);
  }

  private addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let addedDays = 0;

    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      // Skip weekends (0 = Sunday, 6 = Saturday)
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        addedDays++;
      }
    }

    return result;
  }

  // ==========================================================================
  // Public Methods - Risk Assessment
  // ==========================================================================

  /**
   * Assess risks in an execution plan
   */
  async assessRisks(
    decomposition: TaskDecomposition,
    dependencies: DependencyGraph,
    resources?: ResourceAllocation
  ): Promise<RiskAssessment> {
    this.logger.info('Assessing risks');

    const risks: Risk[] = [];
    let riskIdCounter = 0;

    // Check for dependency-related risks
    if (dependencies.cycles.length > 0) {
      risks.push({
        id: `risk_${++riskIdCounter}`,
        description: 'Circular dependencies detected in task graph',
        probability: 'high',
        impact: 'high',
        score: 9,
        mitigation: 'Refactor task dependencies to eliminate cycles',
        contingency: 'Execute tasks sequentially with manual coordination',
        relatedTasks: dependencies.cycles.flat(),
        category: 'technical',
      });
    }

    // Check for critical path risks
    if (dependencies.criticalPath.length > decomposition.subtasks.length * 0.8) {
      risks.push({
        id: `risk_${++riskIdCounter}`,
        description: 'Long critical path with limited parallelization opportunities',
        probability: 'medium',
        impact: 'high',
        score: 6,
        mitigation: 'Identify opportunities to parallelize tasks',
        contingency: 'Add resources to critical path tasks',
        relatedTasks: dependencies.criticalPath,
        category: 'schedule',
      });
    }

    // Check for resource-related risks
    if (resources) {
      if (resources.unassignedTasks.length > 0) {
        risks.push({
          id: `risk_${++riskIdCounter}`,
          description: `${resources.unassignedTasks.length} tasks cannot be assigned due to missing capabilities`,
          probability: 'high',
          impact: 'high',
          score: 9,
          mitigation: 'Recruit agents with required capabilities or train existing agents',
          contingency: 'Outsource or delay affected tasks',
          relatedTasks: resources.unassignedTasks,
          category: 'resource',
        });
      }

      if (resources.bottlenecks.length > 0) {
        risks.push({
          id: `risk_${++riskIdCounter}`,
          description: 'Resource bottlenecks identified',
          probability: 'medium',
          impact: 'medium',
          score: 4,
          mitigation: 'Redistribute workload or add resources',
          contingency: 'Extend timeline for affected tasks',
          category: 'resource',
        });
      }
    }

    // Check for high-priority task concentration
    const criticalTasks = decomposition.subtasks.filter(t => t.priority === 'critical');
    if (criticalTasks.length > decomposition.subtasks.length * 0.3) {
      risks.push({
        id: `risk_${++riskIdCounter}`,
        description: 'High concentration of critical-priority tasks',
        probability: 'medium',
        impact: 'high',
        score: 6,
        mitigation: 'Re-evaluate priorities and ensure adequate resource allocation',
        contingency: 'Focus on most impactful critical tasks first',
        relatedTasks: criticalTasks.map(t => t.id),
        category: 'scope',
      });
    }

    // Check for estimation uncertainty
    const highVarianceTasks = decomposition.subtasks.filter(t => {
      const { min, max, expected } = t.effortEstimate;
      const variance = (max - min) / expected;
      return variance > 0.5;
    });

    if (highVarianceTasks.length > 0) {
      risks.push({
        id: `risk_${++riskIdCounter}`,
        description: `${highVarianceTasks.length} tasks have high estimation uncertainty`,
        probability: 'medium',
        impact: 'medium',
        score: 4,
        mitigation: 'Break down uncertain tasks into smaller, more predictable units',
        contingency: 'Add buffer time for uncertain tasks',
        relatedTasks: highVarianceTasks.map(t => t.id),
        category: 'schedule',
      });
    }

    // Add general technical risks
    risks.push({
      id: `risk_${++riskIdCounter}`,
      description: 'Integration issues between components',
      probability: 'medium',
      impact: 'medium',
      score: 4,
      mitigation: 'Implement integration tests early and maintain clear interfaces',
      contingency: 'Allocate dedicated time for integration debugging',
      category: 'technical',
    });

    // Calculate overall risk
    const avgScore = risks.length > 0
      ? risks.reduce((sum, r) => sum + r.score, 0) / risks.length
      : 0;

    const overallRisk: RiskProbability =
      avgScore > 6 ? 'high' : avgScore > 3 ? 'medium' : 'low';

    const riskScore = Math.round(avgScore * 10);

    // Generate recommendations
    const recommendations = this.generateRiskRecommendations(risks);

    return {
      risks: risks.sort((a, b) => b.score - a.score),
      overallRisk,
      riskScore,
      recommendations,
      timestamp: new Date(),
    };
  }

  private generateRiskRecommendations(risks: Risk[]): string[] {
    const recommendations: string[] = [];

    const highRisks = risks.filter(r => r.score >= 6);
    const mediumRisks = risks.filter(r => r.score >= 3 && r.score < 6);

    if (highRisks.length > 0) {
      recommendations.push(
        `Address ${highRisks.length} high-priority risk(s) before proceeding`
      );
    }

    if (mediumRisks.length > 0) {
      recommendations.push(
        `Monitor ${mediumRisks.length} medium-priority risk(s) throughout the project`
      );
    }

    const categories = [...new Set(risks.map(r => r.category))];
    for (const category of categories) {
      const categoryRisks = risks.filter(r => r.category === category);
      if (categoryRisks.length >= 2) {
        recommendations.push(
          `Focus on ${category} risk mitigation (${categoryRisks.length} related risks)`
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Risk profile is acceptable - proceed with standard monitoring');
    }

    return recommendations;
  }

  // ==========================================================================
  // Public Methods - Complete Execution Plan
  // ==========================================================================

  /**
   * Create a complete execution plan
   */
  async createExecutionPlan(
    planName: string,
    task: string,
    availableAgents: AgentInfo[]
  ): Promise<ExecutionPlan> {
    this.logger.info('Creating execution plan', { planName, task: task.slice(0, 100) });

    // Decompose task
    const decomposition = await this.decomposeTask(task);

    // Analyze dependencies
    const dependencies = await this.analyzeDependencies(decomposition.subtasks);

    // Allocate resources
    const resources = await this.allocateResources(decomposition.subtasks, availableAgents);

    // Estimate timeline
    const timeline = await this.estimateTimeline(decomposition);

    // Assess risks
    const risks = this.includeRiskAssessment
      ? await this.assessRisks(decomposition, dependencies, resources)
      : {
          risks: [],
          overallRisk: 'low' as const,
          riskScore: 0,
          recommendations: [],
          timestamp: new Date(),
        };

    const now = new Date();

    return {
      id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: planName,
      decomposition,
      dependencies,
      resources,
      timeline,
      risks,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
  }

  // ==========================================================================
  // Private Task Handlers
  // ==========================================================================

  private async handleDecomposeTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<TaskDecomposition>> {
    const input = task.input?.data as { task: string } | undefined;

    if (!input?.task) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Task description is required for decomposition',
        startTime
      ) as AgentResult<TaskDecomposition>;
    }

    try {
      const decomposition = await this.decomposeTask(input.task);
      return this.createSuccessResult(decomposition, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        'DECOMPOSITION_ERROR',
        `Task decomposition failed: ${message}`,
        startTime
      ) as AgentResult<TaskDecomposition>;
    }
  }

  private async handleDependenciesTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<DependencyGraph>> {
    const input = task.input?.data as { subtasks: Subtask[] } | undefined;

    if (!input?.subtasks || !Array.isArray(input.subtasks)) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Subtasks array is required for dependency analysis',
        startTime
      ) as AgentResult<DependencyGraph>;
    }

    try {
      const dependencies = await this.analyzeDependencies(input.subtasks);
      return this.createSuccessResult(dependencies, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        'DEPENDENCY_ERROR',
        `Dependency analysis failed: ${message}`,
        startTime
      ) as AgentResult<DependencyGraph>;
    }
  }

  private async handleAllocateTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<ResourceAllocation>> {
    const input = task.input?.data as {
      subtasks: Subtask[];
      agents: AgentInfo[];
    } | undefined;

    if (!input?.subtasks || !input?.agents) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Subtasks and agents are required for resource allocation',
        startTime
      ) as AgentResult<ResourceAllocation>;
    }

    try {
      const allocation = await this.allocateResources(input.subtasks, input.agents);
      return this.createSuccessResult(allocation, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        'ALLOCATION_ERROR',
        `Resource allocation failed: ${message}`,
        startTime
      ) as AgentResult<ResourceAllocation>;
    }
  }

  private async handleTimelineTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<TimelineEstimate>> {
    const input = task.input?.data as { decomposition: TaskDecomposition } | undefined;

    if (!input?.decomposition) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Task decomposition is required for timeline estimation',
        startTime
      ) as AgentResult<TimelineEstimate>;
    }

    try {
      const timeline = await this.estimateTimeline(input.decomposition);
      return this.createSuccessResult(timeline, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        'TIMELINE_ERROR',
        `Timeline estimation failed: ${message}`,
        startTime
      ) as AgentResult<TimelineEstimate>;
    }
  }

  private async handleRisksTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<RiskAssessment>> {
    const input = task.input?.data as {
      decomposition: TaskDecomposition;
      dependencies: DependencyGraph;
      resources?: ResourceAllocation;
    } | undefined;

    if (!input?.decomposition || !input?.dependencies) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Decomposition and dependencies are required for risk assessment',
        startTime
      ) as AgentResult<RiskAssessment>;
    }

    try {
      const risks = await this.assessRisks(
        input.decomposition,
        input.dependencies,
        input.resources
      );
      return this.createSuccessResult(risks, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        'RISK_ERROR',
        `Risk assessment failed: ${message}`,
        startTime
      ) as AgentResult<RiskAssessment>;
    }
  }

  private async handlePlanTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<ExecutionPlan>> {
    const input = task.input?.data as {
      planName: string;
      task: string;
      agents: AgentInfo[];
    } | undefined;

    if (!input?.planName || !input?.task || !input?.agents) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Plan name, task description, and agents are required',
        startTime
      ) as AgentResult<ExecutionPlan>;
    }

    try {
      const plan = await this.createExecutionPlan(
        input.planName,
        input.task,
        input.agents
      );

      const artifacts: ResultArtifact[] = [
        {
          type: 'report',
          name: 'execution-plan',
          content: JSON.stringify(plan, null, 2),
          mimeType: 'application/json',
        },
      ];

      return this.createSuccessResult(plan, startTime, artifacts);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        'PLAN_ERROR',
        `Execution plan creation failed: ${message}`,
        startTime
      ) as AgentResult<ExecutionPlan>;
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private formatDuration(hours: number): string {
    if (hours < 8) {
      return `${Math.round(hours)} hours`;
    }

    const days = Math.floor(hours / 8);
    const remainingHours = Math.round(hours % 8);

    if (remainingHours === 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    }

    return `${days} day${days > 1 ? 's' : ''} ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
  }
}
