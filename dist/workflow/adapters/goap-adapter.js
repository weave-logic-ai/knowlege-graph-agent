import { createLogger } from "../../utils/logger.js";
const logger = createLogger("goap-adapter");
class PriorityQueue {
  items = [];
  /**
   * Add an item to the queue with a priority
   *
   * @param item - The item to add
   * @param priority - Priority value (lower = higher priority)
   */
  enqueue(item, priority) {
    this.items.push({ item, priority });
    this.bubbleUp(this.items.length - 1);
  }
  /**
   * Remove and return the highest priority item
   *
   * @returns The item with lowest priority value, or undefined if empty
   */
  dequeue() {
    if (this.items.length === 0) {
      return void 0;
    }
    const result = this.items[0].item;
    if (this.items.length === 1) {
      this.items.pop();
    } else {
      this.items[0] = this.items.pop();
      this.bubbleDown(0);
    }
    return result;
  }
  /**
   * Check if the queue is empty
   */
  isEmpty() {
    return this.items.length === 0;
  }
  /**
   * Get the current size of the queue
   */
  size() {
    return this.items.length;
  }
  /**
   * Peek at the highest priority item without removing it
   */
  peek() {
    return this.items[0]?.item;
  }
  /**
   * Clear all items from the queue
   */
  clear() {
    this.items = [];
  }
  /**
   * Bubble up an item to maintain heap property
   */
  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.items[parentIndex].priority <= this.items[index].priority) {
        break;
      }
      [this.items[parentIndex], this.items[index]] = [
        this.items[index],
        this.items[parentIndex]
      ];
      index = parentIndex;
    }
  }
  /**
   * Bubble down an item to maintain heap property
   */
  bubbleDown(index) {
    const length = this.items.length;
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;
      if (leftChild < length && this.items[leftChild].priority < this.items[smallest].priority) {
        smallest = leftChild;
      }
      if (rightChild < length && this.items[rightChild].priority < this.items[smallest].priority) {
        smallest = rightChild;
      }
      if (smallest === index) {
        break;
      }
      [this.items[index], this.items[smallest]] = [
        this.items[smallest],
        this.items[index]
      ];
      index = smallest;
    }
  }
}
class GOAPAdapter {
  config;
  actions = /* @__PURE__ */ new Map();
  goals = /* @__PURE__ */ new Map();
  planCache = /* @__PURE__ */ new Map();
  customHeuristic;
  constructor(config = {}) {
    this.config = {
      maxIterations: config.maxIterations ?? 1e3,
      timeoutMs: config.timeoutMs ?? 3e4,
      defaultCost: config.defaultCost ?? 1,
      enableCaching: config.enableCaching ?? true,
      maxPlanLength: config.maxPlanLength ?? 20
    };
    this.customHeuristic = config.heuristic;
    this.registerDefaultActions();
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
  registerDefaultActions() {
    this.registerAction({
      id: "analyze-spec",
      name: "Analyze Specification",
      description: "Analyze the specification document for completeness",
      cost: 1,
      preconditions: {
        hasSpecification: true
      },
      effects: {
        specCompleteness: 0.5
        // Will be refined during execution
      }
    });
    this.registerAction({
      id: "generate-acceptance-criteria",
      name: "Generate Acceptance Criteria",
      description: "Generate acceptance criteria from specification",
      cost: 2,
      preconditions: {
        hasSpecification: true,
        specCompleteness: 0.5
      },
      effects: {
        hasAcceptanceCriteria: true
      }
    });
    this.registerAction({
      id: "create-task",
      name: "Create Task",
      description: "Create a development task from the specification",
      cost: 1,
      preconditions: {
        hasSpecification: true,
        hasAcceptanceCriteria: true,
        blockersFree: true
      },
      effects: {
        taskDefined: true
      }
    });
    this.registerAction({
      id: "start-development",
      name: "Start Development",
      description: "Begin development work on the task",
      cost: 3,
      preconditions: {
        taskDefined: true,
        blockersFree: true
      },
      effects: {
        developmentStarted: true
      }
    });
    this.registerAction({
      id: "fill-gaps",
      name: "Fill Documentation Gaps",
      description: "Generate content to fill documentation gaps",
      cost: 2,
      preconditions: {
        hasSpecification: true
      },
      effects: {
        specCompleteness: 0.8,
        pendingGaps: []
      }
    });
    this.registerAction({
      id: "resolve-blockers",
      name: "Resolve Blockers",
      description: "Resolve blocking issues",
      cost: 4,
      preconditions: {
        blockersFree: false
      },
      effects: {
        blockersFree: true
      }
    });
  }
  /**
   * Register default goals
   */
  registerDefaultGoals() {
    this.registerGoal({
      id: "start-development",
      name: "Start Development",
      description: "Get the project ready to begin development",
      conditions: {
        taskDefined: true,
        developmentStarted: true
      },
      priority: 10
    });
    this.registerGoal({
      id: "complete-spec",
      name: "Complete Specification",
      description: "Ensure specification is complete with acceptance criteria",
      conditions: {
        hasSpecification: true,
        specCompleteness: 0.8,
        hasAcceptanceCriteria: true
      },
      priority: 8
    });
    this.registerGoal({
      id: "resolve-blockers",
      name: "Resolve All Blockers",
      description: "Clear all blocking issues",
      conditions: {
        blockersFree: true
      },
      priority: 9
    });
  }
  /**
   * Register an action
   *
   * @param action - Action definition to register
   */
  registerAction(action) {
    this.actions.set(action.id, action);
    logger.debug("Registered action", { actionId: action.id });
  }
  /**
   * Register a goal
   *
   * @param goal - Goal definition to register
   */
  registerGoal(goal) {
    this.goals.set(goal.id, goal);
    logger.debug("Registered goal", { goalId: goal.id });
  }
  /**
   * Get a registered action by ID
   *
   * @param actionId - Action identifier
   * @returns Action definition or undefined
   */
  getAction(actionId) {
    return this.actions.get(actionId);
  }
  /**
   * Get a registered goal by ID
   *
   * @param goalId - Goal identifier
   * @returns Goal definition or undefined
   */
  getGoal(goalId) {
    return this.goals.get(goalId);
  }
  /**
   * Get all registered actions
   *
   * @returns Array of action definitions
   */
  getActions() {
    return Array.from(this.actions.values());
  }
  /**
   * Get all registered goals
   *
   * @returns Array of goal definitions
   */
  getGoals() {
    return Array.from(this.goals.values());
  }
  /**
   * Create a plan to achieve a goal from the current state
   *
   * @param currentState - Current world state
   * @param goalId - Goal to achieve
   * @returns Plan to achieve the goal
   */
  createPlan(currentState, goalId) {
    const goal = this.goals.get(goalId);
    if (!goal) {
      return {
        goalId,
        actionIds: [],
        totalCost: Infinity,
        achievable: false,
        reason: `Unknown goal: ${goalId}`,
        createdAt: /* @__PURE__ */ new Date()
      };
    }
    const cacheKey = this.createCacheKey(currentState, goalId);
    if (this.config.enableCaching && this.planCache.has(cacheKey)) {
      const cached = this.planCache.get(cacheKey);
      logger.debug("Using cached plan", { goalId, cacheKey });
      return cached;
    }
    logger.debug("Creating plan", { goalId, currentState });
    if (this.isGoalSatisfied(currentState, goal)) {
      const plan2 = {
        goalId,
        actionIds: [],
        totalCost: 0,
        achievable: true,
        createdAt: /* @__PURE__ */ new Date()
      };
      this.cachePlan(cacheKey, plan2);
      return plan2;
    }
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
  aStarSearch(startState, goal) {
    const startTime = Date.now();
    const openSet = new PriorityQueue();
    const closedSet = /* @__PURE__ */ new Set();
    const startHeuristic = this.heuristic(startState, goal);
    const startNode = {
      state: { ...startState },
      gCost: 0,
      hCost: startHeuristic,
      fCost: startHeuristic,
      parent: null,
      action: null
    };
    openSet.enqueue(startNode, startNode.fCost);
    let iterations = 0;
    let nodesExplored = 0;
    while (!openSet.isEmpty() && iterations < this.config.maxIterations) {
      if (Date.now() - startTime > this.config.timeoutMs) {
        logger.warn("Planning timeout", { goalId: goal.id, iterations, nodesExplored });
        return {
          goalId: goal.id,
          actionIds: [],
          totalCost: Infinity,
          achievable: false,
          reason: "Planning timeout exceeded",
          createdAt: /* @__PURE__ */ new Date()
        };
      }
      iterations++;
      const current = openSet.dequeue();
      const stateKey = this.stateToKey(current.state);
      if (closedSet.has(stateKey)) {
        continue;
      }
      closedSet.add(stateKey);
      nodesExplored++;
      if (this.isGoalSatisfied(current.state, goal)) {
        const plan = this.reconstructPlan(current, goal);
        logger.debug("Plan found", {
          goalId: goal.id,
          iterations,
          nodesExplored,
          actionCount: plan.actionIds.length
        });
        return plan;
      }
      let pathLength = 0;
      let node = current;
      while (node) {
        pathLength++;
        node = node.parent;
      }
      if (pathLength >= this.config.maxPlanLength) {
        continue;
      }
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
        const newNode = {
          state: newState,
          gCost,
          hCost,
          fCost,
          parent: current,
          action
        };
        openSet.enqueue(newNode, fCost);
      }
    }
    logger.debug("No plan found", { goalId: goal.id, iterations, nodesExplored });
    return {
      goalId: goal.id,
      actionIds: [],
      totalCost: Infinity,
      achievable: false,
      reason: "No valid action sequence found",
      createdAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Reconstruct the plan from the goal node by following parent references
   *
   * @param goalNode - The node that reached the goal
   * @param goal - The goal definition
   * @returns Complete GOAP plan
   */
  reconstructPlan(goalNode, goal) {
    const actionIds = [];
    let current = goalNode;
    let totalCost = 0;
    while (current && current.action) {
      actionIds.unshift(current.action.id);
      totalCost += current.action.cost;
      current = current.parent;
    }
    const lengthPenalty = actionIds.length * 0.05;
    const costPenalty = totalCost * 0.01;
    const confidence = Math.max(0.3, 1 - lengthPenalty - costPenalty);
    return {
      goalId: goal.id,
      actionIds,
      totalCost,
      achievable: true,
      estimatedTimeMs: totalCost * 1e3,
      createdAt: /* @__PURE__ */ new Date(),
      confidence
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
  heuristic(state, goal) {
    if (this.customHeuristic) {
      return this.customHeuristic(state, goal.conditions);
    }
    let distance = 0;
    for (const [key, value] of Object.entries(goal.conditions)) {
      const currentValue = state[key];
      if (typeof value === "boolean") {
        if (currentValue !== value) {
          distance += 5;
        }
      } else if (typeof value === "number" && typeof currentValue === "number") {
        if (currentValue < value) {
          distance += (value - currentValue) * 10;
        }
      } else if (Array.isArray(value) && Array.isArray(currentValue)) {
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
  isGoalSatisfied(state, goal) {
    for (const [key, value] of Object.entries(goal.conditions)) {
      const currentValue = state[key];
      if (typeof value === "number" && typeof currentValue === "number") {
        if (currentValue < value) {
          return false;
        }
      } else if (Array.isArray(value) && Array.isArray(currentValue)) {
        if (value.length > 0 && currentValue.length > 0) {
          return false;
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
  canApply(action, state) {
    for (const [key, value] of Object.entries(action.preconditions)) {
      const currentValue = state[key];
      if (typeof value === "number" && typeof currentValue === "number") {
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
  applyAction(action, state) {
    const newState = { ...state };
    for (const [key, value] of Object.entries(action.effects)) {
      newState[key] = value;
    }
    return newState;
  }
  /**
   * Convert state to a cache key string
   */
  stateToKey(state) {
    const sortedKeys = Object.keys(state).sort();
    const values = sortedKeys.map((k) => `${k}:${JSON.stringify(state[k])}`);
    return values.join("|");
  }
  /**
   * Create cache key for a plan
   */
  createCacheKey(state, goalId) {
    return `${goalId}::${this.stateToKey(state)}`;
  }
  /**
   * Cache a plan
   */
  cachePlan(key, plan) {
    if (this.config.enableCaching) {
      this.planCache.set(key, plan);
    }
  }
  /**
   * Clear the plan cache
   */
  clearCache() {
    this.planCache.clear();
    logger.debug("Plan cache cleared");
  }
  /**
   * Execute a plan
   *
   * @param plan - Plan to execute
   * @param initialState - Initial world state
   * @returns Execution result
   */
  async executePlan(plan, initialState) {
    if (!plan.achievable) {
      return {
        success: false,
        finalState: initialState,
        completedSteps: [],
        error: plan.reason || "Plan is not achievable",
        executionTimeMs: 0
      };
    }
    const startTime = Date.now();
    let currentState = { ...initialState };
    const completedSteps = [];
    logger.info("Executing plan", {
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
          executionTimeMs: Date.now() - startTime
        };
      }
      if (!this.canApply(action, currentState)) {
        return {
          success: false,
          finalState: currentState,
          completedSteps,
          failedStep: actionId,
          error: `Preconditions not met for action: ${actionId}`,
          executionTimeMs: Date.now() - startTime
        };
      }
      try {
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
          executionTimeMs: Date.now() - startTime
        };
      }
    }
    logger.info("Plan execution completed", {
      goalId: plan.goalId,
      completedSteps: completedSteps.length
    });
    return {
      success: true,
      finalState: currentState,
      completedSteps,
      executionTimeMs: Date.now() - startTime
    };
  }
  /**
   * Evaluate readiness for development
   *
   * @param state - Current world state
   * @returns Readiness evaluation
   */
  evaluateReadiness(state) {
    const blockers = [];
    const recommendations = [];
    let score = 0;
    if (!state.hasSpecification) {
      blockers.push("No specification document found");
      recommendations.push("Create a specification document");
    } else {
      score += 0.2;
      if (state.specCompleteness < 0.5) {
        blockers.push("Specification is incomplete");
        recommendations.push("Complete the specification document");
      } else if (state.specCompleteness < 0.8) {
        recommendations.push("Consider improving specification completeness");
        score += 0.1;
      } else {
        score += 0.2;
      }
    }
    if (!state.hasAcceptanceCriteria) {
      blockers.push("No acceptance criteria defined");
      recommendations.push("Define acceptance criteria");
    } else {
      score += 0.2;
    }
    if (!state.blockersFree) {
      blockers.push("Blocking issues exist");
      recommendations.push("Resolve blocking issues");
    } else {
      score += 0.2;
    }
    if (state.pendingGaps.length > 0) {
      recommendations.push(`Address ${state.pendingGaps.length} documentation gaps`);
    } else {
      score += 0.1;
    }
    if (state.taskDefined) {
      score += 0.1;
    } else if (blockers.length === 0) {
      recommendations.push("Create a task from the specification");
    }
    return {
      score: Math.min(1, score),
      ready: blockers.length === 0 && score >= 0.7,
      blockers,
      recommendations,
      evaluatedAt: /* @__PURE__ */ new Date()
    };
  }
}
function createGOAPAdapter(config) {
  return new GOAPAdapter(config);
}
export {
  GOAPAdapter,
  createGOAPAdapter
};
//# sourceMappingURL=goap-adapter.js.map
