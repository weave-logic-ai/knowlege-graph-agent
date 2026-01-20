/**
 * Consensus Builder
 *
 * Builds consensus among multiple agents when confidence is low.
 * Coordinates voting, discussion, and final decision making.
 *
 * @module sparc/consensus
 */

import { createLogger } from '../utils/index.js';
import type {
  ConsensusInfo,
  ConsensusRequest,
  ConsensusResult,
  ConfidenceLevel,
} from './types.js';

const logger = createLogger('consensus');

/**
 * Consensus builder options
 */
export interface ConsensusBuilderOptions {
  /** Default threshold for consensus (0-1) */
  defaultThreshold?: number;
  /** Default timeout in ms */
  defaultTimeout?: number;
  /** Consensus method */
  method?: 'majority' | 'unanimous' | 'weighted' | 'expert';
}

/**
 * Agent vote
 */
export interface AgentVote {
  /** Agent identifier */
  agent: string;
  /** Selected option ID */
  option: string;
  /** Confidence in vote (0-1) */
  confidence: number;
  /** Reasoning for vote */
  reasoning: string;
  /** Weight (for weighted consensus) */
  weight?: number;
}

/**
 * Consensus option
 */
export interface ConsensusOption {
  /** Option ID */
  id: string;
  /** Option description */
  description: string;
  /** Pros */
  pros: string[];
  /** Cons */
  cons: string[];
}

/**
 * Consensus session state
 */
interface ConsensusSession {
  /** Session ID */
  id: string;
  /** Topic */
  topic: string;
  /** Options */
  options: ConsensusOption[];
  /** Votes collected */
  votes: AgentVote[];
  /** Participants expected */
  participants: string[];
  /** Threshold required */
  threshold: number;
  /** Method */
  method: 'majority' | 'unanimous' | 'weighted' | 'expert';
  /** Status */
  status: 'pending' | 'voting' | 'completed' | 'failed';
  /** Start time */
  startedAt: Date;
  /** Timeout */
  timeout: number;
}

/**
 * Consensus Builder
 *
 * Coordinates multi-agent consensus building for important decisions.
 */
export class ConsensusBuilder {
  private readonly options: Required<ConsensusBuilderOptions>;
  private sessions: Map<string, ConsensusSession> = new Map();

  constructor(options: ConsensusBuilderOptions = {}) {
    this.options = {
      defaultThreshold: 0.67,
      defaultTimeout: 60000,
      method: 'majority',
      ...options,
    };
  }

