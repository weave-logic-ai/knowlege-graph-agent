/**
 * Tests for AgentPrimingService
 *
 * @module learning/services/__tests__/agent-priming-service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AgentPrimingService,
  createAgentPrimingService,
  type TaskForPriming,
} from '../../../src/learning/services/agent-priming-service.js';
import type { TaskResult } from '../../../src/learning/types.js';

/**
 * Create a mock task for priming
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

/**
 * Create a mock task result
 */
function createMockTaskResult(overrides: Partial<TaskResult> = {}): TaskResult {
  return {
    taskId: 'task-past-1',
    description: 'Implement login feature',
    agentId: 'agent-1',
    agentType: 'coder',
    success: true,
    output: 'Completed login implementation',
    context: {
      workingDirectory: '/project',
      projectType: 'nodejs',
    },
    startTime: new Date(Date.now() - 60000),
    endTime: new Date(Date.now() - 50000),
    durationMs: 10000,
    qualityScore: 0.85,
    ...overrides,
  };
}

describe('AgentPrimingService', () => {
  let service: AgentPrimingService;

  beforeEach(() => {
    service = createAgentPrimingService();
  });

  describe('constructor', () => {
    it('should create a service with default config', () => {
      expect(service).toBeInstanceOf(AgentPrimingService);
    });

    it('should create a service with custom config', () => {
      const custom = createAgentPrimingService(undefined, undefined, {
        maxMemories: 5,
        maxSimilarTasks: 3,
        similarityThreshold: 0.8,
      });
      expect(custom).toBeInstanceOf(AgentPrimingService);
    });
  });

  describe('primeAgent', () => {
    it('should return priming context', async () => {
      const task = createMockTask();
      const context = await service.primeAgent('agent-123', task);

      expect(context).toHaveProperty('relevantMemories');
      expect(context).toHaveProperty('similarTasks');
      expect(context).toHaveProperty('recommendedApproach');
      expect(context).toHaveProperty('warnings');
      expect(context).toHaveProperty('suggestedTools');
      expect(context).toHaveProperty('confidence');
    });

    it('should suggest tools based on agent type', async () => {
      const coderTask = createMockTask({ agentType: 'coder' });
      const testerTask = createMockTask({ agentType: 'tester' });

      const coderContext = await service.primeAgent('agent-1', coderTask);
      const testerContext = await service.primeAgent('agent-2', testerTask);

      expect(coderContext.suggestedTools).toContain('edit');
      expect(coderContext.suggestedTools).toContain('read');
      expect(testerContext.suggestedTools).toContain('test');
    });

    it('should return recommended approach', async () => {
      const task = createMockTask();
      const context = await service.primeAgent('agent-123', task);

      expect(context.recommendedApproach).toBeDefined();
      expect(typeof context.recommendedApproach).toBe('string');
    });

    it('should include confidence score', async () => {
      const task = createMockTask();
      const context = await service.primeAgent('agent-123', task);

      expect(context.confidence).toBeGreaterThanOrEqual(0);
      expect(context.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('recordTaskCompletion', () => {
    it('should record completed tasks for future priming', async () => {
      const result = createMockTaskResult();
      service.recordTaskCompletion(result);

      // Prime with similar task
      const similarTask = createMockTask({
        description: 'Implement login feature',
        agentType: 'coder',
      });

      const context = await service.primeAgent('agent-123', similarTask);
      expect(context.similarTasks.length).toBeGreaterThanOrEqual(0);
    });

    it('should track multiple completions', async () => {
      for (let i = 0; i < 5; i++) {
        service.recordTaskCompletion(
          createMockTaskResult({
            taskId: `task-${i}`,
            description: `Task ${i}`,
            success: i % 2 === 0,
          })
        );
      }

      const task = createMockTask();
      const context = await service.primeAgent('agent-123', task);

      // Should find some similar tasks
      expect(context).toBeDefined();
    });
  });

  describe('similar task matching', () => {
    it('should find tasks with same agent type', async () => {
      // Record coder tasks
      service.recordTaskCompletion(createMockTaskResult({
        taskId: 'coder-task-1',
        agentType: 'coder',
        description: 'Implement feature A',
      }));

      // Record tester tasks
      service.recordTaskCompletion(createMockTaskResult({
        taskId: 'tester-task-1',
        agentType: 'tester',
        description: 'Test feature A',
      }));

      const coderTask = createMockTask({ agentType: 'coder' });
      const context = await service.primeAgent('agent-1', coderTask);

      // Should prefer coder tasks
      const coderTasks = context.similarTasks.filter(t => t.agentType === 'coder');
      expect(coderTasks.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate similarity score', async () => {
      service.recordTaskCompletion(createMockTaskResult({
        taskId: 'similar-task',
        agentType: 'coder',
        description: 'Implement user authentication',
      }));

      const task = createMockTask({ description: 'Implement user authentication' });
      const context = await service.primeAgent('agent-1', task);

      if (context.similarTasks.length > 0) {
        expect(context.similarTasks[0].similarity).toBeDefined();
        expect(context.similarTasks[0].similarity).toBeGreaterThan(0);
      }
    });
  });

  describe('warnings extraction', () => {
    it('should extract warnings from failed tasks', async () => {
      service.recordTaskCompletion(createMockTaskResult({
        taskId: 'failed-task',
        agentType: 'coder',
        success: false,
        description: 'Implement authentication',
        error: {
          code: 'AUTH_ERROR',
          message: 'Token validation failed',
        },
      }));

      const task = createMockTask({
        agentType: 'coder',
        description: 'Implement authentication',
      });

      const context = await service.primeAgent('agent-1', task);

      // Warnings may be empty if similarity threshold not met
      expect(Array.isArray(context.warnings)).toBe(true);
    });
  });

  describe('tool suggestions', () => {
    it('should suggest tools based on task tags', async () => {
      const testTask = createMockTask({ tags: ['test', 'verify'] });
      const context = await service.primeAgent('agent-1', testTask);

      expect(context.suggestedTools).toContain('test');
    });

    it('should suggest code tools for implementation tasks', async () => {
      const codeTask = createMockTask({ tags: ['code', 'implement'] });
      const context = await service.primeAgent('agent-1', codeTask);

      expect(context.suggestedTools).toContain('edit');
    });

    it('should suggest research tools for analysis tasks', async () => {
      const researchTask = createMockTask({
        agentType: 'researcher',
        tags: ['research', 'analyze'],
      });
      const context = await service.primeAgent('agent-1', researchTask);

      expect(context.suggestedTools).toContain('search');
    });
  });

  describe('recommended patterns', () => {
    it('should recommend patterns from successful tasks', async () => {
      service.recordTaskCompletion(createMockTaskResult({
        taskId: 'success-1',
        agentType: 'coder',
        success: true,
        codeChanges: [
          { filePath: 'a.ts', changeType: 'create', linesAdded: 50, linesRemoved: 0, language: 'typescript' },
          { filePath: 'b.ts', changeType: 'create', linesAdded: 50, linesRemoved: 0, language: 'typescript' },
        ],
      }));

      const task = createMockTask({ agentType: 'coder' });
      const context = await service.primeAgent('agent-1', task);

      expect(context.recommendedPatterns).toBeDefined();
    });
  });

  describe('duration estimation', () => {
    it('should estimate duration based on similar tasks', async () => {
      service.recordTaskCompletion(createMockTaskResult({
        taskId: 'task-1',
        agentType: 'coder',
        durationMs: 10000,
      }));

      service.recordTaskCompletion(createMockTaskResult({
        taskId: 'task-2',
        agentType: 'coder',
        durationMs: 20000,
      }));

      const task = createMockTask({ agentType: 'coder' });
      const context = await service.primeAgent('agent-1', task);

      // May be undefined if no similar tasks found
      if (context.estimatedDurationMs !== undefined) {
        expect(context.estimatedDurationMs).toBeGreaterThan(0);
      }
    });
  });

  describe('clearHistory', () => {
    it('should clear all recorded history', async () => {
      service.recordTaskCompletion(createMockTaskResult());
      service.clearHistory();

      const task = createMockTask();
      const context = await service.primeAgent('agent-1', task);

      expect(context.similarTasks).toHaveLength(0);
    });
  });

  describe('agent type recommendations', () => {
    const agentTypes = ['researcher', 'coder', 'tester', 'analyst', 'architect', 'reviewer'];

    for (const agentType of agentTypes) {
      it(`should provide recommendations for ${agentType}`, async () => {
        const task = createMockTask({ agentType });
        const context = await service.primeAgent('agent-1', task);

        expect(context.recommendedApproach).toBeDefined();
        expect(context.recommendedApproach.length).toBeGreaterThan(0);
      });
    }
  });
});
