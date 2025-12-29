/**
 * ReasoningBank Adapter
 *
 * Provides integration with agentic-flow's ReasoningBank for trajectory
 * tracking, verdict judgment, and experience learning.
 *
 * The ReasoningBank stores task execution trajectories and uses them to
 * inform future decisions through verdict judgment and memory distillation.
 *
 * Implements the MemoryStore interface from the Learning Loop system to
 * provide persistent semantic memory capabilities.
 *
 * @module integrations/agentic-flow/adapters/reasoning-bank-adapter
 */
import { BaseAdapter } from './base-adapter.js';
import type { ExtractedMemory, MemoryType, MemoryStore } from '../../../learning/types.js';
/**
 * A single step in a task execution trajectory
 */
export interface TrajectoryStep {
    /** Action taken */
    action: string;
    /** Observation/result of the action */
    observation: string;
    /** Timestamp of the step */
    timestamp: Date;
    /** Duration in milliseconds */
    duration?: number;
    /** Confidence in this step (0-1) */
    confidence?: number;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
/**
 * A complete trajectory representing a task execution
 */
export interface Trajectory {
    /** Unique trajectory identifier */
    id: string;
    /** Task identifier */
    taskId: string;
    /** Sequence of steps in the trajectory */
    steps: TrajectoryStep[];
    /** Final outcome */
    outcome: 'success' | 'failure' | 'partial';
    /** When the trajectory was stored */
    storedAt: Date;
    /** Additional metadata */
    metadata: Record<string, unknown>;
}
/**
 * Input for storing a trajectory
 */
export interface TrajectoryInput {
    /** Task identifier */
    taskId: string;
    /** Sequence of steps */
    steps: TrajectoryStep[];
    /** Final outcome */
    outcome: 'success' | 'failure' | 'partial';
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
/**
 * A verdict judgment for a task approach
 */
export interface Verdict {
    /** Recommendation for the task */
    recommendation: 'proceed' | 'caution' | 'avoid';
    /** Confidence in the verdict (0-1) */
    confidence: number;
    /** Reasoning behind the verdict */
    reasoning: string;
    /** Warnings based on historical failures */
    warnings: string[];
    /** Suggested approach based on successful trajectories */
    suggestedApproach?: string;
    /** Similar trajectories that informed this verdict */
    similarTrajectories: Array<{
        id: string;
        outcome: 'success' | 'failure' | 'partial';
        similarity: number;
    }>;
}
/**
 * Task description for verdict judgment
 */
export interface TaskDescription {
    /** Task description text */
    description: string;
    /** Task type/category */
    type?: string;
    /** Additional context */
    context?: Record<string, unknown>;
}
/**
 * Configuration for the ReasoningBank adapter
 */
export interface ReasoningBankConfig {
    /** Path for persisting reasoning bank data */
    persistPath: string;
    /** Enable the adapter */
    enabled: boolean;
    /** Memory namespace for storage */
    namespace: string;
    /** Maximum trajectories to store */
    maxTrajectories: number;
    /** Similarity threshold for verdict judgment */
    similarityThreshold: number;
    /** TTL for trajectories in milliseconds (0 = no expiry) */
    trajectoryTtl: number;
    /** Enable memory distillation */
    enableDistillation: boolean;
    /** Distillation interval in hours */
    distillationInterval: number;
    /** Distillation frequency (number of trajectories before distillation) */
    distillationFrequency: number;
    /** Threshold for verdict judgments (0-1) */
    verdictThreshold: number;
}
/**
 * Result of memory distillation operation
 */
export interface DistillationResult {
    /** Number of memories removed */
    memoriesRemoved: number;
    /** Number of memories consolidated */
    memoriesConsolidated: number;
    /** Number of patterns extracted */
    patternsExtracted: number;
    /** Storage space saved in bytes */
    storageSaved: number;
}
/**
 * Adapter for integrating with agentic-flow's ReasoningBank
 *
 * Provides trajectory storage, verdict judgment, and experience learning
 * capabilities for knowledge graph agents.
 *
 * Extends BaseAdapter for dynamic module loading and implements MemoryStore
 * for integration with the Learning Loop system.
 */
export declare class ReasoningBankAdapter extends BaseAdapter<unknown> implements MemoryStore {
    private readonly emitter;
    private config;
    private trajectories;
    private trajectoryIndex;
    private memories;
    private distillationCounter;
    constructor(config?: Partial<ReasoningBankConfig>);
    getFeatureName(): string;
    isAvailable(): boolean;
    initialize(): Promise<void>;
    getConfig(): ReasoningBankConfig;
    store(memory: ExtractedMemory): Promise<void>;
    retrieve(id: string): Promise<ExtractedMemory | null>;
    findByType(type: MemoryType, limit?: number): Promise<ExtractedMemory[]>;
    findByTags(tags: string[], limit?: number): Promise<ExtractedMemory[]>;
    findSimilar(embedding: number[], limit?: number): Promise<ExtractedMemory[]>;
    getStatsForDay(date: Date): Promise<{
        extracted: number;
        applied: number;
        byType: Record<MemoryType, number>;
    }>;
    delete(id: string): Promise<boolean>;
    /**
     * Search memories by query string
     * @param query - Search query
     * @param limit - Maximum results to return
     */
    search(query: string, limit?: number): Promise<ExtractedMemory[]>;
    private cosineSimilarity;
    storeTrajectory(input: TrajectoryInput): Promise<string>;
    getTrajectory(id: string): Promise<Trajectory | null>;
    findSimilarTrajectories(description: string, limit?: number): Promise<Array<Trajectory & {
        similarity: number;
    }>>;
    judgeVerdict(task: TaskDescription): Promise<Verdict>;
    distillMemories(): Promise<DistillationResult>;
    extractPatterns(memories: ExtractedMemory[]): Promise<Array<{
        pattern: string;
        frequency: number;
        confidence: number;
    }>>;
    getStats(): Promise<{
        memories: number;
        trajectories: number;
        patterns: number;
    }>;
    getStatistics(): {
        total: number;
        byOutcome: Record<string, number>;
        byType: Record<string, number>;
    };
    clear(): Promise<void>;
    on(event: string, listener: (...args: unknown[]) => void): this;
    off(event: string, listener: (...args: unknown[]) => void): this;
    private autoInitialize;
    private createId;
    private extractKeywords;
    private evictOldestTrajectories;
    private createDefaultVerdict;
    private extractWarningsFromFailures;
    private generateApproachFromSuccesses;
    private calculateVerdictConfidence;
    private generateReasoning;
}
export declare function createReasoningBankAdapter(config?: Partial<ReasoningBankConfig>): Promise<ReasoningBankAdapter>;
//# sourceMappingURL=reasoning-bank-adapter.d.ts.map