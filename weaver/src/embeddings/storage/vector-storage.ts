/**
 * Vector Storage System
 *
 * File-based storage for vector embeddings with similarity search.
 */

import fs from 'fs/promises';
import path from 'path';
import type {
  IVectorStorage,
  VectorEmbedding,
  VectorQuery,
  SimilarityResult,
  VectorStorageOptions,
} from '../types.js';
import { logger } from '../../utils/logger.js';

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * File-based Vector Storage
 */
export class FileVectorStorage implements IVectorStorage {
  private options: VectorStorageOptions;
  private indexPath: string;
  private index: Map<string, VectorEmbedding> = new Map();
  private initialized = false;

  constructor(options: VectorStorageOptions) {
    this.options = {
      format: 'json',
      compression: false,
      indexing: true,
      ...options,
    };
    this.indexPath = path.join(options.storageDir, '_index.json');
  }

  /**
   * Initialize storage
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create storage directory
      await fs.mkdir(this.options.storageDir, { recursive: true });

      // Load index if it exists
      if (this.options.indexing) {
        try {
          const indexData = await fs.readFile(this.indexPath, 'utf-8');
          const indexArray: VectorEmbedding[] = JSON.parse(indexData);

          // Rebuild index map
          for (const embedding of indexArray) {
            this.index.set(embedding.id, embedding);
          }

          logger.debug('Vector index loaded', {
            count: this.index.size,
          });
        } catch (error) {
          // Index doesn't exist yet, that's OK
          logger.debug('No existing vector index found, creating new one');
        }
      }

      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize vector storage', error as Error);
      throw error;
    }
  }

  /**
   * Save index to disk
   */
  private async saveIndex(): Promise<void> {
    if (!this.options.indexing) return;

    try {
      const indexArray = Array.from(this.index.values());
      await fs.writeFile(
        this.indexPath,
        JSON.stringify(indexArray, null, 2),
        'utf-8'
      );
    } catch (error) {
      logger.error('Failed to save vector index', error as Error);
      throw error;
    }
  }

  async store(embedding: VectorEmbedding): Promise<void> {
    await this.initialize();

    try {
      const embeddingPath = path.join(
        this.options.storageDir,
        `${embedding.id}.json`
      );

      // Store embedding file
      await fs.writeFile(
        embeddingPath,
        JSON.stringify(embedding, null, 2),
        'utf-8'
      );

      // Update index
      if (this.options.indexing) {
        this.index.set(embedding.id, embedding);
        await this.saveIndex();
      }

      logger.debug('Embedding stored', {
        embeddingId: embedding.id,
        dimensions: embedding.dimensions,
      });
    } catch (error) {
      logger.error('Failed to store embedding', error as Error, {
        embeddingId: embedding.id,
      });
      throw error;
    }
  }

  async storeBatch(embeddings: VectorEmbedding[]): Promise<void> {
    await this.initialize();

    try {
      // Store all embeddings in parallel
      await Promise.all(embeddings.map(emb => this.storeEmbeddingFile(emb)));

      // Update index
      if (this.options.indexing) {
        for (const embedding of embeddings) {
          this.index.set(embedding.id, embedding);
        }
        await this.saveIndex();
      }

      logger.info('Batch embeddings stored', {
        count: embeddings.length,
      });
    } catch (error) {
      logger.error('Failed to store batch embeddings', error as Error);
      throw error;
    }
  }

  private async storeEmbeddingFile(embedding: VectorEmbedding): Promise<void> {
    const embeddingPath = path.join(
      this.options.storageDir,
      `${embedding.id}.json`
    );

    await fs.writeFile(
      embeddingPath,
      JSON.stringify(embedding, null, 2),
      'utf-8'
    );
  }

