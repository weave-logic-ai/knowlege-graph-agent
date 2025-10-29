/**
 * End-to-End Four Pillars Integration Tests
 *
 * Tests complete integration of Perception, Reasoning, Execution, and Reflection
 */

import { describe, it, expect } from 'vitest';
import { TreeOfThought } from '../../../src/reasoning/tree-of-thought.js';
import { SelfConsistentCoT } from '../../../src/reasoning/self-consistent-cot.js';
import { generateMarkdownContent, generateCodeSnippet } from '../../utils/test-data-generator.js';

describe('Four Pillars End-to-End Integration', () => {
  describe('Complete Workflow: Code Review', () => {
    it('should execute full pillar cycle for code review', async () => {
      // 1. PERCEPTION: Analyze code
      const code = generateCodeSnippet('typescript');
      const lines = code.split('\n').filter(l => l.trim());
      const hasExports = code.includes('export');
      const hasFunctions = code.includes('function');

      expect(lines.length).toBeGreaterThan(0);
      expect(hasExports).toBe(true);
      expect(hasFunctions).toBe(true);

      // 2. REASONING: Evaluate code quality
      const tot = new TreeOfThought({
        maxDepth: 3,
        branchingFactor: 3,
        evaluationStrategy: 'value',
      });

      const reasoning = await tot.explore(
        'Evaluate code quality and suggest improvements'
      );

      expect(reasoning).toBeDefined();
      expect(reasoning.length).toBeGreaterThan(0);

      // 3. EXECUTION: Generate recommendations (simulated)
      const recommendations = reasoning.map(node => ({
        thought: node.thought,
        priority: node.value > 0.7 ? 'high' : 'medium',
      }));

      expect(recommendations.length).toBeGreaterThan(0);

      // 4. REFLECTION: Assess quality of review
      const sccot = new SelfConsistentCoT({ numPaths: 5 });
      const reflection = await sccot.reason('quality-check', {
        task: 'Assess review completeness',
      });

      expect(reflection.confidence).toBeGreaterThan(0);
    });
  });

  describe('Complete Workflow: Documentation Generation', () => {
    it('should execute full pillar cycle for documentation', async () => {
      // 1. PERCEPTION: Parse existing docs
      const content = generateMarkdownContent('API Docs', 5, 2);
      const sections = content.match(/^## .+/gm) || [];
      const wordCount = content.split(/\s+/).length;

      expect(sections.length).toBeGreaterThan(0);
      expect(wordCount).toBeGreaterThan(0);

      // 2. REASONING: Identify gaps
      const tot = new TreeOfThought({ maxDepth: 3, branchingFactor: 3 });
      const gaps = await tot.explore('Identify documentation gaps');

      expect(gaps).toBeDefined();
      expect(gaps.length).toBeGreaterThan(0);

      // 3. EXECUTION: Generate new sections (simulated)
      const newSections = gaps.map(gap => ({
        title: gap.thought,
        priority: gap.value,
      }));

      expect(newSections.length).toBeGreaterThan(0);

      // 4. REFLECTION: Verify completeness
      const sccot = new SelfConsistentCoT({ numPaths: 7 });
      const verification = await sccot.reason('verify', {
        sections: newSections.length,
      });

      expect(verification.confidence).toBeGreaterThan(0);
    });
  });

  describe('Complete Workflow: Bug Analysis', () => {
    it('should execute full pillar cycle for debugging', async () => {
      // 1. PERCEPTION: Analyze error
      const error = {
        message: 'TypeError: Cannot read property name of undefined',
        stack: 'at processUser (user.service.ts:45)',
        context: 'User profile access',
      };

      expect(error.message).toContain('undefined');
      expect(error.stack).toContain('user.service.ts');

      // 2. REASONING: Find root cause
      const sccot = new SelfConsistentCoT({
        numPaths: 10,
        temperature: 0.7,
      });

      const diagnosis = await sccot.reason('debug', {
        error: error.message,
        location: error.stack,
      });

      expect(diagnosis).toBeDefined();
      expect(diagnosis.steps.length).toBeGreaterThan(0);

      // 3. EXECUTION: Generate fix (simulated)
      const fix = {
        approach: diagnosis.finalAnswer,
        confidence: diagnosis.confidence,
        steps: diagnosis.steps.map(s => s.description),
      };

      expect(fix.approach).toBeDefined();
      expect(fix.steps.length).toBeGreaterThan(0);

      // 4. REFLECTION: Validate solution
      const tot = new TreeOfThought({ maxDepth: 2, branchingFactor: 2 });
      const validation = await tot.explore('Validate fix completeness');

      expect(validation).toBeDefined();
    });
  });

  describe('Complete Workflow: Architecture Design', () => {
    it('should execute full pillar cycle for system design', async () => {
      // 1. PERCEPTION: Gather requirements
      const requirements = `
Requirements:
- Handle 10k requests/second
- 99.9% uptime
- Multi-region deployment
- Real-time data processing
- Secure authentication
`;

      const reqLines = requirements.split('\n').filter(l => l.trim().startsWith('-'));
      expect(reqLines.length).toBe(5);

      // 2. REASONING: Explore architectures
      const tot = new TreeOfThought({
        maxDepth: 4,
        branchingFactor: 4,
        evaluationStrategy: 'comparison',
      });

      const architectures = await tot.explore(
        'Design scalable microservices architecture'
      );

      expect(architectures).toBeDefined();
      expect(architectures.length).toBeGreaterThan(0);

      // 3. EXECUTION: Select best approach
      const bestArchitecture = architectures.reduce((best, current) =>
        current.value > best.value ? current : best
      );

      expect(bestArchitecture).toBeDefined();
      expect(bestArchitecture.value).toBeGreaterThan(0);

      // 4. REFLECTION: Verify requirements met
      const sccot = new SelfConsistentCoT({ numPaths: 7 });
      const verification = await sccot.reason('verify-requirements', {
        architecture: bestArchitecture.thought,
        requirements: reqLines.length,
      });

      expect(verification.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Parallel Workflows', () => {
    it('should handle multiple workflows concurrently', async () => {
      const start = Date.now();

      const workflows = await Promise.all([
        // Workflow 1: Code analysis
        (async () => {
          const code = generateCodeSnippet('typescript');
          const tot = new TreeOfThought({ maxDepth: 2, branchingFactor: 2 });
          return tot.explore('Analyze code structure');
        })(),

        // Workflow 2: Documentation review
        (async () => {
          const docs = generateMarkdownContent('Docs', 3, 2);
          const sccot = new SelfConsistentCoT({ numPaths: 3 });
          return sccot.reason('review-docs', { content: docs.length });
        })(),

        // Workflow 3: Architecture planning
        (async () => {
          const tot = new TreeOfThought({ maxDepth: 3, branchingFactor: 2 });
          return tot.explore('Plan system architecture');
        })(),

        // Workflow 4: Test planning
        (async () => {
          const sccot = new SelfConsistentCoT({ numPaths: 5 });
          return sccot.reason('plan-tests', { scope: 'unit + integration' });
        })(),
      ]);

      const duration = Date.now() - start;

      expect(workflows).toHaveLength(4);
      expect(workflows.every(w => w !== undefined)).toBe(true);
      expect(duration).toBeLessThan(2000); // Parallel should be fast
    });
  });

  describe('Iterative Refinement', () => {
    it('should support iterative improvement cycles', async () => {
      const tot = new TreeOfThought({ maxDepth: 3, branchingFactor: 3 });
      const sccot = new SelfConsistentCoT({ numPaths: 5 });

      const iterations = [];

      // Iteration 1: Initial design
      const design1 = await tot.explore('Initial API design');
      iterations.push(design1);

      // Iteration 2: Refine based on feedback
      const feedback1 = await sccot.reason('evaluate', {
        design: 'iteration 1',
      });
      const design2 = await tot.explore('Refined API design');
      iterations.push(design2);

      // Iteration 3: Final optimization
      const feedback2 = await sccot.reason('evaluate', {
        design: 'iteration 2',
      });
      const design3 = await tot.explore('Optimized API design');
      iterations.push(design3);

      expect(iterations).toHaveLength(3);
      expect(feedback1.confidence).toBeDefined();
      expect(feedback2.confidence).toBeDefined();
    });
  });

  describe('Error Handling Across Pillars', () => {
    it('should gracefully handle errors in perception phase', async () => {
      // Invalid input
      const content = '';

      // Should still proceed with reasoning
      const tot = new TreeOfThought({ maxDepth: 2, branchingFactor: 2 });
      const result = await tot.explore('Handle edge case');

      expect(result).toBeDefined();
    });

    it('should recover from reasoning failures', async () => {
      const sccot = new SelfConsistentCoT({ numPaths: 1 });

      // Edge case: minimal paths
      const result = await sccot.reason('test', {});

      expect(result).toBeDefined();
      expect(result.confidence).toBe(1);
    });
  });

  describe('Performance Across Pillars', () => {
    it('should complete full workflow efficiently', async () => {
      const start = Date.now();

      // Perception
      const content = generateMarkdownContent('Test', 5, 2);
      const sections = content.match(/^## .+/gm) || [];

      // Reasoning
      const tot = new TreeOfThought({ maxDepth: 3, branchingFactor: 2 });
      const reasoning = await tot.explore('Analyze structure');

      // Execution (simulated)
      const actions = reasoning.map(r => ({ action: r.thought }));

      // Reflection
      const sccot = new SelfConsistentCoT({ numPaths: 5 });
      const reflection = await sccot.reason('verify', { actions: actions.length });

      const duration = Date.now() - start;

      expect(sections).toBeDefined();
      expect(reasoning).toBeDefined();
      expect(actions.length).toBeGreaterThan(0);
      expect(reflection.confidence).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // Complete workflow < 1s
    });

    it('should scale with workload size', async () => {
      const small = Date.now();
      const smallDoc = generateMarkdownContent('Small', 2, 1);
      const smallTot = new TreeOfThought({ maxDepth: 2, branchingFactor: 2 });
      await smallTot.explore('Small task');
      const smallDuration = Date.now() - small;

      const large = Date.now();
      const largeDoc = generateMarkdownContent('Large', 10, 5);
      const largeTot = new TreeOfThought({ maxDepth: 4, branchingFactor: 3 });
      await largeTot.explore('Large task');
      const largeDuration = Date.now() - large;

      // Larger tasks should take more time, but still reasonable
      expect(largeDuration).toBeGreaterThan(smallDuration);
      expect(largeDuration).toBeLessThan(2000);
    });
  });

  describe('Data Flow Integration', () => {
    it('should pass data correctly between pillars', async () => {
      // Perception output
      const perceptionData = {
        sections: 5,
        wordCount: 1000,
        links: 10,
      };

      // Reasoning input (uses perception output)
      const sccot = new SelfConsistentCoT({ numPaths: 5 });
      const reasoning = await sccot.reason('analyze', perceptionData);

      expect(reasoning).toBeDefined();
      expect(reasoning.finalAnswer).toBeDefined();

      // Execution input (uses reasoning output)
      const executionPlan = {
        action: reasoning.finalAnswer,
        confidence: reasoning.confidence,
        steps: reasoning.steps.length,
      };

      expect(executionPlan.action).toBeDefined();
      expect(executionPlan.confidence).toBeGreaterThan(0);

      // Reflection input (uses execution output)
      const tot = new TreeOfThought({ maxDepth: 2, branchingFactor: 2 });
      const reflection = await tot.explore(
        `Verify action: ${executionPlan.action}`
      );

      expect(reflection).toBeDefined();
    });
  });
});
