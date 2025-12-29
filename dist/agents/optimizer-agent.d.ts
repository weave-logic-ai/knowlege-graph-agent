/**
 * Optimizer Agent
 *
 * Specialized agent for performance optimization, memory profiling, query optimization,
 * caching strategy design, and benchmarking. Extends BaseAgent with optimization
 * capabilities and statistical analysis.
 *
 * @module agents/optimizer-agent
 */
import { BaseAgent } from './base-agent.js';
import { AgentType, type AgentTask, type AgentResult, type AgentConfig } from './types.js';
import { type SupportedLanguage } from '../integrations/agentic-flow/adapters/agent-booster-adapter.js';
/**
 * Optimizer agent configuration
 */
export interface OptimizerAgentConfig extends AgentConfig {
    type: AgentType.OPTIMIZER;
    /** Target performance improvement percentage */
    targetImprovement?: number;
    /** Memory threshold in MB for optimization suggestions */
    memoryThreshold?: number;
    /** Enable detailed profiling */
    detailedProfiling?: boolean;
}
/**
 * Impact level for optimization improvements
 */
export type ImpactLevel = 'high' | 'medium' | 'low';
/**
 * Individual optimization improvement
 */
export interface OptimizationImprovement {
    /** Type of optimization */
    type: string;
    /** Description of the improvement */
    description: string;
    /** Impact level */
    impact: ImpactLevel;
    /** Location in code */
    location: string;
    /** Suggested code change (optional) */
    suggestedCode?: string;
}
/**
 * Performance optimization result
 */
export interface OptimizationResult {
    /** Original code */
    original: string;
    /** Optimized code */
    optimized: string;
    /** List of improvements made */
    improvements: OptimizationImprovement[];
    /** Performance metrics */
    metrics: {
        /** Estimated speedup factor (e.g., 1.5 = 50% faster) */
        estimatedSpeedup: number;
        /** Memory reduction percentage (0-1) */
        memoryReduction: number;
        /** Complexity reduction percentage (0-1) */
        complexityReduction: number;
    };
}
/**
 * Memory allocation entry
 */
export interface MemoryAllocation {
    /** Type of allocation */
    type: string;
    /** Size in bytes */
    size: number;
    /** Number of allocations */
    count: number;
}
/**
 * Memory profile data
 */
export interface MemoryProfile {
    /** Heap memory used in bytes */
    heapUsed: number;
    /** Total heap size in bytes */
    heapTotal: number;
    /** External memory in bytes */
    external: number;
    /** Array buffer memory in bytes */
    arrayBuffers: number;
    /** Detailed allocations */
    allocations: MemoryAllocation[];
}
/**
 * Memory optimization suggestion
 */
export interface MemoryOptimizationSuggestion {
    /** Type of optimization */
    type: string;
    /** Description */
    description: string;
    /** Expected memory savings in bytes */
    expectedSavings: number;
    /** Priority level */
    priority: ImpactLevel;
    /** Implementation details */
    implementation: string;
}
/**
 * Memory optimization result
 */
export interface MemoryOptimizationResult {
    /** Original memory profile */
    originalProfile: MemoryProfile;
    /** List of optimization suggestions */
    suggestions: MemoryOptimizationSuggestion[];
    /** Estimated total savings in bytes */
    estimatedTotalSavings: number;
    /** Estimated memory reduction percentage */
    estimatedReduction: number;
}
/**
 * Query optimization result
 */
export interface QueryOptimizationResult {
    /** Original query */
    original: string;
    /** Optimized query */
    optimized: string;
    /** Explanation of changes */
    explanation: string;
    /** Estimated improvement percentage */
    estimatedImprovement: number;
    /** Suggested indexes to create */
    suggestedIndexes?: string[];
}
/**
 * Caching layer configuration
 */
export interface CachingLayer {
    /** Layer name */
    name: string;
    /** Cache type */
    type: 'memory' | 'redis' | 'cdn';
    /** Time to live in seconds */
    ttl: number;
    /** Invalidation strategy description */
    invalidation: string;
}
/**
 * Caching strategy design
 */
export interface CachingStrategy {
    /** Cache layers from closest to origin */
    layers: CachingLayer[];
    /** Caching patterns to apply */
    patterns: string[];
    /** Estimated cache hit rate */
    estimatedHitRate: number;
}
/**
 * Individual benchmark measurement
 */
export interface BenchmarkMeasurement {
    /** Benchmark name */
    name: string;
    /** Mean execution time in milliseconds */
    meanMs: number;
    /** Standard deviation */
    stdDev: number;
    /** Operations per second */
    opsPerSecond: number;
    /** Percentile measurements */
    percentiles: {
        p50: number;
        p95: number;
        p99: number;
    };
}
/**
 * Benchmark suite result
 */
export interface BenchmarkResult {
    /** Suite name */
    suite: string;
    /** Number of iterations */
    iterations: number;
    /** Individual benchmark results */
    results: BenchmarkMeasurement[];
    /** Timestamp */
    timestamp: Date;
    /** Environment info */
    environment?: {
        nodeVersion: string;
        platform: string;
        cpuCount: number;
        memoryMB: number;
    };
}
/**
 * System architecture for caching strategy design
 */
export interface SystemArchitecture {
    /** Application tier description */
    appTier: string;
    /** Database type */
    database: string;
    /** Read/write ratio (reads per write) */
    readWriteRatio: number;
    /** Average request rate per second */
    requestRate: number;
    /** Data volatility (how often data changes) */
    dataVolatility: 'low' | 'medium' | 'high';
    /** Latency requirements in ms */
    latencyRequirement?: number;
}
/**
 * Optimizer task types
 */
