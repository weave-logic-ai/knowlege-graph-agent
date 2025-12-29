/**
 * Agent Equilibrium Selector (SPEC-006a)
 *
 * Implements Nash equilibrium-based agent selection to replace heuristic
 * capability-matching in CoordinatorAgent. Uses game-theoretic principles
 * where agents adjust their participation levels based on task fit and
 * competition from other agents with similar capabilities.
 *
 * @module equilibrium/agent-equilibrium
 */
import { AgentType } from '../agents/types.js';
import { type AgentInfo } from '../agents/planner-agent.js';
/**
 * Agent participation in a task allocation game
 */
export interface AgentParticipation {
    /** Agent identifier */
    agentId: string;
    /** Agent type */
    agentType: AgentType;
    /** Participation level (0-1), equilibrium outcome */
    participationLevel: number;
    /** Effectiveness score for the task (0-1) */
    effectivenessScore: number;
    /** Penalty for overlapping with other agents */
    redundancyPenalty: number;
    /** Net utility from participation */
    utility: number;
}
/**
 * Configuration for equilibrium computation
 */
export interface EquilibriumConfig {
    /** Learning rate for gradient updates (default: 0.1) */
    learningRate: number;
    /** Maximum iterations before stopping (default: 100) */
    maxIterations: number;
    /** Convergence threshold for participation changes (default: 0.001) */
    convergenceThreshold: number;
    /** Minimum participation level before collapsing to 0 (default: 0.01) */
    minParticipation: number;
}
/**
 * Task definition for equilibrium selection
 */
export interface Task {
    /** Unique task identifier */
    id: string;
    /** Task description */
    description: string;
    /** Required capabilities for the task */
    requiredCapabilities: string[];
    /** Task priority */
    priority: 'low' | 'medium' | 'high' | 'critical';
    /** Task complexity (0-1) */
    complexity: number;
}
/**
 * Equilibrium computation result
 */
export interface EquilibriumResult {
    /** Participating agents sorted by participation level */
    participants: AgentParticipation[];
    /** Number of iterations to converge */
    iterations: number;
    /** Whether equilibrium was reached */
    converged: boolean;
    /** Total utility at equilibrium */
    totalUtility: number;
}
/**
 * AgentEquilibriumSelector
 *
 * Computes Nash equilibrium for agent selection using iterative gradient
 * updates. Each agent adjusts its participation level based on:
 * - Effectiveness: How well the agent matches the task requirements
 * - Competition: Overlap with other participating agents
 * - Utility: Net benefit from participating
 *
 * Dominated agents (those with lower effectiveness and high overlap)
 * naturally collapse to zero participation, leaving only the most
 * suitable agents.
 *
 * @example
 * ```typescript
 * const selector = new AgentEquilibriumSelector();
 * const selected = await selector.selectTopAgents(task, agents, 3);
 * ```
 */
export declare class AgentEquilibriumSelector {
    private config;
    private participations;
    private iterationHistory;
    constructor(config?: Partial<EquilibriumConfig>);
    /**
     * Find Nash equilibrium for agent selection
     *
     * Each agent adjusts participation based on task match and competition.
     * Returns agents with positive participation, sorted by level.
     *
     * @param task - The task to allocate
     * @param availableAgents - Pool of available agents
     * @returns Agents with positive participation at equilibrium
     */
    findEquilibrium(task: Task, availableAgents: AgentInfo[]): Promise<AgentParticipation[]>;
    /**
     * Select top N agents based on equilibrium
     *
     * @param task - The task to allocate
     * @param availableAgents - Pool of available agents
     * @param n - Maximum number of agents to select
     * @returns Selected agents (may be less than n if not enough qualify)
     */
    selectTopAgents(task: Task, availableAgents: AgentInfo[], n: number): Promise<AgentInfo[]>;
    /**
     * Get iteration history for analysis/debugging
     */
    getIterationHistory(): Array<{
        iteration: number;
        totalUtility: number;
    }>;
    /**
     * Get current participation state
     */
    getParticipations(): Map<string, AgentParticipation>;
    /**
     * Get configuration
     */
    getConfig(): EquilibriumConfig;
    /**
     * Initialize participation levels uniformly across agents
     */
    private initializeParticipations;
    /**
     * Update a single agent's participation based on game dynamics
     */
    private updateAgentParticipation;
    /**
     * Normalize participation levels to sum to at most 1
     * This prevents runaway accumulation
     */
    private normalizeParticipations;
    /**
     * Calculate how effective an agent is for a given task
     *
     * Combines:
     * - Capability match (70% weight)
     * - Type boost for task keywords (30% weight)
     */
    calculateEffectiveness(agent: AgentInfo, task: Task): number;
    /**
     * Get type-based boost for matching task keywords
     */
    getTypeBoost(agentType: AgentType, task: Task): number;
    /**
     * Calculate competition pressure from other agents
     *
     * Competition increases with:
     * - Number of other agents with overlapping capabilities
     * - Participation levels of overlapping agents
     */
    calculateCompetition(agent: AgentInfo, allAgents: AgentInfo[]): number;
    /**
     * Calculate capability overlap between two agents
     *
     * Returns a value from 0 (no overlap) to 1 (complete overlap)
     */
    capabilityOverlap(a: AgentInfo, b: AgentInfo): number;
    /**
     * Create snapshot of current participation levels
     */
    private snapshotParticipations;
    /**
     * Check if participation levels have converged
     */
    private hasConverged;
    /**
     * Calculate total utility across all agents
     */
    calculateTotalUtility(): number;
}
/**
 * Create a new AgentEquilibriumSelector with optional configuration
 */
export declare function createAgentEquilibriumSelector(config?: Partial<EquilibriumConfig>): AgentEquilibriumSelector;
/**
 * Create a task for equilibrium selection
 */
export declare function createEquilibriumTask(id: string, description: string, options?: {
    requiredCapabilities?: string[];
    priority?: 'low' | 'medium' | 'high' | 'critical';
    complexity?: number;
}): Task;
//# sourceMappingURL=agent-equilibrium.d.ts.map