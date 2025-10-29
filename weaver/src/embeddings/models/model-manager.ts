/**
 * Embedding Model Manager
 *
 * Manages loading, caching, and lifecycle of embedding models.
 */

import { pipeline, Pipeline } from '@xenova/transformers';
import type {
  IEmbeddingModel,
  EmbeddingModelType,
  EmbeddingModelConfig,
} from '../types.js';
import { logger } from '../../utils/logger.js';

/**
 * Model configurations
 */
const MODEL_CONFIGS: Record<EmbeddingModelType, EmbeddingModelConfig> = {
  'all-MiniLM-L6-v2': {
    modelType: 'all-MiniLM-L6-v2',
    modelPath: 'Xenova/all-MiniLM-L6-v2',
    dimensions: 384,
    maxSequenceLength: 512,
    pooling: 'mean',
    normalize: true,
  },
  'all-mpnet-base-v2': {
    modelType: 'all-mpnet-base-v2',
    modelPath: 'Xenova/all-mpnet-base-v2',
    dimensions: 768,
    maxSequenceLength: 512,
    pooling: 'mean',
    normalize: true,
  },
  'paraphrase-multilingual-MiniLM-L12-v2': {
    modelType: 'paraphrase-multilingual-MiniLM-L12-v2',
    modelPath: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
    dimensions: 384,
    maxSequenceLength: 512,
    pooling: 'mean',
    normalize: true,
  },
  'paraphrase-multilingual-mpnet-base-v2': {
    modelType: 'paraphrase-multilingual-mpnet-base-v2',
    modelPath: 'Xenova/paraphrase-multilingual-mpnet-base-v2',
    dimensions: 768,
    maxSequenceLength: 512,
    pooling: 'mean',
    normalize: true,
  },
};

/**
 * Transformers.js Embedding Model
 */
export class TransformersEmbeddingModel implements IEmbeddingModel {
  private config: EmbeddingModelConfig;
  private pipeline: Pipeline | null = null;
  private loading: Promise<void> | null = null;

  constructor(modelType: EmbeddingModelType) {
    this.config = MODEL_CONFIGS[modelType];
  }

  get modelType(): EmbeddingModelType {
    return this.config.modelType;
  }

  get dimensions(): number {
    return this.config.dimensions;
  }

  get maxSequenceLength(): number {
    return this.config.maxSequenceLength;
  }

  async initialize(): Promise<void> {
    if (this.pipeline) {
      return; // Already loaded
    }

    if (this.loading) {
      return this.loading; // Wait for existing load
    }

    this.loading = this.loadModel();
    await this.loading;
    this.loading = null;
  }

  private async loadModel(): Promise<void> {
    try {
      logger.info('Loading embedding model', {
        modelType: this.config.modelType,
        modelPath: this.config.modelPath,
      });

      const startTime = Date.now();

      this.pipeline = await pipeline(
        'feature-extraction',
        this.config.modelPath!,
        {
          quantized: true, // Use quantized models for better performance
        }
      ) as Pipeline;

      const loadTime = Date.now() - startTime;

      logger.info('Embedding model loaded successfully', {
        modelType: this.config.modelType,
        dimensions: this.config.dimensions,
        loadTime: `${loadTime}ms`,
      });
    } catch (error) {
      logger.error('Failed to load embedding model', error as Error, {
        modelType: this.config.modelType,
      });
      throw error;
    }
  }

  async embed(text: string): Promise<number[]> {
    if (!this.pipeline) {
      await this.initialize();
    }

    try {
      const output = await this.pipeline!(text, {
        pooling: this.config.pooling || 'mean',
        normalize: this.config.normalize !== false,
      });

      // Extract the embedding vector
      const embedding = Array.from(output.data as Float32Array);

      return embedding;
    } catch (error) {
      logger.error('Embedding generation failed', error as Error, {
        modelType: this.config.modelType,
        textLength: text.length,
      });
      throw error;
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.pipeline) {
      await this.initialize();
    }

    try {
      const embeddings: number[][] = [];

      for (const text of texts) {
        const embedding = await this.embed(text);
        embeddings.push(embedding);
      }

      return embeddings;
    } catch (error) {
      logger.error('Batch embedding generation failed', error as Error, {
        modelType: this.config.modelType,
        batchSize: texts.length,
      });
      throw error;
    }
  }

  isLoaded(): boolean {
    return this.pipeline !== null;
  }

  async unload(): Promise<void> {
    if (this.pipeline) {
      // Transformers.js doesn't have explicit cleanup
      // Just remove reference for garbage collection
      this.pipeline = null;

      logger.info('Embedding model unloaded', {
        modelType: this.config.modelType,
      });
    }
  }
}

/**
 * Model Manager - Singleton for managing models
 */
export class EmbeddingModelManager {
  private static instance: EmbeddingModelManager;
  private models: Map<EmbeddingModelType, IEmbeddingModel> = new Map();

  private constructor() {}

  static getInstance(): EmbeddingModelManager {
    if (!EmbeddingModelManager.instance) {
      EmbeddingModelManager.instance = new EmbeddingModelManager();
    }
    return EmbeddingModelManager.instance;
  }

  /**
   * Get or create model instance
   */
  async getModel(modelType: EmbeddingModelType): Promise<IEmbeddingModel> {
    let model = this.models.get(modelType);

    if (!model) {
      model = new TransformersEmbeddingModel(modelType);
      this.models.set(modelType, model);
    }

    if (!model.isLoaded()) {
      await model.initialize();
    }

    return model;
  }

  /**
   * Unload specific model
   */
  async unloadModel(modelType: EmbeddingModelType): Promise<void> {
    const model = this.models.get(modelType);
    if (model) {
      await model.unload();
      this.models.delete(modelType);
    }
  }

  /**
   * Unload all models
   */
  async unloadAll(): Promise<void> {
    const unloadPromises = Array.from(this.models.values()).map(model =>
      model.unload()
    );
    await Promise.all(unloadPromises);
    this.models.clear();
  }

  /**
   * Get list of supported models
   */
  getSupportedModels(): EmbeddingModelType[] {
    return Object.keys(MODEL_CONFIGS) as EmbeddingModelType[];
  }

  /**
   * Get model configuration
   */
  getModelConfig(modelType: EmbeddingModelType): EmbeddingModelConfig {
    return MODEL_CONFIGS[modelType];
  }
}
