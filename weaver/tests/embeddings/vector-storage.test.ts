/**
 * Vector Storage Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { FileVectorStorage } from '../../src/embeddings/storage/vector-storage.js';
import type { VectorEmbedding } from '../../src/embeddings/types.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('FileVectorStorage', () => {
  let storage: FileVectorStorage;
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vector-storage-test-'));
    storage = new FileVectorStorage({
      storageDir: tempDir,
      indexing: true,
    });
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const createTestEmbedding = (id: string): VectorEmbedding => ({
    id,
    chunkId: `chunk-${id}`,
    vector: Array.from({ length: 384 }, () => Math.random()),
    dimensions: 384,
    model: 'all-MiniLM-L6-v2',
    createdAt: new Date(),
    metadata: {
      docId: 'test-doc',
      contentType: 'semantic',
      textLength: 100,
    },
  });

  describe('Storage Operations', () => {
    it('should store single embedding', async () => {
      const embedding = createTestEmbedding('emb-001');
      await storage.store(embedding);

      // Verify file exists
      const embeddingPath = path.join(tempDir, 'emb-001.json');
      const exists = await fs.access(embeddingPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should retrieve stored embedding', async () => {
      const embedding = createTestEmbedding('emb-002');
      await storage.store(embedding);

      const retrieved = await storage.retrieve('emb-002');

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe('emb-002');
      expect(retrieved!.chunkId).toBe('chunk-emb-002');
      expect(retrieved!.dimensions).toBe(384);
    });

    it('should return null for non-existent embedding', async () => {
      const retrieved = await storage.retrieve('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should store batch of embeddings', async () => {
      const embeddings = [
        createTestEmbedding('emb-010'),
        createTestEmbedding('emb-011'),
        createTestEmbedding('emb-012'),
      ];

      await storage.storeBatch(embeddings);

      const retrieved = await storage.retrieveBatch(['emb-010', 'emb-011', 'emb-012']);
      expect(retrieved.length).toBe(3);
    });

    it('should retrieve batch of embeddings', async () => {
      const embeddings = [
        createTestEmbedding('emb-020'),
        createTestEmbedding('emb-021'),
      ];

      await storage.storeBatch(embeddings);

      const retrieved = await storage.retrieveBatch(['emb-020', 'emb-021']);
      expect(retrieved.length).toBe(2);
      expect(retrieved[0].id).toBe('emb-020');
      expect(retrieved[1].id).toBe('emb-021');
    });

    it('should delete embedding', async () => {
      const embedding = createTestEmbedding('emb-030');
      await storage.store(embedding);

      await storage.delete('emb-030');

      const retrieved = await storage.retrieve('emb-030');
      expect(retrieved).toBeNull();
    });
  });

  describe('Similarity Search', () => {
    beforeEach(async () => {
      // Store test embeddings
      const embeddings = [
        createTestEmbedding('emb-100'),
        createTestEmbedding('emb-101'),
        createTestEmbedding('emb-102'),
      ];

      await storage.storeBatch(embeddings);
    });

    it('should find similar vectors', async () => {
      const queryVector = Array.from({ length: 384 }, () => Math.random());

      const results = await storage.findSimilar({
        vector: queryVector,
        topK: 2,
      });

      expect(results.length).toBeLessThanOrEqual(2);
      expect(results[0]).toHaveProperty('embeddingId');
      expect(results[0]).toHaveProperty('similarity');
    });

    it('should sort by similarity descending', async () => {
      const queryVector = Array.from({ length: 384 }, () => Math.random());

      const results = await storage.findSimilar({
        vector: queryVector,
        topK: 3,
      });

      // Verify results are sorted by similarity
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].similarity).toBeGreaterThanOrEqual(results[i].similarity);
      }
    });

    it('should respect threshold', async () => {
      const queryVector = Array.from({ length: 384 }, () => Math.random());

      const results = await storage.findSimilar({
        vector: queryVector,
        threshold: 0.9, // High threshold
      });

      // All results should have similarity >= 0.9
      results.forEach(result => {
        expect(result.similarity).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('should filter by metadata', async () => {
      // Store embeddings with different metadata
      const embeddings = [
        {
          ...createTestEmbedding('emb-200'),
          metadata: { docId: 'doc-1', contentType: 'episodic' },
        },
        {
          ...createTestEmbedding('emb-201'),
          metadata: { docId: 'doc-2', contentType: 'semantic' },
        },
      ];

      await storage.storeBatch(embeddings);

      const queryVector = Array.from({ length: 384 }, () => Math.random());

      const results = await storage.findSimilar({
        vector: queryVector,
        filters: { docId: 'doc-1' },
      });

      // Should only return doc-1 results
      results.forEach(result => {
        expect(result.metadata?.docId).toBe('doc-1');
      });
    });
  });

  describe('Statistics', () => {
    it('should compute storage statistics', async () => {
      const embeddings = [
        createTestEmbedding('emb-300'),
        createTestEmbedding('emb-301'),
        createTestEmbedding('emb-302'),
      ];

      await storage.storeBatch(embeddings);

      const stats = await storage.getStats();

      expect(stats.totalEmbeddings).toBe(3);
      expect(stats.dimensions).toBe(384);
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should return zero stats for empty storage', async () => {
      const stats = await storage.getStats();

      expect(stats.totalEmbeddings).toBe(0);
    });
  });

  describe('Indexing', () => {
    it('should maintain index file', async () => {
      const embedding = createTestEmbedding('emb-400');
      await storage.store(embedding);

      const indexPath = path.join(tempDir, '_index.json');
      const exists = await fs.access(indexPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should load existing index on initialization', async () => {
      // Store embedding
      const embedding = createTestEmbedding('emb-500');
      await storage.store(embedding);

      // Create new storage instance (should load index)
      const newStorage = new FileVectorStorage({
        storageDir: tempDir,
        indexing: true,
      });

      const retrieved = await newStorage.retrieve('emb-500');
      expect(retrieved).toBeDefined();
    });
  });
});
