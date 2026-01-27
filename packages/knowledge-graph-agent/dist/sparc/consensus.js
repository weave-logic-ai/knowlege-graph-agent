import { createLogger } from "../utils/logger.js";
const logger = createLogger("consensus");
class ConsensusBuilder {
  options;
  sessions = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    this.options = {
      defaultThreshold: 0.67,
      defaultTimeout: 6e4,
      method: "majority",
      ...options
    };
  }
  /**
   * Create a new consensus session
   */
  createSession(request) {
    const sessionId = `consensus_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const session = {
      id: sessionId,
      topic: request.topic,
      options: request.options,
      votes: [],
      participants: request.participants,
      threshold: request.threshold || this.options.defaultThreshold,
      method: this.options.method,
      status: "pending",
      startedAt: /* @__PURE__ */ new Date(),
      timeout: request.timeout || this.options.defaultTimeout
    };
    this.sessions.set(sessionId, session);
    logger.info("Created consensus session", {
      sessionId,
      topic: request.topic,
      participants: request.participants.length,
      threshold: session.threshold
    });
    return sessionId;
  }
  /**
   * Submit a vote for a consensus session
   */
  submitVote(sessionId, vote) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.warn("Consensus session not found", { sessionId });
      return false;
    }
    if (session.status === "completed" || session.status === "failed") {
      logger.warn("Cannot vote on completed session", { sessionId, status: session.status });
      return false;
    }
    if (!session.participants.includes(vote.agent)) {
      logger.warn("Agent not a participant", { sessionId, agent: vote.agent });
      return false;
    }
    const existingVote = session.votes.find((v) => v.agent === vote.agent);
    if (existingVote) {
      logger.warn("Agent already voted", { sessionId, agent: vote.agent });
      return false;
    }
    if (!session.options.find((o) => o.id === vote.option)) {
      logger.warn("Invalid option", { sessionId, option: vote.option });
      return false;
    }
    session.votes.push(vote);
    session.status = "voting";
    logger.info("Vote submitted", {
      sessionId,
      agent: vote.agent,
      option: vote.option,
      confidence: vote.confidence
    });
    return true;
  }
  /**
   * Calculate consensus result
   */
  calculateResult(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Consensus session not found: ${sessionId}`);
    }
    const result = this.evaluateConsensus(session);
    session.status = result.achieved ? "completed" : "failed";
    logger.info("Consensus calculated", {
      sessionId,
      achieved: result.achieved,
      selectedOption: result.selectedOption
    });
    return result;
  }
  /**
   * Evaluate consensus based on method
   */
  evaluateConsensus(session) {
    const { votes, options, threshold, method } = session;
    if (votes.length === 0) {
      return {
        achieved: false,
        votes: [],
        rationale: "No votes received"
      };
    }
    const voteCounts = /* @__PURE__ */ new Map();
    const weightedCounts = /* @__PURE__ */ new Map();
    for (const option of options) {
      voteCounts.set(option.id, 0);
      weightedCounts.set(option.id, 0);
    }
    for (const vote of votes) {
      voteCounts.set(vote.option, (voteCounts.get(vote.option) || 0) + 1);
      const weight = vote.weight || vote.confidence;
      weightedCounts.set(vote.option, (weightedCounts.get(vote.option) || 0) + weight);
    }
    let result;
    switch (method) {
      case "unanimous":
        result = this.evaluateUnanimous(votes, options, voteCounts);
        break;
      case "weighted":
        result = this.evaluateWeighted(votes, options, weightedCounts, threshold);
        break;
      case "expert":
        result = this.evaluateExpert(votes, options);
        break;
      case "majority":
      default:
        result = this.evaluateMajority(votes, options, voteCounts, threshold);
        break;
    }
    return result;
  }
  /**
   * Evaluate unanimous consensus
   */
  evaluateUnanimous(votes, options, voteCounts) {
    const totalVotes = votes.length;
    for (const [optionId, count] of voteCounts.entries()) {
      if (count === totalVotes) {
        const option = options.find((o) => o.id === optionId);
        return {
          achieved: true,
          selectedOption: optionId,
          votes: votes.map((v) => ({
            agent: v.agent,
            option: v.option,
            confidence: v.confidence,
            reasoning: v.reasoning
          })),
          rationale: `Unanimous consensus achieved for "${option?.description}"`
        };
      }
    }
    const mainOption = this.getLeadingOption(voteCounts);
    const dissent = votes.filter((v) => v.option !== mainOption).map((v) => `${v.agent}: ${v.reasoning}`);
    return {
      achieved: false,
      votes: votes.map((v) => ({
        agent: v.agent,
        option: v.option,
        confidence: v.confidence,
        reasoning: v.reasoning
      })),
      rationale: "Unanimous consensus not achieved",
      dissent
    };
  }
  /**
   * Evaluate majority consensus
   */
  evaluateMajority(votes, options, voteCounts, threshold) {
    const totalVotes = votes.length;
    for (const [optionId, count] of voteCounts.entries()) {
      const percentage = count / totalVotes;
      if (percentage >= threshold) {
        const option = options.find((o) => o.id === optionId);
        const dissent = votes.filter((v) => v.option !== optionId).map((v) => `${v.agent}: ${v.reasoning}`);
        return {
          achieved: true,
          selectedOption: optionId,
          votes: votes.map((v) => ({
            agent: v.agent,
            option: v.option,
            confidence: v.confidence,
            reasoning: v.reasoning
          })),
          rationale: `Majority consensus (${(percentage * 100).toFixed(1)}%) achieved for "${option?.description}"`,
          dissent: dissent.length > 0 ? dissent : void 0
        };
      }
    }
    return {
      achieved: false,
      votes: votes.map((v) => ({
        agent: v.agent,
        option: v.option,
        confidence: v.confidence,
        reasoning: v.reasoning
      })),
      rationale: `No option reached threshold of ${(threshold * 100).toFixed(1)}%`
    };
  }
  /**
   * Evaluate weighted consensus
   */
  evaluateWeighted(votes, options, weightedCounts, threshold) {
    const totalWeight = Array.from(weightedCounts.values()).reduce((a, b) => a + b, 0);
    for (const [optionId, weight] of weightedCounts.entries()) {
      const percentage = weight / totalWeight;
      if (percentage >= threshold) {
        const option = options.find((o) => o.id === optionId);
        const dissent = votes.filter((v) => v.option !== optionId).map((v) => `${v.agent}: ${v.reasoning}`);
        return {
          achieved: true,
          selectedOption: optionId,
          votes: votes.map((v) => ({
            agent: v.agent,
            option: v.option,
            confidence: v.confidence,
            reasoning: v.reasoning
          })),
          rationale: `Weighted consensus (${(percentage * 100).toFixed(1)}%) achieved for "${option?.description}"`,
          dissent: dissent.length > 0 ? dissent : void 0
        };
      }
    }
    return {
      achieved: false,
      votes: votes.map((v) => ({
        agent: v.agent,
        option: v.option,
        confidence: v.confidence,
        reasoning: v.reasoning
      })),
      rationale: `No option reached weighted threshold of ${(threshold * 100).toFixed(1)}%`
    };
  }
  /**
   * Evaluate expert consensus (highest confidence vote wins)
   */
  evaluateExpert(votes, options) {
    const sortedVotes = [...votes].sort((a, b) => {
      const aScore = a.confidence * (a.weight || 1);
      const bScore = b.confidence * (b.weight || 1);
      return bScore - aScore;
    });
    const topVote = sortedVotes[0];
    const option = options.find((o) => o.id === topVote.option);
    const dissent = votes.filter((v) => v.option !== topVote.option).map((v) => `${v.agent}: ${v.reasoning}`);
    return {
      achieved: true,
      selectedOption: topVote.option,
      votes: votes.map((v) => ({
        agent: v.agent,
        option: v.option,
        confidence: v.confidence,
        reasoning: v.reasoning
      })),
      rationale: `Expert consensus: ${topVote.agent} (confidence: ${topVote.confidence}) selected "${option?.description}"`,
      dissent: dissent.length > 0 ? dissent : void 0
    };
  }
  /**
   * Get leading option from vote counts
   */
  getLeadingOption(voteCounts) {
    let maxCount = 0;
    let leadingOption = "";
    for (const [optionId, count] of voteCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        leadingOption = optionId;
      }
    }
    return leadingOption;
  }
  /**
   * Check if session has timed out
   */
  isSessionTimedOut(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return true;
    const elapsed = Date.now() - session.startedAt.getTime();
    return elapsed > session.timeout;
  }
  /**
   * Get session status
   */
  getSessionStatus(sessionId) {
    return this.sessions.get(sessionId);
  }
  /**
   * Check if all participants have voted
   */
  allParticipantsVoted(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    return session.votes.length >= session.participants.length;
  }
  /**
   * Convert result to ConsensusInfo for decision log
   */
  toConsensusInfo(sessionId, result, required = true) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return {
      required,
      achieved: result.achieved,
      participants: session.participants,
      votes: result.votes.map((v) => ({
        agent: v.agent,
        vote: v.option === result.selectedOption ? "agree" : "disagree",
        reason: v.reasoning
      })),
      method: session.method,
      outcome: result.rationale
    };
  }
  /**
   * Determine if consensus is needed based on confidence
   */
  static needsConsensus(confidence) {
    return confidence === "low" || confidence === "uncertain";
  }
  /**
   * Get recommended threshold based on confidence
   */
  static getRecommendedThreshold(confidence) {
    switch (confidence) {
      case "uncertain":
        return 0.8;
      // Need strong agreement for uncertain decisions
      case "low":
        return 0.67;
      // Standard majority
      case "medium":
        return 0.6;
      case "high":
        return 0.5;
      // Simple majority OK for high confidence
      default:
        return 0.67;
    }
  }
}
function createConsensusBuilder(options) {
  return new ConsensusBuilder(options);
}
export {
  ConsensusBuilder,
  createConsensusBuilder
};
//# sourceMappingURL=consensus.js.map
