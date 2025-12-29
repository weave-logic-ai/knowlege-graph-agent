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
import {
  AgentType,
  type AgentTask,
  type AgentResult,
  type AgentConfig,
  type ResultArtifact,
} from './types.js';
import { getLogger, type Logger } from '../utils/index.js';
import {
  AgentBoosterAdapter,
  createAgentBoosterAdapter,
  type SupportedLanguage,
} from '../integrations/agentic-flow/adapters/agent-booster-adapter.js';

// ============================================================================
// Types
// ============================================================================

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
export type OptimizerTaskType =
  | 'performance'
  | 'memory'
  | 'query'
  | 'caching'
  | 'benchmark';

// ============================================================================
// Optimizer Agent
// ============================================================================

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
export class OptimizerAgent extends BaseAgent {
  /** Agent type */
  readonly type = AgentType.OPTIMIZER;

  /** Agent capabilities */
  readonly capabilities = [
    'performance_tuning',
    'memory_optimization',
    'query_optimization',
    'caching_strategy',
    'benchmark',
  ];

  /** Target improvement percentage */
  private readonly targetImprovement: number;

  /** Memory threshold for suggestions */
  private readonly memoryThreshold: number;

  /** Enable detailed profiling */
  private readonly detailedProfiling: boolean;

  /** Agent Booster adapter for fast code transformations (352x faster) */
  private booster: AgentBoosterAdapter | null = null;

  constructor(config: Partial<OptimizerAgentConfig> & { name: string }) {
    super({
      type: AgentType.OPTIMIZER,
      taskTimeout: 300000, // 5 minutes for complex optimizations
      capabilities: [
        'performance_tuning',
        'memory_optimization',
        'query_optimization',
        'caching_strategy',
        'benchmark',
      ],
      ...config,
    });

    this.targetImprovement = (config as OptimizerAgentConfig).targetImprovement ?? 20;
    this.memoryThreshold = (config as OptimizerAgentConfig).memoryThreshold ?? 100;
    this.detailedProfiling = (config as OptimizerAgentConfig).detailedProfiling ?? false;
  }

  // ==========================================================================
  // Task Execution
  // ==========================================================================

  /**
   * Execute optimizer task
   */
  protected async executeTask(task: AgentTask): Promise<AgentResult> {
    const startTime = new Date();
    const taskType = (task.input?.parameters?.taskType as OptimizerTaskType) || 'performance';

    switch (taskType) {
      case 'performance':
        return this.handlePerformanceTask(task, startTime);
      case 'memory':
        return this.handleMemoryTask(task, startTime);
      case 'query':
        return this.handleQueryTask(task, startTime);
      case 'caching':
        return this.handleCachingTask(task, startTime);
      case 'benchmark':
        return this.handleBenchmarkTask(task, startTime);
      default:
        return this.createErrorResult(
          'INVALID_TASK_TYPE',
          `Unknown task type: ${taskType}`,
          startTime
        );
    }
  }

  // ==========================================================================
  // Public Methods
  // ==========================================================================

  /**
   * Analyze and optimize performance of code
   *
   * Analyzes the provided code for:
   * - Loop optimizations (vectorization, early exits)
   * - Algorithm improvements
   * - Lazy evaluation opportunities
   * - Parallelization opportunities
   */
  async optimizePerformance(code: string): Promise<OptimizationResult> {
    this.logger.info('Analyzing code for performance optimization');

    const improvements: OptimizationImprovement[] = [];
    let optimizedCode = code;

    // Analyze for loop optimizations
    const loopOptimizations = this.findLoopOptimizations(code);
    improvements.push(...loopOptimizations);

    // Analyze for algorithm improvements
    const algorithmOptimizations = this.findAlgorithmOptimizations(code);
    improvements.push(...algorithmOptimizations);

    // Analyze for lazy evaluation opportunities
    const lazyEvalOptimizations = this.findLazyEvaluationOpportunities(code);
    improvements.push(...lazyEvalOptimizations);

    // Analyze for parallelization opportunities
    const parallelOptimizations = this.findParallelizationOpportunities(code);
    improvements.push(...parallelOptimizations);

    // Apply optimizations to generate optimized code
    optimizedCode = this.applyOptimizations(code, improvements);

    // Calculate metrics
    const metrics = this.calculateOptimizationMetrics(code, optimizedCode, improvements);

    return {
      original: code,
      optimized: optimizedCode,
      improvements,
      metrics,
    };
  }

