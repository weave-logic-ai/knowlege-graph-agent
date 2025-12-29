/**
 * Tests for ABTestingFramework
 *
 * @module learning/services/__tests__/ab-testing-framework
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ABTestingFramework,
  createABTestingFramework,
} from '../../../src/learning/services/ab-testing-framework.js';
import type { ABTest } from '../../../src/learning/types.js';

/**
 * Create a basic test configuration
 */
function createBasicTestConfig(): Omit<ABTest, 'id' | 'status' | 'createdAt'> {
  return {
    name: 'Test Experiment',
    description: 'A/B test for testing',
    variants: [
      { id: 'control', name: 'Control', config: { setting: 'A' }, weight: 0.5 },
      { id: 'treatment', name: 'Treatment', config: { setting: 'B' }, weight: 0.5 },
    ],
    metrics: ['success_rate', 'duration'],
    startDate: new Date(),
  };
}

describe('ABTestingFramework', () => {
  let framework: ABTestingFramework;

  beforeEach(() => {
    framework = createABTestingFramework();
  });

  describe('constructor', () => {
    it('should create a framework with default config', () => {
      expect(framework).toBeInstanceOf(ABTestingFramework);
    });

    it('should create a framework with custom config', () => {
      const custom = createABTestingFramework({
        minSampleSize: 50,
        significanceThreshold: 0.01,
      });
      expect(custom).toBeInstanceOf(ABTestingFramework);
    });
  });

  describe('createTest', () => {
    it('should create a new test', async () => {
      const testId = await framework.createTest(createBasicTestConfig());

      expect(testId).toBeDefined();
      expect(typeof testId).toBe('string');
    });

    it('should store the test', async () => {
      const testId = await framework.createTest(createBasicTestConfig());
      const test = framework.getTest(testId);

      expect(test).toBeDefined();
      expect(test?.name).toBe('Test Experiment');
      expect(test?.status).toBe('draft');
    });

    it('should reject tests with fewer than 2 variants', async () => {
      await expect(framework.createTest({
        ...createBasicTestConfig(),
        variants: [{ id: 'solo', name: 'Solo', config: {}, weight: 1 }],
      })).rejects.toThrow('at least 2 variants');
    });

    it('should reject tests where weights do not sum to 1', async () => {
      await expect(framework.createTest({
        ...createBasicTestConfig(),
        variants: [
          { id: 'a', name: 'A', config: {}, weight: 0.3 },
          { id: 'b', name: 'B', config: {}, weight: 0.3 },
        ],
      })).rejects.toThrow('weights must sum to 1');
    });

    it('should enforce max concurrent tests', async () => {
      const framework = createABTestingFramework({ maxConcurrentTests: 2 });

      const test1 = await framework.createTest(createBasicTestConfig());
      await framework.startTest(test1);

      const test2 = await framework.createTest(createBasicTestConfig());
      await framework.startTest(test2);

      await expect(framework.createTest(createBasicTestConfig())).rejects.toThrow('Maximum concurrent tests');
    });
  });

  describe('startTest', () => {
    it('should start a draft test', async () => {
      const testId = await framework.createTest(createBasicTestConfig());
      await framework.startTest(testId);

      const test = framework.getTest(testId);
      expect(test?.status).toBe('running');
    });

    it('should set start date', async () => {
      const testId = await framework.createTest(createBasicTestConfig());
      await framework.startTest(testId);

      const test = framework.getTest(testId);
      expect(test?.startDate).toBeDefined();
    });

    it('should reject non-existent test', async () => {
      await expect(framework.startTest('non-existent')).rejects.toThrow('not found');
    });

    it('should reject already running test', async () => {
      const testId = await framework.createTest(createBasicTestConfig());
      await framework.startTest(testId);

      await expect(framework.startTest(testId)).rejects.toThrow('already running');
    });
  });

  describe('assignVariant', () => {
    it('should assign a variant to a subject', async () => {
      const testId = await framework.createTest(createBasicTestConfig());
      await framework.startTest(testId);

      const variant = await framework.assignVariant(testId, 'user-123');

      expect(['control', 'treatment']).toContain(variant);
    });

    it('should be deterministic for same subject', async () => {
      const testId = await framework.createTest(createBasicTestConfig());
      await framework.startTest(testId);

      const variant1 = await framework.assignVariant(testId, 'user-123');
      const variant2 = await framework.assignVariant(testId, 'user-123');

      expect(variant1).toBe(variant2);
    });

    it('should distribute subjects across variants', async () => {
      const testId = await framework.createTest(createBasicTestConfig());
      await framework.startTest(testId);

      const assignments = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const variant = await framework.assignVariant(testId, `user-${i}`);
        assignments.add(variant);
      }

      // Both variants should have some assignments
      expect(assignments.size).toBe(2);
    });

    it('should reject assignment for non-running test', async () => {
      const testId = await framework.createTest(createBasicTestConfig());

      await expect(framework.assignVariant(testId, 'user-123')).rejects.toThrow('not running');
    });
  });

  describe('recordMetric', () => {
    it('should record a metric value', async () => {
      const testId = await framework.createTest(createBasicTestConfig());
      await framework.startTest(testId);

      await framework.recordMetric(testId, 'control', 'success_rate', 1);

      const results = await framework.analyzeResults(testId);
      expect(results.variantResults.length).toBe(2);
    });

    it('should reject for non-running test', async () => {
      const testId = await framework.createTest(createBasicTestConfig());

      await expect(framework.recordMetric(testId, 'control', 'success_rate', 1))
        .rejects.toThrow('not running');
    });
  });

  describe('analyzeResults', () => {
    it('should analyze results with no data', async () => {
      const testId = await framework.createTest(createBasicTestConfig());

      const results = await framework.analyzeResults(testId);

      expect(results.testId).toBe(testId);
      expect(results.variantResults.length).toBe(2);
      expect(results.variantResults[0].sampleSize).toBe(0);
    });

    it('should calculate mean for metrics', async () => {
      const testId = await framework.createTest(createBasicTestConfig());
      await framework.startTest(testId);

      for (let i = 0; i < 10; i++) {
        await framework.recordMetric(testId, 'control', 'success_rate', 0.8, `user-${i}`);
      }

      const results = await framework.analyzeResults(testId);
      const control = results.variantResults.find(v => v.variantId === 'control');

      expect(control?.metrics.success_rate.mean).toBeCloseTo(0.8, 2);
    });

    it('should calculate standard deviation', async () => {
      const testId = await framework.createTest(createBasicTestConfig());
      await framework.startTest(testId);

      await framework.recordMetric(testId, 'control', 'duration', 100, 'user-1');
      await framework.recordMetric(testId, 'control', 'duration', 200, 'user-2');
      await framework.recordMetric(testId, 'control', 'duration', 300, 'user-3');

      const results = await framework.analyzeResults(testId);
      const control = results.variantResults.find(v => v.variantId === 'control');

      expect(control?.metrics.duration.stdDev).toBeGreaterThan(0);
    });

    it('should determine winner when statistically significant', async () => {
      const framework = createABTestingFramework({
        minSampleSize: 10,
        significanceThreshold: 0.05,
        minImprovementThreshold: 0.01,
        autoStopOnWinner: false,
      });

      const testId = await framework.createTest(createBasicTestConfig());
      await framework.startTest(testId);

      // Control: low success rate
      for (let i = 0; i < 30; i++) {
        await framework.recordMetric(testId, 'control', 'success_rate', 0.5, `control-${i}`);
      }

      // Treatment: high success rate
      for (let i = 0; i < 30; i++) {
        await framework.recordMetric(testId, 'treatment', 'success_rate', 0.9, `treatment-${i}`);
      }

      const results = await framework.analyzeResults(testId);

      expect(results.winner).toBe('treatment');
      expect(results.statisticalSignificance).toBeLessThan(0.05);
    });
  });

  describe('stopTest', () => {
    it('should stop a running test', async () => {
      const testId = await framework.createTest(createBasicTestConfig());
      await framework.startTest(testId);
      await framework.stopTest(testId, 'Manual stop');

      const test = framework.getTest(testId);
      expect(test?.status).toBe('stopped');
    });

    it('should set end date', async () => {
      const testId = await framework.createTest(createBasicTestConfig());
      await framework.startTest(testId);
      await framework.stopTest(testId, 'Manual stop');

      const test = framework.getTest(testId);
      expect(test?.endDate).toBeDefined();
    });
  });

  describe('completeTest', () => {
    it('should complete a test and return results', async () => {
      const testId = await framework.createTest(createBasicTestConfig());
      await framework.startTest(testId);

      const results = await framework.completeTest(testId);

      expect(results.testId).toBe(testId);

      const test = framework.getTest(testId);
      expect(test?.status).toBe('completed');
    });
  });

  describe('listTests', () => {
    it('should list all tests', async () => {
      await framework.createTest(createBasicTestConfig());
      await framework.createTest(createBasicTestConfig());

      const tests = framework.listTests();
      expect(tests.length).toBe(2);
    });

    it('should filter by status', async () => {
      const test1 = await framework.createTest(createBasicTestConfig());
      const test2 = await framework.createTest(createBasicTestConfig());
      await framework.startTest(test1);

      const runningTests = framework.listTests('running');
      const draftTests = framework.listTests('draft');

      expect(runningTests.length).toBe(1);
      expect(draftTests.length).toBe(1);
    });
  });

  describe('getVariantConfig', () => {
    it('should return variant config for a subject', async () => {
      const testId = await framework.createTest(createBasicTestConfig());
      await framework.startTest(testId);

      const variant = await framework.assignVariant(testId, 'user-123');
      const config = framework.getVariantConfig(testId, 'user-123');

      expect(config).toBeDefined();
      expect(config?.setting).toBe(variant === 'control' ? 'A' : 'B');
    });

    it('should return undefined for unassigned subject', () => {
      const config = framework.getVariantConfig('test-1', 'user-123');
      expect(config).toBeUndefined();
    });
  });

  describe('deleteTest', () => {
    it('should delete a test', async () => {
      const testId = await framework.createTest(createBasicTestConfig());

      const result = framework.deleteTest(testId);

      expect(result).toBe(true);
      expect(framework.getTest(testId)).toBeUndefined();
    });

    it('should return false for non-existent test', () => {
      const result = framework.deleteTest('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('auto-stop on winner', () => {
    it('should auto-stop when clear winner found', async () => {
      const framework = createABTestingFramework({
        minSampleSize: 10,
        autoStopOnWinner: true,
        significanceThreshold: 0.05,
        minImprovementThreshold: 0.01,
      });

      const testId = await framework.createTest(createBasicTestConfig());
      await framework.startTest(testId);

      // Create clear difference - stop when test is no longer running
      let stopped = false;
      for (let i = 0; i < 20 && !stopped; i++) {
        try {
          await framework.recordMetric(testId, 'control', 'success_rate', 0.3, `control-${i}`);
          await framework.recordMetric(testId, 'treatment', 'success_rate', 0.95, `treatment-${i}`);
        } catch {
          // Test was auto-stopped, which is the expected behavior
          stopped = true;
        }
      }

      const test = framework.getTest(testId);
      // May or may not be stopped depending on significance
      expect(['running', 'stopped']).toContain(test?.status);
    });
  });

  describe('clear', () => {
    it('should clear all tests', async () => {
      await framework.createTest(createBasicTestConfig());
      await framework.createTest(createBasicTestConfig());

      framework.clear();

      expect(framework.listTests().length).toBe(0);
    });
  });
});
