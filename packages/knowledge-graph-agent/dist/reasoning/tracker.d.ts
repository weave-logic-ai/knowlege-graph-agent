/**
 * Decision Tracker - Track and explain AI decisions
 *
 * Provides comprehensive tracking of AI reasoning and decision-making,
 * enabling transparency, debugging, and audit trails for all automated actions.
 *
 * @module reasoning/tracker
 */
import { EventEmitter } from 'events';
import type { Decision, DecisionOutcome, ReasoningChain, ReasoningChainStatus, ConfidenceLevel, DecisionType, CreateDecisionParams, ReasoningStats } from './types.js';
/**
 * Events emitted by the DecisionTracker
 */
export interface DecisionTrackerEvents {
    chainStarted: (chain: ReasoningChain) => void;
    chainEnded: (chain: ReasoningChain) => void;
    decisionRecorded: (decision: Decision) => void;
    outcomeRecorded: (decision: Decision) => void;
}
/**
 * Decision Tracker for recording, explaining, and auditing AI decisions
 *
 * @example
 * ```typescript
 * const tracker = createDecisionTracker();
 *
 * // Start a reasoning chain for a goal
 * const chainId = tracker.startChain('Process user query about entities');
 *
 * // Record decisions as they're made
 * const decision = tracker.recordDecision({
 *   action: 'Extract entities from query',
 *   reasoning: [
 *     'Query contains multiple noun phrases',
 *     'NLP analysis identified 3 potential entities',
 *     'Confidence scores above threshold for all 3',
 *   ],
 *   confidence: 'high',
 *   context: {
 *     trigger: 'user_query',
 *     inputs: { query: 'Tell me about Apple and Microsoft' },
 *     constraints: ['max 10 entities', 'confidence > 0.7'],
 *     alternatives: [],
 *   },
 * });
 *
 * // Record outcome after execution
 * tracker.recordOutcome(decision.id, {
 *   success: true,
 *   result: { entities: ['Apple', 'Microsoft'] },
 *   duration: 150,
 *   sideEffects: [],
 * });
 *
 * // Get explanation
 * console.log(tracker.explainDecision(decision.id));
 *
 * // End the chain
 * tracker.endChain(chainId);
 * ```
 */
export declare class DecisionTracker extends EventEmitter {
    private decisions;
    private chains;
    private currentChain?;
    private maxDecisions;
    private maxChains;
    constructor(options?: {
        maxDecisions?: number;
        maxChains?: number;
    });
    /**
     * Start a new reasoning chain for a specific goal
     *
     * @param goal - The goal this reasoning chain is working toward
     * @returns The chain ID
     */
    startChain(goal: string): string;
    /**
     * Record a decision made by the system
     *
     * @param params - Decision parameters
     * @returns The recorded decision
     */
    recordDecision(params: CreateDecisionParams): Decision;
    /**
     * Record the outcome of a decision after execution
     *
     * @param decisionId - ID of the decision
     * @param outcome - The outcome to record
     */
    recordOutcome(decisionId: string, outcome: DecisionOutcome): void;
    /**
     * End a reasoning chain
     *
     * @param chainId - ID of the chain to end
     * @param status - Final status of the chain
     */
    endChain(chainId: string, status?: ReasoningChainStatus): void;
    /**
     * Get a decision by ID
     *
     * @param id - Decision ID
     * @returns The decision or undefined
     */
    getDecision(id: string): Decision | undefined;
    /**
     * Get a reasoning chain by ID
     *
     * @param id - Chain ID
     * @returns The chain or undefined
     */
    getChain(id: string): ReasoningChain | undefined;
    /**
     * Get the currently active reasoning chain
     *
     * @returns The current chain or undefined
     */
    getCurrentChain(): ReasoningChain | undefined;
    /**
     * Get recent decisions
     *
     * @param limit - Maximum number of decisions to return
     * @returns Array of recent decisions, newest first
     */
    getRecentDecisions(limit?: number): Decision[];
    /**
     * Get all decisions in a chain
     *
     * @param chainId - Chain ID
     * @returns Array of decisions in the chain
     */
    getChainDecisions(chainId: string): Decision[];
    /**
     * Generate a human-readable explanation of a decision
     *
     * @param decisionId - ID of the decision to explain
     * @returns Formatted explanation string
     */
    explainDecision(decisionId: string): string;
    /**
     * Generate a summary of a reasoning chain
     *
     * @param chainId - ID of the chain to summarize
     * @returns Formatted summary string
     */
    summarizeChain(chainId: string): string;
    /**
     * Export a chain as a structured object for persistence or analysis
     *
     * @param chainId - ID of the chain to export
     * @returns Structured chain data with explanations
     */
    exportChain(chainId: string): object;
    /**
     * Get statistics about reasoning performance
     *
     * @returns Reasoning statistics
     */
    getStats(): ReasoningStats;
    /**
     * Find decisions by criteria
     *
     * @param criteria - Search criteria
     * @returns Matching decisions
     */
    findDecisions(criteria: {
        type?: DecisionType;
        confidence?: ConfidenceLevel;
        success?: boolean;
        afterDate?: Date;
        beforeDate?: Date;
        actionContains?: string;
    }): Decision[];
    /**
     * Clear all tracked decisions and chains
     */
    clear(): void;
    /**
     * Remove old decisions to stay within limits
     */
    private pruneOldDecisions;
    /**
     * Remove old chains to stay within limits
     */
    private pruneOldChains;
}
/**
 * Create a new DecisionTracker instance
 *
 * @param options - Tracker options
 * @returns New DecisionTracker instance
 */
export declare function createDecisionTracker(options?: {
    maxDecisions?: number;
    maxChains?: number;
}): DecisionTracker;
/**
 * Get the default singleton DecisionTracker instance
 *
 * @returns The default DecisionTracker
 */
export declare function getDecisionTracker(): DecisionTracker;
/**
 * Set the default singleton DecisionTracker instance
 *
 * @param tracker - The tracker to use as default
 */
export declare function setDefaultDecisionTracker(tracker: DecisionTracker): void;
//# sourceMappingURL=tracker.d.ts.map