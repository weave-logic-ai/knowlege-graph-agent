/**
 * Agentic-Flow Integration Module
 *
 * Provides optional integration with agentic-flow for enhanced AI agent capabilities.
 * All features are opt-in and require the agentic-flow package to be installed.
 *
 * Features:
 * - AgentDB: GNN-enhanced vector database (150x faster search)
 * - ReasoningBank: Adaptive learning and memory distillation
 * - AgentBooster: Dynamic capability enhancement (352x faster transforms)
 * - ModelRouter: Intelligent LLM routing for cost optimization
 * - QUICTransport: High-performance data synchronization
 * - FederationHub: Multi-agent coordination
 *
 * @module integrations/agentic-flow
 */
export { type AgenticFlowConfig, defaultConfig, loadConfigFromEnv, getAgenticFlowConfig, setAgenticFlowConfig, resetAgenticFlowConfig, initializeConfig, isAgenticFlowAvailable, isAgenticFlowEnabled, validateConfig, } from './config.js';
export { FeatureFlags, featureFlags, isFeatureEnabled, withFeature, withFeatureAsync, type FeatureFlagName, type FeatureFlagInfo, } from './feature-flags.js';
export * from './adapters/index.js';
export * from './migration/index.js';
export * from './benchmark/index.js';
//# sourceMappingURL=index.d.ts.map