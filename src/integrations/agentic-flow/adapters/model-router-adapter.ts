/**
 * Multi-Model Router Adapter (SPEC-010b)
 *
 * Cost-optimized model router that selects the best LLM for each task type.
 * Routes tasks to appropriate models based on capabilities, cost, and quality.
 *
 * @module integrations/agentic-flow/adapters/model-router-adapter
 */

import { BaseAdapter, MetricsTrackable } from './base-adapter.js';
import { AgentType } from '../../../agents/types.js';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Supported model providers
 */
export type ModelProvider =
  | 'anthropic'
  | 'openrouter'
  | 'google'
  | 'openai'
  | 'local';

/**
 * Model capabilities and characteristics
 */
export interface ModelCapabilities {
  /** Supports code generation tasks */
  codeGeneration: boolean;

  /** Supports code analysis tasks */
  codeAnalysis: boolean;

  /** Supports text generation tasks */
  textGeneration: boolean;

  /** Supports complex reasoning tasks */
  reasoning: boolean;

  /** Model speed category */
  speed: 'fast' | 'medium' | 'slow';

  /** Cost per 1000 tokens (USD) */
  costPer1kTokens: number;

  /** Quality score (0-1) */
  qualityScore: number;

  /** Maximum context length in tokens */
  maxContextLength: number;
}

/**
 * Model information structure
 */
export interface ModelInfo {
  /** Unique model identifier */
  id: string;

  /** Model provider */
  provider: ModelProvider;

  /** Human-readable model name */
  name: string;

  /** Model capabilities */
  capabilities: ModelCapabilities;
}

/**
 * Task requirements for routing
 */
export interface TaskRequirements {
  /** Required capabilities */
  capabilities: string[];

  /** Maximum acceptable cost */
  maxCost: number;

  /** Minimum quality threshold (0-1) */
  minQuality: number;

  /** Prefer local models if available */
  preferLocal: boolean;

  /** Estimated token count for the task */
  estimatedTokens: number;
}

/**
 * Routing decision result
 */
export interface RoutingDecision {
  /** Selected model */
  model: ModelInfo;

  /** Reason for selection */
  reason: string;

  /** Estimated cost for this task */
  estimatedCost: number;

  /** Alternative models that could be used */
  alternativeModels: ModelInfo[];
}

/**
 * Router configuration
 */
export interface ModelRouterConfig {
  /** Enabled providers */
  providers: ModelProvider[];

  /** Enable cost optimization */
  costOptimization: boolean;

  /** Minimum quality threshold (0-1) */
  qualityThreshold: number;

  /** Fallback model ID */
  fallbackModel: string;

  /** Maximum cost per task */
  maxCostPerTask: number;
}

/**
 * Usage statistics for a model
 */
export interface ModelUsageStats {
  /** Number of API calls */
  calls: number;

  /** Total cost incurred */
  totalCost: number;

  /** Average latency in milliseconds */
  avgLatency: number;

  /** Total tokens processed */
  totalTokens: number;

