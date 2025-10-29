/**
 * Benchmark Utilities
 *
 * Tools for performance testing and benchmarking
 */

export interface BenchmarkResult {
  name: string;
  duration: number;
  operations: number;
  opsPerSecond: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  memoryUsed?: number;
}

export interface BenchmarkOptions {
  iterations?: number;
  warmupIterations?: number;
  trackMemory?: boolean;
  onProgress?: (iteration: number, total: number) => void;
}

/**
 * Run a benchmark test
 */
export async function benchmark(
  name: string,
  fn: () => Promise<void> | void,
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  const {
    iterations = 100,
    warmupIterations = 10,
    trackMemory = false,
    onProgress,
  } = options;

  const times: number[] = [];

  // Warmup phase
  for (let i = 0; i < warmupIterations; i++) {
    await fn();
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  const initialMemory = trackMemory ? process.memoryUsage().heapUsed : 0;

  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);

    if (onProgress) {
      onProgress(i + 1, iterations);
    }
  }

  const finalMemory = trackMemory ? process.memoryUsage().heapUsed : 0;
  const memoryUsed = trackMemory ? finalMemory - initialMemory : undefined;

  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const opsPerSecond = 1000 / averageTime;

  return {
    name,
    duration: totalTime,
    operations: iterations,
    opsPerSecond,
    averageTime,
    minTime,
    maxTime,
    memoryUsed,
  };
}

/**
 * Compare multiple benchmark results
 */
export function compareBenchmarks(results: BenchmarkResult[]): void {
  console.log('\n=== Benchmark Comparison ===\n');

  const maxNameLength = Math.max(...results.map(r => r.name.length));

  results.forEach(result => {
    const name = result.name.padEnd(maxNameLength);
    console.log(`${name}: ${result.opsPerSecond.toFixed(2)} ops/sec`);
    console.log(`  Average: ${result.averageTime.toFixed(2)}ms`);
    console.log(`  Min: ${result.minTime.toFixed(2)}ms, Max: ${result.maxTime.toFixed(2)}ms`);

    if (result.memoryUsed !== undefined) {
      const memoryMB = (result.memoryUsed / 1024 / 1024).toFixed(2);
      console.log(`  Memory: ${memoryMB}MB`);
    }

    console.log('');
  });

  // Find fastest
  const fastest = results.reduce((prev, current) =>
    current.opsPerSecond > prev.opsPerSecond ? current : prev
  );

  console.log(`Fastest: ${fastest.name}\n`);
}

/**
 * Assert performance meets threshold
 */
export function assertPerformance(
  result: BenchmarkResult,
  thresholds: {
    maxAverageTime?: number;
    minOpsPerSecond?: number;
    maxMemory?: number;
  }
): void {
  if (thresholds.maxAverageTime && result.averageTime > thresholds.maxAverageTime) {
    throw new Error(
      `Performance threshold exceeded: average time ${result.averageTime.toFixed(2)}ms > ${thresholds.maxAverageTime}ms`
    );
  }

  if (thresholds.minOpsPerSecond && result.opsPerSecond < thresholds.minOpsPerSecond) {
    throw new Error(
      `Performance threshold not met: ${result.opsPerSecond.toFixed(2)} ops/sec < ${thresholds.minOpsPerSecond} ops/sec`
    );
  }

  if (thresholds.maxMemory && result.memoryUsed && result.memoryUsed > thresholds.maxMemory) {
    const memoryMB = (result.memoryUsed / 1024 / 1024).toFixed(2);
    const thresholdMB = (thresholds.maxMemory / 1024 / 1024).toFixed(2);
    throw new Error(
      `Memory threshold exceeded: ${memoryMB}MB > ${thresholdMB}MB`
    );
  }
}

/**
 * Measure memory usage of a function
 */
export async function measureMemory<T>(
  fn: () => Promise<T> | T
): Promise<{ result: T; memoryUsed: number }> {
  if (global.gc) {
    global.gc();
  }

  const before = process.memoryUsage().heapUsed;
  const result = await fn();

  if (global.gc) {
    global.gc();
  }

  const after = process.memoryUsage().heapUsed;
  const memoryUsed = after - before;

  return { result, memoryUsed };
}

/**
 * Run benchmarks in parallel
 */
export async function benchmarkParallel(
  benchmarks: Array<{
    name: string;
    fn: () => Promise<void> | void;
    options?: BenchmarkOptions;
  }>
): Promise<BenchmarkResult[]> {
  const results = await Promise.all(
    benchmarks.map(b => benchmark(b.name, b.fn, b.options))
  );

  return results;
}

/**
 * Statistical analysis of benchmark results
 */
export interface Stats {
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  percentile95: number;
  percentile99: number;
}

export function calculateStats(times: number[]): Stats {
  const sorted = [...times].sort((a, b) => a - b);
  const n = sorted.length;

  const mean = sorted.reduce((sum, t) => sum + t, 0) / n;
  const median = sorted[Math.floor(n / 2)];

  const variance = sorted.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  const percentile95 = sorted[Math.floor(n * 0.95)];
  const percentile99 = sorted[Math.floor(n * 0.99)];

  return {
    mean,
    median,
    stdDev,
    variance,
    percentile95,
    percentile99,
  };
}

/**
 * Format benchmark results for display
 */
export function formatResult(result: BenchmarkResult): string {
  const lines = [
    `Benchmark: ${result.name}`,
    `  Operations: ${result.operations}`,
    `  Total Time: ${result.duration.toFixed(2)}ms`,
    `  Ops/Second: ${result.opsPerSecond.toFixed(2)}`,
    `  Average: ${result.averageTime.toFixed(2)}ms`,
    `  Min: ${result.minTime.toFixed(2)}ms`,
    `  Max: ${result.maxTime.toFixed(2)}ms`,
  ];

  if (result.memoryUsed !== undefined) {
    const memoryMB = (result.memoryUsed / 1024 / 1024).toFixed(2);
    lines.push(`  Memory: ${memoryMB}MB`);
  }

  return lines.join('\n');
}

/**
 * Progress bar for benchmarks
 */
export function createProgressBar(total: number): (current: number) => void {
  const width = 40;

  return (current: number) => {
    const percentage = (current / total) * 100;
    const filled = Math.floor((current / total) * width);
    const empty = width - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    process.stdout.write(`\r[${bar}] ${percentage.toFixed(1)}% (${current}/${total})`);

    if (current === total) {
      process.stdout.write('\n');
    }
  };
}
