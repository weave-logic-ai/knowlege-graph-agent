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
/**
 * Supported model providers
 */
export type ModelProvider = 'anthropic' | 'openrouter' | 'google' | 'openai' | 'local';
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
/**
 * Static model registry with capabilities and costs
 *
 * Costs are based on approximate pricing as of December 2024.
 * Actual costs may vary - update as needed.
 */
export declare const MODEL_REGISTRY: ModelInfo[];
/**
 * Multi-Model Router Adapter
 *
 * Selects the optimal model for each task based on:
 * - Required capabilities
 * - Cost constraints
 * - Quality requirements
 * - Speed preferences
 */
export declare class ModelRouterAdapter extends BaseAdapter<unknown> implements MetricsTrackable {
    private config;
    private availableModels;
    private usageStats;
    private totalRoutingDecisions;
    private localModelCheckDone;
    private localModelsAvailable;
    constructor(config?: Partial<ModelRouterConfig>);
    getFeatureName(): string;
    isAvailable(): boolean;
    /**
     * Initialize the router with available models
     */
    initialize(): Promise<void>;
    /**
     * Check if local models are available
     */
    private checkLocalModels;
    /**
     * Route a task to the optimal model
     *
     * @param requirements - Task requirements
     * @returns Routing decision with selected model
     */
    route(requirements: TaskRequirements): Promise<RoutingDecision>;
    /**
     * Route based on agent type
     *
     * @param agentType - The agent type to route for
     * @param estimatedTokens - Estimated token count
     * @returns Routing decision
     */
    routeForAgent(agentType: AgentType, estimatedTokens?: number): Promise<RoutingDecision>;
    /**
     * Get default requirements for an agent type
     */
    private getAgentRequirements;
    /**
     * Check if a model meets task requirements
     */
    private meetsRequirements;
    /**
     * Score a model for given requirements
     *
     * Higher score = better match
     */
    private scoreModel;
    /**
     * Estimate cost for a task
     */
    private estimateCost;
    /**
     * Generate human-readable reason for model selection
     */
    private generateReason;
    /**
     * Record usage for analytics and learning
     *
     * @param modelId - Model that was used
     * @param cost - Actual cost incurred
     * @param latencyMs - Response latency in milliseconds
     * @param tokens - Actual tokens processed
     * @param success - Whether the request succeeded
     */
    recordUsage(modelId: string, cost: number, latencyMs: number, tokens?: number, success?: boolean): void;
    /**
     * Get usage statistics for all models
     */
    getUsageStats(): Map<string, ModelUsageStats>;
    /**
     * Get usage statistics for a specific model
     */
    getModelStats(modelId: string): ModelUsageStats | undefined;
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
    };
    /**
     * Get available models
     */
    getAvailableModels(): ModelInfo[];
    /**
     * Get models by provider
     */
    getModelsByProvider(provider: ModelProvider): ModelInfo[];
    /**
     * Get models with specific capability
     */
    getModelsWithCapability(capability: keyof ModelCapabilities): ModelInfo[];
    /**
     * Update configuration
     */
    updateConfig(config: Partial<ModelRouterConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): ModelRouterConfig;
    getMetrics(): Record<string, number | string>;
    resetMetrics(): void;
}
/**
 * Create and initialize a model router adapter
 *
 * @param config - Optional configuration
 * @returns Initialized ModelRouterAdapter
 */
export declare function createModelRouterAdapter(config?: Partial<ModelRouterConfig>): Promise<ModelRouterAdapter>;
//# sourceMappingURL=model-router-adapter.d.ts.map