  /** Success rate (0-1) */
  successRate: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ModelRouterConfig = {
  providers: ['anthropic', 'openrouter', 'local'],
  costOptimization: true,
  qualityThreshold: 0.7,
  fallbackModel: 'claude-3-haiku',
  maxCostPerTask: 0.05,
};

// ============================================================================
// Model Registry
// ============================================================================

/**
 * Static model registry with capabilities and costs
 *
 * Costs are based on approximate pricing as of December 2024.
 * Actual costs may vary - update as needed.
 */
export const MODEL_REGISTRY: ModelInfo[] = [
  {
    id: 'claude-3-opus',
    provider: 'anthropic',
    name: 'Claude 3 Opus',
    capabilities: {
      codeGeneration: true,
      codeAnalysis: true,
      textGeneration: true,
      reasoning: true,
      speed: 'slow',
      costPer1kTokens: 0.015,
      qualityScore: 0.98,
      maxContextLength: 200000,
    },
  },
  {
    id: 'claude-3-sonnet',
    provider: 'anthropic',
    name: 'Claude 3.5 Sonnet',
    capabilities: {
      codeGeneration: true,
      codeAnalysis: true,
      textGeneration: true,
      reasoning: true,
      speed: 'medium',
      costPer1kTokens: 0.003,
      qualityScore: 0.95,
      maxContextLength: 200000,
    },
  },
  {
    id: 'claude-3-haiku',
    provider: 'anthropic',
    name: 'Claude 3.5 Haiku',
    capabilities: {
      codeGeneration: true,
      codeAnalysis: true,
      textGeneration: true,
      reasoning: true,
      speed: 'fast',
      costPer1kTokens: 0.00025,
      qualityScore: 0.85,
      maxContextLength: 200000,
    },
  },
  {
    id: 'gpt-4-turbo',
    provider: 'openai',
    name: 'GPT-4 Turbo',
    capabilities: {
      codeGeneration: true,
      codeAnalysis: true,
      textGeneration: true,
      reasoning: true,
      speed: 'medium',
      costPer1kTokens: 0.01,
      qualityScore: 0.93,
      maxContextLength: 128000,
    },
  },
  {
    id: 'gpt-4o',
    provider: 'openai',
    name: 'GPT-4o',
    capabilities: {
      codeGeneration: true,
      codeAnalysis: true,
      textGeneration: true,
      reasoning: true,
      speed: 'fast',
      costPer1kTokens: 0.005,
      qualityScore: 0.92,
      maxContextLength: 128000,
    },
  },
  {
    id: 'gemini-pro',
    provider: 'google',
    name: 'Gemini Pro',
    capabilities: {
      codeGeneration: true,
      codeAnalysis: true,
      textGeneration: true,
      reasoning: true,
      speed: 'fast',
      costPer1kTokens: 0.00125,
      qualityScore: 0.88,
      maxContextLength: 1000000,
    },
  },
  {
    id: 'gemini-flash',
    provider: 'google',
    name: 'Gemini Flash',
    capabilities: {
      codeGeneration: true,
      codeAnalysis: true,
      textGeneration: true,
      reasoning: false,
      speed: 'fast',
      costPer1kTokens: 0.000075,
      qualityScore: 0.8,
      maxContextLength: 1000000,
    },
  },
  {
    id: 'deepseek-coder',
    provider: 'openrouter',
    name: 'DeepSeek Coder',
    capabilities: {
      codeGeneration: true,
      codeAnalysis: true,
      textGeneration: false,
      reasoning: true,
      speed: 'fast',
      costPer1kTokens: 0.0002,
      qualityScore: 0.82,
      maxContextLength: 64000,
    },
  },
  {
    id: 'codestral',
    provider: 'openrouter',
    name: 'Codestral',
    capabilities: {
      codeGeneration: true,
      codeAnalysis: true,
      textGeneration: false,
      reasoning: false,
      speed: 'fast',
      costPer1kTokens: 0.0003,
      qualityScore: 0.84,
      maxContextLength: 32000,
    },
  },
  {
    id: 'local-codellama',
    provider: 'local',
    name: 'CodeLlama (Local)',
    capabilities: {
      codeGeneration: true,
      codeAnalysis: true,
      textGeneration: false,
      reasoning: false,
      speed: 'fast',
      costPer1kTokens: 0,
      qualityScore: 0.75,
      maxContextLength: 16000,
    },
  },
  {
    id: 'local-mistral',
    provider: 'local',
    name: 'Mistral (Local)',
    capabilities: {
      codeGeneration: true,
      codeAnalysis: true,
      textGeneration: true,
      reasoning: false,
      speed: 'fast',
      costPer1kTokens: 0,
      qualityScore: 0.78,
      maxContextLength: 32000,
    },
  },
];

// ============================================================================
// Model Router Adapter
// ============================================================================

/**
 * Multi-Model Router Adapter
 *
 * Selects the optimal model for each task based on:
 * - Required capabilities
 * - Cost constraints
 * - Quality requirements
 * - Speed preferences
 */
export class ModelRouterAdapter
  extends BaseAdapter<unknown>
  implements MetricsTrackable
{
  private config: ModelRouterConfig;
  private availableModels: ModelInfo[];
  private usageStats: Map<string, ModelUsageStats>;
  private totalRoutingDecisions: number = 0;
  private localModelCheckDone: boolean = false;
  private localModelsAvailable: boolean = false;

  constructor(config: Partial<ModelRouterConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.availableModels = [];
    this.usageStats = new Map();
  }

  getFeatureName(): string {
    return 'model-router';
  }

  isAvailable(): boolean {
    return this.status.available && this.status.initialized;
  }

  /**
   * Initialize the router with available models
   */
  async initialize(): Promise<void> {
    try {
      // Try to load agentic-flow router module
      const module = await this.tryLoad('agentic-flow/router');

      if (module && typeof (module as Record<string, unknown>).ModelRouter === 'function') {
        // Use external router if available
        const routerClass = (module as Record<string, unknown>).ModelRouter as new (config: ModelRouterConfig) => { getAvailableModels(): Promise<ModelInfo[]> };
        const router = new routerClass(this.config);
        this.availableModels = await router.getAvailableModels();
        this.module = router;
      } else {
        // Use static registry filtered by configured providers
        this.availableModels = MODEL_REGISTRY.filter((m) =>
          this.config.providers.includes(m.provider)
        );
      }

      // Check for local model availability
      await this.checkLocalModels();

      this.status.available = true;
      this.status.initialized = true;
      this.status.lastChecked = new Date();
    } catch (error) {
      // Fallback to static registry on error
      this.availableModels = MODEL_REGISTRY.filter((m) =>
        this.config.providers.includes(m.provider)
      );
      this.status.available = true;
      this.status.initialized = true;
      this.status.error =
        error instanceof Error ? error.message : String(error);
      this.status.lastChecked = new Date();
    }
  }

  /**
   * Check if local models are available
   */
  private async checkLocalModels(): Promise<void> {
    if (this.localModelCheckDone) return;

    try {
      // Check for common local model servers
      const localEndpoints = [
        'http://localhost:11434/api/generate', // Ollama
        'http://localhost:1234/v1/chat/completions', // LM Studio
        'http://localhost:8080/v1/chat/completions', // llama.cpp
      ];

      for (const endpoint of localEndpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1000);

          const response = await fetch(endpoint, {
            method: 'HEAD',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok || response.status === 405) {
            this.localModelsAvailable = true;
            break;
          }
        } catch {
          // Continue checking other endpoints
        }
      }
    } catch {
      this.localModelsAvailable = false;
    }

    this.localModelCheckDone = true;

    // Remove local models if not available
    if (!this.localModelsAvailable) {
      this.availableModels = this.availableModels.filter(
        (m) => m.provider !== 'local'
      );
    }
  }

