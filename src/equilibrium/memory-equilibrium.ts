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

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: MemoryEquilibriumConfig = {
  learningRate: 0.15,
  maxIterations: 50,
  retentionBudget: 0.7,
  similarityThreshold: 0.6,
  convergenceThreshold: 0.001,
  typeWeights: {
    [MemoryType.PROCEDURAL]: 1.0,
    [MemoryType.TECHNICAL]: 0.9,
    [MemoryType.SEMANTIC]: 0.8,
    [MemoryType.EPISODIC]: 0.6,
    [MemoryType.CONTEXT]: 0.5,
  },
  recencyDecay: 0.1,
};

// ============================================================================
// Memory Equilibrium Pruner
// ============================================================================

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
export class MemoryEquilibriumPruner {
  private config: MemoryEquilibriumConfig;

  constructor(config: Partial<MemoryEquilibriumConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (config.typeWeights) {
      this.config.typeWeights = { ...DEFAULT_CONFIG.typeWeights, ...config.typeWeights };
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): MemoryEquilibriumConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<MemoryEquilibriumConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.typeWeights) {
      this.config.typeWeights = { ...DEFAULT_CONFIG.typeWeights, ...config.typeWeights };
    }
  }

  /**
   * Prune memories using game-theoretic equilibrium
   * Memories compete for retention based on utility and uniqueness
   *
   * @param memories - Array of memories to prune
   * @returns Retained memories after equilibrium pruning
   */
  async pruneMemories(memories: ExtractedMemory[]): Promise<ExtractedMemory[]> {
    const result = await this.pruneWithDetails(memories);
    return result.retained;
  }

  /**
   * Prune memories and return detailed results
   *
   * @param memories - Array of memories to prune
   * @returns Detailed prune result including retained, pruned, and participation data
   */
  async pruneWithDetails(memories: ExtractedMemory[]): Promise<PruneResult> {
    if (memories.length === 0) {
      return {
        retained: [],
        pruned: [],
        participations: [],
        iterations: 0,
        converged: true,
      };
    }

    // Initialize participation evenly
    const participations: MemoryParticipation[] = memories.map((m) => ({
      memory: m,
      participation: 1.0 / memories.length,
      utility: this.calculateMemoryUtility(m),
      redundancy: 0,
    }));

    let converged = false;
    let iterations = 0;

    // Find equilibrium through replicator dynamics
    for (let iter = 0; iter < this.config.maxIterations; iter++) {
      iterations = iter + 1;
      let maxDelta = 0;

      for (const p of participations) {
        // Calculate redundancy with similar memories
        p.redundancy = this.calculateRedundancy(p, participations);

        // Update participation based on net utility
        const netUtility = p.utility - p.redundancy;
        const oldParticipation = p.participation;
        p.participation = Math.max(0, p.participation + this.config.learningRate * netUtility);

        maxDelta = Math.max(maxDelta, Math.abs(p.participation - oldParticipation));
      }

      // Normalize to budget
      this.normalizeToBudget(participations);

      // Check convergence
      if (maxDelta < this.config.convergenceThreshold) {
        converged = true;
        break;
      }
    }

    // Partition memories based on participation threshold
    const retained: ExtractedMemory[] = [];
    const pruned: ExtractedMemory[] = [];

    // Sort by participation descending
    participations.sort((a, b) => b.participation - a.participation);

    for (const p of participations) {
      if (p.participation > 0.01) {
        retained.push(p.memory);
      } else {
        pruned.push(p.memory);
      }
    }

    return {
      retained,
      pruned,
      participations,
      iterations,
      converged,
    };
  }

  /**
   * Get statistics about a pruning operation
   */
  async getPruneStats(memories: ExtractedMemory[]): Promise<PruneStats> {
    const result = await this.pruneWithDetails(memories);

    const retainedUtilities = result.participations
      .filter((p) => p.participation > 0.01)
      .map((p) => p.utility);

    const prunedUtilities = result.participations
      .filter((p) => p.participation <= 0.01)
      .map((p) => p.utility);

    return {
      originalCount: memories.length,
      retainedCount: result.retained.length,
      prunedCount: result.pruned.length,
      retentionRate: memories.length > 0 ? result.retained.length / memories.length : 0,
      avgRetainedUtility:
        retainedUtilities.length > 0
          ? retainedUtilities.reduce((a, b) => a + b, 0) / retainedUtilities.length
          : 0,
      avgPrunedUtility:
        prunedUtilities.length > 0
          ? prunedUtilities.reduce((a, b) => a + b, 0) / prunedUtilities.length
          : 0,
      iterations: result.iterations,
    };
  }

  /**
   * Calculate utility score for a single memory
   */
  calculateMemoryUtility(memory: ExtractedMemory): number {
    // Recency factor (exponential decay)
    const daysSince = (Date.now() - memory.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const recency = Math.exp(-daysSince * this.config.recencyDecay);

    // Type importance weight
    const typeWeight = this.config.typeWeights[memory.type] ?? 0.5;

    // Combine factors: confidence * recency * type weight
    return memory.confidence * recency * typeWeight;
  }

  /**
   * Calculate redundancy penalty for a memory
   */
  private calculateRedundancy(
    target: MemoryParticipation,
    all: MemoryParticipation[]
  ): number {
    let redundancy = 0;

    for (const other of all) {
      if (other === target) continue;

      const similarity = this.memorySimilarity(target.memory, other.memory);
      if (similarity > this.config.similarityThreshold) {
        // Higher redundancy if similar memory has high participation
        redundancy += similarity * other.participation;
      }
    }

    return redundancy;
  }

  /**
   * Calculate similarity between two memories
   */
  memorySimilarity(a: ExtractedMemory, b: ExtractedMemory): number {
    // Different types = low base similarity
    if (a.type !== b.type) return 0.1;

    // If both have embeddings, use cosine similarity
    if (a.embedding && b.embedding) {
      return this.cosineSimilarity(a.embedding, b.embedding);
    }

    // Fall back to word-based Jaccard similarity
    return this.jaccardSimilarity(a.content, b.content);
  }

  /**
   * Cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator > 0 ? dotProduct / denominator : 0;
  }

  /**
   * Jaccard similarity on word sets
   */
  private jaccardSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
    const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));

    if (wordsA.size === 0 && wordsB.size === 0) return 1;
    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    let intersection = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) intersection++;
    }

    const union = wordsA.size + wordsB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Normalize participations to fit within budget
   */
  private normalizeToBudget(participations: MemoryParticipation[]): void {
    const total = participations.reduce((s, p) => s + p.participation, 0);

    if (total > this.config.retentionBudget && total > 0) {
      const scale = this.config.retentionBudget / total;
      for (const p of participations) {
        p.participation *= scale;
      }
    }
  }

  /**
   * Find optimal memories for a query context
   * Combines relevance to query with equilibrium pruning
   */
  async findOptimalMemories(
    memories: ExtractedMemory[],
    query: string,
    maxCount: number
  ): Promise<ExtractedMemory[]> {
    if (memories.length === 0) return [];
    if (memories.length <= maxCount) return memories;

    // Boost utility based on query relevance
    const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(Boolean));

    const boostedMemories = memories.map((m) => {
      const contentWords = new Set(m.content.toLowerCase().split(/\s+/).filter(Boolean));
      let relevance = 0;

      for (const word of queryWords) {
        if (contentWords.has(word)) relevance++;
      }

      const relevanceBoost = queryWords.size > 0 ? relevance / queryWords.size : 0;

      // Create a temporary memory with boosted confidence for selection
      return {
        ...m,
        confidence: Math.min(1, m.confidence * (1 + relevanceBoost)),
      };
    });

    // Apply pruning with adjusted budget to get approximately maxCount
    const adjustedBudget = Math.min(1, (maxCount * 1.5) / memories.length);
    const tempConfig = { ...this.config, retentionBudget: adjustedBudget };
    const originalConfig = this.config;

    this.config = tempConfig;
    const result = await this.pruneWithDetails(boostedMemories);
    this.config = originalConfig;

    // Map back to original memories and limit to maxCount
    const retainedIds = new Set(result.retained.map((m) => m.id));
    return memories.filter((m) => retainedIds.has(m.id)).slice(0, maxCount);
  }
}

// ============================================================================
// Exports
// ============================================================================

export { DEFAULT_CONFIG as DEFAULT_MEMORY_EQUILIBRIUM_CONFIG };