  async retrieve(embeddingId: string): Promise<VectorEmbedding | null> {
    await this.initialize();

    try {
      // Check index first
      if (this.options.indexing && this.index.has(embeddingId)) {
        return this.index.get(embeddingId)!;
      }

      // Load from file
      const embeddingPath = path.join(
        this.options.storageDir,
        `${embeddingId}.json`
      );

      const data = await fs.readFile(embeddingPath, 'utf-8');
      const embedding: VectorEmbedding = JSON.parse(data);

      return embedding;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null; // Not found
      }
      logger.error('Failed to retrieve embedding', error as Error, {
        embeddingId,
      });
      throw error;
    }
  }

  async retrieveBatch(embeddingIds: string[]): Promise<VectorEmbedding[]> {
    await this.initialize();

    const embeddings = await Promise.all(
      embeddingIds.map(id => this.retrieve(id))
    );

    return embeddings.filter((emb): emb is VectorEmbedding => emb !== null);
  }

  async findSimilar(query: VectorQuery): Promise<SimilarityResult[]> {
    await this.initialize();

    try {
      const topK = query.topK || 10;
      const threshold = query.threshold || 0.0;

      // Get all embeddings from index or files
      let candidates: VectorEmbedding[];

      if (this.options.indexing) {
        candidates = Array.from(this.index.values());
      } else {
        // Load all embedding files
        const files = await fs.readdir(this.options.storageDir);
        const embeddingFiles = files.filter(f => f.endsWith('.json') && f !== '_index.json');

        candidates = await Promise.all(
          embeddingFiles.map(async file => {
            const data = await fs.readFile(
              path.join(this.options.storageDir, file),
              'utf-8'
            );
            return JSON.parse(data) as VectorEmbedding;
          })
        );
      }

      // Apply filters
      if (query.filters) {
        candidates = candidates.filter(emb => {
          if (query.filters!.docId && emb.metadata?.docId !== query.filters!.docId) {
            return false;
          }
          if (query.filters!.contentType && emb.metadata?.contentType !== query.filters!.contentType) {
            return false;
          }
          if (query.filters!.memoryLevel && emb.metadata?.memoryLevel !== query.filters!.memoryLevel) {
            return false;
          }
          return true;
        });
      }

      // Calculate similarities
      const results: SimilarityResult[] = candidates.map(emb => ({
        embeddingId: emb.id,
        chunkId: emb.chunkId,
        similarity: cosineSimilarity(query.vector, emb.vector),
        metadata: emb.metadata,
      }));

      // Filter by threshold and sort by similarity
      const filtered = results
        .filter(r => r.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      logger.debug('Similarity search completed', {
        candidates: candidates.length,
        results: filtered.length,
        topK,
        threshold,
      });

      return filtered;
    } catch (error) {
      logger.error('Similarity search failed', error as Error);
      throw error;
    }
  }

  async delete(embeddingId: string): Promise<void> {
    await this.initialize();

    try {
      const embeddingPath = path.join(
        this.options.storageDir,
        `${embeddingId}.json`
      );

      await fs.unlink(embeddingPath);

      if (this.options.indexing) {
        this.index.delete(embeddingId);
        await this.saveIndex();
      }

      logger.debug('Embedding deleted', { embeddingId });
    } catch (error) {
      logger.error('Failed to delete embedding', error as Error, {
        embeddingId,
      });
      throw error;
    }
  }

  async getStats(): Promise<{ totalEmbeddings: number; totalSize: number; dimensions: number }> {
    await this.initialize();

    try {
      const files = await fs.readdir(this.options.storageDir);
      const embeddingFiles = files.filter(f => f.endsWith('.json') && f !== '_index.json');

      let totalSize = 0;
      let dimensions = 0;

      for (const file of embeddingFiles) {
        const filePath = path.join(this.options.storageDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;

        // Get dimensions from first file
        if (dimensions === 0) {
          const data = await fs.readFile(filePath, 'utf-8');
          const embedding: VectorEmbedding = JSON.parse(data);
          dimensions = embedding.dimensions;
        }
      }

      return {
        totalEmbeddings: embeddingFiles.length,
        totalSize,
        dimensions,
      };
    } catch (error) {
      logger.error('Failed to get storage stats', error as Error);
      throw error;
    }
  }
}
