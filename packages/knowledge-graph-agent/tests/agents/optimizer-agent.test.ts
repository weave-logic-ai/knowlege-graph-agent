/**
 * OptimizerAgent Tests
 *
 * Comprehensive test suite for the OptimizerAgent covering:
 * - Performance optimization
 * - Memory profiling
 * - Query optimization
 * - Caching strategy design
 * - Benchmarking
 *
 * @module agents/__tests__/optimizer-agent.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  OptimizerAgent,
  type OptimizationResult,
  type MemoryProfile,
  type MemoryOptimizationResult,
  type QueryOptimizationResult,
  type CachingStrategy,
  type BenchmarkResult,
  type SystemArchitecture,
  type OptimizerAgentConfig,
} from '../../src/agents/optimizer-agent.js';
import { AgentType, TaskPriority, createTaskId } from '../../src/agents/types.js';

describe('OptimizerAgent', () => {
  let agent: OptimizerAgent;

  beforeEach(() => {
    agent = new OptimizerAgent({
      name: 'test-optimizer',
      targetImprovement: 20,
      memoryThreshold: 100,
    });
  });

  // ==========================================================================
  // Constructor Tests
  // ==========================================================================

  describe('constructor', () => {
    it('should create an agent with correct type', () => {
      expect(agent.type).toBe(AgentType.OPTIMIZER);
    });

    it('should have correct capabilities', () => {
      expect(agent.capabilities).toContain('performance_tuning');
      expect(agent.capabilities).toContain('memory_optimization');
      expect(agent.capabilities).toContain('query_optimization');
      expect(agent.capabilities).toContain('caching_strategy');
      expect(agent.capabilities).toContain('benchmark');
    });

    it('should use default values when not provided', () => {
      const defaultAgent = new OptimizerAgent({ name: 'default-optimizer' });
      expect(defaultAgent).toBeDefined();
      expect(defaultAgent.type).toBe(AgentType.OPTIMIZER);
    });

    it('should accept custom configuration', () => {
      const customAgent = new OptimizerAgent({
        name: 'custom-optimizer',
        targetImprovement: 50,
        memoryThreshold: 200,
        detailedProfiling: true,
      });
      expect(customAgent).toBeDefined();
    });
  });

  // ==========================================================================
  // Performance Optimization Tests
  // ==========================================================================

  describe('optimizePerformance', () => {
    it('should detect loop length caching opportunity', async () => {
      const code = `
        for (let i = 0; i < items.length; i++) {
          process(items[i]);
        }
      `;

      const result = await agent.optimizePerformance(code);

      expect(result.original).toBe(code);
      expect(result.improvements.length).toBeGreaterThan(0);
      expect(result.improvements.some((i) => i.type === 'loop_length_caching')).toBe(true);
    });

    it('should detect forEach optimization opportunity', async () => {
      const code = `
        items.forEach(item => {
          process(item);
        });
      `;

      const result = await agent.optimizePerformance(code);

      expect(result.improvements.some((i) => i.type === 'loop_type')).toBe(true);
    });

    it('should detect nested loops', async () => {
      const code = `
        for (let i = 0; i < outer.length; i++) {
          for (let j = 0; j < inner.length; j++) {
            process(outer[i], inner[j]);
          }
        }
      `;

      const result = await agent.optimizePerformance(code);

      expect(result.improvements.some((i) => i.type === 'nested_loop')).toBe(true);
    });

    it('should detect search algorithm optimization', async () => {
      const code = `
        const found = items.find(item => item.id === targetId);
        const exists = items.includes(value);
      `;

      const result = await agent.optimizePerformance(code);

      expect(result.improvements.some((i) => i.type === 'search_algorithm')).toBe(true);
    });

    it('should detect string concatenation inefficiency', async () => {
      const code = `
        let result = "";
        result += "hello";
        result += "world";
      `;

      const result = await agent.optimizePerformance(code);

      expect(result.improvements.some((i) => i.type === 'string_concatenation')).toBe(true);
    });

    it('should detect sequential await optimization', async () => {
      const code = `
        const result1 = await fetchData1();
        const result2 = await fetchData2();
        const result3 = await fetchData3();
      `;

      const result = await agent.optimizePerformance(code);

      expect(result.improvements.some((i) => i.type === 'parallel_await')).toBe(true);
    });

    it('should detect memoization opportunity', async () => {
      const code = `
        function expensiveCalculation(x) {
          return x * x * x;
        }
      `;

      const result = await agent.optimizePerformance(code);

      expect(result.improvements.some((i) => i.type === 'memoization')).toBe(true);
    });

    it('should detect chain optimization opportunity', async () => {
      const code = `
        const result = items.map(x => x * 2).filter(x => x > 10);
      `;

      const result = await agent.optimizePerformance(code);

      expect(result.improvements.some((i) => i.type === 'chain_optimization')).toBe(true);
    });

    it('should calculate optimization metrics', async () => {
      const code = `
        for (let i = 0; i < items.length; i++) {
          items.forEach(item => console.log(item));
        }
      `;

      const result = await agent.optimizePerformance(code);

      expect(result.metrics).toBeDefined();
      expect(result.metrics.estimatedSpeedup).toBeGreaterThanOrEqual(1);
      expect(result.metrics.memoryReduction).toBeGreaterThanOrEqual(0);
      expect(result.metrics.complexityReduction).toBeGreaterThanOrEqual(0);
    });

    it('should generate optimized code with comments', async () => {
      const code = `
        for (let i = 0; i < items.length; i++) {
          process(items[i]);
        }
      `;

      const result = await agent.optimizePerformance(code);

      expect(result.optimized).toContain('OPTIMIZATION OPPORTUNITIES');
    });

    it('should handle code with no optimization opportunities', async () => {
      const code = `const x = 1;`;

      const result = await agent.optimizePerformance(code);

      expect(result).toBeDefined();
      expect(result.original).toBe(code);
    });
  });

  // ==========================================================================
  // Memory Optimization Tests
  // ==========================================================================

  describe('optimizeMemory', () => {
    it('should detect high heap usage', async () => {
      const profile: MemoryProfile = {
        heapUsed: 200 * 1024 * 1024, // 200MB
        heapTotal: 256 * 1024 * 1024,
        external: 10 * 1024 * 1024,
        arrayBuffers: 5 * 1024 * 1024,
        allocations: [],
      };

      const result = await agent.optimizeMemory(profile);

      expect(result.suggestions.some((s) => s.type === 'heap_reduction')).toBe(true);
      expect(result.estimatedTotalSavings).toBeGreaterThan(0);
    });

    it('should suggest object pooling for frequent allocations', async () => {
      const profile: MemoryProfile = {
        heapUsed: 50 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        external: 1 * 1024 * 1024,
        arrayBuffers: 1 * 1024 * 1024,
        allocations: [
          { type: 'SmallObject', size: 256, count: 5000 },
        ],
      };

      const result = await agent.optimizeMemory(profile);

      expect(result.suggestions.some((s) => s.type === 'object_pooling')).toBe(true);
    });

    it('should suggest typed arrays for large arrays', async () => {
      const profile: MemoryProfile = {
        heapUsed: 50 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        external: 1 * 1024 * 1024,
        arrayBuffers: 1 * 1024 * 1024,
        allocations: [
          { type: 'Array', size: 50000, count: 10 },
        ],
      };

      const result = await agent.optimizeMemory(profile);

      expect(result.suggestions.some((s) => s.type === 'typed_array')).toBe(true);
    });

    it('should suggest streaming for large array buffers', async () => {
      const profile: MemoryProfile = {
        heapUsed: 50 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        external: 1 * 1024 * 1024,
        arrayBuffers: 20 * 1024 * 1024, // 20MB
        allocations: [],
      };

      const result = await agent.optimizeMemory(profile);

      expect(result.suggestions.some((s) => s.type === 'streaming')).toBe(true);
    });

    it('should suggest WeakMap for large Maps', async () => {
      const profile: MemoryProfile = {
        heapUsed: 50 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        external: 1 * 1024 * 1024,
        arrayBuffers: 1 * 1024 * 1024,
        allocations: [
          { type: 'Map', size: 2 * 1024 * 1024, count: 5 },
        ],
      };

      const result = await agent.optimizeMemory(profile);

      expect(result.suggestions.some((s) => s.type === 'weak_reference')).toBe(true);
    });

    it('should suggest buffer reuse for large buffer usage', async () => {
      const profile: MemoryProfile = {
        heapUsed: 50 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        external: 1 * 1024 * 1024,
        arrayBuffers: 10 * 1024 * 1024, // 10MB
        allocations: [],
      };

      const result = await agent.optimizeMemory(profile);

      expect(result.suggestions.some((s) => s.type === 'buffer_reuse')).toBe(true);
    });

    it('should sort suggestions by priority', async () => {
      const profile: MemoryProfile = {
        heapUsed: 200 * 1024 * 1024,
        heapTotal: 256 * 1024 * 1024,
        external: 20 * 1024 * 1024,
        arrayBuffers: 20 * 1024 * 1024,
        allocations: [
          { type: 'SmallObject', size: 256, count: 5000 },
          { type: 'Map', size: 2 * 1024 * 1024, count: 5 },
        ],
      };

      const result = await agent.optimizeMemory(profile);

      // High priority should come first
      const priorities = result.suggestions.map((s) => s.priority);
      expect(priorities[0]).toBe('high');
    });

    it('should calculate estimated reduction percentage', async () => {
      const profile: MemoryProfile = {
        heapUsed: 100 * 1024 * 1024,
        heapTotal: 200 * 1024 * 1024,
        external: 5 * 1024 * 1024,
        arrayBuffers: 5 * 1024 * 1024,
        allocations: [],
      };

      const result = await agent.optimizeMemory(profile);

      expect(result.estimatedReduction).toBeGreaterThanOrEqual(0);
      expect(result.estimatedReduction).toBeLessThanOrEqual(1);
    });
  });

  // ==========================================================================
  // Query Optimization Tests
  // ==========================================================================

  describe('optimizeQueries', () => {
    it('should detect SELECT * usage', async () => {
      const queries = ['SELECT * FROM users WHERE id = 1'];

      const results = await agent.optimizeQueries(queries);

      expect(results[0].explanation).toContain('specific columns');
    });

    it('should suggest adding WHERE clause', async () => {
      const queries = ['SELECT id, name FROM users'];

      const results = await agent.optimizeQueries(queries);

      expect(results[0].explanation).toContain('WHERE');
    });

    it('should warn about leading wildcards in LIKE', async () => {
      const queries = [`SELECT * FROM users WHERE name LIKE '%john%'`];

      const results = await agent.optimizeQueries(queries);

      expect(results[0].explanation).toContain('wildcard');
    });

    it('should detect N+1 potential with subqueries', async () => {
      const queries = [
        'SELECT id, (SELECT COUNT(*) FROM orders WHERE user_id = users.id) FROM users',
      ];

      const results = await agent.optimizeQueries(queries);

      expect(results[0].explanation).toContain('JOIN');
    });

    it('should suggest LIMIT for ORDER BY', async () => {
      const queries = ['SELECT id, name FROM users ORDER BY created_at'];

      const results = await agent.optimizeQueries(queries);

      expect(results[0].optimized).toContain('LIMIT');
    });

    it('should suggest indexes for WHERE clauses', async () => {
      const queries = ['SELECT id FROM users WHERE email = "test@example.com"'];

      const results = await agent.optimizeQueries(queries);

      expect(results[0].suggestedIndexes).toBeDefined();
      expect(results[0].suggestedIndexes!.length).toBeGreaterThan(0);
    });

    it('should optimize GraphQL queries - pagination', async () => {
      const queries = [
        `query { users { id name email } }`,
      ];

      const results = await agent.optimizeQueries(queries);

      expect(results[0].explanation).toContain('pagination');
    });

    it('should optimize GraphQL queries - fragments', async () => {
      const queries = [
        `query {
          users { id name }
          admins { id name }
          guests { id name }
          members { id name }
        }`,
      ];

      const results = await agent.optimizeQueries(queries);

      expect(results[0].explanation).toContain('fragment');
    });

    it('should handle well-optimized queries', async () => {
      const queries = [
        'SELECT id, name FROM users WHERE id = 1 LIMIT 1',
      ];

      const results = await agent.optimizeQueries(queries);

      expect(results[0].explanation).toContain('well-optimized');
    });

    it('should calculate estimated improvement', async () => {
      const queries = ['SELECT * FROM users'];

      const results = await agent.optimizeQueries(queries);

      expect(results[0].estimatedImprovement).toBeGreaterThanOrEqual(0);
      expect(results[0].estimatedImprovement).toBeLessThanOrEqual(100);
    });
  });

  // ==========================================================================
  // Caching Strategy Tests
  // ==========================================================================

  describe('designCachingStrategy', () => {
    it('should design memory cache for high read ratio', async () => {
      const architecture: SystemArchitecture = {
        appTier: 'web',
        database: 'PostgreSQL',
        readWriteRatio: 10,
        requestRate: 50,
        dataVolatility: 'low',
      };

      const strategy = await agent.designCachingStrategy(architecture);

      expect(strategy.layers.some((l) => l.type === 'memory')).toBe(true);
    });

    it('should design Redis cache for high request rate', async () => {
      const architecture: SystemArchitecture = {
        appTier: 'api',
        database: 'MySQL',
        readWriteRatio: 5,
        requestRate: 500,
        dataVolatility: 'medium',
      };

      const strategy = await agent.designCachingStrategy(architecture);

      expect(strategy.layers.some((l) => l.type === 'redis')).toBe(true);
    });

    it('should design CDN layer for low latency requirements', async () => {
      const architecture: SystemArchitecture = {
        appTier: 'web',
        database: 'PostgreSQL',
        readWriteRatio: 20,
        requestRate: 1000,
        dataVolatility: 'low',
        latencyRequirement: 20,
      };

      const strategy = await agent.designCachingStrategy(architecture);

      expect(strategy.layers.some((l) => l.type === 'cdn')).toBe(true);
    });

    it('should include appropriate patterns', async () => {
      const architecture: SystemArchitecture = {
        appTier: 'web',
        database: 'PostgreSQL',
        readWriteRatio: 10,
        requestRate: 100,
        dataVolatility: 'low',
      };

      const strategy = await agent.designCachingStrategy(architecture);

      expect(strategy.patterns.length).toBeGreaterThan(0);
    });

    it('should use shorter TTL for high volatility', async () => {
      const lowVolatility: SystemArchitecture = {
        appTier: 'web',
        database: 'PostgreSQL',
        readWriteRatio: 10,
        requestRate: 100,
        dataVolatility: 'low',
      };

      const highVolatility: SystemArchitecture = {
        ...lowVolatility,
        dataVolatility: 'high',
      };

      const strategyLow = await agent.designCachingStrategy(lowVolatility);
      const strategyHigh = await agent.designCachingStrategy(highVolatility);

      // Both should have memory layer for read ratio > 5
      const lowTTL = strategyLow.layers.find((l) => l.type === 'memory')?.ttl ?? 0;
      const highTTL = strategyHigh.layers.find((l) => l.type === 'memory')?.ttl ?? 0;

      expect(lowTTL).toBeGreaterThan(highTTL);
    });

    it('should calculate estimated hit rate', async () => {
      const architecture: SystemArchitecture = {
        appTier: 'web',
        database: 'PostgreSQL',
        readWriteRatio: 10,
        requestRate: 100,
        dataVolatility: 'low',
      };

      const strategy = await agent.designCachingStrategy(architecture);

      expect(strategy.estimatedHitRate).toBeGreaterThan(0);
      expect(strategy.estimatedHitRate).toBeLessThanOrEqual(1);
    });

    it('should include invalidation strategy for each layer', async () => {
      const architecture: SystemArchitecture = {
        appTier: 'web',
        database: 'PostgreSQL',
        readWriteRatio: 10,
        requestRate: 500,
        dataVolatility: 'medium',
        latencyRequirement: 30,
      };

      const strategy = await agent.designCachingStrategy(architecture);

      for (const layer of strategy.layers) {
        expect(layer.invalidation).toBeDefined();
        expect(layer.invalidation.length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // Benchmark Tests
  // ==========================================================================

  describe('runBenchmark', () => {
    it('should run default benchmark suite', async () => {
      const result = await agent.runBenchmark('default', 10);

      expect(result.suite).toBe('default');
      expect(result.iterations).toBe(10);
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should run specific benchmark', async () => {
      const result = await agent.runBenchmark('array', 5);

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.every((r) => r.name.includes('array'))).toBe(true);
    });

    it('should calculate mean execution time', async () => {
      const result = await agent.runBenchmark('default', 10);

      for (const measurement of result.results) {
        expect(measurement.meanMs).toBeGreaterThanOrEqual(0);
      }
    });

    it('should calculate standard deviation', async () => {
      const result = await agent.runBenchmark('default', 10);

      for (const measurement of result.results) {
        expect(measurement.stdDev).toBeGreaterThanOrEqual(0);
      }
    });

    it('should calculate operations per second', async () => {
      const result = await agent.runBenchmark('default', 10);

      for (const measurement of result.results) {
        expect(measurement.opsPerSecond).toBeGreaterThan(0);
      }
    });

    it('should calculate percentiles', async () => {
      const result = await agent.runBenchmark('default', 20);

      for (const measurement of result.results) {
        expect(measurement.percentiles.p50).toBeGreaterThanOrEqual(0);
        expect(measurement.percentiles.p95).toBeGreaterThanOrEqual(measurement.percentiles.p50);
        expect(measurement.percentiles.p99).toBeGreaterThanOrEqual(measurement.percentiles.p95);
      }
    });

    it('should include timestamp', async () => {
      const result = await agent.runBenchmark('default', 5);

      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should include environment info', async () => {
      const result = await agent.runBenchmark('default', 5);

      expect(result.environment).toBeDefined();
      expect(result.environment?.nodeVersion).toBeDefined();
      expect(result.environment?.platform).toBeDefined();
    });
  });

  // ==========================================================================
  // Task Execution Tests
  // ==========================================================================

  describe('execute', () => {
    it('should execute performance optimization task', async () => {
      const task = {
        id: createTaskId(),
        description: 'Optimize code performance',
        priority: TaskPriority.MEDIUM,
        input: {
          data: {
            code: 'for (let i = 0; i < arr.length; i++) { console.log(arr[i]); }',
          },
          parameters: {
            taskType: 'performance',
          },
        },
        createdAt: new Date(),
      };

      const result = await agent.execute(task);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should execute memory optimization task', async () => {
      const task = {
        id: createTaskId(),
        description: 'Optimize memory usage',
        priority: TaskPriority.MEDIUM,
        input: {
          data: {
            profile: {
              heapUsed: 100 * 1024 * 1024,
              heapTotal: 200 * 1024 * 1024,
              external: 5 * 1024 * 1024,
              arrayBuffers: 5 * 1024 * 1024,
              allocations: [],
            },
          },
          parameters: {
            taskType: 'memory',
          },
        },
        createdAt: new Date(),
      };

      const result = await agent.execute(task);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should execute query optimization task', async () => {
      const task = {
        id: createTaskId(),
        description: 'Optimize queries',
        priority: TaskPriority.MEDIUM,
        input: {
          data: {
            queries: ['SELECT * FROM users'],
          },
          parameters: {
            taskType: 'query',
          },
        },
        createdAt: new Date(),
      };

      const result = await agent.execute(task);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should execute caching strategy task', async () => {
      const task = {
        id: createTaskId(),
        description: 'Design caching strategy',
        priority: TaskPriority.MEDIUM,
        input: {
          data: {
            architecture: {
              appTier: 'web',
              database: 'PostgreSQL',
              readWriteRatio: 10,
              requestRate: 100,
              dataVolatility: 'low',
            },
          },
          parameters: {
            taskType: 'caching',
          },
        },
        createdAt: new Date(),
      };

      const result = await agent.execute(task);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should execute benchmark task', async () => {
      const task = {
        id: createTaskId(),
        description: 'Run benchmarks',
        priority: TaskPriority.MEDIUM,
        input: {
          data: {
            suite: 'default',
            iterations: 5,
          },
          parameters: {
            taskType: 'benchmark',
          },
        },
        createdAt: new Date(),
      };

      const result = await agent.execute(task);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return error for invalid task type', async () => {
      const task = {
        id: createTaskId(),
        description: 'Unknown task',
        priority: TaskPriority.MEDIUM,
        input: {
          parameters: {
            taskType: 'unknown',
          },
        },
        createdAt: new Date(),
      };

      const result = await agent.execute(task);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_TASK_TYPE');
    });

    it('should return error for missing code in performance task', async () => {
      const task = {
        id: createTaskId(),
        description: 'Optimize performance',
        priority: TaskPriority.MEDIUM,
        input: {
          data: {},
          parameters: {
            taskType: 'performance',
          },
        },
        createdAt: new Date(),
      };

      const result = await agent.execute(task);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for missing profile in memory task', async () => {
      const task = {
        id: createTaskId(),
        description: 'Optimize memory',
        priority: TaskPriority.MEDIUM,
        input: {
          data: {},
          parameters: {
            taskType: 'memory',
          },
        },
        createdAt: new Date(),
      };

      const result = await agent.execute(task);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for missing queries in query task', async () => {
      const task = {
        id: createTaskId(),
        description: 'Optimize queries',
        priority: TaskPriority.MEDIUM,
        input: {
          data: {},
          parameters: {
            taskType: 'query',
          },
        },
        createdAt: new Date(),
      };

      const result = await agent.execute(task);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for missing architecture in caching task', async () => {
      const task = {
        id: createTaskId(),
        description: 'Design caching',
        priority: TaskPriority.MEDIUM,
        input: {
          data: {},
          parameters: {
            taskType: 'caching',
          },
        },
        createdAt: new Date(),
      };

      const result = await agent.execute(task);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for missing suite in benchmark task', async () => {
      const task = {
        id: createTaskId(),
        description: 'Run benchmarks',
        priority: TaskPriority.MEDIUM,
        input: {
          data: {},
          parameters: {
            taskType: 'benchmark',
          },
        },
        createdAt: new Date(),
      };

      const result = await agent.execute(task);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should include execution metrics', async () => {
      const task = {
        id: createTaskId(),
        description: 'Optimize code',
        priority: TaskPriority.MEDIUM,
        input: {
          data: {
            code: 'const x = 1;',
          },
          parameters: {
            taskType: 'performance',
          },
        },
        createdAt: new Date(),
      };

      const result = await agent.execute(task);

      expect(result.metrics).toBeDefined();
      expect(result.metrics?.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should default to performance task type when not specified', async () => {
      const task = {
        id: createTaskId(),
        description: 'Optimize something',
        priority: TaskPriority.MEDIUM,
        input: {
          data: {
            code: 'const x = 1;',
          },
        },
        createdAt: new Date(),
      };

      const result = await agent.execute(task);

      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle empty code', async () => {
      const result = await agent.optimizePerformance('');

      expect(result.original).toBe('');
      expect(result.improvements).toBeDefined();
    });

    it('should handle empty memory allocations', async () => {
      const profile: MemoryProfile = {
        heapUsed: 10 * 1024 * 1024,
        heapTotal: 50 * 1024 * 1024,
        external: 1 * 1024 * 1024,
        arrayBuffers: 1 * 1024 * 1024,
        allocations: [],
      };

      const result = await agent.optimizeMemory(profile);

      expect(result).toBeDefined();
      expect(result.originalProfile).toEqual(profile);
    });

    it('should handle empty queries array', async () => {
      const results = await agent.optimizeQueries([]);

      expect(results).toEqual([]);
    });

    it('should handle minimal architecture config', async () => {
      const architecture: SystemArchitecture = {
        appTier: 'minimal',
        database: 'SQLite',
        readWriteRatio: 1,
        requestRate: 10,
        dataVolatility: 'high',
      };

      const strategy = await agent.designCachingStrategy(architecture);

      expect(strategy).toBeDefined();
      expect(strategy.estimatedHitRate).toBeGreaterThan(0);
    });

    it('should handle zero heap memory', async () => {
      const profile: MemoryProfile = {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        arrayBuffers: 0,
        allocations: [],
      };

      const result = await agent.optimizeMemory(profile);

      expect(result.estimatedReduction).toBe(0);
    });
  });

  // ==========================================================================
  // Integration with BaseAgent
  // ==========================================================================

  describe('BaseAgent integration', () => {
    it('should have correct config', () => {
      expect(agent.config.name).toBe('test-optimizer');
      expect(agent.config.type).toBe(AgentType.OPTIMIZER);
    });

    it('should track state correctly', async () => {
      expect(agent.state.status).toBe('idle');

      const task = {
        id: createTaskId(),
        description: 'Test task',
        priority: TaskPriority.MEDIUM,
        input: {
          data: { code: 'const x = 1;' },
          parameters: { taskType: 'performance' },
        },
        createdAt: new Date(),
      };

      await agent.execute(task);

      // Should be back to idle or completed after execution
      expect(['idle', 'completed']).toContain(agent.state.status);
    });

    it('should support pause and resume', async () => {
      await agent.pause();
      await agent.resume();
      expect(agent.getStatus()).toBe('idle');
    });

    it('should support terminate', async () => {
      await agent.terminate();
      expect(agent.getStatus()).toBe('terminated');
    });
  });
});
