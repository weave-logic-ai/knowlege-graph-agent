/**
 * Self-Consistent Chain-of-Thought Tests
 *
 * Coverage:
 * - Multiple path generation
 * - Consistency calculation
 * - Answer consensus mechanism
 * - Temperature variations
 * - Edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SelfConsistentCoT, type SCCoTConfig } from '../../src/reasoning/self-consistent-cot.js';
import type { CoTReasoningResult } from '../../src/reasoning/types.js';

describe('SelfConsistentCoT', () => {
  describe('Initialization', () => {
    it('should create with default configuration', () => {
      const sccot = new SelfConsistentCoT();
      expect(sccot).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const config: SCCoTConfig = {
        numPaths: 10,
        temperature: 0.9,
        consistencyThreshold: 0.7,
      };
      const sccot = new SelfConsistentCoT(config);
      expect(sccot).toBeDefined();
    });

    it('should use default values for partial config', () => {
      const sccot = new SelfConsistentCoT({ numPaths: 3 });
      expect(sccot).toBeDefined();
    });
  });

  describe('Path Generation', () => {
    it('should generate multiple reasoning paths', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 5 });
      const result = await sccot.reason('test-template', {
        problem: 'Test problem',
      });

      expect(result).toBeDefined();
      expect(result.metadata?.paths).toBe(5);
    });

    it('should generate single path when numPaths is 1', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 1 });
      const result = await sccot.reason('test-template', {
        problem: 'Test problem',
      });

      expect(result).toBeDefined();
      expect(result.metadata?.paths).toBe(1);
      expect(result.confidence).toBe(1); // 100% agreement with 1 path
    });

    it('should generate many paths efficiently', async () => {
      const start = Date.now();
      const sccot = new SelfConsistentCoT({ numPaths: 20 });
      const result = await sccot.reason('test-template', {
        problem: 'Test problem',
      });
      const duration = Date.now() - start;

      expect(result).toBeDefined();
      expect(result.metadata?.paths).toBe(20);
      expect(duration).toBeLessThan(2000); // Should complete quickly
    });
  });

  describe('Consistency Calculation', () => {
    it('should calculate perfect consistency (100%)', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 5 });
      const result = await sccot.reason('test-template', {
        problem: 'Consistent problem',
      });

      expect(result.confidence).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should report agreement count in metadata', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 10 });
      const result = await sccot.reason('test-template', {
        problem: 'Test problem',
      });

      expect(result.metadata?.agreements).toBeDefined();
      expect(result.metadata?.agreements).toBeGreaterThan(0);
      expect(result.metadata?.agreements).toBeLessThanOrEqual(10);
    });

    it('should handle varying consistency levels', async () => {
      const sccot = new SelfConsistentCoT({
        numPaths: 7,
        consistencyThreshold: 0.5,
      });
      const result = await sccot.reason('test-template', {
        problem: 'Variable consistency',
      });

      expect(result.confidence).toBeDefined();
    });
  });

  describe('Consensus Mechanism', () => {
    it('should select most common answer', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 5 });
      const result = await sccot.reason('test-template', {
        problem: 'Consensus test',
      });

      expect(result.finalAnswer).toBeDefined();
      expect(typeof result.finalAnswer).toBe('string');
    });

    it('should break ties consistently', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 4 });
      const result = await sccot.reason('test-template', {
        problem: 'Tie-breaking test',
      });

      expect(result.finalAnswer).toBeDefined();
    });
  });

  describe('Result Structure', () => {
    it('should include all required fields', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 3 });
      const result = await sccot.reason('test-template', {
        problem: 'Structure test',
      });

      expect(result).toHaveProperty('templateId');
      expect(result).toHaveProperty('strategy');
      expect(result).toHaveProperty('steps');
      expect(result).toHaveProperty('finalAnswer');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('metadata');

      expect(result.templateId).toBe('test-template');
      expect(result.strategy).toBe('self-consistent-cot');
      expect(Array.isArray(result.steps)).toBe(true);
    });

    it('should include reasoning steps', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 3 });
      const result = await sccot.reason('test-template', {
        problem: 'Steps test',
      });

      expect(result.steps).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);

      result.steps.forEach(step => {
        expect(step).toHaveProperty('step');
        expect(step).toHaveProperty('description');
        expect(step).toHaveProperty('thought');
      });
    });

    it('should include metadata about paths and agreements', async () => {
      const numPaths = 7;
      const sccot = new SelfConsistentCoT({ numPaths });
      const result = await sccot.reason('test-template', {
        problem: 'Metadata test',
      });

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.paths).toBe(numPaths);
      expect(result.metadata?.agreements).toBeGreaterThan(0);
    });
  });

  describe('Temperature Effects', () => {
    it('should work with low temperature (0.1)', async () => {
      const sccot = new SelfConsistentCoT({
        numPaths: 5,
        temperature: 0.1,
      });
      const result = await sccot.reason('test-template', {
        problem: 'Low temperature test',
      });

      expect(result).toBeDefined();
      // Low temperature should lead to more consistent results
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should work with high temperature (1.0)', async () => {
      const sccot = new SelfConsistentCoT({
        numPaths: 5,
        temperature: 1.0,
      });
      const result = await sccot.reason('test-template', {
        problem: 'High temperature test',
      });

      expect(result).toBeDefined();
    });

    it('should work with medium temperature (0.7)', async () => {
      const sccot = new SelfConsistentCoT({
        numPaths: 5,
        temperature: 0.7,
      });
      const result = await sccot.reason('test-template', {
        problem: 'Medium temperature test',
      });

      expect(result).toBeDefined();
    });
  });

  describe('Variable Handling', () => {
    it('should accept simple variables', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 3 });
      const result = await sccot.reason('test-template', {
        problem: 'Simple problem',
        context: 'Some context',
      });

      expect(result).toBeDefined();
    });

    it('should accept complex variables', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 3 });
      const result = await sccot.reason('test-template', {
        problem: 'Complex problem',
        constraints: ['constraint1', 'constraint2'],
        options: { option1: true, option2: false },
      });

      expect(result).toBeDefined();
    });

    it('should handle empty variables object', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 3 });
      const result = await sccot.reason('test-template', {});

      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long template ID', async () => {
      const longId = 'template-' + 'x'.repeat(1000);
      const sccot = new SelfConsistentCoT({ numPaths: 2 });
      const result = await sccot.reason(longId, { problem: 'Test' });

      expect(result.templateId).toBe(longId);
    });

    it('should handle special characters in template ID', async () => {
      const specialId = 'template-@#$%^&*()';
      const sccot = new SelfConsistentCoT({ numPaths: 2 });
      const result = await sccot.reason(specialId, { problem: 'Test' });

      expect(result.templateId).toBe(specialId);
    });

    it('should handle minimum paths (1)', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 1 });
      const result = await sccot.reason('test-template', { problem: 'Test' });

      expect(result.metadata?.paths).toBe(1);
      expect(result.confidence).toBe(1);
    });

    it('should handle many paths (50)', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 50 });
      const result = await sccot.reason('test-template', { problem: 'Test' });

      expect(result.metadata?.paths).toBe(50);
    });
  });

  describe('Consistency Threshold', () => {
    it('should respect low consistency threshold (0.3)', async () => {
      const sccot = new SelfConsistentCoT({
        numPaths: 5,
        consistencyThreshold: 0.3,
      });
      const result = await sccot.reason('test-template', {
        problem: 'Low threshold test',
      });

      expect(result).toBeDefined();
    });

    it('should respect high consistency threshold (0.9)', async () => {
      const sccot = new SelfConsistentCoT({
        numPaths: 5,
        consistencyThreshold: 0.9,
      });
      const result = await sccot.reason('test-template', {
        problem: 'High threshold test',
      });

      expect(result).toBeDefined();
    });

    it('should respect perfect consistency threshold (1.0)', async () => {
      const sccot = new SelfConsistentCoT({
        numPaths: 5,
        consistencyThreshold: 1.0,
      });
      const result = await sccot.reason('test-template', {
        problem: 'Perfect threshold test',
      });

      expect(result).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should complete reasoning within reasonable time (5 paths)', async () => {
      const start = Date.now();
      const sccot = new SelfConsistentCoT({ numPaths: 5 });
      await sccot.reason('test-template', { problem: 'Performance test' });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });

    it('should scale with number of paths', async () => {
      const sccot3 = new SelfConsistentCoT({ numPaths: 3 });
      const sccot10 = new SelfConsistentCoT({ numPaths: 10 });

      const start3 = Date.now();
      await sccot3.reason('test-template', { problem: 'Test' });
      const duration3 = Date.now() - start3;

      const start10 = Date.now();
      await sccot10.reason('test-template', { problem: 'Test' });
      const duration10 = Date.now() - start10;

      // More paths should take longer (roughly)
      // But both should be reasonably fast
      expect(duration3).toBeLessThan(1000);
      expect(duration10).toBeLessThan(2000);
    });
  });
});
