/**
 * Workflow Module
 *
 * Exports all workflow-related functionality for the Workflow DevKit,
 * including configuration management, type definitions, and GOAP planning support.
 *
 * @module workflow
 *
 * @example
 * ```typescript
 * import {
 *   createWorkflowConfig,
 *   defaultConfig,
 *   type WorldState,
 *   type GOAPAction,
 *   type TaskSpec,
 * } from './workflow/index.js';
 *
 * // Create environment-based configuration
 * const config = createWorkflowConfig();
 *
 * // Define world state for planning
 * const state: WorldState = {
 *   hasSpecification: true,
 *   specCompleteness: 0.7,
 *   hasAcceptanceCriteria: false,
 *   taskDefined: false,
 *   blockersFree: true,
 *   developmentStarted: false,
 *   timeSinceLastChange: 0,
 *   lastChangeTimestamp: Date.now(),
 *   activeCollaborators: [],
 *   pendingGaps: [],
 * };
 * ```
 */
export { createWorkflowConfig, validateWorkflowConfig, createPostgresConfig, createVercelConfig, createLocalConfig, defaultConfig, type WorkflowConfig, type PostgresPoolConfig, type PostgresWorldConfig, type VercelWorldConfig, type LocalWorldConfig, } from './config.js';
export { type WorldState, type NodeUpdateEvent, type GapDetectedEvent, type WorkflowCompleteEvent, type WorkflowRunMetadata, type TaskSpec, type DocumentGap, type GapAnalysis, type GOAPAction, type GOAPGoal, type GOAPPlanStep, type GOAPPlan, type GOAPPlanExtended, type PlanExecutionResult, type ReadinessEvaluation, type WorkflowExecutionOptions, type WorkflowExecutionResult, type HookHandler, type HookRegistration, } from './types.js';
export { WebhookRegistry, FileWatcherIntegration, createWebhookRegistry, createFileWatcherIntegration, type WorkflowTriggerEvent, type WebhookConfig, type WebhookValidation, type WebhookHandler, } from './handlers/index.js';
export { GOAPAdapter, createGOAPAdapter, DEFAULT_GOAP_ACTIONS, type GOAPAdapterConfig, } from './adapters/index.js';
export { WorkflowService, createWorkflowService, type WorkflowServiceConfig, type WorkflowExecutionResult as ServiceExecutionResult, type WorkflowServiceStatus, type WorkflowExecutionStats, } from './services/index.js';
//# sourceMappingURL=index.d.ts.map