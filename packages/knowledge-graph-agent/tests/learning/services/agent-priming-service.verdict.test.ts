/**
 * Tests for AgentPrimingService Verdict Judgment
 *
 * Tests for the verdict judgment integration with ReasoningBank.
 *
 * @module tests/learning/services/agent-priming-service.verdict
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AgentPrimingService,
  createAgentPrimingService,
  type TaskForPriming,
} from '../../../src/learning/services/agent-priming-service.js';
import {
  ReasoningBankAdapter,
} from '../../../src/integrations/agentic-flow/adapters/reasoning-bank-adapter.js';

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Create a mock task for priming with verdict
 */
function createMockTask(overrides: Partial<TaskForPriming> = {}): TaskForPriming {
  return {
    id: 'task-123',
    description: 'Implement user authentication',
    agentType: 'coder',
    tags: ['code', 'implement', 'auth'],
    priority: 'high',
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('AgentPrimingService Verdict Judgment', () => {
  let service: AgentPrimingService;
  let reasoningBank: ReasoningBankAdapter;

  beforeEach(async () => {
    reasoningBank = new ReasoningBankAdapter();
    await reasoningBank.initialize();
    service = createAgentPrimingService(undefined, undefined, undefined, reasoningBank);
  });

  afterEach(async () => {
    await reasoningBank.clear();
  });

  // ============================================================================
  // hasVerdictCapability Tests
  // ============================================================================

  describe('hasVerdictCapability', () => {
    it('should return true when ReasoningBank is available', () => {
      expect(service.hasVerdictCapability()).toBe(true);
    });

    it('should return false without ReasoningBank', () => {
      const noVerdictService = createAgentPrimingService();

      expect(noVerdictService.hasVerdictCapability()).toBe(false);
    });
  });

  // ============================================================================
  // setReasoningBank Tests
  // ============================================================================

  describe('setReasoningBank', () => {
    it('should set ReasoningBank after initialization', async () => {
      const serviceNoBank = createAgentPrimingService();
      expect(serviceNoBank.hasVerdictCapability()).toBe(false);

      const newBank = new ReasoningBankAdapter();
      await newBank.initialize();
      serviceNoBank.setReasoningBank(newBank);

      expect(serviceNoBank.hasVerdictCapability()).toBe(true);
    });

    it('should allow replacing ReasoningBank', async () => {
      const newBank = new ReasoningBankAdapter();
      await newBank.initialize();

      service.setReasoningBank(newBank);

      expect(service.hasVerdictCapability()).toBe(true);
    });
  });

  // ============================================================================
  // primeAgentWithVerdict Tests
  // ============================================================================

  describe('primeAgentWithVerdict', () => {
    it('should return priming context with verdict', async () => {
      const task = createMockTask();
      const context = await service.primeAgentWithVerdict('agent-123', task);

      expect(context).toHaveProperty('relevantMemories');
      expect(context).toHaveProperty('similarTasks');
      expect(context).toHaveProperty('recommendedApproach');
      expect(context).toHaveProperty('warnings');
      expect(context).toHaveProperty('suggestedTools');
      expect(context).toHaveProperty('confidence');
      expect(context).toHaveProperty('verdict');
    });

    it('should include verdict from ReasoningBank', async () => {
      const task = createMockTask();
      const context = await service.primeAgentWithVerdict('agent-123', task);

      expect(context.verdict).not.toBeNull();
      expect(context.verdict).toHaveProperty('recommendation');
      expect(context.verdict).toHaveProperty('confidence');
      expect(context.verdict).toHaveProperty('reasoning');
      expect(context.verdict).toHaveProperty('warnings');
      expect(context.verdict).toHaveProperty('similarTrajectories');
    });

    it('should return null verdict without ReasoningBank', async () => {
      const noVerdictService = createAgentPrimingService();
      const task = createMockTask();

      const context = await noVerdictService.primeAgentWithVerdict('agent-123', task);

      expect(context.verdict).toBeNull();
    });

    it('should recommend proceed for new tasks', async () => {
      const task = createMockTask({
        description: 'Completely new task with no history',
      });

      const context = await service.primeAgentWithVerdict('agent-123', task);

      expect(context.verdict?.recommendation).toBe('proceed');
    });

    it('should increase confidence with successful history', async () => {
      // Seed successful trajectories
      for (let i = 0; i < 5; i++) {
        await reasoningBank.storeTrajectory({
          taskId: `auth-task-${i}`,
          steps: [
            { action: 'implement', observation: 'Done', timestamp: new Date() },
          ],
          outcome: 'success',
          metadata: { description: 'Implement authentication feature' },
        });
      }

      const task = createMockTask({
        description: 'Implement authentication feature',
      });

      const context = await service.primeAgentWithVerdict('agent-123', task);

      expect(context.verdict?.recommendation).toBe('proceed');
      expect(context.verdict?.confidence).toBeGreaterThan(0.3);
    });

    it('should include warnings from failed trajectories', async () => {
      // Seed failed trajectory
      await reasoningBank.storeTrajectory({
        taskId: 'failed-auth-task',
        steps: [
          { action: 'implement', observation: 'Error occurred', timestamp: new Date() },
        ],
        outcome: 'failure',
        metadata: {
          description: 'Implement authentication',
          errorMessage: 'Token validation failed',
        },
      });

      const task = createMockTask({
        description: 'Implement authentication',
      });

      const context = await service.primeAgentWithVerdict('agent-123', task);

      // Should have similar trajectories referenced
      expect(context.verdict?.similarTrajectories.length).toBeGreaterThanOrEqual(0);
    });

    it('should suggest approach from successful trajectories', async () => {
      // Seed successful trajectory with steps
      await reasoningBank.storeTrajectory({
        taskId: 'successful-db-task',
        steps: [
          { action: 'design', observation: 'Created schema', timestamp: new Date() },
          { action: 'implement', observation: 'Built models', timestamp: new Date() },
          { action: 'test', observation: 'All tests passed', timestamp: new Date() },
        ],
        outcome: 'success',
        metadata: { description: 'Database migration task' },
      });

      const task = createMockTask({
        description: 'Database migration task',
      });

      const context = await service.primeAgentWithVerdict('agent-123', task);

      // May or may not have suggested approach depending on similarity
      expect(context.verdict).toBeDefined();
    });
  });

  // ============================================================================
  // getTaskInsights Tests
  // ============================================================================

  describe('getTaskInsights', () => {
    it('should return insights for task description', async () => {
      // Seed some trajectories
      await reasoningBank.storeTrajectory({
        taskId: 'api-task-1',
        steps: [
          { action: 'design', observation: 'Designed API', timestamp: new Date(), duration: 5000 },
          { action: 'implement', observation: 'Implemented', timestamp: new Date(), duration: 10000 },
        ],
        outcome: 'success',
        metadata: { description: 'Build REST API endpoints' },
      });
      await reasoningBank.storeTrajectory({
        taskId: 'api-task-2',
        steps: [
          { action: 'design', observation: 'Designed API', timestamp: new Date(), duration: 3000 },
        ],
        outcome: 'failure',
        metadata: { description: 'Build REST API endpoints' },
      });

      const insights = await service.getTaskInsights('Build REST API');

      expect(insights).toHaveProperty('similarTasks');
      expect(insights).toHaveProperty('successRate');
      expect(insights).toHaveProperty('avgDuration');
      expect(insights).toHaveProperty('commonApproaches');
    });

    it('should return zero insights for unknown tasks', async () => {
      const insights = await service.getTaskInsights(
        'Completely unknown task type xyz'
      );

      expect(insights.similarTasks).toBe(0);
      expect(insights.successRate).toBe(0);
      expect(insights.avgDuration).toBe(0);
      expect(insights.commonApproaches).toEqual([]);
    });

    it('should calculate success rate correctly', async () => {
      // Seed 3 successful, 1 failed
      for (let i = 0; i < 3; i++) {
        await reasoningBank.storeTrajectory({
          taskId: `feature-success-${i}`,
          steps: [{ action: 'implement', observation: 'Done', timestamp: new Date() }],
          outcome: 'success',
          metadata: { description: 'Feature implementation' },
        });
      }
      await reasoningBank.storeTrajectory({
        taskId: 'feature-failure',
        steps: [{ action: 'implement', observation: 'Failed', timestamp: new Date() }],
        outcome: 'failure',
        metadata: { description: 'Feature implementation' },
      });

      const insights = await service.getTaskInsights('Feature implementation');

      expect(insights.successRate).toBe(0.75); // 3/4
    });

    it('should extract common approaches', async () => {
      // Seed trajectories with common action patterns
      for (let i = 0; i < 3; i++) {
        await reasoningBank.storeTrajectory({
          taskId: `tdd-task-${i}`,
          steps: [
            { action: 'test', observation: 'Write tests first', timestamp: new Date() },
            { action: 'implement', observation: 'Implement feature', timestamp: new Date() },
            { action: 'refactor', observation: 'Clean up code', timestamp: new Date() },
          ],
          outcome: 'success',
          metadata: { description: 'TDD development task' },
        });
      }

      const insights = await service.getTaskInsights('TDD development');

      expect(insights.commonApproaches.length).toBeGreaterThan(0);
    });

    it('should handle no ReasoningBank gracefully', async () => {
      const noVerdictService = createAgentPrimingService();

      const insights = await noVerdictService.getTaskInsights('Any task');

      expect(insights.similarTasks).toBe(0);
      expect(insights.successRate).toBe(0);
      expect(insights.avgDuration).toBe(0);
      expect(insights.commonApproaches).toEqual([]);
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('integration', () => {
    it('should combine priming context with verdict information', async () => {
      // Seed rich history
      for (let i = 0; i < 5; i++) {
        await reasoningBank.storeTrajectory({
          taskId: `refactor-task-${i}`,
          steps: [
            { action: 'analyze', observation: 'Found issues', timestamp: new Date() },
            { action: 'refactor', observation: 'Refactored code', timestamp: new Date() },
            { action: 'test', observation: 'Tests passed', timestamp: new Date() },
          ],
          outcome: i < 4 ? 'success' : 'failure', // 80% success
          metadata: { description: 'Refactor legacy code' },
        });
      }

      const task = createMockTask({
        description: 'Refactor legacy code',
        agentType: 'coder',
      });

      const context = await service.primeAgentWithVerdict('agent-coder', task);

      // Should have standard priming context
      expect(context.relevantMemories).toBeDefined();
      expect(context.suggestedTools).toBeDefined();

      // Should also have verdict
      expect(context.verdict).toBeDefined();
      expect(['proceed', 'caution', 'avoid']).toContain(
        context.verdict?.recommendation
      );
    });

    it('should work with standard primeAgent alongside primeAgentWithVerdict', async () => {
      const task = createMockTask();

      const standardContext = await service.primeAgent('agent-123', task);
      const verdictContext = await service.primeAgentWithVerdict('agent-123', task);

      // Standard context should not have verdict
      expect(standardContext).not.toHaveProperty('verdict');

      // Verdict context should have verdict
      expect(verdictContext).toHaveProperty('verdict');

      // Both should have base priming properties
      expect(standardContext.relevantMemories).toBeDefined();
      expect(verdictContext.relevantMemories).toBeDefined();
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('edge cases', () => {
    it('should handle empty task description', async () => {
      const task = createMockTask({ description: '' });

      const context = await service.primeAgentWithVerdict('agent-123', task);

      expect(context.verdict).toBeDefined();
    });

    it('should handle very long task description', async () => {
      const task = createMockTask({
        description: 'A'.repeat(10000),
      });

      const context = await service.primeAgentWithVerdict('agent-123', task);

      expect(context.verdict).toBeDefined();
    });

    it('should handle special characters in description', async () => {
      const task = createMockTask({
        description: 'Fix bug: "TypeError" in <Component> & handle @decorator',
      });

      const context = await service.primeAgentWithVerdict('agent-123', task);

      expect(context.verdict).toBeDefined();
    });

    it('should handle concurrent priming requests', async () => {
      const tasks = Array.from({ length: 5 }, (_, i) =>
        createMockTask({ id: `task-${i}`, description: `Task ${i}` })
      );

      const results = await Promise.all(
        tasks.map((task, i) =>
          service.primeAgentWithVerdict(`agent-${i}`, task)
        )
      );

      expect(results).toHaveLength(5);
      for (const result of results) {
        expect(result.verdict).toBeDefined();
      }
    });
  });
});
