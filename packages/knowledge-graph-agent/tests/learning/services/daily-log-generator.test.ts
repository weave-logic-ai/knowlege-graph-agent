/**
 * Tests for DailyLogGenerator
 *
 * @module learning/services/__tests__/daily-log-generator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DailyLogGenerator,
  createDailyLogGenerator,
} from '../../../src/learning/services/daily-log-generator.js';
import type { TaskCompletionEvent, TaskResult } from '../../../src/learning/types.js';

/**
 * Create a mock task result
 */
function createMockTaskResult(overrides: Partial<TaskResult> = {}): TaskResult {
  return {
    taskId: `task-${Date.now()}-${Math.random()}`,
    description: 'Test task',
    agentId: 'agent-1',
    agentType: 'coder',
    success: true,
    output: 'Task completed',
    context: {
      workingDirectory: '/project',
    },
    startTime: new Date(Date.now() - 5000),
    endTime: new Date(),
    durationMs: 5000,
    qualityScore: 0.8,
    ...overrides,
  };
}

/**
 * Create a mock completion event
 */
function createMockEvent(result?: TaskResult): TaskCompletionEvent {
  return {
    eventType: 'task_completed',
    result: result ?? createMockTaskResult(),
    timestamp: new Date(),
  };
}

describe('DailyLogGenerator', () => {
  let generator: DailyLogGenerator;

  beforeEach(() => {
    generator = createDailyLogGenerator();
  });

  describe('constructor', () => {
    it('should create a generator with default config', () => {
      expect(generator).toBeInstanceOf(DailyLogGenerator);
    });

    it('should create a generator with custom config', () => {
      const custom = createDailyLogGenerator(undefined, undefined, {
        maxTopAgents: 3,
        maxInsights: 5,
      });
      expect(custom).toBeInstanceOf(DailyLogGenerator);
    });
  });

  describe('recordActivity', () => {
    it('should record activities for later reporting', async () => {
      generator.recordActivity(createMockEvent());
      generator.recordActivity(createMockEvent());

      const log = await generator.generateDailyLog();
      expect(log.tasksCompleted).toBe(2);
    });
  });

  describe('generateDailyLog', () => {
    it('should generate a daily log', async () => {
      generator.recordActivity(createMockEvent(createMockTaskResult({ success: true })));
      generator.recordActivity(createMockEvent(createMockTaskResult({ success: false })));

      const log = await generator.generateDailyLog();

      expect(log).toHaveProperty('date');
      expect(log).toHaveProperty('summary');
      expect(log).toHaveProperty('tasksCompleted', 2);
      expect(log).toHaveProperty('tasksSuccessful', 1);
      expect(log).toHaveProperty('tasksFailed', 1);
    });

    it('should include date in YYYY-MM-DD format', async () => {
      generator.recordActivity(createMockEvent());

      const log = await generator.generateDailyLog();

      expect(log.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should include top agents', async () => {
      generator.recordActivity(createMockEvent(createMockTaskResult({ agentType: 'coder' })));
      generator.recordActivity(createMockEvent(createMockTaskResult({ agentType: 'coder' })));
      generator.recordActivity(createMockEvent(createMockTaskResult({ agentType: 'tester' })));

      const log = await generator.generateDailyLog();

      expect(log.topAgents.length).toBeGreaterThan(0);
      expect(log.topAgents[0]).toHaveProperty('agentType');
      expect(log.topAgents[0]).toHaveProperty('taskCount');
      expect(log.topAgents[0]).toHaveProperty('successRate');
    });

    it('should calculate average quality score', async () => {
      generator.recordActivity(createMockEvent(createMockTaskResult({ qualityScore: 0.8 })));
      generator.recordActivity(createMockEvent(createMockTaskResult({ qualityScore: 0.9 })));

      const log = await generator.generateDailyLog();

      expect(log.avgQualityScore).toBeCloseTo(0.85, 2);
    });

    it('should generate insights', async () => {
      // Add enough activities for insights
      for (let i = 0; i < 10; i++) {
        generator.recordActivity(createMockEvent(createMockTaskResult({
          success: i < 9, // 90% success rate
        })));
      }

      const log = await generator.generateDailyLog();

      expect(log.insights.length).toBeGreaterThan(0);
    });

    it('should include errors when configured', async () => {
      generator.recordActivity(createMockEvent(createMockTaskResult({
        success: false,
        error: { code: 'ERR_1', message: 'Test error' },
      })));

      const log = await generator.generateDailyLog();

      expect(log.errors).toBeDefined();
      expect(log.errors?.length).toBe(1);
      expect(log.errors?.[0].error).toContain('Test error');
    });

    it('should generate summary', async () => {
      generator.recordActivity(createMockEvent());

      const log = await generator.generateDailyLog();

      expect(log.summary).toBeDefined();
      expect(log.summary.length).toBeGreaterThan(0);
    });
  });

  describe('generateDailyLog for specific date', () => {
    it('should generate log for a specific date', async () => {
      const date = new Date();
      generator.recordActivity(createMockEvent());

      const log = await generator.generateDailyLog(date);

      expect(log.date).toBe(date.toISOString().split('T')[0]);
    });

    it('should return empty log for date with no activities', async () => {
      const pastDate = new Date(Date.now() - 86400000 * 30); // 30 days ago

      const log = await generator.generateDailyLog(pastDate);

      expect(log.tasksCompleted).toBe(0);
    });
  });

  describe('generateWeeklyReport', () => {
    it('should generate a weekly report', async () => {
      // Add activities
      for (let i = 0; i < 10; i++) {
        generator.recordActivity(createMockEvent());
      }

      const report = await generator.generateWeeklyReport();

      expect(report).toHaveProperty('weekStart');
      expect(report).toHaveProperty('weekEnd');
      expect(report).toHaveProperty('dailyLogs');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('totalTasks');
      expect(report).toHaveProperty('overallSuccessRate');
      expect(report).toHaveProperty('topPatterns');
      expect(report).toHaveProperty('recommendations');
    });

    it('should include daily logs for the week', async () => {
      generator.recordActivity(createMockEvent());

      const report = await generator.generateWeeklyReport();

      expect(report.dailyLogs.length).toBe(7);
    });

    it('should calculate overall success rate', async () => {
      generator.recordActivity(createMockEvent(createMockTaskResult({ success: true })));
      generator.recordActivity(createMockEvent(createMockTaskResult({ success: true })));
      generator.recordActivity(createMockEvent(createMockTaskResult({ success: false })));

      const report = await generator.generateWeeklyReport();

      expect(report.overallSuccessRate).toBeCloseTo(0.667, 2);
    });

    it('should generate recommendations', async () => {
      // Add enough activities for recommendations
      for (let i = 0; i < 10; i++) {
        generator.recordActivity(createMockEvent());
      }

      const report = await generator.generateWeeklyReport();

      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('insights generation', () => {
    it('should note high success rate', async () => {
      for (let i = 0; i < 10; i++) {
        generator.recordActivity(createMockEvent(createMockTaskResult({ success: true })));
      }

      const log = await generator.generateDailyLog();

      expect(log.insights.some(i => i.toLowerCase().includes('success'))).toBe(true);
    });

    it('should note low success rate', async () => {
      for (let i = 0; i < 10; i++) {
        generator.recordActivity(createMockEvent(createMockTaskResult({
          success: i < 4, // 40% success
        })));
      }

      const log = await generator.generateDailyLog();

      expect(log.insights.some(i => i.toLowerCase().includes('low') || i.includes('40'))).toBe(true);
    });

    it('should note code changes', async () => {
      for (let i = 0; i < 6; i++) {
        generator.recordActivity(createMockEvent(createMockTaskResult({
          codeChanges: [
            { filePath: `file${i}.ts`, changeType: 'create', linesAdded: 50, linesRemoved: 0, language: 'typescript' },
          ],
        })));
      }

      const log = await generator.generateDailyLog();

      expect(log.insights.some(i => i.toLowerCase().includes('code') || i.toLowerCase().includes('file'))).toBe(true);
    });
  });

  describe('agent performance tracking', () => {
    it('should sort agents by performance', async () => {
      // Coder: 100% success
      generator.recordActivity(createMockEvent(createMockTaskResult({ agentType: 'coder', success: true })));
      generator.recordActivity(createMockEvent(createMockTaskResult({ agentType: 'coder', success: true })));

      // Tester: 50% success
      generator.recordActivity(createMockEvent(createMockTaskResult({ agentType: 'tester', success: true })));
      generator.recordActivity(createMockEvent(createMockTaskResult({ agentType: 'tester', success: false })));

      const log = await generator.generateDailyLog();

      expect(log.topAgents[0].agentType).toBe('coder');
      expect(log.topAgents[0].successRate).toBe(1);
    });

    it('should calculate average duration per agent', async () => {
      generator.recordActivity(createMockEvent(createMockTaskResult({
        agentType: 'coder',
        durationMs: 1000,
      })));
      generator.recordActivity(createMockEvent(createMockTaskResult({
        agentType: 'coder',
        durationMs: 3000,
      })));

      const log = await generator.generateDailyLog();

      const coder = log.topAgents.find(a => a.agentType === 'coder');
      expect(coder?.avgDurationMs).toBe(2000);
    });
  });

  describe('clear', () => {
    it('should clear local tracking data', async () => {
      generator.recordActivity(createMockEvent());
      generator.clear();

      const log = await generator.generateDailyLog();
      expect(log.tasksCompleted).toBe(0);
    });
  });
});
