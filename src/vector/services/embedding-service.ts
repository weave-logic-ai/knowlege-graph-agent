/**
 * Embedding Service
 *
 * Provides text embedding generation using transformer models via @xenova/transformers.
 * Uses the all-MiniLM-L6-v2 model (384 dimensions) by default for efficient local inference.
 *
 * @module vector/services/embedding-service
 */

import { pipeline, type Pipeline, type FeatureExtractionPipeline } from '@xenova/transformers';
import { createLogger } from '../../utils/index.js';

const logger = createLogger('embedding-service');

/**
 * Configuration for the embedding service
 */
export interface EmbeddingConfig {
  /**
   * Model identifier for the embedding model
   * @default 'Xenova/all-MiniLM-L6-v2'
   */
  model: string;

  /**
   * Expected output dimensions for embeddings
   * @default 384
   */
  dimensions: number;

  /**
   * Maximum input text length in characters (not tokens)
   * Longer texts will be truncated
   * @default 512
   */
  maxLength: number;

  /**
   * Number of texts to process in a single batch
   * @default 32
   */
  batchSize: number;

  /**
   * Whether to normalize embeddings to unit length
   * @default true
   */
  normalize: boolean;

  /**
   * Pooling strategy for generating embeddings from token outputs
   * @default 'mean'
   */
  pooling: 'mean' | 'cls' | 'none';

  /**
   * Enable quantization for reduced memory usage
   * @default false
   */
  quantized: boolean;
}

/**
 * Default configuration for embedding service
 * Uses all-MiniLM-L6-v2 which provides a good balance of quality and speed
 */
const DEFAULT_CONFIG: EmbeddingConfig = {
  model: 'Xenova/all-MiniLM-L6-v2',
  dimensions: 384,
  maxLength: 512,
  batchSize: 32,
  normalize: true,
  pooling: 'mean',
  quantized: false,
};

/**
 * Result of embedding generation
 */
export interface EmbeddingResult {
  /**
   * The embedding vector
   */
  embedding: Float32Array;

  /**
   * Time taken to generate the embedding in milliseconds
   */
  durationMs: number;

  /**
   * Number of input tokens (approximate)
   */
  tokenCount?: number;
}

/**
 * Result of batch embedding generation
 */
export interface BatchEmbeddingResult {
  /**
   * Array of embedding vectors
   */
  embeddings: Float32Array[];

  /**
   * Total time taken in milliseconds
   */
  durationMs: number;

  /**
   * Number of texts successfully embedded
   */
  successCount: number;

  /**
   * Number of texts that failed
   */
  errorCount: number;

  /**
   * Error details for failed texts
   */
  errors?: Array<{ index: number; error: string }>;
}

/**
 * Embedding Service
 *
 * Provides text embedding generation using transformer models.
 * Supports single and batch operations with automatic initialization.
 *
 * @example
 * ```typescript
 * const service = new EmbeddingService();
 * await service.initialize();
 *
 * // Single embedding
 * const embedding = await service.embed('Hello, world!');
 *
 * // Batch embeddings
 * const embeddings = await service.embedBatch([
 *   'First document',
 *   'Second document',
 *   'Third document'
 * ]);
 * ```
 */
export class EmbeddingService {
  private pipeline: FeatureExtractionPipeline | null = null;
  private config: EmbeddingConfig;
  private initPromise: Promise<void> | null = null;
  private isInitialized: boolean = false;

