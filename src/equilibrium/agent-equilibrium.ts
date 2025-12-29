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

// ============================================================================
// Types and Interfaces
// ============================================================================

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

// ============================================================================
// Agent Equilibrium Selector
// ============================================================================

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
export class AgentEquilibriumSelector {
  private config: EquilibriumConfig;
  private participations: Map<string, AgentParticipation>;
  private iterationHistory: Array<{ iteration: number; totalUtility: number }>;

  constructor(config: Partial<EquilibriumConfig> = {}) {
    this.config = {
      learningRate: 0.1,
      maxIterations: 100,
      convergenceThreshold: 0.001,
      minParticipation: 0.01,
      ...config,
    };
    this.participations = new Map();
    this.iterationHistory = [];
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

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
  async findEquilibrium(
    task: Task,
    availableAgents: AgentInfo[]
  ): Promise<AgentParticipation[]> {
    // Reset state for new computation
    this.iterationHistory = [];

    // Handle edge cases
    if (availableAgents.length === 0) {
      return [];
    }

    if (availableAgents.length === 1) {
      // Single agent case - no competition
      const agent = availableAgents[0];
      const effectiveness = this.calculateEffectiveness(agent, task);
      const participation: AgentParticipation = {
        agentId: agent.id,
        agentType: agent.type,
        participationLevel: 1.0,
        effectivenessScore: effectiveness,
        redundancyPenalty: 0,
        utility: effectiveness,
      };
      this.participations.set(agent.id, participation);
      return [participation];
    }

    // 1. Initialize participation levels uniformly
    this.initializeParticipations(availableAgents, task);

    // 2. Iterate until convergence or max iterations
    let converged = false;
    let iteration = 0;

    for (iteration = 0; iteration < this.config.maxIterations; iteration++) {
      const prevState = this.snapshotParticipations();

      // Update each agent's participation
      for (const agent of availableAgents) {
        this.updateAgentParticipation(agent, task, availableAgents);
      }

      // Normalize participation levels to prevent runaway values
      this.normalizeParticipations();

      // Check convergence
      if (this.hasConverged(prevState)) {
        converged = true;
        break;
      }

      // Record history
      this.iterationHistory.push({
        iteration,
        totalUtility: this.calculateTotalUtility(),
      });
    }

    // Log convergence info
    if (!converged) {
      console.debug(
        `Equilibrium did not converge after ${this.config.maxIterations} iterations`
      );
    }

    // 3. Return agents with positive participation, sorted by level
    return [...this.participations.values()]
      .filter(p => p.participationLevel > 0)
      .sort((a, b) => b.participationLevel - a.participationLevel);
  }

  /**
   * Select top N agents based on equilibrium
   *
   * @param task - The task to allocate
   * @param availableAgents - Pool of available agents
   * @param n - Maximum number of agents to select
   * @returns Selected agents (may be less than n if not enough qualify)
   */
  async selectTopAgents(
    task: Task,
    availableAgents: AgentInfo[],
    n: number
  ): Promise<AgentInfo[]> {
    const equilibrium = await this.findEquilibrium(task, availableAgents);
    return equilibrium
      .slice(0, n)
      .map(p => availableAgents.find(a => a.id === p.agentId)!)
      .filter(Boolean);
  }

  /**
   * Get iteration history for analysis/debugging
   */
  getIterationHistory(): Array<{ iteration: number; totalUtility: number }> {
    return [...this.iterationHistory];
  }

  /**
   * Get current participation state
   */
  getParticipations(): Map<string, AgentParticipation> {
    return new Map(this.participations);
  }

  /**
   * Get configuration
   */
  getConfig(): EquilibriumConfig {
    return { ...this.config };
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize participation levels uniformly across agents
   */
  private initializeParticipations(agents: AgentInfo[], task: Task): void {
    this.participations.clear();
    const uniformLevel = 1.0 / agents.length;

    for (const agent of agents) {
      const effectiveness = this.calculateEffectiveness(agent, task);
      this.participations.set(agent.id, {
        agentId: agent.id,
        agentType: agent.type,
        participationLevel: uniformLevel,
        effectivenessScore: effectiveness,
        redundancyPenalty: 0,
        utility: 0,
      });
    }
  }

  // ==========================================================================
  // Gradient Update
  // ==========================================================================

  /**
   * Update a single agent's participation based on game dynamics
   */
  private updateAgentParticipation(
    agent: AgentInfo,
    task: Task,
    allAgents: AgentInfo[]
  ): void {
    const participation = this.participations.get(agent.id);
    if (!participation) return;

    // Calculate utility: effectiveness * participation (returns from participating)
    const utility =
      participation.effectivenessScore * participation.participationLevel;

    // Calculate competition from similar agents (costs from competition)
    const competition = this.calculateCompetition(agent, allAgents);

    // Calculate redundancy penalty
    participation.redundancyPenalty = competition * 0.5;

    // Net utility (marginal benefit of participating)
    const netUtility = utility - participation.redundancyPenalty;
    participation.utility = netUtility;

    // Gradient update toward equilibrium
    // Agent increases participation if net utility exceeds competition
    // Agent decreases participation if competition dominates
    const delta = this.config.learningRate * (netUtility - competition);

    participation.participationLevel = Math.max(
      0,
      Math.min(1, participation.participationLevel + delta)
    );

    // Dominated agents collapse to zero (below threshold)
    if (participation.participationLevel < this.config.minParticipation) {
      participation.participationLevel = 0;
    }
  }

  /**
   * Normalize participation levels to sum to at most 1
   * This prevents runaway accumulation
   */
  private normalizeParticipations(): void {
    const total = [...this.participations.values()].reduce(
      (sum, p) => sum + p.participationLevel,
      0
    );

    if (total > 1) {
      for (const p of this.participations.values()) {
        p.participationLevel = p.participationLevel / total;
      }
    }
  }

  // ==========================================================================
  // Effectiveness Calculation
  // ==========================================================================

  /**
   * Calculate how effective an agent is for a given task
   *
   * Combines:
   * - Capability match (70% weight)
   * - Type boost for task keywords (30% weight)
   */
  calculateEffectiveness(agent: AgentInfo, task: Task): number {
    // Score based on capability match
    const requiredCaps = new Set(task.requiredCapabilities);
    const agentCaps = new Set(agent.capabilities || []);

    let matchCount = 0;
    for (const cap of requiredCaps) {
      if (agentCaps.has(cap)) matchCount++;
    }

    const capabilityMatch =
      requiredCaps.size > 0 ? matchCount / requiredCaps.size : 0.5;

    // Boost for agent type matching task keywords
    const typeBoost = this.getTypeBoost(agent.type, task);

    // Combine with weights
    return capabilityMatch * 0.7 + typeBoost * 0.3;
  }

  /**
   * Get type-based boost for matching task keywords
   */
  getTypeBoost(agentType: AgentType, task: Task): number {
    const desc = task.description.toLowerCase();

    // Map keywords to relevant agent types
    const boostMap: Record<string, AgentType[]> = {
      review: [AgentType.REVIEWER],
      test: [AgentType.TESTER],
      code: [AgentType.CODER],
      implement: [AgentType.CODER],
      document: [AgentType.DOCUMENTER],
      plan: [AgentType.PLANNER],
      optimize: [AgentType.OPTIMIZER],
      research: [AgentType.RESEARCHER],
      analyze: [AgentType.ANALYST],
      architect: [AgentType.ARCHITECT],
      design: [AgentType.ARCHITECT],
      coordinate: [AgentType.COORDINATOR],
    };

    for (const [keyword, types] of Object.entries(boostMap)) {
      if (desc.includes(keyword) && types.includes(agentType)) {
        return 1.0;
      }
    }

    // Default low boost for non-matching types
    return 0.3;
  }

  // ==========================================================================
  // Competition Calculation
  // ==========================================================================

  /**
   * Calculate competition pressure from other agents
   *
   * Competition increases with:
   * - Number of other agents with overlapping capabilities
   * - Participation levels of overlapping agents
   */
  calculateCompetition(agent: AgentInfo, allAgents: AgentInfo[]): number {
    let competition = 0;

    for (const other of allAgents) {
      if (other.id === agent.id) continue;

      const overlap = this.capabilityOverlap(agent, other);
      const otherParticipation = this.participations.get(other.id);
      if (otherParticipation) {
        competition += overlap * otherParticipation.participationLevel;
      }
    }

    return competition;
  }

  /**
   * Calculate capability overlap between two agents
   *
   * Returns a value from 0 (no overlap) to 1 (complete overlap)
   */
  capabilityOverlap(a: AgentInfo, b: AgentInfo): number {
    const capsA = new Set(a.capabilities || []);
    const capsB = new Set(b.capabilities || []);

    if (capsA.size === 0 || capsB.size === 0) {
      // No capabilities defined - use type similarity as proxy
      return a.type === b.type ? 0.8 : 0.2;
    }

    let overlap = 0;
    for (const cap of capsA) {
      if (capsB.has(cap)) overlap++;
    }

    // Jaccard-like coefficient using max instead of union
    return overlap / Math.max(capsA.size, capsB.size);
  }

  // ==========================================================================
  // Convergence Detection
  // ==========================================================================

  /**
   * Create snapshot of current participation levels
   */
  private snapshotParticipations(): Map<string, number> {
    const snapshot = new Map<string, number>();
    for (const [id, p] of this.participations) {
      snapshot.set(id, p.participationLevel);
    }
    return snapshot;
  }

  /**
   * Check if participation levels have converged
   */
  private hasConverged(prevState: Map<string, number>): boolean {
    let maxDelta = 0;

    for (const [id, p] of this.participations) {
      const prev = prevState.get(id) ?? 0;
      const delta = Math.abs(p.participationLevel - prev);
      maxDelta = Math.max(maxDelta, delta);
    }

    return maxDelta < this.config.convergenceThreshold;
  }

  // ==========================================================================
  // Utility Calculation
  // ==========================================================================

  /**
   * Calculate total utility across all agents
   */
  calculateTotalUtility(): number {
    return [...this.participations.values()].reduce(
      (sum, p) => sum + p.utility,
      0
    );
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new AgentEquilibriumSelector with optional configuration
 */
export function createAgentEquilibriumSelector(
  config?: Partial<EquilibriumConfig>
): AgentEquilibriumSelector {
  return new AgentEquilibriumSelector(config);
}

/**
 * Create a task for equilibrium selection
 */
export function createEquilibriumTask(
  id: string,
  description: string,
  options: {
    requiredCapabilities?: string[];
    priority?: 'low' | 'medium' | 'high' | 'critical';
    complexity?: number;
  } = {}
): Task {
  return {
    id,
    description,
    requiredCapabilities: options.requiredCapabilities ?? [],
    priority: options.priority ?? 'medium',
    complexity: options.complexity ?? 0.5,
  };
}
