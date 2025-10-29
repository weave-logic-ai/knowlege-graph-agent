/**
 * Embedding Model Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  EmbeddingModelManager,
  TransformersEmbeddingModel,
} from '../../src/embeddings/models/model-manager.js';
import type { EmbeddingModelType } from '../../src/embeddings/types.js';

describe('TransformersEmbeddingModel', () => {
  let model: TransformersEmbeddingModel;

  beforeEach(() => {
    model = new TransformersEmbeddingModel('all-MiniLM-L6-v2');
  });

  afterEach(async () => {
    if (model.isLoaded()) {
      await model.unload();
    }
  });

  describe('Basic Properties', () => {
    it('should have correct model type', () => {
      expect(model.modelType).toBe('all-MiniLM-L6-v2');
    });

    it('should have correct dimensions', () => {
      expect(model.dimensions).toBe(384);
    });

    it('should have correct max sequence length', () => {
      expect(model.maxSequenceLength).toBe(512);
    });

    it('should not be loaded initially', () => {
      expect(model.isLoaded()).toBe(false);
    });
  });

  describe('Model Loading', () => {
    it('should initialize model successfully', async () => {
      await model.initialize();
      expect(model.isLoaded()).toBe(true);
    }, 60000); // 60s timeout for model download

    it('should handle multiple initialize calls', async () => {
      await model.initialize();
      await model.initialize(); // Should not error
      expect(model.isLoaded()).toBe(true);
    }, 60000);
  });

  describe('Embedding Generation', () => {
    beforeEach(async () => {
      await model.initialize();
    }, 60000);

    it('should generate embedding for single text', async () => {
      const text = 'This is a test sentence.';
      const embedding = await model.embed(text);

      expect(embedding).toBeInstanceOf(Array);
      expect(embedding.length).toBe(384);
      expect(typeof embedding[0]).toBe('number');
    });

    it('should generate embeddings for batch', async () => {
      const texts = [
        'First test sentence.',
        'Second test sentence.',
        'Third test sentence.',
      ];

      const embeddings = await model.embedBatch(texts);

      expect(embeddings).toBeInstanceOf(Array);
      expect(embeddings.length).toBe(3);
      expect(embeddings[0].length).toBe(384);
    });

    it('should generate different embeddings for different texts', async () => {
      const emb1 = await model.embed('Hello world');
      const emb2 = await model.embed('Goodbye world');

      // Embeddings should be different
      expect(emb1).not.toEqual(emb2);
    });

    it('should generate similar embeddings for similar texts', async () => {
      const emb1 = await model.embed('The cat sat on the mat');
      const emb2 = await model.embed('A cat sat on a mat');

      // Calculate cosine similarity
      let dotProduct = 0;
      let norm1 = 0;
      let norm2 = 0;

      for (let i = 0; i < emb1.length; i++) {
        dotProduct += emb1[i] * emb2[i];
        norm1 += emb1[i] * emb1[i];
        norm2 += emb2[i] * emb2[i];
      }

      const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));

      // Similar texts should have high similarity (> 0.8)
      expect(similarity).toBeGreaterThan(0.8);
    });
  });

  describe('Cleanup', () => {
    it('should unload model successfully', async () => {
      await model.initialize();
      expect(model.isLoaded()).toBe(true);

      await model.unload();
      expect(model.isLoaded()).toBe(false);
    }, 60000);
  });
});

describe('EmbeddingModelManager', () => {
  let manager: EmbeddingModelManager;

  beforeEach(() => {
    manager = EmbeddingModelManager.getInstance();
  });

  afterEach(async () => {
    await manager.unloadAll();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const manager1 = EmbeddingModelManager.getInstance();
      const manager2 = EmbeddingModelManager.getInstance();

      expect(manager1).toBe(manager2);
    });
  });

  describe('Model Management', () => {
    it('should get supported models list', () => {
      const models = manager.getSupportedModels();

      expect(models).toContain('all-MiniLM-L6-v2');
      expect(models).toContain('all-mpnet-base-v2');
      expect(models).toContain('paraphrase-multilingual-MiniLM-L12-v2');
      expect(models).toContain('paraphrase-multilingual-mpnet-base-v2');
    });

    it('should get model configuration', () => {
      const config = manager.getModelConfig('all-MiniLM-L6-v2');

      expect(config.modelType).toBe('all-MiniLM-L6-v2');
      expect(config.dimensions).toBe(384);
      expect(config.maxSequenceLength).toBe(512);
    });

    it('should load and cache model', async () => {
      const model1 = await manager.getModel('all-MiniLM-L6-v2');
      const model2 = await manager.getModel('all-MiniLM-L6-v2');

      // Should return cached instance
      expect(model1).toBe(model2);
      expect(model1.isLoaded()).toBe(true);
    }, 60000);

    it('should unload specific model', async () => {
      await manager.getModel('all-MiniLM-L6-v2');
      await manager.unloadModel('all-MiniLM-L6-v2');

      // Model should be removed from cache
      const model = await manager.getModel('all-MiniLM-L6-v2');
      expect(model).toBeDefined();
    }, 60000);

    it('should unload all models', async () => {
      await manager.getModel('all-MiniLM-L6-v2');
      await manager.unloadAll();

      // All models should be removed
      const model = await manager.getModel('all-MiniLM-L6-v2');
      expect(model).toBeDefined(); // New instance
    }, 60000);
  });
});
