import { AgentType } from "../agents/types.js";
class AgentEquilibriumSelector {
  config;
  participations;
  iterationHistory;
  constructor(config = {}) {
    this.config = {
      learningRate: 0.1,
      maxIterations: 100,
      convergenceThreshold: 1e-3,
      minParticipation: 0.01,
      ...config
    };
    this.participations = /* @__PURE__ */ new Map();
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
  async findEquilibrium(task, availableAgents) {
    this.iterationHistory = [];
    if (availableAgents.length === 0) {
      return [];
    }
    if (availableAgents.length === 1) {
      const agent = availableAgents[0];
      const effectiveness = this.calculateEffectiveness(agent, task);
      const participation = {
        agentId: agent.id,
        agentType: agent.type,
        participationLevel: 1,
        effectivenessScore: effectiveness,
        redundancyPenalty: 0,
        utility: effectiveness
      };
      this.participations.set(agent.id, participation);
      return [participation];
    }
    this.initializeParticipations(availableAgents, task);
    let converged = false;
    let iteration = 0;
    for (iteration = 0; iteration < this.config.maxIterations; iteration++) {
      const prevState = this.snapshotParticipations();
      for (const agent of availableAgents) {
        this.updateAgentParticipation(agent, task, availableAgents);
      }
      this.normalizeParticipations();
      if (this.hasConverged(prevState)) {
        converged = true;
        break;
      }
      this.iterationHistory.push({
        iteration,
        totalUtility: this.calculateTotalUtility()
      });
    }
    if (!converged) {
      console.debug(
        `Equilibrium did not converge after ${this.config.maxIterations} iterations`
      );
    }
    return [...this.participations.values()].filter((p) => p.participationLevel > 0).sort((a, b) => b.participationLevel - a.participationLevel);
  }
  /**
   * Select top N agents based on equilibrium
   *
   * @param task - The task to allocate
   * @param availableAgents - Pool of available agents
   * @param n - Maximum number of agents to select
   * @returns Selected agents (may be less than n if not enough qualify)
   */
  async selectTopAgents(task, availableAgents, n) {
    const equilibrium = await this.findEquilibrium(task, availableAgents);
    return equilibrium.slice(0, n).map((p) => availableAgents.find((a) => a.id === p.agentId)).filter(Boolean);
  }
  /**
   * Get iteration history for analysis/debugging
   */
  getIterationHistory() {
    return [...this.iterationHistory];
  }
  /**
   * Get current participation state
   */
  getParticipations() {
    return new Map(this.participations);
  }
  /**
   * Get configuration
   */
  getConfig() {
    return { ...this.config };
  }
  // ==========================================================================
  // Initialization
  // ==========================================================================
  /**
   * Initialize participation levels uniformly across agents
   */
  initializeParticipations(agents, task) {
    this.participations.clear();
    const uniformLevel = 1 / agents.length;
    for (const agent of agents) {
      const effectiveness = this.calculateEffectiveness(agent, task);
      this.participations.set(agent.id, {
        agentId: agent.id,
        agentType: agent.type,
        participationLevel: uniformLevel,
        effectivenessScore: effectiveness,
        redundancyPenalty: 0,
        utility: 0
      });
    }
  }
  // ==========================================================================
  // Gradient Update
  // ==========================================================================
  /**
   * Update a single agent's participation based on game dynamics
   */
  updateAgentParticipation(agent, task, allAgents) {
    const participation = this.participations.get(agent.id);
    if (!participation) return;
    const utility = participation.effectivenessScore * participation.participationLevel;
    const competition = this.calculateCompetition(agent, allAgents);
    participation.redundancyPenalty = competition * 0.5;
    const netUtility = utility - participation.redundancyPenalty;
    participation.utility = netUtility;
    const delta = this.config.learningRate * (netUtility - competition);
    participation.participationLevel = Math.max(
      0,
      Math.min(1, participation.participationLevel + delta)
    );
    if (participation.participationLevel < this.config.minParticipation) {
      participation.participationLevel = 0;
    }
  }
  /**
   * Normalize participation levels to sum to at most 1
   * This prevents runaway accumulation
   */
  normalizeParticipations() {
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
  calculateEffectiveness(agent, task) {
    const requiredCaps = new Set(task.requiredCapabilities);
    const agentCaps = new Set(agent.capabilities || []);
    let matchCount = 0;
    for (const cap of requiredCaps) {
      if (agentCaps.has(cap)) matchCount++;
    }
    const capabilityMatch = requiredCaps.size > 0 ? matchCount / requiredCaps.size : 0.5;
    const typeBoost = this.getTypeBoost(agent.type, task);
    return capabilityMatch * 0.7 + typeBoost * 0.3;
  }
  /**
   * Get type-based boost for matching task keywords
   */
  getTypeBoost(agentType, task) {
    const desc = task.description.toLowerCase();
    const boostMap = {
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
      coordinate: [AgentType.COORDINATOR]
    };
    for (const [keyword, types] of Object.entries(boostMap)) {
      if (desc.includes(keyword) && types.includes(agentType)) {
        return 1;
      }
    }
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
  calculateCompetition(agent, allAgents) {
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
  capabilityOverlap(a, b) {
    const capsA = new Set(a.capabilities || []);
    const capsB = new Set(b.capabilities || []);
    if (capsA.size === 0 || capsB.size === 0) {
      return a.type === b.type ? 0.8 : 0.2;
    }
    let overlap = 0;
    for (const cap of capsA) {
      if (capsB.has(cap)) overlap++;
    }
    return overlap / Math.max(capsA.size, capsB.size);
  }
  // ==========================================================================
  // Convergence Detection
  // ==========================================================================
  /**
   * Create snapshot of current participation levels
   */
  snapshotParticipations() {
    const snapshot = /* @__PURE__ */ new Map();
    for (const [id, p] of this.participations) {
      snapshot.set(id, p.participationLevel);
    }
    return snapshot;
  }
  /**
   * Check if participation levels have converged
   */
  hasConverged(prevState) {
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
  calculateTotalUtility() {
    return [...this.participations.values()].reduce(
      (sum, p) => sum + p.utility,
      0
    );
  }
}
function createAgentEquilibriumSelector(config) {
  return new AgentEquilibriumSelector(config);
}
function createEquilibriumTask(id, description, options = {}) {
  return {
    id,
    description,
    requiredCapabilities: options.requiredCapabilities ?? [],
    priority: options.priority ?? "medium",
    complexity: options.complexity ?? 0.5
  };
}
export {
  AgentEquilibriumSelector,
  createAgentEquilibriumSelector,
  createEquilibriumTask
};
//# sourceMappingURL=agent-equilibrium.js.map
