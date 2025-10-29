/**
 * Embedding Generator
 *
 * Generates embeddings using various API providers.
 * Supports OpenAI, Anthropic (future), and local models.
 */

import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger.js';
import type {
  EmbeddingModelConfig,
  EmbeddingRequest,
  EmbeddingResponse,
  Embedding,
  EmbeddingProvider,
} from './types.js';
import { withEmbeddingFallbacks } from '../utils/alternative-approaches.js';
import { withSmartRetry } from '../utils/error-recovery.js';
import { errorMonitor } from '../utils/error-monitoring.js';

const logger = createLogger('embeddings:generator');

/**
 * Custom error for embedding generation
 */
export class EmbeddingGenerationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'EmbeddingGenerationError';
  }
}

/**
 * OpenAI embedding model configurations
 */
const OPENAI_MODELS = {
  'text-embedding-3-small': { dimensions: 1536, maxTokens: 8191 },
  'text-embedding-3-large': { dimensions: 3072, maxTokens: 8191 },
  'text-embedding-ada-002': { dimensions: 1536, maxTokens: 8191 },
} as const;

export class EmbeddingGenerator {
  private config: EmbeddingModelConfig;

  constructor(config: EmbeddingModelConfig) {
    this.config = config;

    logger.info('Embedding generator initialized', {
      provider: config.provider,
      model: config.model,
      dimensions: config.dimensions,
    });
  }

  /**
   * Generate embedding for text
   *
   * @param request - Embedding request
   * @returns Embedding response with vector
   */
  async generate(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const startTime = Date.now();

    try {
      logger.debug('Generating embedding', {
        textLength: request.text.length,
        chunkId: request.chunkId,
      });

      const vector = await this.generateVector(request.text);

      const embedding: Embedding = {
        id: `emb-${uuidv4()}`,
        chunkId: request.chunkId || 'unknown',
        vector,
        model: this.config.model,
        provider: this.config.provider,
        dimensions: vector.length,
        createdAt: new Date(),
      };

      const durationMs = Date.now() - startTime;

      logger.info('Embedding generated', {
        embeddingId: embedding.id,
        dimensions: embedding.dimensions,
        duration: durationMs,
      });

      return {
        embedding,
        usage: {
          tokens: this.estimateTokens(request.text),
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to generate embedding', err);
      throw new EmbeddingGenerationError('Failed to generate embedding', err);
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   *
   * @param requests - Array of embedding requests
   * @returns Array of embedding responses
   */
  async generateBatch(requests: EmbeddingRequest[]): Promise<EmbeddingResponse[]> {
    const startTime = Date.now();

    try {
      logger.info('Generating embeddings batch', { count: requests.length });

      // For MVP, process sequentially
      // TODO Phase 2: Implement true batch API calls
      const results: EmbeddingResponse[] = [];
      for (const request of requests) {
        const response = await this.generate(request);
        results.push(response);
      }

      const durationMs = Date.now() - startTime;

      logger.info('Embeddings batch generated', {
        count: results.length,
        duration: durationMs,
      });

      return results;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to generate embeddings batch', err);
      throw new EmbeddingGenerationError('Failed to generate embeddings batch', err);
    }
  }

  /**
   * Generate vector based on provider with fallback chain
   */
  private async generateVector(text: string): Promise<number[]> {
    // Use fallback chain: OpenAI -> Local Model -> Mock
    if (this.config.provider === 'openai') {
      return withEmbeddingFallbacks(
        text,
        // Primary: OpenAI API
        async (t) => this.generateOpenAIVector(t),
        // Fallback: Local model
        async (t) => this.generateLocalVector(t),
        // Graceful degradation: Mock vector (FTS5 only mode)
        async () => {
          logger.warn('All embedding providers failed, using mock vector');
          return this.generateLocalVector(text); // Returns normalized random vector
        }
      );
    }

    switch (this.config.provider) {
      case 'local':
        return this.generateLocalVector(text);
      default:
        throw new EmbeddingGenerationError(`Unsupported provider: ${this.config.provider}`);
    }
  }

  /**
   * Generate vector using OpenAI API with retry logic
   */
  private async generateOpenAIVector(text: string): Promise<number[]> {
    if (!this.config.apiKey) {
      throw new EmbeddingGenerationError('OpenAI API key not configured');
    }

    return withSmartRetry(async () => {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey!}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          input: text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`OpenAI API error: ${response.status} ${errorText}`);

        // Record error for monitoring
        errorMonitor.recordError({
          category: response.status === 429 ? 'rate_limit' : 'service',
          message: error.message,
          context: 'embeddings-openai',
          recovered: false,
          retryAttempts: 0,
        });

        throw error;
      }

      const data = await response.json() as {
        data: Array<{ embedding: number[] }>;
      };

      if (!data.data?.[0]?.embedding) {
        throw new Error('Invalid OpenAI API response');
      }

      return data.data[0].embedding;
    }, 'openai-embeddings');
  }

  /**
   * Generate vector using local model (mock for MVP)
   * TODO Phase 2: Implement actual local model inference
   */
  private async generateLocalVector(_text: string): Promise<number[]> {
    // Mock implementation: generate random normalized vector
    const vector: number[] = [];
    for (let i = 0; i < this.config.dimensions; i++) {
      vector.push(Math.random() * 2 - 1);
    }

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  }

  /**
   * Estimate token count for text
   */
  private estimateTokens(text: string): number {
    // Simple approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Get model configuration
   */
  getConfig(): EmbeddingModelConfig {
    return { ...this.config };
  }
}

/**
 * Create embedding generator with default OpenAI config
 */
export function createEmbeddingGenerator(
  provider: EmbeddingProvider = 'openai',
  model = 'text-embedding-3-small',
  apiKey?: string
): EmbeddingGenerator {
  const modelConfig = OPENAI_MODELS[model as keyof typeof OPENAI_MODELS];

  if (!modelConfig && provider === 'openai') {
    throw new Error(`Unknown OpenAI model: ${model}`);
  }

  const config: EmbeddingModelConfig = {
    provider,
    model,
    apiKey: apiKey || process.env.OPENAI_API_KEY,
    dimensions: modelConfig?.dimensions || 1536,
    maxTokens: modelConfig?.maxTokens,
  };

  return new EmbeddingGenerator(config);
}
