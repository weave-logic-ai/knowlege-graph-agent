/**
 * Learning Orchestrator Tests
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { LearningOrchestrator } from '../../src/learning-loop/learning-orchestrator';
import { PerceptionManager } from '../../src/perception/perception-manager';

describe('LearningOrchestrator', () => {
  let orchestrator: LearningOrchestrator;
  let perceptionManager: PerceptionManager;

  beforeAll(() => {
    perceptionManager = new PerceptionManager({
      searchAPI: {
        enabled: true,
        providers: [
          { name: 'duckduckgo', enabled: true, priority: 1 },
        ],
        maxResults: 5,
      },
    });

    orchestrator = new LearningOrchestrator(perceptionManager, {
      enablePerception: true,
      enableReasoning: true,
      enableMemory: true,
      enableExecution: true,
    });
  });

  it('should create orchestrator instance', () => {
    expect(orchestrator).toBeDefined();
  });

  it('should execute complete learning loop', async () => {
    const result = await orchestrator.learn({
      query: 'test query',
      goals: ['Learn about testing'],
    });

    expect(result).toBeDefined();
    expect(result.perception).toBeDefined();
    expect(result.reasoning).toBeDefined();
    expect(result.memory).toBeDefined();
    expect(result.execution).toBeDefined();
    expect(result.metadata).toBeDefined();
  });

  it('should handle disabled pillars', async () => {
    const minimalOrchestrator = new LearningOrchestrator(perceptionManager, {
      enablePerception: false,
      enableReasoning: false,
      enableMemory: false,
      enableExecution: false,
    });

    const result = await minimalOrchestrator.learn({
      query: 'test query',
    });

    expect(result.perception.totalResults).toBe(0);
    expect(result.reasoning.insights).toHaveLength(0);
    expect(result.memory.totalChunks).toBe(0);
    expect(result.execution.actions).toHaveLength(0);
  });

  it('should calculate confidence scores', async () => {
    const result = await orchestrator.learn({
      query: 'test query',
    });

    expect(result.metadata.confidence).toBeGreaterThanOrEqual(0);
    expect(result.metadata.confidence).toBeLessThanOrEqual(1);
  });

  it('should extract learning signals', async () => {
    const result = await orchestrator.learn({
      query: 'test query',
    });

    expect(Array.isArray(result.metadata.learningSignals)).toBe(true);
  });

  it('should track processing time', async () => {
    const result = await orchestrator.learn({
      query: 'test query',
    });

    expect(result.metadata.processingTime).toBeGreaterThan(0);
  });
});