  /**
   * Analyze memory profile and suggest optimizations
   *
   * Suggests:
   * - Object pooling for frequent allocations
   * - Streaming instead of buffering
   * - WeakMap/WeakSet usage for caching
   * - Buffer reuse patterns
   */
  async optimizeMemory(profile: MemoryProfile): Promise<MemoryOptimizationResult> {
    this.logger.info('Analyzing memory profile for optimization');

    const suggestions: MemoryOptimizationSuggestion[] = [];
    let totalSavings = 0;

    // Check for large heap usage
    if (profile.heapUsed > this.memoryThreshold * 1024 * 1024) {
      suggestions.push({
        type: 'heap_reduction',
        description: 'High heap usage detected. Consider implementing lazy loading or pagination.',
        expectedSavings: Math.floor(profile.heapUsed * 0.3),
        priority: 'high',
        implementation: 'Implement virtual scrolling for large lists, use pagination for data fetching',
      });
      totalSavings += Math.floor(profile.heapUsed * 0.3);
    }

    // Analyze allocations for pooling opportunities
    const poolingSuggestions = this.analyzeForPooling(profile.allocations);
    suggestions.push(...poolingSuggestions);
    totalSavings += poolingSuggestions.reduce((sum, s) => sum + s.expectedSavings, 0);

    // Check for buffer optimization opportunities
    const bufferSuggestions = this.analyzeBufferUsage(profile);
    suggestions.push(...bufferSuggestions);
    totalSavings += bufferSuggestions.reduce((sum, s) => sum + s.expectedSavings, 0);

    // Check for WeakMap/WeakSet opportunities
    const weakRefSuggestions = this.analyzeForWeakReferences(profile.allocations);
    suggestions.push(...weakRefSuggestions);
    totalSavings += weakRefSuggestions.reduce((sum, s) => sum + s.expectedSavings, 0);

    // Check for streaming opportunities
    if (profile.arrayBuffers > 10 * 1024 * 1024) { // 10MB threshold
      suggestions.push({
        type: 'streaming',
        description: 'Large array buffers detected. Consider streaming data instead of buffering.',
        expectedSavings: Math.floor(profile.arrayBuffers * 0.7),
        priority: 'high',
        implementation: 'Use Node.js streams or async iterators for large data processing',
      });
      totalSavings += Math.floor(profile.arrayBuffers * 0.7);
    }

    const estimatedReduction = profile.heapUsed > 0
      ? totalSavings / profile.heapUsed
      : 0;

    return {
      originalProfile: profile,
      suggestions: suggestions.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
      estimatedTotalSavings: totalSavings,
      estimatedReduction: Math.min(1, estimatedReduction),
    };
  }

  /**
   * Optimize SQL or GraphQL queries
   *
   * Optimizations include:
   * - Index suggestions
   * - Query restructuring
   * - N+1 elimination
   * - Pagination optimization
   */
  async optimizeQueries(queries: string[]): Promise<QueryOptimizationResult[]> {
    this.logger.info('Optimizing queries', { count: queries.length });

    return queries.map((query) => this.optimizeSingleQuery(query));
  }

  /**
   * Design a multi-layer caching strategy based on system architecture
   */
  async designCachingStrategy(architecture: SystemArchitecture): Promise<CachingStrategy> {
    this.logger.info('Designing caching strategy', { architecture: architecture.appTier });

    const layers: CachingLayer[] = [];
    const patterns: string[] = [];

    // Layer 1: Memory cache for hot data
    if (architecture.readWriteRatio > 5) {
      layers.push({
        name: 'L1 Memory Cache',
        type: 'memory',
        ttl: this.calculateTTL(architecture.dataVolatility, 'memory'),
        invalidation: 'LRU eviction with TTL expiry',
      });
      patterns.push('cache-aside');
    }

    // Layer 2: Distributed cache for shared state
    if (architecture.requestRate > 100) {
      layers.push({
        name: 'L2 Redis Cache',
        type: 'redis',
        ttl: this.calculateTTL(architecture.dataVolatility, 'redis'),
        invalidation: 'Write-through with pub/sub invalidation',
      });
      patterns.push('read-through');
    }

    // Layer 3: CDN for static/semi-static content
    if (architecture.latencyRequirement && architecture.latencyRequirement < 50) {
      layers.push({
        name: 'CDN Edge Cache',
        type: 'cdn',
        ttl: this.calculateTTL(architecture.dataVolatility, 'cdn'),
        invalidation: 'Cache-Control headers with purge API',
      });
      patterns.push('stale-while-revalidate');
    }

    // Add patterns based on data volatility
    if (architecture.dataVolatility === 'low') {
      patterns.push('write-around');
    } else if (architecture.dataVolatility === 'high') {
      patterns.push('write-behind');
    }

    // Calculate estimated hit rate
    const estimatedHitRate = this.calculateCacheHitRate(
      architecture.readWriteRatio,
      architecture.dataVolatility,
      layers.length
    );

    return {
      layers,
      patterns: [...new Set(patterns)],
      estimatedHitRate,
    };
  }

