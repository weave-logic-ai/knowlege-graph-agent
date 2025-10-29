/**
 * Embedding Manager
 *
 * Orchestrates embedding generation, storage, and caching.
 * Provides high-level API for working with embeddings.
 */

import { EmbeddingGenerator } from './embedding-generator.js';
import { VectorStorage } from './vector-storage.js';
import { createLogger } from '../utils/logger.js';
import type {
  EmbeddingRequest,
  EmbeddingResponse,
  Embedding,
  CacheEntry,
  EmbeddingStats,
  EmbeddingProvider,
} from './types.js';

const logger = createLogger('embeddings:manager');

/**
 * Custom error for embedding manager operations
 */
export class EmbeddingManagerError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'EmbeddingManagerError';
  }
}

export class EmbeddingManager {
  private generator: EmbeddingGenerator;
  private storage: VectorStorage;
  private cache: Map<string, CacheEntry>;
  private cacheHits = 0;
  private cacheMisses = 0;
  private readonly maxCacheSize: number;

  constructor(
    storagePath: string,
    provider: EmbeddingProvider = 'openai',
    model = 'text-embedding-3-small',
    apiKey?: string,
    maxCacheSize = 1000
  ) {
    // Initialize components
    this.storage = new VectorStorage(storagePath);
    this.cache = new Map();
    this.maxCacheSize = maxCacheSize;

    // Import dynamically to avoid circular dependency
    import('./embedding-generator.js').then(({ createEmbeddingGenerator }) => {
      this.generator = createEmbeddingGenerator(provider, model, apiKey);
      logger.info('Embedding manager initialized', {
        provider,
        model,
        maxCacheSize,
      });
    });

    this.generator = {} as EmbeddingGenerator; // Temporary placeholder
  }

  /**
   * Generate and store embedding for text
   *
   * @param request - Embedding request
   * @param useCache - Whether to use cache
   * @returns Embedding response
   */
  async generateAndStore(
    request: EmbeddingRequest,
    useCache = true
  ): Promise<EmbeddingResponse> {
    try {
      // Check cache first
      if (useCache) {
        const cacheKey = this.getCacheKey(request.text);
        const cached = this.cache.get(cacheKey);

        if (cached) {
          this.cacheHits++;
          cached.hits++;
          logger.debug('Cache hit', { cacheKey });

          return {
            embedding: cached.embedding,
            usage: { tokens: 0 }, // No API call made
          };
        }

        this.cacheMisses++;
      }

      // Generate embedding
      const response = await this.generator.generate(request);

      // Store in database
      this.storage.storeEmbedding(response.embedding);

      // Store in cache
      if (useCache) {
        this.addToCache(request.text, response.embedding);
      }

      logger.info('Generated and stored embedding', {
        embeddingId: response.embedding.id,
        chunkId: request.chunkId,
      });

      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to generate and store embedding', err);
      throw new EmbeddingManagerError('Failed to generate and store embedding', err);
    }
  }

  /**
   * Generate and store embeddings for multiple texts (batch)
   *
   * @param requests - Array of embedding requests
   * @param useCache - Whether to use cache
   * @returns Array of embedding responses
   */
  async generateAndStoreBatch(
    requests: EmbeddingRequest[],
    useCache = true
  ): Promise<EmbeddingResponse[]> {
    const startTime = Date.now();

    try {
      logger.info('Processing embeddings batch', { count: requests.length });

      const responses: EmbeddingResponse[] = [];
      const toGenerate: EmbeddingRequest[] = [];

      // Check cache first
      if (useCache) {
        for (const request of requests) {
          const cacheKey = this.getCacheKey(request.text);
          const cached = this.cache.get(cacheKey);

          if (cached) {
            this.cacheHits++;
            cached.hits++;
            responses.push({
              embedding: cached.embedding,
              usage: { tokens: 0 },
            });
          } else {
            this.cacheMisses++;
            toGenerate.push(request);
          }
        }
      } else {
        toGenerate.push(...requests);
      }

      // Generate missing embeddings
      if (toGenerate.length > 0) {
        const generated = await this.generator.generateBatch(toGenerate);

        // Store in database
        const embeddings = generated.map(r => r.embedding);
        this.storage.storeEmbeddings(embeddings);

        // Store in cache
        if (useCache) {
          for (let i = 0; i < toGenerate.length; i++) {
            const request = toGenerate[i];
            const response = generated[i];
            if (request && response) {
              this.addToCache(request.text, response.embedding);
            }
          }
        }

        responses.push(...generated);
      }

      const durationMs = Date.now() - startTime;

      logger.info('Embeddings batch complete', {
        total: requests.length,
        cached: requests.length - toGenerate.length,
        generated: toGenerate.length,
        duration: durationMs,
      });

      return responses;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to process embeddings batch', err);
      throw new EmbeddingManagerError('Failed to process embeddings batch', err);
    }
  }

  /**
   * Get embedding for a chunk
   *
   * @param chunkId - Chunk ID
   * @returns Embedding or null
   */
  getEmbedding(chunkId: string): Embedding | null {
    try {
      return this.storage.getEmbedding(chunkId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get embedding', err, { chunkId });
      throw new EmbeddingManagerError('Failed to get embedding', err);
    }
  }

  /**
   * Delete embedding for a chunk
   *
   * @param chunkId - Chunk ID
   */
  deleteEmbedding(chunkId: string): void {
    try {
      this.storage.deleteEmbedding(chunkId);
      logger.info('Deleted embedding', { chunkId });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete embedding', err, { chunkId });
      throw new EmbeddingManagerError('Failed to delete embedding', err);
    }
  }

  /**
   * Get embedding statistics
   */
  getStats(): EmbeddingStats {
    const storageStats = this.storage.getStats();

    return {
      totalEmbeddings: storageStats.totalEmbeddings,
      totalDimensions: storageStats.avgDimensions * storageStats.totalEmbeddings,
      providers: storageStats.providers,
      models: storageStats.models,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheSize: this.cache.size,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    logger.info('Cache cleared');
  }

  /**
   * Close embedding manager and release resources
   */
  close(): void {
    this.storage.close();
    this.clearCache();
    logger.info('Embedding manager closed');
  }

  /**
   * Get cache key for text
   */
  private getCacheKey(text: string): string {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Add embedding to cache
   */
  private addToCache(text: string, embedding: Embedding): void {
    const cacheKey = this.getCacheKey(text);

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(cacheKey, {
      key: cacheKey,
      embedding,
      timestamp: Date.now(),
      hits: 0,
    });

    logger.debug('Added to cache', { cacheKey, cacheSize: this.cache.size });
  }

  /**
   * Get vector storage instance (for advanced queries)
   */
  getVectorStorage(): VectorStorage {
    return this.storage;
  }

  /**
   * Get embedding generator instance
   */
  getGenerator(): EmbeddingGenerator {
    return this.generator;
  }
}

/**
 * Create an embedding manager instance
 */
export function createEmbeddingManager(
  storagePath: string,
  provider: EmbeddingProvider = 'openai',
  model = 'text-embedding-3-small',
  apiKey?: string,
  maxCacheSize = 1000
): EmbeddingManager {
  return new EmbeddingManager(storagePath, provider, model, apiKey, maxCacheSize);
}