  /**
   * Route a task to the optimal model
   *
   * @param requirements - Task requirements
   * @returns Routing decision with selected model
   */
  async route(requirements: TaskRequirements): Promise<RoutingDecision> {
    if (!this.status.initialized) {
      await this.initialize();
    }

    this.totalRoutingDecisions++;

    // Filter models by capabilities
    const capableModels = this.availableModels.filter((m) =>
      this.meetsRequirements(m, requirements)
    );

    if (capableModels.length === 0) {
      // Use fallback model
      const fallback =
        this.availableModels.find((m) => m.id === this.config.fallbackModel) ||
        this.availableModels[0];

      if (!fallback) {
        throw new Error('No models available for routing');
      }

      return {
        model: fallback,
        reason: 'No models meet requirements, using fallback',
        estimatedCost: this.estimateCost(fallback, requirements.estimatedTokens),
        alternativeModels: [],
      };
    }

    // Score and rank models
    const scoredModels = capableModels.map((m) => ({
      model: m,
      score: this.scoreModel(m, requirements),
      cost: this.estimateCost(m, requirements.estimatedTokens),
    }));

    // Sort by score (higher is better)
    scoredModels.sort((a, b) => b.score - a.score);

    const best = scoredModels[0];

    return {
      model: best.model,
      reason: this.generateReason(best.model, requirements),
      estimatedCost: best.cost,
      alternativeModels: scoredModels.slice(1, 4).map((s) => s.model),
    };
  }

  /**
   * Route based on agent type
   *
   * @param agentType - The agent type to route for
   * @param estimatedTokens - Estimated token count
   * @returns Routing decision
   */
  async routeForAgent(
    agentType: AgentType,
    estimatedTokens: number = 1000
  ): Promise<RoutingDecision> {
    const requirements = this.getAgentRequirements(agentType, estimatedTokens);
    return this.route(requirements);
  }

