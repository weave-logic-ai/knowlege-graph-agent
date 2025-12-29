/**
 * Vector Store Benchmark
 *
 * Provides comprehensive benchmarking utilities for comparing
 * vector store implementations and measuring performance.
 *
 * Features:
 * - Upsert, search, and hybrid search benchmarks
 * - Statistical analysis with percentiles
 * - Comparison reports between implementations
 * - Memory usage tracking
 *
 * @module integrations/agentic-flow/benchmark/vector-benchmark
 */

import { createLogger } from '../../../utils/index.js';

const logger = createLogger('vector-benchmark');

/**
 * Benchmark result for a single operation type
 */
export interface BenchmarkResult {
  /** Operation name */
  name: string;
  /** Number of operations performed */
  operations: number;
  /** Total time in milliseconds */
  totalTimeMs: number;
  /** Average time per operation in milliseconds */
  avgTimeMs: number;
  /** Operations per second */
  opsPerSecond: number;
  /** 50th percentile (median) latency in milliseconds */
  p50Ms: number;
  /** 95th percentile latency in milliseconds */
  p95Ms: number;
  /** 99th percentile latency in milliseconds */
  p99Ms: number;
  /** Minimum latency in milliseconds */
  minMs: number;
  /** Maximum latency in milliseconds */
  maxMs: number;
  /** Standard deviation in milliseconds */
  stdDevMs: number;
  /** Error count */
  errors: number;
}

/**
 * Full benchmark suite results
 */
export interface BenchmarkSuiteResult {
  /** Name of the store being benchmarked */
  storeName: string;
  /** Timestamp of benchmark run */
  timestamp: Date;
  /** Individual benchmark results */
  results: BenchmarkResult[];
  /** Total benchmark duration in milliseconds */
  totalDuration: number;
  /** Memory usage statistics */
  memory?: MemoryStats;
  /** Configuration used for benchmark */
  config: BenchmarkConfig;
}

/**
 * Memory usage statistics
 */
export interface MemoryStats {
  /** Initial memory usage in bytes */
  initial: number;
  /** Peak memory usage in bytes */
  peak: number;
  /** Final memory usage in bytes */
  final: number;
  /** Memory delta (final - initial) in bytes */
  delta: number;
}

/**
 * Benchmark configuration
 */
export interface BenchmarkConfig {
  /** Number of operations per benchmark */
  operations: number;
  /** Vector dimensions */
  dimensions: number;
  /** Number of warmup operations */
  warmupOperations: number;
  /** Enable memory tracking */
  trackMemory: boolean;
  /** Number of results for search benchmarks */
  searchK: number;
  /** Search threshold */
  searchThreshold: number;
  /** Batch size for batch operations */
  batchSize: number;
}

/**
 * Default benchmark configuration
 */
const DEFAULT_CONFIG: BenchmarkConfig = {
  operations: 1000,
  dimensions: 384,
  warmupOperations: 100,
  trackMemory: true,
  searchK: 10,
  searchThreshold: 0.5,
  batchSize: 100,
};

/**
 * Interface for vector store to benchmark
 */
export interface IBenchmarkableStore {
  upsert(
    nodeId: string,
    content: string,
    embedding: Float32Array,
    metadata?: Record<string, unknown>
  ): Promise<void>;
  upsertBatch?(entries: Array<{
    nodeId: string;
    content: string;
    embedding: Float32Array;
    metadata?: Record<string, unknown>;
  }>): Promise<void>;
  search(
    queryEmbedding: Float32Array,
    limit?: number,
    threshold?: number
  ): Promise<Array<{
    nodeId: string;
    content: string;
    similarity: number;
    metadata: Record<string, unknown>;
  }>>;
  hybridSearch?(
    query: string,
    queryEmbedding: Float32Array,
    options?: { limit?: number }
  ): Promise<Array<{
    nodeId: string;
    content: string;
    similarity: number;
    metadata: Record<string, unknown>;
  }>>;
  delete?(nodeId: string): Promise<void>;
  getStats?(): Promise<unknown>;
}

