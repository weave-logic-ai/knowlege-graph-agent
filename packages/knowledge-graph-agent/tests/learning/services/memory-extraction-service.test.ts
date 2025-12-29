/**
 * Tests for MemoryExtractionService
 *
 * @module learning/services/__tests__/memory-extraction-service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MemoryExtractionService,
  createMemoryExtractionService,
} from '../../../src/learning/services/memory-extraction-service.js';
import { MemoryType, type TaskResult } from '../../../src/learning/types.js';

/**
 * Create a mock task result for testing
 */
function createMockTaskResult(overrides: Partial<TaskResult> = {}): TaskResult {
  return {
    taskId: 'task-123',
    description: 'Implement user authentication',
    agentId: 'agent-456',
    agentType: 'coder',
    success: true,
    output: 'Successfully implemented authentication with JWT tokens.',
    steps: [
      {
        id: 'step-1',
        description: 'Analyze requirements',
        action: 'analyze',
        success: true,
        durationMs: 1000,
        timestamp: new Date(),
      },
      {
        id: 'step-2',
        description: 'Implement JWT middleware',
        action: 'implement',
        success: true,
        durationMs: 5000,
        timestamp: new Date(),
      },
    ],
    codeChanges: [
      {
        filePath: 'src/auth/middleware.ts',
        changeType: 'create',
        linesAdded: 50,
        linesRemoved: 0,
        language: 'typescript',
        description: 'Created JWT middleware',
      },
    ],
    context: {
      workingDirectory: '/project',
      projectType: 'nodejs',
      sessionId: 'session-789',
    },
    startTime: new Date(Date.now() - 10000),
    endTime: new Date(),
    durationMs: 10000,
    qualityScore: 0.85,
    ...overrides,
  };
}

