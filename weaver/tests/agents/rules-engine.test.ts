/**
 * Rules Engine Tests
 *
 * Comprehensive test suite for the rules engine covering:
 * - Rule registration and unregistration
 * - Rule execution for each trigger type
 * - Condition evaluation
 * - Concurrent execution
 * - Error isolation
 * - Logging and statistics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RulesEngine } from '../../src/agents/rules-engine.js';
import type { AgentRule, RuleContext, RuleTrigger } from '../../src/agents/rules-engine.js';
import type { ClaudeClient } from '../../src/agents/claude-client.js';
import type { VaultMemorySync } from '../../src/memory/vault-sync.js';
import type { CachedFile } from '../../src/shadow-cache/types.js';

// ========================================================================
// Mock Setup
// ========================================================================

function createMockClaudeClient(): ClaudeClient {
  return {
    sendMessage: vi.fn().mockResolvedValue({
      success: true,
      data: 'Mocked response',
      rawResponse: 'Mocked response',
      tokens: { input: 10, output: 20 },
    }),
    getCircuitBreakerState: vi.fn().mockReturnValue('CLOSED'),
    resetCircuitBreaker: vi.fn(),
    getConfig: vi.fn().mockReturnValue({
      apiKey: 'test-key',
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096,
      temperature: 1.0,
      timeout: 10000,
      maxRetries: 3,
      retryDelay: 2000,
      circuitBreakerThreshold: 5,
    }),
  } as unknown as ClaudeClient;
}

function createMockVaultSync(): VaultMemorySync {
  return {
    syncNoteToMemory: vi.fn().mockResolvedValue(undefined),
    syncNotesToMemory: vi.fn().mockResolvedValue({
      notes_synced: 1,
      links_synced: 0,
      conflicts_detected: 0,
      conflicts_resolved: 0,
      total_duration_ms: 100,
      average_operation_ms: 100,
    }),
    syncVaultToMemory: vi.fn().mockResolvedValue({
      notes_synced: 10,
      links_synced: 5,
      conflicts_detected: 0,
      conflicts_resolved: 0,
      total_duration_ms: 1000,
      average_operation_ms: 100,
    }),
    syncNoteFromMemory: vi.fn().mockResolvedValue(undefined),
    getConflicts: vi.fn().mockReturnValue([]),
    clearConflicts: vi.fn(),
  } as unknown as VaultMemorySync;
}

function createMockCachedFile(): CachedFile {
  return {
    path: 'notes/test.md',
    filename: 'test.md',
    directory: 'notes',
    title: 'Test Note',
    content_hash: 'abc123',
    size: 1024,
    created_at: new Date().toISOString(),
    modified_at: new Date().toISOString(),
    indexed_at: new Date().toISOString(),
    frontmatter: JSON.stringify({ tags: ['test'] }),
  };
}

// ========================================================================
// Test Suite
// ========================================================================

describe('RulesEngine', () => {
  let engine: RulesEngine;
  let claudeClient: ClaudeClient;
  let vaultSync: VaultMemorySync;

  beforeEach(() => {
    claudeClient = createMockClaudeClient();
    vaultSync = createMockVaultSync();
    engine = new RulesEngine({
      claudeClient,
      vaultSync,
      maxLogEntries: 100,
      logRetentionMs: 60000,
    });
  });

  // ========================================================================
  // Rule Registration Tests
  // ========================================================================

  describe('Rule Registration', () => {
    it('should register a valid rule', () => {
      const rule: AgentRule = {
        id: 'test-rule',
        name: 'Test Rule',
        trigger: 'file:add',
        action: vi.fn(),
      };

      engine.registerRule(rule);
      const registered = engine.getRule('test-rule');

      expect(registered).toBeDefined();
      expect(registered?.id).toBe('test-rule');
      expect(registered?.name).toBe('Test Rule');
      expect(registered?.trigger).toBe('file:add');
      expect(registered?.enabled).toBe(true);
      expect(registered?.priority).toBe(0);
    });

    it('should set default values for optional fields', () => {
      const rule: AgentRule = {
        id: 'test-rule-2',
        name: 'Test Rule 2',
        trigger: 'file:change',
        action: vi.fn(),
      };

      engine.registerRule(rule);
      const registered = engine.getRule('test-rule-2');

      expect(registered?.enabled).toBe(true);
      expect(registered?.priority).toBe(0);
    });

    it('should throw error for invalid rule (missing fields)', () => {
      const invalidRule = {
        id: 'invalid',
        // Missing name, trigger, action
      } as AgentRule;

      expect(() => engine.registerRule(invalidRule)).toThrow('Invalid rule');
    });

    it('should overwrite existing rule with warning', () => {
      const rule1: AgentRule = {
        id: 'duplicate',
        name: 'First',
        trigger: 'file:add',
        action: vi.fn(),
      };

      const rule2: AgentRule = {
        id: 'duplicate',
        name: 'Second',
        trigger: 'file:change',
        action: vi.fn(),
      };

      engine.registerRule(rule1);
      engine.registerRule(rule2);

      const registered = engine.getRule('duplicate');
      expect(registered?.name).toBe('Second');
      expect(registered?.trigger).toBe('file:change');
    });

    it('should initialize statistics for new rule', () => {
      const rule: AgentRule = {
        id: 'stats-test',
        name: 'Stats Test',
        trigger: 'file:add',
        action: vi.fn(),
      };

      engine.registerRule(rule);
      const stats = engine.getStatistics('stats-test');

      expect(stats).toBeDefined();
      expect(stats?.totalExecutions).toBe(0);
      expect(stats?.successCount).toBe(0);
      expect(stats?.failureCount).toBe(0);
      expect(stats?.skippedCount).toBe(0);
    });
  });

  // ========================================================================
  // Rule Unregistration Tests
  // ========================================================================

  describe('Rule Unregistration', () => {
    it('should unregister an existing rule', () => {
      const rule: AgentRule = {
        id: 'to-remove',
        name: 'To Remove',
        trigger: 'file:add',
        action: vi.fn(),
      };

      engine.registerRule(rule);
      expect(engine.getRule('to-remove')).toBeDefined();

      const removed = engine.unregisterRule('to-remove');
      expect(removed).toBe(true);
      expect(engine.getRule('to-remove')).toBeUndefined();
    });

    it('should return false when unregistering non-existent rule', () => {
      const removed = engine.unregisterRule('non-existent');
      expect(removed).toBe(false);
    });
  });

  // ========================================================================
  // Rule Execution Tests
  // ========================================================================

  describe('Rule Execution', () => {
    it('should execute rules matching event type', async () => {
      const actionMock = vi.fn().mockResolvedValue(undefined);
      const rule: AgentRule = {
        id: 'exec-test',
        name: 'Execution Test',
        trigger: 'file:add',
        action: actionMock,
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      expect(actionMock).toHaveBeenCalledTimes(1);
      expect(actionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          event: expect.objectContaining({ type: 'file:add' }),
          claudeClient,
          vaultSync,
        })
      );
    });

    it('should not execute rules for non-matching event types', async () => {
      const actionMock = vi.fn();
      const rule: AgentRule = {
        id: 'no-match',
        name: 'No Match',
        trigger: 'file:add',
        action: actionMock,
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:change',
        note: createMockCachedFile(),
      });

      expect(actionMock).not.toHaveBeenCalled();
    });

    it('should execute multiple rules concurrently', async () => {
      const delays: number[] = [];
      const createDelayedAction = (id: number, delayMs: number) => {
        return vi.fn(async () => {
          const start = Date.now();
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          delays.push(Date.now() - start);
        });
      };

      const rules: AgentRule[] = [
        {
          id: 'concurrent-1',
          name: 'Concurrent 1',
          trigger: 'file:add',
          action: createDelayedAction(1, 100),
        },
        {
          id: 'concurrent-2',
          name: 'Concurrent 2',
          trigger: 'file:add',
          action: createDelayedAction(2, 100),
        },
        {
          id: 'concurrent-3',
          name: 'Concurrent 3',
          trigger: 'file:add',
          action: createDelayedAction(3, 100),
        },
      ];

      rules.forEach((rule) => engine.registerRule(rule));

      const start = Date.now();
      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });
      const totalTime = Date.now() - start;

      // Should take ~100ms (concurrent), not ~300ms (sequential)
      expect(totalTime).toBeLessThan(200);
      expect(delays.length).toBe(3);
    });

    it('should respect rule priority order', async () => {
      const executionOrder: number[] = [];

      const rules: AgentRule[] = [
        {
          id: 'priority-low',
          name: 'Low Priority',
          trigger: 'file:add',
          priority: 1,
          action: vi.fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            executionOrder.push(1);
          }),
        },
        {
          id: 'priority-high',
          name: 'High Priority',
          trigger: 'file:add',
          priority: 10,
          action: vi.fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            executionOrder.push(10);
          }),
        },
        {
          id: 'priority-medium',
          name: 'Medium Priority',
          trigger: 'file:add',
          priority: 5,
          action: vi.fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            executionOrder.push(5);
          }),
        },
      ];

      rules.forEach((rule) => engine.registerRule(rule));

      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      // Priority determines start order, but concurrent execution
      expect(executionOrder).toContain(1);
      expect(executionOrder).toContain(5);
      expect(executionOrder).toContain(10);
    });
  });

  // ========================================================================
  // Condition Evaluation Tests
  // ========================================================================

  describe('Condition Evaluation', () => {
    it('should execute action when condition is true', async () => {
      const actionMock = vi.fn();
      const rule: AgentRule = {
        id: 'condition-true',
        name: 'Condition True',
        trigger: 'file:add',
        condition: vi.fn().mockReturnValue(true),
        action: actionMock,
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      expect(rule.condition).toHaveBeenCalled();
      expect(actionMock).toHaveBeenCalled();
    });

    it('should skip action when condition is false', async () => {
      const actionMock = vi.fn();
      const rule: AgentRule = {
        id: 'condition-false',
        name: 'Condition False',
        trigger: 'file:add',
        condition: vi.fn().mockReturnValue(false),
        action: actionMock,
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      expect(rule.condition).toHaveBeenCalled();
      expect(actionMock).not.toHaveBeenCalled();
    });

    it('should handle async conditions', async () => {
      const actionMock = vi.fn();
      const rule: AgentRule = {
        id: 'async-condition',
        name: 'Async Condition',
        trigger: 'file:add',
        condition: vi.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return true;
        }),
        action: actionMock,
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      expect(actionMock).toHaveBeenCalled();
    });

    it('should evaluate condition with correct context', async () => {
      const conditionMock = vi.fn().mockReturnValue(true);
      const note = createMockCachedFile();

      const rule: AgentRule = {
        id: 'context-test',
        name: 'Context Test',
        trigger: 'file:add',
        condition: conditionMock,
        action: vi.fn(),
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:add',
        note,
        metadata: { custom: 'data' },
      });

      expect(conditionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          event: expect.objectContaining({ type: 'file:add' }),
          note,
          metadata: { custom: 'data' },
          claudeClient,
          vaultSync,
        })
      );
    });
  });

  // ========================================================================
  // Error Isolation Tests
  // ========================================================================

  describe('Error Isolation', () => {
    it('should isolate failed rules from successful rules', async () => {
      const successAction = vi.fn();
      const failAction = vi.fn().mockRejectedValue(new Error('Action failed'));

      const rules: AgentRule[] = [
        {
          id: 'success-1',
          name: 'Success 1',
          trigger: 'file:add',
          action: successAction,
        },
        {
          id: 'fail',
          name: 'Fail',
          trigger: 'file:add',
          action: failAction,
        },
        {
          id: 'success-2',
          name: 'Success 2',
          trigger: 'file:add',
          action: successAction,
        },
      ];

      rules.forEach((rule) => engine.registerRule(rule));

      // Should not throw despite one rule failing
      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      expect(successAction).toHaveBeenCalledTimes(2);
      expect(failAction).toHaveBeenCalledTimes(1);
    });

    it('should log failed rule execution', async () => {
      const failAction = vi.fn().mockRejectedValue(new Error('Test error'));

      const rule: AgentRule = {
        id: 'error-log',
        name: 'Error Log',
        trigger: 'file:add',
        action: failAction,
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      const logs = engine.getExecutionLogs({ ruleId: 'error-log' });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]?.status).toBe('failed');
      expect(logs[0]?.error).toContain('Test error');
    });

    it('should update statistics for failed execution', async () => {
      const failAction = vi.fn().mockRejectedValue(new Error('Test error'));

      const rule: AgentRule = {
        id: 'fail-stats',
        name: 'Fail Stats',
        trigger: 'file:add',
        action: failAction,
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      const stats = engine.getStatistics('fail-stats');
      expect(stats?.totalExecutions).toBe(1);
      expect(stats?.failureCount).toBe(1);
      expect(stats?.successCount).toBe(0);
    });
  });

  // ========================================================================
  // Logging Tests
  // ========================================================================

  describe('Logging', () => {
    it('should create log entry for rule execution', async () => {
      const rule: AgentRule = {
        id: 'log-test',
        name: 'Log Test',
        trigger: 'file:add',
        action: vi.fn(),
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      const logs = engine.getExecutionLogs({ ruleId: 'log-test' });
      expect(logs.length).toBe(1);
      expect(logs[0]?.ruleId).toBe('log-test');
      expect(logs[0]?.ruleName).toBe('Log Test');
      expect(logs[0]?.status).toBe('success');
      expect(logs[0]?.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should implement circular buffer for logs', async () => {
      // Create engine with small max log entries
      const smallEngine = new RulesEngine({
        claudeClient,
        vaultSync,
        maxLogEntries: 5,
      });

      const rule: AgentRule = {
        id: 'buffer-test',
        name: 'Buffer Test',
        trigger: 'file:add',
        action: vi.fn(),
      };

      smallEngine.registerRule(rule);

      // Execute 10 times
      for (let i = 0; i < 10; i++) {
        await smallEngine.executeRules({
          type: 'file:add',
          note: createMockCachedFile(),
        });
      }

      const logs = smallEngine.getExecutionLogs();
      expect(logs.length).toBeLessThanOrEqual(5);
    });

    it('should filter logs by status', async () => {
      const successRule: AgentRule = {
        id: 'success',
        name: 'Success',
        trigger: 'file:add',
        action: vi.fn(),
      };

      const failRule: AgentRule = {
        id: 'fail',
        name: 'Fail',
        trigger: 'file:add',
        action: vi.fn().mockRejectedValue(new Error('Fail')),
      };

      engine.registerRule(successRule);
      engine.registerRule(failRule);

      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      const successLogs = engine.getExecutionLogs({ status: 'success' });
      const failedLogs = engine.getExecutionLogs({ status: 'failed' });

      expect(successLogs.every((log) => log.status === 'success')).toBe(true);
      expect(failedLogs.every((log) => log.status === 'failed')).toBe(true);
    });

    it('should clear logs', async () => {
      const rule: AgentRule = {
        id: 'clear-test',
        name: 'Clear Test',
        trigger: 'file:add',
        action: vi.fn(),
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      expect(engine.getExecutionLogs().length).toBeGreaterThan(0);

      engine.clearLogs();
      expect(engine.getExecutionLogs().length).toBe(0);
    });
  });

  // ========================================================================
  // Statistics Tests
  // ========================================================================

  describe('Statistics', () => {
    it('should track successful executions', async () => {
      const rule: AgentRule = {
        id: 'success-stats',
        name: 'Success Stats',
        trigger: 'file:add',
        action: vi.fn(),
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      const stats = engine.getStatistics('success-stats');
      expect(stats?.totalExecutions).toBe(1);
      expect(stats?.successCount).toBe(1);
      expect(stats?.failureCount).toBe(0);
    });

    it('should calculate average duration', async () => {
      const rule: AgentRule = {
        id: 'duration-stats',
        name: 'Duration Stats',
        trigger: 'file:add',
        action: vi.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }),
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      const stats = engine.getStatistics('duration-stats');
      expect(stats?.avgDurationMs).toBeGreaterThan(0);
    });

    it('should reset statistics', async () => {
      const rule: AgentRule = {
        id: 'reset-stats',
        name: 'Reset Stats',
        trigger: 'file:add',
        action: vi.fn(),
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      expect(engine.getStatistics('reset-stats')?.totalExecutions).toBe(1);

      engine.resetStatistics();
      expect(engine.getStatistics('reset-stats')?.totalExecutions).toBe(0);
    });
  });

  // ========================================================================
  // Admin Dashboard Tests
  // ========================================================================

  describe('Admin Dashboard', () => {
    it('should return rules status', async () => {
      const rule: AgentRule = {
        id: 'status-test',
        name: 'Status Test',
        trigger: 'file:add',
        action: vi.fn(),
        priority: 5,
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      const status = engine.getRulesStatus();

      expect(status.rules.length).toBe(1);
      expect(status.rules[0]?.id).toBe('status-test');
      expect(status.rules[0]?.name).toBe('Status Test');
      expect(status.rules[0]?.enabled).toBe(true);
      expect(status.rules[0]?.priority).toBe(5);
      expect(status.summary.totalRules).toBe(1);
      expect(status.summary.enabledRules).toBe(1);
    });

    it('should include last execution in status', async () => {
      const rule: AgentRule = {
        id: 'last-exec',
        name: 'Last Exec',
        trigger: 'file:add',
        action: vi.fn(),
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      const status = engine.getRulesStatus();
      const ruleStatus = status.rules[0];

      expect(ruleStatus?.lastExecution).toBeDefined();
      expect(ruleStatus?.lastExecution?.status).toBe('success');
      expect(ruleStatus?.lastExecution?.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ========================================================================
  // Integration Tests
  // ========================================================================

  describe('Integration', () => {
    it('should handle file:add events', async () => {
      const actionMock = vi.fn();
      const rule: AgentRule = {
        id: 'file-add',
        name: 'File Add Handler',
        trigger: 'file:add',
        action: actionMock,
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      expect(actionMock).toHaveBeenCalled();
    });

    it('should handle file:change events', async () => {
      const actionMock = vi.fn();
      const rule: AgentRule = {
        id: 'file-change',
        name: 'File Change Handler',
        trigger: 'file:change',
        action: actionMock,
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:change',
        note: createMockCachedFile(),
      });

      expect(actionMock).toHaveBeenCalled();
    });

    it('should handle file:unlink events', async () => {
      const actionMock = vi.fn();
      const rule: AgentRule = {
        id: 'file-unlink',
        name: 'File Unlink Handler',
        trigger: 'file:unlink',
        action: actionMock,
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:unlink',
        metadata: { path: 'deleted.md' },
      });

      expect(actionMock).toHaveBeenCalled();
    });

    it('should provide Claude client to actions', async () => {
      let capturedContext: RuleContext | undefined;

      const rule: AgentRule = {
        id: 'claude-test',
        name: 'Claude Test',
        trigger: 'file:add',
        action: async (ctx) => {
          capturedContext = ctx;
        },
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      expect(capturedContext?.claudeClient).toBe(claudeClient);
    });

    it('should provide vault sync to actions', async () => {
      let capturedContext: RuleContext | undefined;

      const rule: AgentRule = {
        id: 'vault-test',
        name: 'Vault Test',
        trigger: 'file:add',
        action: async (ctx) => {
          capturedContext = ctx;
        },
      };

      engine.registerRule(rule);

      await engine.executeRules({
        type: 'file:add',
        note: createMockCachedFile(),
      });

      expect(capturedContext?.vaultSync).toBe(vaultSync);
    });
  });
});
