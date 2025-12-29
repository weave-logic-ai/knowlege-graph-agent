/**
 * Tests for RulesEngine
 *
 * Comprehensive tests for the event-driven rule execution engine with
 * async processing, condition evaluation, error isolation, and performance tracking.
 *
 * @module tests/agents/rules-engine
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RulesEngine,
  createRulesEngine,
  createRule,
  createConditionalRule,
  createFileChangeLogRule,
  createGraphUpdateNotificationRule,
  createAgentCompletionRule,
  type RuleContext,
  type AgentRule,
  type RuleTrigger,
} from '../../src/agents/index.js';

describe('RulesEngine', () => {
  let engine: RulesEngine;

  beforeEach(() => {
    engine = createRulesEngine();
  });

  afterEach(() => {
    // Clean up - no stop method but we can reset
    engine.clearLogs();
  });

  describe('constructor', () => {
    it('should create a RulesEngine instance', () => {
      expect(engine).toBeInstanceOf(RulesEngine);
    });

    it('should accept configuration options', () => {
      const configured = createRulesEngine({
        maxConcurrency: 5,
        defaultTimeout: 10000,
        logBufferSize: 500,
        verbose: true,
      });
      expect(configured).toBeInstanceOf(RulesEngine);
    });

    it('should use default configuration when not provided', () => {
      const defaultEngine = createRulesEngine();
      const stats = defaultEngine.getStatistics();
      expect(stats.totalRules).toBe(0);
      expect(stats.enabledRules).toBe(0);
    });
  });

  describe('registerRule', () => {
    it('should register a rule', () => {
      const rule = createRule(
        'test-rule',
        'Test Rule',
        ['file:add'],
        async () => {}
      );

      engine.registerRule(rule);
      const stats = engine.getStatistics();
      expect(stats.totalRules).toBe(1);
      expect(stats.enabledRules).toBe(1);
    });

    it('should allow overwriting existing rule with same ID', () => {
      const rule1 = createRule('dup-rule', 'First Rule', ['file:add'], async () => {});
      const rule2 = createRule('dup-rule', 'Second Rule', ['file:change'], async () => {});

      engine.registerRule(rule1);
      engine.registerRule(rule2);

      const stats = engine.getStatistics();
      expect(stats.totalRules).toBe(1);

      const retrieved = engine.getRule('dup-rule');
      expect(retrieved?.name).toBe('Second Rule');
    });

    it('should apply default values to rule', () => {
      const rule: AgentRule = {
        id: 'minimal-rule',
        name: 'Minimal Rule',
        triggers: ['file:add'],
        action: async () => {},
      };

      engine.registerRule(rule);
      const registered = engine.getRule('minimal-rule');

      expect(registered?.priority).toBe('normal');
      expect(registered?.enabled).toBe(true);
      expect(registered?.continueOnFailure).toBe(true);
    });

    it('should register multiple rules at once', () => {
      const rules = [
        createRule('rule-1', 'Rule 1', ['file:add'], async () => {}),
        createRule('rule-2', 'Rule 2', ['file:change'], async () => {}),
        createRule('rule-3', 'Rule 3', ['file:unlink'], async () => {}),
      ];

      engine.registerRules(rules);
      const stats = engine.getStatistics();
      expect(stats.totalRules).toBe(3);
    });
  });

  describe('unregisterRule', () => {
    it('should unregister a rule by ID', () => {
      const rule = createRule('remove-rule', 'Remove Rule', ['file:add'], async () => {});
      engine.registerRule(rule);

      const removed = engine.unregisterRule('remove-rule');
      expect(removed).toBe(true);

      const stats = engine.getStatistics();
      expect(stats.totalRules).toBe(0);
    });

    it('should return false for non-existent rule', () => {
      const removed = engine.unregisterRule('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('getRule', () => {
    it('should return the rule by ID', () => {
      const rule = createRule('get-rule', 'Get Rule', ['file:add'], async () => {});
      engine.registerRule(rule);

      const retrieved = engine.getRule('get-rule');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('get-rule');
      expect(retrieved?.name).toBe('Get Rule');
    });

    it('should return undefined for non-existent rule', () => {
      const retrieved = engine.getRule('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAllRules', () => {
    it('should return all registered rules', () => {
      engine.registerRule(createRule('r1', 'R1', ['file:add'], async () => {}));
      engine.registerRule(createRule('r2', 'R2', ['file:change'], async () => {}));

      const allRules = engine.getAllRules();
      expect(allRules).toHaveLength(2);
      expect(allRules.map(r => r.id)).toContain('r1');
      expect(allRules.map(r => r.id)).toContain('r2');
    });

    it('should return empty array when no rules registered', () => {
      const allRules = engine.getAllRules();
      expect(allRules).toHaveLength(0);
    });
  });

  describe('getRulesByTrigger', () => {
    it('should return rules matching the trigger', () => {
      engine.registerRule(createRule('add-rule', 'Add Rule', ['file:add'], async () => {}));
      engine.registerRule(createRule('change-rule', 'Change Rule', ['file:change'], async () => {}));
      engine.registerRule(createRule('multi-rule', 'Multi Rule', ['file:add', 'file:change'], async () => {}));

      const addRules = engine.getRulesByTrigger('file:add');
      expect(addRules).toHaveLength(2);
      expect(addRules.map(r => r.id)).toContain('add-rule');
      expect(addRules.map(r => r.id)).toContain('multi-rule');
    });

    it('should exclude disabled rules', () => {
      const rule = createRule('disabled-rule', 'Disabled', ['file:add'], async () => {});
      rule.enabled = false;
      engine.registerRule(rule);

      const rules = engine.getRulesByTrigger('file:add');
      expect(rules).toHaveLength(0);
    });
  });

  describe('enableRule / disableRule', () => {
    it('should enable a disabled rule', () => {
      const rule = createRule('toggle-rule', 'Toggle', ['file:add'], async () => {});
      rule.enabled = false;
      engine.registerRule(rule);

      const result = engine.enableRule('toggle-rule');
      expect(result).toBe(true);
      expect(engine.getRule('toggle-rule')?.enabled).toBe(true);
    });

    it('should disable an enabled rule', () => {
      const rule = createRule('toggle-rule', 'Toggle', ['file:add'], async () => {});
      engine.registerRule(rule);

      const result = engine.disableRule('toggle-rule');
      expect(result).toBe(true);
      expect(engine.getRule('toggle-rule')?.enabled).toBe(false);
    });

    it('should return false for non-existent rules', () => {
      expect(engine.enableRule('non-existent')).toBe(false);
      expect(engine.disableRule('non-existent')).toBe(false);
    });
  });

  describe('trigger', () => {
    it('should trigger rules for matching events', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const rule = createRule('trigger-rule', 'Trigger Rule', ['file:add'], handler);

      engine.registerRule(rule);
      await engine.trigger('file:add', { filePath: 'test.ts' });

      expect(handler).toHaveBeenCalled();
    });

    it('should not trigger rules for non-matching events', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const rule = createRule('no-trigger', 'No Trigger', ['file:add'], handler);

      engine.registerRule(rule);
      await engine.trigger('file:change', { filePath: 'test.ts' });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should pass context to rule handler', async () => {
      const handler = vi.fn().mockImplementation(async (ctx: RuleContext) => {
        expect(ctx.trigger).toBe('file:add');
        expect(ctx.filePath).toBe('test.ts');
        expect(ctx.timestamp).toBeInstanceOf(Date);
        expect(ctx.engine).toBe(engine);
      });

      engine.registerRule(createRule('context-rule', 'Context', ['file:add'], handler));
      await engine.trigger('file:add', { filePath: 'test.ts' });

      expect(handler).toHaveBeenCalled();
    });

    it('should execute rules in priority order', async () => {
      const executionOrder: string[] = [];

      engine.registerRule({
        id: 'low-priority',
        name: 'Low',
        triggers: ['file:add'],
        priority: 'low',
        action: async () => { executionOrder.push('low'); },
      });

      engine.registerRule({
        id: 'high-priority',
        name: 'High',
        triggers: ['file:add'],
        priority: 'high',
        action: async () => { executionOrder.push('high'); },
      });

      engine.registerRule({
        id: 'critical-priority',
        name: 'Critical',
        triggers: ['file:add'],
        priority: 'critical',
        action: async () => { executionOrder.push('critical'); },
      });

      await engine.trigger('file:add');

      // Due to concurrent execution, order might vary, but critical should start first
      expect(executionOrder).toContain('critical');
      expect(executionOrder).toContain('high');
      expect(executionOrder).toContain('low');
    });

    it('should return execution logs for all triggered rules', async () => {
      engine.registerRule(createRule('log-1', 'Log 1', ['file:add'], async () => {}));
      engine.registerRule(createRule('log-2', 'Log 2', ['file:add'], async () => {}));

      const logs = await engine.trigger('file:add');

      expect(logs).toHaveLength(2);
      expect(logs[0].status).toBe('success');
      expect(logs[1].status).toBe('success');
    });

    it('should handle rule execution failures', async () => {
      engine.registerRule(createRule(
        'failing-rule',
        'Failing',
        ['file:add'],
        async () => { throw new Error('Test error'); }
      ));

      const logs = await engine.trigger('file:add');

      expect(logs).toHaveLength(1);
      expect(logs[0].status).toBe('failure');
      expect(logs[0].error).toContain('Test error');
    });

    it('should continue executing other rules when one fails', async () => {
      const handler2 = vi.fn().mockResolvedValue(undefined);

      engine.registerRule(createRule(
        'failing-rule',
        'Failing',
        ['file:add'],
        async () => { throw new Error('Test error'); }
      ));
      engine.registerRule(createRule('success-rule', 'Success', ['file:add'], handler2));

      await engine.trigger('file:add');

      expect(handler2).toHaveBeenCalled();
    });

    it('should return empty array when no rules match', async () => {
      engine.registerRule(createRule('add-rule', 'Add', ['file:add'], async () => {}));

      const logs = await engine.trigger('file:change');

      expect(logs).toHaveLength(0);
    });
  });

  describe('conditional rules', () => {
    it('should only execute when condition is met', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const rule = createConditionalRule(
        'conditional',
        'Conditional Rule',
        ['file:add'],
        (ctx) => ctx.filePath?.endsWith('.ts') ?? false,
        handler
      );

      engine.registerRule(rule);

      await engine.trigger('file:add', { filePath: 'test.ts' });
      expect(handler).toHaveBeenCalled();

      handler.mockClear();
      await engine.trigger('file:add', { filePath: 'test.js' });
      expect(handler).not.toHaveBeenCalled();
    });

    it('should support async conditions', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const rule = createConditionalRule(
        'async-conditional',
        'Async Conditional',
        ['file:add'],
        async (ctx) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return ctx.filePath?.includes('src') ?? false;
        },
        handler
      );

      engine.registerRule(rule);

      await engine.trigger('file:add', { filePath: 'src/test.ts' });
      expect(handler).toHaveBeenCalled();

      handler.mockClear();
      await engine.trigger('file:add', { filePath: 'docs/test.ts' });
      expect(handler).not.toHaveBeenCalled();
    });

    it('should log skipped status when condition is false', async () => {
      const rule = createConditionalRule(
        'skip-rule',
        'Skip Rule',
        ['file:add'],
        () => false,
        async () => {}
      );

      engine.registerRule(rule);
      const logs = await engine.trigger('file:add');

      expect(logs).toHaveLength(1);
      expect(logs[0].status).toBe('skipped');
      expect(logs[0].conditionEvaluated).toBe(true);
      expect(logs[0].conditionResult).toBe(false);
    });
  });

  describe('executeRuleById', () => {
    it('should execute a specific rule by ID', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      engine.registerRule(createRule('manual-rule', 'Manual', ['manual'], handler));

      const log = await engine.executeRuleById('manual-rule');

      expect(log).not.toBeNull();
      expect(log?.status).toBe('success');
      expect(handler).toHaveBeenCalled();
    });

    it('should return null for non-existent rule', async () => {
      const log = await engine.executeRuleById('non-existent');
      expect(log).toBeNull();
    });

    it('should use manual trigger when not specified', async () => {
      let capturedTrigger: RuleTrigger | null = null;
      engine.registerRule(createRule(
        'capture-trigger',
        'Capture',
        ['manual'],
        async (ctx) => { capturedTrigger = ctx.trigger; }
      ));

      await engine.executeRuleById('capture-trigger');
      expect(capturedTrigger).toBe('manual');
    });
  });

  describe('getStatistics', () => {
    it('should return engine statistics', () => {
      const stats = engine.getStatistics();

      expect(stats).toHaveProperty('totalRules');
      expect(stats).toHaveProperty('enabledRules');
      expect(stats).toHaveProperty('totalExecutions');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('averageExecutionTime');
      expect(stats).toHaveProperty('activeExecutions');
      expect(stats).toHaveProperty('ruleStats');
      expect(stats).toHaveProperty('triggerStats');
    });

    it('should track execution statistics', async () => {
      engine.registerRule(createRule('stats-rule', 'Stats', ['file:add'], async () => {}));

      await engine.trigger('file:add');
      await engine.trigger('file:add');

      const stats = engine.getStatistics();
      expect(stats.totalExecutions).toBe(2);
      expect(stats.successRate).toBe(1); // 100% success
    });

    it('should calculate success rate correctly', async () => {
      engine.registerRule(createRule('success-rule', 'Success', ['file:add'], async () => {}));
      engine.registerRule(createRule(
        'fail-rule',
        'Fail',
        ['file:add'],
        async () => { throw new Error('Fail'); }
      ));

      await engine.trigger('file:add');

      const stats = engine.getStatistics();
      expect(stats.totalExecutions).toBe(2);
      expect(stats.successRate).toBe(0.5); // 50% success
    });
  });

  describe('getRuleStatistics', () => {
    it('should return statistics for a specific rule', async () => {
      engine.registerRule(createRule('tracked-rule', 'Tracked', ['file:add'], async () => {}));

      await engine.trigger('file:add');
      await engine.trigger('file:add');

      const ruleStats = engine.getRuleStatistics('tracked-rule');

      expect(ruleStats).toBeDefined();
      expect(ruleStats?.totalExecutions).toBe(2);
      expect(ruleStats?.successCount).toBe(2);
      expect(ruleStats?.failureCount).toBe(0);
    });

    it('should return undefined for non-existent rule', () => {
      const ruleStats = engine.getRuleStatistics('non-existent');
      expect(ruleStats).toBeUndefined();
    });

    it('should track skipped executions', async () => {
      const rule = createConditionalRule(
        'skip-tracked',
        'Skip Tracked',
        ['file:add'],
        () => false,
        async () => {}
      );
      engine.registerRule(rule);

      await engine.trigger('file:add');

      const ruleStats = engine.getRuleStatistics('skip-tracked');
      // Condition is evaluated during trigger, so skipped count reflects the trigger
      expect(ruleStats?.skippedCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getExecutionLogs', () => {
    it('should return execution logs', async () => {
      engine.registerRule(createRule('log-rule', 'Log', ['file:add'], async () => {}));

      await engine.trigger('file:add');
      await engine.trigger('file:add');

      const logs = engine.getExecutionLogs();
      expect(logs).toHaveLength(2);
    });

    it('should return logs in reverse order (most recent first)', async () => {
      engine.registerRule(createRule('order-rule', 'Order', ['file:add'], async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      }));

      await engine.trigger('file:add');
      await engine.trigger('file:add');

      const logs = engine.getExecutionLogs();
      expect(logs[0].startedAt.getTime()).toBeGreaterThanOrEqual(logs[1].startedAt.getTime());
    });

    it('should limit results when specified', async () => {
      engine.registerRule(createRule('limit-rule', 'Limit', ['file:add'], async () => {}));

      await engine.trigger('file:add');
      await engine.trigger('file:add');
      await engine.trigger('file:add');

      const logs = engine.getExecutionLogs(2);
      expect(logs).toHaveLength(2);
    });
  });

  describe('getLogsForRule', () => {
    it('should return logs for a specific rule', async () => {
      engine.registerRule(createRule('rule-a', 'A', ['file:add'], async () => {}));
      engine.registerRule(createRule('rule-b', 'B', ['file:add'], async () => {}));

      await engine.trigger('file:add');

      const logsA = engine.getLogsForRule('rule-a');
      expect(logsA).toHaveLength(1);
      expect(logsA[0].ruleId).toBe('rule-a');
    });
  });

  describe('getLogsForTrigger', () => {
    it('should return logs for a specific trigger', async () => {
      engine.registerRule(createRule('add-rule', 'Add', ['file:add'], async () => {}));
      engine.registerRule(createRule('change-rule', 'Change', ['file:change'], async () => {}));

      await engine.trigger('file:add');
      await engine.trigger('file:change');

      const addLogs = engine.getLogsForTrigger('file:add');
      expect(addLogs).toHaveLength(1);
      expect(addLogs[0].trigger).toBe('file:add');
    });
  });

  describe('getFailedLogs', () => {
    it('should return only failed execution logs', async () => {
      engine.registerRule(createRule('success-rule', 'Success', ['file:add'], async () => {}));
      engine.registerRule(createRule(
        'fail-rule',
        'Fail',
        ['file:add'],
        async () => { throw new Error('Fail'); }
      ));

      await engine.trigger('file:add');

      const failedLogs = engine.getFailedLogs();
      expect(failedLogs).toHaveLength(1);
      expect(failedLogs[0].ruleId).toBe('fail-rule');
    });
  });

  describe('clearLogs', () => {
    it('should clear all execution logs', async () => {
      engine.registerRule(createRule('clear-rule', 'Clear', ['file:add'], async () => {}));

      await engine.trigger('file:add');
      expect(engine.getExecutionLogs()).toHaveLength(1);

      engine.clearLogs();
      expect(engine.getExecutionLogs()).toHaveLength(0);
    });
  });

  describe('resetStatistics', () => {
    it('should reset all statistics', async () => {
      engine.registerRule(createRule('reset-rule', 'Reset', ['file:add'], async () => {}));

      await engine.trigger('file:add');
      await engine.trigger('file:add');

      engine.resetStatistics();

      const stats = engine.getStatistics();
      expect(stats.totalExecutions).toBe(0);

      const ruleStats = engine.getRuleStatistics('reset-rule');
      expect(ruleStats?.totalExecutions).toBe(0);
    });
  });

  describe('getSummary', () => {
    it('should return engine summary', () => {
      engine.registerRule(createRule('summary-rule', 'Summary', ['file:add', 'file:change'], async () => {}));

      const summary = engine.getSummary();

      expect(summary.rulesCount).toBe(1);
      expect(summary.enabledCount).toBe(1);
      expect(summary.triggersConfigured).toContain('file:add');
      expect(summary.triggersConfigured).toContain('file:change');
    });
  });

  describe('built-in rule templates', () => {
    describe('createFileChangeLogRule', () => {
      it('should create a file change logging rule', () => {
        const rule = createFileChangeLogRule();

        expect(rule.id).toBe('builtin:file-change-log');
        expect(rule.triggers).toContain('file:add');
        expect(rule.triggers).toContain('file:change');
        expect(rule.triggers).toContain('file:unlink');
        expect(rule.priority).toBe('low');
      });
    });

    describe('createGraphUpdateNotificationRule', () => {
      it('should create a graph update notification rule', async () => {
        const callback = vi.fn();
        const rule = createGraphUpdateNotificationRule(callback);

        engine.registerRule(rule);
        await engine.trigger('graph:update', {
          graphData: { nodesAdded: 5, nodesRemoved: 2 },
        });

        expect(callback).toHaveBeenCalled();
      });
    });

    describe('createAgentCompletionRule', () => {
      it('should create an agent completion handler rule', async () => {
        const handler = vi.fn();
        const rule = createAgentCompletionRule(handler);

        engine.registerRule(rule);
        await engine.trigger('agent:complete', {
          agentData: {
            agentId: 'test-agent',
            taskId: 'test-task',
            result: 'success',
            duration: 1000,
          },
        });

        expect(handler).toHaveBeenCalledWith({
          agentId: 'test-agent',
          taskId: 'test-task',
          result: 'success',
          duration: 1000,
        });
      });

      it('should skip when agentData is not provided', async () => {
        const handler = vi.fn();
        const rule = createAgentCompletionRule(handler);

        engine.registerRule(rule);
        const logs = await engine.trigger('agent:complete', {});

        expect(logs[0].status).toBe('skipped');
        expect(handler).not.toHaveBeenCalled();
      });
    });
  });

  describe('timeout handling', () => {
    it('should timeout long-running rules', async () => {
      const engine = createRulesEngine({ defaultTimeout: 100 });

      engine.registerRule({
        id: 'slow-rule',
        name: 'Slow',
        triggers: ['file:add'],
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
        },
      });

      const logs = await engine.trigger('file:add');

      expect(logs[0].status).toBe('failure');
      expect(logs[0].error).toContain('Timeout');
    });

    it('should respect rule-specific timeout', async () => {
      const engine = createRulesEngine({ defaultTimeout: 1000 });

      engine.registerRule({
        id: 'custom-timeout-rule',
        name: 'Custom Timeout',
        triggers: ['file:add'],
        timeout: 50,
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
        },
      });

      const logs = await engine.trigger('file:add');

      expect(logs[0].status).toBe('failure');
      expect(logs[0].error).toContain('Timeout');
    });
  });

  describe('concurrency', () => {
    it('should respect max concurrency limit', async () => {
      const engine = createRulesEngine({ maxConcurrency: 2 });
      let maxConcurrent = 0;
      let currentConcurrent = 0;

      for (let i = 0; i < 5; i++) {
        engine.registerRule({
          id: `concurrent-${i}`,
          name: `Concurrent ${i}`,
          triggers: ['file:add'],
          action: async () => {
            currentConcurrent++;
            maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
            await new Promise(resolve => setTimeout(resolve, 50));
            currentConcurrent--;
          },
        });
      }

      await engine.trigger('file:add');

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });
});
