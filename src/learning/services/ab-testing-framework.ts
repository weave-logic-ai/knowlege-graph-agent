/**
 * A/B Testing Framework
 *
 * Enables experimentation with agent configurations, prompts, and workflows
 * through controlled A/B tests with statistical analysis.
 *
 * @module learning/services/ab-testing-framework
 */

import { createLogger } from '../../utils/index.js';
import {
  type ABTest,
  type ABTestVariant,
  type ABTestResult,
  type VariantResult,
  type MetricStatistics,
  createTestId,
} from '../types.js';

const logger = createLogger('ab-testing');

/**
 * Metric data point
 */
interface MetricDataPoint {
  timestamp: Date;
  variantId: string;
  subjectId: string;
  metric: string;
  value: number;
}

/**
 * Configuration for A/B testing
 */
export interface ABTestingConfig {
  /** Minimum sample size for statistical significance */
  minSampleSize: number;
  /** P-value threshold for significance */
  significanceThreshold: number;
  /** Maximum concurrent tests */
  maxConcurrentTests: number;
  /** Auto-stop tests when clear winner is found */
  autoStopOnWinner: boolean;
  /** Minimum improvement to declare winner */
  minImprovementThreshold: number;
}

const DEFAULT_CONFIG: ABTestingConfig = {
  minSampleSize: 30,
  significanceThreshold: 0.05,
  maxConcurrentTests: 5,
  autoStopOnWinner: true,
  minImprovementThreshold: 0.05,
};

/**
 * A/B Testing Framework
 *
 * Manages experiments to optimize agent performance through
 * controlled testing of different configurations.
 *
 * @example
 * ```typescript
 * const framework = new ABTestingFramework();
 *
 * const testId = await framework.createTest({
 *   name: 'Prompt Optimization',
 *   description: 'Test different prompt styles',
 *   variants: [
 *     { id: 'control', name: 'Current', config: { promptStyle: 'detailed' }, weight: 0.5 },
 *     { id: 'treatment', name: 'Concise', config: { promptStyle: 'concise' }, weight: 0.5 },
 *   ],
 *   metrics: ['success_rate', 'response_time', 'quality_score'],
 * });
 *
 * // Assign subjects to variants
 * const variant = await framework.assignVariant(testId, 'user-123');
 *
 * // Record metrics
 * await framework.recordMetric(testId, variant, 'success_rate', 1);
 * ```
 */
export class ABTestingFramework {
  private tests: Map<string, ABTest>;
  private metrics: Map<string, MetricDataPoint[]>;
  private subjectAssignments: Map<string, Map<string, string>>; // testId -> subjectId -> variantId
  private config: ABTestingConfig;

  constructor(config?: Partial<ABTestingConfig>) {
    this.tests = new Map();
    this.metrics = new Map();
    this.subjectAssignments = new Map();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create a new A/B test
   */
  async createTest(test: Omit<ABTest, 'id' | 'status' | 'createdAt'>): Promise<string> {
    // Validate concurrent test limit
    const runningTests = Array.from(this.tests.values()).filter(t => t.status === 'running');
    if (runningTests.length >= this.config.maxConcurrentTests) {
      throw new Error(`Maximum concurrent tests (${this.config.maxConcurrentTests}) reached`);
    }

    // Validate variants
    if (test.variants.length < 2) {
      throw new Error('A/B test requires at least 2 variants');
    }

    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 1) > 0.001) {
      throw new Error('Variant weights must sum to 1');
    }

    const id = createTestId();
    const newTest: ABTest = {
      ...test,
      id,
      status: 'draft',
      createdAt: new Date(),
    };

    this.tests.set(id, newTest);
    this.metrics.set(id, []);
    this.subjectAssignments.set(id, new Map());

    logger.info('A/B test created', {
      testId: id,
      name: test.name,
      variants: test.variants.length,
      metrics: test.metrics,
    });