  /**
   * Get default requirements for an agent type
   */
  private getAgentRequirements(
    agentType: AgentType,
    estimatedTokens: number
  ): TaskRequirements {
    const requirementsMap: Record<AgentType, Partial<TaskRequirements>> = {
      [AgentType.CODER]: {
        capabilities: ['codeGeneration'],
        maxCost: 0.05,
        minQuality: 0.85,
        preferLocal: false,
      },
      [AgentType.REVIEWER]: {
        capabilities: ['codeAnalysis'],
        maxCost: 0.02,
        minQuality: 0.8,
        preferLocal: true,
      },
      [AgentType.TESTER]: {
        capabilities: ['codeGeneration', 'codeAnalysis'],
        maxCost: 0.03,
        minQuality: 0.8,
        preferLocal: false,
      },
      [AgentType.DOCUMENTER]: {
        capabilities: ['textGeneration'],
        maxCost: 0.01,
        minQuality: 0.7,
        preferLocal: true,
      },
      [AgentType.PLANNER]: {
        capabilities: ['reasoning'],
        maxCost: 0.03,
        minQuality: 0.85,
        preferLocal: false,
      },
      [AgentType.OPTIMIZER]: {
        capabilities: ['codeAnalysis', 'reasoning'],
        maxCost: 0.02,
        minQuality: 0.8,
        preferLocal: true,
      },
      [AgentType.RESEARCHER]: {
        capabilities: ['reasoning', 'textGeneration'],
        maxCost: 0.04,
        minQuality: 0.85,
        preferLocal: false,
      },
      [AgentType.ANALYST]: {
        capabilities: ['reasoning'],
        maxCost: 0.03,
        minQuality: 0.85,
        preferLocal: false,
      },
      [AgentType.ARCHITECT]: {
        capabilities: ['reasoning', 'codeGeneration'],
        maxCost: 0.05,
        minQuality: 0.9,
        preferLocal: false,
      },
      [AgentType.COORDINATOR]: {
        capabilities: ['reasoning'],
        maxCost: 0.02,
        minQuality: 0.8,
        preferLocal: false,
      },
      [AgentType.CUSTOM]: {
        capabilities: [],
        maxCost: 0.03,
        minQuality: 0.8,
        preferLocal: false,
      },
    };

    const base = requirementsMap[agentType] || {};

    return {
      capabilities: base.capabilities || [],
      maxCost: base.maxCost || this.config.maxCostPerTask,
      minQuality: base.minQuality || this.config.qualityThreshold,
      preferLocal: base.preferLocal || false,
      estimatedTokens,
    };
  }

  /**
   * Check if a model meets task requirements
   */
  private meetsRequirements(
    model: ModelInfo,
    requirements: TaskRequirements
  ): boolean {
    // Check each required capability
    for (const cap of requirements.capabilities) {
      const capKey = cap as keyof ModelCapabilities;
      if (
        capKey in model.capabilities &&
        model.capabilities[capKey] === false
      ) {
        return false;
      }
    }

    // Check quality threshold
    if (model.capabilities.qualityScore < requirements.minQuality) {
      return false;
    }

    // Check cost constraint
    const estimatedCost = this.estimateCost(model, requirements.estimatedTokens);
    if (estimatedCost > requirements.maxCost) {
      return false;
    }

    return true;
  }

  /**
   * Score a model for given requirements
   *
   * Higher score = better match
   */
  private scoreModel(model: ModelInfo, requirements: TaskRequirements): number {
    let score = 0;

    // Quality weight: 40%
    score += model.capabilities.qualityScore * 0.4;

    // Cost efficiency weight: 30%
    const cost = this.estimateCost(model, requirements.estimatedTokens);
    const costEfficiency = 1 - cost / requirements.maxCost;
    score += Math.max(0, costEfficiency) * 0.3;

    // Speed weight: 20%
    const speedScores: Record<string, number> = {
      fast: 1,
      medium: 0.6,
      slow: 0.3,
    };
    score += speedScores[model.capabilities.speed] * 0.2;

    // Local preference: 10%
    if (requirements.preferLocal && model.provider === 'local') {
      score += 0.1;
    }

    // Bonus for usage history (learned performance)
    const stats = this.usageStats.get(model.id);
    if (stats && stats.calls > 10) {
      // Add bonus based on success rate (max 5%)
      score += stats.successRate * 0.05;
    }

    return score;
  }

  /**
   * Estimate cost for a task
   */
  private estimateCost(model: ModelInfo, tokens: number): number {
    return (tokens / 1000) * model.capabilities.costPer1kTokens;
  }

  /**
   * Generate human-readable reason for model selection
   */
  private generateReason(
    model: ModelInfo,
    requirements: TaskRequirements
  ): string {
    const cost = this.estimateCost(model, requirements.estimatedTokens);
    const savings =
      requirements.maxCost > 0
        ? Math.round((1 - cost / requirements.maxCost) * 100)
        : 0;

    const qualityPercent = Math.round(model.capabilities.qualityScore * 100);

    return (
      `Selected ${model.name}: ${qualityPercent}% quality, ` +
      `$${cost.toFixed(4)} estimated cost (${savings}% under budget), ` +
      `${model.capabilities.speed} speed`
    );
  }

