/**
 * Reasoning System Benchmarks
 *
 * Performance benchmarks for Tree-of-Thought and Self-Consistent CoT
 */

import { describe, it, expect } from 'vitest';
import { TreeOfThought } from '../../src/reasoning/tree-of-thought.js';
import { SelfConsistentCoT } from '../../src/reasoning/self-consistent-cot.js';
import { benchmark, assertPerformance, compareBenchmarks, type BenchmarkResult } from '../utils/benchmark-utils.js';

describe('Reasoning Benchmarks', () => {
  describe('Tree-of-Thought Performance', () => {
    it('should explore shallow tree efficiently (depth 2, branch 2)', async () => {
      const tot = new TreeOfThought({ maxDepth: 2, branchingFactor: 2 });

      const result = await benchmark(
        'ToT Shallow',
        async () => {
          await tot.explore('Benchmark problem');
        },
        { iterations: 50 }
      );

      expect(result.averageTime).toBeLessThan(50); // <50ms average
      assertPerformance(result, { maxAverageTime: 50 });
    });

    it('should explore medium tree efficiently (depth 3, branch 3)', async () => {
      const tot = new TreeOfThought({ maxDepth: 3, branchingFactor: 3 });

      const result = await benchmark(
        'ToT Medium',
        async () => {
          await tot.explore('Benchmark problem');
        },
        { iterations: 30 }
      );

      expect(result.averageTime).toBeLessThan(100); // <100ms average
      assertPerformance(result, { maxAverageTime: 100 });
    });

    it('should explore deep tree within acceptable time (depth 5, branch 2)', async () => {
      const tot = new TreeOfThought({ maxDepth: 5, branchingFactor: 2 });

      const result = await benchmark(
        'ToT Deep',
        async () => {
          await tot.explore('Benchmark problem');
        },
        { iterations: 20 }
      );

      expect(result.averageTime).toBeLessThan(200); // <200ms average
      assertPerformance(result, { maxAverageTime: 200 });
    });

    it('should handle wide tree efficiently (depth 2, branch 10)', async () => {
      const tot = new TreeOfThought({ maxDepth: 2, branchingFactor: 10 });

      const result = await benchmark(
        'ToT Wide',
        async () => {
          await tot.explore('Benchmark problem');
        },
        { iterations: 20 }
      );

      expect(result.averageTime).toBeLessThan(150); // <150ms average
      assertPerformance(result, { maxAverageTime: 150 });
    });

    it('should scale linearly with depth', async () => {
      const results: BenchmarkResult[] = [];

      for (const depth of [2, 3, 4, 5]) {
        const tot = new TreeOfThought({ maxDepth: depth, branchingFactor: 2 });
        const result = await benchmark(
          `ToT Depth ${depth}`,
          async () => {
            await tot.explore('Scaling test');
          },
          { iterations: 20 }
        );
        results.push(result);
      }

      // Each depth should take roughly 2x the previous
      // (since branching factor is 2, nodes double each level)
      expect(results[1].averageTime).toBeGreaterThan(results[0].averageTime);
      expect(results[2].averageTime).toBeGreaterThan(results[1].averageTime);
      expect(results[3].averageTime).toBeGreaterThan(results[2].averageTime);
    });
  });

  describe('Self-Consistent CoT Performance', () => {
    it('should reason with few paths efficiently (3 paths)', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 3 });

      const result = await benchmark(
        'SC-CoT 3 paths',
        async () => {
          await sccot.reason('test', { problem: 'Benchmark' });
        },
        { iterations: 50 }
      );

      expect(result.averageTime).toBeLessThan(50); // <50ms average
      assertPerformance(result, { maxAverageTime: 50 });
    });

    it('should reason with moderate paths efficiently (5 paths)', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 5 });

      const result = await benchmark(
        'SC-CoT 5 paths',
        async () => {
          await sccot.reason('test', { problem: 'Benchmark' });
        },
        { iterations: 40 }
      );

      expect(result.averageTime).toBeLessThan(100); // <100ms average
      assertPerformance(result, { maxAverageTime: 100 });
    });

    it('should reason with many paths efficiently (10 paths)', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 10 });

      const result = await benchmark(
        'SC-CoT 10 paths',
        async () => {
          await sccot.reason('test', { problem: 'Benchmark' });
        },
        { iterations: 30 }
      );

      expect(result.averageTime).toBeLessThan(200); // <200ms average
      assertPerformance(result, { maxAverageTime: 200 });
    });

    it('should scale linearly with number of paths', async () => {
      const results: BenchmarkResult[] = [];

      for (const numPaths of [1, 3, 5, 10]) {
        const sccot = new SelfConsistentCoT({ numPaths });
        const result = await benchmark(
          `SC-CoT ${numPaths} paths`,
          async () => {
            await sccot.reason('test', { problem: 'Scaling' });
          },
          { iterations: 30 }
        );
        results.push(result);
      }

      // Time should increase roughly linearly with paths
      expect(results[1].averageTime).toBeGreaterThan(results[0].averageTime);
      expect(results[2].averageTime).toBeGreaterThan(results[1].averageTime);
      expect(results[3].averageTime).toBeGreaterThan(results[2].averageTime);
    });
  });

  describe('Comparative Performance', () => {
    it('should compare ToT vs SC-CoT for similar complexity', async () => {
      const tot = new TreeOfThought({ maxDepth: 3, branchingFactor: 3 });
      const sccot = new SelfConsistentCoT({ numPaths: 5 });

      const totResult = await benchmark(
        'ToT (depth 3, branch 3)',
        async () => {
          await tot.explore('Comparison test');
        },
        { iterations: 30 }
      );

      const scResult = await benchmark(
        'SC-CoT (5 paths)',
        async () => {
          await sccot.reason('test', { problem: 'Comparison test' });
        },
        { iterations: 30 }
      );

      compareBenchmarks([totResult, scResult]);

      // Both should complete in reasonable time
      expect(totResult.averageTime).toBeLessThan(200);
      expect(scResult.averageTime).toBeLessThan(200);
    });
  });

  describe('Concurrent Performance', () => {
    it('should handle concurrent ToT explorations', async () => {
      const tot = new TreeOfThought({ maxDepth: 3, branchingFactor: 2 });

      const result = await benchmark(
        'Concurrent ToT (5 parallel)',
        async () => {
          await Promise.all([
            tot.explore('Problem 1'),
            tot.explore('Problem 2'),
            tot.explore('Problem 3'),
            tot.explore('Problem 4'),
            tot.explore('Problem 5'),
          ]);
        },
        { iterations: 10 }
      );

      // Concurrent execution should be faster than 5x sequential
      expect(result.averageTime).toBeLessThan(500);
    });

    it('should handle concurrent SC-CoT reasonings', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 3 });

      const result = await benchmark(
        'Concurrent SC-CoT (5 parallel)',
        async () => {
          await Promise.all([
            sccot.reason('t1', { problem: 'P1' }),
            sccot.reason('t2', { problem: 'P2' }),
            sccot.reason('t3', { problem: 'P3' }),
            sccot.reason('t4', { problem: 'P4' }),
            sccot.reason('t5', { problem: 'P5' }),
          ]);
        },
        { iterations: 10 }
      );

      expect(result.averageTime).toBeLessThan(500);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during many ToT explorations', async () => {
      const tot = new TreeOfThought({ maxDepth: 3, branchingFactor: 2 });

      const result = await benchmark(
        'ToT Memory Test',
        async () => {
          await tot.explore('Memory test');
        },
        {
          iterations: 100,
          trackMemory: true,
        }
      );

      // Memory usage should be reasonable (< 50MB for 100 iterations)
      if (result.memoryUsed) {
        const memoryMB = result.memoryUsed / 1024 / 1024;
        expect(memoryMB).toBeLessThan(50);
      }
    });

    it('should not leak memory during many SC-CoT reasonings', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 5 });

      const result = await benchmark(
        'SC-CoT Memory Test',
        async () => {
          await sccot.reason('test', { problem: 'Memory test' });
        },
        {
          iterations: 100,
          trackMemory: true,
        }
      );

      if (result.memoryUsed) {
        const memoryMB = result.memoryUsed / 1024 / 1024;
        expect(memoryMB).toBeLessThan(50);
      }
    });
  });

  describe('Throughput Tests', () => {
    it('should achieve high ToT throughput', async () => {
      const tot = new TreeOfThought({ maxDepth: 2, branchingFactor: 2 });

      const result = await benchmark(
        'ToT Throughput',
        async () => {
          await tot.explore('Throughput test');
        },
        { iterations: 100 }
      );

      // Should achieve at least 20 ops/sec
      expect(result.opsPerSecond).toBeGreaterThan(20);
      assertPerformance(result, { minOpsPerSecond: 20 });
    });

    it('should achieve high SC-CoT throughput', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 3 });

      const result = await benchmark(
        'SC-CoT Throughput',
        async () => {
          await sccot.reason('test', { problem: 'Throughput' });
        },
        { iterations: 100 }
      );

      // Should achieve at least 20 ops/sec
      expect(result.opsPerSecond).toBeGreaterThan(20);
      assertPerformance(result, { minOpsPerSecond: 20 });
    });
  });
});
