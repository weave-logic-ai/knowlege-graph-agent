/**
 * Reasoning Pillar Integration Tests
 *
 * Tests integration of reasoning strategies with real-world problems
 */

import { describe, it, expect } from 'vitest';
import { TreeOfThought } from '../../../src/reasoning/tree-of-thought.js';
import { SelfConsistentCoT } from '../../../src/reasoning/self-consistent-cot.js';
import { generateProblemSolutions } from '../../utils/test-data-generator.js';

describe('Reasoning Pillar Integration', () => {
  describe('Problem Solving', () => {
    it('should solve math problems with SC-CoT', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 5 });

      const result = await sccot.reason('math-problem', {
        problem: 'Calculate: (5 + 3) * 2 - 4',
        steps: 'Show your work',
      });

      expect(result).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.finalAnswer).toBeDefined();
    });

    it('should explore solution space with ToT', async () => {
      const tot = new TreeOfThought({
        maxDepth: 3,
        branchingFactor: 3,
        evaluationStrategy: 'value',
      });

      const result = await tot.explore(
        'Find the most efficient sorting algorithm for nearly-sorted data'
      );

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(node => node.value !== undefined)).toBe(true);
    });

    it('should reason about code optimization', async () => {
      const sccot = new SelfConsistentCoT({
        numPaths: 7,
        temperature: 0.8,
      });

      const code = `
function findDuplicates(arr) {
  const duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {
        duplicates.push(arr[i]);
      }
    }
  }
  return duplicates;
}
`;

      const result = await sccot.reason('code-review', {
        code,
        task: 'Identify performance issues and suggest improvements',
      });

      expect(result).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);
    });
  });

  describe('Multi-Step Reasoning', () => {
    it('should chain reasoning steps', async () => {
      const tot = new TreeOfThought({ maxDepth: 4, branchingFactor: 2 });
      const sccot = new SelfConsistentCoT({ numPaths: 5 });

      // Step 1: Explore possibilities with ToT
      const exploration = await tot.explore(
        'Design a caching strategy for a web application'
      );

      expect(exploration).toBeDefined();
      expect(exploration.length).toBeGreaterThan(0);

      // Step 2: Reason about best option with SC-CoT
      const reasoning = await sccot.reason('evaluation', {
        task: 'Evaluate caching strategies',
        options: 'LRU, LFU, TTL-based',
      });

      expect(reasoning).toBeDefined();
      expect(reasoning.confidence).toBeGreaterThan(0);
    });

    it('should handle complex problem decomposition', async () => {
      const tot = new TreeOfThought({
        maxDepth: 5,
        branchingFactor: 3,
      });

      const problem = `
Design a microservices architecture for an e-commerce platform:
- User service
- Product catalog
- Order management
- Payment processing
- Inventory management
`;

      const result = await tot.explore(problem);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      // Deep exploration should yield longer paths
      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Reasoning Quality', () => {
    it('should improve consistency with more paths', async () => {
      const sccot3 = new SelfConsistentCoT({ numPaths: 3 });
      const sccot10 = new SelfConsistentCoT({ numPaths: 10 });

      const problem = { task: 'Choose best database: SQL vs NoSQL' };

      const result3 = await sccot3.reason('decision', problem);
      const result10 = await sccot10.reason('decision', problem);

      expect(result3.confidence).toBeLessThanOrEqual(result10.confidence);
      expect(result10.metadata?.paths).toBe(10);
    });

    it('should provide detailed reasoning steps', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 5 });

      const result = await sccot.reason('planning', {
        goal: 'Migrate monolith to microservices',
        constraints: ['Zero downtime', 'Limited resources', 'Legacy database'],
      });

      expect(result.steps).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);

      result.steps.forEach(step => {
        expect(step.step).toBeGreaterThan(0);
        expect(step.description).toBeTruthy();
        expect(step.thought).toBeTruthy();
      });
    });
  });

  describe('Real-World Scenarios', () => {
    it('should reason about architectural decisions', async () => {
      const tot = new TreeOfThought({
        maxDepth: 4,
        branchingFactor: 4,
        evaluationStrategy: 'comparison',
      });

      const decision = `
Choose between REST and GraphQL for API design:
- Consider scalability
- Client flexibility
- Caching complexity
- Learning curve
`;

      const result = await tot.explore(decision);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle debugging scenarios', async () => {
      const sccot = new SelfConsistentCoT({
        numPaths: 7,
        temperature: 0.7,
      });

      const bug = `
Error: Cannot read property 'name' of undefined
Stack trace shows error in user.profile.name access
User object exists but profile is sometimes undefined
`;

      const result = await sccot.reason('debugging', {
        error: bug,
        task: 'Identify root cause and solution',
      });

      expect(result).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should reason about test coverage gaps', async () => {
      const tot = new TreeOfThought({ maxDepth: 3, branchingFactor: 3 });

      const coverage = `
Current test coverage:
- Controller: 85%
- Service: 70%
- Repository: 90%
- Utils: 60%

Gaps: Error handling, edge cases, integration tests
`;

      const result = await tot.explore(
        `Prioritize test coverage improvements: ${coverage}`
      );

      expect(result).toBeDefined();
    });
  });

  describe('Strategy Comparison', () => {
    it('should use ToT for broad exploration', async () => {
      const tot = new TreeOfThought({
        maxDepth: 4,
        branchingFactor: 4,
      });

      const result = await tot.explore(
        'Explore different approaches to implement real-time notifications'
      );

      expect(result).toBeDefined();
      // ToT should explore multiple branches
      expect(result.length).toBeGreaterThan(0);
    });

    it('should use SC-CoT for consistent answers', async () => {
      const sccot = new SelfConsistentCoT({
        numPaths: 10,
        consistencyThreshold: 0.7,
      });

      const result = await sccot.reason('consensus', {
        question: 'What is the best practice for error handling in async code?',
      });

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.5);
      // High path count should give high confidence
      expect(result.metadata?.agreements).toBeGreaterThan(0);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle batch problem solving', async () => {
      const problems = generateProblemSolutions(5);
      const sccot = new SelfConsistentCoT({ numPaths: 3 });

      const start = Date.now();

      const results = await Promise.all(
        problems.map(p =>
          sccot.reason('problem-solving', {
            problem: p.problem,
            difficulty: p.difficulty,
          })
        )
      );

      const duration = Date.now() - start;

      expect(results).toHaveLength(5);
      expect(results.every(r => r.confidence > 0)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should be fast with parallel execution
    });

    it('should handle concurrent explorations efficiently', async () => {
      const tot = new TreeOfThought({ maxDepth: 3, branchingFactor: 2 });

      const start = Date.now();

      const results = await Promise.all([
        tot.explore('Problem 1: Optimize database queries'),
        tot.explore('Problem 2: Implement caching layer'),
        tot.explore('Problem 3: Scale horizontally'),
        tot.explore('Problem 4: Add monitoring'),
        tot.explore('Problem 5: Improve security'),
      ]);

      const duration = Date.now() - start;

      expect(results).toHaveLength(5);
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Error Recovery', () => {
    it('should handle edge cases gracefully', async () => {
      const tot = new TreeOfThought({ maxDepth: 2, branchingFactor: 2 });

      // Empty problem
      const result1 = await tot.explore('');
      expect(result1).toBeDefined();

      // Very long problem
      const longProblem = 'problem '.repeat(1000);
      const result2 = await tot.explore(longProblem);
      expect(result2).toBeDefined();
    });

    it('should handle invalid configurations gracefully', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 1 });

      const result = await sccot.reason('test', {});

      expect(result).toBeDefined();
      expect(result.confidence).toBe(1); // 100% agreement with 1 path
    });
  });
});
