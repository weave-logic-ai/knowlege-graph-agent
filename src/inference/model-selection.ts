/**
 * Model Selection Integration Layer
 *
 * High-level API for selecting optimal models for agent tasks.
 * Integrates with the ModelRouterAdapter for cost-optimized routing.
 *
 * @module inference/model-selection
 */

import {
  ModelRouterAdapter,
  createModelRouterAdapter,
  type RoutingDecision,
  type TaskRequirements,
  type ModelRouterConfig,
  type ModelInfo,
} from '../integrations/agentic-flow/adapters/model-router-adapter.js';
import { AgentType } from '../agents/types.js';

// ============================================================================
// Global Router Instance
// ============================================================================

let globalRouter: ModelRouterAdapter | null = null;

/**
 * Get or create the global model router instance
 *
 * @param config - Optional configuration (only used on first call)
 * @returns The global ModelRouterAdapter instance
 */
export async function getModelRouter(
  config?: Partial<ModelRouterConfig>
): Promise<ModelRouterAdapter> {
  if (!globalRouter) {
    globalRouter = await createModelRouterAdapter(config);
  }
  return globalRouter;
}

/**
 * Reset the global router (useful for testing)
 */
export function resetModelRouter(): void {
  globalRouter = null;
}

// ============================================================================
// High-Level Selection Functions
// ============================================================================

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
export async function selectModelForAgent(
  agentType: AgentType,
  estimatedTokens?: number
): Promise<RoutingDecision> {
  const router = await getModelRouter();
  return router.routeForAgent(agentType, estimatedTokens);
}

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
export async function selectModelForTask(
  taskDescription: string,
  requirements: {
    codeGeneration?: boolean;
    codeAnalysis?: boolean;
    textGeneration?: boolean;
    reasoning?: boolean;
    maxCost?: number;
    minQuality?: number;
    preferLocal?: boolean;
  }
): Promise<RoutingDecision> {
  const router = await getModelRouter();

  // Estimate tokens from task description (rough heuristic)
  const estimatedTokens = Math.ceil(taskDescription.length / 4) + 500;

  // Build capabilities list from boolean flags
  const capabilities: string[] = [];
  if (requirements.codeGeneration) capabilities.push('codeGeneration');
  if (requirements.codeAnalysis) capabilities.push('codeAnalysis');
  if (requirements.textGeneration) capabilities.push('textGeneration');
  if (requirements.reasoning) capabilities.push('reasoning');

  return router.route({
    capabilities,
    maxCost: requirements.maxCost || 0.05,
    minQuality: requirements.minQuality || 0.8,
    preferLocal: requirements.preferLocal || false,
    estimatedTokens,
  });
}

/**
 * Get the cheapest model that meets minimum quality
 *
 * @param minQuality - Minimum quality threshold (0-1)
 * @returns Routing decision with cheapest qualifying model
 */
export async function getCheapestModel(
  minQuality: number = 0.7
): Promise<RoutingDecision> {
  const router = await getModelRouter();

  return router.route({
    capabilities: [],
    maxCost: 1.0, // High limit to not filter by cost
    minQuality,
    preferLocal: true, // Prefer free local models
    estimatedTokens: 1000,
  });
}

/**
 * Get the best quality model within budget
 *
 * @param maxCost - Maximum acceptable cost
 * @returns Routing decision with highest quality model in budget
 */
export async function getBestQualityModel(
  maxCost: number = 0.05
): Promise<RoutingDecision> {
  const router = await getModelRouter();

  return router.route({
    capabilities: [],
    maxCost,
    minQuality: 0, // No minimum quality filter
    preferLocal: false,
    estimatedTokens: 1000,
  });
}

/**
 * Get models optimized for code tasks
 *
 * @param estimatedTokens - Estimated token count
 * @param maxCost - Maximum acceptable cost
 * @returns Routing decision optimized for coding
 */
export async function getCodeModel(
  estimatedTokens: number = 2000,
  maxCost: number = 0.05
): Promise<RoutingDecision> {
  const router = await getModelRouter();

  return router.route({
    capabilities: ['codeGeneration', 'codeAnalysis'],
    maxCost,
    minQuality: 0.8,
    preferLocal: true,
    estimatedTokens,
  });
}

/**
 * Get models optimized for reasoning tasks
 *
 * @param estimatedTokens - Estimated token count
 * @param maxCost - Maximum acceptable cost
 * @returns Routing decision optimized for reasoning
 */
export async function getReasoningModel(
  estimatedTokens: number = 2000,
  maxCost: number = 0.05
): Promise<RoutingDecision> {
  const router = await getModelRouter();

  return router.route({
    capabilities: ['reasoning'],
    maxCost,
    minQuality: 0.85,
    preferLocal: false,
    estimatedTokens,
  });
}

// ============================================================================
// Usage Tracking
// ============================================================================

/**
 * Record model usage for learning and analytics
 *
 * @param modelId - Model that was used
 * @param cost - Actual cost incurred
 * @param latencyMs - Response latency
 * @param tokens - Actual tokens used
 * @param success - Whether request succeeded
 */
export async function recordModelUsage(
  modelId: string,
  cost: number,
  latencyMs: number,
  tokens?: number,
  success?: boolean
): Promise<void> {
  const router = await getModelRouter();
  router.recordUsage(modelId, cost, latencyMs, tokens, success);
}

/**
 * Get cost savings report
 *
 * @returns Report with total costs and savings
 */
export async function getCostSavingsReport(): Promise<{
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
}> {
  const router = await getModelRouter();
  return router.getCostSavingsReport();
}

// ============================================================================
// Model Discovery
// ============================================================================

/**
 * Get all available models
 *
 * @returns List of available models
 */
export async function getAvailableModels(): Promise<ModelInfo[]> {
  const router = await getModelRouter();
  return router.getAvailableModels();
}

/**
 * Check if local models are available
 *
 * @returns True if local models are available
 */
export async function hasLocalModels(): Promise<boolean> {
  const router = await getModelRouter();
  const metrics = router.getMetrics();
  return metrics.localModelsAvailable === 'yes';
}

// ============================================================================
// Type Re-exports
// ============================================================================

export type {
  RoutingDecision,
  TaskRequirements,
  ModelRouterConfig,
  ModelInfo,
} from '../integrations/agentic-flow/adapters/model-router-adapter.js';
