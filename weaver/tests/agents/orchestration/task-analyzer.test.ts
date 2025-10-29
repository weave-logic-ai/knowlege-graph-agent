/**
 * Task Analyzer Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaskAnalyzer } from '../../../src/agents/orchestration/task-analyzer.js';
import type { Task } from '../../../src/agents/coordinator.js';

describe('TaskAnalyzer', () => {
  let analyzer: TaskAnalyzer;

  beforeEach(() => {
    analyzer = new TaskAnalyzer();
  });

  describe('Complexity Estimation', () => {
    it('should estimate complexity for simple task', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Fix bug in login form',
        type: 'coding',
        priority: 'medium',
      };

      const complexity = analyzer.estimateComplexity(task);
      expect(complexity.score).toBeGreaterThan(0);
      expect(complexity.canSplit).toBe(false);
    });

    it('should estimate complexity for complex task', () => {
      const task: Task = {
        id: 'task-2',
        description: 'Design and implement a comprehensive authentication system with JWT tokens, refresh tokens, role-based access control, and OAuth integration',
        type: 'coding',
        priority: 'high',
        requiredCapabilities: ['authentication', 'security', 'api-design'],
      };

      const complexity = analyzer.estimateComplexity(task);
      expect(complexity.score).toBeGreaterThan(7);
      expect(complexity.canSplit).toBe(true);
      expect(complexity.recommendedSubtasks).toBeGreaterThan(1);
    });

    it('should consider required capabilities in complexity', () => {
      const task: Task = {
        id: 'task-3',
        description: 'Simple task',
        type: 'coding',
        priority: 'low',
        requiredCapabilities: ['cap1', 'cap2', 'cap3', 'cap4'],
      };

      const complexity = analyzer.estimateComplexity(task);
      expect(complexity.factors.requiredCapabilities).toBe(8); // 4 capabilities * 2
    });
  });

  describe('Task Splitting', () => {
    it('should split complex task', () => {
      const task: Task = {
        id: 'task-4',
        description: 'Build complete REST API with authentication, CRUD operations, validation, and testing',
        type: 'coding',
        priority: 'high',
      };

      const subtasks = analyzer.splitTask(task, 3);
      expect(subtasks).toHaveLength(3);
      expect(subtasks[0]?.parentTaskId).toBe('task-4');
      expect(subtasks[0]?.splitIndex).toBe(0);
      expect(subtasks[0]?.totalSplits).toBe(3);
    });

    it('should not split simple task', () => {
      const task: Task = {
        id: 'task-5',
        description: 'Fix typo',
        type: 'coding',
        priority: 'low',
      };

      const subtasks = analyzer.splitTask(task);
      expect(subtasks).toHaveLength(0);
    });

    it('should split based on numbered list', () => {
      const task: Task = {
        id: 'task-6',
        description: '1. Design schema 2. Implement API 3. Write tests 4. Add documentation',
        type: 'coding',
        priority: 'high',
      };

      const subtasks = analyzer.splitTask(task, 4);
      expect(subtasks).toHaveLength(4);
      expect(subtasks[0]?.description).toContain('Design schema');
    });
  });

  describe('Dependency Analysis', () => {
    it('should build dependency graph', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          description: 'Task 1',
          type: 'coding',
          priority: 'high',
          dependencies: [],
        },
        {
          id: 'task-2',
          description: 'Task 2',
          type: 'coding',
          priority: 'high',
          dependencies: ['task-1'],
        },
        {
          id: 'task-3',
          description: 'Task 3',
          type: 'coding',
          priority: 'high',
          dependencies: ['task-1', 'task-2'],
        },
      ];

      const graph = analyzer.analyzeDependencies(tasks);

      expect(graph.size).toBe(3);
      expect(graph.get('task-1')?.level).toBe(0);
      expect(graph.get('task-2')?.level).toBe(1);
      expect(graph.get('task-3')?.level).toBe(2);
    });

    it('should identify critical path', () => {
      const tasks: Task[] = [
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
          priority: 'high',
          dependencies: ['task-1'],
        },
      ];

      const graph = analyzer.analyzeDependencies(tasks);
      const criticalTasks = analyzer.getCriticalPathTasks(tasks);

      expect(criticalTasks.length).toBeGreaterThan(0);
    });

    it('should get parallelizable tasks', () => {
      const tasks: Task[] = [
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
          priority: 'high',
        },
        {
          id: 'task-3',
          description: 'Task 3',
          type: 'coding',
          priority: 'high',
          dependencies: ['task-1', 'task-2'],
        },
      ];

      const parallelGroups = analyzer.getParallelizableTasks(tasks);

      expect(parallelGroups.length).toBeGreaterThan(0);
      expect(parallelGroups[0]).toHaveLength(2); // task-1 and task-2 can run in parallel
    });
  });
});
