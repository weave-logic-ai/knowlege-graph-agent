/**
 * Embeddings System
 *
 * Public API for the memorographic embeddings system.
 */

// Types
export type {
  EmbeddingProvider,
  EmbeddingModelConfig,
  EmbeddingModelType,
  EmbeddingRecord,
  Embedding,
  VectorEmbedding,
  EmbeddingRequest,
  EmbeddingResponse,
  SimilarityResult,
  HybridSearchResult,
  SearchConfig,
  CacheEntry,
  EmbeddingStats,
  VectorQuery,
  VectorStorageOptions,
  BatchEmbeddingRequest,
  BatchEmbeddingResult,
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

// Batch processing
export {
  BatchEmbeddingProcessor,
} from './batch-processor.js';

// File-based vector storage
export {
  FileVectorStorage,
} from './storage/vector-storage.js';
