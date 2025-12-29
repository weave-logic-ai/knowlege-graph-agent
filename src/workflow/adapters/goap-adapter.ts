/**
 * GOAP Adapter
 *
 * Adapts the existing goal-planner agent for use with Workflow DevKit.
 * Provides A* search-based planning with OODA loop integration.
 *
 * @module workflow/adapters/goap-adapter
 */

import type {
  WorldState,
  GOAPAction,
  GOAPGoal,
  GOAPPlan,
  PlanExecutionResult,
  ReadinessEvaluation,
} from '../types.js';
import { createLogger } from '../../utils/index.js';

const logger = createLogger('goap-adapter');

// ============================================================================
// Priority Queue Implementation
// ============================================================================

/**
 * Priority queue item with priority score
 */
interface PriorityQueueItem<T> {
  item: T;
  priority: number;
}

/**
 * Priority queue implementation for A* search
 *
 * Uses a binary heap for efficient O(log n) enqueue and dequeue operations.
 * Items with lower priority values are dequeued first (min-heap).
 */
class PriorityQueue<T> {
  private items: Array<PriorityQueueItem<T>> = [];

  /**
   * Add an item to the queue with a priority
   *
   * @param item - The item to add
   * @param priority - Priority value (lower = higher priority)
   */
  enqueue(item: T, priority: number): void {
    this.items.push({ item, priority });
    this.bubbleUp(this.items.length - 1);
  }

  /**
   * Remove and return the highest priority item
   *
   * @returns The item with lowest priority value, or undefined if empty
   */
  dequeue(): T | undefined {
    if (this.items.length === 0) {
      return undefined;
    }

    const result = this.items[0].item;

    if (this.items.length === 1) {
      this.items.pop();
    } else {
      this.items[0] = this.items.pop()!;
      this.bubbleDown(0);
    }

    return result;
  }

  /**
   * Check if the queue is empty
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Get the current size of the queue
   */
  size(): number {
    return this.items.length;
  }

  /**
   * Peek at the highest priority item without removing it
   */
  peek(): T | undefined {
    return this.items[0]?.item;
  }

  /**
   * Clear all items from the queue
   */
  clear(): void {
    this.items = [];
  }

  /**
   * Bubble up an item to maintain heap property
   */
  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.items[parentIndex].priority <= this.items[index].priority) {
        break;
      }
      [this.items[parentIndex], this.items[index]] = [
        this.items[index],
        this.items[parentIndex],
      ];
      index = parentIndex;
    }
  }

  /**
   * Bubble down an item to maintain heap property
   */
  private bubbleDown(index: number): void {
    const length = this.items.length;

    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (
        leftChild < length &&
        this.items[leftChild].priority < this.items[smallest].priority
      ) {
        smallest = leftChild;
      }

      if (
        rightChild < length &&
        this.items[rightChild].priority < this.items[smallest].priority
      ) {
        smallest = rightChild;
      }

      if (smallest === index) {
        break;
      }

      [this.items[index], this.items[smallest]] = [
        this.items[smallest],
        this.items[index],
      ];
      index = smallest;
    }
  }
}

// ============================================================================
// State Node for A* Search
// ============================================================================

/**
 * State node for A* search algorithm
 *
 * Represents a node in the search graph with costs and parent reference
 * for path reconstruction.
 */
interface StateNode {
  /** Current world state at this node */
  state: WorldState;
  /** Cost from start node (g-cost) */
  gCost: number;
  /** Heuristic cost to goal (h-cost) */
  hCost: number;
  /** Total cost (f-cost = g-cost + h-cost) */
  fCost: number;
  /** Parent node for path reconstruction */
  parent: StateNode | null;
  /** Action taken to reach this state from parent */
  action: GOAPAction | null;
}

/**
 * GOAP Adapter configuration
 */
export interface GOAPAdapterConfig {
  /** Maximum planning iterations */
  maxIterations?: number;
  /** Planning timeout in ms */
  timeoutMs?: number;
  /** Default action cost */
  defaultCost?: number;
  /** Enable plan caching */
  enableCaching?: boolean;
  /** Maximum plan length */
  maxPlanLength?: number;
  /** Custom actions to register */
  actions?: GOAPAction[];
  /** Custom heuristic function */
  heuristic?: (state: WorldState, goal: Partial<WorldState>) => number;
  /** Logger function */
  logger?: (level: string, message: string, data?: Record<string, unknown>) => void;
}

