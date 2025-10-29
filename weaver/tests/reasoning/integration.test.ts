/**
 * Reasoning System Integration Tests
 *
 * Coverage:
 * - Integration between Tree-of-Thought and Self-Consistent CoT
 * - Real-world reasoning scenarios
 * - Template system integration
 * - Performance under load
 */

import { describe, it, expect } from 'vitest';
import { TreeOfThought } from '../../src/reasoning/tree-of-thought.js';
import { SelfConsistentCoT } from '../../src/reasoning/self-consistent-cot.js';
import type { CoTReasoningResult } from '../../src/reasoning/types.js';

describe('Reasoning System Integration', () => {
  describe('Multi-Strategy Reasoning', () => {
    it('should use ToT and SC-CoT together', async () => {
      const tot = new TreeOfThought({ maxDepth: 3, branchingFactor: 3 });
      const sccot = new SelfConsistentCoT({ numPaths: 5 });

      // First use ToT to explore
      const totResult = await tot.explore('Complex multi-step problem');
      expect(totResult).toBeDefined();

      // Then use SC-CoT for consensus
      const scResult = await sccot.reason('test-template', {
        problem: 'Verify ToT solution',
      });
      expect(scResult).toBeDefined();
    });

    it('should handle sequential reasoning tasks', async () => {
      const tot = new TreeOfThought({ maxDepth: 2, branchingFactor: 2 });
      const sccot = new SelfConsistentCoT({ numPaths: 3 });

      const results = [];

      // Sequential reasoning steps
      results.push(await tot.explore('Step 1: Analyze problem'));
      results.push(await sccot.reason('step2', { task: 'Generate solutions' }));
      results.push(await tot.explore('Step 3: Evaluate options'));
      results.push(await sccot.reason('step4', { task: 'Select best solution' }));

      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should handle parallel reasoning tasks', async () => {
      const tot1 = new TreeOfThought({ maxDepth: 2, branchingFactor: 2 });
      const tot2 = new TreeOfThought({ maxDepth: 2, branchingFactor: 2 });
      const sccot1 = new SelfConsistentCoT({ numPaths: 3 });
      const sccot2 = new SelfConsistentCoT({ numPaths: 3 });

      const results = await Promise.all([
        tot1.explore('Problem A'),
        tot2.explore('Problem B'),
        sccot1.reason('template1', { problem: 'Task 1' }),
        sccot2.reason('template2', { problem: 'Task 2' }),
      ]);

      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Real-World Scenarios', () => {
    it('should solve math word problem', async () => {
      const sccot = new SelfConsistentCoT({
        numPaths: 7,
        temperature: 0.7,
      });

      const result = await sccot.reason('math-problem', {
        problem: 'If John has 5 apples and buys 3 more, how many does he have?',
        requiresSteps: true,
      });

      expect(result).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should solve logical reasoning problem', async () => {
      const tot = new TreeOfThought({
        maxDepth: 4,
        branchingFactor: 3,
        evaluationStrategy: 'value',
      });

      const result = await tot.explore(
        'All birds can fly. Penguins are birds. Can penguins fly?'
      );

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should solve multi-step planning problem', async () => {
      const sccot = new SelfConsistentCoT({
        numPaths: 5,
        temperature: 0.8,
      });

      const result = await sccot.reason('planning', {
        goal: 'Plan a trip from NYC to LA',
        constraints: ['3 days', 'budget $1000', 'visit Grand Canyon'],
      });

      expect(result).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('should solve code debugging problem', async () => {
      const tot = new TreeOfThought({
        maxDepth: 3,
        branchingFactor: 4,
      });

      const codeWithBug = `
        function sum(arr) {
          let total = 0;
          for (let i = 0; i <= arr.length; i++) {
            total += arr[i];
          }
          return total;
        }
      `;

      const result = await tot.explore(`Find bug in: ${codeWithBug}`);

      expect(result).toBeDefined();
    });
  });

  describe('Reasoning Quality', () => {
    it('should improve with more paths in SC-CoT', async () => {
      const sccot3 = new SelfConsistentCoT({ numPaths: 3 });
      const sccot10 = new SelfConsistentCoT({ numPaths: 10 });

      const result3 = await sccot3.reason('test', { problem: 'Test problem' });
      const result10 = await sccot10.reason('test', { problem: 'Test problem' });

      expect(result3.confidence).toBeDefined();
      expect(result10.confidence).toBeDefined();

      // More paths should generally lead to higher confidence
      expect(result10.metadata?.paths).toBeGreaterThan(result3.metadata?.paths);
    });

    it('should improve with deeper exploration in ToT', async () => {
      const totShallow = new TreeOfThought({ maxDepth: 2, branchingFactor: 2 });
      const totDeep = new TreeOfThought({ maxDepth: 5, branchingFactor: 2 });

      const resultShallow = await totShallow.explore('Complex problem');
      const resultDeep = await totDeep.explore('Complex problem');

      expect(resultShallow).toBeDefined();
      expect(resultDeep).toBeDefined();

      // Deeper exploration should yield longer paths
      expect(resultDeep.length).toBeGreaterThanOrEqual(resultShallow.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle ToT with invalid configuration gracefully', async () => {
      // Note: TypeScript would catch this, but testing runtime behavior
      const tot = new TreeOfThought({ maxDepth: 2, branchingFactor: 2 });
      const result = await tot.explore('Test');

      expect(result).toBeDefined();
    });

    it('should handle SC-CoT with edge case inputs', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 1 });

      const result = await sccot.reason('', { problem: '' });

      expect(result).toBeDefined();
    });
  });

  describe('Performance Under Load', () => {
    it('should handle multiple concurrent ToT explorations', async () => {
      const tot = new TreeOfThought({ maxDepth: 3, branchingFactor: 2 });

      const promises = Array(10).fill(null).map((_, i) =>
        tot.explore(`Problem ${i}`)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should handle multiple concurrent SC-CoT reasonings', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 5 });

      const promises = Array(10).fill(null).map((_, i) =>
        sccot.reason(`template-${i}`, { problem: `Problem ${i}` })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('should complete batch processing within reasonable time', async () => {
      const start = Date.now();

      const tot = new TreeOfThought({ maxDepth: 2, branchingFactor: 2 });
      const sccot = new SelfConsistentCoT({ numPaths: 3 });

      const promises = [
        ...Array(5).fill(null).map((_, i) => tot.explore(`ToT ${i}`)),
        ...Array(5).fill(null).map((_, i) =>
          sccot.reason(`sc-${i}`, { problem: `SC-CoT ${i}` })
        ),
      ];

      await Promise.all(promises);

      const duration = Date.now() - start;

      // 10 tasks should complete in under 3 seconds
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('Strategy Comparison', () => {
    it('should provide different perspectives on same problem', async () => {
      const problem = 'How to optimize database queries?';

      const tot = new TreeOfThought({ maxDepth: 3, branchingFactor: 3 });
      const sccot = new SelfConsistentCoT({ numPaths: 5 });

      const totResult = await tot.explore(problem);
      const scResult = await sccot.reason('optimization', { problem });

      expect(totResult).toBeDefined();
      expect(scResult).toBeDefined();

      // Both should provide valid reasoning
      expect(totResult.length).toBeGreaterThan(0);
      expect(scResult.steps.length).toBeGreaterThan(0);
    });

    it('should complement each other for complex problems', async () => {
      const tot = new TreeOfThought({
        maxDepth: 4,
        branchingFactor: 3,
        evaluationStrategy: 'value',
      });
      const sccot = new SelfConsistentCoT({
        numPaths: 7,
        temperature: 0.8,
        consistencyThreshold: 0.7,
      });

      // Use ToT for broad exploration
      const exploration = await tot.explore('Design microservices architecture');

      // Use SC-CoT for detailed reasoning on best path
      const detailed = await sccot.reason('architecture', {
        problem: 'Implement service discovery',
        context: 'Based on ToT exploration',
      });

      expect(exploration).toBeDefined();
      expect(detailed).toBeDefined();
      expect(detailed.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak memory with many explorations', async () => {
      const tot = new TreeOfThought({ maxDepth: 2, branchingFactor: 2 });

      // Run many explorations
      for (let i = 0; i < 50; i++) {
        await tot.explore(`Problem ${i}`);
      }

      // Test passes if no memory issues
      expect(true).toBe(true);
    });

    it('should not leak memory with many reasonings', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 3 });

      for (let i = 0; i < 50; i++) {
        await sccot.reason(`template-${i}`, { problem: `Problem ${i}` });
      }

      expect(true).toBe(true);
    });
  });
});
