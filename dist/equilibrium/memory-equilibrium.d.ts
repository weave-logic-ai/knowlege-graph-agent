/**
 * Memory Equilibrium Pruning
 *
 * Implements game-theoretic equilibrium-based pruning for memories.
 * Memories compete for retention based on utility (recency, type, confidence)
 * and uniqueness (inverse redundancy with similar memories).
 *
 * Uses a replicator dynamics approach where memories with higher net utility
 * increase their "participation" (retention probability) over iterations.
 *
 * @module equilibrium/memory-equilibrium
 */
import { ExtractedMemory, MemoryType } from '../learning/types.js';
/**
 * Memory with computed participation and utility metrics
 */
export interface MemoryParticipation {
    /** The memory being evaluated */
    memory: ExtractedMemory;
    /** Participation level (0-1), represents retention probability */
    participation: number;
    /** Computed utility score */
    utility: number;
    /** Redundancy penalty from similar memories */
    redundancy: number;
}
/**
 * Configuration for the memory equilibrium pruner
 */
export interface MemoryEquilibriumConfig {
    /** Learning rate for participation updates (default: 0.15) */
    learningRate: number;
    /** Maximum iterations to find equilibrium (default: 50) */
    maxIterations: number;
    /** Fraction of memories to retain (0-1, default: 0.7) */
    retentionBudget: number;
    /** Threshold above which memories are considered similar (default: 0.6) */
    similarityThreshold: number;
    /** Convergence threshold for early stopping */
    convergenceThreshold: number;
    /** Type weights for memory importance */
    typeWeights: Partial<Record<MemoryType, number>>;
    /** Recency decay factor (higher = faster decay) */
    recencyDecay: number;
}
/**
 * Result of pruning operation
 */
export interface PruneResult {
    /** Retained memories */
    retained: ExtractedMemory[];
    /** Pruned memories */
    pruned: ExtractedMemory[];
    /** Final participation scores */
    participations: MemoryParticipation[];
    /** Number of iterations to converge */
    iterations: number;
    /** Whether equilibrium was reached */
    converged: boolean;
}
/**
 * Statistics about the pruning operation
 */
export interface PruneStats {
    /** Original memory count */
    originalCount: number;
    /** Retained memory count */
    retainedCount: number;
    /** Pruned memory count */
    prunedCount: number;
    /** Retention rate */
    retentionRate: number;
    /** Average utility of retained memories */
    avgRetainedUtility: number;
    /** Average utility of pruned memories */
    avgPrunedUtility: number;
    /** Iterations to converge */
    iterations: number;
}
declare const DEFAULT_CONFIG: MemoryEquilibriumConfig;
/**
 * Prunes memories using game-theoretic equilibrium.
 *
 * The algorithm works by:
 * 1. Initializing equal participation for all memories
 * 2. Computing utility (value) and redundancy (cost) for each memory
 * 3. Updating participation based on net utility (utility - redundancy)
 * 4. Normalizing to budget constraint
 * 5. Repeating until convergence or max iterations
 * 6. Retaining memories above participation threshold
 */
export declare class MemoryEquilibriumPruner {
    private config;
    constructor(config?: Partial<MemoryEquilibriumConfig>);
    /**
     * Get current configuration
     */
    getConfig(): MemoryEquilibriumConfig;
    /**
     * Update configuration
     */
    setConfig(config: Partial<MemoryEquilibriumConfig>): void;
    /**
     * Prune memories using game-theoretic equilibrium
     * Memories compete for retention based on utility and uniqueness
     *
     * @param memories - Array of memories to prune
     * @returns Retained memories after equilibrium pruning
     */
    pruneMemories(memories: ExtractedMemory[]): Promise<ExtractedMemory[]>;
    /**
     * Prune memories and return detailed results
     *
     * @param memories - Array of memories to prune
     * @returns Detailed prune result including retained, pruned, and participation data
     */
    pruneWithDetails(memories: ExtractedMemory[]): Promise<PruneResult>;
    /**
     * Get statistics about a pruning operation
     */
    getPruneStats(memories: ExtractedMemory[]): Promise<PruneStats>;
    /**
     * Calculate utility score for a single memory
     */
    calculateMemoryUtility(memory: ExtractedMemory): number;
    /**
     * Calculate redundancy penalty for a memory
     */
    private calculateRedundancy;
    /**
     * Calculate similarity between two memories
     */
    memorySimilarity(a: ExtractedMemory, b: ExtractedMemory): number;
    /**
     * Cosine similarity between two vectors
     */
    private cosineSimilarity;
    /**
     * Jaccard similarity on word sets
     */
    private jaccardSimilarity;
    /**
     * Normalize participations to fit within budget
     */
    private normalizeToBudget;
    /**
     * Find optimal memories for a query context
     * Combines relevance to query with equilibrium pruning
     */
    findOptimalMemories(memories: ExtractedMemory[], query: string, maxCount: number): Promise<ExtractedMemory[]>;
}
export { DEFAULT_CONFIG as DEFAULT_MEMORY_EQUILIBRIUM_CONFIG };
//# sourceMappingURL=memory-equilibrium.d.ts.map