// ============================================================================
// Default GOAP Actions
// ============================================================================

/**
 * Default GOAP actions for knowledge graph workflows
 *
 * These actions represent common development workflow operations
 * and can be extended or replaced with custom actions.
 */
export const DEFAULT_GOAP_ACTIONS: GOAPAction[] = [
  {
    id: 'analyze-spec',
    name: 'Analyze Specification',
    cost: 1,
    preconditions: { hasSpecification: true },
    effects: { specCompleteness: 0 }, // Will be calculated
    execute: async (state) => ({
      ...state,
      specCompleteness: Math.min(1, state.specCompleteness + 0.3 + Math.random() * 0.2),
    }),
  },
  {
    id: 'generate-task-spec',
    name: 'Generate Task Specification',
    cost: 3,
    preconditions: {
      specCompleteness: 0.7, // Must be >= 0.7
      hasAcceptanceCriteria: true,
    },
    effects: { taskDefined: true },
    execute: async (state) => ({
      ...state,
      taskDefined: true,
    }),
  },
  {
    id: 'generate-missing-docs',
    name: 'Generate Missing Documentation',
    cost: 5,
    preconditions: {
      specCompleteness: 0, // Any completeness
      timeSinceLastChange: 300000, // 5 minutes
    },
    effects: { specCompleteness: 0.3 }, // Adds 0.3
    execute: async (state) => ({
      ...state,
      specCompleteness: Math.min(1, state.specCompleteness + 0.3),
    }),
  },
  {
    id: 'start-development',
    name: 'Start Development',
    cost: 10,
    preconditions: {
      taskDefined: true,
      blockersFree: true,
    },
    effects: { developmentStarted: true },
    execute: async (state) => ({
      ...state,
      developmentStarted: true,
    }),
  },
  {
    id: 'resolve-blockers',
    name: 'Resolve Blockers',
    cost: 8,
    preconditions: { blockersFree: false },
    effects: { blockersFree: true },
    execute: async (state) => ({
      ...state,
      blockersFree: true,
    }),
  },
  {
    id: 'request-clarification',
    name: 'Request Clarification',
    cost: 2,
    preconditions: { hasAcceptanceCriteria: false },
    effects: { hasAcceptanceCriteria: true },
    execute: async (state) => ({
      ...state,
      hasAcceptanceCriteria: true,
    }),
  },
];

// ============================================================================
// GOAP Adapter Class
// ============================================================================

/**
 * GOAP Adapter class
 *
 * Implements Goal-Oriented Action Planning using A* search algorithm.
 * Integrates with the existing goal-planner agent patterns.
 *
 * @example
 * ```typescript
 * const adapter = new GOAPAdapter({
 *   actions: DEFAULT_GOAP_ACTIONS,
 *   maxIterations: 1000,
 * });
 *
 * const plan = await adapter.createPlan(worldState, 'start-development');
 * if (plan.achievable) {
 *   const result = await adapter.executePlan(plan, worldState);
 *   console.log('Execution result:', result);
 * }
 * ```
 */
export class GOAPAdapter {
  private config: Required<Omit<GOAPAdapterConfig, 'actions' | 'heuristic' | 'logger'>>;
  private actions: Map<string, GOAPAction> = new Map();
  private goals: Map<string, GOAPGoal> = new Map();
  private planCache: Map<string, GOAPPlan> = new Map();
  private customHeuristic?: (state: WorldState, goal: Partial<WorldState>) => number;

  constructor(config: GOAPAdapterConfig = {}) {
    this.config = {
      maxIterations: config.maxIterations ?? 1000,
      timeoutMs: config.timeoutMs ?? 30000,
      defaultCost: config.defaultCost ?? 1,
      enableCaching: config.enableCaching ?? true,
      maxPlanLength: config.maxPlanLength ?? 20,
    };
    this.customHeuristic = config.heuristic;

    // Register default actions first
    this.registerDefaultActions();

    // Then register any custom actions passed in config
    if (config.actions) {
      for (const action of config.actions) {
        this.registerAction(action);
      }
    }

    this.registerDefaultGoals();
  }

