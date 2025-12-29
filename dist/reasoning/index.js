class DecisionTracker {
  decisions = /* @__PURE__ */ new Map();
  chains = /* @__PURE__ */ new Map();
  currentChainId;
  startChain(metadata) {
    const id = `chain-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    this.chains.set(id, {
      id,
      decisions: [],
      confidence: "medium",
      totalDuration: 0,
      metadata
    });
    this.currentChainId = id;
    return id;
  }
  endChain(conclusion) {
    if (!this.currentChainId) return void 0;
    const chain = this.chains.get(this.currentChainId);
    if (chain) {
      chain.conclusion = conclusion;
      chain.totalDuration = chain.decisions.reduce((sum, d) => sum + d.duration, 0);
      chain.confidence = this.calculateChainConfidence(chain);
    }
    this.currentChainId = void 0;
    return chain;
  }
  recordDecision(type, context, outcome, duration, metadata) {
    const id = `decision-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const decision = {
      id,
      type,
      context: {
        ...context,
        id: `ctx-${id}`,
        timestamp: /* @__PURE__ */ new Date()
      },
      outcome,
      duration,
      metadata
    };
    this.decisions.set(id, decision);
    if (this.currentChainId) {
      const chain = this.chains.get(this.currentChainId);
      if (chain) {
        chain.decisions.push(decision);
      }
    }
    return decision;
  }
  getDecision(id) {
    return this.decisions.get(id);
  }
  getChain(id) {
    return this.chains.get(id);
  }
  getAllDecisions() {
    return Array.from(this.decisions.values());
  }
  getAllChains() {
    return Array.from(this.chains.values());
  }
  getDecisionsByType(type) {
    return Array.from(this.decisions.values()).filter((d) => d.type === type);
  }
  getRecentDecisions(limit = 10) {
    return Array.from(this.decisions.values()).sort((a, b) => b.context.timestamp.getTime() - a.context.timestamp.getTime()).slice(0, limit);
  }
  getStatistics() {
    const decisions = Array.from(this.decisions.values());
    const byType = {};
    const byConfidence = {};
    let totalDuration = 0;
    for (const decision of decisions) {
      byType[decision.type] = (byType[decision.type] || 0) + 1;
      byConfidence[decision.outcome.confidence] = (byConfidence[decision.outcome.confidence] || 0) + 1;
      totalDuration += decision.duration;
    }
    return {
      totalDecisions: decisions.length,
      totalChains: this.chains.size,
      averageDuration: decisions.length > 0 ? totalDuration / decisions.length : 0,
      byType,
      byConfidence
    };
  }
  export() {
    return {
      decisions: Array.from(this.decisions.values()),
      chains: Array.from(this.chains.values()),
      exportedAt: /* @__PURE__ */ new Date()
    };
  }
  clear() {
    this.decisions.clear();
    this.chains.clear();
    this.currentChainId = void 0;
  }
  calculateChainConfidence(chain) {
    if (chain.decisions.length === 0) return "medium";
    const avgScore = chain.decisions.reduce((sum, d) => sum + d.outcome.confidenceScore, 0) / chain.decisions.length;
    if (avgScore >= 0.9) return "very_high";
    if (avgScore >= 0.7) return "high";
    if (avgScore >= 0.5) return "medium";
    if (avgScore >= 0.3) return "low";
    return "very_low";
  }
}
let defaultTracker;
function createDecisionTracker() {
  return new DecisionTracker();
}
function getDecisionTracker() {
  if (!defaultTracker) {
    defaultTracker = new DecisionTracker();
  }
  return defaultTracker;
}
export {
  DecisionTracker,
  createDecisionTracker,
  getDecisionTracker
};
//# sourceMappingURL=index.js.map