  /**
   * Create a new consensus session
   */
  createSession(request: ConsensusRequest): string {
    const sessionId = `consensus_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const session: ConsensusSession = {
      id: sessionId,
      topic: request.topic,
      options: request.options,
      votes: [],
      participants: request.participants,
      threshold: request.threshold || this.options.defaultThreshold,
      method: this.options.method,
      status: 'pending',
      startedAt: new Date(),
      timeout: request.timeout || this.options.defaultTimeout,
    };

    this.sessions.set(sessionId, session);

    logger.info('Created consensus session', {
      sessionId,
      topic: request.topic,
      participants: request.participants.length,
      threshold: session.threshold,
    });

    return sessionId;
  }

  /**
   * Submit a vote for a consensus session
   */
  submitVote(sessionId: string, vote: AgentVote): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.warn('Consensus session not found', { sessionId });
      return false;
    }

    if (session.status === 'completed' || session.status === 'failed') {
      logger.warn('Cannot vote on completed session', { sessionId, status: session.status });
      return false;
    }

    // Check if agent is a participant
    if (!session.participants.includes(vote.agent)) {
      logger.warn('Agent not a participant', { sessionId, agent: vote.agent });
      return false;
    }

    // Check if agent already voted
    const existingVote = session.votes.find(v => v.agent === vote.agent);
    if (existingVote) {
      logger.warn('Agent already voted', { sessionId, agent: vote.agent });
      return false;
    }

    // Validate option exists
    if (!session.options.find(o => o.id === vote.option)) {
      logger.warn('Invalid option', { sessionId, option: vote.option });
      return false;
    }

    session.votes.push(vote);
    session.status = 'voting';

    logger.info('Vote submitted', {
      sessionId,
      agent: vote.agent,
      option: vote.option,
      confidence: vote.confidence,
    });

    return true;
  }

  /**
   * Calculate consensus result
   */
  calculateResult(sessionId: string): ConsensusResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Consensus session not found: ${sessionId}`);
    }

    const result = this.evaluateConsensus(session);

    // Update session status
    session.status = result.achieved ? 'completed' : 'failed';

    logger.info('Consensus calculated', {
      sessionId,
      achieved: result.achieved,
      selectedOption: result.selectedOption,
    });

    return result;
  }

  /**
   * Evaluate consensus based on method
   */
  private evaluateConsensus(session: ConsensusSession): ConsensusResult {
    const { votes, options, threshold, method } = session;

    if (votes.length === 0) {
      return {
        achieved: false,
        votes: [],
        rationale: 'No votes received',
      };
    }

    // Count votes per option
    const voteCounts = new Map<string, number>();
    const weightedCounts = new Map<string, number>();

    for (const option of options) {
      voteCounts.set(option.id, 0);
      weightedCounts.set(option.id, 0);
    }

    for (const vote of votes) {
      voteCounts.set(vote.option, (voteCounts.get(vote.option) || 0) + 1);

      const weight = vote.weight || vote.confidence;
      weightedCounts.set(vote.option, (weightedCounts.get(vote.option) || 0) + weight);
    }

    let result: ConsensusResult;

    switch (method) {
      case 'unanimous':
        result = this.evaluateUnanimous(votes, options, voteCounts);
        break;
      case 'weighted':
        result = this.evaluateWeighted(votes, options, weightedCounts, threshold);
        break;
      case 'expert':
        result = this.evaluateExpert(votes, options);
        break;
      case 'majority':
      default:
        result = this.evaluateMajority(votes, options, voteCounts, threshold);
        break;
    }

    return result;
  }

  /**
   * Evaluate unanimous consensus
   */
  private evaluateUnanimous(
    votes: AgentVote[],
    options: ConsensusOption[],
    voteCounts: Map<string, number>
  ): ConsensusResult {
    // Find if all votes are for same option
    const totalVotes = votes.length;

    for (const [optionId, count] of voteCounts.entries()) {
      if (count === totalVotes) {
        const option = options.find(o => o.id === optionId);
        return {
          achieved: true,
          selectedOption: optionId,
          votes: votes.map(v => ({
            agent: v.agent,
            option: v.option,
            confidence: v.confidence,
            reasoning: v.reasoning,
          })),
          rationale: `Unanimous consensus achieved for "${option?.description}"`,
        };
      }
    }

    // Find dissenting opinions
    const mainOption = this.getLeadingOption(voteCounts);
    const dissent = votes
      .filter(v => v.option !== mainOption)
      .map(v => `${v.agent}: ${v.reasoning}`);

    return {
      achieved: false,
      votes: votes.map(v => ({
        agent: v.agent,
        option: v.option,
        confidence: v.confidence,
        reasoning: v.reasoning,
      })),
      rationale: 'Unanimous consensus not achieved',
      dissent,
    };
  }

  /**
   * Evaluate majority consensus
   */
  private evaluateMajority(
    votes: AgentVote[],
    options: ConsensusOption[],
    voteCounts: Map<string, number>,
    threshold: number
  ): ConsensusResult {
    const totalVotes = votes.length;

    for (const [optionId, count] of voteCounts.entries()) {
      const percentage = count / totalVotes;
      if (percentage >= threshold) {
        const option = options.find(o => o.id === optionId);

        const dissent = votes
          .filter(v => v.option !== optionId)
          .map(v => `${v.agent}: ${v.reasoning}`);

        return {
          achieved: true,
          selectedOption: optionId,
          votes: votes.map(v => ({
            agent: v.agent,
            option: v.option,
            confidence: v.confidence,
            reasoning: v.reasoning,
          })),
          rationale: `Majority consensus (${(percentage * 100).toFixed(1)}%) achieved for "${option?.description}"`,
          dissent: dissent.length > 0 ? dissent : undefined,
        };
      }
    }

    return {
      achieved: false,
      votes: votes.map(v => ({
        agent: v.agent,
        option: v.option,
        confidence: v.confidence,
        reasoning: v.reasoning,
      })),
      rationale: `No option reached threshold of ${(threshold * 100).toFixed(1)}%`,
    };
  }

  /**
   * Evaluate weighted consensus
   */
  private evaluateWeighted(
    votes: AgentVote[],
    options: ConsensusOption[],
    weightedCounts: Map<string, number>,
    threshold: number
  ): ConsensusResult {
    const totalWeight = Array.from(weightedCounts.values()).reduce((a, b) => a + b, 0);

    for (const [optionId, weight] of weightedCounts.entries()) {
      const percentage = weight / totalWeight;
      if (percentage >= threshold) {
        const option = options.find(o => o.id === optionId);

        const dissent = votes
          .filter(v => v.option !== optionId)
          .map(v => `${v.agent}: ${v.reasoning}`);

        return {
          achieved: true,
          selectedOption: optionId,
          votes: votes.map(v => ({
            agent: v.agent,
            option: v.option,
            confidence: v.confidence,
            reasoning: v.reasoning,
          })),
          rationale: `Weighted consensus (${(percentage * 100).toFixed(1)}%) achieved for "${option?.description}"`,
          dissent: dissent.length > 0 ? dissent : undefined,
        };
      }
    }

    return {
      achieved: false,
      votes: votes.map(v => ({
        agent: v.agent,
        option: v.option,
        confidence: v.confidence,
        reasoning: v.reasoning,
      })),
      rationale: `No option reached weighted threshold of ${(threshold * 100).toFixed(1)}%`,
    };
  }

  /**
   * Evaluate expert consensus (highest confidence vote wins)
   */
  private evaluateExpert(
    votes: AgentVote[],
    options: ConsensusOption[]
  ): ConsensusResult {
    // Sort by confidence and weight
    const sortedVotes = [...votes].sort((a, b) => {
      const aScore = a.confidence * (a.weight || 1);
      const bScore = b.confidence * (b.weight || 1);
      return bScore - aScore;
    });

    const topVote = sortedVotes[0];
    const option = options.find(o => o.id === topVote.option);

    const dissent = votes
      .filter(v => v.option !== topVote.option)
      .map(v => `${v.agent}: ${v.reasoning}`);

    return {
      achieved: true,
      selectedOption: topVote.option,
      votes: votes.map(v => ({
        agent: v.agent,
        option: v.option,
        confidence: v.confidence,
        reasoning: v.reasoning,
      })),
      rationale: `Expert consensus: ${topVote.agent} (confidence: ${topVote.confidence}) selected "${option?.description}"`,
      dissent: dissent.length > 0 ? dissent : undefined,
    };
  }

  /**
   * Get leading option from vote counts
   */
  private getLeadingOption(voteCounts: Map<string, number>): string {
    let maxCount = 0;
    let leadingOption = '';

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
  isSessionTimedOut(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return true;

    const elapsed = Date.now() - session.startedAt.getTime();
    return elapsed > session.timeout;
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId: string): ConsensusSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Check if all participants have voted
   */
  allParticipantsVoted(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    return session.votes.length >= session.participants.length;
  }

  /**
   * Convert result to ConsensusInfo for decision log
   */
  toConsensusInfo(
    sessionId: string,
    result: ConsensusResult,
    required: boolean = true
  ): ConsensusInfo {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    return {
      required,
      achieved: result.achieved,
      participants: session.participants,
      votes: result.votes.map(v => ({
        agent: v.agent,
        vote: v.option === result.selectedOption ? 'agree' : 'disagree',
        reason: v.reasoning,
      })),
      method: session.method,
      outcome: result.rationale,
    };
  }

  /**
   * Determine if consensus is needed based on confidence
   */
  static needsConsensus(confidence: ConfidenceLevel): boolean {
    return confidence === 'low' || confidence === 'uncertain';
  }

  /**
   * Get recommended threshold based on confidence
   */
  static getRecommendedThreshold(confidence: ConfidenceLevel): number {
    switch (confidence) {
      case 'uncertain':
        return 0.8; // Need strong agreement for uncertain decisions
      case 'low':
        return 0.67; // Standard majority
      case 'medium':
        return 0.6;
      case 'high':
        return 0.5; // Simple majority OK for high confidence
      default:
        return 0.67;
    }
  }
}

/**
 * Create a consensus builder
 */
export function createConsensusBuilder(options?: ConsensusBuilderOptions): ConsensusBuilder {
  return new ConsensusBuilder(options);
}