  /**
   * Register default actions for documentation workflows
   */
  private registerDefaultActions(): void {
    // Action: Analyze specification
    this.registerAction({
      id: 'analyze-spec',
      name: 'Analyze Specification',
      description: 'Analyze the specification document for completeness',
      cost: 1,
      preconditions: {
        hasSpecification: true,
      },
      effects: {
        specCompleteness: 0.5, // Will be refined during execution
      },
    });

    // Action: Generate acceptance criteria
    this.registerAction({
      id: 'generate-acceptance-criteria',
      name: 'Generate Acceptance Criteria',
      description: 'Generate acceptance criteria from specification',
      cost: 2,
      preconditions: {
        hasSpecification: true,
        specCompleteness: 0.5,
      },
      effects: {
        hasAcceptanceCriteria: true,
      },
    });

    // Action: Create task
    this.registerAction({
      id: 'create-task',
      name: 'Create Task',
      description: 'Create a development task from the specification',
      cost: 1,
      preconditions: {
        hasSpecification: true,
        hasAcceptanceCriteria: true,
        blockersFree: true,
      },
      effects: {
        taskDefined: true,
      },
    });

    // Action: Start development
    this.registerAction({
      id: 'start-development',
      name: 'Start Development',
      description: 'Begin development work on the task',
      cost: 3,
      preconditions: {
        taskDefined: true,
        blockersFree: true,
      },
      effects: {
        developmentStarted: true,
      },
    });

    // Action: Fill documentation gaps
    this.registerAction({
      id: 'fill-gaps',
      name: 'Fill Documentation Gaps',
      description: 'Generate content to fill documentation gaps',
      cost: 2,
      preconditions: {
        hasSpecification: true,
      },
      effects: {
        specCompleteness: 0.8,
        pendingGaps: [],
      },
    });

    // Action: Resolve blockers
    this.registerAction({
      id: 'resolve-blockers',
      name: 'Resolve Blockers',
      description: 'Resolve blocking issues',
      cost: 4,
      preconditions: {
        blockersFree: false,
      },
      effects: {
        blockersFree: true,
      },
    });
  }

  /**
   * Register default goals
   */
  private registerDefaultGoals(): void {
    // Goal: Start development
    this.registerGoal({
      id: 'start-development',
      name: 'Start Development',
      description: 'Get the project ready to begin development',
      conditions: {
        taskDefined: true,
        developmentStarted: true,
      },
      priority: 10,
    });

    // Goal: Complete specification
    this.registerGoal({
      id: 'complete-spec',
      name: 'Complete Specification',
      description: 'Ensure specification is complete with acceptance criteria',
      conditions: {
        hasSpecification: true,
        specCompleteness: 0.8,
        hasAcceptanceCriteria: true,
      },
      priority: 8,
    });

    // Goal: Resolve all blockers
    this.registerGoal({
      id: 'resolve-blockers',
      name: 'Resolve All Blockers',
      description: 'Clear all blocking issues',
      conditions: {
        blockersFree: true,
      },
      priority: 9,
    });
  }

  /**
   * Register an action
   *
   * @param action - Action definition to register
   */
  registerAction(action: GOAPAction): void {
    this.actions.set(action.id, action);
    logger.debug('Registered action', { actionId: action.id });
  }

  /**
   * Register a goal
   *
   * @param goal - Goal definition to register
   */
  registerGoal(goal: GOAPGoal): void {
    this.goals.set(goal.id, goal);
    logger.debug('Registered goal', { goalId: goal.id });
  }

  /**
   * Get a registered action by ID
   *
   * @param actionId - Action identifier
   * @returns Action definition or undefined
   */
  getAction(actionId: string): GOAPAction | undefined {
    return this.actions.get(actionId);
  }

  /**
   * Get a registered goal by ID
   *
   * @param goalId - Goal identifier
   * @returns Goal definition or undefined
   */
  getGoal(goalId: string): GOAPGoal | undefined {
    return this.goals.get(goalId);
  }

  /**
   * Get all registered actions
   *
   * @returns Array of action definitions
   */
  getActions(): GOAPAction[] {
    return Array.from(this.actions.values());
  }

  /**
   * Get all registered goals
   *
   * @returns Array of goal definitions
   */
  getGoals(): GOAPGoal[] {
    return Array.from(this.goals.values());
  }