describe('MemoryExtractionService', () => {
  let service: MemoryExtractionService;

  beforeEach(() => {
    service = createMemoryExtractionService();
  });

  describe('constructor', () => {
    it('should create a service with default config', () => {
      expect(service).toBeInstanceOf(MemoryExtractionService);
    });

    it('should create a service with custom config', () => {
      const custom = createMemoryExtractionService({
        minConfidence: 0.7,
        maxContentLength: 1000,
      });
      expect(custom).toBeInstanceOf(MemoryExtractionService);
    });
  });

  describe('extractFromTask', () => {
    it('should extract memories from a task result', async () => {
      const result = createMockTaskResult();
      const memories = await service.extractFromTask(result);

      expect(memories.length).toBeGreaterThan(0);
    });

    it('should extract episodic memory', async () => {
      const result = createMockTaskResult();
      const memories = await service.extractFromTask(result);

      const episodic = memories.find(m => m.type === MemoryType.EPISODIC);
      expect(episodic).toBeDefined();
      expect(episodic?.source).toBe('task-123');
      expect(episodic?.metadata.success).toBe(true);
    });

    it('should extract procedural memory when steps are present', async () => {
      const result = createMockTaskResult();
      const memories = await service.extractFromTask(result);

      const procedural = memories.find(m => m.type === MemoryType.PROCEDURAL);
      expect(procedural).toBeDefined();
      expect(procedural?.content).toContain('Procedure');
    });

    it('should not extract procedural memory when no steps', async () => {
      const result = createMockTaskResult({ steps: undefined });
      const memories = await service.extractFromTask(result);

      const procedural = memories.find(m => m.type === MemoryType.PROCEDURAL);
      expect(procedural).toBeUndefined();
    });

    it('should extract technical memory when code changes are present', async () => {
      const result = createMockTaskResult();
      const memories = await service.extractFromTask(result);

      const technical = memories.filter(m => m.type === MemoryType.TECHNICAL);
      expect(technical.length).toBeGreaterThan(0);
    });

    it('should extract context memory', async () => {
      const result = createMockTaskResult();
      const memories = await service.extractFromTask(result);

      const context = memories.find(m => m.type === MemoryType.CONTEXT);
      expect(context).toBeDefined();
      expect(context?.metadata.workingDirectory).toBe('/project');
    });

    it('should filter memories below confidence threshold', async () => {
      const service = createMemoryExtractionService({ minConfidence: 0.9 });
      const result = createMockTaskResult({ success: false, qualityScore: undefined });
      const memories = await service.extractFromTask(result);

      // All memories should have confidence >= 0.9
      for (const memory of memories) {
        expect(memory.confidence).toBeGreaterThanOrEqual(0.9);
      }
    });

    it('should include task ID in all memories', async () => {
      const result = createMockTaskResult();
      const memories = await service.extractFromTask(result);

      for (const memory of memories) {
        expect(memory.source).toBe('task-123');
      }
    });

    it('should assign unique IDs to memories', async () => {
      const result = createMockTaskResult();
      const memories = await service.extractFromTask(result);

      const ids = new Set(memories.map(m => m.id));
      expect(ids.size).toBe(memories.length);
    });

    it('should handle failed tasks', async () => {
      const result = createMockTaskResult({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Failed to create token',
        },
      });
      const memories = await service.extractFromTask(result);

      const episodic = memories.find(m => m.type === MemoryType.EPISODIC);
      expect(episodic?.content).toContain('failed');
      expect(episodic?.tags).toContain('failure');
    });

    it('should extract semantic memories from findings in output', async () => {
      const result = createMockTaskResult({
        output: 'Found that JWT tokens should be refreshed every 15 minutes. Discovered a vulnerability in the old implementation.',
      });
      const memories = await service.extractFromTask(result);

      const semantic = memories.filter(m => m.type === MemoryType.SEMANTIC);
      expect(semantic.length).toBeGreaterThan(0);
    });

    it('should identify code patterns', async () => {
      const result = createMockTaskResult({
        codeChanges: [
          { filePath: 'src/a.ts', changeType: 'create', linesAdded: 100, linesRemoved: 0, language: 'typescript' },
          { filePath: 'src/b.ts', changeType: 'create', linesAdded: 50, linesRemoved: 0, language: 'typescript' },
          { filePath: 'src/c.ts', changeType: 'create', linesAdded: 75, linesRemoved: 0, language: 'typescript' },
        ],
      });
      const memories = await service.extractFromTask(result);

      const technical = memories.filter(m => m.type === MemoryType.TECHNICAL);
      const featureAddition = technical.find(m => m.metadata.patternType === 'feature-addition');
      expect(featureAddition).toBeDefined();
    });

    it('should truncate long content', async () => {
      const service = createMemoryExtractionService({ maxContentLength: 100 });
      const longOutput = 'A'.repeat(500);
      const result = createMockTaskResult({ output: longOutput });

      const memories = await service.extractFromTask(result);
      const episodic = memories.find(m => m.type === MemoryType.EPISODIC);

      expect(episodic?.content.length).toBeLessThanOrEqual(100);
    });
  });

  describe('memory metadata', () => {
    it('should include agent type in metadata', async () => {
      const result = createMockTaskResult();
      const memories = await service.extractFromTask(result);

      for (const memory of memories) {
        expect(memory.metadata.agentType).toBe('coder');
      }
    });

    it('should include duration in episodic memory', async () => {
      const result = createMockTaskResult({ durationMs: 5000 });
      const memories = await service.extractFromTask(result);

      const episodic = memories.find(m => m.type === MemoryType.EPISODIC);
      expect(episodic?.metadata.durationMs).toBe(5000);
    });

    it('should include quality score when present', async () => {
      const result = createMockTaskResult({ qualityScore: 0.92 });
      const memories = await service.extractFromTask(result);

      const episodic = memories.find(m => m.type === MemoryType.EPISODIC);
      expect(episodic?.metadata.qualityScore).toBe(0.92);
    });
  });

  describe('memory tags', () => {
    it('should include agent type as tag', async () => {
      const result = createMockTaskResult();
      const memories = await service.extractFromTask(result);

      const episodic = memories.find(m => m.type === MemoryType.EPISODIC);
      expect(episodic?.tags).toContain('coder');
    });

    it('should include success/failure tag', async () => {
      const successResult = createMockTaskResult({ success: true });
      const failureResult = createMockTaskResult({ success: false });

      const successMemories = await service.extractFromTask(successResult);
      const failureMemories = await service.extractFromTask(failureResult);

      expect(successMemories.find(m => m.type === MemoryType.EPISODIC)?.tags).toContain('success');
      expect(failureMemories.find(m => m.type === MemoryType.EPISODIC)?.tags).toContain('failure');
    });

    it('should include quality tags', async () => {
      const highQuality = createMockTaskResult({ qualityScore: 0.95 });
      const lowQuality = createMockTaskResult({ qualityScore: 0.3 });

      const highMemories = await service.extractFromTask(highQuality);
      const lowMemories = await service.extractFromTask(lowQuality);

      expect(highMemories.find(m => m.type === MemoryType.EPISODIC)?.tags).toContain('high-quality');
      expect(lowMemories.find(m => m.type === MemoryType.EPISODIC)?.tags).toContain('low-quality');
    });
  });
});
