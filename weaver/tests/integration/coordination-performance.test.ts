/**
 * Multi-Agent Coordination Performance Tests
 *
 * Ensures coordination overhead is <50ms as per acceptance criteria.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { MultiAgentCoordinator } from '../../src/agents/coordination';
import type { ExpertProfile } from '../../src/agents/coordination';

describe('Coordination Performance', () => {
  let coordinator: MultiAgentCoordinator;

  beforeEach(() => {
    coordinator = new MultiAgentCoordinator();

    // Register 10 experts for performance testing
    for (let i = 1; i <= 10; i++) {
      const expert: ExpertProfile = {
        id: `expert-${i}`,
        type: i % 2 === 0 ? 'coder' : 'tester',
        capabilities: [
          { name: `capability-${i}`, level: 0.8 + Math.random() * 0.2 },
          { name: 'general', level: 0.7 },
        ],
        status: 'idle',
        load: 0,
        maxConcurrentTasks: 5,
        currentTasks: [],
        metadata: {},
      };
      coordinator.registerExpert(expert);
    }
  });

  describe('expert registry performance', () => {
    it('should register expert in <5ms', () => {
      const expert: ExpertProfile = {
        id: 'perf-expert',
        type: 'coder',
        capabilities: [{ name: 'typescript', level: 0.9 }],
        status: 'idle',
        load: 0,
        maxConcurrentTasks: 5,
        currentTasks: [],
        metadata: {},
      };

      const start = performance.now();
      coordinator.registerExpert(expert);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5);
    });

    it('should find experts in <10ms', () => {
      const start = performance.now();
      coordinator.registry.findExperts([
        { capability: 'general', minLevel: 0.7 },
      ]);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10);
    });
  });

  describe('task routing performance', () => {
    it('should route task in <50ms', async () => {
      const start = performance.now();

      await coordinator.routeTask({
        taskId: 'perf-task-1',
        requirements: [{ capability: 'general' }],
        priority: 'high',
      });

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it('should route with decomposition in <50ms', async () => {
      const start = performance.now();

      await coordinator.routeTask({
        taskId: 'perf-task-2',
        requirements: [
          { capability: 'capability-1', required: true },
          { capability: 'capability-2', required: true },
        ],
        priority: 'high',
        maxExperts: 5,
      });

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it('should handle 100 sequential tasks efficiently', async () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        await coordinator.routeTask({
          taskId: `batch-task-${i}`,
          requirements: [{ capability: 'general' }],
          priority: 'medium',
        });
      }

      const duration = performance.now() - start;
      const avgPerTask = duration / 100;

      console.log(`Average routing time: ${avgPerTask.toFixed(2)}ms`);
      expect(avgPerTask).toBeLessThan(50);
    });
  });

  describe('message bus performance', () => {
    it('should publish message in <5ms', async () => {
      const start = performance.now();

      await coordinator.publishMessage('test.topic', { data: 'test' });

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(5);
    });

    it('should handle 1000 messages efficiently', async () => {
      const start = performance.now();

      const promises = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(
          coordinator.publishMessage('perf.test', { index: i })
        );
      }

      await Promise.all(promises);

      const duration = performance.now() - start;
      const avgPerMessage = duration / 1000;

      console.log(`Average message publish time: ${avgPerMessage.toFixed(2)}ms`);
      expect(avgPerMessage).toBeLessThan(10);
    });
  });

  describe('consensus performance', () => {
    it('should start vote in <5ms', async () => {
      const start = performance.now();

      await coordinator.startVote({
        id: 'perf-vote',
        question: 'Test?',
        options: ['yes', 'no'],
        voters: ['expert-1', 'expert-2'],
        mode: 'majority',
      });

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(5);
    });

    it('should cast vote in <5ms', async () => {
      await coordinator.startVote({
        id: 'perf-vote-2',
        question: 'Test?',
        options: ['yes', 'no'],
        voters: ['expert-1', 'expert-2'],
        mode: 'majority',
      });

      const start = performance.now();
      await coordinator.vote('perf-vote-2', 'expert-1', 'yes');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5);
    });

    it('should complete vote quickly', async () => {
      const voteId = await coordinator.startVote({
        id: 'perf-vote-3',
        question: 'Test?',
        options: ['yes', 'no'],
        voters: ['expert-1', 'expert-2', 'expert-3'],
        mode: 'majority',
      });

      const start = performance.now();

      await coordinator.vote(voteId, 'expert-1', 'yes');
      await coordinator.vote(voteId, 'expert-2', 'yes');
      await coordinator.vote(voteId, 'expert-3', 'no');

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(20);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent task routing', async () => {
      const start = performance.now();

      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          coordinator.routeTask({
            taskId: `concurrent-task-${i}`,
            requirements: [{ capability: 'general' }],
            priority: 'medium',
          })
        );
      }

      await Promise.all(promises);

      const duration = performance.now() - start;
      const avgPerTask = duration / 50;

      console.log(`Concurrent routing avg: ${avgPerTask.toFixed(2)}ms`);
      expect(avgPerTask).toBeLessThan(50);
    });

    it('should handle mixed operations concurrently', async () => {
      const start = performance.now();

      await Promise.all([
        // Route tasks
        ...Array.from({ length: 20 }, (_, i) =>
          coordinator.routeTask({
            taskId: `mixed-task-${i}`,
            requirements: [{ capability: 'general' }],
            priority: 'medium',
          })
        ),
        // Publish messages
        ...Array.from({ length: 20 }, (_, i) =>
          coordinator.publishMessage('mixed.test', { index: i })
        ),
        // Start votes
        ...Array.from({ length: 10 }, (_, i) =>
          coordinator.startVote({
            id: `mixed-vote-${i}`,
            question: `Test ${i}?`,
            options: ['yes', 'no'],
            voters: ['expert-1', 'expert-2'],
            mode: 'majority',
          })
        ),
      ]);

      const duration = performance.now() - start;
      const avgPerOperation = duration / 50;

      console.log(`Mixed operations avg: ${avgPerOperation.toFixed(2)}ms`);
      expect(avgPerOperation).toBeLessThan(50);
    });
  });

  describe('memory efficiency', () => {
    it('should not leak memory with repeated operations', async () => {
      const memBefore = process.memoryUsage().heapUsed;

      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        await coordinator.routeTask({
          taskId: `mem-task-${i}`,
          requirements: [{ capability: 'general' }],
          priority: 'medium',
        });

        await coordinator.publishMessage('mem.test', { index: i });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const memAfter = process.memoryUsage().heapUsed;
      const memIncrease = memAfter - memBefore;
      const memIncreaseM = memIncrease / 1024 / 1024;

      console.log(`Memory increase: ${memIncreaseM.toFixed(2)}MB`);
      expect(memIncreaseM).toBeLessThan(50); // <50MB increase for 1000 operations
    });
  });

  describe('overall coordination overhead', () => {
    it('should maintain <50ms coordination overhead', async () => {
      const start = performance.now();

      // Complete workflow: route → message → vote
      const routing = await coordinator.routeTask({
        taskId: 'overhead-task',
        requirements: [{ capability: 'general' }],
        priority: 'high',
      });

      await coordinator.publishMessage('overhead.test', {
        taskId: 'overhead-task',
        routing,
      });

      const voteId = await coordinator.startVote({
        id: 'overhead-vote',
        question: 'Approve task?',
        options: ['approve', 'reject'],
        voters: routing.assignedExperts,
        mode: 'majority',
      });

      await coordinator.vote(voteId, routing.assignedExperts[0], 'approve');

      const duration = performance.now() - start;

      console.log(`Total coordination overhead: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });
  });
});
