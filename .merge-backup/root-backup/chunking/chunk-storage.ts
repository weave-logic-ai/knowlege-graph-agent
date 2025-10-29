/**
 * Chunk Storage
 *
 * SQLite storage for chunks with FTS5 full-text search indexing.
 */

import Database from 'better-sqlite3';
import { dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { createLogger } from '../utils/logger.js';
import type { Chunk, ChunkRecord, ChunkRelationship, RelationshipType } from './types.js';

const logger = createLogger('chunking:storage');

/**
 * Custom error for storage operations
 */
export class ChunkStorageError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ChunkStorageError';
  }
}

export class ChunkStorage {
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
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging
    this.db.pragma('foreign_keys = ON'); // Enable foreign key constraints

    logger.info('Chunk storage database opened', { path: dbPath });

    // Initialize schema
    this.initializeSchema();
  }

  /**
   * Initialize database schema
   */
  private initializeSchema(): void {
    try {
      // Chunks table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS chunks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chunk_id TEXT UNIQUE NOT NULL,
          doc_id TEXT NOT NULL,
          source_path TEXT NOT NULL,
          content TEXT NOT NULL,
          metadata TEXT NOT NULL,
          embedding_id INTEGER,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON chunks(doc_id);
        CREATE INDEX IF NOT EXISTS idx_chunks_source_path ON chunks(source_path);
        CREATE INDEX IF NOT EXISTS idx_chunks_embedding_id ON chunks(embedding_id);

        -- Full-text search index
        CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
          chunk_id UNINDEXED,
          doc_id UNINDEXED,
          content,
          metadata,
          content='chunks',
          content_rowid='id'
        );

        -- Triggers to keep FTS index in sync
        CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
          INSERT INTO chunks_fts(rowid, chunk_id, doc_id, content, metadata)
          VALUES (new.id, new.chunk_id, new.doc_id, new.content, new.metadata);
        END;

        CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
          DELETE FROM chunks_fts WHERE rowid = old.id;
        END;

        CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
          UPDATE chunks_fts
          SET content = new.content, metadata = new.metadata
          WHERE rowid = new.id;
        END;

        -- Chunk relationships table
        CREATE TABLE IF NOT EXISTS chunk_relationships (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_chunk_id TEXT NOT NULL,
          target_chunk_id TEXT NOT NULL,
          relationship_type TEXT NOT NULL,
          strength REAL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (source_chunk_id) REFERENCES chunks(chunk_id) ON DELETE CASCADE,
          FOREIGN KEY (target_chunk_id) REFERENCES chunks(chunk_id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_relationships_source ON chunk_relationships(source_chunk_id);
        CREATE INDEX IF NOT EXISTS idx_relationships_target ON chunk_relationships(target_chunk_id);
        CREATE INDEX IF NOT EXISTS idx_relationships_type ON chunk_relationships(relationship_type);
      `);

      logger.info('Chunk storage schema initialized');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to initialize schema', err);
      throw new ChunkStorageError('Failed to initialize chunk storage schema', err);
    }
  }

  /**
   * Store a chunk
   */
  storeChunk(chunk: Chunk): void {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO chunks (chunk_id, doc_id, source_path, content, metadata, embedding_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        chunk.id,
        chunk.metadata.doc_id,
        chunk.metadata.source_path,
        chunk.content,
        JSON.stringify(chunk.metadata),
        null // embedding_id will be set later
      );

      logger.debug('Stored chunk', { chunkId: chunk.id, docId: chunk.metadata.doc_id });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to store chunk', err, { chunkId: chunk.id });
      throw new ChunkStorageError(`Failed to store chunk ${chunk.id}`, err);
    }
  }

  /**
   * Store multiple chunks in a transaction
   */
  storeChunks(chunks: Chunk[]): void {
    const insert = this.db.transaction((chunks: Chunk[]) => {
      for (const chunk of chunks) {
        this.storeChunk(chunk);
      }
    });

    try {
      insert(chunks);
      logger.info('Stored chunks batch', { count: chunks.length });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to store chunks batch', err);
      throw new ChunkStorageError('Failed to store chunks batch', err);
    }
  }

  /**
   * Get chunk by ID
   */
  getChunk(chunkId: string): Chunk | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM chunks WHERE chunk_id = ?');
      const record = stmt.get(chunkId) as ChunkRecord | undefined;

      if (!record) {
        return null;
      }

      return this.recordToChunk(record);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get chunk', err, { chunkId });
      throw new ChunkStorageError(`Failed to get chunk ${chunkId}`, err);
    }
  }

  /**
   * Get chunks by document ID
   */
  getChunksByDocId(docId: string): Chunk[] {
    try {
      const stmt = this.db.prepare('SELECT * FROM chunks WHERE doc_id = ? ORDER BY id');
      const records = stmt.all(docId) as ChunkRecord[];

      return records.map(r => this.recordToChunk(r));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get chunks by doc ID', err, { docId });
      throw new ChunkStorageError(`Failed to get chunks for document ${docId}`, err);
    }
  }

  /**
   * Full-text search chunks
   */
  searchChunks(query: string, limit = 10): Chunk[] {
    try {
      const stmt = this.db.prepare(`
        SELECT c.*
        FROM chunks c
        JOIN chunks_fts fts ON c.id = fts.rowid
        WHERE chunks_fts MATCH ?
        ORDER BY rank
        LIMIT ?
      `);

      const records = stmt.all(query, limit) as ChunkRecord[];
      return records.map(r => this.recordToChunk(r));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to search chunks', err, { query });
      throw new ChunkStorageError('Failed to search chunks', err);
    }
  }

  /**
   * Store chunk relationship
   */
  storeRelationship(
    sourceChunkId: string,
    targetChunkId: string,
    type: RelationshipType,
    strength?: number
  ): void {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO chunk_relationships (source_chunk_id, target_chunk_id, relationship_type, strength)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(sourceChunkId, targetChunkId, type, strength || null);

      logger.debug('Stored chunk relationship', {
        source: sourceChunkId,
        target: targetChunkId,
        type,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to store relationship', err);
      throw new ChunkStorageError('Failed to store chunk relationship', err);
    }
  }

  /**
   * Get relationships for a chunk
   */
  getRelationships(chunkId: string, type?: RelationshipType): ChunkRelationship[] {
    try {
      const sql = type
        ? 'SELECT * FROM chunk_relationships WHERE source_chunk_id = ? AND relationship_type = ?'
        : 'SELECT * FROM chunk_relationships WHERE source_chunk_id = ?';

      const stmt = this.db.prepare(sql);
      const params = type ? [chunkId, type] : [chunkId];

      return stmt.all(...params) as ChunkRelationship[];
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get relationships', err, { chunkId });
      throw new ChunkStorageError('Failed to get chunk relationships', err);
    }
  }

  /**
   * Delete chunks by document ID
   */
  deleteChunksByDocId(docId: string): void {
    try {
      const stmt = this.db.prepare('DELETE FROM chunks WHERE doc_id = ?');
      const result = stmt.run(docId);

      logger.info('Deleted chunks', { docId, count: result.changes });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete chunks', err, { docId });
      throw new ChunkStorageError(`Failed to delete chunks for document ${docId}`, err);
    }
  }

  /**
   * Get storage statistics
   */
  getStats(): {
    totalChunks: number;
    totalDocs: number;
    totalRelationships: number;
    dbSize: number;
  } {
    const totalChunks = this.db.prepare('SELECT COUNT(*) as count FROM chunks').get() as { count: number };
    const totalDocs = this.db.prepare('SELECT COUNT(DISTINCT doc_id) as count FROM chunks').get() as { count: number };
    const totalRelationships = this.db.prepare('SELECT COUNT(*) as count FROM chunk_relationships').get() as { count: number };
    const dbSize = this.db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get() as { size: number };

    return {
      totalChunks: totalChunks.count,
      totalDocs: totalDocs.count,
      totalRelationships: totalRelationships.count,
      dbSize: dbSize.size,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      logger.info('Chunk storage database closed');
    }
  }

  /**
   * Convert database record to Chunk
   */
  private recordToChunk(record: ChunkRecord): Chunk {
    return {
      id: record.chunk_id,
      content: record.content,
      metadata: JSON.parse(record.metadata),
      embedding: undefined, // Will be loaded separately if needed
    };
  }

  /**
   * Get raw database instance (for advanced queries)
   */
  getDatabase(): Database.Database {
    return this.db;
  }
}

/**
 * Create a chunk storage instance
 */
export function createChunkStorage(dbPath: string): ChunkStorage {
  return new ChunkStorage(dbPath);
}
