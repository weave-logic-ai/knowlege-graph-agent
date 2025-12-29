/**
 * Inference Module
 *
 * Provides model selection and inference utilities for the knowledge graph agent.
 *
 * @module inference
 */

export {
  getModelRouter,
  resetModelRouter,
  selectModelForAgent,
  selectModelForTask,
  getCheapestModel,
  getBestQualityModel,
  getCodeModel,
  getReasoningModel,
  recordModelUsage,
  getCostSavingsReport,
  getAvailableModels,
  hasLocalModels,
  type RoutingDecision,
  type TaskRequirements,
  type ModelRouterConfig,
  type ModelInfo,
} from './model-selection.js';
