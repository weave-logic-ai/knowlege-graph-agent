/**
 * Embeddings System
 *
 * Public API for the memorographic embeddings system.
 */

// Types
export type {
  EmbeddingProvider,
  EmbeddingModelConfig,
  EmbeddingRecord,
  Embedding,
  EmbeddingRequest,
  EmbeddingResponse,
  SimilarityResult,
  HybridSearchResult,
  SearchConfig,
  CacheEntry,
  EmbeddingStats,
} from './types.js';

// Embedding generation
export {
  EmbeddingGenerator,
  createEmbeddingGenerator,
  EmbeddingGenerationError,
} from './embedding-generator.js';

// Vector storage
export {
  VectorStorage,
  createVectorStorage,
  VectorStorageError,
} from './vector-storage.js';

// Similarity search
export {
  SimilaritySearch,
  createSimilaritySearch,
  SearchError,
} from './similarity-search.js';

// Embedding manager
export {
  EmbeddingManager,
  createEmbeddingManager,
  EmbeddingManagerError,
} from './embedding-manager.js';
