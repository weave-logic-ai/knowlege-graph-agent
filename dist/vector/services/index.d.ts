/**
 * Vector Services
 *
 * Exports all vector service modules for the knowledge-graph-agent.
 * Includes:
 * - Vector store for HNSW-based similarity search
 * - Trajectory tracker for agent operation logging and self-learning
 * - Embedding service for generating text embeddings
 * - Hybrid search for combining vector and full-text search
 *
 * @module vector/services
 */
export { EnhancedVectorStore, createVectorStore } from './vector-store.js';
export { TrajectoryTracker, createTrajectoryTracker, type TrajectoryTrackerConfig, type DetectedPattern, } from './trajectory-tracker.js';
export { EmbeddingService, createEmbeddingService, getDefaultEmbeddingService, type EmbeddingConfig, type EmbeddingResult, type BatchEmbeddingResult, } from './embedding-service.js';
export { HybridSearch, createHybridSearch, type HybridSearchConfig, type FTSResult, type FTSProvider, type ExtendedHybridSearchResult, type HybridSearchQuery, type HybridSearchResponse, type SearchStats, } from './hybrid-search.js';
//# sourceMappingURL=index.d.ts.map