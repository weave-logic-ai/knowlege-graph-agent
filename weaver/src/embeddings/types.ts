/**
 * Embedding System Types
 *
 * Comprehensive type definitions for the memorographic embeddings system.
 * Supports multiple providers (OpenAI, Anthropic, local) and transformer models.
 */

/**
 * Embedding provider types
 */
export type EmbeddingProvider =
  | 'openai'
  | 'anthropic'
  | 'local';

/**
 * Supported local embedding models (transformer-based)
 */
export type EmbeddingModelType =
  | 'all-MiniLM-L6-v2'           // 384 dimensions, English
  | 'all-mpnet-base-v2'          // 768 dimensions, English
  | 'paraphrase-multilingual-MiniLM-L12-v2'  // 384 dimensions, 50+ languages
  | 'paraphrase-multilingual-mpnet-base-v2'; // 768 dimensions, 50+ languages

/**
 * Embedding model configuration
 * Supports both API providers and local transformer models
 */
export interface EmbeddingModelConfig {
  // API provider configuration
  provider?: EmbeddingProvider;
  model?: string;
  apiKey?: string;

  // Local transformer model configuration
  modelType?: EmbeddingModelType;
  modelPath?: string;

  // Common properties
  dimensions: number;
  maxTokens?: number;
  maxSequenceLength?: number;
  pooling?: 'mean' | 'cls' | 'max';
  normalize?: boolean;
}

/**
 * Embedding record in database
 */
export interface EmbeddingRecord {
  id: number;
  embedding_id: string;
  chunk_id: string;
  vector: string; // JSON serialized vector
  model: string;
  provider: string;
  dimensions: number;
  created_at: string;
}

/**
 * Embedding metadata
 */
export interface EmbeddingMetadata {
  docId?: string;
  contentType?: string;
  memoryLevel?: string;
  textLength?: number;
  tokenCount?: number;
  batchId?: string;
  processingTime?: number;
}

/**
 * Embedding with metadata
 */
export interface Embedding {
  id: string;
  chunkId: string;
  vector: number[];
  model: string;
  provider: string;
  dimensions: number;
  createdAt: Date;
  metadata?: EmbeddingMetadata;
}

/**
 * Vector embedding result (Phase 12 enhanced)
 * Alias for Embedding with consistent naming
 */
export interface VectorEmbedding extends Embedding {
  // Inherits all Embedding properties
}

/**
 * Embedding generation request
 */
export interface EmbeddingRequest {
  text: string;
  chunkId?: string;
  model?: string;
}

/**
 * Embedding generation response
 */
export interface EmbeddingResponse {
  embedding: Embedding;
  usage?: {
    tokens: number;
    cost?: number;
  };
}

/**
 * Batch embedding request (Phase 12)
 */
export interface BatchEmbeddingRequest {
  chunks: Array<{
    id: string;
    content: string;
  }>;
  modelType?: EmbeddingModelType;
  model?: string;
  batchSize?: number;
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Batch embedding result (Phase 12)
 */
export interface BatchEmbeddingResult {
  embeddings: VectorEmbedding[];
  stats: {
    totalChunks: number;
    totalBatches: number;
    avgProcessingTime: number;
    totalProcessingTime: number;
    dimensions: number;
  };
  errors: Array<{
    chunkId: string;
    error: string;
  }>;
}

/**
 * Similarity search result
 * Unified type supporting both API and local model results
 */
export interface SimilarityResult {
  embeddingId?: string; // Phase 12 field
  chunkId: string;
  similarity: number;
  distance?: number; // API provider field
  vector?: number[]; // Phase 12 field
  metadata?: EmbeddingMetadata; // Phase 12 field
}

/**
 * Hybrid search result
 */
export interface HybridSearchResult {
  chunkId: string;
  content: string;
  similarity: number;
  ftsScore?: number;
  combinedScore: number;
}

/**
 * Search configuration
 */
export interface SearchConfig {
  query: string;
  limit?: number;
  similarityThreshold?: number;
  useHybrid?: boolean;
  ftsWeight?: number;
  vectorWeight?: number;
}

/**
 * Vector query for similarity search (Phase 12)
 */
export interface VectorQuery {
  vector: number[];
  topK?: number;
  threshold?: number;
  filters?: {
    docId?: string;
    contentType?: string;
    memoryLevel?: string;
  };
}

/**
 * Vector storage options (Phase 12)
 */
export interface VectorStorageOptions {
  storageDir: string;
  format?: 'json' | 'binary';
  compression?: boolean;
  indexing?: boolean;
}

/**
 * Embedding cache entry
 */
export interface CacheEntry {
  key: string;
  embedding: Embedding;
  timestamp: number;
  hits: number;
}

/**
 * Embedding statistics
 */
export interface EmbeddingStats {
  totalEmbeddings: number;
  totalDimensions: number;
  providers: Record<string, number>;
  models: Record<string, number>;
  cacheHits: number;
  cacheMisses: number;
  cacheSize: number;
  totalSize?: number; // Phase 12 field
}

// ============================================================================
// Phase 12 Interfaces
// ============================================================================

/**
 * Embedding model interface (Phase 12)
 * Interface for local transformer-based embedding models
 */
export interface IEmbeddingModel {
  readonly modelType: EmbeddingModelType;
  readonly dimensions: number;
  readonly maxSequenceLength: number;

  /**
   * Initialize the model
   */
  initialize(): Promise<void>;

  /**
   * Generate embedding for single text
   */
  embed(text: string): Promise<number[]>;

  /**
   * Generate embeddings for batch of texts
   */
  embedBatch(texts: string[]): Promise<number[][]>;

  /**
   * Check if model is loaded
   */
  isLoaded(): boolean;

  /**
   * Unload model from memory
   */
  unload(): Promise<void>;
}

/**
 * Vector storage interface (Phase 12)
 * Interface for storing and retrieving vector embeddings
 */
export interface IVectorStorage {
  /**
   * Store single embedding
   */
  store(embedding: VectorEmbedding): Promise<void>;

  /**
   * Store multiple embeddings
   */
  storeBatch(embeddings: VectorEmbedding[]): Promise<void>;

  /**
   * Retrieve embedding by ID
   */
  retrieve(embeddingId: string): Promise<VectorEmbedding | null>;

  /**
   * Retrieve multiple embeddings
   */
  retrieveBatch(embeddingIds: string[]): Promise<VectorEmbedding[]>;

  /**
   * Find similar vectors
   */
  findSimilar(query: VectorQuery): Promise<SimilarityResult[]>;

  /**
   * Delete embedding
   */
  delete(embeddingId: string): Promise<void>;

  /**
   * Get storage statistics
   */
  getStats(): Promise<{
    totalEmbeddings: number;
    totalSize: number;
    dimensions: number;
  }>;
}
