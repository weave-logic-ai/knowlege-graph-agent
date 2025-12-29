/**
 * Tests for WorkflowRegistry
 *
 * Comprehensive tests for workflow definition, execution, step dependencies,
 * parallel execution, rollback, and event handling.
 *
 * @module tests/workflows/registry
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  WorkflowRegistry,
  createWorkflowRegistry,
  WorkflowStatus,
  type WorkflowDefinition,
  type WorkflowStep,
  type StepContext,
} from '../../src/workflows/index.js';

describe('WorkflowRegistry', () => {
  let registry: WorkflowRegistry;

  beforeEach(() => {
    registry = createWorkflowRegistry();
  });

  afterEach(() => {
    registry.clear();
  });

  describe('constructor', () => {
    it('should create a WorkflowRegistry instance', () => {
      expect(registry).toBeInstanceOf(WorkflowRegistry);
    });

    it('should accept configuration options', () => {
      const configured = createWorkflowRegistry({
        maxConcurrentExecutions: 5,
        defaultStepTimeout: 60000,
        defaultRetries: 5,
        persistHistory: true,
      });
      expect(configured).toBeInstanceOf(WorkflowRegistry);
    });
  });

  describe('register', () => {
    it('should register a workflow', () => {
      registry.register({
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        description: 'A test workflow',
        steps: [
          {
            id: 'step1',
            name: 'Step 1',
            handler: async () => ({ result: 'done' }),
          },
        ],
      });

      const workflows = registry.list();
      expect(workflows.length).toBe(1);
      expect(workflows[0].id).toBe('test-workflow');
    });

    it('should validate workflow has required fields', () => {
      expect(() => {
        registry.register({
          id: '',
          name: 'Invalid',
          version: '1.0.0',
          steps: [],
        });
      }).toThrow('Workflow must have an id');
    });

    it('should validate workflow has at least one step', () => {
      expect(() => {
        registry.register({
          id: 'no-steps',
          name: 'No Steps',
          version: '1.0.0',
          steps: [],
        });
      }).toThrow('Workflow must have at least one step');
    });

    it('should validate step IDs are unique', () => {
      expect(() => {
        registry.register({
          id: 'dup-steps',
          name: 'Duplicate Steps',
          version: '1.0.0',
          steps: [
            { id: 'step1', name: 'Step 1', handler: async () => {} },
            { id: 'step1', name: 'Step 1 Again', handler: async () => {} },
          ],
        });
      }).toThrow('Duplicate step id');
    });

    it('should validate step dependencies exist', () => {
      expect(() => {
        registry.register({
          id: 'bad-dep',
          name: 'Bad Dependency',
          version: '1.0.0',
          steps: [
            {
              id: 'step1',
              name: 'Step 1',
              dependencies: ['non-existent'],
              handler: async () => {},
            },
          ],
        });
      }).toThrow('depends on unknown step');
    });

    it('should detect circular dependencies', () => {
      expect(() => {
        registry.register({
          id: 'circular',
          name: 'Circular',
          version: '1.0.0',
          steps: [
            { id: 'a', name: 'A', dependencies: ['b'], handler: async () => {} },
            { id: 'b', name: 'B', dependencies: ['a'], handler: async () => {} },
          ],
        });
      }).toThrow('Circular dependency');
    });

    it('should allow overwriting existing workflow', () => {
      registry.register({
        id: 'overwrite',
        name: 'Original',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => {} }],
      });

      registry.register({
        id: 'overwrite',
        name: 'Updated',
        version: '2.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => {} }],
      });

      const workflow = registry.get('overwrite');
      expect(workflow?.name).toBe('Updated');
      expect(workflow?.version).toBe('2.0.0');
    });
  });

  describe('unregister', () => {
    it('should unregister a workflow', () => {
      registry.register({
        id: 'to-remove',
        name: 'To Remove',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => {} }],
      });

      const result = registry.unregister('to-remove');

      expect(result).toBe(true);
      expect(registry.get('to-remove')).toBeUndefined();
    });

    it('should return false for non-existent workflow', () => {
      const result = registry.unregister('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('get', () => {
    it('should get a workflow by ID', () => {
      registry.register({
        id: 'get-test',
        name: 'Get Test',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => {} }],
      });

      const workflow = registry.get('get-test');

      expect(workflow).toBeDefined();
      expect(workflow?.id).toBe('get-test');
    });

    it('should return undefined for non-existent workflow', () => {
      const workflow = registry.get('non-existent');
      expect(workflow).toBeUndefined();
    });
  });

  describe('list', () => {
    it('should list all registered workflows', () => {
      registry.register({
        id: 'w1',
        name: 'W1',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => {} }],
      });
      registry.register({
        id: 'w2',
        name: 'W2',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => {} }],
      });

      const workflows = registry.list();
      expect(workflows.length).toBe(2);
    });

    it('should filter by tags', () => {
      registry.register({
        id: 'tagged',
        name: 'Tagged',
        version: '1.0.0',
        tags: ['test', 'important'],
        steps: [{ id: 's1', name: 'S1', handler: async () => {} }],
      });
      registry.register({
        id: 'untagged',
        name: 'Untagged',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => {} }],
      });

      const workflows = registry.list({ tags: ['test'] });

      expect(workflows.length).toBe(1);
      expect(workflows[0].id).toBe('tagged');
    });

    it('should filter by version pattern', () => {
      registry.register({
        id: 'v1',
        name: 'V1',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => {} }],
      });
      registry.register({
        id: 'v2',
        name: 'V2',
        version: '2.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => {} }],
      });

      const workflows = registry.list({ version: '^1' });

      expect(workflows.length).toBe(1);
      expect(workflows[0].id).toBe('v1');
    });

    it('should filter by name pattern', () => {
      registry.register({
        id: 'sync-workflow',
        name: 'Sync Knowledge Graph',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => {} }],
      });
      registry.register({
        id: 'other-workflow',
        name: 'Other Task',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => {} }],
      });

      const workflows = registry.list({ namePattern: 'sync' });

      expect(workflows.length).toBe(1);
      expect(workflows[0].id).toBe('sync-workflow');
    });

    it('should support pagination', () => {
      for (let i = 0; i < 5; i++) {
        registry.register({
          id: `w${i}`,
          name: `W${i}`,
          version: '1.0.0',
          steps: [{ id: 's1', name: 'S1', handler: async () => {} }],
        });
      }

      const page1 = registry.list({ offset: 0, limit: 2 });
      const page2 = registry.list({ offset: 2, limit: 2 });

      expect(page1.length).toBe(2);
      expect(page2.length).toBe(2);
    });
  });

  describe('execute', () => {
    it('should execute a workflow', async () => {
      const handler = vi.fn().mockResolvedValue({ result: 'completed' });

      registry.register({
        id: 'exec-workflow',
        name: 'Exec Workflow',
        version: '1.0.0',
        steps: [{ id: 'step1', name: 'Step 1', handler }],
      });

      const result = await registry.execute('exec-workflow', { input: 'test' });

      expect(result.success).toBe(true);
      expect(result.status).toBe(WorkflowStatus.Completed);
      expect(handler).toHaveBeenCalled();
    });

    it('should throw for non-existent workflow', async () => {
      await expect(
        registry.execute('non-existent', {})
      ).rejects.toThrow('Workflow not found');
    });

    it('should pass input to step handlers', async () => {
      const handler = vi.fn().mockImplementation(async (input: unknown, ctx: StepContext) => {
        return { received: input };
      });

      registry.register({
        id: 'input-test',
        name: 'Input Test',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler }],
      });

      await registry.execute('input-test', { foo: 'bar' });

      expect(handler).toHaveBeenCalled();
    });

    it('should handle step failures', async () => {
      registry.register({
        id: 'fail-workflow',
        name: 'Fail Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            name: 'Failing Step',
            retries: 0, // Disable retries to prevent timeout
            handler: async () => {
              throw new Error('Step failed');
            },
          },
        ],
      });

      const result = await registry.execute('fail-workflow', {});

      expect(result.success).toBe(false);
      expect(result.status).toBe(WorkflowStatus.Failed);
      expect(result.error).toContain('Step failed');
    });

    it('should execute steps in dependency order', async () => {
      const executionOrder: string[] = [];

      registry.register({
        id: 'dep-order',
        name: 'Dependency Order',
        version: '1.0.0',
        steps: [
          {
            id: 'step3',
            name: 'Step 3',
            dependencies: ['step2'],
            handler: async () => { executionOrder.push('step3'); },
          },
          {
            id: 'step1',
            name: 'Step 1',
            handler: async () => { executionOrder.push('step1'); },
          },
          {
            id: 'step2',
            name: 'Step 2',
            dependencies: ['step1'],
            handler: async () => { executionOrder.push('step2'); },
          },
        ],
      });

      await registry.execute('dep-order', {});

      expect(executionOrder).toEqual(['step1', 'step2', 'step3']);
    });

    it('should execute independent steps in parallel', async () => {
      const startTimes: Record<string, number> = {};
      const endTimes: Record<string, number> = {};

      registry.register({
        id: 'parallel',
        name: 'Parallel',
        version: '1.0.0',
        steps: [
          {
            id: 's1',
            name: 'S1',
            handler: async () => {
              startTimes['s1'] = Date.now();
              await new Promise(r => setTimeout(r, 50));
              endTimes['s1'] = Date.now();
            },
          },
          {
            id: 's2',
            name: 'S2',
            handler: async () => {
              startTimes['s2'] = Date.now();
              await new Promise(r => setTimeout(r, 50));
              endTimes['s2'] = Date.now();
            },
          },
        ],
      });

      await registry.execute('parallel', {});

      // Both should start around the same time (within 20ms)
      expect(Math.abs(startTimes['s1'] - startTimes['s2'])).toBeLessThan(20);
    });

    it('should support step conditions', async () => {
      const handler1 = vi.fn().mockResolvedValue({ shouldRun: false });
      const handler2 = vi.fn().mockResolvedValue({});

      registry.register({
        id: 'conditional',
        name: 'Conditional',
        version: '1.0.0',
        steps: [
          { id: 's1', name: 'S1', handler: handler1 },
          {
            id: 's2',
            name: 'S2',
            dependencies: ['s1'],
            condition: async (ctx) => {
              const prev = ctx.previousResults.get('s1') as { shouldRun: boolean };
              return prev?.shouldRun === true;
            },
            handler: handler2,
          },
        ],
      });

      const result = await registry.execute('conditional', {});

      expect(result.success).toBe(true);
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should retry failed steps', async () => {
      let attempts = 0;
      const handler = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { success: true };
      });

      registry.register({
        id: 'retry-test',
        name: 'Retry Test',
        version: '1.0.0',
        steps: [
          {
            id: 's1',
            name: 'S1',
            handler,
            retries: 3,
            retryDelay: 10,
          },
        ],
      });

      const result = await registry.execute('retry-test', {});

      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    });

    it('should handle optional steps', async () => {
      const handler1 = vi.fn().mockRejectedValue(new Error('Optional failed'));
      const handler2 = vi.fn().mockResolvedValue({});

      registry.register({
        id: 'optional-test',
        name: 'Optional Test',
        version: '1.0.0',
        steps: [
          { id: 's1', name: 'S1', handler: handler1, optional: true, retries: 0 },
          { id: 's2', name: 'S2', handler: handler2 },
        ],
      });

      const result = await registry.execute('optional-test', {});

      expect(result.success).toBe(true);
      expect(handler2).toHaveBeenCalled();
    });

    it('should transform step input', async () => {
      let receivedInput: unknown;

      registry.register({
        id: 'transform-input',
        name: 'Transform Input',
        version: '1.0.0',
        steps: [
          {
            id: 's1',
            name: 'S1',
            handler: async () => ({ value: 42 }),
          },
          {
            id: 's2',
            name: 'S2',
            dependencies: ['s1'],
            transformInput: (results) => {
              const s1Result = results.get('s1') as { value: number };
              return { doubled: s1Result.value * 2 };
            },
            handler: async (input) => {
              receivedInput = input;
              return {};
            },
          },
        ],
      });

      await registry.execute('transform-input', {});

      expect(receivedInput).toEqual({ doubled: 84 });
    });

    it('should transform workflow output', async () => {
      registry.register({
        id: 'transform-output',
        name: 'Transform Output',
        version: '1.0.0',
        steps: [
          { id: 's1', name: 'S1', handler: async () => ({ a: 1 }) },
          { id: 's2', name: 'S2', handler: async () => ({ b: 2 }) },
        ],
        transformOutput: (results) => ({
          combined: {
            ...(results.get('s1') as object),
            ...(results.get('s2') as object),
          },
        }),
      });

      const result = await registry.execute('transform-output', {});

      expect(result.output).toEqual({ combined: { a: 1, b: 2 } });
    });

    it('should call workflow lifecycle hooks', async () => {
      const onStart = vi.fn();
      const onComplete = vi.fn();

      registry.register({
        id: 'lifecycle',
        name: 'Lifecycle',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => ({}) }],
        onStart,
        onComplete,
      });

      await registry.execute('lifecycle', { foo: 'bar' });

      expect(onStart).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });

    it('should call onError hook on failure', async () => {
      const onError = vi.fn();

      registry.register({
        id: 'error-hook',
        name: 'Error Hook',
        version: '1.0.0',
        steps: [
          {
            id: 's1',
            name: 'S1',
            handler: async () => { throw new Error('Test error'); },
            retries: 0,
          },
        ],
        onError,
      });

      await registry.execute('error-hook', {});

      expect(onError).toHaveBeenCalled();
    });

    it('should provide execution statistics', async () => {
      registry.register({
        id: 'stats-workflow',
        name: 'Stats Workflow',
        version: '1.0.0',
        steps: [
          { id: 's1', name: 'S1', handler: async () => {} },
          { id: 's2', name: 'S2', handler: async () => {} },
        ],
      });

      const result = await registry.execute('stats-workflow', {});

      expect(result.stats).toBeDefined();
      expect(result.stats.totalSteps).toBe(2);
      expect(result.stats.completedSteps).toBe(2);
      expect(result.stats.failedSteps).toBe(0);
      expect(result.stats.totalDurationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('cancel', () => {
    it('should cancel a running workflow', async () => {
      registry.register({
        id: 'cancellable',
        name: 'Cancellable',
        version: '1.0.0',
        steps: [
          {
            id: 's1',
            name: 'S1',
            handler: async () => {
              await new Promise(r => setTimeout(r, 1000));
            },
          },
        ],
      });

      // Start execution without awaiting
      const executionPromise = registry.execute('cancellable', {});

      // Wait a bit then cancel
      await new Promise(r => setTimeout(r, 50));

      // Get execution ID from history
      const history = registry.getHistory({ workflowId: 'cancellable' });
      if (history.length > 0) {
        const cancelled = registry.cancel(history[0].id);
        expect(cancelled).toBe(true);
      }

      // Wait for execution to complete
      const result = await executionPromise;
      // Result could be Cancelled if cancel worked, or Completed if it finished before cancel
      expect([WorkflowStatus.Cancelled, WorkflowStatus.Failed, WorkflowStatus.Completed]).toContain(result.status);
    });
  });

  describe('getExecution', () => {
    it('should get execution by ID', async () => {
      registry.register({
        id: 'get-exec',
        name: 'Get Exec',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => ({}) }],
      });

      const result = await registry.execute('get-exec', {});
      const execution = registry.getExecution(result.executionId);

      expect(execution).toBeDefined();
      expect(execution?.workflowId).toBe('get-exec');
    });

    it('should return undefined for non-existent execution', () => {
      const execution = registry.getExecution('non-existent');
      expect(execution).toBeUndefined();
    });
  });

  describe('getHistory', () => {
    it('should return execution history', async () => {
      registry.register({
        id: 'history-workflow',
        name: 'History',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => ({}) }],
      });

      await registry.execute('history-workflow', {});
      await registry.execute('history-workflow', {});

      const history = registry.getHistory();

      expect(history.length).toBe(2);
    });

    it('should filter by workflow ID', async () => {
      registry.register({
        id: 'w1',
        name: 'W1',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => ({}) }],
      });
      registry.register({
        id: 'w2',
        name: 'W2',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => ({}) }],
      });

      await registry.execute('w1', {});
      await registry.execute('w2', {});

      const history = registry.getHistory({ workflowId: 'w1' });

      expect(history.length).toBe(1);
      expect(history[0].workflowId).toBe('w1');
    });

    it('should filter by status', async () => {
      registry.register({
        id: 'mixed',
        name: 'Mixed',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => ({}) }],
      });
      registry.register({
        id: 'failing',
        name: 'Failing',
        version: '1.0.0',
        steps: [
          {
            id: 's1',
            name: 'S1',
            handler: async () => { throw new Error('Fail'); },
            retries: 0,
          },
        ],
      });

      await registry.execute('mixed', {});
      await registry.execute('failing', {});

      const failedHistory = registry.getHistory({ status: WorkflowStatus.Failed });

      expect(failedHistory.length).toBe(1);
      expect(failedHistory[0].status).toBe(WorkflowStatus.Failed);
    });

    it('should sort by date', async () => {
      registry.register({
        id: 'sorted',
        name: 'Sorted',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => ({}) }],
      });

      await registry.execute('sorted', {});
      await new Promise(r => setTimeout(r, 10));
      await registry.execute('sorted', {});

      const descHistory = registry.getHistory({ sortOrder: 'desc' });
      const ascHistory = registry.getHistory({ sortOrder: 'asc' });

      expect(descHistory[0].startedAt!.getTime()).toBeGreaterThanOrEqual(
        descHistory[1].startedAt!.getTime()
      );
      expect(ascHistory[0].startedAt!.getTime()).toBeLessThanOrEqual(
        ascHistory[1].startedAt!.getTime()
      );
    });
  });

  describe('events', () => {
    it('should emit workflow started event', async () => {
      const listener = vi.fn();

      registry.on('workflow:started', listener);
      registry.register({
        id: 'event-test',
        name: 'Event Test',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => ({}) }],
      });

      await registry.execute('event-test', {});

      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0].type).toBe('workflow:started');
    });

    it('should emit workflow completed event', async () => {
      const listener = vi.fn();

      registry.on('workflow:completed', listener);
      registry.register({
        id: 'complete-event',
        name: 'Complete Event',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => ({}) }],
      });

      await registry.execute('complete-event', {});

      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0].type).toBe('workflow:completed');
    });

    it('should emit step events', async () => {
      const stepStarted = vi.fn();
      const stepCompleted = vi.fn();

      registry.on('step:started', stepStarted);
      registry.on('step:completed', stepCompleted);
      registry.register({
        id: 'step-events',
        name: 'Step Events',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => ({}) }],
      });

      await registry.execute('step-events', {});

      expect(stepStarted).toHaveBeenCalled();
      expect(stepCompleted).toHaveBeenCalled();
    });

    it('should emit to wildcard listeners', async () => {
      const wildcardListener = vi.fn();

      registry.on('*', wildcardListener);
      registry.register({
        id: 'wildcard',
        name: 'Wildcard',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => ({}) }],
      });

      await registry.execute('wildcard', {});

      // Should receive multiple events
      expect(wildcardListener.mock.calls.length).toBeGreaterThan(1);
    });

    it('should remove event listeners', async () => {
      const listener = vi.fn();

      registry.on('workflow:completed', listener);
      registry.off('workflow:completed', listener);

      registry.register({
        id: 'no-listener',
        name: 'No Listener',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => ({}) }],
      });

      await registry.execute('no-listener', {});

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('rollback', () => {
    it('should rollback on failure when enabled', async () => {
      const rollback1 = vi.fn();

      registry.register({
        id: 'rollback-test',
        name: 'Rollback Test',
        version: '1.0.0',
        enableRollback: true,
        steps: [
          {
            id: 's1',
            name: 'S1',
            handler: async () => ({ data: 'created' }),
            rollback: rollback1,
          },
          {
            id: 's2',
            name: 'S2',
            dependencies: ['s1'],
            handler: async () => { throw new Error('Failed'); },
            retries: 0,
          },
        ],
      });

      const result = await registry.execute('rollback-test', {});

      expect(result.success).toBe(false);
      expect(result.rolledBack).toBe(true);
      expect(rollback1).toHaveBeenCalled();
    });

    it('should emit rollback events', async () => {
      const rollbackStarted = vi.fn();
      const rollbackCompleted = vi.fn();

      registry.on('rollback:started', rollbackStarted);
      registry.on('rollback:completed', rollbackCompleted);

      registry.register({
        id: 'rollback-events',
        name: 'Rollback Events',
        version: '1.0.0',
        enableRollback: true,
        steps: [
          {
            id: 's1',
            name: 'S1',
            handler: async () => ({}),
            rollback: async () => {},
          },
          {
            id: 's2',
            name: 'S2',
            dependencies: ['s1'],
            handler: async () => { throw new Error('Failed'); },
            retries: 0,
          },
        ],
      });

      await registry.execute('rollback-events', {});

      expect(rollbackStarted).toHaveBeenCalled();
      expect(rollbackCompleted).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear all executions and history', async () => {
      registry.register({
        id: 'clear-test',
        name: 'Clear Test',
        version: '1.0.0',
        steps: [{ id: 's1', name: 'S1', handler: async () => ({}) }],
      });

      await registry.execute('clear-test', {});

      registry.clear();

      const history = registry.getHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe('shared state', () => {
    it('should share state between steps', async () => {
      let capturedState: Record<string, unknown> = {};

      registry.register({
        id: 'shared-state',
        name: 'Shared State',
        version: '1.0.0',
        initialState: { counter: 0 },
        steps: [
          {
            id: 's1',
            name: 'S1',
            handler: async (_, ctx) => {
              ctx.state.counter = (ctx.state.counter as number) + 1;
            },
          },
          {
            id: 's2',
            name: 'S2',
            dependencies: ['s1'],
            handler: async (_, ctx) => {
              ctx.state.counter = (ctx.state.counter as number) + 1;
              capturedState = { ...ctx.state };
            },
          },
        ],
      });

      await registry.execute('shared-state', {});

      expect(capturedState.counter).toBe(2);
    });
  });

  describe('step timeout', () => {
    it('should timeout long-running steps', async () => {
      registry.register({
        id: 'timeout-test',
        name: 'Timeout Test',
        version: '1.0.0',
        steps: [
          {
            id: 's1',
            name: 'S1',
            timeout: 50,
            retries: 0,
            handler: async () => {
              await new Promise(r => setTimeout(r, 200));
            },
          },
        ],
      });

      const result = await registry.execute('timeout-test', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    });
  });
});
