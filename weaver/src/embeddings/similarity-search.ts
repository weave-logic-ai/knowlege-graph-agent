/**
 * Similarity Search
 *
 * Hybrid search combining FTS5 full-text search with vector similarity.
 */

import { createLogger } from '../utils/logger.js';
import type { ChunkStorage } from '../chunking/chunk-storage.js';
import type { VectorStorage } from './vector-storage.js';
import type { EmbeddingGenerator } from './embedding-generator.js';
import type { SearchConfig, HybridSearchResult } from './types.js';
import type { Chunk } from '../chunking/types.js';

const logger = createLogger('embeddings:search');

/**
 * Custom error for search operations
 */
export class SearchError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'SearchError';
  }
}

export class SimilaritySearch {
  constructor(
    private chunkStorage: ChunkStorage,
    private vectorStorage: VectorStorage,
    private embeddingGenerator: EmbeddingGenerator
  ) {
    logger.info('Similarity search initialized');
  }

  /**
   * Perform hybrid search (FTS + vector similarity)
   *
   * @param config - Search configuration
   * @returns Hybrid search results
   */
  async search(config: SearchConfig): Promise<HybridSearchResult[]> {
    const startTime = Date.now();

    try {
      logger.info('Starting hybrid search', { query: config.query });

      const limit = config.limit || 10;
      const useHybrid = config.useHybrid !== false;
      const ftsWeight = config.ftsWeight || 0.3;
      const vectorWeight = config.vectorWeight || 0.7;

      let results: HybridSearchResult[] = [];

      if (useHybrid) {
        // 1. Full-text search
        const ftsResults = this.chunkStorage.searchChunks(config.query, limit * 2);
        logger.debug('FTS search complete', { results: ftsResults.length });

        // 2. Vector similarity search
        const embeddingResponse = await this.embeddingGenerator.generate({
          text: config.query,
        });
        const similarResults = this.vectorStorage.findSimilar(
          embeddingResponse.embedding.vector,
          limit * 2,
          config.similarityThreshold || 0.7
        );
        logger.debug('Vector search complete', { results: similarResults.length });

        // 3. Combine results
        const scoreMap = new Map<string, { ftsScore: number; vectorScore: number; chunk?: Chunk }>();

        // Add FTS scores
        for (let i = 0; i < ftsResults.length; i++) {
          const chunk = ftsResults[i];
          if (!chunk) continue;

          const score = 1 - (i / ftsResults.length); // Normalized rank score
          scoreMap.set(chunk.id, {
            ftsScore: score,
            vectorScore: 0,
            chunk,
          });
        }

        // Add vector scores
        for (const simResult of similarResults) {
          const existing = scoreMap.get(simResult.chunkId);
          if (existing) {
            existing.vectorScore = simResult.similarity;
          } else {
            const chunk = this.chunkStorage.getChunk(simResult.chunkId);
            if (chunk) {
              scoreMap.set(simResult.chunkId, {
                ftsScore: 0,
                vectorScore: simResult.similarity,
                chunk,
              });
            }
          }
        }

        // 4. Calculate combined scores
        for (const [chunkId, scores] of scoreMap.entries()) {
          if (!scores.chunk) continue;

          const combinedScore = (scores.ftsScore * ftsWeight) + (scores.vectorScore * vectorWeight);

          results.push({
            chunkId,
            content: scores.chunk.content,
            similarity: scores.vectorScore,
            ftsScore: scores.ftsScore,
            combinedScore,
          });
        }

        // 5. Sort by combined score
        results.sort((a, b) => b.combinedScore - a.combinedScore);
      } else {
        // Vector-only search
        const embeddingResponse = await this.embeddingGenerator.generate({
          text: config.query,
        });
        const similarResults = this.vectorStorage.findSimilar(
          embeddingResponse.embedding.vector,
          limit,
          config.similarityThreshold || 0.7
        );

        for (const simResult of similarResults) {
          const chunk = this.chunkStorage.getChunk(simResult.chunkId);
          if (!chunk) continue;

          results.push({
            chunkId: simResult.chunkId,
            content: chunk.content,
            similarity: simResult.similarity,
            combinedScore: simResult.similarity,
          });
        }
      }

      // Limit results
      results = results.slice(0, limit);

      const durationMs = Date.now() - startTime;

      logger.info('Hybrid search complete', {
        query: config.query,
        results: results.length,
        duration: durationMs,
      });

      return results;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Hybrid search failed', err);
      throw new SearchError('Hybrid search failed', err);
    }
  }

  /**
   * Find similar chunks to a given chunk
   *
   * @param chunkId - Source chunk ID
   * @param limit - Maximum results
   * @param threshold - Similarity threshold
   * @returns Similar chunks
   */
  async findSimilarChunks(
    chunkId: string,
    limit = 5,
    threshold = 0.7
  ): Promise<HybridSearchResult[]> {
    try {
      // Get embedding for source chunk
      const embedding = this.vectorStorage.getEmbedding(chunkId);
      if (!embedding) {
        throw new SearchError(`No embedding found for chunk: ${chunkId}`);
      }

      // Find similar vectors
      const similarResults = this.vectorStorage.findSimilar(
        embedding.vector,
        limit + 1, // +1 to exclude self
        threshold
      );

      // Remove self from results
      const filtered = similarResults.filter(r => r.chunkId !== chunkId);

      // Get chunks and create results
      const results: HybridSearchResult[] = [];
      for (const simResult of filtered) {
        const chunk = this.chunkStorage.getChunk(simResult.chunkId);
        if (!chunk) continue;

        results.push({
          chunkId: simResult.chunkId,
          content: chunk.content,
          similarity: simResult.similarity,
          combinedScore: simResult.similarity,
        });
      }

      logger.info('Found similar chunks', {
        sourceChunkId: chunkId,
        results: results.length,
      });

      return results.slice(0, limit);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find similar chunks', err);
      throw new SearchError('Failed to find similar chunks', err);
    }
  }
}

/**
 * Create a similarity search instance
 */
export function createSimilaritySearch(
  chunkStorage: ChunkStorage,
  vectorStorage: VectorStorage,
  embeddingGenerator: EmbeddingGenerator
): SimilaritySearch {
  return new SimilaritySearch(chunkStorage, vectorStorage, embeddingGenerator);
}