/**
 * Vector Store Benchmark class
 *
 * Provides comprehensive benchmarking for vector store implementations.
 *
 * @example
 * ```typescript
 * const benchmark = new VectorStoreBenchmark({
 *   operations: 1000,
 *   dimensions: 384,
 * });
 *
 * const results = await benchmark.runBenchmark(store);
 * console.log('Upsert ops/sec:', results.results[0].opsPerSecond);
 *
 * // Compare two stores
 * const comparison = await benchmark.compare(storeA, storeB);
 * console.log('Speedup:', comparison.speedup);
 * ```
 */
export class VectorStoreBenchmark {
  private config: BenchmarkConfig;

  constructor(config: Partial<BenchmarkConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Run full benchmark suite on a store
   *
   * @param store - Vector store to benchmark
   * @param storeName - Name for the store in results
   * @returns Benchmark suite results
   */
  async runBenchmark(
    store: IBenchmarkableStore,
    storeName: string = 'default'
  ): Promise<BenchmarkSuiteResult> {
    const startTime = Date.now();
    const results: BenchmarkResult[] = [];
    let initialMemory = 0;
    let peakMemory = 0;

    logger.info('Starting benchmark suite', {
      store: storeName,
      operations: this.config.operations,
      dimensions: this.config.dimensions,
    });

    // Track initial memory
    if (this.config.trackMemory && typeof process !== 'undefined') {
      initialMemory = process.memoryUsage().heapUsed;
      peakMemory = initialMemory;
    }

    // Warmup
    logger.debug('Running warmup phase');
    await this.warmup(store);

    // Benchmark upsert
    results.push(await this.benchmarkUpsert(store));
    this.updatePeakMemory(peakMemory);

    // Benchmark batch upsert if available
    if (store.upsertBatch) {
      results.push(await this.benchmarkBatchUpsert(store));
      this.updatePeakMemory(peakMemory);
    }

    // Benchmark search
    results.push(await this.benchmarkSearch(store));
    this.updatePeakMemory(peakMemory);

    // Benchmark hybrid search if available
    if (store.hybridSearch) {
      results.push(await this.benchmarkHybridSearch(store));
      this.updatePeakMemory(peakMemory);
    }

    // Benchmark delete if available
    if (store.delete) {
      results.push(await this.benchmarkDelete(store));
      this.updatePeakMemory(peakMemory);
    }

    // Calculate final memory
    let memory: MemoryStats | undefined;
    if (this.config.trackMemory && typeof process !== 'undefined') {
      const finalMemory = process.memoryUsage().heapUsed;
      memory = {
        initial: initialMemory,
        peak: peakMemory,
        final: finalMemory,
        delta: finalMemory - initialMemory,
      };
    }

    const totalDuration = Date.now() - startTime;

    logger.info('Benchmark suite complete', {
      store: storeName,
      duration: totalDuration,
      tests: results.length,
    });

    return {
      storeName,
      timestamp: new Date(),
      results,
      totalDuration,
      memory,
      config: this.config,
    };
  }

  /**
   * Compare two store implementations
   *
   * @param storeA - First store (baseline)
   * @param storeB - Second store (comparison)
   * @param nameA - Name for first store
   * @param nameB - Name for second store
   * @returns Comparison results
   */
  async compare(
    storeA: IBenchmarkableStore,
    storeB: IBenchmarkableStore,
    nameA: string = 'baseline',
    nameB: string = 'comparison'
  ): Promise<ComparisonResult> {
    logger.info('Starting comparison benchmark', { storeA: nameA, storeB: nameB });

    const resultsA = await this.runBenchmark(storeA, nameA);
    const resultsB = await this.runBenchmark(storeB, nameB);

    const comparisons: OperationComparison[] = [];

    for (const resultA of resultsA.results) {
      const resultB = resultsB.results.find(r => r.name === resultA.name);
      if (resultB) {
        comparisons.push({
          operation: resultA.name,
          baselineOpsPerSec: resultA.opsPerSecond,
          comparisonOpsPerSec: resultB.opsPerSecond,
          speedup: resultB.opsPerSecond / resultA.opsPerSecond,
          baselineP50: resultA.p50Ms,
          comparisonP50: resultB.p50Ms,
          latencyReduction: (resultA.p50Ms - resultB.p50Ms) / resultA.p50Ms,
        });
      }
    }

    const avgSpeedup = comparisons.reduce((sum, c) => sum + c.speedup, 0) / comparisons.length;

    return {
      baseline: resultsA,
      comparison: resultsB,
      comparisons,
      avgSpeedup,
      recommendation: this.generateRecommendation(avgSpeedup, comparisons),
    };
  }

  /**
   * Warmup phase to eliminate cold start effects
   */
  private async warmup(store: IBenchmarkableStore): Promise<void> {
    for (let i = 0; i < this.config.warmupOperations; i++) {
      const embedding = this.generateRandomEmbedding();
      await store.upsert(`warmup-${i}`, `Warmup content ${i}`, embedding);
    }
    // Search warmup
    const queryEmbedding = this.generateRandomEmbedding();
    await store.search(queryEmbedding, this.config.searchK);
  }

  /**
   * Benchmark upsert operations
   */
  private async benchmarkUpsert(store: IBenchmarkableStore): Promise<BenchmarkResult> {
    const times: number[] = [];
    let errors = 0;

    for (let i = 0; i < this.config.operations; i++) {
      const embedding = this.generateRandomEmbedding();
      const start = performance.now();

      try {
        await store.upsert(`bench-upsert-${i}`, `Content ${i}`, embedding, { index: i });
        times.push(performance.now() - start);
      } catch {
        errors++;
        times.push(performance.now() - start);
      }
    }

    return this.calculateStats('upsert', times, errors);
  }

  /**
   * Benchmark batch upsert operations
   */
  private async benchmarkBatchUpsert(store: IBenchmarkableStore): Promise<BenchmarkResult> {
    const times: number[] = [];
    let errors = 0;
    const batches = Math.ceil(this.config.operations / this.config.batchSize);

    for (let b = 0; b < batches; b++) {
      const entries = [];
      for (let i = 0; i < this.config.batchSize; i++) {
        const idx = b * this.config.batchSize + i;
        if (idx >= this.config.operations) break;

        entries.push({
          nodeId: `bench-batch-${idx}`,
          content: `Batch content ${idx}`,
          embedding: this.generateRandomEmbedding(),
          metadata: { index: idx, batch: b },
        });
      }

      const start = performance.now();

      try {
        await store.upsertBatch!(entries);
        // Record time per entry for consistent comparison
        const timePerEntry = (performance.now() - start) / entries.length;
        for (let i = 0; i < entries.length; i++) {
          times.push(timePerEntry);
        }
      } catch {
        errors += entries.length;
        const timePerEntry = (performance.now() - start) / entries.length;
        for (let i = 0; i < entries.length; i++) {
          times.push(timePerEntry);
        }
      }
    }

    return this.calculateStats('batchUpsert', times, errors);
  }

  /**
   * Benchmark search operations
   */
  private async benchmarkSearch(store: IBenchmarkableStore): Promise<BenchmarkResult> {
    const times: number[] = [];
    let errors = 0;

    for (let i = 0; i < this.config.operations; i++) {
      const queryEmbedding = this.generateRandomEmbedding();
      const start = performance.now();

      try {
        await store.search(queryEmbedding, this.config.searchK, this.config.searchThreshold);
        times.push(performance.now() - start);
      } catch {
        errors++;
        times.push(performance.now() - start);
      }
    }

    return this.calculateStats('search', times, errors);
  }

  /**
   * Benchmark hybrid search operations
   */
  private async benchmarkHybridSearch(store: IBenchmarkableStore): Promise<BenchmarkResult> {
    const times: number[] = [];
    let errors = 0;

    const testQueries = [
      'machine learning algorithms',
      'neural network architecture',
      'data processing pipeline',
      'distributed systems',
      'natural language processing',
    ];

    for (let i = 0; i < this.config.operations; i++) {
      const query = testQueries[i % testQueries.length];
      const queryEmbedding = this.generateRandomEmbedding();
      const start = performance.now();

      try {
        await store.hybridSearch!(query, queryEmbedding, {
          limit: this.config.searchK,
        });
        times.push(performance.now() - start);
      } catch {
        errors++;
        times.push(performance.now() - start);
      }
    }

    return this.calculateStats('hybridSearch', times, errors);
  }

  /**
   * Benchmark delete operations
   */
  private async benchmarkDelete(store: IBenchmarkableStore): Promise<BenchmarkResult> {
    const times: number[] = [];
    let errors = 0;

    // First, insert items to delete
    for (let i = 0; i < this.config.operations; i++) {
      const embedding = this.generateRandomEmbedding();
      await store.upsert(`bench-delete-${i}`, `Delete content ${i}`, embedding);
    }

    // Then benchmark deletion
    for (let i = 0; i < this.config.operations; i++) {
      const start = performance.now();

      try {
        await store.delete!(`bench-delete-${i}`);
        times.push(performance.now() - start);
      } catch {
        errors++;
        times.push(performance.now() - start);
      }
    }

    return this.calculateStats('delete', times, errors);
  }

  /**
   * Calculate statistical metrics from timing data
   */
  private calculateStats(
    name: string,
    times: number[],
    errors: number
  ): BenchmarkResult {
    // Sort times for percentile calculation
    const sortedTimes = [...times].sort((a, b) => a - b);

    const total = times.reduce((sum, t) => sum + t, 0);
    const avg = total / times.length;

    // Calculate standard deviation
    const squaredDiffs = times.map(t => Math.pow(t - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, d) => sum + d, 0) / times.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    return {
      name,
      operations: times.length,
      totalTimeMs: total,
      avgTimeMs: avg,
      opsPerSecond: 1000 / avg,
      p50Ms: sortedTimes[Math.floor(times.length * 0.5)] || 0,
      p95Ms: sortedTimes[Math.floor(times.length * 0.95)] || 0,
      p99Ms: sortedTimes[Math.floor(times.length * 0.99)] || 0,
      minMs: sortedTimes[0] || 0,
      maxMs: sortedTimes[sortedTimes.length - 1] || 0,
      stdDevMs: stdDev,
      errors,
    };
  }

  /**
   * Generate random embedding vector
   */
  private generateRandomEmbedding(): Float32Array {
    const embedding = new Float32Array(this.config.dimensions);
    for (let i = 0; i < this.config.dimensions; i++) {
      embedding[i] = Math.random() * 2 - 1; // Range [-1, 1]
    }
    // Normalize
    let norm = 0;
    for (let i = 0; i < this.config.dimensions; i++) {
      norm += embedding[i] * embedding[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < this.config.dimensions; i++) {
        embedding[i] /= norm;
      }
    }
    return embedding;
  }

  /**
   * Update peak memory tracking
   */
  private updatePeakMemory(currentPeak: number): number {
    if (typeof process !== 'undefined') {
      const current = process.memoryUsage().heapUsed;
      return Math.max(currentPeak, current);
    }
    return currentPeak;
  }

  /**
   * Generate recommendation based on comparison results
   */
  private generateRecommendation(
    avgSpeedup: number,
    comparisons: OperationComparison[]
  ): string {
    if (avgSpeedup > 10) {
      return 'Strong recommendation: The comparison store shows exceptional performance improvement (>10x speedup).';
    } else if (avgSpeedup > 2) {
      return 'Recommended: The comparison store provides significant performance benefits (>2x speedup).';
    } else if (avgSpeedup > 1.2) {
      return 'Consider migration: The comparison store shows moderate improvement (>20% speedup).';
    } else if (avgSpeedup >= 0.8) {
      return 'Neutral: Both stores perform similarly. Consider other factors for decision.';
    } else {
      return 'Not recommended: The baseline store performs better in this benchmark.';
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): BenchmarkConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BenchmarkConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Comparison between two operations
 */
export interface OperationComparison {
  operation: string;
  baselineOpsPerSec: number;
  comparisonOpsPerSec: number;
  speedup: number;
  baselineP50: number;
  comparisonP50: number;
  latencyReduction: number;
}

/**
 * Full comparison result
 */
export interface ComparisonResult {
  baseline: BenchmarkSuiteResult;
  comparison: BenchmarkSuiteResult;
  comparisons: OperationComparison[];
  avgSpeedup: number;
  recommendation: string;
}

/**
 * Create a benchmark instance with default configuration
 */
export function createVectorStoreBenchmark(
  config?: Partial<BenchmarkConfig>
): VectorStoreBenchmark {
  return new VectorStoreBenchmark(config);
}

/**
 * Quick benchmark for a single store
 *
 * @param store - Store to benchmark
 * @param operations - Number of operations (default: 1000)
 * @returns Benchmark results
 */
export async function quickBenchmark(
  store: IBenchmarkableStore,
  operations: number = 1000
): Promise<BenchmarkSuiteResult> {
  const benchmark = new VectorStoreBenchmark({ operations, warmupOperations: 50 });
  return benchmark.runBenchmark(store);
}

/**
 * Format benchmark results as a string report
 */
export function formatBenchmarkReport(result: BenchmarkSuiteResult): string {
  const lines: string[] = [
    `# Vector Store Benchmark Report`,
    ``,
    `**Store:** ${result.storeName}`,
    `**Date:** ${result.timestamp.toISOString()}`,
    `**Total Duration:** ${result.totalDuration}ms`,
    ``,
    `## Configuration`,
    `- Operations: ${result.config.operations}`,
    `- Dimensions: ${result.config.dimensions}`,
    `- Search K: ${result.config.searchK}`,
    ``,
    `## Results`,
    ``,
    `| Operation | Ops/sec | Avg (ms) | P50 (ms) | P95 (ms) | P99 (ms) | Errors |`,
    `|-----------|---------|----------|----------|----------|----------|--------|`,
  ];

  for (const r of result.results) {
    lines.push(
      `| ${r.name} | ${r.opsPerSecond.toFixed(1)} | ${r.avgTimeMs.toFixed(3)} | ${r.p50Ms.toFixed(3)} | ${r.p95Ms.toFixed(3)} | ${r.p99Ms.toFixed(3)} | ${r.errors} |`
    );
  }

  if (result.memory) {
    lines.push(``, `## Memory Usage`);
    lines.push(`- Initial: ${(result.memory.initial / 1024 / 1024).toFixed(2)} MB`);
    lines.push(`- Peak: ${(result.memory.peak / 1024 / 1024).toFixed(2)} MB`);
    lines.push(`- Final: ${(result.memory.final / 1024 / 1024).toFixed(2)} MB`);
    lines.push(`- Delta: ${(result.memory.delta / 1024 / 1024).toFixed(2)} MB`);
  }

  return lines.join('\n');
}

/**
 * Format comparison results as a string report
 */
export function formatComparisonReport(result: ComparisonResult): string {
  const lines: string[] = [
    `# Vector Store Comparison Report`,
    ``,
    `**Baseline:** ${result.baseline.storeName}`,
    `**Comparison:** ${result.comparison.storeName}`,
    `**Average Speedup:** ${result.avgSpeedup.toFixed(2)}x`,
    ``,
    `## Recommendation`,
    `${result.recommendation}`,
    ``,
    `## Operation Comparison`,
    ``,
    `| Operation | Baseline Ops/s | Comparison Ops/s | Speedup | Latency Reduction |`,
    `|-----------|----------------|------------------|---------|-------------------|`,
  ];

  for (const c of result.comparisons) {
    lines.push(
      `| ${c.operation} | ${c.baselineOpsPerSec.toFixed(1)} | ${c.comparisonOpsPerSec.toFixed(1)} | ${c.speedup.toFixed(2)}x | ${(c.latencyReduction * 100).toFixed(1)}% |`
    );
  }

  return lines.join('\n');
}
