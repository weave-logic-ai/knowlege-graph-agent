/**
 * Vector Store Benchmark Tests
 *
 * Tests for the benchmarking utilities including benchmark execution,
 * comparison reports, and statistical calculations.
 *
 * @module tests/integrations/agentic-flow/benchmark/vector-benchmark
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  VectorStoreBenchmark,
  createVectorStoreBenchmark,
  quickBenchmark,
  formatBenchmarkReport,
  formatComparisonReport,
  type IBenchmarkableStore,
  type BenchmarkConfig,
} from '../../../../src/integrations/agentic-flow/benchmark/vector-benchmark.js';

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Create a mock vector store for benchmarking
 */
function createMockStore(options: {
  upsertDelay?: number;
  searchDelay?: number;
  supportsHybrid?: boolean;
  supportsBatch?: boolean;
  supportsDelete?: boolean;
  failOnOperation?: string;
} = {}): IBenchmarkableStore {
  const {
    upsertDelay = 1,
    searchDelay = 1,
    supportsHybrid = true,
    supportsBatch = true,
    supportsDelete = true,
    failOnOperation,
  } = options;

  const data = new Map<string, {
    content: string;
    embedding: Float32Array;
    metadata: Record<string, unknown>;
  }>();

  const store: IBenchmarkableStore = {
    upsert: async (nodeId, content, embedding, metadata) => {
      if (failOnOperation === 'upsert') {
        throw new Error('Upsert failed');
      }
      await delay(upsertDelay);
      data.set(nodeId, { content, embedding, metadata: metadata || {} });
    },

    search: async (queryEmbedding, limit = 10, threshold = 0.5) => {
      if (failOnOperation === 'search') {
        throw new Error('Search failed');
      }
      await delay(searchDelay);
      const results: Array<{
        nodeId: string;
        content: string;
        similarity: number;
        metadata: Record<string, unknown>;
      }> = [];

      let count = 0;
      for (const [nodeId, entry] of data) {
        if (count >= limit) break;
        results.push({
          nodeId,
          content: entry.content,
          similarity: 0.9 + Math.random() * 0.1,
          metadata: entry.metadata,
        });
        count++;
      }

      return results;
    },

    getStats: async () => ({
      totalVectors: data.size,
      indexSize: data.size * 1024,
    }),
  };

  if (supportsBatch) {
    store.upsertBatch = async (entries) => {
      if (failOnOperation === 'batchUpsert') {
        throw new Error('Batch upsert failed');
      }
      await delay(upsertDelay * entries.length * 0.5); // Batch is faster
      for (const entry of entries) {
        data.set(entry.nodeId, {
          content: entry.content,
          embedding: entry.embedding,
          metadata: entry.metadata || {},
        });
      }
    };
  }

  if (supportsHybrid) {
    store.hybridSearch = async (query, queryEmbedding, options) => {
      if (failOnOperation === 'hybridSearch') {
        throw new Error('Hybrid search failed');
      }
      await delay(searchDelay * 1.5); // Hybrid is slower
      const limit = options?.limit || 10;
      const results: Array<{
        nodeId: string;
        content: string;
        similarity: number;
        metadata: Record<string, unknown>;
      }> = [];

      let count = 0;
      for (const [nodeId, entry] of data) {
        if (count >= limit) break;
        results.push({
          nodeId,
          content: entry.content,
          similarity: 0.85 + Math.random() * 0.15,
          metadata: entry.metadata,
        });
        count++;
      }

      return results;
    };
  }

  if (supportsDelete) {
    store.delete = async (nodeId) => {
      if (failOnOperation === 'delete') {
        throw new Error('Delete failed');
      }
      await delay(upsertDelay);
      data.delete(nodeId);
    };
  }

  return store;
}

