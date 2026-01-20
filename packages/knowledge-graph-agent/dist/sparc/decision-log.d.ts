/**
 * Decision Log Manager
 *
 * Manages the decision log throughout the SPARC planning process.
 * Tracks all decisions, their rationale, confidence levels, and consensus information.
 *
 * @module sparc/decision-log
 */
import type { DecisionLog, DecisionEntry, DecisionStatus, ConfidenceLevel, SPARCPhase, ConsensusInfo } from './types.js';
/**
 * Decision log manager options
 */
export interface DecisionLogManagerOptions {
    /** Output directory for the log */
    outputDir: string;
    /** Plan ID */
    planId: string;
    /** Auto-save on changes */
    autoSave?: boolean;
}
/**
 * Add decision options
 */
export interface AddDecisionOptions {
    /** Decision title */
    title: string;
    /** Decision description */
    description: string;
    /** SPARC phase */
    phase: SPARCPhase;
    /** Confidence level */
    confidence: ConfidenceLevel;
    /** Rationale */
    rationale: string;
    /** Alternatives considered */
    alternatives?: string[];
    /** Impact assessment */
    impact?: string;
    /** Stakeholders */
    stakeholders?: string[];
    /** Related decision IDs */
    relatedDecisions?: string[];
    /** Decision maker */
    decidedBy: string;
    /** Consensus info if applicable */
    consensus?: ConsensusInfo;
}
/**
 * Decision Log Manager
 *
 * Handles creation, updating, and persistence of decision logs.
 */
export declare class DecisionLogManager {
    private log;
    private readonly options;
    private readonly logPath;
    constructor(options: DecisionLogManagerOptions);
    /**
     * Load existing log or create new one
     */
    private loadOrCreate;
    /**
     * Create a new decision log
     */
    private createNewLog;
    /**
     * Add a new decision to the log
     */
    addDecision(options: AddDecisionOptions): DecisionEntry;
    /**
     * Update decision status
     */
    updateDecisionStatus(decisionId: string, status: DecisionStatus, notes?: string): boolean;
    /**
     * Add consensus information to a decision
     */
    addConsensusInfo(decisionId: string, consensus: ConsensusInfo): boolean;
    /**
     * Get all decisions
     */
    getDecisions(): DecisionEntry[];
    /**
     * Get decisions by phase
     */
    getDecisionsByPhase(phase: SPARCPhase): DecisionEntry[];
    /**
     * Get decisions by confidence level
     */
    getDecisionsByConfidence(confidence: ConfidenceLevel): DecisionEntry[];
    /**
     * Get low confidence decisions requiring review
     */
    getLowConfidenceDecisions(): DecisionEntry[];
    /**
     * Get decisions requiring consensus
     */
    getDecisionsRequiringConsensus(): DecisionEntry[];
    /**
     * Get decision by ID
     */
    getDecision(id: string): DecisionEntry | undefined;
    /**
     * Get the full log
     */
    getLog(): DecisionLog;
    /**
     * Get statistics
     */
    getStatistics(): DecisionLog['statistics'];
    /**
     * Update statistics
     */
    private updateStatistics;
    /**
     * Save the log to disk
     */
    save(): void;
    /**
     * Export log as markdown
     */
    exportMarkdown(): string;
    /**
     * Save markdown export
     */
    saveMarkdown(): void;
}
/**
 * Create a decision log manager
 */
export declare function createDecisionLogManager(options: DecisionLogManagerOptions): DecisionLogManager;
//# sourceMappingURL=decision-log.d.ts.map