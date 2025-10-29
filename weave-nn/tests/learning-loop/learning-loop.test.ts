/**
 * Autonomous Learning Loop - Integration Tests
 * Tests the complete 4-pillar system with learning demonstration
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { AutonomousLearningLoop } from '../../src/learning-loop';
import type { Task, LearningReport } from '../../src/learning-loop/types';

// Mock clients (replace with actual clients in production)
const mockClaudeFlow = {
  memory_search: async (params: any) => {
    // Return mock experiences
    return [
      {
        value: JSON.stringify({
          id: 'exp_001',
          task: { description: 'Similar task', domain: 'testing' },
          success: true,
          lessons: [],
          timestamp: Date.now() - 86400000
        })
      }
    ];
  },
  memory_usage: async (params: any) => {
    return { success: true };
  },
  neural_patterns: async (params: any) => {
    return { success: true, patterns: [] };
  },
  parallel_execute: async (params: any) => {
    const count = params.tasks?.length || 1;
    return Array(count).fill(0).map((_, i) => ({
      content: JSON.stringify({
        rationale: `Test plan ${i}`,
        steps: [
          { name: 'Step 1', action: 'test', params: {}, expectedOutcome: 'success' }
        ],
        estimatedEffort: 60,
        confidence: 0.8
      })
    }));
  },
  workflow_create: async (params: any) => {
    return { id: `workflow_${Date.now()}` };
  },
  workflow_execute: async (params: any) => {
    return {
      success: true,
      data: { result: 'test completed' },
      stepsCompleted: 1
    };
  },
  workflow_status: async (params: any) => {
    return {
      status: 'completed',
      result: { success: true },
      stepsCompleted: 1
    };
  },
  error_analysis: async (params: any) => {
    return {
      summary: 'No errors detected',
      patterns: []
    };
  },
  daa_meta_learning: async (params: any) => {
    return { success: true };
  },
  daa_fault_tolerance: async (params: any) => {
    return { success: false };
  }
};

const mockClaudeClient = {
  sendMessage: async (params: any) => {
    return {
      content: JSON.stringify({
        rationale: 'Test plan using Chain-of-Thought reasoning',
        steps: [
          { name: 'Analyze task', action: 'analyze', params: {}, expectedOutcome: 'understanding' },
          { name: 'Execute task', action: 'execute', params: {}, expectedOutcome: 'completion' }
        ],
        estimatedEffort: 30,
        confidence: 0.85
      })
    };
  }
};

const mockShadowCache = {
  queryFiles: async (params: any) => {
    return [
      { path: '/test/note1.md' },
      { path: '/test/note2.md' }
    ];
  },
  getFileContent: async (path: string) => {
    return `---
tags: [testing, automation]
---

# Test Note

This is a test note with relevant content.
[[related-note]]
`;
  },
  indexExperience: async (experience: any) => {
    return Promise.resolve();
  },
  searchExperiences: async (query: string) => {
    return [];
  }
};

describe('AutonomousLearningLoop', () => {
  let loop: AutonomousLearningLoop;

  beforeAll(() => {
    loop = new AutonomousLearningLoop(
      mockClaudeFlow as any,
      mockClaudeClient as any,
      mockShadowCache as any
    );
  });

  describe('Basic Execution', () => {
    it('should execute a simple task successfully', async () => {
      const task: Task = {
        id: 'test_001',
        description: 'Test task execution',
        domain: 'testing'
      };

      const outcome = await loop.execute(task);

      expect(outcome).toBeDefined();
      expect(outcome.success).toBe(true);
      expect(outcome.duration).toBeGreaterThan(0);
      expect(outcome.metrics).toBeDefined();
      expect(outcome.metrics.stepsCompleted).toBeGreaterThan(0);
    }, 30000);

    it('should gather context from multiple sources', async () => {
      const task: Task = {
        id: 'test_002',
        description: 'Context gathering test',
        domain: 'testing'
      };

      const outcome = await loop.execute(task);

      expect(outcome.success).toBe(true);
      // Context should include past experiences and notes
      expect(outcome.logs).toBeDefined();
      expect(outcome.logs.some(log => log.includes('Context gathered'))).toBe(true);
    }, 30000);

    it('should generate reasoning path with Chain-of-Thought', async () => {
      const task: Task = {
        id: 'test_003',
        description: 'Chain-of-Thought reasoning test',
        domain: 'testing'
      };

      const outcome = await loop.execute(task);

      expect(outcome.success).toBe(true);
      expect(outcome.logs).toBeDefined();
      // Should show reasoning steps
      expect(outcome.logs.some(log => log.includes('REASONING'))).toBe(true);
    }, 30000);
  });

  describe('Multi-Path Reasoning', () => {
    it('should generate multiple alternative plans', async () => {
      const task: Task = {
        id: 'test_004',
        description: 'Multi-path planning test',
        domain: 'testing'
      };

      const outcome = await loop.execute(task);

      expect(outcome.success).toBe(true);
      expect(outcome.logs.some(log => log.includes('plan(s)'))).toBe(true);
    }, 30000);

    it('should select best plan based on scoring', async () => {
      const task: Task = {
        id: 'test_005',
        description: 'Plan selection test',
        domain: 'testing'
      };

      const outcome = await loop.execute(task);

      expect(outcome.success).toBe(true);
      expect(outcome.logs.some(log => log.includes('Selected best plan'))).toBe(true);
    }, 30000);
  });

  describe('Memory & Learning', () => {
    it('should store experiences in memory', async () => {
      const task: Task = {
        id: 'test_006',
        description: 'Memory storage test',
        domain: 'testing'
      };

      const outcome = await loop.execute(task);

      expect(outcome.success).toBe(true);
      expect(outcome.logs.some(log => log.includes('Experience stored'))).toBe(true);
    }, 30000);

    it('should retrieve memory statistics', async () => {
      const stats = await loop.getMemoryStats();

      expect(stats).toBeDefined();
      expect(stats.totalExperiences).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeLessThanOrEqual(1);
      expect(stats.topDomains).toBeDefined();
    });
  });

  describe('Reflection & Learning', () => {
    it('should extract lessons from successful execution', async () => {
      const task: Task = {
        id: 'test_007',
        description: 'Success reflection test',
        domain: 'testing'
      };

      const outcome = await loop.execute(task);

      expect(outcome.success).toBe(true);
      expect(outcome.logs.some(log => log.includes('lesson(s)'))).toBe(true);
    }, 30000);

    it('should generate recommendations after execution', async () => {
      const task: Task = {
        id: 'test_008',
        description: 'Recommendation generation test',
        domain: 'testing'
      };

      const outcome = await loop.execute(task);

      expect(outcome.success).toBe(true);
      expect(outcome.logs.some(log => log.includes('Recommendations') || log.includes('lesson'))).toBe(true);
    }, 30000);
  });

  describe('Learning Demonstration', () => {
    it('should demonstrate learning over iterations', async () => {
      const task: Task = {
        id: 'test_009',
        description: 'Iterative learning test',
        domain: 'testing',
        priority: 'medium'
      };

      const report: LearningReport = await loop.demonstrateLearning(task, 3);

      expect(report).toBeDefined();
      expect(report.iterations).toBe(3);
      expect(report.results).toHaveLength(3);
      expect(report.metrics).toBeDefined();
      expect(report.metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(report.metrics.successRate).toBeLessThanOrEqual(1);
    }, 90000); // 90s timeout for 3 iterations

    it('should show improvement metrics between iterations', async () => {
      const task: Task = {
        id: 'test_010',
        description: 'Improvement tracking test',
        domain: 'testing'
      };

      const report = await loop.demonstrateLearning(task, 2);

      expect(report.results).toHaveLength(2);

      // Second iteration should have improvement metric
      if (report.results[1].improvement !== undefined) {
        expect(typeof report.results[1].improvement).toBe('number');
      }
    }, 60000);

    it('should calculate overall improvement rate', async () => {
      const task: Task = {
        id: 'test_011',
        description: 'Overall improvement test',
        domain: 'testing'
      };

      const report = await loop.demonstrateLearning(task, 3);

      expect(report.overallImprovement).toBeDefined();
      expect(typeof report.overallImprovement).toBe('number');
    }, 90000);
  });

  describe('Error Handling', () => {
    it('should handle and learn from failures', async () => {
      // Create a failing workflow mock temporarily
      const originalExecute = mockClaudeFlow.workflow_execute;
      mockClaudeFlow.workflow_execute = async () => {
        return {
          success: false,
          error: new Error('Test failure'),
          stepsCompleted: 0
        };
      };

      const task: Task = {
        id: 'test_012',
        description: 'Failure handling test',
        domain: 'testing'
      };

      const outcome = await loop.execute(task);

      expect(outcome.success).toBe(false);
      expect(outcome.error).toBeDefined();
      // Should still store experience even on failure
      expect(outcome.logs.some(log => log.includes('Experience stored'))).toBe(true);

      // Restore original
      mockClaudeFlow.workflow_execute = originalExecute;
    }, 30000);

    it('should extract error lessons from failures', async () => {
      const originalExecute = mockClaudeFlow.workflow_execute;
      mockClaudeFlow.workflow_execute = async () => {
        return {
          success: false,
          error: new Error('Test error for lesson extraction'),
          stepsCompleted: 0
        };
      };

      const task: Task = {
        id: 'test_013',
        description: 'Error lesson extraction test',
        domain: 'testing'
      };

      const outcome = await loop.execute(task);

      expect(outcome.success).toBe(false);
      // Should have extracted lessons from the error
      expect(outcome.logs).toBeDefined();

      mockClaudeFlow.workflow_execute = originalExecute;
    }, 30000);
  });

  describe('Configuration', () => {
    it('should respect custom configuration', async () => {
      const customLoop = new AutonomousLearningLoop(
        mockClaudeFlow as any,
        mockClaudeClient as any,
        mockShadowCache as any,
        undefined,
        undefined,
        {
          maxExperiencesPerQuery: 5,
          generateAlternativePlans: false,
          enableMonitoring: false
        }
      );

      const task: Task = {
        id: 'test_014',
        description: 'Custom config test',
        domain: 'testing'
      };

      const outcome = await customLoop.execute(task);

      expect(outcome.success).toBe(true);
    }, 30000);
  });

  describe('Performance', () => {
    it('should complete execution within reasonable time', async () => {
      const task: Task = {
        id: 'test_015',
        description: 'Performance test',
        domain: 'testing'
      };

      const startTime = Date.now();
      const outcome = await loop.execute(task);
      const duration = Date.now() - startTime;

      expect(outcome.success).toBe(true);
      expect(duration).toBeLessThan(30000); // 30 seconds max
    }, 30000);

    it('should handle concurrent executions', async () => {
      const tasks: Task[] = [
        { id: 'test_016_1', description: 'Concurrent test 1', domain: 'testing' },
        { id: 'test_016_2', description: 'Concurrent test 2', domain: 'testing' }
      ];

      const results = await Promise.all(
        tasks.map(task => loop.execute(task))
      );

      results.forEach(outcome => {
        expect(outcome.success).toBe(true);
      });
    }, 60000);
  });
});

describe('Integration with Weaver', () => {
  it('should integrate with shadow cache for note retrieval', async () => {
    const loop = new AutonomousLearningLoop(
      mockClaudeFlow as any,
      mockClaudeClient as any,
      mockShadowCache as any
    );

    const task: Task = {
      id: 'integration_001',
      description: 'Shadow cache integration test',
      domain: 'testing'
    };

    const outcome = await loop.execute(task);

    expect(outcome.success).toBe(true);
    // Should have queried shadow cache
    expect(outcome.logs.some(log => log.includes('Context gathered'))).toBe(true);
  }, 30000);

  it('should integrate with Claude-Flow memory for experiences', async () => {
    const loop = new AutonomousLearningLoop(
      mockClaudeFlow as any,
      mockClaudeClient as any,
      mockShadowCache as any
    );

    const task: Task = {
      id: 'integration_002',
      description: 'Claude-Flow memory integration test',
      domain: 'testing'
    };

    const outcome = await loop.execute(task);

    expect(outcome.success).toBe(true);
    // Should have stored in memory
    expect(outcome.logs.some(log => log.includes('Experience stored'))).toBe(true);
  }, 30000);
});