  /**
   * Create a plan to achieve a goal from the current state
   *
   * @param currentState - Current world state
   * @param goalId - Goal to achieve
   * @returns Plan to achieve the goal
   */
  createPlan(currentState: WorldState, goalId: string): GOAPPlan {
    const goal = this.goals.get(goalId);
    if (!goal) {
      return {
        goalId,
        actionIds: [],
        totalCost: Infinity,
        achievable: false,
        reason: `Unknown goal: ${goalId}`,
        createdAt: new Date(),
      };
    }

    // Check cache
    const cacheKey = this.createCacheKey(currentState, goalId);
    if (this.config.enableCaching && this.planCache.has(cacheKey)) {
      const cached = this.planCache.get(cacheKey)!;
      logger.debug('Using cached plan', { goalId, cacheKey });
      return cached;
    }

    logger.debug('Creating plan', { goalId, currentState });

    // Check if goal is already satisfied
    if (this.isGoalSatisfied(currentState, goal)) {
      const plan: GOAPPlan = {
        goalId,
        actionIds: [],
        totalCost: 0,
        achievable: true,
        createdAt: new Date(),
      };
      this.cachePlan(cacheKey, plan);
      return plan;
    }

    // A* search for plan
    const plan = this.aStarSearch(currentState, goal);
    this.cachePlan(cacheKey, plan);

    return plan;
  }

  /**
   * A* search algorithm for plan finding
   *
   * Uses a binary heap priority queue for efficient O(log n) operations.
   * Implements proper path reconstruction using parent node references.
   */
  private aStarSearch(startState: WorldState, goal: GOAPGoal): GOAPPlan {
    const startTime = Date.now();
    const openSet = new PriorityQueue<StateNode>();
    const closedSet = new Set<string>();

    // Initialize with start node
    const startHeuristic = this.heuristic(startState, goal);
    const startNode: StateNode = {
      state: { ...startState },
      gCost: 0,
      hCost: startHeuristic,
      fCost: startHeuristic,
      parent: null,
      action: null,
    };
    openSet.enqueue(startNode, startNode.fCost);

    let iterations = 0;
    let nodesExplored = 0;

    while (!openSet.isEmpty() && iterations < this.config.maxIterations) {
      // Check timeout
      if (Date.now() - startTime > this.config.timeoutMs) {
        logger.warn('Planning timeout', { goalId: goal.id, iterations, nodesExplored });
        return {
          goalId: goal.id,
          actionIds: [],
          totalCost: Infinity,
          achievable: false,
          reason: 'Planning timeout exceeded',
          createdAt: new Date(),
        };
      }

      iterations++;
      const current = openSet.dequeue()!;
      const stateKey = this.stateToKey(current.state);

      // Skip already visited states
      if (closedSet.has(stateKey)) {
        continue;
      }
      closedSet.add(stateKey);
      nodesExplored++;

      // Check if goal reached
      if (this.isGoalSatisfied(current.state, goal)) {
        const plan = this.reconstructPlan(current, goal);
        logger.debug('Plan found', {
          goalId: goal.id,
          iterations,
          nodesExplored,
          actionCount: plan.actionIds.length,
        });
        return plan;
      }

      // Check plan length limit
      let pathLength = 0;
      let node: StateNode | null = current;
      while (node) {
        pathLength++;
        node = node.parent;
      }
      if (pathLength >= this.config.maxPlanLength) {
        continue; // Skip paths that are too long
      }

      // Expand neighbors (applicable actions)
      for (const action of Array.from(this.actions.values())) {
        if (!this.canApply(action, current.state)) {
          continue;
        }

        const newState = this.applyAction(action, current.state);
        const newStateKey = this.stateToKey(newState);

        if (closedSet.has(newStateKey)) {
          continue;
        }

        const gCost = current.gCost + action.cost;
        const hCost = this.heuristic(newState, goal);
        const fCost = gCost + hCost;

        const newNode: StateNode = {
          state: newState,
          gCost,
          hCost,
          fCost,
          parent: current,
          action,
        };

        openSet.enqueue(newNode, fCost);
      }
    }

    logger.debug('No plan found', { goalId: goal.id, iterations, nodesExplored });
    return {
      goalId: goal.id,
      actionIds: [],
      totalCost: Infinity,
      achievable: false,
      reason: 'No valid action sequence found',
      createdAt: new Date(),
    };
  }

