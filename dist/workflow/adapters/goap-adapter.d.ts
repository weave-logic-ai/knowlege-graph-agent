/**
 * GOAP Adapter
 *
 * Adapts the existing goal-planner agent for use with Workflow DevKit.
 * Provides A* search-based planning with OODA loop integration.
 *
 * @module workflow/adapters/goap-adapter
 */
import type { WorldState, GOAPAction, GOAPGoal, GOAPPlan, PlanExecutionResult, ReadinessEvaluation } from '../types.js';
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
/**
 * Default GOAP actions for knowledge graph workflows
 *
 * These actions represent common development workflow operations
 * and can be extended or replaced with custom actions.
 */
export declare const DEFAULT_GOAP_ACTIONS: GOAPAction[];
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
export declare class GOAPAdapter {
    private config;
    private actions;
    private goals;
    private planCache;
    private customHeuristic?;
    constructor(config?: GOAPAdapterConfig);
    /**
     * Register default actions for documentation workflows
     */
    private registerDefaultActions;
    /**
     * Register default goals
     */
    private registerDefaultGoals;
    /**
     * Register an action
     *
     * @param action - Action definition to register
     */
    registerAction(action: GOAPAction): void;
    /**
     * Register a goal
     *
     * @param goal - Goal definition to register
     */
    registerGoal(goal: GOAPGoal): void;
    /**
     * Get a registered action by ID
     *
     * @param actionId - Action identifier
     * @returns Action definition or undefined
     */
    getAction(actionId: string): GOAPAction | undefined;
    /**
     * Get a registered goal by ID
     *
     * @param goalId - Goal identifier
     * @returns Goal definition or undefined
     */
    getGoal(goalId: string): GOAPGoal | undefined;
    /**
     * Get all registered actions
     *
     * @returns Array of action definitions
     */
    getActions(): GOAPAction[];
    /**
     * Get all registered goals
     *
     * @returns Array of goal definitions
     */
    getGoals(): GOAPGoal[];
    /**
     * Create a plan to achieve a goal from the current state
     *
     * @param currentState - Current world state
     * @param goalId - Goal to achieve
     * @returns Plan to achieve the goal
     */
    createPlan(currentState: WorldState, goalId: string): GOAPPlan;
    /**
     * A* search algorithm for plan finding
     *
     * Uses a binary heap priority queue for efficient O(log n) operations.
     * Implements proper path reconstruction using parent node references.
     */
    private aStarSearch;
    /**
     * Reconstruct the plan from the goal node by following parent references
     *
     * @param goalNode - The node that reached the goal
     * @param goal - The goal definition
     * @returns Complete GOAP plan
     */
    private reconstructPlan;
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
    private heuristic;
    /**
     * Check if a goal is satisfied by the current state
     */
    private isGoalSatisfied;
    /**
     * Check if an action can be applied to a state
     */
    private canApply;
    /**
     * Apply an action to a state and return the new state
     */
    private applyAction;
    /**
     * Convert state to a cache key string
     */
    private stateToKey;
    /**
     * Create cache key for a plan
     */
    private createCacheKey;
    /**
     * Cache a plan
     */
    private cachePlan;
    /**
     * Clear the plan cache
     */
    clearCache(): void;
    /**
     * Execute a plan
     *
     * @param plan - Plan to execute
     * @param initialState - Initial world state
     * @returns Execution result
     */
    executePlan(plan: GOAPPlan, initialState: WorldState): Promise<PlanExecutionResult>;
    /**
     * Evaluate readiness for development
     *
     * @param state - Current world state
     * @returns Readiness evaluation
     */
    evaluateReadiness(state: WorldState): ReadinessEvaluation;
}
/**
 * Create a GOAP adapter instance
 *
 * @param config - Adapter configuration
 * @returns Configured GOAP adapter
 */
export declare function createGOAPAdapter(config?: GOAPAdapterConfig): GOAPAdapter;
//# sourceMappingURL=goap-adapter.d.ts.map