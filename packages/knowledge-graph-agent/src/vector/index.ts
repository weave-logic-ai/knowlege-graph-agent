/**
 * Vector Module
 *
 * Exports all vector-related functionality for the knowledge-graph-agent.
 * This module provides configuration, types, services, and utilities for working
 * with vector embeddings, similarity search, and agent trajectory tracking.
 *
 * @module vector
 *
 * @example
 * ```typescript
 * import {
 *   createRuVectorConfig,
 *   validateRuVectorConfig,
 *   createVectorStore,
 *   createTrajectoryTracker,
 *   type VectorEntry,
 *   type SearchResult,
 *   type HybridSearchQuery,
 * } from './vector/index.js';
 *
 * // Create and validate configuration
 * const config = createRuVectorConfig();
 * const validation = validateRuVectorConfig(config);
 *
 * if (!validation.valid) {
 *   throw new Error(`Invalid config: ${validation.errors.join(', ')}`);
 * }
 *
 * // Create a trajectory tracker for agent operations
 * const tracker = createTrajectoryTracker({
 *   maxTrajectories: 1000,
 *   enableAutoLearning: true,
 * });
 *
 * // Track agent operations
 * const trajectoryId = tracker.startTrajectory('agent-1');
 * tracker.addStep(trajectoryId, {
 *   action: 'search',
 *   state: { query: 'example' },
 *   outcome: 'success',
 *   duration: 100
 * });
 * tracker.finalizeTrajectory(trajectoryId, { success: true });
 * ```
 */

// Configuration exports
export {
  createRuVectorConfig,
  createHighPerformanceConfig,
  createLowMemoryConfig,
  createHybridSearchConfig,
  validateRuVectorConfig,
  getRecommendedConfig,
  DEFAULT_HNSW_CONFIG,
  DEFAULT_INDEX_CONFIG,
  DEFAULT_CACHE_CONFIG,
  DEFAULT_PERFORMANCE_CONFIG,
  defaultConfig,
  type RuVectorConfig,
  type VectorBackend,
  type ConfigValidationResult,
  type ValidationResult,
  type HNSWConfig,
  type PostgresBackendConfig,
  type CloudBackendConfig,
  type StandaloneBackendConfig,
} from './config.js';

// Type exports
export type {
  DistanceMetric,
  IndexType,
  SearchSource,
  VectorEntry,
  SearchResult,
  HybridSearchQuery,
  HybridSearchResult,
  BatchInsertEntry,
  BatchInsertOperation,
  BatchInsertResult,
  VectorIndexStats,
  VectorSearchOptions,
  VectorIndexConfig,
  VectorStoreEvent,
  VectorStoreEventListener,
  IVectorStore,
  TrajectoryStep,
  AgentTrajectory,
  SonaLearningRecord,
  GraphNode,
  GraphEdge,
  CypherQueryResult,
  VectorUpdateOperation,
  VectorDeleteOperation,
  VectorDeleteResult,
  VectorNamespace,
} from './types.js';

// Service exports
export {
  EnhancedVectorStore,
  createVectorStore,
  TrajectoryTracker,
  createTrajectoryTracker,
  type TrajectoryTrackerConfig,
  type DetectedPattern,
  EmbeddingService,
  createEmbeddingService,
  getDefaultEmbeddingService,
  type EmbeddingConfig,
  type EmbeddingResult,
  type BatchEmbeddingResult,
  HybridSearch,
  createHybridSearch,
  type HybridSearchConfig,
  type FTSResult,
  type FTSProvider,
  type ExtendedHybridSearchResult,
  type HybridSearchQuery as ServiceHybridSearchQuery,
  type HybridSearchResponse,
  type SearchStats,
} from './services/index.js';