export type OptimizerTaskType = 'performance' | 'memory' | 'query' | 'caching' | 'benchmark';
/**
 * Optimizer Agent
 *
 * Capabilities:
 * - Performance analysis with actionable suggestions
 * - Memory profiling and optimization
 * - SQL and GraphQL query optimization
 * - Caching strategy design
 * - Benchmark suite with statistical analysis
 *
 * @example
 * ```typescript
 * const optimizer = new OptimizerAgent({
 *   name: 'optimizer-agent',
 *   targetImprovement: 20, // 20% target
 * });
 *
 * const result = await optimizer.optimizePerformance(code);
 * console.log(`Speedup: ${result.metrics.estimatedSpeedup}x`);
 * ```
 */
export declare class OptimizerAgent extends BaseAgent {
    /** Agent type */
    readonly type = AgentType.OPTIMIZER;
    /** Agent capabilities */
    readonly capabilities: string[];
    /** Target improvement percentage */
    private readonly targetImprovement;
    /** Memory threshold for suggestions */
    private readonly memoryThreshold;
    /** Enable detailed profiling */
    private readonly detailedProfiling;
    /** Agent Booster adapter for fast code transformations (352x faster) */
    private booster;
    constructor(config: Partial<OptimizerAgentConfig> & {
        name: string;
    });
    /**
     * Execute optimizer task
     */
    protected executeTask(task: AgentTask): Promise<AgentResult>;
    /**
     * Analyze and optimize performance of code
     *
     * Analyzes the provided code for:
     * - Loop optimizations (vectorization, early exits)
     * - Algorithm improvements
     * - Lazy evaluation opportunities
     * - Parallelization opportunities
     */
    optimizePerformance(code: string): Promise<OptimizationResult>;
    /**
     * Analyze memory profile and suggest optimizations
     *
     * Suggests:
     * - Object pooling for frequent allocations
     * - Streaming instead of buffering
     * - WeakMap/WeakSet usage for caching
     * - Buffer reuse patterns
     */
    optimizeMemory(profile: MemoryProfile): Promise<MemoryOptimizationResult>;
    /**
     * Optimize SQL or GraphQL queries
     *
     * Optimizations include:
     * - Index suggestions
     * - Query restructuring
     * - N+1 elimination
     * - Pagination optimization
     */
    optimizeQueries(queries: string[]): Promise<QueryOptimizationResult[]>;
    /**
     * Design a multi-layer caching strategy based on system architecture
     */
    designCachingStrategy(architecture: SystemArchitecture): Promise<CachingStrategy>;
    /**
     * Run performance benchmarks with statistical analysis
     */
    runBenchmark(suite: string, iterations?: number): Promise<BenchmarkResult>;
    private handlePerformanceTask;
    private handleMemoryTask;
    private handleQueryTask;
    private handleCachingTask;
    private handleBenchmarkTask;
    private findLoopOptimizations;
    private findAlgorithmOptimizations;
    private findLazyEvaluationOpportunities;
    private findParallelizationOpportunities;
    private applyOptimizations;
    private calculateOptimizationMetrics;
    private analyzeForPooling;
    private analyzeBufferUsage;
    private analyzeForWeakReferences;
    private optimizeSingleQuery;
    private calculateTTL;
    private calculateCacheHitRate;
    private getBenchmarkSuite;
    private calculateStatistics;
    private getEnvironmentInfo;
    /**
     * Initialize the Agent Booster adapter
     *
     * Call this before using applyOptimizationWithBooster for faster transformations.
     */
    initializeBooster(): Promise<void>;
    /**
     * Check if Agent Booster is available
     */
    isBoosterAvailable(): boolean;
    /**
     * Apply optimization using Agent Booster for 352x faster transformations
     *
     * This method uses the Agent Booster adapter to apply code transformations
     * based on the improvements identified in an OptimizationResult. Average
     * latency is ~1ms per transformation vs ~352ms with LLM-based approaches.
     *
     * @param code - Source code to optimize
     * @param optimization - Optimization result with improvements to apply
     * @param language - Programming language of the code
     * @returns Applied optimization results
     *
     * @example
     * ```typescript
     * const optimizer = new OptimizerAgent({ name: 'optimizer' });
     * await optimizer.initializeBooster();
     *
     * const analysis = await optimizer.optimizePerformance(code);
     * const applied = await optimizer.applyOptimizationWithBooster(
     *   code,
     *   analysis,
     *   'typescript'
     * );
     *
     * console.log(`Applied ${applied.appliedCount} optimizations in ${applied.totalLatencyMs}ms`);
     * ```
     */
    applyOptimizationWithBooster(code: string, optimization: OptimizationResult, language?: SupportedLanguage): Promise<{
        success: boolean;
        code: string;
        appliedCount: number;
        totalLatencyMs: number;
        details: Array<{
            improvement: string;
            applied: boolean;
            latencyMs: number;
        }>;
    }>;
    /**
     * Apply a specific optimization type using Agent Booster
     *
     * @param code - Source code to optimize
     * @param optimizationType - Type of optimization to apply
     * @param language - Programming language
     * @returns Transformation result
     */
    applyBoosterOptimization(code: string, optimizationType: 'loop' | 'async' | 'memory' | 'general', language?: SupportedLanguage): Promise<{
        success: boolean;
        code: string;
        latencyMs: number;
        confidence: number;
    }>;
    /**
     * Get Agent Booster status
     */
    getBoosterStatus(): {
        available: boolean;
        initialized: boolean;
        version?: string;
        fallbackMode: boolean;
    };
}
//# sourceMappingURL=optimizer-agent.d.ts.map