  /**
   * Reconstruct the plan from the goal node by following parent references
   *
   * @param goalNode - The node that reached the goal
   * @param goal - The goal definition
   * @returns Complete GOAP plan
   */
  private reconstructPlan(goalNode: StateNode, goal: GOAPGoal): GOAPPlan {
    const actionIds: string[] = [];
    let current: StateNode | null = goalNode;
    let totalCost = 0;

    // Walk back through parent chain to build path
    while (current && current.action) {
      actionIds.unshift(current.action.id);
      totalCost += current.action.cost;
      current = current.parent;
    }

    // Calculate confidence based on plan length and cost
    const lengthPenalty = actionIds.length * 0.05;
    const costPenalty = totalCost * 0.01;
    const confidence = Math.max(0.3, 1 - lengthPenalty - costPenalty);

    return {
      goalId: goal.id,
      actionIds,
      totalCost,
      achievable: true,
      estimatedTimeMs: totalCost * 1000,
      createdAt: new Date(),
      confidence,
    };
  }

  /**
   * Heuristic function for A* (estimates cost to goal)
   *
   * Uses Manhattan-like distance for numeric values and
   * fixed penalties for boolean mismatches.
   *
   * @param state - Current world state
   * @param goal - Goal to reach
   * @returns Estimated cost to reach goal
   */
  private heuristic(state: WorldState, goal: GOAPGoal): number {
    // Use custom heuristic if provided
    if (this.customHeuristic) {
      return this.customHeuristic(state, goal.conditions);
    }

    let distance = 0;

    for (const [key, value] of Object.entries(goal.conditions)) {
      const currentValue = state[key as keyof WorldState];

      if (typeof value === 'boolean') {
        if (currentValue !== value) {
          distance += 5; // Boolean mismatch penalty
        }
      } else if (typeof value === 'number' && typeof currentValue === 'number') {
        // Numeric distance scaled by 10
        if (currentValue < value) {
          distance += (value - currentValue) * 10;
        }
      } else if (Array.isArray(value) && Array.isArray(currentValue)) {
        // Array comparison (e.g., pendingGaps)
        if (value.length === 0 && currentValue.length > 0) {
          distance += currentValue.length * 2;
        }
      } else if (currentValue !== value) {
        distance += this.config.defaultCost;
      }
    }

    return distance;
  }

