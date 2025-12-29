/**
 * Embedding Service Tests
 *
 * Tests for the EmbeddingService that generates text embeddings
 * using transformer models via @xenova/transformers.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  EmbeddingService,
  createEmbeddingService,
  getDefaultEmbeddingService,
} from '../../../src/vector/services/embedding-service.js';

// Mock the transformers pipeline for unit tests
// In integration tests, we would use the real pipeline
vi.mock('@xenova/transformers', () => {
  const mockPipeline = vi.fn().mockImplementation(async (texts: string | string[]) => {
    const textArray = Array.isArray(texts) ? texts : [texts];
    const dimensions = 384;
    const data = new Float32Array(textArray.length * dimensions);

    // Fill with deterministic values based on text hash
    for (let i = 0; i < textArray.length; i++) {
      const text = textArray[i];
      const hash = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      for (let j = 0; j < dimensions; j++) {
        data[i * dimensions + j] = Math.sin(hash + j) * 0.1;
      }
    }

    return {
      data,
    };
  });

  return {
    pipeline: vi.fn().mockResolvedValue(mockPipeline),
    Pipeline: vi.fn(),
  };
});

describe('EmbeddingService', () => {
  describe('constructor', () => {
    it('should create with default configuration', () => {
      const service = new EmbeddingService();
      const config = service.getConfig();

      expect(config.model).toBe('Xenova/all-MiniLM-L6-v2');
      expect(config.dimensions).toBe(384);
      expect(config.maxLength).toBe(512);
      expect(config.batchSize).toBe(32);
      expect(config.normalize).toBe(true);
      expect(config.pooling).toBe('mean');
    });

    it('should accept custom configuration', () => {
      const service = new EmbeddingService({
        model: 'custom/model',
        dimensions: 768,
        batchSize: 64,
      });
      const config = service.getConfig();

      expect(config.model).toBe('custom/model');
      expect(config.dimensions).toBe(768);
      expect(config.batchSize).toBe(64);
    });
  });

  describe('getDimensions', () => {
    it('should return configured dimensions', () => {
      const service = new EmbeddingService({ dimensions: 512 });
      expect(service.getDimensions()).toBe(512);
    });
  });

  describe('getModelInfo', () => {
    it('should return model information', () => {
      const service = new EmbeddingService({
        model: 'test/model',
        dimensions: 256,
        quantized: true,
      });
      const info = service.getModelInfo();

      expect(info.model).toBe('test/model');
      expect(info.dimensions).toBe(256);
      expect(info.quantized).toBe(true);
    });
  });

  describe('isReady', () => {
    it('should return false before initialization', () => {
      const service = new EmbeddingService();
      expect(service.isReady()).toBe(false);
    });

    it('should return true after initialization', async () => {
      const service = new EmbeddingService();
      await service.initialize();
      expect(service.isReady()).toBe(true);
    });
  });

  describe('initialize', () => {
    it('should only initialize once', async () => {
      const service = new EmbeddingService();

      await service.initialize();
      await service.initialize();

      expect(service.isReady()).toBe(true);
    });

    it('should handle concurrent initialization calls', async () => {
      const service = new EmbeddingService();

      await Promise.all([
        service.initialize(),
        service.initialize(),
        service.initialize(),
      ]);

      expect(service.isReady()).toBe(true);
    });
  });

  describe('embed', () => {
    it('should generate embedding for text', async () => {
      const service = new EmbeddingService();
      const result = await service.embed('Hello, world!');

      expect(result.embedding).toBeInstanceOf(Float32Array);
      expect(result.embedding.length).toBe(384);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should auto-initialize if not initialized', async () => {
      const service = new EmbeddingService();
      expect(service.isReady()).toBe(false);

      await service.embed('Test text');

      expect(service.isReady()).toBe(true);
    });

    it('should return consistent embeddings for same text', async () => {
      const service = new EmbeddingService();
      const text = 'Consistent text';

      const result1 = await service.embed(text);
      const result2 = await service.embed(text);

      expect(Array.from(result1.embedding)).toEqual(Array.from(result2.embedding));
    });

    it('should return different embeddings for different text', async () => {
      const service = new EmbeddingService();

      const result1 = await service.embed('First text');
      const result2 = await service.embed('Second text');

      // At least some values should differ
      let different = false;
      for (let i = 0; i < result1.embedding.length; i++) {
        if (result1.embedding[i] !== result2.embedding[i]) {
          different = true;
          break;
        }
      }
      expect(different).toBe(true);
    });
  });

  describe('embedBatch', () => {
    it('should generate embeddings for multiple texts', async () => {
      const service = new EmbeddingService();
      const texts = ['First', 'Second', 'Third'];

      const result = await service.embedBatch(texts);

      expect(result.embeddings.length).toBe(3);
      expect(result.successCount).toBe(3);
      expect(result.errorCount).toBe(0);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty batch', async () => {
      const service = new EmbeddingService();
      const result = await service.embedBatch([]);

      expect(result.embeddings.length).toBe(0);
      expect(result.successCount).toBe(0);
      expect(result.errorCount).toBe(0);
    });

    it('should process large batches in chunks', async () => {
      const service = new EmbeddingService({ batchSize: 2 });
      const texts = ['One', 'Two', 'Three', 'Four', 'Five'];

      const result = await service.embedBatch(texts);

      expect(result.embeddings.length).toBe(5);
      expect(result.successCount).toBe(5);
    });

    it('should report average time per text', async () => {
      const service = new EmbeddingService();
      const texts = ['A', 'B', 'C', 'D'];

      const result = await service.embedBatch(texts);
      const avgTime = result.durationMs / texts.length;

      expect(avgTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('text truncation', () => {
    it('should handle very long texts', async () => {
      const service = new EmbeddingService({ maxLength: 100 });
      const longText = 'a'.repeat(10000);

      const result = await service.embed(longText);

      expect(result.embedding).toBeInstanceOf(Float32Array);
      expect(result.embedding.length).toBe(384);
    });

    it('should not truncate short texts', async () => {
      const service = new EmbeddingService();
      const shortText = 'Short text';

      const result = await service.embed(shortText);

      expect(result.embedding).toBeInstanceOf(Float32Array);
    });
  });
});

describe('createEmbeddingService', () => {
  it('should create a new service with default config', () => {
    const service = createEmbeddingService();
    expect(service).toBeInstanceOf(EmbeddingService);
    expect(service.getDimensions()).toBe(384);
  });

  it('should create a new service with custom config', () => {
    const service = createEmbeddingService({
      dimensions: 768,
      model: 'custom/model',
    });
    expect(service).toBeInstanceOf(EmbeddingService);
    expect(service.getDimensions()).toBe(768);
  });
});

describe('getDefaultEmbeddingService', () => {
  it('should return a singleton instance', () => {
    const service1 = getDefaultEmbeddingService();
    const service2 = getDefaultEmbeddingService();
    expect(service1).toBe(service2);
  });

  it('should return an EmbeddingService instance', () => {
    const service = getDefaultEmbeddingService();
    expect(service).toBeInstanceOf(EmbeddingService);
  });
});

describe('Performance', () => {
  it('should embed text within 100ms (after initialization)', async () => {
    const service = new EmbeddingService();
    await service.initialize();

    const start = Date.now();
    await service.embed('Test performance');
    const duration = Date.now() - start;

    // Allow generous time for mock, real model would be faster after warmup
    expect(duration).toBeLessThan(100);
  });

  it('should batch embed efficiently', async () => {
    const service = new EmbeddingService();
    const texts = Array.from({ length: 10 }, (_, i) => `Document ${i}`);

    const result = await service.embedBatch(texts);
    const avgTime = result.durationMs / texts.length;

    // Average time per text should be reasonable
    expect(avgTime).toBeLessThan(50);
  });
});
