/**
 * Batch Embedding Processor
 *
 * Handles batch processing of embeddings with progress tracking.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  BatchEmbeddingRequest,
  BatchEmbeddingResult,
  VectorEmbedding,
  EmbeddingModelType,
} from './types.js';
import { EmbeddingModelManager } from './models/model-manager.js';
import { logger } from '../utils/logger.js';

/**
 * Batch Embedding Processor
 */
export class BatchEmbeddingProcessor {
  private modelManager: EmbeddingModelManager;

  constructor() {
    this.modelManager = EmbeddingModelManager.getInstance();
  }

  /**
   * Process batch embedding request
   */
  async process(request: BatchEmbeddingRequest): Promise<BatchEmbeddingResult> {
    const startTime = Date.now();
    const batchSize = request.batchSize || 32;
    const totalChunks = request.chunks.length;
    const totalBatches = Math.ceil(totalChunks / batchSize);

    logger.info('🚀 Starting batch embedding processing', {
      totalChunks,
      batchSize,
      totalBatches,
      modelType: request.modelType,
    });

    try {
      // Get model
      const model = await this.modelManager.getModel(request.modelType);

      const embeddings: VectorEmbedding[] = [];
      const errors: Array<{ chunkId: string; error: string }> = [];
      const processingTimes: number[] = [];

      // Process in batches
      for (let i = 0; i < totalChunks; i += batchSize) {
        const batchStartTime = Date.now();
        const batch = request.chunks.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;

        logger.debug('Processing batch', {
          batch: batchNumber,
          totalBatches,
          chunkCount: batch.length,
        });

        try {
          // Extract texts
          const texts = batch.map(chunk => chunk.content);

          // Generate embeddings
          const vectors = await model.embedBatch(texts);

          // Create embedding objects
          for (let j = 0; j < batch.length; j++) {
            const chunk = batch[j];
            const vector = vectors[j];

            const embedding: VectorEmbedding = {
              id: `emb-${uuidv4()}`,
              chunkId: chunk.id,
              vector,
              dimensions: model.dimensions,
              model: request.modelType,
              provider: 'transformers',
              createdAt: new Date(),
              metadata: {
                textLength: chunk.content.length,
                processingTime: Date.now() - batchStartTime,
              },
            };

            embeddings.push(embedding);
          }

          const batchTime = Date.now() - batchStartTime;
          processingTimes.push(batchTime);

          // Report progress
          if (request.onProgress) {
            request.onProgress(embeddings.length, totalChunks);
          }

          logger.debug('Batch completed', {
            batch: batchNumber,
            processingTime: `${batchTime}ms`,
            avgPerChunk: `${(batchTime / batch.length).toFixed(2)}ms`,
          });
        } catch (error) {
          // Log error but continue with other batches
          logger.error('Batch processing failed', error as Error, {
            batch: batchNumber,
          });

          for (const chunk of batch) {
            errors.push({
              chunkId: chunk.id,
              error: (error as Error).message,
            });
          }
        }
      }

      const totalTime = Date.now() - startTime;
      const avgProcessingTime =
        processingTimes.length > 0
          ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
          : 0;

      const result: BatchEmbeddingResult = {
        embeddings,
        stats: {
          totalChunks,
          totalBatches,
          avgProcessingTime,
          totalProcessingTime: totalTime,
          dimensions: model.dimensions,
        },
        errors,
      };

      logger.info('✅ Batch embedding processing completed', {
        successfulEmbeddings: embeddings.length,
        failedChunks: errors.length,
        totalTime: `${totalTime}ms`,
        avgTime: `${avgProcessingTime.toFixed(2)}ms`,
      });

      return result;
    } catch (error) {
      logger.error('Batch embedding processing failed', error as Error);
      throw error;
    }
  }

  /**
   * Process single text (convenience method)
   */
  async processOne(
    text: string,
    chunkId: string,
    modelType: EmbeddingModelType
  ): Promise<VectorEmbedding> {
    const result = await this.process({
      chunks: [{ id: chunkId, content: text }],
      modelType,
    });

    if (result.errors.length > 0) {
      throw new Error(result.errors[0].error);
    }

    return result.embeddings[0];
  }
}