  /**
   * Run performance benchmarks with statistical analysis
   */
  async runBenchmark(suite: string, iterations: number = 100): Promise<BenchmarkResult> {
    this.logger.info('Running benchmark suite', { suite, iterations });

    const results: BenchmarkMeasurement[] = [];

    // Get benchmark functions for the suite
    const benchmarks = this.getBenchmarkSuite(suite);

    for (const benchmark of benchmarks) {
      const measurements: number[] = [];

      // Warm-up runs
      for (let i = 0; i < Math.min(10, iterations / 10); i++) {
        await benchmark.fn();
      }

      // Actual measurements
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await benchmark.fn();
        const end = performance.now();
        measurements.push(end - start);
      }

      // Calculate statistics
      const stats = this.calculateStatistics(measurements);

      results.push({
        name: benchmark.name,
        meanMs: stats.mean,
        stdDev: stats.stdDev,
        opsPerSecond: 1000 / stats.mean,
        percentiles: {
          p50: stats.p50,
          p95: stats.p95,
          p99: stats.p99,
        },
      });
    }

    return {
      suite,
      iterations,
      results,
      timestamp: new Date(),
      environment: this.getEnvironmentInfo(),
    };
  }

  // ==========================================================================
  // Private Task Handlers
  // ==========================================================================

  private async handlePerformanceTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<OptimizationResult>> {
    const input = task.input?.data as { code: string } | undefined;

    if (!input?.code) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Code is required for performance optimization',
        startTime
      ) as AgentResult<OptimizationResult>;
    }

    try {
      const result = await this.optimizePerformance(input.code);
      return this.createSuccessResult(result, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        'OPTIMIZATION_ERROR',
        `Performance optimization failed: ${message}`,
        startTime
      ) as AgentResult<OptimizationResult>;
    }
  }

  private async handleMemoryTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<MemoryOptimizationResult>> {
    const input = task.input?.data as { profile: MemoryProfile } | undefined;

    if (!input?.profile) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Memory profile is required for memory optimization',
        startTime
      ) as AgentResult<MemoryOptimizationResult>;
    }

    try {
      const result = await this.optimizeMemory(input.profile);
      return this.createSuccessResult(result, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        'OPTIMIZATION_ERROR',
        `Memory optimization failed: ${message}`,
        startTime
      ) as AgentResult<MemoryOptimizationResult>;
    }
  }

  private async handleQueryTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<QueryOptimizationResult[]>> {
    const input = task.input?.data as { queries: string[] } | undefined;

    if (!input?.queries || input.queries.length === 0) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Queries are required for query optimization',
        startTime
      ) as AgentResult<QueryOptimizationResult[]>;
    }

    try {
      const results = await this.optimizeQueries(input.queries);
      return this.createSuccessResult(results, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        'OPTIMIZATION_ERROR',
        `Query optimization failed: ${message}`,
        startTime
      ) as AgentResult<QueryOptimizationResult[]>;
    }
  }

  private async handleCachingTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<CachingStrategy>> {
    const input = task.input?.data as { architecture: SystemArchitecture } | undefined;

    if (!input?.architecture) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'System architecture is required for caching strategy design',
        startTime
      ) as AgentResult<CachingStrategy>;
    }

    try {
      const strategy = await this.designCachingStrategy(input.architecture);
      return this.createSuccessResult(strategy, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        'OPTIMIZATION_ERROR',
        `Caching strategy design failed: ${message}`,
        startTime
      ) as AgentResult<CachingStrategy>;
    }
  }

  private async handleBenchmarkTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<BenchmarkResult>> {
    const input = task.input?.data as { suite: string; iterations?: number } | undefined;

    if (!input?.suite) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Benchmark suite name is required',
        startTime
      ) as AgentResult<BenchmarkResult>;
    }

    try {
      const result = await this.runBenchmark(input.suite, input.iterations);
      return this.createSuccessResult(result, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        'BENCHMARK_ERROR',
        `Benchmark failed: ${message}`,
        startTime
      ) as AgentResult<BenchmarkResult>;
    }
  }

  // ==========================================================================
  // Performance Optimization Helpers
  // ==========================================================================

  private findLoopOptimizations(code: string): OptimizationImprovement[] {
    const improvements: OptimizationImprovement[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for array length in loop condition (should be cached)
      if (/for\s*\([^;]+;\s*\w+\s*<\s*\w+\.length\s*;/.test(line)) {
        improvements.push({
          type: 'loop_length_caching',
          description: 'Cache array length outside loop for better performance',
          impact: 'medium',
          location: `Line ${i + 1}`,
          suggestedCode: 'const len = array.length; for (let i = 0; i < len; i++)',
        });
      }

      // Check for forEach that could be for-of
      if (/\.forEach\s*\(/.test(line)) {
        improvements.push({
          type: 'loop_type',
          description: 'Consider using for...of instead of forEach for better performance',
          impact: 'low',
          location: `Line ${i + 1}`,
          suggestedCode: 'for (const item of array) { ... }',
        });
      }

      // Check for nested loops that might benefit from early exit
      if (/for\s*\([^)]+\)\s*\{/.test(line)) {
        // Look for nested loop within next 10 lines
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          if (/for\s*\([^)]+\)\s*\{/.test(lines[j])) {
            improvements.push({
              type: 'nested_loop',
              description: 'Nested loop detected. Consider early exit or algorithm improvement',
              impact: 'high',
              location: `Lines ${i + 1}-${j + 1}`,
            });
            break;
          }
        }
      }
    }

    return improvements;
  }

  private findAlgorithmOptimizations(code: string): OptimizationImprovement[] {
    const improvements: OptimizationImprovement[] = [];

    // Check for linear search that could be optimized
    if (/\.find\(|\.indexOf\(|\.includes\(/.test(code)) {
      improvements.push({
        type: 'search_algorithm',
        description: 'Consider using Map or Set for O(1) lookups instead of linear search',
        impact: 'high',
        location: 'Multiple locations',
        suggestedCode: 'const lookupSet = new Set(array); lookupSet.has(value)',
      });
    }

    // Check for repeated string concatenation
    if (/(\w+\s*\+=\s*['"][^'"]*['"]\s*)+/.test(code)) {
      improvements.push({
        type: 'string_concatenation',
        description: 'Use array join or template literals instead of string concatenation',
        impact: 'medium',
        location: 'String operations',
        suggestedCode: 'const parts = []; parts.push(str); parts.join("")',
      });
    }

    // Check for sorting that might be optimized
    if (/\.sort\(/.test(code)) {
      improvements.push({
        type: 'sorting',
        description: 'Ensure sort comparator is optimized. Consider partial sorting if only top N needed',
        impact: 'medium',
        location: 'Sort operations',
      });
    }

    // Check for JSON parse/stringify in loops
    if (/JSON\.(parse|stringify)/.test(code)) {
      improvements.push({
        type: 'serialization',
        description: 'JSON operations are expensive. Consider caching or using structured clone',
        impact: 'medium',
        location: 'JSON operations',
      });
    }

    return improvements;
  }

  private findLazyEvaluationOpportunities(code: string): OptimizationImprovement[] {
    const improvements: OptimizationImprovement[] = [];

    // Check for map followed by filter (could be combined or lazy)
    if (/\.map\([^)]+\)\s*\.filter\(|\.filter\([^)]+\)\s*\.map\(/.test(code)) {
      improvements.push({
        type: 'chain_optimization',
        description: 'Chain of map/filter can be optimized. Consider using reduce or lazy evaluation',
        impact: 'medium',
        location: 'Array method chains',
        suggestedCode: 'Use a single reduce() or generator function',
      });
    }

    // Check for eager loading patterns
    if (/await\s+Promise\.all\s*\(/.test(code)) {
      improvements.push({
        type: 'lazy_loading',
        description: 'Consider lazy loading data only when needed instead of eager Promise.all',
        impact: 'low',
        location: 'Promise operations',
      });
    }

    // Check for computed values that could be memoized
    if (/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?return\s+[^;]+;/.test(code)) {
      improvements.push({
        type: 'memoization',
        description: 'Consider memoizing expensive pure functions',
        impact: 'medium',
        location: 'Function definitions',
        suggestedCode: 'const memoized = memoize(expensiveFunction)',
      });
    }

    return improvements;
  }

  private findParallelizationOpportunities(code: string): OptimizationImprovement[] {
    const improvements: OptimizationImprovement[] = [];

    // Check for sequential awaits that could be parallel
    // Match patterns like: await x(); \n await y(); or await x;\nawait y;
    const sequentialAwaits = code.match(/await\s+[^;]+;\s*[\r\n]+\s*(?:const\s+\w+\s*=\s*)?await\s+/g);
    if (sequentialAwaits && sequentialAwaits.length > 0) {
      improvements.push({
        type: 'parallel_await',
        description: 'Sequential awaits detected. Consider Promise.all for independent operations',
        impact: 'high',
        location: 'Async operations',
        suggestedCode: 'const [result1, result2] = await Promise.all([op1(), op2()])',
      });
    }

    // Check for heavy computation that could use workers
    if (/for\s*\([^)]+\)\s*\{[\s\S]{200,}\}/.test(code)) {
      improvements.push({
        type: 'worker_offload',
        description: 'Heavy computation loop detected. Consider offloading to Web Workers',
        impact: 'high',
        location: 'Large loops',
      });
    }

    return improvements;
  }

  private applyOptimizations(
    code: string,
    improvements: OptimizationImprovement[]
  ): string {
    let optimized = code;

    // Apply length caching optimization
    const lengthCaching = improvements.find((i) => i.type === 'loop_length_caching');
    if (lengthCaching) {
      optimized = optimized.replace(
        /for\s*\(\s*(let|var)\s+(\w+)\s*=\s*(\d+)\s*;\s*\2\s*<\s*(\w+)\.length\s*;/g,
        'for (let $2 = $3, _len = $4.length; $2 < _len;'
      );
    }

    // Add optimization comments for manual review
    if (improvements.length > 0) {
      const header = `// OPTIMIZATION OPPORTUNITIES DETECTED:\n` +
        improvements.map((i) => `// - ${i.type}: ${i.description}`).join('\n') +
        '\n\n';
      optimized = header + optimized;
    }

    return optimized;
  }

  private calculateOptimizationMetrics(
    original: string,
    optimized: string,
    improvements: OptimizationImprovement[]
  ): OptimizationResult['metrics'] {
    // Estimate speedup based on improvement types
    let speedupFactor = 1.0;
    let memoryReduction = 0;
    let complexityReduction = 0;

    for (const improvement of improvements) {
      switch (improvement.impact) {
        case 'high':
          speedupFactor *= 1.3;
          complexityReduction += 0.15;
          break;
        case 'medium':
          speedupFactor *= 1.15;
          complexityReduction += 0.08;
          break;
        case 'low':
          speedupFactor *= 1.05;
          complexityReduction += 0.03;
          break;
      }

      // Memory-specific improvements
      if (
        improvement.type === 'string_concatenation' ||
        improvement.type === 'streaming' ||
        improvement.type === 'lazy_loading'
      ) {
        memoryReduction += 0.1;
      }
    }

    return {
      estimatedSpeedup: Math.round(speedupFactor * 100) / 100,
      memoryReduction: Math.min(0.9, memoryReduction),
      complexityReduction: Math.min(0.9, complexityReduction),
    };
  }

  // ==========================================================================
  // Memory Optimization Helpers
  // ==========================================================================

  private analyzeForPooling(allocations: MemoryAllocation[]): MemoryOptimizationSuggestion[] {
    const suggestions: MemoryOptimizationSuggestion[] = [];

    for (const alloc of allocations) {
      // Suggest pooling for frequent small allocations
      if (alloc.count > 1000 && alloc.size < 1024) {
        suggestions.push({
          type: 'object_pooling',
          description: `Frequent small allocations of ${alloc.type} detected. Consider object pooling.`,
          expectedSavings: Math.floor(alloc.size * alloc.count * 0.3),
          priority: 'high',
          implementation: `Create a pool of reusable ${alloc.type} objects`,
        });
      }

      // Suggest typed arrays for numeric data
      if (alloc.type === 'Array' && alloc.size > 10000) {
        suggestions.push({
          type: 'typed_array',
          description: 'Large arrays detected. Consider TypedArrays for numeric data.',
          expectedSavings: Math.floor(alloc.size * 0.5),
          priority: 'medium',
          implementation: 'Use Float64Array, Int32Array, etc. for numeric arrays',
        });
      }
    }

    return suggestions;
  }

  private analyzeBufferUsage(profile: MemoryProfile): MemoryOptimizationSuggestion[] {
    const suggestions: MemoryOptimizationSuggestion[] = [];

    // Check for buffer reuse opportunities
    if (profile.arrayBuffers > 5 * 1024 * 1024) {
      suggestions.push({
        type: 'buffer_reuse',
        description: 'Multiple array buffers detected. Consider buffer pooling and reuse.',
        expectedSavings: Math.floor(profile.arrayBuffers * 0.4),
        priority: 'medium',
        implementation: 'Create a BufferPool class with checkout/release methods',
      });
    }

    // Check external memory (native addons, etc.)
    if (profile.external > 10 * 1024 * 1024) {
      suggestions.push({
        type: 'external_memory',
        description: 'High external memory usage. Review native module allocations.',
        expectedSavings: Math.floor(profile.external * 0.2),
        priority: 'low',
        implementation: 'Audit native modules and ensure proper cleanup',
      });
    }

    return suggestions;
  }

  private analyzeForWeakReferences(allocations: MemoryAllocation[]): MemoryOptimizationSuggestion[] {
    const suggestions: MemoryOptimizationSuggestion[] = [];

    for (const alloc of allocations) {
      // Suggest WeakMap for cache-like patterns
      if (alloc.type === 'Map' && alloc.size > 1024 * 1024) {
        suggestions.push({
          type: 'weak_reference',
          description: 'Large Map detected. Consider WeakMap if keys are objects to enable GC.',
          expectedSavings: Math.floor(alloc.size * 0.3),
          priority: 'medium',
          implementation: 'Replace Map with WeakMap for object-keyed caches',
        });
      }

      // Suggest WeakSet for object collections
      if (alloc.type === 'Set' && alloc.size > 512 * 1024) {
        suggestions.push({
          type: 'weak_reference',
          description: 'Large Set detected. Consider WeakSet if storing object references.',
          expectedSavings: Math.floor(alloc.size * 0.25),
          priority: 'medium',
          implementation: 'Replace Set with WeakSet for object tracking',
        });
      }
    }

    return suggestions;
  }

  // ==========================================================================
  // Query Optimization Helpers
  // ==========================================================================

  private optimizeSingleQuery(query: string): QueryOptimizationResult {
    const queryLower = query.toLowerCase().trim();
    let optimized = query;
    const suggestions: string[] = [];
    const suggestedIndexes: string[] = [];
    let estimatedImprovement = 0;

    // Detect query type
    const isSQL = /^\s*(select|insert|update|delete|with)\s+/i.test(queryLower);
    const isGraphQL = /^\s*(query|mutation|subscription|fragment|\{)/i.test(queryLower);

    if (isSQL) {
      // SQL optimizations

      // Check for SELECT *
      if (/select\s+\*\s+from/i.test(query)) {
        suggestions.push('Replace SELECT * with specific columns');
        estimatedImprovement += 15;
      }

      // Check for missing WHERE clause
      if (/select\s+.+\s+from\s+\w+\s*$/i.test(query)) {
        suggestions.push('Add WHERE clause to limit results');
        estimatedImprovement += 30;
      }

      // Check for LIKE with leading wildcard
      if (/like\s+['"]\%/i.test(query)) {
        suggestions.push('Avoid leading wildcards in LIKE clauses - they prevent index usage');
        estimatedImprovement += 40;
      }

      // Check for N+1 potential (subqueries)
      if (/select\s+.+\(\s*select\s+/i.test(query)) {
        suggestions.push('Replace correlated subquery with JOIN');
        estimatedImprovement += 50;
      }

      // Check for ORDER BY without LIMIT
      if (/order\s+by\s+\w+/i.test(query) && !/limit\s+\d+/i.test(query)) {
        suggestions.push('Add LIMIT when using ORDER BY for pagination');
        estimatedImprovement += 20;
      }

      // Suggest indexes based on WHERE and JOIN clauses
      const whereMatch = query.match(/where\s+(\w+)\s*[=<>]/i);
      if (whereMatch) {
        suggestedIndexes.push(`CREATE INDEX idx_${whereMatch[1]} ON table(${whereMatch[1]})`);
      }

      const joinMatch = query.match(/join\s+\w+\s+on\s+\w+\.(\w+)\s*=/i);
      if (joinMatch) {
        suggestedIndexes.push(`CREATE INDEX idx_${joinMatch[1]} ON table(${joinMatch[1]})`);
      }
    }

    if (isGraphQL) {
      // GraphQL optimizations

      // Check for over-fetching (deep nesting)
      const nestingLevel = (query.match(/{/g) || []).length;
      if (nestingLevel > 5) {
        suggestions.push('Consider breaking deeply nested query into smaller queries');
        estimatedImprovement += 25;
      }

      // Check for missing fragment usage
      if ((query.match(/\w+\s*\{[^}]+\}/g) || []).length > 3 && !/fragment\s+/i.test(query)) {
        suggestions.push('Use fragments for repeated field selections');
        estimatedImprovement += 10;
      }

      // Check for missing pagination
      if (!/(first|last|limit|offset|skip|take):\s*\d+/i.test(query)) {
        suggestions.push('Add pagination arguments (first, after, etc.) for list queries');
        estimatedImprovement += 35;
      }
    }

    // Apply simple optimizations
    if (isSQL) {
      // Replace SELECT * with placeholder
      optimized = optimized.replace(
        /select\s+\*\s+from/gi,
        'SELECT /* specify columns */ FROM'
      );

      // Add LIMIT suggestion
      if (/order\s+by/i.test(optimized) && !/limit/i.test(optimized)) {
        optimized = optimized.trim() + ' LIMIT 100';
      }
    }

    return {
      original: query,
      optimized,
      explanation: suggestions.length > 0
        ? suggestions.join('. ')
        : 'Query appears to be well-optimized',
      estimatedImprovement: Math.min(100, estimatedImprovement),
      suggestedIndexes: suggestedIndexes.length > 0 ? suggestedIndexes : undefined,
    };
  }

  // ==========================================================================
  // Caching Strategy Helpers
  // ==========================================================================

  private calculateTTL(volatility: 'low' | 'medium' | 'high', cacheType: string): number {
    const baseTTL: Record<string, number> = {
      memory: 60,
      redis: 300,
      cdn: 3600,
    };

    const volatilityMultiplier: Record<string, number> = {
      low: 10,
      medium: 1,
      high: 0.1,
    };

    return Math.round((baseTTL[cacheType] || 60) * volatilityMultiplier[volatility]);
  }

  private calculateCacheHitRate(
    readWriteRatio: number,
    volatility: 'low' | 'medium' | 'high',
    layerCount: number
  ): number {
    // Base hit rate from read/write ratio
    let hitRate = Math.min(0.95, readWriteRatio / (readWriteRatio + 1));

    // Adjust for volatility
    const volatilityPenalty: Record<string, number> = {
      low: 0,
      medium: 0.1,
      high: 0.25,
    };
    hitRate -= volatilityPenalty[volatility];

    // Boost for multiple layers
    hitRate += layerCount * 0.05;

    return Math.min(0.99, Math.max(0.1, hitRate));
  }

  // ==========================================================================
  // Benchmark Helpers
  // ==========================================================================

  private getBenchmarkSuite(suite: string): Array<{ name: string; fn: () => Promise<void> }> {
    // Return default benchmark suite
    const benchmarks: Array<{ name: string; fn: () => Promise<void> }> = [
      {
        name: 'array_iteration_for',
        fn: async () => {
          const arr = new Array(10000).fill(0);
          let sum = 0;
          for (let i = 0; i < arr.length; i++) {
            sum += arr[i];
          }
        },
      },
      {
        name: 'array_iteration_forEach',
        fn: async () => {
          const arr = new Array(10000).fill(0);
          let sum = 0;
          arr.forEach((v) => {
            sum += v;
          });
        },
      },
      {
        name: 'array_map_filter',
        fn: async () => {
          const arr = new Array(1000).fill(0).map((_, i) => i);
          arr.map((x) => x * 2).filter((x) => x > 500);
        },
      },
      {
        name: 'object_creation',
        fn: async () => {
          for (let i = 0; i < 1000; i++) {
            const obj = { a: 1, b: 2, c: 3 };
          }
        },
      },
      {
        name: 'string_concatenation',
        fn: async () => {
          let str = '';
          for (let i = 0; i < 100; i++) {
            str += 'test';
          }
        },
      },
      {
        name: 'string_template',
        fn: async () => {
          const parts: string[] = [];
          for (let i = 0; i < 100; i++) {
            parts.push('test');
          }
          parts.join('');
        },
      },
      {
        name: 'map_operations',
        fn: async () => {
          const map = new Map<number, number>();
          for (let i = 0; i < 1000; i++) {
            map.set(i, i * 2);
          }
          for (let i = 0; i < 1000; i++) {
            map.get(i);
          }
        },
      },
      {
        name: 'set_operations',
        fn: async () => {
          const set = new Set<number>();
          for (let i = 0; i < 1000; i++) {
            set.add(i);
          }
          for (let i = 0; i < 1000; i++) {
            set.has(i);
          }
        },
      },
    ];

    // Filter by suite name if specified
    if (suite !== 'all' && suite !== 'default') {
      return benchmarks.filter((b) => b.name.includes(suite));
    }

    return benchmarks;
  }

  private calculateStatistics(measurements: number[]): {
    mean: number;
    stdDev: number;
    p50: number;
    p95: number;
    p99: number;
  } {
    const sorted = [...measurements].sort((a, b) => a - b);
    const n = sorted.length;

    // Mean
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    // Standard deviation
    const squaredDiffs = sorted.map((v) => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / n;
    const stdDev = Math.sqrt(avgSquaredDiff);

    // Percentiles
    const p50 = sorted[Math.floor(n * 0.5)];
    const p95 = sorted[Math.floor(n * 0.95)];
    const p99 = sorted[Math.floor(n * 0.99)];

    return {
      mean: Math.round(mean * 1000) / 1000,
      stdDev: Math.round(stdDev * 1000) / 1000,
      p50: Math.round(p50 * 1000) / 1000,
      p95: Math.round(p95 * 1000) / 1000,
      p99: Math.round(p99 * 1000) / 1000,
    };
  }

  private getEnvironmentInfo(): BenchmarkResult['environment'] {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      cpuCount: typeof process.cpuUsage === 'function' ? 1 : 1, // Simplified
      memoryMB: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)),
    };
  }

  // ==========================================================================
  // Agent Booster Integration (352x Faster Transformations)
  // ==========================================================================

  /**
   * Initialize the Agent Booster adapter
   *
   * Call this before using applyOptimizationWithBooster for faster transformations.
   */
  async initializeBooster(): Promise<void> {
    if (this.booster) {
      return;
    }

    try {
      this.booster = await createAgentBoosterAdapter({
        enableTemplates: true,
        enableSimilarityMatching: true,
        confidenceThreshold: 0.7,
      });
      this.logger.info('Agent Booster initialized successfully');
    } catch (error) {
      this.logger.warn('Failed to initialize Agent Booster, will use fallback', {
        error: error instanceof Error ? error.message : String(error),
      });
      this.booster = null;
    }
  }

  /**
   * Check if Agent Booster is available
   */
  isBoosterAvailable(): boolean {
    return this.booster?.isAvailable() ?? false;
  }

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
  async applyOptimizationWithBooster(
    code: string,
    optimization: OptimizationResult,
    language: SupportedLanguage = 'typescript'
  ): Promise<{
    success: boolean;
    code: string;
    appliedCount: number;
    totalLatencyMs: number;
    details: Array<{
      improvement: string;
      applied: boolean;
      latencyMs: number;
    }>;
  }> {
    // Initialize booster if not already done
    if (!this.booster) {
      await this.initializeBooster();
    }

    // If booster still not available, return with no changes
    if (!this.booster?.isAvailable()) {
      this.logger.debug('Agent Booster not available, skipping fast optimization');
      return {
        success: false,
        code,
        appliedCount: 0,
        totalLatencyMs: 0,
        details: [],
      };
    }

    let currentCode = code;
    let appliedCount = 0;
    let totalLatency = 0;
    const details: Array<{
      improvement: string;
      applied: boolean;
      latencyMs: number;
    }> = [];

    // Apply each improvement using the booster
    for (const improvement of optimization.improvements) {
      const result = await this.booster.transform({
        code: currentCode,
        instruction: improvement.description,
        language,
      });

      details.push({
        improvement: improvement.type,
        applied: result.success,
        latencyMs: result.latencyMs,
      });

      if (result.success) {
        currentCode = result.transformedCode;
        appliedCount++;
      }

      totalLatency += result.latencyMs;
    }

    this.logger.info('Agent Booster optimization complete', {
      appliedCount,
      totalImprovements: optimization.improvements.length,
      totalLatencyMs: Math.round(totalLatency * 100) / 100,
    });

    return {
      success: appliedCount > 0,
      code: currentCode,
      appliedCount,
      totalLatencyMs: Math.round(totalLatency * 100) / 100,
      details,
    };
  }

  /**
   * Apply a specific optimization type using Agent Booster
   *
   * @param code - Source code to optimize
   * @param optimizationType - Type of optimization to apply
   * @param language - Programming language
   * @returns Transformation result
   */
  async applyBoosterOptimization(
    code: string,
    optimizationType: 'loop' | 'async' | 'memory' | 'general',
    language: SupportedLanguage = 'typescript'
  ): Promise<{
    success: boolean;
    code: string;
    latencyMs: number;
    confidence: number;
  }> {
    if (!this.booster) {
      await this.initializeBooster();
    }

    if (!this.booster?.isAvailable()) {
      return {
        success: false,
        code,
        latencyMs: 0,
        confidence: 0,
      };
    }

    const result = await this.booster.applyOptimization(code, optimizationType, language);

    return {
      success: result.success,
      code: result.transformedCode,
      latencyMs: result.latencyMs,
      confidence: result.confidence,
    };
  }

  /**
   * Get Agent Booster status
   */
  getBoosterStatus(): {
    available: boolean;
    initialized: boolean;
    version?: string;
    fallbackMode: boolean;
  } {
    if (!this.booster) {
      return {
        available: false,
        initialized: false,
        fallbackMode: false,
      };
    }

    const status = this.booster.getStatus();
    return {
      available: status.available,
      initialized: status.initialized,
      version: this.booster.getVersion(),
      fallbackMode: this.booster.isFallbackMode(),
    };
  }
}
