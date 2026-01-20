/**
 * Consensus Builder
 *
 * Builds consensus among multiple agents when confidence is low.
 * Coordinates voting, discussion, and final decision making.
 *
 * @module sparc/consensus
 */
import type { ConsensusInfo, ConsensusRequest, ConsensusResult, ConfidenceLevel } from './types.js';
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
export declare class ConsensusBuilder {
    private readonly options;
    private sessions;
    constructor(options?: ConsensusBuilderOptions);
    /**
     * Create a new consensus session
     */
    createSession(request: ConsensusRequest): string;
    /**
     * Submit a vote for a consensus session
     */
    submitVote(sessionId: string, vote: AgentVote): boolean;
    /**
     * Calculate consensus result
     */
    calculateResult(sessionId: string): ConsensusResult;
    /**
     * Evaluate consensus based on method
     */
    private evaluateConsensus;
    /**
     * Evaluate unanimous consensus
     */
    private evaluateUnanimous;
    /**
     * Evaluate majority consensus
     */
    private evaluateMajority;
    /**
     * Evaluate weighted consensus
     */
    private evaluateWeighted;
    /**
     * Evaluate expert consensus (highest confidence vote wins)
     */
    private evaluateExpert;
    /**
     * Get leading option from vote counts
     */
    private getLeadingOption;
    /**
     * Check if session has timed out
     */
    isSessionTimedOut(sessionId: string): boolean;
    /**
     * Get session status
     */
    getSessionStatus(sessionId: string): ConsensusSession | undefined;
    /**
     * Check if all participants have voted
     */
    allParticipantsVoted(sessionId: string): boolean;
    /**
     * Convert result to ConsensusInfo for decision log
     */
    toConsensusInfo(sessionId: string, result: ConsensusResult, required?: boolean): ConsensusInfo;
    /**
     * Determine if consensus is needed based on confidence
     */
    static needsConsensus(confidence: ConfidenceLevel): boolean;
    /**
     * Get recommended threshold based on confidence
     */
    static getRecommendedThreshold(confidence: ConfidenceLevel): number;
}
/**
 * Create a consensus builder
 */
export declare function createConsensusBuilder(options?: ConsensusBuilderOptions): ConsensusBuilder;
export {};
//# sourceMappingURL=consensus.d.ts.map