    return id;
  }

  /**
   * Start an A/B test
   */
  async startTest(testId: string): Promise<void> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    if (test.status !== 'draft') {
      throw new Error(`Test ${testId} is already ${test.status}`);
    }

    test.status = 'running';
    test.startDate = new Date();
    test.updatedAt = new Date();

    logger.info('A/B test started', { testId, name: test.name });
  }

  /**
   * Assign a subject to a variant (deterministic based on subject ID)
   */
  async assignVariant(testId: string, subjectId: string): Promise<string> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    if (test.status !== 'running') {
      throw new Error(`Test ${testId} is not running`);
    }

    // Check for existing assignment
    const assignments = this.subjectAssignments.get(testId)!;
    const existing = assignments.get(subjectId);
    if (existing) {
      return existing;
    }

    // Deterministic assignment based on subject ID hash
    const variantId = this.selectVariant(test.variants, subjectId);
    assignments.set(subjectId, variantId);

    logger.debug('Subject assigned to variant', {
      testId,
      subjectId,
      variantId,
    });

    return variantId;
  }

  /**
   * Record a metric value for a variant
   */
  async recordMetric(
    testId: string,
    variantId: string,
    metric: string,
    value: number,
    subjectId?: string
  ): Promise<void> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    if (test.status !== 'running') {
      throw new Error(`Test ${testId} is not running`);
    }

    if (!test.metrics.includes(metric)) {
      logger.warn('Recording metric not defined in test', { testId, metric });
    }

    const dataPoint: MetricDataPoint = {
      timestamp: new Date(),
      variantId,
      subjectId: subjectId ?? 'anonymous',
      metric,
      value,
    };

    this.metrics.get(testId)!.push(dataPoint);

    // Check if we should auto-stop
    if (this.config.autoStopOnWinner) {
      await this.checkForWinner(testId);
    }
  }

  /**
   * Analyze test results
   */
  async analyzeResults(testId: string): Promise<ABTestResult> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const testMetrics = this.metrics.get(testId) ?? [];

    if (testMetrics.length === 0) {
      return {
        testId,
        variantResults: test.variants.map(v => ({
          variantId: v.id,
          sampleSize: 0,
          metrics: {},
        })),
        statisticalSignificance: 0,
        analyzedAt: new Date(),
        notes: 'No data collected yet',
      };
    }

    // Calculate statistics for each variant
    const variantResults: VariantResult[] = test.variants.map(variant => {
      const variantMetrics = testMetrics.filter(m => m.variantId === variant.id);
      const uniqueSubjects = new Set(variantMetrics.map(m => m.subjectId));

      // Calculate stats for each metric
      const metricStats: Record<string, MetricStatistics> = {};

      for (const metricName of test.metrics) {
        const values = variantMetrics
          .filter(m => m.metric === metricName)
          .map(m => m.value);

        if (values.length > 0) {
          metricStats[metricName] = this.calculateStatistics(values);
        }
      }

      return {
        variantId: variant.id,
        sampleSize: uniqueSubjects.size,
        metrics: metricStats,
        rawData: variantMetrics.map(m => ({
          timestamp: m.timestamp,
          values: { [m.metric]: m.value },
        })),
      };
    });

    // Determine winner if statistically significant
    const { winner, significance } = this.determineWinner(test, variantResults);

    const result: ABTestResult = {
      testId,
      variantResults,
      winner,
      statisticalSignificance: significance,
      analyzedAt: new Date(),
    };

    logger.info('A/B test analyzed', {
      testId,
      winner,
      significance,
      sampleSizes: variantResults.map(v => v.sampleSize),
    });

    return result;
  }

  /**
   * Stop a test
   */
  async stopTest(testId: string, reason: string): Promise<void> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    test.status = 'stopped';
    test.endDate = new Date();
    test.updatedAt = new Date();

    logger.info('A/B test stopped', { testId, reason });
  }

  /**
   * Complete a test
   */
  async completeTest(testId: string): Promise<ABTestResult> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const result = await this.analyzeResults(testId);

    test.status = 'completed';
    test.endDate = new Date();
    test.updatedAt = new Date();

    logger.info('A/B test completed', {
      testId,
      winner: result.winner,
    });

    return result;
  }

  /**
   * Get test by ID
   */
  getTest(testId: string): ABTest | undefined {
    return this.tests.get(testId);
  }

  /**
   * List all tests
   */
  listTests(status?: ABTest['status']): ABTest[] {
    const tests = Array.from(this.tests.values());
    if (status) {
      return tests.filter(t => t.status === status);
    }
    return tests;
  }

  /**
   * Get variant config for a subject
   */
  getVariantConfig(testId: string, subjectId: string): Record<string, unknown> | undefined {
    const test = this.tests.get(testId);
    if (!test) return undefined;

    const assignments = this.subjectAssignments.get(testId);
    const variantId = assignments?.get(subjectId);
    if (!variantId) return undefined;

    const variant = test.variants.find(v => v.id === variantId);
    return variant?.config;
  }

  /**
   * Delete a test and its data
   */
  deleteTest(testId: string): boolean {
    if (!this.tests.has(testId)) {
      return false;
    }

    this.tests.delete(testId);
    this.metrics.delete(testId);
    this.subjectAssignments.delete(testId);

    logger.info('A/B test deleted', { testId });
    return true;
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  /**
   * Select variant based on subject ID (deterministic)
   */
  private selectVariant(variants: ABTestVariant[], subjectId: string): string {
    // FNV-1a hash function for better distribution
    let hash = 2166136261; // FNV offset basis
    for (let i = 0; i < subjectId.length; i++) {
      hash ^= subjectId.charCodeAt(i);
      hash = Math.imul(hash, 16777619); // FNV prime
    }
    // Additional mixing for better distribution
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 2246822507);
    hash ^= hash >>> 13;

    // Normalize to 0-1 range using unsigned interpretation
    const normalized = (hash >>> 0) / 4294967295;

    // Select variant based on weights
    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.weight;
      if (normalized <= cumulative) {
        return variant.id;
      }
    }

    // Fallback to last variant
    return variants[variants.length - 1].id;
  }

  /**
   * Calculate statistics for a set of values
   */
  private calculateStatistics(values: number[]): MetricStatistics {
    const n = values.length;
    if (n === 0) {
      return { mean: 0, stdDev: 0, confidence: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, v) => sum + v, 0) / n;

    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // 95% confidence interval using t-distribution approximation
    const tValue = 1.96; // Approximation for large samples
    const standardError = stdDev / Math.sqrt(n);
    const confidence = tValue * standardError;

    return {
      mean,
      stdDev,
      confidence,
      min: sorted[0],
      max: sorted[n - 1],
      median: n % 2 === 0
        ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
        : sorted[Math.floor(n / 2)],
    };
  }

  /**
   * Determine winner using statistical significance
   */
  private determineWinner(
    test: ABTest,
    variantResults: VariantResult[]
  ): { winner?: string; significance: number } {
    // Need minimum sample sizes
    for (const result of variantResults) {
      if (result.sampleSize < this.config.minSampleSize) {
        return { significance: 0 };
      }
    }

    // Compare primary metric (first in list)
    const primaryMetric = test.metrics[0];
    if (!primaryMetric) {
      return { significance: 0 };
    }

    // Get control and treatment
    const control = variantResults[0];
    const treatment = variantResults[1];

    const controlStats = control.metrics[primaryMetric];
    const treatmentStats = treatment.metrics[primaryMetric];

    if (!controlStats || !treatmentStats) {
      return { significance: 0 };
    }

    // Perform two-sample t-test
    const significance = this.tTest(
      controlStats.mean,
      controlStats.stdDev,
      control.sampleSize,
      treatmentStats.mean,
      treatmentStats.stdDev,
      treatment.sampleSize
    );

    // Determine winner if significant
    if (significance <= this.config.significanceThreshold) {
      const improvement = (treatmentStats.mean - controlStats.mean) / controlStats.mean;

      if (Math.abs(improvement) >= this.config.minImprovementThreshold) {
        const winner = treatmentStats.mean > controlStats.mean
          ? treatment.variantId
          : control.variantId;

        return { winner, significance };
      }
    }

    return { significance };
  }

  /**
   * Two-sample t-test for statistical significance
   */
  private tTest(
    mean1: number,
    std1: number,
    n1: number,
    mean2: number,
    std2: number,
    n2: number
  ): number {
    // Welch's t-test (unequal variances)
    const se = Math.sqrt((std1 * std1) / n1 + (std2 * std2) / n2);

    if (se === 0) return 1;

    const t = Math.abs(mean1 - mean2) / se;

    // Approximate degrees of freedom
    const df = Math.pow(std1 * std1 / n1 + std2 * std2 / n2, 2) /
      (Math.pow(std1 * std1 / n1, 2) / (n1 - 1) +
        Math.pow(std2 * std2 / n2, 2) / (n2 - 1));

    // Approximate p-value using normal distribution for large df
    const pValue = 2 * (1 - this.normalCDF(t));

    return pValue;
  }

  /**
   * Cumulative distribution function for standard normal
   */
  private normalCDF(x: number): number {
    // Approximation using error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  /**
   * Check if there's a clear winner to auto-stop
   */
  private async checkForWinner(testId: string): Promise<void> {
    const test = this.tests.get(testId);
    if (!test || test.status !== 'running') return;

    const result = await this.analyzeResults(testId);

    // Check if all variants have enough samples
    const allHaveMinSamples = result.variantResults.every(
      v => v.sampleSize >= this.config.minSampleSize
    );

    if (!allHaveMinSamples) return;

    // Check for significant winner
    if (result.winner && result.statisticalSignificance <= this.config.significanceThreshold) {
      logger.info('Auto-stopping test due to clear winner', {
        testId,
        winner: result.winner,
        significance: result.statisticalSignificance,
      });

      await this.stopTest(testId, 'auto-stop-winner-found');
    }
  }

  /**
   * Clear all tests and data
   */
  clear(): void {
    this.tests.clear();
    this.metrics.clear();
    this.subjectAssignments.clear();
  }
}

/**
 * Create an A/B testing framework instance
 */
export function createABTestingFramework(
  config?: Partial<ABTestingConfig>
): ABTestingFramework {
  return new ABTestingFramework(config);
}
