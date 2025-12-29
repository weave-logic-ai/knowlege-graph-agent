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
 * Interface for vector store to benchmark
 */
export interface IBenchmarkableStore {
    upsert(nodeId: string, content: string, embedding: Float32Array, metadata?: Record<string, unknown>): Promise<void>;
    upsertBatch?(entries: Array<{
        nodeId: string;
        content: string;
        embedding: Float32Array;
        metadata?: Record<string, unknown>;
    }>): Promise<void>;
    search(queryEmbedding: Float32Array, limit?: number, threshold?: number): Promise<Array<{
        nodeId: string;
        content: string;
        similarity: number;
        metadata: Record<string, unknown>;
    }>>;
    hybridSearch?(query: string, queryEmbedding: Float32Array, options?: {
        limit?: number;
    }): Promise<Array<{
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
export declare class VectorStoreBenchmark {
    private config;
    constructor(config?: Partial<BenchmarkConfig>);
    /**
     * Run full benchmark suite on a store
     *
     * @param store - Vector store to benchmark
     * @param storeName - Name for the store in results
     * @returns Benchmark suite results
     */
    runBenchmark(store: IBenchmarkableStore, storeName?: string): Promise<BenchmarkSuiteResult>;
    /**
     * Compare two store implementations
     *
     * @param storeA - First store (baseline)
     * @param storeB - Second store (comparison)
     * @param nameA - Name for first store
     * @param nameB - Name for second store
     * @returns Comparison results
     */
    compare(storeA: IBenchmarkableStore, storeB: IBenchmarkableStore, nameA?: string, nameB?: string): Promise<ComparisonResult>;
    /**
     * Warmup phase to eliminate cold start effects
     */
    private warmup;
    /**
     * Benchmark upsert operations
     */
    private benchmarkUpsert;
    /**
     * Benchmark batch upsert operations
     */
    private benchmarkBatchUpsert;
    /**
     * Benchmark search operations
     */
    private benchmarkSearch;
    /**
     * Benchmark hybrid search operations
     */
    private benchmarkHybridSearch;
    /**
     * Benchmark delete operations
     */
    private benchmarkDelete;
    /**
     * Calculate statistical metrics from timing data
     */
    private calculateStats;
    /**
     * Generate random embedding vector
     */
    private generateRandomEmbedding;
    /**
     * Update peak memory tracking
     */
    private updatePeakMemory;
    /**
     * Generate recommendation based on comparison results
     */
    private generateRecommendation;
    /**
     * Get current configuration
     */
    getConfig(): BenchmarkConfig;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<BenchmarkConfig>): void;
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
export declare function createVectorStoreBenchmark(config?: Partial<BenchmarkConfig>): VectorStoreBenchmark;
/**
 * Quick benchmark for a single store
 *
 * @param store - Store to benchmark
 * @param operations - Number of operations (default: 1000)
 * @returns Benchmark results
 */
export declare function quickBenchmark(store: IBenchmarkableStore, operations?: number): Promise<BenchmarkSuiteResult>;
/**
 * Format benchmark results as a string report
 */
export declare function formatBenchmarkReport(result: BenchmarkSuiteResult): string;
/**
 * Format comparison results as a string report
 */
export declare function formatComparisonReport(result: ComparisonResult): string;
//# sourceMappingURL=vector-benchmark.d.ts.map