/**
 * Rule Engine Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RuleEngine } from '../../../src/agents/orchestration/rule-engine.js';
import type { OrchestrationRule, RuleContext } from '../../../src/agents/orchestration/types.js';
import type { Task } from '../../../src/agents/coordinator.js';

describe('RuleEngine', () => {
  let engine: RuleEngine;

  beforeEach(() => {
    engine = new RuleEngine({ enableCaching: false });
  });

  describe('Rule Evaluation', () => {
    it('should evaluate simple condition', async () => {
      const rule: OrchestrationRule = {
        id: 'test-rule',
        condition: "task.priority === 'high'",
        action: 'route_to_agent',
        agent: 'coder',
        priority: 100,
      };

      engine.addRule(rule);

      const task: Task = {
        id: 'task-1',
        description: 'Test task',
        type: 'coding',
        priority: 'high',
      };

      const context: RuleContext = {
        task,
        agentWorkload: new Map(),
        availableAgents: ['coder'],
        currentTime: new Date(),
      };

      const results = await engine.evaluateTask(task, context);
      expect(results).toHaveLength(1);
      expect(results[0]?.matched).toBe(true);
      expect(results[0]?.agent).toBe('coder');
    });

    it('should handle complex conditions', async () => {
      const rule: OrchestrationRule = {
        id: 'complex-rule',
        condition: "task.description.includes('UI') && task.priority === 'high'",
        action: 'split_parallel',
        max_subtasks: 3,
        priority: 90,
      };

      engine.addRule(rule);

      const task: Task = {
        id: 'task-2',
        description: 'Build UI component',
        type: 'coding',
        priority: 'high',
      };

      const context: RuleContext = {
        task,
        agentWorkload: new Map(),
        availableAgents: ['coder'],
        currentTime: new Date(),
      };

      const results = await engine.evaluateTask(task, context);
      expect(results[0]?.matched).toBe(true);
      expect(results[0]?.action).toBe('split_parallel');
    });

    it('should evaluate rules in priority order', async () => {
      const rule1: OrchestrationRule = {
        id: 'low-priority',
        condition: 'true',
        action: 'route_to_agent',
        agent: 'researcher',
        priority: 50,
      };

      const rule2: OrchestrationRule = {
        id: 'high-priority',
        condition: 'true',
        action: 'route_to_agent',
        agent: 'architect',
        priority: 100,
      };

      engine.addRule(rule1);
      engine.addRule(rule2);

      const task: Task = {
        id: 'task-3',
        description: 'Test',
        type: 'coding',
        priority: 'medium',
      };

      const context: RuleContext = {
        task,
        agentWorkload: new Map(),
        availableAgents: ['researcher', 'architect'],
        currentTime: new Date(),
      };

      const results = await engine.evaluateTask(task, context);
      expect(results[0]?.ruleId).toBe('high-priority');
    });

    it('should respect evaluation timeout', async () => {
      const rule: OrchestrationRule = {
        id: 'timeout-rule',
        condition: 'while(true) {}', // Infinite loop
        action: 'route_to_agent',
        agent: 'coder',
        priority: 100,
      };

      engine.addRule(rule);

      const task: Task = {
        id: 'task-4',
        description: 'Test',
        type: 'coding',
        priority: 'medium',
      };

      const context: RuleContext = {
        task,
        agentWorkload: new Map(),
        availableAgents: ['coder'],
        currentTime: new Date(),
      };

      const results = await engine.evaluateTask(task, context);
      expect(results[0]?.matched).toBe(false);
      expect(results[0]?.error).toBeDefined();
    });
  });

  describe('Conflict Detection', () => {
    it('should detect conflicting agent assignments', async () => {
      const rule1: OrchestrationRule = {
        id: 'rule-1',
        condition: 'true',
        action: 'route_to_agent',
        agent: 'coder',
        priority: 100,
      };

      const rule2: OrchestrationRule = {
        id: 'rule-2',
        condition: 'true',
        action: 'route_to_agent',
        agent: 'researcher',
        priority: 90,
      };

      engine.addRule(rule1);
      engine.addRule(rule2);

      const task: Task = {
        id: 'task-5',
        description: 'Test',
        type: 'coding',
        priority: 'medium',
      };

      const context: RuleContext = {
        task,
        agentWorkload: new Map(),
        availableAgents: ['coder', 'researcher'],
        currentTime: new Date(),
      };

      const results = await engine.evaluateTask(task, context);

      // After conflict resolution, only highest priority should match
      const matchedResults = results.filter(r => r.matched);
      expect(matchedResults).toHaveLength(1);
      expect(matchedResults[0]?.agent).toBe('coder');
    });
  });

  describe('Performance', () => {
    it('should evaluate rules within performance threshold', async () => {
      const rule: OrchestrationRule = {
        id: 'perf-rule',
        condition: "task.description.includes('test')",
        action: 'route_to_agent',
        agent: 'coder',
        priority: 100,
      };

      engine.addRule(rule);

      const task: Task = {
        id: 'task-6',
        description: 'Test performance',
        type: 'coding',
        priority: 'medium',
      };

      const context: RuleContext = {
        task,
        agentWorkload: new Map(),
        availableAgents: ['coder'],
        currentTime: new Date(),
      };

      const results = await engine.evaluateTask(task, context);
      expect(results[0]?.evaluationTime).toBeLessThan(10); // < 10ms
    });
  });

  describe('Metrics', () => {
    it('should track evaluation metrics', async () => {
      const rule: OrchestrationRule = {
        id: 'metrics-rule',
        condition: 'true',
        action: 'route_to_agent',
        agent: 'coder',
        priority: 100,
      };

      engine.addRule(rule);

      const task: Task = {
        id: 'task-7',
        description: 'Test',
        type: 'coding',
        priority: 'medium',
      };

      const context: RuleContext = {
        task,
        agentWorkload: new Map(),
        availableAgents: ['coder'],
        currentTime: new Date(),
      };

      await engine.evaluateTask(task, context);

      const metrics = engine.getMetrics();
      expect(metrics.totalTasks).toBe(1);
      expect(metrics.tasksRouted).toBe(1);
    });
  });
});
