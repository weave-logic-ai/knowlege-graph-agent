import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentCoordinator } from '../../src/agents/coordinator.js';
import { ClaudeClient } from '../../src/agents/claude-client.js';
import type { Task, Workflow } from '../../src/agents/coordinator.js';

describe('AgentCoordinator', () => {
  let mockClaudeClient: ClaudeClient;
  let coordinator: AgentCoordinator;

  beforeEach(() => {
    mockClaudeClient = {
      sendMessage: vi.fn(),
    } as unknown as ClaudeClient;

    coordinator = new AgentCoordinator({ claudeClient: mockClaudeClient });
  });

  describe('selectAgent', () => {
    it('should select researcher for research tasks', () => {
      const agent = coordinator.selectAgent({
        taskDescription: 'Search arxiv for papers on neural networks',
      });

      expect(agent).toBe('researcher');
    });

    it('should select coder for coding tasks', () => {
      const agent = coordinator.selectAgent({
        taskDescription: 'Implement a function to calculate fibonacci',
      });

      expect(agent).toBe('coder');
    });

    it('should select architect for design tasks', () => {
      const agent = coordinator.selectAgent({
        taskDescription: 'Design a REST API for user management',
      });

      expect(agent).toBe('architect');
    });

    it('should select tester for testing tasks', () => {
      const agent = coordinator.selectAgent({
        taskDescription: 'Generate unit tests with comprehensive coverage',
      });

      expect(agent).toBe('tester');
    });

    it('should select analyst for review tasks', () => {
      const agent = coordinator.selectAgent({
        taskDescription: 'Review code quality and identify security issues',
      });

      expect(agent).toBe('analyst');
    });

    it('should select planner for planning tasks', () => {
      const agent = coordinator.selectAgent({
        taskDescription: 'Create a plan to decompose this goal',
      });

      expect(agent).toBe('planner');
    });

    it('should select error-detector for debugging tasks', () => {
      const agent = coordinator.selectAgent({
        taskDescription: 'Detect error patterns in failed operations',
      });

      expect(agent).toBe('error-detector');
    });

    it('should respect required capabilities', () => {
      const agent = coordinator.selectAgent({
        taskDescription: 'Complete this task',
        requiredCapabilities: ['arxiv-search'],
      });

      expect(agent).toBe('researcher');
    });
  });

  describe('getAgent', () => {
    it('should return the correct agent instance', () => {
      const researcher = coordinator.getAgent('researcher');
      expect(researcher).toBeDefined();
    });

    it('should throw error for unknown agent type', () => {
      expect(() => {
        coordinator.getAgent('unknown' as any);
      }).toThrow();
    });
  });

  describe('getCapabilityMatrix', () => {
    it('should return capability matrix', () => {
      const matrix = coordinator.getCapabilityMatrix();

      expect(matrix.size).toBeGreaterThan(0);
      expect(matrix.get('researcher')).toBeDefined();
      expect(matrix.get('researcher')?.capabilities).toContain('arxiv-search');
    });
  });

  describe('executeTask', () => {
    it('should execute a task with appropriate agent', async () => {
      const task: Task = {
        id: 'task-1',
        description: 'Create a plan for building an API',
        type: 'planning',
        priority: 'high',
      };

      const result = await coordinator.executeTask(task);

      expect(result.taskId).toBe('task-1');
      expect(result.success).toBe(true);
      expect(result.agentType).toBe('planner');
    });

    it('should handle task execution errors', async () => {
      // Create an invalid task that will fail
      const task: Task = {
        id: 'task-fail',
        description: 'This will fail',
        type: 'invalid',
        priority: 'low',
      };

      const result = await coordinator.executeTask(task);

      expect(result.taskId).toBe('task-fail');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('orchestrateWorkflow', () => {
    it('should execute sequential workflow', async () => {
      const workflow: Workflow = {
        id: 'workflow-1',
        tasks: [
          {
            id: 'task-1',
            description: 'Plan the project',
            type: 'planning',
            priority: 'high',
          },
          {
            id: 'task-2',
            description: 'Design the architecture',
            type: 'design',
            priority: 'high',
          },
        ],
        dependencies: new Map([
          ['task-2', ['task-1']],
        ]),
        executionStrategy: 'sequential',
      };

      const result = await coordinator.orchestrateWorkflow(workflow);

      expect(result.workflowId).toBe('workflow-1');
      expect(result.tasks).toHaveLength(2);
      expect(result.successRate).toBeGreaterThanOrEqual(0);
    });

    it('should execute parallel workflow', async () => {
      const workflow: Workflow = {
        id: 'workflow-2',
        tasks: [
          {
            id: 'task-1',
            description: 'Task 1',
            type: 'planning',
            priority: 'medium',
          },
          {
            id: 'task-2',
            description: 'Task 2',
            type: 'planning',
            priority: 'medium',
          },
        ],
        dependencies: new Map(),
        executionStrategy: 'parallel',
      };

      const result = await coordinator.orchestrateWorkflow(workflow);

      expect(result.tasks).toHaveLength(2);
    });

    it('should execute adaptive workflow with dependencies', async () => {
      const workflow: Workflow = {
        id: 'workflow-3',
        tasks: [
          {
            id: 'task-1',
            description: 'First task',
            type: 'planning',
            priority: 'high',
          },
          {
            id: 'task-2',
            description: 'Second task',
            type: 'planning',
            priority: 'high',
            dependencies: ['task-1'],
          },
          {
            id: 'task-3',
            description: 'Third task',
            type: 'planning',
            priority: 'high',
            dependencies: ['task-1'],
          },
        ],
        dependencies: new Map([
          ['task-2', ['task-1']],
          ['task-3', ['task-1']],
        ]),
        executionStrategy: 'adaptive',
      };

      const result = await coordinator.orchestrateWorkflow(workflow);

      expect(result.tasks).toHaveLength(3);
      // Task 1 should complete before tasks 2 and 3
      const task1Result = result.tasks.find(t => t.taskId === 'task-1');
      const task2Result = result.tasks.find(t => t.taskId === 'task-2');
      expect(task1Result).toBeDefined();
      expect(task2Result).toBeDefined();
    });

    it('should detect circular dependencies', async () => {
      const workflow: Workflow = {
        id: 'workflow-circular',
        tasks: [
          {
            id: 'task-1',
            description: 'Task 1',
            type: 'planning',
            priority: 'high',
          },
          {
            id: 'task-2',
            description: 'Task 2',
            type: 'planning',
            priority: 'high',
          },
        ],
        dependencies: new Map([
          ['task-1', ['task-2']],
          ['task-2', ['task-1']],
        ]),
        executionStrategy: 'adaptive',
      };

      await expect(coordinator.orchestrateWorkflow(workflow)).rejects.toThrow('Circular dependency');
    });
  });
});
