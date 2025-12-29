/**
 * Tests for TaskCompletionConsumer
 *
 * @module learning/services/__tests__/task-completion-consumer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TaskCompletionConsumer,
  createTaskCompletionConsumer,
} from '../../../src/learning/services/task-completion-consumer.js';
import { MemoryExtractionService } from '../../../src/learning/services/memory-extraction-service.js';
import type { TaskCompletionEvent, TaskResult } from '../../../src/learning/types.js';

/**
 * Create a mock task result
 */
function createMockTaskResult(overrides: Partial<TaskResult> = {}): TaskResult {
  return {
    taskId: `task-${Date.now()}`,
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

describe('TaskCompletionConsumer', () => {
  let memoryExtraction: MemoryExtractionService;
  let consumer: TaskCompletionConsumer;

  beforeEach(() => {
    memoryExtraction = new MemoryExtractionService();
    consumer = createTaskCompletionConsumer(memoryExtraction);
  });

  describe('constructor', () => {
    it('should create a consumer with default config', () => {
      expect(consumer).toBeInstanceOf(TaskCompletionConsumer);
    });

    it('should create a consumer with custom config', () => {
      const custom = createTaskCompletionConsumer(memoryExtraction, undefined, undefined, {
        learningThreshold: 5,
        autoTriggerLearning: false,
      });
      expect(custom).toBeInstanceOf(TaskCompletionConsumer);
    });
  });

  describe('processCompletion', () => {
    it('should process a completion event', async () => {
      const event = createMockEvent();
      await consumer.processCompletion(event);

      const stats = consumer.getStatistics();
      expect(stats.totalTasks).toBe(1);
    });

    it('should update statistics on completion', async () => {
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ success: true })));
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ success: false })));

      const stats = consumer.getStatistics();
      expect(stats.totalTasks).toBe(2);
      expect(stats.successfulTasks).toBe(1);
      expect(stats.failedTasks).toBe(1);
    });

    it('should track agent type statistics', async () => {
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ agentType: 'coder' })));
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ agentType: 'coder' })));
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ agentType: 'tester' })));

      const stats = consumer.getStatistics();
      expect(stats.byAgentType['coder'].total).toBe(2);
      expect(stats.byAgentType['tester'].total).toBe(1);
    });

    it('should track quality scores', async () => {
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ qualityScore: 0.8 })));
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ qualityScore: 0.9 })));

      const stats = consumer.getStatistics();
      expect(stats.avgQualityScore).toBeCloseTo(0.85, 2);
    });

    it('should emit memory-extracted event', async () => {
      const handler = vi.fn();
      consumer.on('memory-extracted', handler);

      await consumer.processCompletion(createMockEvent());

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0]).toBeInstanceOf(Array);
    });

    it('should emit task-processed event', async () => {
      const handler = vi.fn();
      consumer.on('task-processed', handler);

      const event = createMockEvent();
      await consumer.processCompletion(event);

      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should queue events when processing', async () => {
      // Process multiple events rapidly
      const events = Array.from({ length: 5 }, () => createMockEvent());
      const promises = events.map(e => consumer.processCompletion(e));

      await Promise.all(promises);

      const stats = consumer.getStatistics();
      expect(stats.totalTasks).toBe(5);
    });
  });

  describe('learning trigger', () => {
    it('should trigger learning when threshold met', async () => {
      const consumer = createTaskCompletionConsumer(memoryExtraction, undefined, undefined, {
        learningThreshold: 3,
        autoTriggerLearning: true,
      });

      const handler = vi.fn();
      consumer.on('learning-trigger', handler);

      for (let i = 0; i < 3; i++) {
        await consumer.processCompletion(createMockEvent());
      }

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0]).toHaveProperty('reason', 'threshold-met');
    });

    it('should not trigger when auto-trigger disabled', async () => {
      const consumer = createTaskCompletionConsumer(memoryExtraction, undefined, undefined, {
        learningThreshold: 2,
        autoTriggerLearning: false,
      });

      const handler = vi.fn();
      consumer.on('learning-trigger', handler);

      for (let i = 0; i < 5; i++) {
        await consumer.processCompletion(createMockEvent());
      }

      expect(handler).not.toHaveBeenCalled();
    });

    it('should allow manual trigger', () => {
      const handler = vi.fn();
      consumer.on('learning-trigger', handler);

      consumer.forceLearningTrigger();

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0]).toHaveProperty('reason', 'manual-trigger');
    });
  });

  describe('getStatistics', () => {
    it('should return current statistics', () => {
      const stats = consumer.getStatistics();

      expect(stats).toHaveProperty('totalTasks', 0);
      expect(stats).toHaveProperty('successfulTasks', 0);
      expect(stats).toHaveProperty('failedTasks', 0);
      expect(stats).toHaveProperty('memoriesExtracted', 0);
    });

    it('should track total duration', async () => {
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ durationMs: 5000 })));
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ durationMs: 10000 })));

      const stats = consumer.getStatistics();
      expect(stats.totalDurationMs).toBe(15000);
    });

    it('should track token usage', async () => {
      await consumer.processCompletion(createMockEvent(createMockTaskResult({
        tokenUsage: { input: 100, output: 200, total: 300 },
      })));

      const stats = consumer.getStatistics();
      expect(stats.totalTokensUsed).toBe(300);
    });
  });

  describe('getSuccessRate', () => {
    it('should return 0 when no tasks', () => {
      expect(consumer.getSuccessRate()).toBe(0);
    });

    it('should calculate success rate correctly', async () => {
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ success: true })));
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ success: true })));
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ success: false })));

      expect(consumer.getSuccessRate()).toBeCloseTo(0.667, 2);
    });
  });

  describe('getAverageDuration', () => {
    it('should return 0 when no tasks', () => {
      expect(consumer.getAverageDuration()).toBe(0);
    });

    it('should calculate average duration', async () => {
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ durationMs: 1000 })));
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ durationMs: 3000 })));

      expect(consumer.getAverageDuration()).toBe(2000);
    });
  });

  describe('getActivities', () => {
    it('should return activities for date range', async () => {
      await consumer.processCompletion(createMockEvent());
      await consumer.processCompletion(createMockEvent());

      const activities = consumer.getActivities();
      expect(activities.length).toBe(2);
    });

    it('should filter by start date', async () => {
      await consumer.processCompletion(createMockEvent());

      const future = new Date(Date.now() + 60000);
      const activities = consumer.getActivities(future);

      expect(activities.length).toBe(0);
    });
  });

  describe('getTodayActivities', () => {
    it('should return activities from today', async () => {
      await consumer.processCompletion(createMockEvent());

      const activities = consumer.getTodayActivities();
      expect(activities.length).toBe(1);
    });
  });

  describe('getActivitiesByAgent', () => {
    it('should filter by agent type', async () => {
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ agentType: 'coder' })));
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ agentType: 'tester' })));
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ agentType: 'coder' })));

      const coderActivities = consumer.getActivitiesByAgent('coder');
      expect(coderActivities.length).toBe(2);
    });
  });

  describe('getFailedActivities', () => {
    it('should return only failed activities', async () => {
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ success: true })));
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ success: false })));
      await consumer.processCompletion(createMockEvent(createMockTaskResult({ success: false })));

      const failed = consumer.getFailedActivities();
      expect(failed.length).toBe(2);
    });
  });

  describe('resetStatistics', () => {
    it('should reset all statistics', async () => {
      await consumer.processCompletion(createMockEvent());
      await consumer.processCompletion(createMockEvent());

      consumer.resetStatistics();

      const stats = consumer.getStatistics();
      expect(stats.totalTasks).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all data', async () => {
      await consumer.processCompletion(createMockEvent());

      consumer.clear();

      expect(consumer.getStatistics().totalTasks).toBe(0);
      expect(consumer.getActivities().length).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should emit error on processing failure', async () => {
      const failingExtractor = {
        extractFromTask: vi.fn().mockRejectedValue(new Error('Extraction failed')),
      } as unknown as MemoryExtractionService;

      const consumer = createTaskCompletionConsumer(failingExtractor);
      const handler = vi.fn();
      consumer.on('error', handler);

      await consumer.processCompletion(createMockEvent());

      expect(handler).toHaveBeenCalled();
    });
  });
});
