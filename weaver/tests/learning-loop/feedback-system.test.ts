/**
 * Feedback Collection System Tests
 *
 * Comprehensive test suite for the learning loop feedback system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedbackCollector } from '../../src/learning-loop/feedback-collector';
import { FeedbackStorage } from '../../src/learning-loop/feedback-storage';
import { ReflectionSystem } from '../../src/learning-loop/reflection';
import type {
  UserFeedback,
  ExecutionResult,
  ApproachOption,
  FeedbackContext
} from '../../src/learning-loop/feedback-types';

// Mock inquirer
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn()
  }
}));

// Mock claude-flow CLI
vi.mock('../../src/claude-flow', () => ({
  claudeFlowCLI: {
    memoryStore: vi.fn(),
    memorySearch: vi.fn(() => Promise.resolve([])),
    memoryList: vi.fn(() => Promise.resolve([])),
    memoryDelete: vi.fn()
  }
}));

describe('FeedbackCollector', () => {
  let collector: FeedbackCollector;

  beforeEach(() => {
    collector = new FeedbackCollector();
    vi.clearAllMocks();
  });

  describe('collect', () => {
    it('should collect basic feedback', async () => {
      const inquirer = await import('inquirer');
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({ rating: 5 });

      const context: FeedbackContext = {
        sopId: 'test_sop',
        executionId: 'exec_001',
        result: { success: true }
      };

      const feedback = await collector.collect(context);

      expect(feedback.sopId).toBe('test_sop');
      expect(feedback.executionId).toBe('exec_001');
      expect(feedback.satisfactionRating).toBe(5);
      expect(feedback.preferenceSignals).toBeDefined();
    });

    it('should handle low satisfaction ratings', async () => {
      const inquirer = await import('inquirer');
      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({ rating: 2 })
        .mockResolvedValueOnce({ comment: 'Too slow' });

      const context: FeedbackContext = {
        sopId: 'test_sop',
        executionId: 'exec_002',
        result: { success: false }
      };

      const feedback = await collector.collect(context);

      expect(feedback.satisfactionRating).toBe(2);
      expect(feedback.satisfactionComment).toBe('Too slow');
    });

    it('should collect approach preferences when multiple approaches provided', async () => {
      const inquirer = await import('inquirer');
      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({ rating: 4 })
        .mockResolvedValueOnce({ selectedId: 'tdd' })
        .mockResolvedValueOnce({ wantRationale: true })
        .mockResolvedValueOnce({ rationale: 'Better quality' });

      const approaches: ApproachOption[] = [
        {
          id: 'tdd',
          name: 'TDD',
          description: 'Test-driven development',
          pros: ['Quality'],
          cons: ['Slower']
        },
        {
          id: 'rapid',
          name: 'Rapid',
          description: 'Quick prototype',
          pros: ['Fast'],
          cons: ['Lower quality']
        }
      ];

      const context: FeedbackContext = {
        sopId: 'test_sop',
        executionId: 'exec_003',
        result: { success: true },
        approaches
      };

      const feedback = await collector.collect(context);

      expect(feedback.selectedApproach).toBe('tdd');
      expect(feedback.approachRationale).toBe('Better quality');
    });
  });

  describe('extractPreferenceSignals', () => {
    it('should extract speed preference signals', async () => {
      const inquirer = await import('inquirer');
      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({ rating: 3 })
        .mockResolvedValueOnce({ wantToImprove: true })
        .mockResolvedValueOnce({ improvement: 'Make it faster' })
        .mockResolvedValueOnce({ improvement: '' });

      const context: FeedbackContext = {
        sopId: 'test_sop',
        executionId: 'exec_004',
        result: { success: true }
      };

      const feedback = await collector.collect(context);

      const speedSignals = feedback.preferenceSignals.filter(
        s => s.category === 'speed_preference'
      );

      expect(speedSignals.length).toBeGreaterThan(0);
      expect(speedSignals[0].value).toBe('prioritize_speed');
      expect(speedSignals[0].shouldRepeat).toBe(true);
    });

    it('should extract detail level preference signals', async () => {
      const inquirer = await import('inquirer');
      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({ rating: 4 })
        .mockResolvedValueOnce({ wantToImprove: true })
        .mockResolvedValueOnce({ improvement: 'Need more detail' })
        .mockResolvedValueOnce({ improvement: '' });

      const context: FeedbackContext = {
        sopId: 'test_sop',
        executionId: 'exec_005',
        result: { success: true }
      };

      const feedback = await collector.collect(context);

      const detailSignals = feedback.preferenceSignals.filter(
        s => s.category === 'detail_level'
      );

      expect(detailSignals.length).toBeGreaterThan(0);
      expect(detailSignals[0].value).toBe('high');
    });
  });

  describe('collectMinimal', () => {
    it('should collect only satisfaction rating in minimal mode', async () => {
      const inquirer = await import('inquirer');
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({ rating: 5 });

      const context: FeedbackContext = {
        sopId: 'test_sop',
        executionId: 'exec_006',
        result: { success: true }
      };

      const feedback = await collector.collectMinimal(context);

      expect(feedback.satisfactionRating).toBe(5);
      expect(feedback.improvements).toBeUndefined();
      expect(feedback.selectedApproach).toBeUndefined();
    });
  });
});

describe('FeedbackStorage', () => {
  let storage: FeedbackStorage;

  beforeEach(() => {
    storage = new FeedbackStorage();
    vi.clearAllMocks();
  });

  describe('store', () => {
    it('should store feedback in claude-flow memory', async () => {
      const { claudeFlowCLI } = await import('../../src/claude-flow');

      const feedback: UserFeedback = {
        id: 'feedback_001',
        timestamp: Date.now(),
        sopId: 'test_sop',
        executionId: 'exec_001',
        satisfactionRating: 5,
        preferenceSignals: [],
        taskComplexity: 'medium'
      };

      await storage.store(feedback);

      expect(claudeFlowCLI.memoryStore).toHaveBeenCalledWith(
        'feedback_001',
        expect.stringContaining('test_sop'),
        'weaver_feedback'
      );
    });
  });

  describe('getFeedbackForSOP', () => {
    it('should retrieve feedback for specific SOP', async () => {
      const { claudeFlowCLI } = await import('../../src/claude-flow');

      const mockFeedback = {
        id: 'feedback_001',
        sopId: 'test_sop',
        satisfactionRating: 5,
        preferenceSignals: [],
        taskComplexity: 'medium'
      };

      vi.mocked(claudeFlowCLI.memorySearch).mockResolvedValueOnce([
        { value: JSON.stringify(mockFeedback) }
      ] as any);

      const feedback = await storage.getFeedbackForSOP('test_sop');

      expect(feedback).toHaveLength(1);
      expect(feedback[0].sopId).toBe('test_sop');
    });
  });

  describe('getSatisfactionTrend', () => {
    it('should return satisfaction ratings in chronological order', async () => {
      const { claudeFlowCLI } = await import('../../src/claude-flow');

      const mockFeedback = [
        { timestamp: 1000, satisfactionRating: 3 },
        { timestamp: 2000, satisfactionRating: 4 },
        { timestamp: 3000, satisfactionRating: 5 }
      ];

      vi.mocked(claudeFlowCLI.memorySearch).mockResolvedValueOnce(
        mockFeedback.map(f => ({ value: JSON.stringify(f) })) as any
      );

      const trend = await storage.getSatisfactionTrend('test_sop');

      expect(trend).toEqual([3, 4, 5]);
    });
  });

  describe('getAnalytics', () => {
    it('should calculate comprehensive analytics', async () => {
      const { claudeFlowCLI } = await import('../../src/claude-flow');

      const mockFeedback = [
        {
          timestamp: 1000,
          satisfactionRating: 4,
          selectedApproach: 'tdd',
          improvements: ['Add tests'],
          preferenceSignals: [{ category: 'quality', value: 'high', shouldRepeat: true }]
        },
        {
          timestamp: 2000,
          satisfactionRating: 5,
          selectedApproach: 'tdd',
          improvements: ['Add tests', 'Better docs'],
          preferenceSignals: []
        },
        {
          timestamp: 3000,
          satisfactionRating: 3,
          selectedApproach: 'rapid',
          improvements: [],
          preferenceSignals: []
        }
      ];

      vi.mocked(claudeFlowCLI.memoryList).mockResolvedValueOnce(
        mockFeedback.map(f => ({ value: JSON.stringify(f) })) as any
      );

      const analytics = await storage.getAnalytics();

      expect(analytics.totalFeedback).toBe(3);
      expect(analytics.averageSatisfaction).toBeCloseTo(4, 1);
      expect(analytics.topApproaches).toHaveLength(2);
      expect(analytics.topApproaches[0].id).toBe('tdd');
      expect(analytics.commonImprovements[0].text).toBe('Add tests');
      expect(analytics.commonImprovements[0].frequency).toBe(2);
    });
  });
});

describe('ReflectionSystem', () => {
  let reflectionSystem: ReflectionSystem;

  beforeEach(() => {
    reflectionSystem = new ReflectionSystem();
    vi.clearAllMocks();
  });

  describe('reflectAutonomous', () => {
    it('should generate autonomous lessons', async () => {
      const execution: ExecutionResult = {
        id: 'exec_001',
        sop: 'test_sop',
        success: true,
        duration: 30000,
        errorCount: 0,
        result: { success: true }
      };

      const lessons = await reflectionSystem.reflectAutonomous(execution);

      expect(lessons.approaches).toBeDefined();
      expect(lessons.approaches!.length).toBeGreaterThan(0);
      expect(lessons.recommendedApproach).toBeDefined();
      expect(lessons.executionMetrics.success).toBe(true);
    });

    it('should recommend error recovery for failed executions', async () => {
      const execution: ExecutionResult = {
        id: 'exec_002',
        sop: 'test_sop',
        success: false,
        duration: 60000,
        errorCount: 3,
        result: { errors: ['Error 1', 'Error 2', 'Error 3'] }
      };

      const lessons = await reflectionSystem.reflectAutonomous(execution);

      const errorRecoveryApproach = lessons.approaches?.find(
        a => a.id === 'error_recovery'
      );

      expect(errorRecoveryApproach).toBeDefined();
    });
  });

  describe('synthesizeLearnings', () => {
    it('should calculate high confidence when user agrees with AI', async () => {
      const execution: ExecutionResult = {
        id: 'exec_003',
        sop: 'test_sop',
        success: true,
        duration: 30000,
        errorCount: 0,
        result: { success: true }
      };

      const inquirer = await import('inquirer');
      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({ rating: 5 })
        .mockResolvedValueOnce({ selectedId: 'balanced' })
        .mockResolvedValueOnce({ wantRationale: false });

      const { claudeFlowCLI } = await import('../../src/claude-flow');
      vi.mocked(claudeFlowCLI.memoryStore).mockResolvedValueOnce();

      const lessons = await reflectionSystem.reflect(execution);

      // When user selects the AI-recommended approach with high satisfaction
      expect(lessons.confidenceScore).toBeGreaterThan(0.9);
    });

    it('should calculate weight based on satisfaction', async () => {
      const execution: ExecutionResult = {
        id: 'exec_004',
        sop: 'test_sop',
        success: true,
        duration: 30000,
        errorCount: 0,
        result: { success: true }
      };

      const inquirer = await import('inquirer');
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({ rating: 5 });

      const { claudeFlowCLI } = await import('../../src/claude-flow');
      vi.mocked(claudeFlowCLI.memoryStore).mockResolvedValueOnce();

      const lessons = await reflectionSystem.reflect(execution);

      // High satisfaction = high weight (2x base * satisfaction multiplier)
      expect(lessons.weight).toBeGreaterThan(1.5);
    });

    it('should generate recommendations based on user feedback', async () => {
      const execution: ExecutionResult = {
        id: 'exec_005',
        sop: 'test_sop',
        success: true,
        duration: 30000,
        errorCount: 0,
        result: { success: true }
      };

      const inquirer = await import('inquirer');
      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({ rating: 3 })
        .mockResolvedValueOnce({ wantToImprove: true })
        .mockResolvedValueOnce({ improvement: 'Add better error handling' })
        .mockResolvedValueOnce({ improvement: '' });

      const { claudeFlowCLI } = await import('../../src/claude-flow');
      vi.mocked(claudeFlowCLI.memoryStore).mockResolvedValueOnce();

      const lessons = await reflectionSystem.reflect(execution);

      expect(lessons.synthesizedRecommendations).toBeDefined();
      expect(lessons.synthesizedRecommendations.length).toBeGreaterThan(0);
    });
  });
});
