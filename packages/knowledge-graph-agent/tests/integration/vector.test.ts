/**
 * Vector System Integration Tests
 *
 * Comprehensive tests for EnhancedVectorStore and TrajectoryTracker
 * covering vector operations, HNSW search, hybrid search, batch operations,
 * and pattern detection.
 *
 * @module tests/integration/vector
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnhancedVectorStore, createVectorStore } from '../../src/vector/services/vector-store.js';
import { TrajectoryTracker, createTrajectoryTracker } from '../../src/vector/services/trajectory-tracker.js';
import type { RuVectorConfig } from '../../src/vector/config.js';
import type { VectorStoreEvent, SearchResult } from '../../src/vector/types.js';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Generate a normalized random vector of specified dimensions
 * Normalization ensures cosine similarity works correctly
 */
function generateRandomVector(dimensions: number): number[] {
  const vector = Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return norm > 0 ? vector.map(v => v / norm) : vector;
}

/**
 * Generate a vector similar to a base vector with controlled noise
 * @param base - Base vector to modify
 * @param noise - Noise factor (0-1, where 0 = identical, 1 = random)
 */
function generateSimilarVector(base: number[], noise: number): number[] {
  const noisy = base.map(v => v + (Math.random() * 2 - 1) * noise);
  const norm = Math.sqrt(noisy.reduce((sum, v) => sum + v * v, 0));
  return norm > 0 ? noisy.map(v => v / norm) : noisy;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Calculate Euclidean distance between two vectors
 */
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Create test configuration for vector store
 */
function createTestConfig(overrides: Partial<RuVectorConfig> = {}): Partial<RuVectorConfig> {
  return {
    backend: 'memory',
    index: {
      dimensions: 128,
      indexType: 'hnsw',
      distanceMetric: 'cosine',
      hnswConfig: {
        m: 16,
        efConstruction: 100,
        efSearch: 50,
      },
    },
    ...overrides,
  };
}

// ============================================================================
// EnhancedVectorStore Tests
// ============================================================================

describe('EnhancedVectorStore', () => {
  let store: EnhancedVectorStore;
  const dimensions = 128;

  beforeEach(async () => {
    store = createVectorStore(createTestConfig());
    await store.initialize();
  });

  afterEach(async () => {
    await store.clear();
  });

  // --------------------------------------------------------------------------
  // Initialization Tests
  // --------------------------------------------------------------------------

  describe('initialization', () => {
    it('should initialize the vector store successfully', async () => {
      const newStore = createVectorStore(createTestConfig());
      await newStore.initialize();

      expect(newStore.isReady()).toBe(true);
      expect(newStore.size()).toBe(0);
    });

    it('should be idempotent on multiple initialization calls', async () => {
      const newStore = createVectorStore(createTestConfig());

      await newStore.initialize();
      await newStore.initialize();
      await newStore.initialize();

      expect(newStore.isReady()).toBe(true);
    });

    it('should initialize with custom configuration', async () => {
      const customStore = createVectorStore({
        backend: 'memory',
        index: {
          dimensions: 256,
          indexType: 'hnsw',
          distanceMetric: 'euclidean',
          hnswConfig: { m: 32, efConstruction: 200, efSearch: 100 },
        },
      });
      await customStore.initialize();

      const config = customStore.getConfig();
      expect(config.index.dimensions).toBe(256);
      expect(config.index.distanceMetric).toBe('euclidean');
      expect(config.index.hnswConfig?.m).toBe(32);
    });

    it('should return correct stats after initialization', async () => {
      const stats = store.getStats();

      expect(stats.totalVectors).toBe(0);
      expect(stats.dimensions).toBe(dimensions);
      expect(stats.indexType).toBe('hnsw');
      expect(stats.indexStats?.levels).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // Vector Insertion and Retrieval Tests
  // --------------------------------------------------------------------------

  describe('vector insertion and retrieval', () => {
    it('should insert a single vector', async () => {
      const vector = generateRandomVector(dimensions);

      await store.insert({
        id: 'test-1',
        vector,
        metadata: { label: 'test' },
      });

      expect(store.size()).toBe(1);
      expect(store.has('test-1')).toBe(true);
    });

    it('should retrieve an inserted vector by ID', async () => {
      const vector = generateRandomVector(dimensions);
      const metadata = { label: 'test', count: 42 };

      await store.insert({ id: 'test-1', vector, metadata });

      const retrieved = await store.get('test-1');

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe('test-1');
      expect(retrieved!.vector).toEqual(vector);
      expect(retrieved!.metadata).toEqual(metadata);
      expect(retrieved!.createdAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent vector', async () => {
      const retrieved = await store.get('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should insert multiple vectors', async () => {
      const count = 50;

      for (let i = 0; i < count; i++) {
        await store.insert({
          id: `vec-${i}`,
          vector: generateRandomVector(dimensions),
          metadata: { index: i },
        });
      }

      expect(store.size()).toBe(count);
    });

    it('should throw on dimension mismatch', async () => {
      const wrongDimensions = generateRandomVector(dimensions + 10);

      await expect(
        store.insert({ id: 'wrong-dim', vector: wrongDimensions })
      ).rejects.toThrow('dimension mismatch');
    });

    it('should delete a vector by ID', async () => {
      await store.insert({
        id: 'to-delete',
        vector: generateRandomVector(dimensions),
      });

      expect(store.has('to-delete')).toBe(true);

      const deleted = await store.delete('to-delete');

      expect(deleted).toBe(true);
      expect(store.has('to-delete')).toBe(false);
      expect(store.size()).toBe(0);
    });

    it('should return false when deleting non-existent vector', async () => {
      const deleted = await store.delete('non-existent');
      expect(deleted).toBe(false);
    });

    it('should get all vector IDs', async () => {
      await store.insert({ id: 'a', vector: generateRandomVector(dimensions) });
      await store.insert({ id: 'b', vector: generateRandomVector(dimensions) });
      await store.insert({ id: 'c', vector: generateRandomVector(dimensions) });

      const ids = store.getAllIds();

      expect(ids).toHaveLength(3);
      expect(ids).toContain('a');
      expect(ids).toContain('b');
      expect(ids).toContain('c');
    });
  });

  // --------------------------------------------------------------------------
  // HNSW Approximate Nearest Neighbor Search Tests
  // --------------------------------------------------------------------------

  describe('HNSW approximate nearest neighbor search', () => {
    it('should find the exact match with highest score', async () => {
      const targetVector = generateRandomVector(dimensions);

      await store.insert({ id: 'target', vector: targetVector });

      for (let i = 0; i < 10; i++) {
        await store.insert({
          id: `random-${i}`,
          vector: generateRandomVector(dimensions),
        });
      }

      const results = await store.search({
        vector: targetVector,
        k: 1,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('target');
      expect(results[0].score).toBeGreaterThan(0.99);
    });

    it('should return k nearest neighbors in order', async () => {
      const queryVector = generateRandomVector(dimensions);

      // Insert vectors with known similarity levels
      const vectors = [
        { id: 'very-similar', vector: generateSimilarVector(queryVector, 0.05) },
        { id: 'similar', vector: generateSimilarVector(queryVector, 0.2) },
        { id: 'somewhat-similar', vector: generateSimilarVector(queryVector, 0.4) },
        { id: 'different', vector: generateSimilarVector(queryVector, 0.7) },
        { id: 'very-different', vector: generateRandomVector(dimensions) },
      ];

      for (const v of vectors) {
        await store.insert(v);
      }

      const results = await store.search({
        vector: queryVector,
        k: 3,
      });

      expect(results).toHaveLength(3);
      // Results should be sorted by score (descending)
      expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
      expect(results[1].score).toBeGreaterThanOrEqual(results[2].score);
    });

    it('should respect the k parameter', async () => {
      for (let i = 0; i < 20; i++) {
        await store.insert({
          id: `vec-${i}`,
          vector: generateRandomVector(dimensions),
        });
      }

      const results5 = await store.search({
        vector: generateRandomVector(dimensions),
        k: 5,
      });

      const results10 = await store.search({
        vector: generateRandomVector(dimensions),
        k: 10,
      });

      expect(results5).toHaveLength(5);
      expect(results10).toHaveLength(10);
    });

    it('should return fewer results when store has less than k vectors', async () => {
      await store.insert({ id: 'only-one', vector: generateRandomVector(dimensions) });

      const results = await store.search({
        vector: generateRandomVector(dimensions),
        k: 10,
      });

      expect(results).toHaveLength(1);
    });

    it('should return empty array for empty store', async () => {
      const results = await store.search({
        vector: generateRandomVector(dimensions),
        k: 5,
      });

      expect(results).toHaveLength(0);
    });

    it('should filter results by minimum score', async () => {
      const queryVector = generateRandomVector(dimensions);

      // Insert exact match and random vectors
      await store.insert({ id: 'exact', vector: queryVector });

      for (let i = 0; i < 10; i++) {
        await store.insert({
          id: `random-${i}`,
          vector: generateRandomVector(dimensions),
        });
      }

      const results = await store.search({
        vector: queryVector,
        k: 10,
        minScore: 0.9,
      });

      expect(results.length).toBeGreaterThan(0);
      results.forEach(r => {
        expect(r.score).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('should filter results by metadata', async () => {
      for (let i = 0; i < 20; i++) {
        await store.insert({
          id: `vec-${i}`,
          vector: generateRandomVector(dimensions),
          metadata: { category: i % 2 === 0 ? 'even' : 'odd' },
        });
      }

      const results = await store.search({
        vector: generateRandomVector(dimensions),
        k: 20,
        filter: { category: 'even' },
      });

      results.forEach(r => {
        expect(r.metadata.category).toBe('even');
      });
    });
  });

  // --------------------------------------------------------------------------
  // Distance Calculation Tests
  // --------------------------------------------------------------------------

  describe('distance calculations', () => {
    it('should calculate cosine similarity correctly', async () => {
      const vec1 = [1, 0, 0, 0];
      const vec2 = [1, 0, 0, 0];
      const vec3 = [0, 1, 0, 0];

      // Pad vectors to match dimensions
      const padded1 = [...vec1, ...Array(dimensions - 4).fill(0)];
      const padded2 = [...vec2, ...Array(dimensions - 4).fill(0)];
      const padded3 = [...vec3, ...Array(dimensions - 4).fill(0)];

      await store.insert({ id: 'same', vector: padded1 });
      await store.insert({ id: 'orthogonal', vector: padded3 });

      const results = await store.search({ vector: padded2, k: 2 });

      // Same vector should have score ~1, orthogonal should have score ~0.5 (after score conversion)
      expect(results.find(r => r.id === 'same')?.score).toBeGreaterThan(0.99);
    });

    it('should work with euclidean distance metric', async () => {
      const euclideanStore = createVectorStore({
        backend: 'memory',
        index: {
          dimensions: dimensions,
          indexType: 'hnsw',
          distanceMetric: 'euclidean',
          hnswConfig: { m: 16, efConstruction: 100, efSearch: 50 },
        },
      });
      await euclideanStore.initialize();

      const queryVector = generateRandomVector(dimensions);
      await euclideanStore.insert({ id: 'target', vector: queryVector });
      await euclideanStore.insert({ id: 'other', vector: generateRandomVector(dimensions) });

      const results = await euclideanStore.search({ vector: queryVector, k: 2 });

      expect(results[0].id).toBe('target');
      expect(results[0].score).toBeGreaterThan(results[1].score);

      await euclideanStore.clear();
    });

    it('should work with dot product distance metric', async () => {
      const dotStore = createVectorStore({
        backend: 'memory',
        index: {
          dimensions: dimensions,
          indexType: 'hnsw',
          distanceMetric: 'dotProduct',
          hnswConfig: { m: 16, efConstruction: 100, efSearch: 50 },
        },
      });
      await dotStore.initialize();

      const queryVector = generateRandomVector(dimensions);
      await dotStore.insert({ id: 'target', vector: queryVector });
      await dotStore.insert({ id: 'other', vector: generateRandomVector(dimensions) });

      const results = await dotStore.search({ vector: queryVector, k: 2 });

      expect(results[0].id).toBe('target');

      await dotStore.clear();
    });

    it('should work with manhattan distance metric', async () => {
      const manhattanStore = createVectorStore({
        backend: 'memory',
        index: {
          dimensions: dimensions,
          indexType: 'hnsw',
          distanceMetric: 'manhattan',
          hnswConfig: { m: 16, efConstruction: 100, efSearch: 50 },
        },
      });
      await manhattanStore.initialize();

      const queryVector = generateRandomVector(dimensions);
      await manhattanStore.insert({ id: 'target', vector: queryVector });
      await manhattanStore.insert({ id: 'other', vector: generateRandomVector(dimensions) });

      const results = await manhattanStore.search({ vector: queryVector, k: 2 });

      expect(results[0].id).toBe('target');

      await manhattanStore.clear();
    });
  });

  // --------------------------------------------------------------------------
  // Hybrid Search Tests
  // --------------------------------------------------------------------------

  describe('hybrid search (vector + keyword)', () => {
    it('should perform hybrid search without Cypher query', async () => {
      const queryVector = generateRandomVector(dimensions);

      await store.insert({
        id: 'doc-1',
        vector: queryVector,
        metadata: { title: 'Test Document', type: 'article' },
      });

      await store.insert({
        id: 'doc-2',
        vector: generateRandomVector(dimensions),
        metadata: { title: 'Another Document', type: 'report' },
      });

      const results = await store.hybridSearch({
        embedding: queryVector,
        limit: 5,
      });

      expect(results).toHaveLength(2);
      expect(results[0].source).toBe('vector');
      expect(results[0].id).toBe('doc-1');
    });

    it('should apply metadata filters in hybrid search', async () => {
      for (let i = 0; i < 10; i++) {
        await store.insert({
          id: `doc-${i}`,
          vector: generateRandomVector(dimensions),
          metadata: { type: i % 2 === 0 ? 'article' : 'report' },
        });
      }

      const results = await store.hybridSearch({
        embedding: generateRandomVector(dimensions),
        filters: { type: 'article' },
        limit: 10,
      });

      results.forEach(r => {
        expect(r.metadata.type).toBe('article');
      });
    });

    it('should apply minimum score filter in hybrid search', async () => {
      const queryVector = generateRandomVector(dimensions);
      await store.insert({ id: 'exact', vector: queryVector });

      for (let i = 0; i < 5; i++) {
        await store.insert({
          id: `random-${i}`,
          vector: generateRandomVector(dimensions),
        });
      }

      const results = await store.hybridSearch({
        embedding: queryVector,
        minScore: 0.95,
        limit: 10,
      });

      results.forEach(r => {
        expect(r.score).toBeGreaterThanOrEqual(0.95);
      });
    });

    it('should handle Cypher query placeholder gracefully', async () => {
      await store.insert({
        id: 'doc-1',
        vector: generateRandomVector(dimensions),
        metadata: { topic: 'AI' },
      });

      const results = await store.hybridSearch({
        embedding: generateRandomVector(dimensions),
        cypher: 'MATCH (n:Document) WHERE n.topic = $topic RETURN n.id',
        cypherParams: { topic: 'AI' },
        limit: 5,
      });

      // Should still return vector results with source as 'merged'
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].source).toBe('merged');
      expect(results[0].graphData).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // Batch Operations Tests
  // --------------------------------------------------------------------------

  describe('batch operations', () => {
    it('should batch insert multiple vectors', async () => {
      const entries = Array.from({ length: 100 }, (_, i) => ({
        id: `batch-${i}`,
        vector: generateRandomVector(dimensions),
        metadata: { index: i },
      }));

      const result = await store.batchInsert({ entries });

      expect(result.inserted).toBe(100);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(store.size()).toBe(100);
    });

    it('should track progress during batch insert', async () => {
      const entries = Array.from({ length: 50 }, (_, i) => ({
        id: `progress-${i}`,
        vector: generateRandomVector(dimensions),
      }));

      const progressCalls: Array<{ inserted: number; total: number }> = [];

      await store.batchInsert({
        entries,
        onProgress: (inserted, total) => {
          progressCalls.push({ inserted, total });
        },
      });

      expect(progressCalls.length).toBeGreaterThan(0);
      expect(progressCalls[progressCalls.length - 1].inserted).toBe(50);
    });

    it('should skip duplicates when skipDuplicates is true', async () => {
      // Insert initial entries
      await store.insert({
        id: 'existing',
        vector: generateRandomVector(dimensions),
      });

      const entries = [
        { id: 'existing', vector: generateRandomVector(dimensions) },
        { id: 'new-1', vector: generateRandomVector(dimensions) },
        { id: 'new-2', vector: generateRandomVector(dimensions) },
      ];

      const result = await store.batchInsert({
        entries,
        skipDuplicates: true,
      });

      expect(result.inserted).toBe(2);
      expect(result.skipped).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should report errors for duplicates when skipDuplicates is false', async () => {
      await store.insert({
        id: 'existing',
        vector: generateRandomVector(dimensions),
      });

      const entries = [
        { id: 'existing', vector: generateRandomVector(dimensions) },
        { id: 'new-1', vector: generateRandomVector(dimensions) },
      ];

      const result = await store.batchInsert({
        entries,
        skipDuplicates: false,
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].id).toBe('existing');
      expect(result.errors[0].error).toContain('Duplicate');
    });

    it('should include duration in batch result', async () => {
      const entries = Array.from({ length: 10 }, (_, i) => ({
        id: `duration-${i}`,
        vector: generateRandomVector(dimensions),
      }));

      const result = await store.batchInsert({ entries });

      expect(result.durationMs).toBeDefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases Tests
  // --------------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle empty store operations', async () => {
      expect(store.size()).toBe(0);
      expect(store.getAllIds()).toHaveLength(0);

      const stats = store.getStats();
      expect(stats.totalVectors).toBe(0);

      const results = await store.search({
        vector: generateRandomVector(dimensions),
        k: 5,
      });
      expect(results).toHaveLength(0);
    });

    it('should handle single item in store', async () => {
      await store.insert({
        id: 'only-one',
        vector: generateRandomVector(dimensions),
        metadata: { single: true },
      });

      expect(store.size()).toBe(1);

      const results = await store.search({
        vector: generateRandomVector(dimensions),
        k: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('only-one');
    });

    it('should clear all vectors', async () => {
      for (let i = 0; i < 20; i++) {
        await store.insert({
          id: `clear-${i}`,
          vector: generateRandomVector(dimensions),
        });
      }

      expect(store.size()).toBe(20);

      await store.clear();

      expect(store.size()).toBe(0);
      expect(store.getAllIds()).toHaveLength(0);
    });

    it('should handle deletion of entry point', async () => {
      // First inserted becomes entry point
      await store.insert({
        id: 'entry-point',
        vector: generateRandomVector(dimensions),
      });

      await store.insert({
        id: 'second',
        vector: generateRandomVector(dimensions),
      });

      // Delete entry point
      const deleted = await store.delete('entry-point');

      expect(deleted).toBe(true);
      expect(store.size()).toBe(1);

      // Should still be able to search
      const results = await store.search({
        vector: generateRandomVector(dimensions),
        k: 5,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('second');
    });

    it('should handle zero vectors gracefully', async () => {
      const zeroVector = Array(dimensions).fill(0);

      await store.insert({
        id: 'zero',
        vector: zeroVector,
        metadata: { type: 'zero' },
      });

      const retrieved = await store.get('zero');
      expect(retrieved).not.toBeNull();

      // Searching with zero vector should return results
      const results = await store.search({
        vector: zeroVector,
        k: 1,
      });

      expect(results).toHaveLength(1);
    });
  });

  // --------------------------------------------------------------------------
  // Event Listener Tests
  // --------------------------------------------------------------------------

  describe('event listeners', () => {
    it('should emit insert events', async () => {
      const events: VectorStoreEvent[] = [];
      store.on('insert', (event) => events.push(event));

      await store.insert({
        id: 'event-test',
        vector: generateRandomVector(dimensions),
      });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('insert');
      if (events[0].type === 'insert') {
        expect(events[0].id).toBe('event-test');
      }
    });

    it('should emit delete events', async () => {
      const events: VectorStoreEvent[] = [];
      store.on('delete', (event) => events.push(event));

      await store.insert({
        id: 'to-delete',
        vector: generateRandomVector(dimensions),
      });

      await store.delete('to-delete');

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('delete');
    });

    it('should emit search events', async () => {
      const events: VectorStoreEvent[] = [];
      store.on('search', (event) => events.push(event));

      await store.insert({
        id: 'searchable',
        vector: generateRandomVector(dimensions),
      });

      await store.search({
        vector: generateRandomVector(dimensions),
        k: 5,
      });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('search');
      if (events[0].type === 'search') {
        expect(events[0].resultCount).toBeDefined();
        expect(events[0].durationMs).toBeDefined();
      }
    });

    it('should support wildcard event listeners', async () => {
      const events: VectorStoreEvent[] = [];
      store.on('*', (event) => events.push(event));

      await store.insert({
        id: 'wildcard-test',
        vector: generateRandomVector(dimensions),
      });

      await store.search({
        vector: generateRandomVector(dimensions),
        k: 1,
      });

      expect(events.length).toBeGreaterThanOrEqual(2);
    });

    it('should remove event listeners', async () => {
      const events: VectorStoreEvent[] = [];
      const listener = (event: VectorStoreEvent) => events.push(event);

      store.on('insert', listener);

      await store.insert({
        id: 'first',
        vector: generateRandomVector(dimensions),
      });

      store.off('insert', listener);

      await store.insert({
        id: 'second',
        vector: generateRandomVector(dimensions),
      });

      expect(events).toHaveLength(1);
    });
  });

  // --------------------------------------------------------------------------
  // Statistics Tests
  // --------------------------------------------------------------------------

  describe('statistics', () => {
    it('should track memory usage estimation', async () => {
      for (let i = 0; i < 50; i++) {
        await store.insert({
          id: `mem-${i}`,
          vector: generateRandomVector(dimensions),
        });
      }

      const stats = store.getStats();

      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('should track average connections', async () => {
      for (let i = 0; i < 30; i++) {
        await store.insert({
          id: `conn-${i}`,
          vector: generateRandomVector(dimensions),
        });
      }

      const stats = store.getStats();

      expect(stats.indexStats?.avgConnections).toBeGreaterThan(0);
    });

    it('should update last updated timestamp', async () => {
      const statsBefore = store.getStats();

      await new Promise(resolve => setTimeout(resolve, 10));

      await store.insert({
        id: 'timestamp-test',
        vector: generateRandomVector(dimensions),
      });

      const statsAfter = store.getStats();

      expect(statsAfter.lastUpdated.getTime()).toBeGreaterThanOrEqual(
        statsBefore.lastUpdated.getTime()
      );
    });
  });
});

// ============================================================================
// TrajectoryTracker Tests
// ============================================================================

describe('TrajectoryTracker', () => {
  let tracker: TrajectoryTracker;

  beforeEach(() => {
    tracker = createTrajectoryTracker({
      maxTrajectories: 100,
      maxStepsPerTrajectory: 50,
      enableAutoLearning: true,
      patternThreshold: 2, // Lower threshold for testing
    });
  });

  afterEach(() => {
    tracker.clear();
  });

  // --------------------------------------------------------------------------
  // Trajectory Operations Tests
  // --------------------------------------------------------------------------

  describe('trajectory operations', () => {
    it('should start a new trajectory', () => {
      const trajectoryId = tracker.startTrajectory('agent-1');

      expect(trajectoryId).toBeDefined();
      expect(trajectoryId).toMatch(/^traj-/);

      const trajectory = tracker.getTrajectory(trajectoryId);
      expect(trajectory).not.toBeNull();
      expect(trajectory?.agentId).toBe('agent-1');
    });

    it('should start trajectory with workflow ID and metadata', () => {
      const trajectoryId = tracker.startTrajectory(
        'agent-1',
        'workflow-123',
        { source: 'test', priority: 'high' }
      );

      const trajectory = tracker.getTrajectory(trajectoryId);

      expect(trajectory?.workflowId).toBe('workflow-123');
      expect(trajectory?.metadata?.source).toBe('test');
      expect(trajectory?.metadata?.priority).toBe('high');
    });

    it('should add steps to a trajectory', () => {
      const trajectoryId = tracker.startTrajectory('agent-1');

      tracker.addStep(trajectoryId, {
        action: 'analyze_document',
        state: { documentId: 'doc-1', status: 'processing' },
        outcome: 'success',
        duration: 1000,
      });

      tracker.addStep(trajectoryId, {
        action: 'extract_entities',
        state: { entityCount: 10 },
        outcome: 'success',
        duration: 500,
      });

      const trajectory = tracker.getTrajectory(trajectoryId);

      expect(trajectory?.steps).toHaveLength(2);
      expect(trajectory?.steps[0].action).toBe('analyze_document');
      expect(trajectory?.steps[1].action).toBe('extract_entities');
    });

    it('should not add steps to non-existent trajectory', () => {
      tracker.addStep('non-existent', {
        action: 'test',
        state: {},
        outcome: 'success',
        duration: 100,
      });

      // Should not throw, just log warning
      const trajectory = tracker.getTrajectory('non-existent');
      expect(trajectory).toBeNull();
    });

    it('should finalize a trajectory successfully', async () => {
      const trajectoryId = tracker.startTrajectory('agent-1');

      // Add a small delay to ensure totalDuration is measurable
      await new Promise(resolve => setTimeout(resolve, 5));

      tracker.addStep(trajectoryId, {
        action: 'step1',
        state: {},
        outcome: 'success',
        duration: 100,
      });

      const finalized = tracker.finalizeTrajectory(trajectoryId, {
        success: true,
        metadata: { finalScore: 0.95 },
      });

      expect(finalized).not.toBeNull();
      expect(finalized?.success).toBe(true);
      expect(finalized?.completedAt).toBeInstanceOf(Date);
      expect(finalized?.totalDuration).toBeGreaterThanOrEqual(0);
      expect(finalized?.metadata?.finalScore).toBe(0.95);
    });

    it('should finalize a trajectory as failed', () => {
      const trajectoryId = tracker.startTrajectory('agent-1');

      tracker.addStep(trajectoryId, {
        action: 'failing_step',
        state: {},
        outcome: 'failure',
        duration: 50,
      });

      const finalized = tracker.finalizeTrajectory(trajectoryId, {
        success: false,
      });

      expect(finalized?.success).toBe(false);
    });

    it('should return null when finalizing non-existent trajectory', () => {
      const result = tracker.finalizeTrajectory('non-existent', { success: true });
      expect(result).toBeNull();
    });

    it('should enforce max steps per trajectory', () => {
      const limitedTracker = createTrajectoryTracker({
        maxStepsPerTrajectory: 3,
      });

      const trajectoryId = limitedTracker.startTrajectory('agent-1');

      for (let i = 0; i < 5; i++) {
        limitedTracker.addStep(trajectoryId, {
          action: `step-${i}`,
          state: {},
          outcome: 'success',
          duration: 100,
        });
      }

      const trajectory = limitedTracker.getTrajectory(trajectoryId);
      expect(trajectory?.steps).toHaveLength(3);
    });
  });

  // --------------------------------------------------------------------------
  // Pattern Detection Tests
  // --------------------------------------------------------------------------

  describe('pattern detection', () => {
    it('should detect patterns from repeated trajectories', () => {
      // Create multiple trajectories with the same action sequence
      for (let i = 0; i < 3; i++) {
        const trajectoryId = tracker.startTrajectory(`agent-${i}`);

        tracker.addStep(trajectoryId, {
          action: 'search',
          state: {},
          outcome: 'success',
          duration: 100,
        });

        tracker.addStep(trajectoryId, {
          action: 'analyze',
          state: {},
          outcome: 'success',
          duration: 200,
        });

        tracker.addStep(trajectoryId, {
          action: 'report',
          state: {},
          outcome: 'success',
          duration: 150,
        });

        tracker.finalizeTrajectory(trajectoryId, { success: true });
      }

      const patterns = tracker.getPatterns();

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].actions).toEqual(['search', 'analyze', 'report']);
    });

    it('should filter patterns by minimum confidence', () => {
      // Create patterns with different frequencies
      for (let i = 0; i < 10; i++) {
        const trajectoryId = tracker.startTrajectory(`agent-${i}`);

        tracker.addStep(trajectoryId, {
          action: 'common',
          state: {},
          outcome: 'success',
          duration: 100,
        });

        tracker.addStep(trajectoryId, {
          action: 'action',
          state: {},
          outcome: 'success',
          duration: 100,
        });

        tracker.finalizeTrajectory(trajectoryId, { success: true });
      }

      const highConfidence = tracker.getPatterns({ minConfidence: 0.8 });
      const allPatterns = tracker.getPatterns();

      expect(highConfidence.length).toBeLessThanOrEqual(allPatterns.length);
    });

    it('should filter patterns by type', () => {
      // Create successful trajectories
      for (let i = 0; i < 3; i++) {
        const trajectoryId = tracker.startTrajectory(`agent-${i}`);

        tracker.addStep(trajectoryId, {
          action: 'success-path',
          state: {},
          outcome: 'success',
          duration: 100,
        });

        tracker.addStep(trajectoryId, {
          action: 'complete',
          state: {},
          outcome: 'success',
          duration: 100,
        });

        tracker.finalizeTrajectory(trajectoryId, { success: true });
      }

      const successPatterns = tracker.getPatterns({ type: 'success' });

      expect(successPatterns.every(p => p.type === 'success')).toBe(true);
    });

    it('should provide action recommendations based on patterns', () => {
      // Create pattern: search -> analyze -> report
      for (let i = 0; i < 5; i++) {
        const trajectoryId = tracker.startTrajectory(`agent-${i}`);

        tracker.addStep(trajectoryId, {
          action: 'search',
          state: {},
          outcome: 'success',
          duration: 100,
        });

        tracker.addStep(trajectoryId, {
          action: 'analyze',
          state: {},
          outcome: 'success',
          duration: 200,
        });

        tracker.addStep(trajectoryId, {
          action: 'report',
          state: {},
          outcome: 'success',
          duration: 150,
        });

        tracker.finalizeTrajectory(trajectoryId, { success: true });
      }

      const recommendations = tracker.getRecommendedActions('search');

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].action).toBe('analyze');
      expect(recommendations[0].confidence).toBeGreaterThan(0);
    });

    it('should return empty recommendations for unknown actions', () => {
      const recommendations = tracker.getRecommendedActions('unknown_action');
      expect(recommendations).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // Learning Records Tests
  // --------------------------------------------------------------------------

  describe('learning records', () => {
    it('should create learning records when pattern threshold is met', () => {
      // Create enough trajectories to meet threshold
      for (let i = 0; i < 3; i++) {
        const trajectoryId = tracker.startTrajectory(`agent-${i}`);

        tracker.addStep(trajectoryId, {
          action: 'learn-action-1',
          state: {},
          outcome: 'success',
          duration: 100,
        });

        tracker.addStep(trajectoryId, {
          action: 'learn-action-2',
          state: {},
          outcome: 'success',
          duration: 100,
        });

        tracker.finalizeTrajectory(trajectoryId, { success: true });
      }

      const records = tracker.getLearningRecords();

      expect(records.length).toBeGreaterThan(0);
      expect(records[0].patternType).toBe('success');
      expect(records[0].confidence).toBeGreaterThan(0);
    });

    it('should filter learning records by pattern ID', () => {
      // Create trajectories
      for (let i = 0; i < 3; i++) {
        const trajectoryId = tracker.startTrajectory(`agent-${i}`);

        tracker.addStep(trajectoryId, {
          action: 'filter-test',
          state: {},
          outcome: 'success',
          duration: 100,
        });

        tracker.addStep(trajectoryId, {
          action: 'filter-complete',
          state: {},
          outcome: 'success',
          duration: 100,
        });

        tracker.finalizeTrajectory(trajectoryId, { success: true });
      }

      const allRecords = tracker.getLearningRecords();

      if (allRecords.length > 0) {
        const filtered = tracker.getLearningRecords({
          patternId: allRecords[0].patternId,
        });

        filtered.forEach(r => {
          expect(r.patternId).toBe(allRecords[0].patternId);
        });
      }
    });

    it('should filter learning records by date', () => {
      const beforeCreation = new Date();

      // Create a trajectory
      const trajectoryId = tracker.startTrajectory('agent-1');
      tracker.addStep(trajectoryId, {
        action: 'date-test-1',
        state: {},
        outcome: 'success',
        duration: 100,
      });
      tracker.addStep(trajectoryId, {
        action: 'date-test-2',
        state: {},
        outcome: 'success',
        duration: 100,
      });
      tracker.finalizeTrajectory(trajectoryId, { success: true });

      // Repeat to exceed threshold
      const trajectoryId2 = tracker.startTrajectory('agent-2');
      tracker.addStep(trajectoryId2, {
        action: 'date-test-1',
        state: {},
        outcome: 'success',
        duration: 100,
      });
      tracker.addStep(trajectoryId2, {
        action: 'date-test-2',
        state: {},
        outcome: 'success',
        duration: 100,
      });
      tracker.finalizeTrajectory(trajectoryId2, { success: true });

      const recordsSince = tracker.getLearningRecords({ since: beforeCreation });

      recordsSince.forEach(r => {
        expect(r.learnedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      });
    });
  });

  // --------------------------------------------------------------------------
  // Trajectory Query Tests
  // --------------------------------------------------------------------------

  describe('trajectory queries', () => {
    it('should get trajectories by agent ID', () => {
      const agent1Id1 = tracker.startTrajectory('agent-1', 'workflow-1');
      tracker.addStep(agent1Id1, { action: 'a', state: {}, outcome: 'success', duration: 100 });
      tracker.addStep(agent1Id1, { action: 'b', state: {}, outcome: 'success', duration: 100 });
      tracker.finalizeTrajectory(agent1Id1, { success: true });

      const agent1Id2 = tracker.startTrajectory('agent-1', 'workflow-2');
      tracker.addStep(agent1Id2, { action: 'c', state: {}, outcome: 'success', duration: 100 });
      tracker.addStep(agent1Id2, { action: 'd', state: {}, outcome: 'success', duration: 100 });
      tracker.finalizeTrajectory(agent1Id2, { success: true });

      const agent2Id = tracker.startTrajectory('agent-2', 'workflow-3');
      tracker.addStep(agent2Id, { action: 'e', state: {}, outcome: 'success', duration: 100 });
      tracker.addStep(agent2Id, { action: 'f', state: {}, outcome: 'success', duration: 100 });
      tracker.finalizeTrajectory(agent2Id, { success: true });

      const agent1Trajectories = tracker.getAgentTrajectories('agent-1');
      const agent2Trajectories = tracker.getAgentTrajectories('agent-2');

      expect(agent1Trajectories).toHaveLength(2);
      expect(agent2Trajectories).toHaveLength(1);
    });

    it('should get trajectories by workflow ID', () => {
      const traj1 = tracker.startTrajectory('agent-1', 'workflow-A');
      tracker.addStep(traj1, { action: 'x', state: {}, outcome: 'success', duration: 100 });
      tracker.addStep(traj1, { action: 'y', state: {}, outcome: 'success', duration: 100 });
      tracker.finalizeTrajectory(traj1, { success: true });

      const traj2 = tracker.startTrajectory('agent-2', 'workflow-A');
      tracker.addStep(traj2, { action: 'x', state: {}, outcome: 'success', duration: 100 });
      tracker.addStep(traj2, { action: 'y', state: {}, outcome: 'success', duration: 100 });
      tracker.finalizeTrajectory(traj2, { success: true });

      const traj3 = tracker.startTrajectory('agent-3', 'workflow-B');
      tracker.addStep(traj3, { action: 'z', state: {}, outcome: 'success', duration: 100 });
      tracker.addStep(traj3, { action: 'w', state: {}, outcome: 'success', duration: 100 });
      tracker.finalizeTrajectory(traj3, { success: true });

      const workflowATrajectories = tracker.getWorkflowTrajectories('workflow-A');

      expect(workflowATrajectories).toHaveLength(2);
      workflowATrajectories.forEach(t => {
        expect(t.workflowId).toBe('workflow-A');
      });
    });
  });

  // --------------------------------------------------------------------------
  // Statistics Tests
  // --------------------------------------------------------------------------

  describe('statistics', () => {
    it('should provide correct statistics', async () => {
      // Create some trajectories with small delays to ensure measurable durations
      const successId = tracker.startTrajectory('agent-1');
      await new Promise(resolve => setTimeout(resolve, 5));
      tracker.addStep(successId, { action: 'a', state: {}, outcome: 'success', duration: 100 });
      tracker.addStep(successId, { action: 'b', state: {}, outcome: 'success', duration: 100 });
      tracker.finalizeTrajectory(successId, { success: true });

      const failId = tracker.startTrajectory('agent-2');
      await new Promise(resolve => setTimeout(resolve, 5));
      tracker.addStep(failId, { action: 'c', state: {}, outcome: 'failure', duration: 50 });
      tracker.addStep(failId, { action: 'd', state: {}, outcome: 'success', duration: 50 });
      tracker.finalizeTrajectory(failId, { success: false });

      // Start but don't finalize
      tracker.startTrajectory('agent-3');

      const stats = tracker.getStats();

      expect(stats.activeTrajectories).toBe(1);
      expect(stats.completedTrajectories).toBe(2);
      expect(stats.successRate).toBe(0.5);
      expect(stats.avgDuration).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty tracker statistics', () => {
      const stats = tracker.getStats();

      expect(stats.activeTrajectories).toBe(0);
      expect(stats.completedTrajectories).toBe(0);
      expect(stats.detectedPatterns).toBe(0);
      expect(stats.learningRecords).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.avgDuration).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // Export/Import Tests
  // --------------------------------------------------------------------------

  describe('export and import', () => {
    it('should export trajectory data', () => {
      const trajectoryId = tracker.startTrajectory('agent-1');
      tracker.addStep(trajectoryId, { action: 'export-test', state: {}, outcome: 'success', duration: 100 });
      tracker.addStep(trajectoryId, { action: 'complete', state: {}, outcome: 'success', duration: 100 });
      tracker.finalizeTrajectory(trajectoryId, { success: true });

      // Create duplicate to trigger pattern and learning record
      const trajectoryId2 = tracker.startTrajectory('agent-2');
      tracker.addStep(trajectoryId2, { action: 'export-test', state: {}, outcome: 'success', duration: 100 });
      tracker.addStep(trajectoryId2, { action: 'complete', state: {}, outcome: 'success', duration: 100 });
      tracker.finalizeTrajectory(trajectoryId2, { success: true });

      const exported = tracker.export();

      expect(exported.trajectories).toHaveLength(2);
      expect(exported.patterns.length).toBeGreaterThan(0);
    });

    it('should import trajectory data', () => {
      const data = {
        trajectories: [
          {
            id: 'imported-1',
            agentId: 'agent-1',
            workflowId: 'workflow-1',
            steps: [
              { action: 'step1', state: {}, outcome: 'success' as const, duration: 100, timestamp: new Date() },
            ],
            startedAt: new Date(),
            completedAt: new Date(),
            success: true,
            totalDuration: 100,
          },
        ],
        patterns: [
          {
            id: 'pattern-1',
            type: 'success' as const,
            actions: ['step1', 'step2'],
            frequency: 5,
            avgDuration: 200,
            successRate: 0.9,
            confidence: 0.8,
            metadata: {},
          },
        ],
        learningRecords: [
          {
            trajectoryId: 'imported-1',
            patternId: 'pattern-1',
            patternType: 'success' as const,
            confidence: 0.8,
            learnedAt: new Date(),
            appliedCount: 0,
          },
        ],
      };

      tracker.import(data);

      const stats = tracker.getStats();
      expect(stats.completedTrajectories).toBe(1);
      expect(stats.detectedPatterns).toBe(1);
      expect(stats.learningRecords).toBe(1);
    });

    it('should clear all data', () => {
      const trajectoryId = tracker.startTrajectory('agent-1');
      tracker.addStep(trajectoryId, { action: 'clear-test', state: {}, outcome: 'success', duration: 100 });
      tracker.addStep(trajectoryId, { action: 'done', state: {}, outcome: 'success', duration: 100 });
      tracker.finalizeTrajectory(trajectoryId, { success: true });

      tracker.clear();

      const stats = tracker.getStats();
      expect(stats.activeTrajectories).toBe(0);
      expect(stats.completedTrajectories).toBe(0);
      expect(stats.detectedPatterns).toBe(0);
      expect(stats.learningRecords).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // Configuration Tests
  // --------------------------------------------------------------------------

  describe('configuration', () => {
    it('should respect maxTrajectories limit', () => {
      const limitedTracker = createTrajectoryTracker({
        maxTrajectories: 5,
      });

      for (let i = 0; i < 10; i++) {
        const trajectoryId = limitedTracker.startTrajectory(`agent-${i}`);
        limitedTracker.addStep(trajectoryId, {
          action: `action-${i}`,
          state: {},
          outcome: 'success',
          duration: 100,
        });
        limitedTracker.addStep(trajectoryId, {
          action: `done-${i}`,
          state: {},
          outcome: 'success',
          duration: 100,
        });
        limitedTracker.finalizeTrajectory(trajectoryId, { success: true });
      }

      const stats = limitedTracker.getStats();
      expect(stats.completedTrajectories).toBe(5);
    });

    it('should disable auto-learning when configured', () => {
      const noLearnTracker = createTrajectoryTracker({
        enableAutoLearning: false,
        patternThreshold: 1,
      });

      // Create multiple identical trajectories
      for (let i = 0; i < 5; i++) {
        const trajectoryId = noLearnTracker.startTrajectory(`agent-${i}`);
        noLearnTracker.addStep(trajectoryId, {
          action: 'no-learn',
          state: {},
          outcome: 'success',
          duration: 100,
        });
        noLearnTracker.addStep(trajectoryId, {
          action: 'complete',
          state: {},
          outcome: 'success',
          duration: 100,
        });
        noLearnTracker.finalizeTrajectory(trajectoryId, { success: true });
      }

      const records = noLearnTracker.getLearningRecords();
      // With auto-learning disabled, no records should be created
      expect(records).toHaveLength(0);
    });
  });
});

// ============================================================================
// Integration Tests: Vector Store + Trajectory Tracker Combined
// ============================================================================

describe('Vector System Integration', () => {
  let store: EnhancedVectorStore;
  let tracker: TrajectoryTracker;
  const dimensions = 64;

  beforeEach(async () => {
    store = createVectorStore({
      backend: 'memory',
      index: {
        dimensions,
        indexType: 'hnsw',
        distanceMetric: 'cosine',
        hnswConfig: { m: 16, efConstruction: 100, efSearch: 50 },
      },
    });
    await store.initialize();

    tracker = createTrajectoryTracker({
      maxTrajectories: 100,
      enableAutoLearning: true,
      patternThreshold: 2,
    });
  });

  afterEach(async () => {
    await store.clear();
    tracker.clear();
  });

  it('should track vector search operations in trajectories', async () => {
    // Insert test vectors
    for (let i = 0; i < 10; i++) {
      await store.insert({
        id: `doc-${i}`,
        vector: generateRandomVector(dimensions),
        metadata: { index: i },
      });
    }

    // Simulate agent workflow with trajectory tracking
    const trajectoryId = tracker.startTrajectory('search-agent', 'search-workflow');

    tracker.addStep(trajectoryId, {
      action: 'prepare_query',
      state: { queryType: 'semantic' },
      outcome: 'success',
      duration: 50,
    });

    const startTime = Date.now();
    const queryVector = generateRandomVector(dimensions);
    const results = await store.search({ vector: queryVector, k: 5 });
    const searchDuration = Date.now() - startTime;

    tracker.addStep(trajectoryId, {
      action: 'vector_search',
      state: { resultCount: results.length, topScore: results[0]?.score },
      outcome: 'success',
      duration: searchDuration,
    });

    tracker.addStep(trajectoryId, {
      action: 'process_results',
      state: { processedCount: results.length },
      outcome: 'success',
      duration: 30,
    });

    const trajectory = tracker.finalizeTrajectory(trajectoryId, { success: true });

    expect(trajectory).not.toBeNull();
    expect(trajectory?.steps).toHaveLength(3);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('should learn patterns from repeated vector operations', async () => {
    // Insert vectors
    for (let i = 0; i < 20; i++) {
      await store.insert({
        id: `pattern-doc-${i}`,
        vector: generateRandomVector(dimensions),
      });
    }

    // Repeat the same workflow multiple times
    for (let run = 0; run < 5; run++) {
      const trajectoryId = tracker.startTrajectory(`agent-${run}`, 'pattern-workflow');

      tracker.addStep(trajectoryId, {
        action: 'index_documents',
        state: { count: 5 },
        outcome: 'success',
        duration: 100,
      });

      await store.search({
        vector: generateRandomVector(dimensions),
        k: 3,
      });

      tracker.addStep(trajectoryId, {
        action: 'search_similar',
        state: { k: 3 },
        outcome: 'success',
        duration: 50,
      });

      tracker.addStep(trajectoryId, {
        action: 'rank_results',
        state: {},
        outcome: 'success',
        duration: 20,
      });

      tracker.finalizeTrajectory(trajectoryId, { success: true });
    }

    // Check that patterns were learned
    const patterns = tracker.getPatterns();
    expect(patterns.length).toBeGreaterThan(0);

    // Get recommendations based on learned patterns
    const recommendations = tracker.getRecommendedActions('index_documents');
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].action).toBe('search_similar');
  });

  it('should handle concurrent vector operations with trajectory tracking', async () => {
    const operations = 20;
    const trajectories: string[] = [];

    // Start multiple trajectories
    for (let i = 0; i < operations; i++) {
      const trajectoryId = tracker.startTrajectory(`concurrent-agent-${i}`);
      trajectories.push(trajectoryId);
    }

    // Perform concurrent inserts
    await Promise.all(
      trajectories.map(async (trajectoryId, i) => {
        const vector = generateRandomVector(dimensions);

        tracker.addStep(trajectoryId, {
          action: 'generate_embedding',
          state: { dimension: dimensions },
          outcome: 'success',
          duration: 10,
        });

        await store.insert({
          id: `concurrent-${i}`,
          vector,
          metadata: { batch: i },
        });

        tracker.addStep(trajectoryId, {
          action: 'store_vector',
          state: { vectorId: `concurrent-${i}` },
          outcome: 'success',
          duration: 5,
        });
      })
    );

    // Finalize all trajectories
    for (const trajectoryId of trajectories) {
      tracker.finalizeTrajectory(trajectoryId, { success: true });
    }

    expect(store.size()).toBe(operations);
    expect(tracker.getStats().completedTrajectories).toBe(operations);
  });
});
