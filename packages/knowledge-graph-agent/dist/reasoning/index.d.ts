/**
 * Reasoning Module
 *
 * Provides decision tracking, reasoning chains, and explainability.
 */
export type DecisionType = 'classification' | 'selection' | 'routing' | 'prioritization' | 'validation' | 'transformation';
export type ConfidenceLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export interface DecisionContext {
    id: string;
    input: Record<string, unknown>;
    options?: string[];
    constraints?: string[];
    timestamp: Date;
}
export interface Alternative {
    id: string;
    description: string;
    score: number;
    reasonNotSelected?: string;
}
export interface DecisionOutcome {
    selected: string;
    confidence: ConfidenceLevel;
    confidenceScore: number;
    alternatives: Alternative[];
    reasoning: string[];
}
export interface Decision {
    id: string;
    type: DecisionType;
    context: DecisionContext;
    outcome: DecisionOutcome;
    duration: number;
    metadata?: Record<string, unknown>;
}
export interface ReasoningChain {
    id: string;
    decisions: Decision[];
    conclusion?: string;
    confidence: ConfidenceLevel;
    totalDuration: number;
    metadata?: Record<string, unknown>;
}
export declare class DecisionTracker {
    private decisions;
    private chains;
    private currentChainId?;
    startChain(metadata?: Record<string, unknown>): string;
    endChain(conclusion?: string): ReasoningChain | undefined;
    recordDecision(type: DecisionType, context: Omit<DecisionContext, 'id' | 'timestamp'>, outcome: DecisionOutcome, duration: number, metadata?: Record<string, unknown>): Decision;
    getDecision(id: string): Decision | undefined;
    getChain(id: string): ReasoningChain | undefined;
    getAllDecisions(): Decision[];
    getAllChains(): ReasoningChain[];
    getDecisionsByType(type: DecisionType): Decision[];
    getRecentDecisions(limit?: number): Decision[];
    getStatistics(): {
        totalDecisions: number;
        totalChains: number;
        averageDuration: number;
        byType: Record<DecisionType, number>;
        byConfidence: Record<ConfidenceLevel, number>;
    };
    export(): {
        decisions: Decision[];
        chains: ReasoningChain[];
        exportedAt: Date;
    };
    clear(): void;
    private calculateChainConfidence;
}
export declare function createDecisionTracker(): DecisionTracker;
export declare function getDecisionTracker(): DecisionTracker;
//# sourceMappingURL=index.d.ts.map