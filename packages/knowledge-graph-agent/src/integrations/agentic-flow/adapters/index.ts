/**
 * Agentic-Flow Adapters
 *
 * Export all adapter classes and factory functions for optional
 * agentic-flow integration components.
 *
 * @module integrations/agentic-flow/adapters
 */

// Base adapter
export {
  BaseAdapter,
  type AdapterStatus,
  type HealthCheckable,
  type MetricsTrackable,
} from './base-adapter.js';

// Model router adapter
export {
  ModelRouterAdapter,
  createModelRouterAdapter,
  MODEL_REGISTRY,
  type ModelProvider,
  type ModelCapabilities,
  type ModelInfo,
  type TaskRequirements,
  type RoutingDecision,
  type ModelRouterConfig,
  type ModelUsageStats,
} from './model-router-adapter.js';

// AgentDB vector store adapter
export {
  AgentDBVectorStore,
  createAgentDBVectorStore,
  type AgentDBVectorConfig,
  type VectorSearchResult,
  type UpsertBatchEntry,
  type HybridSearchOptions,
  type VectorStoreStats,
} from './agentdb-vector-store.js';

// AgentDB adapter (alternate implementation)
export {
  AgentDBAdapter,
  createAgentDBAdapter,
  defaultAgentDBConfig,
  type AgentDBConfig,
} from './agentdb-adapter.js';

// ReasoningBank adapter
export {
  ReasoningBankAdapter,
  createReasoningBankAdapter,
  type ReasoningBankConfig,
  type TrajectoryStep,
  type Trajectory,
  type TrajectoryInput,
  type Verdict,
  type TaskDescription,
  type DistillationResult,
} from './reasoning-bank-adapter.js';

// AgentBooster adapter
export {
  AgentBoosterAdapter,
  createAgentBoosterAdapter,
  type AgentBoosterConfig,
  type SupportedLanguage,
  type TransformRequest,
  type TransformResult,
  type BatchTransformRequest,
  type BatchTransformResult,
} from './agent-booster-adapter.js';

// QUIC Transport adapter
export {
  QUICTransportAdapter,
  createQUICTransportAdapter,
  defaultQUICTransportConfig,
  type QUICTransportConfig,
  type ConnectionState,
  type QUICStream,
  type TransportMessage,
  type ConnectionStats,
} from './quic-transport-adapter.js';

// FederationHub adapter
export {
  FederationHubAdapter,
  createFederationHubAdapter,
  defaultFederationHubConfig,
  type FederationHubConfig,
  type FederatedAgent,
  type DistributedTask,
  type ConsensusProposal,
  type FederationStats,
} from './federation-hub-adapter.js';
