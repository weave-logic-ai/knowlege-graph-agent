/**
 * Model Router Adapter Tests
 *
 * Tests for SPEC-010b Multi-Model Router implementation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ModelRouterAdapter,
  createModelRouterAdapter,
  MODEL_REGISTRY,
  type ModelRouterConfig,
  type TaskRequirements,
  type ModelInfo,
} from '../../../../src/integrations/agentic-flow/adapters/model-router-adapter.js';
import { AgentType } from '../../../../src/agents/types.js';

describe('ModelRouterAdapter', () => {
  let adapter: ModelRouterAdapter;

  beforeEach(async () => {
    adapter = new ModelRouterAdapter({
      providers: ['anthropic', 'openrouter', 'google', 'openai'],
      costOptimization: true,
      qualityThreshold: 0.7,
      fallbackModel: 'claude-3-haiku',
      maxCostPerTask: 0.05,
    });
    await adapter.initialize();
  });

  describe('initialization', () => {
    it('should initialize successfully', () => {
      expect(adapter.isAvailable()).toBe(true);
      expect(adapter.getFeatureName()).toBe('model-router');
    });

    it('should have available models after initialization', () => {
      const models = adapter.getAvailableModels();
      expect(models.length).toBeGreaterThan(0);
    });

    it('should filter models by configured providers', async () => {
      const restrictedAdapter = new ModelRouterAdapter({
        providers: ['anthropic'],
      });
      await restrictedAdapter.initialize();

      const models = restrictedAdapter.getAvailableModels();
      expect(models.every((m) => m.provider === 'anthropic')).toBe(true);
    });
  });

  describe('route()', () => {
    it('should route to appropriate model for code generation', async () => {
      const requirements: TaskRequirements = {
        capabilities: ['codeGeneration'],
        maxCost: 0.05,
        minQuality: 0.8,
        preferLocal: false,
        estimatedTokens: 1000,
      };

      const decision = await adapter.route(requirements);

      expect(decision.model).toBeDefined();
      expect(decision.model.capabilities.codeGeneration).toBe(true);
      expect(decision.reason).toBeTruthy();
      expect(decision.estimatedCost).toBeLessThanOrEqual(requirements.maxCost);
    });

    it('should route to appropriate model for reasoning tasks', async () => {
      const requirements: TaskRequirements = {
        capabilities: ['reasoning'],
        maxCost: 0.1,
        minQuality: 0.85,
        preferLocal: false,
        estimatedTokens: 2000,
      };

      const decision = await adapter.route(requirements);

      expect(decision.model).toBeDefined();
      expect(decision.model.capabilities.reasoning).toBe(true);
      expect(decision.model.capabilities.qualityScore).toBeGreaterThanOrEqual(
        requirements.minQuality
      );
    });

    it('should filter out models that do not meet quality threshold', async () => {
      const requirements: TaskRequirements = {
        capabilities: [],
        maxCost: 1.0,
        minQuality: 0.95, // Very high quality requirement
        preferLocal: false,
        estimatedTokens: 1000,
      };

      const decision = await adapter.route(requirements);

      // Should select a high-quality model (Opus or Sonnet)
      expect(decision.model.capabilities.qualityScore).toBeGreaterThanOrEqual(
        0.95
      );
    });

    it('should filter out models that exceed cost limit', async () => {
      const requirements: TaskRequirements = {
        capabilities: [],
        maxCost: 0.001, // Very low cost limit
        minQuality: 0.7,
        preferLocal: false,
        estimatedTokens: 1000,
      };

      const decision = await adapter.route(requirements);

      // Should select a cheap model (Haiku, Gemini Flash, or local)
      expect(decision.estimatedCost).toBeLessThanOrEqual(0.001);
    });

    it('should provide alternative models', async () => {
      const requirements: TaskRequirements = {
        capabilities: ['codeGeneration'],
        maxCost: 0.05,
        minQuality: 0.7,
        preferLocal: false,
        estimatedTokens: 1000,
      };

      const decision = await adapter.route(requirements);

      expect(decision.alternativeModels).toBeDefined();
      expect(decision.alternativeModels.length).toBeLessThanOrEqual(3);
    });

    it('should use fallback when no models meet requirements', async () => {
      const requirements: TaskRequirements = {
        capabilities: ['impossibleCapability' as keyof ModelInfo['capabilities']],
        maxCost: 0.0001,
        minQuality: 0.99,
        preferLocal: false,
        estimatedTokens: 10000,
      };

      const decision = await adapter.route(requirements);

      expect(decision.reason).toContain('fallback');
    });
  });

  describe('routeForAgent()', () => {
    it('should route CODER agent appropriately', async () => {
      const decision = await adapter.routeForAgent(AgentType.CODER, 2000);

      expect(decision.model).toBeDefined();
      expect(decision.model.capabilities.codeGeneration).toBe(true);
    });

    it('should route REVIEWER agent appropriately', async () => {
      const decision = await adapter.routeForAgent(AgentType.REVIEWER, 1500);

      expect(decision.model).toBeDefined();
      expect(decision.model.capabilities.codeAnalysis).toBe(true);
    });

    it('should route TESTER agent appropriately', async () => {
      const decision = await adapter.routeForAgent(AgentType.TESTER, 1000);

      expect(decision.model).toBeDefined();
      expect(decision.model.capabilities.codeGeneration).toBe(true);
      expect(decision.model.capabilities.codeAnalysis).toBe(true);
    });

    it('should route DOCUMENTER agent appropriately', async () => {
      const decision = await adapter.routeForAgent(AgentType.DOCUMENTER, 1000);

      expect(decision.model).toBeDefined();
      expect(decision.model.capabilities.textGeneration).toBe(true);
    });

    it('should route PLANNER agent appropriately', async () => {
      const decision = await adapter.routeForAgent(AgentType.PLANNER, 1000);

      expect(decision.model).toBeDefined();
      expect(decision.model.capabilities.reasoning).toBe(true);
    });

    it('should route RESEARCHER agent appropriately', async () => {
      const decision = await adapter.routeForAgent(AgentType.RESEARCHER, 2000);

      expect(decision.model).toBeDefined();
      expect(decision.model.capabilities.reasoning).toBe(true);
    });

    it('should route ANALYST agent appropriately', async () => {
      const decision = await adapter.routeForAgent(AgentType.ANALYST, 1500);

      expect(decision.model).toBeDefined();
      expect(decision.model.capabilities.reasoning).toBe(true);
    });

    it('should route ARCHITECT agent appropriately', async () => {
      const decision = await adapter.routeForAgent(AgentType.ARCHITECT, 3000);

      expect(decision.model).toBeDefined();
      // Architect needs high quality for complex design decisions
      expect(decision.model.capabilities.qualityScore).toBeGreaterThanOrEqual(0.9);
    });

    it('should route OPTIMIZER agent appropriately', async () => {
      const decision = await adapter.routeForAgent(AgentType.OPTIMIZER, 1000);

      expect(decision.model).toBeDefined();
      expect(decision.model.capabilities.codeAnalysis).toBe(true);
    });

    it('should route COORDINATOR agent appropriately', async () => {
      const decision = await adapter.routeForAgent(AgentType.COORDINATOR, 500);

      expect(decision.model).toBeDefined();
      expect(decision.model.capabilities.reasoning).toBe(true);
    });
  });

  describe('cost optimization', () => {
    it('should prefer cheaper models when quality requirements are low', async () => {
      // When quality requirements are high, only expensive models qualify
      const highQualityRequirements: TaskRequirements = {
        capabilities: [],
        maxCost: 0.1,
        minQuality: 0.95, // Only Opus meets this
        preferLocal: false,
        estimatedTokens: 1000,
      };

      const highQualityDecision = await adapter.route(highQualityRequirements);

      // High quality requirement forces selection of expensive model
      expect(highQualityDecision.model.capabilities.qualityScore).toBeGreaterThanOrEqual(0.95);

      // When quality requirements are lower, cheaper models can be selected
      const lowQualityRequirements: TaskRequirements = {
        capabilities: [],
        maxCost: 0.001, // Very tight budget
        minQuality: 0.7,
        preferLocal: false,
        estimatedTokens: 1000,
      };

      const lowQualityDecision = await adapter.route(lowQualityRequirements);

      // Low quality + tight budget should select a cheaper model
      expect(lowQualityDecision.estimatedCost).toBeLessThan(highQualityDecision.estimatedCost);
    });

    it('should calculate estimated cost correctly', async () => {
      const requirements: TaskRequirements = {
        capabilities: [],
        maxCost: 1.0,
        minQuality: 0.7,
        preferLocal: false,
        estimatedTokens: 2000,
      };

      const decision = await adapter.route(requirements);

      // Cost should be tokens/1000 * costPer1kTokens
      const expectedCost =
        (requirements.estimatedTokens / 1000) *
        decision.model.capabilities.costPer1kTokens;
      expect(decision.estimatedCost).toBeCloseTo(expectedCost, 6);
    });
  });

  describe('usage tracking', () => {
    it('should record usage statistics', () => {
      adapter.recordUsage('claude-3-sonnet', 0.003, 1200, 1000, true);
      adapter.recordUsage('claude-3-sonnet', 0.002, 1000, 800, true);
      adapter.recordUsage('claude-3-sonnet', 0.004, 1400, 1200, true);

      const stats = adapter.getModelStats('claude-3-sonnet');

      expect(stats).toBeDefined();
      expect(stats!.calls).toBe(3);
      expect(stats!.totalCost).toBeCloseTo(0.009, 4);
      expect(stats!.totalTokens).toBe(3000);
      expect(stats!.avgLatency).toBeCloseTo(1200, 0);
    });

    it('should track success rate correctly', () => {
      // 2 successes, 1 failure
      adapter.recordUsage('claude-3-haiku', 0.001, 500, 500, true);
      adapter.recordUsage('claude-3-haiku', 0.001, 600, 500, true);
      adapter.recordUsage('claude-3-haiku', 0.001, 400, 500, false);

      const stats = adapter.getModelStats('claude-3-haiku');

      expect(stats).toBeDefined();
      expect(stats!.successRate).toBeGreaterThan(0.5);
      expect(stats!.successRate).toBeLessThan(1.0);
    });

    it('should return all usage stats', () => {
      adapter.recordUsage('model-a', 0.01, 1000, 100, true);
      adapter.recordUsage('model-b', 0.02, 2000, 200, true);

      const allStats = adapter.getUsageStats();

      expect(allStats.size).toBe(2);
      expect(allStats.has('model-a')).toBe(true);
      expect(allStats.has('model-b')).toBe(true);
    });
  });

  describe('cost savings calculation', () => {
    it('should calculate cost savings correctly', () => {
      // Record usage with various models
      adapter.recordUsage('claude-3-haiku', 0.0005, 1000, 2000, true);
      adapter.recordUsage('claude-3-haiku', 0.0005, 1000, 2000, true);
      adapter.recordUsage('claude-3-sonnet', 0.006, 1500, 2000, true);

      const report = adapter.getCostSavingsReport();

      expect(report.totalCost).toBeCloseTo(0.007, 4);
      expect(report.estimatedFullPriceCost).toBeGreaterThan(report.totalCost);
      expect(report.savings).toBeGreaterThan(0);
      expect(report.savingsPercentage).toBeGreaterThan(0);
    });

    it('should include model breakdown in report', () => {
      adapter.recordUsage('claude-3-haiku', 0.001, 500, 1000, true);
      adapter.recordUsage('claude-3-sonnet', 0.003, 1000, 1000, true);

      const report = adapter.getCostSavingsReport();

      expect(report.modelBreakdown).toBeDefined();
      expect(report.modelBreakdown.length).toBe(2);
      expect(report.modelBreakdown[0].modelId).toBeDefined();
      expect(report.modelBreakdown[0].calls).toBeGreaterThan(0);
    });
  });

  describe('model discovery', () => {
    it('should get models by provider', () => {
      const anthropicModels = adapter.getModelsByProvider('anthropic');

      expect(anthropicModels.length).toBeGreaterThan(0);
      expect(anthropicModels.every((m) => m.provider === 'anthropic')).toBe(
        true
      );
    });

    it('should get models with specific capability', () => {
      const reasoningModels = adapter.getModelsWithCapability('reasoning');

      expect(reasoningModels.length).toBeGreaterThan(0);
      expect(
        reasoningModels.every((m) => m.capabilities.reasoning === true)
      ).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      adapter.updateConfig({
        qualityThreshold: 0.9,
        maxCostPerTask: 0.1,
      });

      const config = adapter.getConfig();

      expect(config.qualityThreshold).toBe(0.9);
      expect(config.maxCostPerTask).toBe(0.1);
    });

    it('should re-filter models when providers change', () => {
      const initialModels = adapter.getAvailableModels().length;

      adapter.updateConfig({ providers: ['anthropic'] });

      const filteredModels = adapter.getAvailableModels().length;

      expect(filteredModels).toBeLessThan(initialModels);
    });
  });

  describe('metrics', () => {
    it('should return metrics', () => {
      adapter.recordUsage('test-model', 0.01, 1000, 500, true);

      const metrics = adapter.getMetrics();

      expect(metrics.totalRoutingDecisions).toBeDefined();
      expect(metrics.availableModels).toBeGreaterThan(0);
      expect(metrics.totalCost).toBeDefined();
    });

    it('should reset metrics', () => {
      adapter.recordUsage('test-model', 0.01, 1000, 500, true);
      adapter.resetMetrics();

      const stats = adapter.getUsageStats();

      expect(stats.size).toBe(0);
    });
  });

  describe('MODEL_REGISTRY', () => {
    it('should contain all expected models', () => {
      const modelIds = MODEL_REGISTRY.map((m) => m.id);

      expect(modelIds).toContain('claude-3-opus');
      expect(modelIds).toContain('claude-3-sonnet');
      expect(modelIds).toContain('claude-3-haiku');
      expect(modelIds).toContain('gpt-4-turbo');
      expect(modelIds).toContain('gemini-pro');
      expect(modelIds).toContain('deepseek-coder');
    });

    it('should have valid capability data for all models', () => {
      for (const model of MODEL_REGISTRY) {
        expect(model.capabilities.qualityScore).toBeGreaterThanOrEqual(0);
        expect(model.capabilities.qualityScore).toBeLessThanOrEqual(1);
        expect(model.capabilities.costPer1kTokens).toBeGreaterThanOrEqual(0);
        expect(model.capabilities.maxContextLength).toBeGreaterThan(0);
        expect(['fast', 'medium', 'slow']).toContain(model.capabilities.speed);
      }
    });
  });
});

describe('createModelRouterAdapter factory', () => {
  it('should create and initialize adapter', async () => {
    const adapter = await createModelRouterAdapter({
      providers: ['anthropic'],
    });

    expect(adapter.isAvailable()).toBe(true);
    expect(adapter.getAvailableModels().length).toBeGreaterThan(0);
  });
});
