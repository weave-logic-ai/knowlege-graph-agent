/**
 * Batch Embedding Processor Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { BatchEmbeddingProcessor } from '../../src/embeddings/batch-processor.js';
import { EmbeddingModelManager } from '../../src/embeddings/models/model-manager.js';

describe('BatchEmbeddingProcessor', () => {
  let processor: BatchEmbeddingProcessor;

  beforeEach(() => {
    processor = new BatchEmbeddingProcessor();
  });

  afterEach(async () => {
    // Cleanup models
    const manager = EmbeddingModelManager.getInstance();
    await manager.unloadAll();
  });

  describe('Single Chunk Processing', () => {
    it('should process single chunk successfully', async () => {
      const result = await processor.processOne(
        'This is a test chunk.',
        'chunk-001',
        'all-MiniLM-L6-v2'
      );

      expect(result.id).toBeDefined();
      expect(result.chunkId).toBe('chunk-001');
      expect(result.vector).toBeInstanceOf(Array);
      expect(result.vector.length).toBe(384);
      expect(result.dimensions).toBe(384);
      expect(result.model).toBe('all-MiniLM-L6-v2');
      expect(result.createdAt).toBeInstanceOf(Date);
    }, 60000);

    it('should include metadata', async () => {
      const result = await processor.processOne(
        'Test content',
        'chunk-002',
        'all-MiniLM-L6-v2'
      );

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.textLength).toBe(12);
      expect(result.metadata!.processingTime).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Batch Processing', () => {
    it('should process multiple chunks', async () => {
      const chunks = [
        { id: 'chunk-1', content: 'First chunk content' },
        { id: 'chunk-2', content: 'Second chunk content' },
        { id: 'chunk-3', content: 'Third chunk content' },
      ];

      const result = await processor.process({
        chunks,
        modelType: 'all-MiniLM-L6-v2',
      });

      expect(result.embeddings.length).toBe(3);
      expect(result.stats.totalChunks).toBe(3);
      expect(result.errors.length).toBe(0);
    }, 60000);

    it('should respect batch size', async () => {
      const chunks = Array.from({ length: 10 }, (_, i) => ({
        id: `chunk-${i}`,
        content: `Content ${i}`,
      }));

      const result = await processor.process({
        chunks,
        modelType: 'all-MiniLM-L6-v2',
        batchSize: 3, // Should process in 4 batches (3+3+3+1)
      });

      expect(result.embeddings.length).toBe(10);
      expect(result.stats.totalBatches).toBe(4);
    }, 60000);

    it('should report progress', async () => {
      const chunks = Array.from({ length: 5 }, (_, i) => ({
        id: `chunk-${i}`,
        content: `Content ${i}`,
      }));

      const progressUpdates: Array<{ completed: number; total: number }> = [];

      await processor.process({
        chunks,
        modelType: 'all-MiniLM-L6-v2',
        batchSize: 2,
        onProgress: (completed, total) => {
          progressUpdates.push({ completed, total });
        },
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1].completed).toBe(5);
    }, 60000);
  });

  describe('Statistics', () => {
    it('should compute correct statistics', async () => {
      const chunks = Array.from({ length: 5 }, (_, i) => ({
        id: `chunk-${i}`,
        content: `Test content ${i}`,
      }));

      const result = await processor.process({
        chunks,
        modelType: 'all-MiniLM-L6-v2',
        batchSize: 2,
      });

      expect(result.stats.totalChunks).toBe(5);
      expect(result.stats.totalBatches).toBe(3);
      expect(result.stats.dimensions).toBe(384);
      expect(result.stats.avgProcessingTime).toBeGreaterThan(0);
      expect(result.stats.totalProcessingTime).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Error Handling', () => {
    it('should handle empty chunks array', async () => {
      const result = await processor.process({
        chunks: [],
        modelType: 'all-MiniLM-L6-v2',
      });

      expect(result.embeddings.length).toBe(0);
      expect(result.stats.totalChunks).toBe(0);
    }, 60000);

    it('should continue processing after batch errors', async () => {
      const chunks = [
        { id: 'chunk-1', content: 'Valid content' },
        { id: 'chunk-2', content: '' }, // Empty might cause issues
        { id: 'chunk-3', content: 'More valid content' },
      ];

      const result = await processor.process({
        chunks,
        modelType: 'all-MiniLM-L6-v2',
      });

      // Should process at least some chunks
      expect(result.embeddings.length).toBeGreaterThan(0);
    }, 60000);
  });
});
