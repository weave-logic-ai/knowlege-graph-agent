/**
 * Vector Storage
 *
 * SQLite storage for embeddings with vector similarity search.
 * Uses JSON serialization for vectors (SQLite vector extension optional).
 */

import Database from 'better-sqlite3';
import { dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { createLogger } from '../utils/logger.js';
import type { Embedding, EmbeddingRecord, SimilarityResult } from './types.js';

const logger = createLogger('embeddings:storage');

/**
 * Custom error for vector storage operations
 */
export class VectorStorageError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'VectorStorageError';
  }
}

export class VectorStorage {
  private db: Database.Database;

  constructor(dbPath: string) {
    // Ensure data directory exists
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      logger.info('Created data directory', { path: dir });
    }

    // Open database
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    logger.info('Vector storage database opened', { path: dbPath });

    // Initialize schema
    this.initializeSchema();
  }

  /**
   * Initialize database schema
   */
  private initializeSchema(): void {
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS embeddings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          embedding_id TEXT UNIQUE NOT NULL,
          chunk_id TEXT NOT NULL,
          vector TEXT NOT NULL,
          model TEXT NOT NULL,
          provider TEXT NOT NULL,
          dimensions INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_embeddings_chunk_id ON embeddings(chunk_id);
        CREATE INDEX IF NOT EXISTS idx_embeddings_model ON embeddings(model);
        CREATE INDEX IF NOT EXISTS idx_embeddings_provider ON embeddings(provider);
      `);

      logger.info('Vector storage schema initialized');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to initialize schema', err);
      throw new VectorStorageError('Failed to initialize vector storage schema', err);
    }
  }

  /**
   * Store an embedding
   */
  storeEmbedding(embedding: Embedding): void {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO embeddings (embedding_id, chunk_id, vector, model, provider, dimensions)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        embedding.id,
        embedding.chunkId,
        JSON.stringify(embedding.vector),
        embedding.model,
        embedding.provider,
        embedding.dimensions
      );

      logger.debug('Stored embedding', {
        embeddingId: embedding.id,
        chunkId: embedding.chunkId,
        dimensions: embedding.dimensions,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to store embedding', err);
      throw new VectorStorageError('Failed to store embedding', err);
    }
  }

  /**
   * Store multiple embeddings in a transaction
   */
  storeEmbeddings(embeddings: Embedding[]): void {
    const insert = this.db.transaction((embeddings: Embedding[]) => {
      for (const embedding of embeddings) {
        this.storeEmbedding(embedding);
      }
    });

    try {
      insert(embeddings);
      logger.info('Stored embeddings batch', { count: embeddings.length });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to store embeddings batch', err);
      throw new VectorStorageError('Failed to store embeddings batch', err);
    }
  }

  /**
   * Get embedding by chunk ID
   */
  getEmbedding(chunkId: string): Embedding | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM embeddings WHERE chunk_id = ? LIMIT 1');
      const record = stmt.get(chunkId) as EmbeddingRecord | undefined;

      if (!record) {
        return null;
      }

      return this.recordToEmbedding(record);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get embedding', err, { chunkId });
      throw new VectorStorageError('Failed to get embedding', err);
    }
  }

  /**
   * Find similar embeddings using cosine similarity
   *
   * @param queryVector - Query vector
   * @param limit - Maximum results
   * @param threshold - Minimum similarity threshold (0-1)
   * @returns Array of similarity results
   */
  findSimilar(queryVector: number[], limit = 10, threshold = 0.7): SimilarityResult[] {
    try {
      // Get all embeddings (for MVP, we compute similarity in-memory)
      // TODO Phase 2: Use SQLite vector extension or external vector DB
      const stmt = this.db.prepare('SELECT * FROM embeddings');
      const records = stmt.all() as EmbeddingRecord[];

      const results: SimilarityResult[] = [];

      for (const record of records) {
        const embedding = this.recordToEmbedding(record);
        const similarity = this.cosineSimilarity(queryVector, embedding.vector);

        if (similarity >= threshold) {
          results.push({
            chunkId: embedding.chunkId,
            similarity,
            distance: 1 - similarity,
          });
        }
      }

      // Sort by similarity descending
      results.sort((a, b) => b.similarity - a.similarity);

      // Return top K results
      return results.slice(0, limit);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find similar embeddings', err);
      throw new VectorStorageError('Failed to find similar embeddings', err);
    }
  }

  /**
   * Delete embedding by chunk ID
   */
  deleteEmbedding(chunkId: string): void {
    try {
      const stmt = this.db.prepare('DELETE FROM embeddings WHERE chunk_id = ?');
      const result = stmt.run(chunkId);

      logger.debug('Deleted embedding', { chunkId, deleted: result.changes > 0 });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete embedding', err, { chunkId });
      throw new VectorStorageError('Failed to delete embedding', err);
    }
  }

  /**
   * Get storage statistics
   */
  getStats(): {
    totalEmbeddings: number;
    providers: Record<string, number>;
    models: Record<string, number>;
    avgDimensions: number;
    dbSize: number;
  } {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM embeddings').get() as { count: number };

    const providers = this.db.prepare('SELECT provider, COUNT(*) as count FROM embeddings GROUP BY provider').all() as Array<{ provider: string; count: number }>;
    const providerMap: Record<string, number> = {};
    for (const p of providers) {
      providerMap[p.provider] = p.count;
    }

    const models = this.db.prepare('SELECT model, COUNT(*) as count FROM embeddings GROUP BY model').all() as Array<{ model: string; count: number }>;
    const modelMap: Record<string, number> = {};
    for (const m of models) {
      modelMap[m.model] = m.count;
    }

    const avgDims = this.db.prepare('SELECT AVG(dimensions) as avg FROM embeddings').get() as { avg: number };
    const dbSize = this.db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get() as { size: number };

    return {
      totalEmbeddings: total.count,
      providers: providerMap,
      models: modelMap,
      avgDimensions: avgDims.avg || 0,
      dbSize: dbSize.size,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      logger.info('Vector storage database closed');
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      const valA = a[i];
      const valB = b[i];
      if (valA === undefined || valB === undefined) continue;

      dotProduct += valA * valB;
      normA += valA * valA;
      normB += valB * valB;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  /**
   * Convert database record to Embedding
   */
  private recordToEmbedding(record: EmbeddingRecord): Embedding {
    return {
      id: record.embedding_id,
      chunkId: record.chunk_id,
      vector: JSON.parse(record.vector),
      model: record.model,
      provider: record.provider,
      dimensions: record.dimensions,
      createdAt: new Date(record.created_at),
    };
  }

  /**
   * Get raw database instance
   */
  getDatabase(): Database.Database {
    return this.db;
  }
}

/**
 * Create a vector storage instance
 */
export function createVectorStorage(dbPath: string): VectorStorage {
  return new VectorStorage(dbPath);
}
