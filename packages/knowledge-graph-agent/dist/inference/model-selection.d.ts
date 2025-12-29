/**
 * Model Selection Integration Layer
 *
 * High-level API for selecting optimal models for agent tasks.
 * Integrates with the ModelRouterAdapter for cost-optimized routing.
 *
 * @module inference/model-selection
 */
import { ModelRouterAdapter, type RoutingDecision, type ModelRouterConfig, type ModelInfo } from '../integrations/agentic-flow/adapters/model-router-adapter.js';
import { AgentType } from '../agents/types.js';
/**
 * Get or create the global model router instance
 *
 * @param config - Optional configuration (only used on first call)
 * @returns The global ModelRouterAdapter instance
 */
export declare function getModelRouter(config?: Partial<ModelRouterConfig>): Promise<ModelRouterAdapter>;
/**
 * Reset the global router (useful for testing)
 */
export declare function resetModelRouter(): void;
/**
 * Select the optimal model for an agent type
 *
 * @param agentType - The type of agent that needs a model
 * @param estimatedTokens - Estimated token count for the task
 * @returns Routing decision with selected model
 *
 * @example
 * ```typescript
 * const decision = await selectModelForAgent(AgentType.CODER, 2000);
 * console.log(`Using ${decision.model.name} - ${decision.reason}`);
 * ```
 */
export declare function selectModelForAgent(agentType: AgentType, estimatedTokens?: number): Promise<RoutingDecision>;
/**
 * Select the optimal model for a specific task
 *
 * @param taskDescription - Description of the task
 * @param requirements - Task requirements
 * @returns Routing decision with selected model
 *
 * @example
 * ```typescript
 * const decision = await selectModelForTask(
 *   'Generate unit tests for auth module',
 *   { codeGeneration: true, maxCost: 0.03 }
 * );
 * ```
 */
export declare function selectModelForTask(taskDescription: string, requirements: {
    codeGeneration?: boolean;
    codeAnalysis?: boolean;
    textGeneration?: boolean;
    reasoning?: boolean;
    maxCost?: number;
    minQuality?: number;
    preferLocal?: boolean;
}): Promise<RoutingDecision>;
/**
 * Get the cheapest model that meets minimum quality
 *
 * @param minQuality - Minimum quality threshold (0-1)
 * @returns Routing decision with cheapest qualifying model
 */
export declare function getCheapestModel(minQuality?: number): Promise<RoutingDecision>;
/**
 * Get the best quality model within budget
 *
 * @param maxCost - Maximum acceptable cost
 * @returns Routing decision with highest quality model in budget
 */
export declare function getBestQualityModel(maxCost?: number): Promise<RoutingDecision>;
/**
 * Get models optimized for code tasks
 *
 * @param estimatedTokens - Estimated token count
 * @param maxCost - Maximum acceptable cost
 * @returns Routing decision optimized for coding
 */
export declare function getCodeModel(estimatedTokens?: number, maxCost?: number): Promise<RoutingDecision>;
/**
 * Get models optimized for reasoning tasks
 *
 * @param estimatedTokens - Estimated token count
 * @param maxCost - Maximum acceptable cost
 * @returns Routing decision optimized for reasoning
 */
export declare function getReasoningModel(estimatedTokens?: number, maxCost?: number): Promise<RoutingDecision>;
/**
 * Record model usage for learning and analytics
 *
 * @param modelId - Model that was used
 * @param cost - Actual cost incurred
 * @param latencyMs - Response latency
 * @param tokens - Actual tokens used
 * @param success - Whether request succeeded
 */
export declare function recordModelUsage(modelId: string, cost: number, latencyMs: number, tokens?: number, success?: boolean): Promise<void>;
/**
 * Get cost savings report
 *
 * @returns Report with total costs and savings
 */
export declare function getCostSavingsReport(): Promise<{
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
}>;
/**
 * Get all available models
 *
 * @returns List of available models
 */
export declare function getAvailableModels(): Promise<ModelInfo[]>;
/**
 * Check if local models are available
 *
 * @returns True if local models are available
 */
export declare function hasLocalModels(): Promise<boolean>;
export type { RoutingDecision, TaskRequirements, ModelRouterConfig, ModelInfo, } from '../integrations/agentic-flow/adapters/model-router-adapter.js';
//# sourceMappingURL=model-selection.d.ts.map