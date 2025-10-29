/**
 * Embedding System Types
 *
 * Type definitions for the memorographic embeddings system.
 */

/**
 * Embedding provider
 */
export type EmbeddingProvider =
  | 'openai'
  | 'anthropic'
  | 'local';

/**
 * Embedding model configuration
 */
export interface EmbeddingModelConfig {
  provider: EmbeddingProvider;
  model: string;
  apiKey?: string;
  dimensions: number;
  maxTokens?: number;
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
 * Similarity search result
 */
export interface SimilarityResult {
  chunkId: string;
  similarity: number;
  distance: number;
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
}