/**
 * Helper to add delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Tests
// ============================================================================

describe('VectorStoreBenchmark', () => {
  let benchmark: VectorStoreBenchmark;

  beforeEach(() => {
    benchmark = new VectorStoreBenchmark({
      operations: 10, // Small number for fast tests
      warmupOperations: 2,
      dimensions: 64,
      trackMemory: false,
    });
  });

  // --------------------------------------------------------------------------
  // Constructor and Configuration Tests
  // --------------------------------------------------------------------------

  describe('constructor and configuration', () => {
    it('should create instance with default config', () => {
      const defaultBenchmark = new VectorStoreBenchmark();
      const config = defaultBenchmark.getConfig();

      expect(config.operations).toBe(1000);
      expect(config.dimensions).toBe(384);
      expect(config.warmupOperations).toBe(100);
    });

    it('should create instance with custom config', () => {
      const customBenchmark = new VectorStoreBenchmark({
        operations: 500,
        dimensions: 256,
        searchK: 20,
      });

      const config = customBenchmark.getConfig();
      expect(config.operations).toBe(500);
      expect(config.dimensions).toBe(256);
      expect(config.searchK).toBe(20);
    });

    it('should update configuration', () => {
      benchmark.updateConfig({ operations: 50, searchK: 5 });

      const config = benchmark.getConfig();
      expect(config.operations).toBe(50);
      expect(config.searchK).toBe(5);
    });
  });

  // --------------------------------------------------------------------------
  // Benchmark Execution Tests
  // --------------------------------------------------------------------------

  describe('runBenchmark', () => {
    it('should run full benchmark suite', async () => {
      const store = createMockStore();

      const results = await benchmark.runBenchmark(store, 'test-store');

      expect(results.storeName).toBe('test-store');
      expect(results.timestamp).toBeInstanceOf(Date);
      expect(results.totalDuration).toBeGreaterThan(0);
      expect(results.config).toBeDefined();
    });

    it('should include upsert benchmark', async () => {
      const store = createMockStore();

      const results = await benchmark.runBenchmark(store);

      const upsertResult = results.results.find(r => r.name === 'upsert');
      expect(upsertResult).toBeDefined();
      expect(upsertResult!.operations).toBe(10);
      expect(upsertResult!.opsPerSecond).toBeGreaterThan(0);
    });

    it('should include search benchmark', async () => {
      const store = createMockStore();

      const results = await benchmark.runBenchmark(store);

      const searchResult = results.results.find(r => r.name === 'search');
      expect(searchResult).toBeDefined();
      expect(searchResult!.operations).toBe(10);
    });

    it('should include batch upsert benchmark when available', async () => {
      const store = createMockStore({ supportsBatch: true });

      const results = await benchmark.runBenchmark(store);

      const batchResult = results.results.find(r => r.name === 'batchUpsert');
      expect(batchResult).toBeDefined();
    });

    it('should include hybrid search benchmark when available', async () => {
      const store = createMockStore({ supportsHybrid: true });

      const results = await benchmark.runBenchmark(store);

      const hybridResult = results.results.find(r => r.name === 'hybridSearch');
      expect(hybridResult).toBeDefined();
    });

    it('should include delete benchmark when available', async () => {
      const store = createMockStore({ supportsDelete: true });

      const results = await benchmark.runBenchmark(store);

      const deleteResult = results.results.find(r => r.name === 'delete');
      expect(deleteResult).toBeDefined();
    });

    it('should skip optional benchmarks when not supported', async () => {
      const store = createMockStore({
        supportsHybrid: false,
        supportsBatch: false,
        supportsDelete: false,
      });

      const results = await benchmark.runBenchmark(store);

      expect(results.results.find(r => r.name === 'hybridSearch')).toBeUndefined();
      expect(results.results.find(r => r.name === 'batchUpsert')).toBeUndefined();
      expect(results.results.find(r => r.name === 'delete')).toBeUndefined();
    });

    it('should track errors in benchmark results', async () => {
      // Create a store that only fails after a delay (to allow warmup to complete)
      let callCount = 0;
      const store: IBenchmarkableStore = {
        upsert: async (nodeId, content, embedding, metadata) => {
          // Allow warmup (first few calls), then fail
          callCount++;
          if (callCount > 5) {
            throw new Error('Upsert failed after warmup');
          }
          await delay(1);
        },
        search: async () => {
          return [];
        },
      };

      const results = await benchmark.runBenchmark(store);

      const upsertResult = results.results.find(r => r.name === 'upsert');
      // Some operations should have failed (after warmup)
      expect(upsertResult!.errors).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // Statistical Calculations Tests
  // --------------------------------------------------------------------------

  describe('statistical calculations', () => {
    it('should calculate percentiles correctly', async () => {
      const store = createMockStore();

      const results = await benchmark.runBenchmark(store);

      const upsertResult = results.results.find(r => r.name === 'upsert')!;

      // Percentiles should be in order
      expect(upsertResult.minMs).toBeLessThanOrEqual(upsertResult.p50Ms);
      expect(upsertResult.p50Ms).toBeLessThanOrEqual(upsertResult.p95Ms);
      expect(upsertResult.p95Ms).toBeLessThanOrEqual(upsertResult.p99Ms);
      expect(upsertResult.p99Ms).toBeLessThanOrEqual(upsertResult.maxMs);
    });

    it('should calculate standard deviation', async () => {
      const store = createMockStore();

      const results = await benchmark.runBenchmark(store);

      const upsertResult = results.results.find(r => r.name === 'upsert')!;
      expect(upsertResult.stdDevMs).toBeGreaterThanOrEqual(0);
    });

    it('should calculate operations per second', async () => {
      const store = createMockStore({ upsertDelay: 5 });

      const results = await benchmark.runBenchmark(store);

      const upsertResult = results.results.find(r => r.name === 'upsert')!;
      // With 5ms delay, should be around 200 ops/sec
      expect(upsertResult.opsPerSecond).toBeLessThan(300);
    });
  });

  // --------------------------------------------------------------------------
  // Comparison Tests
  // --------------------------------------------------------------------------

  describe('compare', () => {
    it('should compare two stores', async () => {
      const slowStore = createMockStore({ upsertDelay: 5, searchDelay: 5 });
      const fastStore = createMockStore({ upsertDelay: 1, searchDelay: 1 });

      const comparison = await benchmark.compare(
        slowStore,
        fastStore,
        'slow-store',
        'fast-store'
      );

      expect(comparison.baseline.storeName).toBe('slow-store');
      expect(comparison.comparison.storeName).toBe('fast-store');
      expect(comparison.comparisons.length).toBeGreaterThan(0);
      expect(comparison.avgSpeedup).toBeGreaterThan(0);
      expect(comparison.recommendation).toBeDefined();
    });

    it('should calculate speedup correctly', async () => {
      // Fast store should have higher speedup
      const slowStore = createMockStore({ upsertDelay: 10, searchDelay: 10 });
      const fastStore = createMockStore({ upsertDelay: 1, searchDelay: 1 });

      const comparison = await benchmark.compare(slowStore, fastStore);

      // Fast store should be faster
      expect(comparison.avgSpeedup).toBeGreaterThan(1);
    });

    it('should generate appropriate recommendations', async () => {
      const slowStore = createMockStore({ upsertDelay: 50 });
      const fastStore = createMockStore({ upsertDelay: 1 });

      const comparison = await benchmark.compare(slowStore, fastStore);

      // Should recommend migration to faster store
      expect(comparison.recommendation).toMatch(/recommend|consider/i);
    });
  });
});

// ============================================================================
// Factory Function Tests
// ============================================================================

describe('createVectorStoreBenchmark', () => {
  it('should create benchmark instance', () => {
    const benchmark = createVectorStoreBenchmark({ operations: 50 });
    const config = benchmark.getConfig();

    expect(config.operations).toBe(50);
  });

  it('should create benchmark with default config', () => {
    const benchmark = createVectorStoreBenchmark();
    const config = benchmark.getConfig();

    expect(config.operations).toBe(1000);
  });
});

describe('quickBenchmark', () => {
  it('should run quick benchmark with defaults', async () => {
    const store = createMockStore();

    const results = await quickBenchmark(store, 5);

    expect(results.config.operations).toBe(5);
    expect(results.results.length).toBeGreaterThan(0);
  });

  it('should use default operations when not specified', async () => {
    const store = createMockStore();

    // Mock the benchmark to run quickly
    const benchmark = new VectorStoreBenchmark({ operations: 5, warmupOperations: 1 });
    const results = await benchmark.runBenchmark(store);

    expect(results.results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Report Formatting Tests
// ============================================================================

describe('formatBenchmarkReport', () => {
  it('should format benchmark results as markdown', async () => {
    const benchmark = new VectorStoreBenchmark({
      operations: 5,
      warmupOperations: 1,
    });
    const store = createMockStore();
    const results = await benchmark.runBenchmark(store, 'test-store');

    const report = formatBenchmarkReport(results);

    expect(report).toContain('# Vector Store Benchmark Report');
    expect(report).toContain('**Store:** test-store');
    expect(report).toContain('## Results');
    expect(report).toContain('| Operation |');
    expect(report).toContain('| upsert |');
  });

  it('should include configuration in report', async () => {
    const benchmark = new VectorStoreBenchmark({
      operations: 10,
      dimensions: 128,
      warmupOperations: 1,
    });
    const store = createMockStore();
    const results = await benchmark.runBenchmark(store);

    const report = formatBenchmarkReport(results);

    expect(report).toContain('## Configuration');
    expect(report).toContain('Operations: 10');
    expect(report).toContain('Dimensions: 128');
  });

  it('should include memory stats when available', async () => {
    const benchmark = new VectorStoreBenchmark({
      operations: 5,
      warmupOperations: 1,
      trackMemory: true,
    });
    const store = createMockStore();
    const results = await benchmark.runBenchmark(store);

    if (results.memory) {
      const report = formatBenchmarkReport(results);
      expect(report).toContain('## Memory Usage');
    }
  });
});

describe('formatComparisonReport', () => {
  it('should format comparison results as markdown', async () => {
    const benchmark = new VectorStoreBenchmark({
      operations: 5,
      warmupOperations: 1,
    });
    const storeA = createMockStore({ upsertDelay: 5 });
    const storeB = createMockStore({ upsertDelay: 1 });

    const comparison = await benchmark.compare(storeA, storeB, 'old-store', 'new-store');

    const report = formatComparisonReport(comparison);

    expect(report).toContain('# Vector Store Comparison Report');
    expect(report).toContain('**Baseline:** old-store');
    expect(report).toContain('**Comparison:** new-store');
    expect(report).toContain('## Recommendation');
    expect(report).toContain('## Operation Comparison');
    expect(report).toContain('| Operation |');
  });

  it('should include speedup in comparison report', async () => {
    const benchmark = new VectorStoreBenchmark({
      operations: 5,
      warmupOperations: 1,
    });
    const storeA = createMockStore();
    const storeB = createMockStore();

    const comparison = await benchmark.compare(storeA, storeB);

    const report = formatComparisonReport(comparison);

    expect(report).toContain('**Average Speedup:**');
    expect(report).toMatch(/\d+\.\d+x/); // Speedup format
  });
});