  /**
   * Create a new EmbeddingService
   *
   * @param config - Optional configuration overrides
   */
  constructor(config: Partial<EmbeddingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the embedding pipeline
   *
   * Loads the transformer model. This is called automatically on first use
   * but can be called explicitly to pre-load the model.
   *
   * @throws Error if model loading fails
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      logger.info('Loading embedding model', { model: this.config.model });
      const startTime = Date.now();

      // Load the feature extraction pipeline
      this.pipeline = (await pipeline(
        'feature-extraction',
        this.config.model,
        { quantized: this.config.quantized }
      )) as FeatureExtractionPipeline;

      const durationMs = Date.now() - startTime;
      logger.info('Embedding model loaded', {
        model: this.config.model,
        durationMs,
      });

      this.isInitialized = true;
    } catch (error) {
      this.initPromise = null;
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to load embedding model', new Error(message), {
        model: this.config.model,
      });
      throw new Error(`Failed to initialize embedding service: ${message}`);
    }
  }

  /**
   * Generate embedding for a single text
   *
   * @param text - Text to embed
   * @returns Embedding result with vector and metadata
   * @throws Error if not initialized or embedding fails
   */
  async embed(text: string): Promise<EmbeddingResult> {
    await this.initialize();

    if (!this.pipeline) {
      throw new Error('Embedding pipeline not initialized');
    }

    const startTime = Date.now();

    // Truncate text if too long
    const truncated = this.truncateText(text);

    try {
      const output = await this.pipeline(truncated, {
        pooling: this.config.pooling,
        normalize: this.config.normalize,
      });

      // Extract the embedding data
      const embedding = this.extractEmbedding(output);

      const durationMs = Date.now() - startTime;

      logger.debug('Generated embedding', {
        inputLength: text.length,
        truncated: text.length !== truncated.length,
        durationMs,
      });

      return {
        embedding,
        durationMs,
        tokenCount: Math.ceil(truncated.length / 4), // Rough estimate
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Embedding generation failed', new Error(message));
      throw new Error(`Failed to generate embedding: ${message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts
   *
   * Processes texts in batches for efficiency.
   *
   * @param texts - Array of texts to embed
   * @returns Batch result with embeddings and metadata
   */
  async embedBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    await this.initialize();

    if (!this.pipeline) {
      throw new Error('Embedding pipeline not initialized');
    }

    const startTime = Date.now();
    const results: Float32Array[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    // Process in batches
    for (let i = 0; i < texts.length; i += this.config.batchSize) {
      const batch = texts.slice(i, i + this.config.batchSize);
      const truncatedBatch = batch.map((t) => this.truncateText(t));

      try {
        // Process batch
        const outputs = await this.pipeline(truncatedBatch, {
          pooling: this.config.pooling,
          normalize: this.config.normalize,
        });

        // Extract embeddings from batch output
        const batchEmbeddings = this.extractBatchEmbeddings(outputs, batch.length);
        results.push(...batchEmbeddings);
      } catch (error) {
        // Fall back to individual processing on batch error
        logger.warn('Batch embedding failed, falling back to individual', {
          batchIndex: i / this.config.batchSize,
        });

        for (let j = 0; j < batch.length; j++) {
          try {
            const output = await this.pipeline(truncatedBatch[j], {
              pooling: this.config.pooling,
              normalize: this.config.normalize,
            });
            results.push(this.extractEmbedding(output));
          } catch (individualError) {
            errors.push({
              index: i + j,
              error: individualError instanceof Error ? individualError.message : String(individualError),
            });
            // Push zero vector as placeholder
            results.push(new Float32Array(this.config.dimensions));
          }
        }
      }
    }

    const durationMs = Date.now() - startTime;

    logger.info('Batch embedding completed', {
      totalTexts: texts.length,
      successCount: texts.length - errors.length,
      errorCount: errors.length,
      durationMs,
      avgTimePerText: durationMs / texts.length,
    });

    return {
      embeddings: results,
      durationMs,
      successCount: texts.length - errors.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Truncate text to maximum length
   *
   * @param text - Text to truncate
   * @returns Truncated text
   */
  private truncateText(text: string): string {
    if (text.length <= this.config.maxLength * 4) {
      return text;
    }
    // Truncate at word boundary if possible
    const truncated = text.slice(0, this.config.maxLength * 4);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > this.config.maxLength * 2) {
      return truncated.slice(0, lastSpace);
    }
    return truncated;
  }

  /**
   * Extract embedding from pipeline output
   *
   * @param output - Pipeline output tensor
   * @returns Float32Array embedding
   */
  private extractEmbedding(output: unknown): Float32Array {
    // Handle different output formats from transformers.js
    if (output && typeof output === 'object') {
      const outputObj = output as Record<string, unknown>;

      // Check for .data property (Tensor object)
      if ('data' in outputObj && outputObj.data) {
        const data = outputObj.data;
        if (data instanceof Float32Array) {
          return data.slice(0, this.config.dimensions);
        }
        if (ArrayBuffer.isView(data)) {
          return new Float32Array(data.buffer, data.byteOffset, this.config.dimensions);
        }
        if (Array.isArray(data)) {
          return new Float32Array(data.slice(0, this.config.dimensions));
        }
      }

      // Check for nested array structure
      if (Array.isArray(outputObj)) {
        const flattened = this.flattenArray(outputObj);
        return new Float32Array(flattened.slice(0, this.config.dimensions));
      }
    }

    throw new Error('Unexpected output format from embedding pipeline');
  }

  /**
   * Extract multiple embeddings from batch output
   *
   * @param output - Pipeline output tensor for batch
   * @param batchSize - Number of items in the batch
   * @returns Array of embeddings
   */
  private extractBatchEmbeddings(output: unknown, batchSize: number): Float32Array[] {
    const results: Float32Array[] = [];

    if (output && typeof output === 'object') {
      const outputObj = output as Record<string, unknown>;

      if ('data' in outputObj && outputObj.data) {
        const data = outputObj.data;
        let dataArray: Float32Array;

        if (data instanceof Float32Array) {
          dataArray = data;
        } else if (ArrayBuffer.isView(data)) {
          dataArray = new Float32Array(data.buffer, data.byteOffset);
        } else if (Array.isArray(data)) {
          dataArray = new Float32Array(data as number[]);
        } else {
          throw new Error('Unexpected data format in batch output');
        }

        // Split the data array into individual embeddings
        for (let i = 0; i < batchSize; i++) {
          const start = i * this.config.dimensions;
          const embedding = dataArray.slice(start, start + this.config.dimensions);
          results.push(embedding);
        }

        return results;
      }
    }

    throw new Error('Unexpected output format from batch embedding pipeline');
  }

  /**
   * Flatten nested array
   *
   * @param arr - Array to flatten
   * @returns Flattened number array
   */
  private flattenArray(arr: unknown[]): number[] {
    const result: number[] = [];
    for (const item of arr) {
      if (Array.isArray(item)) {
        result.push(...this.flattenArray(item));
      } else if (typeof item === 'number') {
        result.push(item);
      }
    }
    return result;
  }

  /**
   * Get the embedding dimensions
   *
   * @returns Number of dimensions in generated embeddings
   */
  getDimensions(): number {
    return this.config.dimensions;
  }

  /**
   * Get the current configuration
   *
   * @returns Copy of the current configuration
   */
  getConfig(): EmbeddingConfig {
    return { ...this.config };
  }

  /**
   * Check if the service is initialized
   *
   * @returns True if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get model information
   *
   * @returns Model details
   */
  getModelInfo(): { model: string; dimensions: number; quantized: boolean } {
    return {
      model: this.config.model,
      dimensions: this.config.dimensions,
      quantized: this.config.quantized,
    };
  }
}

/**
 * Create an embedding service instance
 *
 * Factory function for creating embedding services.
 *
 * @param config - Optional configuration overrides
 * @returns New EmbeddingService instance
 *
 * @example
 * ```typescript
 * // Default configuration (all-MiniLM-L6-v2, 384 dimensions)
 * const service = createEmbeddingService();
 *
 * // Custom configuration
 * const customService = createEmbeddingService({
 *   model: 'Xenova/all-MiniLM-L12-v2',
 *   dimensions: 384,
 *   batchSize: 64,
 * });
 * ```
 */
export function createEmbeddingService(config?: Partial<EmbeddingConfig>): EmbeddingService {
  return new EmbeddingService(config);
}

/**
 * Default embedding service singleton
 * Created lazily on first use
 */
let defaultService: EmbeddingService | null = null;

/**
 * Get the default embedding service
 *
 * Returns a shared singleton instance for convenience.
 * Use createEmbeddingService() for custom configurations.
 *
 * @returns Default EmbeddingService instance
 */
export function getDefaultEmbeddingService(): EmbeddingService {
  if (!defaultService) {
    defaultService = new EmbeddingService();
  }
  return defaultService;
}