  /**
   * Record usage for analytics and learning
   *
   * @param modelId - Model that was used
   * @param cost - Actual cost incurred
   * @param latencyMs - Response latency in milliseconds
   * @param tokens - Actual tokens processed
   * @param success - Whether the request succeeded
   */
  recordUsage(
    modelId: string,
    cost: number,
    latencyMs: number,
    tokens: number = 0,
    success: boolean = true
  ): void {
    const existing = this.usageStats.get(modelId) || {
      calls: 0,
      totalCost: 0,
      avgLatency: 0,
      totalTokens: 0,
      successRate: 1,
    };

    existing.calls++;
    existing.totalCost += cost;
    existing.totalTokens += tokens;
    existing.avgLatency =
      (existing.avgLatency * (existing.calls - 1) + latencyMs) / existing.calls;

    // Update success rate with exponential moving average
    const alpha = 0.1;
    existing.successRate =
      existing.successRate * (1 - alpha) + (success ? 1 : 0) * alpha;

    this.usageStats.set(modelId, existing);
  }

  /**
   * Get usage statistics for all models
   */
  getUsageStats(): Map<string, ModelUsageStats> {
    return new Map(this.usageStats);
  }

  /**
   * Get usage statistics for a specific model
   */
  getModelStats(modelId: string): ModelUsageStats | undefined {
    return this.usageStats.get(modelId);
  }

  /**
   * Get cost savings report
   */
  getCostSavingsReport(): {
    totalCost: number;
    estimatedFullPriceCost: number;
    savings: number;
    savingsPercentage: number;
    modelBreakdown: Array<{
      modelId: string;
      modelName: string;
      calls: number;
      cost: number;
      avgLatency: number;
    }>;
  } {
    let totalCost = 0;
    let estimatedFull = 0;

    // Use Claude Opus price as baseline for "full price"
    const fullPricePerToken = 0.015 / 1000;

    const modelBreakdown: Array<{
      modelId: string;
      modelName: string;
      calls: number;
      cost: number;
      avgLatency: number;
    }> = [];

    for (const [modelId, stats] of this.usageStats.entries()) {
      totalCost += stats.totalCost;

      // Calculate what it would have cost at full price
      const model = this.availableModels.find((m) => m.id === modelId);
      if (model && model.capabilities.costPer1kTokens > 0) {
        const avgTokensPerCall = stats.totalTokens / stats.calls || 1000;
        estimatedFull += avgTokensPerCall * stats.calls * fullPricePerToken;
      } else {
        // For free local models, estimate based on average usage
        estimatedFull += stats.calls * 1000 * fullPricePerToken;
      }

      modelBreakdown.push({
        modelId,
        modelName: model?.name || modelId,
        calls: stats.calls,
        cost: stats.totalCost,
        avgLatency: Math.round(stats.avgLatency),
      });
    }

    const savings = estimatedFull - totalCost;
    const savingsPercentage =
      estimatedFull > 0 ? (savings / estimatedFull) * 100 : 0;

    return {
      totalCost,
      estimatedFullPriceCost: estimatedFull,
      savings,
      savingsPercentage,
      modelBreakdown: modelBreakdown.sort((a, b) => b.calls - a.calls),
    };
  }

  /**
   * Get available models
   */
  getAvailableModels(): ModelInfo[] {
    return [...this.availableModels];
  }

  /**
   * Get models by provider
   */
  getModelsByProvider(provider: ModelProvider): ModelInfo[] {
    return this.availableModels.filter((m) => m.provider === provider);
  }

  /**
   * Get models with specific capability
   */
  getModelsWithCapability(capability: keyof ModelCapabilities): ModelInfo[] {
    return this.availableModels.filter(
      (m) => m.capabilities[capability] === true
    );
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ModelRouterConfig>): void {
    this.config = { ...this.config, ...config };

    // Re-filter available models based on new providers
    if (config.providers) {
      this.availableModels = MODEL_REGISTRY.filter((m) =>
        this.config.providers.includes(m.provider)
      );
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ModelRouterConfig {
    return { ...this.config };
  }

  // MetricsTrackable implementation

  getMetrics(): Record<string, number | string> {
    const report = this.getCostSavingsReport();

    return {
      totalRoutingDecisions: this.totalRoutingDecisions,
      availableModels: this.availableModels.length,
      totalCost: report.totalCost,
      totalSavings: report.savings,
      savingsPercentage: `${report.savingsPercentage.toFixed(1)}%`,
      localModelsAvailable: this.localModelsAvailable ? 'yes' : 'no',
    };
  }

  resetMetrics(): void {
    this.usageStats.clear();
    this.totalRoutingDecisions = 0;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create and initialize a model router adapter
 *
 * @param config - Optional configuration
 * @returns Initialized ModelRouterAdapter
 */
export async function createModelRouterAdapter(
  config?: Partial<ModelRouterConfig>
): Promise<ModelRouterAdapter> {
  const adapter = new ModelRouterAdapter(config);
  await adapter.initialize();
  return adapter;
}