  /**
   * Check if a goal is satisfied by the current state
   */
  private isGoalSatisfied(state: WorldState, goal: GOAPGoal): boolean {
    for (const [key, value] of Object.entries(goal.conditions)) {
      const currentValue = state[key];

      if (typeof value === 'number' && typeof currentValue === 'number') {
        if (currentValue < value) {
          return false;
        }
      } else if (Array.isArray(value) && Array.isArray(currentValue)) {
        if (value.length > 0 && currentValue.length > 0) {
          return false; // Non-empty arrays must match
        }
      } else if (currentValue !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if an action can be applied to a state
   */
  private canApply(action: GOAPAction, state: WorldState): boolean {
    for (const [key, value] of Object.entries(action.preconditions)) {
      const currentValue = state[key];

      if (typeof value === 'number' && typeof currentValue === 'number') {
        if (currentValue < value) {
          return false;
        }
      } else if (currentValue !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Apply an action to a state and return the new state
   */
  private applyAction(action: GOAPAction, state: WorldState): WorldState {
    const newState = { ...state };

    for (const [key, value] of Object.entries(action.effects)) {
      (newState as Record<string, unknown>)[key] = value;
    }

    return newState;
  }

  /**
   * Convert state to a cache key string
   */
  private stateToKey(state: WorldState): string {
    const sortedKeys = Object.keys(state).sort();
    const values = sortedKeys.map(k => `${k}:${JSON.stringify(state[k])}`);
    return values.join('|');
  }

  /**
   * Create cache key for a plan
   */
  private createCacheKey(state: WorldState, goalId: string): string {
    return `${goalId}::${this.stateToKey(state)}`;
  }

  /**
   * Cache a plan
   */
  private cachePlan(key: string, plan: GOAPPlan): void {
    if (this.config.enableCaching) {
      this.planCache.set(key, plan);
    }
  }

  /**
   * Clear the plan cache
   */
  clearCache(): void {
    this.planCache.clear();
    logger.debug('Plan cache cleared');
  }

  /**
   * Execute a plan
   *
   * @param plan - Plan to execute
   * @param initialState - Initial world state
   * @returns Execution result
   */
  async executePlan(plan: GOAPPlan, initialState: WorldState): Promise<PlanExecutionResult> {
    if (!plan.achievable) {
      return {
        success: false,
        finalState: initialState,
        completedSteps: [],
        error: plan.reason || 'Plan is not achievable',
        executionTimeMs: 0,
      };
    }

    const startTime = Date.now();
    let currentState = { ...initialState };
    const completedSteps: string[] = [];

    logger.info('Executing plan', {
      goalId: plan.goalId,
      actionCount: plan.actionIds.length
    });

    for (const actionId of plan.actionIds) {
      const action = this.actions.get(actionId);
      if (!action) {
        return {
          success: false,
          finalState: currentState,
          completedSteps,
          failedStep: actionId,
          error: `Unknown action: ${actionId}`,
          executionTimeMs: Date.now() - startTime,
        };
      }

      // Check preconditions
      if (!this.canApply(action, currentState)) {
        return {
          success: false,
          finalState: currentState,
          completedSteps,
          failedStep: actionId,
          error: `Preconditions not met for action: ${actionId}`,
          executionTimeMs: Date.now() - startTime,
        };
      }

      try {
        // Execute action
        if (action.execute) {
          currentState = await action.execute(currentState);
        } else {
          currentState = this.applyAction(action, currentState);
        }

        completedSteps.push(actionId);
        logger.debug(`Action completed: ${actionId}`);
      } catch (error) {
        logger.error(`Action failed: ${actionId}`, error instanceof Error ? error : new Error(String(error)));
        return {
          success: false,
          finalState: currentState,
          completedSteps,
          failedStep: actionId,
          error: error instanceof Error ? error.message : String(error),
          executionTimeMs: Date.now() - startTime,
        };
      }
    }

    logger.info('Plan execution completed', {
      goalId: plan.goalId,
      completedSteps: completedSteps.length
    });

    return {
      success: true,
      finalState: currentState,
      completedSteps,
      executionTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Evaluate readiness for development
   *
   * @param state - Current world state
   * @returns Readiness evaluation
   */
  evaluateReadiness(state: WorldState): ReadinessEvaluation {
    const blockers: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check specification
    if (!state.hasSpecification) {
      blockers.push('No specification document found');
      recommendations.push('Create a specification document');
    } else {
      score += 0.2;

      if (state.specCompleteness < 0.5) {
        blockers.push('Specification is incomplete');
        recommendations.push('Complete the specification document');
      } else if (state.specCompleteness < 0.8) {
        recommendations.push('Consider improving specification completeness');
        score += 0.1;
      } else {
        score += 0.2;
      }
    }

    // Check acceptance criteria
    if (!state.hasAcceptanceCriteria) {
      blockers.push('No acceptance criteria defined');
      recommendations.push('Define acceptance criteria');
    } else {
      score += 0.2;
    }

    // Check blockers
    if (!state.blockersFree) {
      blockers.push('Blocking issues exist');
      recommendations.push('Resolve blocking issues');
    } else {
      score += 0.2;
    }

    // Check pending gaps
    if (state.pendingGaps.length > 0) {
      recommendations.push(`Address ${state.pendingGaps.length} documentation gaps`);
    } else {
      score += 0.1;
    }

    // Check task definition
    if (state.taskDefined) {
      score += 0.1;
    } else if (blockers.length === 0) {
      recommendations.push('Create a task from the specification');
    }

    return {
      score: Math.min(1, score),
      ready: blockers.length === 0 && score >= 0.7,
      blockers,
      recommendations,
      evaluatedAt: new Date(),
    };
  }
}

/**
 * Create a GOAP adapter instance
 *
 * @param config - Adapter configuration
 * @returns Configured GOAP adapter
 */
export function createGOAPAdapter(config?: GOAPAdapterConfig): GOAPAdapter {
  return new GOAPAdapter(config);
}
