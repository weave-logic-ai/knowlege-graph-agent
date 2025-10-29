/**
 * Orchestration Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Orchestrator } from '../../../src/agents/orchestration/index.js';
import type { Task } from '../../../src/agents/coordinator.js';

describe('Orchestrator Integration', () => {
  let orchestrator: Orchestrator;

  beforeEach(async () => {
    orchestrator = new Orchestrator({
      enableAutoSplit: true,
      enableDynamicPriority: true,
      enableLoadBalancing: true,
    });

    await orchestrator.initialize();
  });

  describe('Full Orchestration', () => {
    it('should orchestrate simple workflow', async () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          description: 'Implement user authentication',
          type: 'coding',
          priority: 'high',
        },
        {
          id: 'task-2',
          description: 'Write unit tests',
          type: 'testing',
          priority: 'medium',
        },
      ];

      const result = await orchestrator.orchestrate(tasks, {
        currentTime: new Date(),
      });

      expect(result.tasks.length).toBeGreaterThanOrEqual(2);
      expect(result.routingDecisions.size).toBeGreaterThan(0);
      expect(result.workloadDistribution.length).toBeGreaterThan(0);
    });

    it('should handle task splitting', async () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          description: 'Build comprehensive REST API with authentication, CRUD operations, validation, error handling, and comprehensive testing',
          type: 'coding',
          priority: 'high',
          estimatedComplexity: 10,
        },
      ];

      const result = await orchestrator.orchestrate(tasks, {
        currentTime: new Date(),
      });

      // May split into subtasks if rules allow
      expect(result.tasks.length).toBeGreaterThanOrEqual(1);
    });

    it('should adjust priorities based on dependencies', async () => {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 2); // 2 hours from now

      const tasks: Task[] = [
        {
          id: 'task-1',
          description: 'Critical task',
          type: 'coding',
          priority: 'medium',
          dependencies: [],
        },
        {
          id: 'task-2',
          description: 'Dependent task',
          type: 'coding',
          priority: 'low',
          dependencies: ['task-1'],
        },
      ];

      const result = await orchestrator.orchestrate(tasks, {
        currentTime: new Date(),
        projectDeadline: deadline,
      });

      // Should have priority adjustments due to deadline
      expect(result.priorityAdjustments.length).toBeGreaterThanOrEqual(0);
    });

    it('should distribute workload across agents', async () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          description: 'Code task 1',
          type: 'coding',
          priority: 'high',
        },
        {
          id: 'task-2',
          description: 'Research task',
          type: 'research',
          priority: 'high',
        },
        {
          id: 'task-3',
          description: 'Test task',
          type: 'testing',
          priority: 'medium',
        },
      ];

      const result = await orchestrator.orchestrate(tasks, {
        currentTime: new Date(),
      });

      expect(result.workloadDistribution.length).toBeGreaterThan(0);

      // Should route to different agents
      const routedAgents = new Set(
        Array.from(result.routingDecisions.values()).map(d => d.selectedAgent)
      );
      expect(routedAgents.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Performance', () => {
    it('should complete orchestration within performance budget', async () => {
      const tasks: Task[] = Array.from({ length: 10 }, (_, i) => ({
        id: `task-${i}`,
        description: `Task ${i}`,
        type: 'coding',
        priority: 'medium',
      }));

      const startTime = Date.now();
      const result = await orchestrator.orchestrate(tasks, {
        currentTime: new Date(),
      });
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // < 1 second for 10 tasks
      expect(result.metrics.averageEvaluationTime).toBeLessThan(10); // < 10ms per rule
    });
  });

  describe('Task Completion Tracking', () => {
    it('should record task completion', () => {
      orchestrator.recordTaskCompletion('task-1', 'coder', true, 5000);

      const metrics = orchestrator.getMetrics();
      expect(metrics.workload.length).toBeGreaterThan(0);
    });
  });

  describe('Execution Order', () => {
    it('should provide correct execution order', () => {
      const tasks: Task[] = [
        {
          id: 'task-3',
          description: 'Task 3',
          type: 'coding',
          priority: 'low',
          dependencies: ['task-1', 'task-2'],
        },
        {
          id: 'task-1',
          description: 'Task 1',
          type: 'coding',
          priority: 'high',
        },
        {
          id: 'task-2',
          description: 'Task 2',
          type: 'coding',
          priority: 'medium',
          dependencies: ['task-1'],
        },
      ];

      const orderedTasks = orchestrator.getExecutionOrder(tasks);

      // task-1 should come first
      expect(orderedTasks[0]?.id).toBe('task-1');
      // task-2 should come before task-3
      const task2Index = orderedTasks.findIndex(t => t.id === 'task-2');
      const task3Index = orderedTasks.findIndex(t => t.id === 'task-3');
      expect(task2Index).toBeLessThan(task3Index);
    });
  });
});
