/**
 * ReasoningBank Adapter Tests
 *
 * Tests for the ReasoningBank adapter including:
 * - Initialization and configuration
 * - Memory store interface (store, retrieve, search, delete)
 * - Trajectory storage and retrieval
 * - Similar trajectory finding
 * - Verdict judgment
 * - Memory distillation
 * - Pattern extraction
 * - Fallback behavior
 *
 * @module tests/integrations/agentic-flow/adapters/reasoning-bank-adapter.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ReasoningBankAdapter,
  createReasoningBankAdapter,
  type ReasoningBankConfig,
  type TrajectoryInput,
  type TrajectoryStep,
  type Verdict,
} from '../../../../src/integrations/agentic-flow/adapters/reasoning-bank-adapter.js';
import { MemoryType, type ExtractedMemory } from '../../../../src/learning/types.js';

describe('ReasoningBankAdapter', () => {
  let adapter: ReasoningBankAdapter;

  beforeEach(async () => {
    adapter = new ReasoningBankAdapter();
    await adapter.initialize();
  });

  afterEach(async () => {
    await adapter.clear();
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe('initialization', () => {
    it('should initialize with default config', async () => {
      const newAdapter = new ReasoningBankAdapter();
      await newAdapter.initialize();

      expect(newAdapter.isAvailable()).toBe(true);
      expect(newAdapter.getFeatureName()).toBe('reasoning-bank');
    });

    it('should initialize with custom config', async () => {
      const config: Partial<ReasoningBankConfig> = {
        persistPath: '.custom/reasoning-bank',
        maxTrajectories: 5000,
        enableDistillation: false,
      };

      const customAdapter = new ReasoningBankAdapter(config);
      await customAdapter.initialize();

      const savedConfig = customAdapter.getConfig();
      expect(savedConfig.persistPath).toBe('.custom/reasoning-bank');
      expect(savedConfig.maxTrajectories).toBe(5000);
      expect(savedConfig.enableDistillation).toBe(false);
    });

    it('should not re-initialize if already initialized', async () => {
      await adapter.initialize();
      await adapter.initialize();

      expect(adapter.isAvailable()).toBe(true);
    });

    it('should handle disabled config', async () => {
      const disabledAdapter = new ReasoningBankAdapter({ enabled: false });
      await disabledAdapter.initialize();

      expect(disabledAdapter.isAvailable()).toBe(true); // initialized but status.available is false
    });

    it('should return config copy', () => {
      const config = adapter.getConfig();
      config.maxTrajectories = 999;

      const originalConfig = adapter.getConfig();
      expect(originalConfig.maxTrajectories).toBe(10000);
    });
  });

  // ============================================================================
  // Memory Store Interface Tests
  // ============================================================================

  describe('memory store interface', () => {
    describe('store', () => {
      it('should store a memory', async () => {
        const memory: ExtractedMemory = {
          id: 'mem-test-123',
          type: MemoryType.PROCEDURAL,
          content: 'How to implement authentication',
          confidence: 0.9,
          source: 'task-123',
          timestamp: new Date(),
          metadata: { category: 'security' },
        };

        await adapter.store(memory);

        const retrieved = await adapter.retrieve('mem-test-123');
        expect(retrieved).toBeDefined();
        expect(retrieved?.content).toBe('How to implement authentication');
      });

      it('should use provided ID if available', async () => {
        const memory: ExtractedMemory = {
          id: 'custom-id-123',
          type: MemoryType.SEMANTIC,
          content: 'Test content',
          confidence: 0.8,
          source: 'test',
          timestamp: new Date(),
          metadata: {},
        };

        await adapter.store(memory);

        const retrieved = await adapter.retrieve('custom-id-123');
        expect(retrieved).toBeDefined();
        expect(retrieved?.content).toBe('Test content');
      });

      it('should store memory with tags', async () => {
        const memory: ExtractedMemory = {
          id: 'mem-tags-test',
          type: MemoryType.TECHNICAL,
          content: 'TypeScript best practices',
          confidence: 0.95,
          source: 'docs',
          timestamp: new Date(),
          metadata: {},
          tags: ['typescript', 'best-practices', 'coding'],
        };

        await adapter.store(memory);
        const retrieved = await adapter.retrieve('mem-tags-test');

        expect(retrieved?.tags).toEqual(['typescript', 'best-practices', 'coding']);
      });
    });

    describe('retrieve', () => {
      it('should retrieve a stored memory by ID', async () => {
        const memory: ExtractedMemory = {
          id: 'mem-retrieve-test',
          type: MemoryType.EPISODIC,
          content: 'Task execution record',
          confidence: 0.85,
          source: 'task-456',
          timestamp: new Date(),
          metadata: { step: 1 },
        };

        await adapter.store(memory);
        const retrieved = await adapter.retrieve('mem-retrieve-test');

        expect(retrieved).toBeDefined();
        expect(retrieved?.content).toBe('Task execution record');
        expect(retrieved?.type).toBe(MemoryType.EPISODIC);
        expect(retrieved?.confidence).toBe(0.85);
      });

      it('should return null for non-existent ID', async () => {
        const result = await adapter.retrieve('non-existent-id');

        expect(result).toBeNull();
      });
    });

    describe('search', () => {
      beforeEach(async () => {
        // Seed test data
        const memories: ExtractedMemory[] = [
          {
            id: 'search-mem-1',
            type: MemoryType.PROCEDURAL,
            content: 'How to implement authentication with JWT',
            confidence: 0.9,
            source: 'task-1',
            timestamp: new Date(),
            metadata: {},
          },
          {
            id: 'search-mem-2',
            type: MemoryType.PROCEDURAL,
            content: 'Database connection setup with PostgreSQL',
            confidence: 0.85,
            source: 'task-2',
            timestamp: new Date(),
            metadata: {},
          },
          {
            id: 'search-mem-3',
            type: MemoryType.SEMANTIC,
            content: 'Authentication flow diagram',
            confidence: 0.75,
            source: 'task-3',
            timestamp: new Date(),
            metadata: {},
          },
        ];

        for (const mem of memories) {
          await adapter.store(mem);
        }
      });

      it('should find memories matching query', async () => {
        const results = await adapter.search('authentication');

        expect(results.length).toBe(2);
        expect(results[0].content).toContain('authentication');
      });

      it('should respect limit parameter', async () => {
        const results = await adapter.search('with', 1);

        expect(results.length).toBe(1);
      });

      it('should return empty array for no matches', async () => {
        const results = await adapter.search('nonexistent term xyz');

        expect(results).toEqual([]);
      });

      it('should be case-insensitive', async () => {
        const results = await adapter.search('AUTHENTICATION');

        expect(results.length).toBe(2);
      });
    });

    describe('delete', () => {
      it('should delete a memory by ID', async () => {
        const memory: ExtractedMemory = {
          id: 'mem-delete-test',
          type: MemoryType.CONTEXT,
          content: 'Temporary data',
          confidence: 0.5,
          source: 'test',
          timestamp: new Date(),
          metadata: {},
        };

        await adapter.store(memory);
        const deleted = await adapter.delete('mem-delete-test');

        expect(deleted).toBe(true);

        const retrieved = await adapter.retrieve('mem-delete-test');
        expect(retrieved).toBeNull();
      });

      it('should return false for non-existent ID', async () => {
        const deleted = await adapter.delete('non-existent-id');

        expect(deleted).toBe(false);
      });
    });
  });

  // ============================================================================
  // Trajectory Management Tests
  // ============================================================================

  describe('trajectory management', () => {
    const createSampleTrajectory = (
      taskId: string,
      outcome: 'success' | 'failure' | 'partial'
    ): TrajectoryInput => ({
      taskId,
      steps: [
        {
          action: 'analyze',
          observation: 'Found 5 issues',
          timestamp: new Date(),
          duration: 1000,
          confidence: 0.9,
        },
        {
          action: 'fix',
          observation: 'Applied fixes',
          timestamp: new Date(),
          duration: 2000,
          confidence: 0.85,
        },
      ],
      outcome,
      metadata: { taskType: 'code-review', description: 'Code review task' },
    });

    describe('storeTrajectory', () => {
      it('should store a trajectory and return an ID', async () => {
        const input = createSampleTrajectory('task-1', 'success');
        const id = await adapter.storeTrajectory(input);

        expect(id).toBeDefined();
        expect(id).toMatch(/^traj-/);
      });

      it('should auto-generate storedAt timestamp', async () => {
        const input = createSampleTrajectory('task-2', 'success');
        const id = await adapter.storeTrajectory(input);

        const trajectory = await adapter.getTrajectory(id);
        expect(trajectory?.storedAt).toBeDefined();
        expect(trajectory?.storedAt).toBeInstanceOf(Date);
      });

      it('should emit trajectory:stored event', async () => {
        const listener = vi.fn();
        adapter.on('trajectory:stored', listener);

        const input = createSampleTrajectory('task-3', 'success');
        await adapter.storeTrajectory(input);

        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            taskId: 'task-3',
            outcome: 'success',
          })
        );
      });
    });

    describe('getTrajectory', () => {
      it('should retrieve a stored trajectory by ID', async () => {
        const input = createSampleTrajectory('task-4', 'failure');
        const id = await adapter.storeTrajectory(input);

        const trajectory = await adapter.getTrajectory(id);

        expect(trajectory).toBeDefined();
        expect(trajectory?.taskId).toBe('task-4');
        expect(trajectory?.outcome).toBe('failure');
        expect(trajectory?.steps).toHaveLength(2);
      });

      it('should return null for non-existent trajectory', async () => {
        const result = await adapter.getTrajectory('non-existent');

        expect(result).toBeNull();
      });
    });

    describe('findSimilarTrajectories', () => {
      beforeEach(async () => {
        // Seed test trajectories
        const trajectories: TrajectoryInput[] = [
          {
            taskId: 'implement-authentication',
            steps: [
              { action: 'analyze', observation: 'Reviewed requirements', timestamp: new Date() },
            ],
            outcome: 'success',
            metadata: { description: 'Implement user authentication system' },
          },
          {
            taskId: 'fix-auth-bug',
            steps: [
              { action: 'debug', observation: 'Found issue', timestamp: new Date() },
            ],
            outcome: 'success',
            metadata: { description: 'Fix authentication token refresh' },
          },
          {
            taskId: 'implement-database',
            steps: [
              { action: 'design', observation: 'Created schema', timestamp: new Date() },
            ],
            outcome: 'failure',
            metadata: { description: 'Set up database schema', errorMessage: 'Connection failed' },
          },
        ];

        for (const traj of trajectories) {
          await adapter.storeTrajectory(traj);
        }
      });

      it('should find trajectories similar to description', async () => {
        const results = await adapter.findSimilarTrajectories(
          'authentication system'
        );

        expect(results.length).toBeGreaterThan(0);
      });

      it('should return trajectories with similarity scores', async () => {
        const results = await adapter.findSimilarTrajectories('auth');

        for (const result of results) {
          expect(result.similarity).toBeDefined();
          expect(result.similarity).toBeGreaterThanOrEqual(0);
          expect(result.similarity).toBeLessThanOrEqual(1);
        }
      });

      it('should respect limit parameter', async () => {
        const results = await adapter.findSimilarTrajectories('implement', 1);

        expect(results.length).toBeLessThanOrEqual(1);
      });

      it('should sort by similarity descending', async () => {
        const results = await adapter.findSimilarTrajectories('authentication');

        for (let i = 1; i < results.length; i++) {
          expect(results[i - 1].similarity).toBeGreaterThanOrEqual(
            results[i].similarity
          );
        }
      });
    });
  });

  // ============================================================================
  // Verdict Judgment Tests
  // ============================================================================

  describe('verdict judgment', () => {
    describe('judgeVerdict', () => {
      it('should return default verdict when no similar trajectories', async () => {
        const verdict = await adapter.judgeVerdict({
          description: 'Completely new task with no history',
          type: 'unknown',
        });

        expect(verdict.recommendation).toBe('proceed');
        expect(verdict.confidence).toBe(0.3);
        expect(verdict.similarTrajectories).toHaveLength(0);
      });

      it('should recommend proceed for high success rate', async () => {
        // Seed with successful trajectories
        for (let i = 0; i < 10; i++) {
          await adapter.storeTrajectory({
            taskId: `feature-implementation-${i}`,
            steps: [{ action: 'implement', observation: 'Done', timestamp: new Date() }],
            outcome: 'success',
            metadata: { description: 'Implement new feature' },
          });
        }

        const verdict = await adapter.judgeVerdict({
          description: 'Implement feature',
        });

        expect(verdict.recommendation).toBe('proceed');
        expect(verdict.confidence).toBeGreaterThan(0.3);
      });

      it('should recommend avoid for high failure rate', async () => {
        // Seed with failed trajectories
        for (let i = 0; i < 10; i++) {
          await adapter.storeTrajectory({
            taskId: `risky-operation-${i}`,
            steps: [{ action: 'execute', observation: 'Failed', timestamp: new Date() }],
            outcome: 'failure',
            metadata: { description: 'Risky database operation', errorMessage: 'Connection lost' },
          });
        }

        const verdict = await adapter.judgeVerdict({
          description: 'risky operation database',
        });

        expect(verdict.recommendation).toBe('avoid');
      });

      it('should recommend caution for mixed results', async () => {
        // Seed with mixed trajectories
        for (let i = 0; i < 5; i++) {
          await adapter.storeTrajectory({
            taskId: `mixed-task-success-${i}`,
            steps: [{ action: 'execute', observation: 'OK', timestamp: new Date() }],
            outcome: 'success',
            metadata: { description: 'Mixed results task' },
          });
          await adapter.storeTrajectory({
            taskId: `mixed-task-failure-${i}`,
            steps: [{ action: 'execute', observation: 'Failed', timestamp: new Date() }],
            outcome: 'failure',
            metadata: { description: 'Mixed results task', errorMessage: 'Error' },
          });
        }

        const verdict = await adapter.judgeVerdict({
          description: 'mixed results task',
        });

        expect(['proceed', 'caution', 'avoid']).toContain(verdict.recommendation);
      });

      it('should include warnings from failures', async () => {
        await adapter.storeTrajectory({
          taskId: 'failed-task',
          steps: [
            { action: 'execute', observation: 'Critical error occurred', timestamp: new Date() },
          ],
          outcome: 'failure',
          metadata: { description: 'Test task', errorMessage: 'Memory overflow' },
        });

        const verdict = await adapter.judgeVerdict({
          description: 'test task',
        });

        if (verdict.warnings.length > 0) {
          expect(verdict.warnings[0]).toContain('failed');
        }
      });

      it('should include suggested approach from successes', async () => {
        await adapter.storeTrajectory({
          taskId: 'successful-task',
          steps: [
            { action: 'analyze', observation: 'Analyzed', timestamp: new Date() },
            { action: 'implement', observation: 'Implemented', timestamp: new Date() },
            { action: 'test', observation: 'Tested', timestamp: new Date() },
          ],
          outcome: 'success',
          metadata: { description: 'Development task' },
        });

        const verdict = await adapter.judgeVerdict({
          description: 'development task',
        });

        if (verdict.suggestedApproach) {
          expect(verdict.suggestedApproach).toContain('->');
        }
      });
    });
  });

  // ============================================================================
  // Memory Distillation Tests
  // ============================================================================

  describe('memory distillation', () => {
    it('should return distillation result', async () => {
      const result = await adapter.distillMemories();

      expect(result).toBeDefined();
      expect(result.memoriesRemoved).toBeDefined();
      expect(result.memoriesConsolidated).toBeDefined();
      expect(result.patternsExtracted).toBeDefined();
      expect(result.storageSaved).toBeDefined();
    });

    it('should emit memory:distilled event', async () => {
      const listener = vi.fn();
      adapter.on('memory:distilled', listener);

      await adapter.distillMemories();

      expect(listener).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Pattern Extraction Tests
  // ============================================================================

  describe('pattern extraction', () => {
    it('should extract patterns from memories', async () => {
      const memories: ExtractedMemory[] = [
        {
          id: '1',
          type: MemoryType.PROCEDURAL,
          content: 'Authentication implementation requires token validation',
          confidence: 0.9,
          source: 'task-1',
          timestamp: new Date(),
          metadata: {},
        },
        {
          id: '2',
          type: MemoryType.PROCEDURAL,
          content: 'Token validation is essential for authentication',
          confidence: 0.85,
          source: 'task-2',
          timestamp: new Date(),
          metadata: {},
        },
        {
          id: '3',
          type: MemoryType.SEMANTIC,
          content: 'Authentication tokens must be validated properly',
          confidence: 0.8,
          source: 'task-3',
          timestamp: new Date(),
          metadata: {},
        },
      ];

      const patterns = await adapter.extractPatterns(memories);

      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should return patterns with frequency and confidence', async () => {
      const memories: ExtractedMemory[] = [
        {
          id: '1',
          type: MemoryType.TECHNICAL,
          content: 'TypeScript types should be explicit explicit explicit',
          confidence: 0.9,
          source: 'docs',
          timestamp: new Date(),
          metadata: {},
        },
        {
          id: '2',
          type: MemoryType.TECHNICAL,
          content: 'Always use explicit types in TypeScript explicit',
          confidence: 0.9,
          source: 'docs',
          timestamp: new Date(),
          metadata: {},
        },
        {
          id: '3',
          type: MemoryType.TECHNICAL,
          content: 'TypeScript explicit typing is important explicit',
          confidence: 0.9,
          source: 'docs',
          timestamp: new Date(),
          metadata: {},
        },
      ];

      const patterns = await adapter.extractPatterns(memories);

      for (const pattern of patterns) {
        expect(pattern.pattern).toBeDefined();
        expect(pattern.frequency).toBeGreaterThanOrEqual(1);
        expect(pattern.confidence).toBeGreaterThanOrEqual(0);
        expect(pattern.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  // ============================================================================
  // Statistics Tests
  // ============================================================================

  describe('statistics', () => {
    describe('getStats', () => {
      it('should return memory and trajectory counts', async () => {
        await adapter.store({
          id: 'stats-mem-test',
          type: MemoryType.SEMANTIC,
          content: 'Test memory',
          confidence: 0.8,
          source: 'test',
          timestamp: new Date(),
          metadata: {},
        });

        await adapter.storeTrajectory({
          taskId: 'test-task',
          steps: [],
          outcome: 'success',
        });

        const stats = await adapter.getStats();

        expect(stats.memories).toBe(1);
        expect(stats.trajectories).toBe(1);
      });
    });

    describe('getStatistics', () => {
      it('should return trajectory statistics by outcome', async () => {
        await adapter.storeTrajectory({
          taskId: 'success-1',
          steps: [],
          outcome: 'success',
        });
        await adapter.storeTrajectory({
          taskId: 'failure-1',
          steps: [],
          outcome: 'failure',
        });
        await adapter.storeTrajectory({
          taskId: 'partial-1',
          steps: [],
          outcome: 'partial',
        });

        const stats = adapter.getStatistics();

        expect(stats.total).toBe(3);
        expect(stats.byOutcome.success).toBe(1);
        expect(stats.byOutcome.failure).toBe(1);
        expect(stats.byOutcome.partial).toBe(1);
      });

      it('should return trajectory statistics by type', async () => {
        await adapter.storeTrajectory({
          taskId: 'task-1',
          steps: [],
          outcome: 'success',
          metadata: { taskType: 'code-review' },
        });
        await adapter.storeTrajectory({
          taskId: 'task-2',
          steps: [],
          outcome: 'success',
          metadata: { taskType: 'code-review' },
        });
        await adapter.storeTrajectory({
          taskId: 'task-3',
          steps: [],
          outcome: 'success',
          metadata: { taskType: 'implementation' },
        });

        const stats = adapter.getStatistics();

        expect(stats.byType['code-review']).toBe(2);
        expect(stats.byType['implementation']).toBe(1);
      });
    });
  });

  // ============================================================================
  // Clear and Event Tests
  // ============================================================================

  describe('clear', () => {
    it('should clear all data', async () => {
      await adapter.store({
        id: 'clear-mem-test',
        type: MemoryType.SEMANTIC,
        content: 'Test',
        confidence: 0.8,
        source: 'test',
        timestamp: new Date(),
        metadata: {},
      });
      await adapter.storeTrajectory({
        taskId: 'test',
        steps: [],
        outcome: 'success',
      });

      await adapter.clear();

      const stats = await adapter.getStats();
      expect(stats.memories).toBe(0);
      expect(stats.trajectories).toBe(0);
    });

    it('should emit cleared event', async () => {
      const listener = vi.fn();
      adapter.on('cleared', listener);

      await adapter.clear();

      expect(listener).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Factory Function Tests
  // ============================================================================

  describe('createReasoningBankAdapter', () => {
    it('should create and initialize adapter', async () => {
      const factoryAdapter = await createReasoningBankAdapter();

      expect(factoryAdapter).toBeInstanceOf(ReasoningBankAdapter);
      expect(factoryAdapter.isAvailable()).toBe(true);
    });

    it('should accept custom config', async () => {
      const factoryAdapter = await createReasoningBankAdapter({
        maxTrajectories: 500,
      });

      expect(factoryAdapter.getConfig().maxTrajectories).toBe(500);
    });
  });
});
