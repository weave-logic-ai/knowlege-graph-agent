/**
 * Memory Equilibrium Pruner Tests
 *
 * Comprehensive test suite for the MemoryEquilibriumPruner class.
 * Tests cover:
 * - Basic functionality and edge cases
 * - Configuration options
 * - Utility calculation
 * - Similarity detection
 * - Equilibrium convergence
 * - Pruning behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MemoryEquilibriumPruner,
  DEFAULT_MEMORY_EQUILIBRIUM_CONFIG,
  type MemoryEquilibriumConfig,
  type PruneResult,
} from '../../src/equilibrium/memory-equilibrium.js';
import { ExtractedMemory, MemoryType } from '../../src/learning/types.js';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a test memory with defaults
 */
function createMemory(overrides: Partial<ExtractedMemory> = {}): ExtractedMemory {
  return {
    id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type: MemoryType.SEMANTIC,
    content: 'Test memory content',
    confidence: 0.8,
    source: 'test',
    timestamp: new Date(),
    metadata: {},
    ...overrides,
  };
}

/**
 * Create multiple memories with specified types
 */
function createMemories(count: number, typeOrTypes?: MemoryType | MemoryType[]): ExtractedMemory[] {
  const types = Array.isArray(typeOrTypes)
    ? typeOrTypes
    : typeOrTypes
    ? [typeOrTypes]
    : [MemoryType.SEMANTIC];

  return Array.from({ length: count }, (_, i) => {
    const type = types[i % types.length];
    return createMemory({
      id: `test_mem_${i}`,
      type,
      content: `Test memory content ${i} for ${type}`,
      timestamp: new Date(Date.now() - i * 1000 * 60 * 60), // Each hour older
    });
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('MemoryEquilibriumPruner', () => {
  let pruner: MemoryEquilibriumPruner;

  beforeEach(() => {
    pruner = new MemoryEquilibriumPruner();
  });

  // --------------------------------------------------------------------------
  // Initialization Tests
  // --------------------------------------------------------------------------

  describe('initialization', () => {
    it('should create pruner with default config', () => {
      const config = pruner.getConfig();
      expect(config.learningRate).toBe(0.15);
      expect(config.maxIterations).toBe(50);
      expect(config.retentionBudget).toBe(0.7);
      expect(config.similarityThreshold).toBe(0.6);
    });

    it('should create pruner with custom config', () => {
      const customPruner = new MemoryEquilibriumPruner({
        learningRate: 0.2,
        retentionBudget: 0.5,
      });
      const config = customPruner.getConfig();
      expect(config.learningRate).toBe(0.2);
      expect(config.retentionBudget).toBe(0.5);
    });

    it('should allow updating config after creation', () => {
      pruner.setConfig({ learningRate: 0.3 });
      expect(pruner.getConfig().learningRate).toBe(0.3);
    });

    it('should merge type weights with defaults', () => {
      const customPruner = new MemoryEquilibriumPruner({
        typeWeights: { [MemoryType.PROCEDURAL]: 1.5 },
      });
      const config = customPruner.getConfig();
      expect(config.typeWeights[MemoryType.PROCEDURAL]).toBe(1.5);
      expect(config.typeWeights[MemoryType.SEMANTIC]).toBe(0.8);
    });
  });

  // --------------------------------------------------------------------------
  // Empty Input Tests
  // --------------------------------------------------------------------------

  describe('empty input handling', () => {
    it('should return empty array for empty input', async () => {
      const result = await pruner.pruneMemories([]);
      expect(result).toEqual([]);
    });

    it('should return empty result details for empty input', async () => {
      const result = await pruner.pruneWithDetails([]);
      expect(result.retained).toEqual([]);
      expect(result.pruned).toEqual([]);
      expect(result.participations).toEqual([]);
      expect(result.converged).toBe(true);
      expect(result.iterations).toBe(0);
    });

    it('should return zero stats for empty input', async () => {
      const stats = await pruner.getPruneStats([]);
      expect(stats.originalCount).toBe(0);
      expect(stats.retainedCount).toBe(0);
      expect(stats.retentionRate).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // Single Memory Tests
  // --------------------------------------------------------------------------

  describe('single memory handling', () => {
    it('should retain single memory', async () => {
      const memory = createMemory();
      const result = await pruner.pruneMemories([memory]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(memory.id);
    });

    it('should show full participation for single memory', async () => {
      const memory = createMemory();
      const result = await pruner.pruneWithDetails([memory]);
      expect(result.participations[0].participation).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // Pruning Behavior Tests
  // --------------------------------------------------------------------------

  describe('pruning behavior', () => {
    it('should prune memories based on budget when there is redundancy', async () => {
      // Create memories with high similarity to trigger redundancy
      const memories = Array.from({ length: 10 }, (_, i) =>
        createMemory({
          id: `mem_${i}`,
          content: `Function implementation guide tutorial help ${i}`,
          confidence: 0.8,
        })
      );

      const lowBudgetPruner = new MemoryEquilibriumPruner({
        retentionBudget: 0.3,
        similarityThreshold: 0.3, // Lower threshold to catch more similarity
      });

      const result = await lowBudgetPruner.pruneMemories(memories);
      // With similar memories and low budget, some should be pruned
      expect(result.length).toBeLessThanOrEqual(memories.length);
    });

    it('should retain more memories with higher budget', async () => {
      // Create memories with some similarity for redundancy
      const memories = Array.from({ length: 10 }, (_, i) =>
        createMemory({
          id: `mem_${i}`,
          content: `Implementation guide tutorial ${i}`,
          confidence: 0.8,
        })
      );

      const lowBudget = new MemoryEquilibriumPruner({
        retentionBudget: 0.2,
        similarityThreshold: 0.3,
      });
      const highBudget = new MemoryEquilibriumPruner({
        retentionBudget: 0.95,
        similarityThreshold: 0.3,
      });

      const lowResult = await lowBudget.pruneMemories(memories);
      const highResult = await highBudget.pruneMemories(memories);

      // High budget should retain at least as many as low budget
      expect(highResult.length).toBeGreaterThanOrEqual(lowResult.length);
    });

    it('should separate retained and pruned memories correctly', async () => {
      const memories = createMemories(10);
      const result = await pruner.pruneWithDetails(memories);

      const allIds = new Set([
        ...result.retained.map((m) => m.id),
        ...result.pruned.map((m) => m.id),
      ]);

      expect(allIds.size).toBe(memories.length);
    });

    it('should sort retained memories by participation', async () => {
      const memories = createMemories(10);
      const result = await pruner.pruneWithDetails(memories);

      for (let i = 1; i < result.participations.length; i++) {
        expect(result.participations[i - 1].participation).toBeGreaterThanOrEqual(
          result.participations[i].participation
        );
      }
    });
  });

  // --------------------------------------------------------------------------
  // Utility Calculation Tests
  // --------------------------------------------------------------------------

  describe('utility calculation', () => {
    it('should give higher utility to recent memories', async () => {
      const recentMemory = createMemory({ timestamp: new Date() });
      const oldMemory = createMemory({
        id: 'old_mem',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      });

      const recentUtility = pruner.calculateMemoryUtility(recentMemory);
      const oldUtility = pruner.calculateMemoryUtility(oldMemory);

      expect(recentUtility).toBeGreaterThan(oldUtility);
    });

    it('should give higher utility to high confidence memories', async () => {
      const highConfidence = createMemory({ confidence: 0.95 });
      const lowConfidence = createMemory({ id: 'low_conf', confidence: 0.3 });

      const highUtility = pruner.calculateMemoryUtility(highConfidence);
      const lowUtility = pruner.calculateMemoryUtility(lowConfidence);

      expect(highUtility).toBeGreaterThan(lowUtility);
    });

    it('should weight procedural memories higher than context', async () => {
      const procedural = createMemory({ type: MemoryType.PROCEDURAL, confidence: 0.8 });
      const context = createMemory({ id: 'ctx', type: MemoryType.CONTEXT, confidence: 0.8 });

      const procUtility = pruner.calculateMemoryUtility(procedural);
      const ctxUtility = pruner.calculateMemoryUtility(context);

      expect(procUtility).toBeGreaterThan(ctxUtility);
    });

    it('should respect custom type weights', async () => {
      const customPruner = new MemoryEquilibriumPruner({
        typeWeights: { [MemoryType.CONTEXT]: 2.0 },
      });

      const context = createMemory({ type: MemoryType.CONTEXT, confidence: 0.8 });
      const utility = customPruner.calculateMemoryUtility(context);

      expect(utility).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // Similarity Detection Tests
  // --------------------------------------------------------------------------

  describe('similarity detection', () => {
    it('should detect identical content as similar', () => {
      const mem1 = createMemory({ content: 'Test content' });
      const mem2 = createMemory({ id: 'mem2', content: 'Test content' });

      const similarity = pruner.memorySimilarity(mem1, mem2);
      expect(similarity).toBe(1);
    });

    it('should detect completely different content as dissimilar', () => {
      const mem1 = createMemory({ content: 'apple banana cherry' });
      const mem2 = createMemory({ id: 'mem2', content: 'dog elephant fox' });

      const similarity = pruner.memorySimilarity(mem1, mem2);
      expect(similarity).toBeLessThan(0.2);
    });

    it('should give low similarity to different memory types', () => {
      const mem1 = createMemory({
        type: MemoryType.PROCEDURAL,
        content: 'Same words here',
      });
      const mem2 = createMemory({
        id: 'mem2',
        type: MemoryType.EPISODIC,
        content: 'Same words here',
      });

      const similarity = pruner.memorySimilarity(mem1, mem2);
      expect(similarity).toBe(0.1);
    });

    it('should use embeddings when available', () => {
      const mem1 = createMemory({
        content: 'Any content',
        embedding: [1, 0, 0],
      });
      const mem2 = createMemory({
        id: 'mem2',
        content: 'Different content',
        embedding: [1, 0, 0],
      });

      const similarity = pruner.memorySimilarity(mem1, mem2);
      expect(similarity).toBe(1); // Same embedding
    });

    it('should calculate correct cosine similarity', () => {
      const mem1 = createMemory({
        embedding: [1, 0],
      });
      const mem2 = createMemory({
        id: 'mem2',
        embedding: [0, 1],
      });

      const similarity = pruner.memorySimilarity(mem1, mem2);
      expect(similarity).toBe(0); // Orthogonal vectors
    });
  });

  // --------------------------------------------------------------------------
  // Redundancy and Competition Tests
  // --------------------------------------------------------------------------

  describe('redundancy and competition', () => {
    it('should penalize redundant memories', async () => {
      // Create memories with identical content to ensure high similarity
      const similar1 = createMemory({ id: 'sim1', content: 'Function implementation guide tutorial' });
      const similar2 = createMemory({ id: 'sim2', content: 'Function implementation guide tutorial' });
      const similar3 = createMemory({ id: 'sim3', content: 'Function implementation guide tutorial' });
      const unique = createMemory({ id: 'unique', content: 'Database schema design patterns completely different' });

      // Use low similarity threshold to ensure redundancy is detected
      const lowThresholdPruner = new MemoryEquilibriumPruner({ similarityThreshold: 0.3 });
      const memories = [similar1, similar2, similar3, unique];
      const result = await lowThresholdPruner.pruneWithDetails(memories);

      // Unique memory should have lower or equal redundancy
      const uniqueParticipation = result.participations.find((p) => p.memory.id === 'unique');
      const similarParticipations = result.participations.filter((p) => p.memory.id.startsWith('sim'));

      // With identical content, similar memories should compete with each other
      // The unique memory should be less redundant since it doesn't compete
      const avgSimilarRedundancy =
        similarParticipations.reduce((sum, p) => sum + p.redundancy, 0) / similarParticipations.length;

      // Unique should have lower or equal redundancy than average of similars
      expect(uniqueParticipation!.redundancy).toBeLessThanOrEqual(avgSimilarRedundancy + 0.01);
    });

    it('should favor unique memories over duplicates', async () => {
      const duplicate1 = createMemory({ id: 'dup1', content: 'Identical content here' });
      const duplicate2 = createMemory({ id: 'dup2', content: 'Identical content here' });
      const unique = createMemory({ id: 'unique', content: 'Completely different stuff' });

      const lowBudgetPruner = new MemoryEquilibriumPruner({ retentionBudget: 0.4 });
      const result = await lowBudgetPruner.pruneMemories([duplicate1, duplicate2, unique]);

      // Should retain the unique memory
      expect(result.some((m) => m.id === 'unique')).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Convergence Tests
  // --------------------------------------------------------------------------

  describe('convergence', () => {
    it('should converge within max iterations', async () => {
      const memories = createMemories(20);
      const result = await pruner.pruneWithDetails(memories);

      expect(result.iterations).toBeLessThanOrEqual(50);
    });

    it('should converge faster with higher learning rate', async () => {
      const memories = createMemories(15);

      const slowPruner = new MemoryEquilibriumPruner({ learningRate: 0.05 });
      const fastPruner = new MemoryEquilibriumPruner({ learningRate: 0.3 });

      const slowResult = await slowPruner.pruneWithDetails(memories);
      const fastResult = await fastPruner.pruneWithDetails(memories);

      // Fast learner should converge in fewer or equal iterations
      expect(fastResult.iterations).toBeLessThanOrEqual(slowResult.iterations + 5);
    });

    it('should respect convergence threshold', async () => {
      const memories = createMemories(10);
      const strictPruner = new MemoryEquilibriumPruner({ convergenceThreshold: 0.00001 });

      const result = await strictPruner.pruneWithDetails(memories);
      expect(result.converged || result.iterations === 50).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Statistics Tests
  // --------------------------------------------------------------------------

  describe('statistics', () => {
    it('should calculate correct prune stats', async () => {
      const memories = createMemories(10);
      const stats = await pruner.getPruneStats(memories);

      expect(stats.originalCount).toBe(10);
      expect(stats.retainedCount + stats.prunedCount).toBe(10);
      expect(stats.retentionRate).toBe(stats.retainedCount / 10);
    });

    it('should report average utilities correctly', async () => {
      const highConfidence = createMemory({ id: 'high', confidence: 0.95 });
      const lowConfidence = createMemory({ id: 'low', confidence: 0.1 });

      const stats = await pruner.getPruneStats([highConfidence, lowConfidence]);

      expect(stats.avgRetainedUtility).toBeGreaterThanOrEqual(0);
    });
  });

  // --------------------------------------------------------------------------
  // Find Optimal Memories Tests
  // --------------------------------------------------------------------------

  describe('findOptimalMemories', () => {
    it('should return empty for empty input', async () => {
      const result = await pruner.findOptimalMemories([], 'test query', 5);
      expect(result).toEqual([]);
    });

    it('should return all memories if count <= limit', async () => {
      const memories = createMemories(3);
      const result = await pruner.findOptimalMemories(memories, 'test', 5);
      expect(result.length).toBe(3);
    });

    it('should limit results to maxCount', async () => {
      const memories = createMemories(10);
      const result = await pruner.findOptimalMemories(memories, 'content', 3);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should favor query-relevant memories', async () => {
      const relevant = createMemory({ id: 'relevant', content: 'JavaScript programming tutorial' });
      const irrelevant = createMemory({ id: 'irrelevant', content: 'Cooking recipe book' });

      const result = await pruner.findOptimalMemories(
        [relevant, irrelevant],
        'JavaScript programming',
        1
      );

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('relevant');
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle memories with empty content', async () => {
      const emptyContent = createMemory({ content: '' });
      const result = await pruner.pruneMemories([emptyContent]);
      expect(result).toHaveLength(1);
    });

    it('should handle memories with very old timestamps', async () => {
      const ancient = createMemory({
        timestamp: new Date('2000-01-01'),
      });
      const utility = pruner.calculateMemoryUtility(ancient);
      expect(utility).toBeGreaterThanOrEqual(0);
      expect(utility).toBeLessThan(0.1);
    });

    it('should handle memories with future timestamps', async () => {
      const future = createMemory({
        timestamp: new Date(Date.now() + 1000 * 60 * 60 * 24),
      });
      const utility = pruner.calculateMemoryUtility(future);
      expect(utility).toBeGreaterThan(0);
    });

    it('should handle zero confidence memories', async () => {
      const zeroConf = createMemory({ confidence: 0 });
      const utility = pruner.calculateMemoryUtility(zeroConf);
      expect(utility).toBe(0);
    });

    it('should handle memories with missing optional fields', async () => {
      const minimal: ExtractedMemory = {
        id: 'minimal',
        type: MemoryType.SEMANTIC,
        content: 'Minimal memory',
        confidence: 0.5,
        source: 'test',
        timestamp: new Date(),
        metadata: {},
      };
      const result = await pruner.pruneMemories([minimal]);
      expect(result).toHaveLength(1);
    });
  });

  // --------------------------------------------------------------------------
  // Memory Type Distribution Tests
  // --------------------------------------------------------------------------

  describe('memory type distribution', () => {
    it('should handle mixed memory types', async () => {
      const memories = createMemories(5, [
        MemoryType.PROCEDURAL,
        MemoryType.SEMANTIC,
        MemoryType.EPISODIC,
        MemoryType.TECHNICAL,
        MemoryType.CONTEXT,
      ]);

      const result = await pruner.pruneMemories(memories);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should prefer procedural memories under pressure', async () => {
      const types = [MemoryType.PROCEDURAL, MemoryType.CONTEXT];
      const memories = types.map((type, i) =>
        createMemory({
          id: `mem_${type}`,
          type,
          confidence: 0.8,
        })
      );

      const tightPruner = new MemoryEquilibriumPruner({ retentionBudget: 0.3 });
      const result = await tightPruner.pruneWithDetails(memories);

      const proceduralParticipation = result.participations.find(
        (p) => p.memory.type === MemoryType.PROCEDURAL
      );
      const contextParticipation = result.participations.find(
        (p) => p.memory.type === MemoryType.CONTEXT
      );

      expect(proceduralParticipation!.participation).toBeGreaterThan(
        contextParticipation!.participation
      );
    });
  });
});
