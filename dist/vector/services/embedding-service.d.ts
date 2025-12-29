/**
 * Embedding Service
 *
 * Provides text embedding generation using transformer models via @xenova/transformers.
 * Uses the all-MiniLM-L6-v2 model (384 dimensions) by default for efficient local inference.
 *
 * @module vector/services/embedding-service
 */
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
    errors?: Array<{
        index: number;
        error: string;
    }>;
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
export declare class EmbeddingService {
    private pipeline;
    private config;
    private initPromise;
    private isInitialized;
    /**
     * Create a new EmbeddingService
     *
     * @param config - Optional configuration overrides
     */
    constructor(config?: Partial<EmbeddingConfig>);
    /**
     * Initialize the embedding pipeline
     *
     * Loads the transformer model. This is called automatically on first use
     * but can be called explicitly to pre-load the model.
     *
     * @throws Error if model loading fails
     */
    initialize(): Promise<void>;
    private doInitialize;
    /**
     * Generate embedding for a single text
     *
     * @param text - Text to embed
     * @returns Embedding result with vector and metadata
     * @throws Error if not initialized or embedding fails
     */
    embed(text: string): Promise<EmbeddingResult>;
    /**
     * Generate embeddings for multiple texts
     *
     * Processes texts in batches for efficiency.
     *
     * @param texts - Array of texts to embed
     * @returns Batch result with embeddings and metadata
     */
    embedBatch(texts: string[]): Promise<BatchEmbeddingResult>;
    /**
     * Truncate text to maximum length
     *
     * @param text - Text to truncate
     * @returns Truncated text
     */
    private truncateText;
    /**
     * Extract embedding from pipeline output
     *
     * @param output - Pipeline output tensor
     * @returns Float32Array embedding
     */
    private extractEmbedding;
    /**
     * Extract multiple embeddings from batch output
     *
     * @param output - Pipeline output tensor for batch
     * @param batchSize - Number of items in the batch
     * @returns Array of embeddings
     */
    private extractBatchEmbeddings;
    /**
     * Flatten nested array
     *
     * @param arr - Array to flatten
     * @returns Flattened number array
     */
    private flattenArray;
    /**
     * Get the embedding dimensions
     *
     * @returns Number of dimensions in generated embeddings
     */
    getDimensions(): number;
    /**
     * Get the current configuration
     *
     * @returns Copy of the current configuration
     */
    getConfig(): EmbeddingConfig;
    /**
     * Check if the service is initialized
     *
     * @returns True if initialized
     */
    isReady(): boolean;
    /**
     * Get model information
     *
     * @returns Model details
     */
    getModelInfo(): {
        model: string;
        dimensions: number;
        quantized: boolean;
    };
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
export declare function createEmbeddingService(config?: Partial<EmbeddingConfig>): EmbeddingService;
/**
 * Get the default embedding service
 *
 * Returns a shared singleton instance for convenience.
 * Use createEmbeddingService() for custom configurations.
 *
 * @returns Default EmbeddingService instance
 */
export declare function getDefaultEmbeddingService(): EmbeddingService;
//# sourceMappingURL=embedding-service.d.ts.map