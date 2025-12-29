/**
 * Agent Booster Adapter
 *
 * Integrates Agent Booster for 352x faster code transformations.
 * Provides template matching, similarity matching, and batch processing
 * capabilities for the OptimizerAgent.
 *
 * @module integrations/agentic-flow/adapters/agent-booster-adapter
 */
import { BaseAdapter } from './base-adapter.js';
/**
 * Configuration for Agent Booster adapter
 */
export interface AgentBoosterConfig {
    /** Enable template-based transformations */
    enableTemplates: boolean;
    /** Enable similarity-based matching */
    enableSimilarityMatching: boolean;
    /** Minimum confidence threshold for accepting transforms */
    confidenceThreshold: number;
    /** Maximum code chunk size in characters */
    maxChunkSize: number;
}
/**
 * Supported programming languages for transformation
 */
export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'rust' | 'go' | 'java' | 'c' | 'cpp';
/**
 * Request for a single code transformation
 */
export interface TransformRequest {
    /** Source code to transform */
    code: string;
    /** Natural language instruction for transformation */
    instruction: string;
    /** Programming language of the code */
    language: SupportedLanguage;
}
/**
 * Result of a code transformation
 */
export interface TransformResult {
    /** Whether the transformation succeeded */
    success: boolean;
    /** Original code before transformation */
    originalCode: string;
    /** Transformed code (same as original if failed) */
    transformedCode: string;
    /** Confidence score (0-1) */
    confidence: number;
    /** Latency in milliseconds */
    latencyMs: number;
    /** Type of transformation applied */
    transformType: 'template' | 'similarity' | 'failed';
    /** List of changes made */
    changes: Array<{
        type: string;
        line: number;
        description: string;
    }>;
}
/**
 * Request for batch transformation of multiple files
 */
export interface BatchTransformRequest {
    /** File path */
    path: string;
    /** Source code content */
    code: string;
    /** List of transformation instructions to apply sequentially */
    instructions: string[];
}
/**
 * Result of batch transformation
 */
export interface BatchTransformResult {
    /** Total number of files processed */
    totalFiles: number;
    /** Number of successful transformations */
    successCount: number;
    /** Number of failed transformations */
    failedCount: number;
    /** Total processing time in milliseconds */
    totalLatencyMs: number;
    /** Results for each file */
    results: Array<{
        path: string;
        success: boolean;
        transformedCode?: string;
        error?: string;
    }>;
}
/**
 * Interface for the external agent-booster module
 */
interface AgentBoosterModule {
    AgentBooster: new (config: {
        enableTemplates: boolean;
        enableSimilarityMatching: boolean;
    }) => {
        transform(req: {
            code: string;
            instruction: string;
            language: string;
        }): Promise<{
            success: boolean;
            code?: string;
            confidence?: number;
            changes?: Array<{
                type: string;
                line: number;
                description: string;
            }>;
        }>;
    };
    version?: string;
}
/**
 * Agent Booster Adapter
 *
 * Provides integration with the agent-booster library for high-speed
 * code transformations. Falls back to a no-op implementation when
 * the library is not available.
 *
 * Key Features:
 * - Template matching for instant transformations (~0-1ms)
 * - Similarity matching for complex transformations (~1-13ms)
 * - Batch processing (~1000 files/second)
 * - Graceful fallback when agent-booster is unavailable
 *
 * @example
 * ```typescript
 * const adapter = await createAgentBoosterAdapter();
 *
 * const result = await adapter.transform({
 *   code: 'const x = data.value',
 *   instruction: 'Add null checks',
 *   language: 'typescript',
 * });
 *
 * console.log(`Latency: ${result.latencyMs}ms`); // ~1ms
 * ```
 */
export declare class AgentBoosterAdapter extends BaseAdapter<AgentBoosterModule> {
    private config;
    private booster;
    private templatePatterns;
    private adapterVersion?;
    constructor(config?: Partial<AgentBoosterConfig>);
    /**
     * Get the feature name for this adapter
     */
    getFeatureName(): string;
    /**
     * Check if the adapter is available and initialized
     */
    isAvailable(): boolean;
    /**
     * Check if in fallback mode (initialized but module not available)
     */
    isFallbackMode(): boolean;
    /**
     * Get the version of the underlying module
     */
    getVersion(): string | undefined;
    /**
     * Initialize the adapter
     */
    initialize(): Promise<void>;
    /**
     * Transform code using Agent Booster
     *
     * Average latency: 1ms (vs 352ms with LLM-based transformation)
     *
     * @param request - Transformation request
     * @returns Transformation result with timing
     */
    transform(request: TransformRequest): Promise<TransformResult>;
    /**
     * Batch transform multiple files
     *
     * Processes approximately 1000 files per second using parallel execution.
     *
     * @param requests - Array of batch transform requests
     * @returns Batch transformation results
     */
    batchTransform(requests: BatchTransformRequest[]): Promise<BatchTransformResult>;
    /**
     * Apply a specific optimization type to code
     *
     * @param code - Source code to optimize
     * @param optimizationType - Type of optimization to apply
     * @param language - Programming language
     * @returns Transformation result
     */
    applyOptimization(code: string, optimizationType: 'loop' | 'async' | 'memory' | 'general', language?: SupportedLanguage): Promise<TransformResult>;
    /**
     * Get current configuration
     */
    getConfig(): Readonly<AgentBoosterConfig>;
    /**
     * Try to match a known template pattern for instant transformation
     */
    private tryTemplateMatch;
    /**
     * Wrap code with try-catch block
     */
    private wrapWithTryCatch;
    /**
     * Add null checks using optional chaining
     */
    private addNullChecks;
    /**
     * Convert promise .then() to async/await
     */
    private convertToAsync;
    /**
     * Add error handling to functions
     */
    private addErrorHandling;
    /**
     * Add type annotations to TypeScript code
     */
    private addTypeAnnotations;
    /**
     * Detect language from file path
     */
    private detectLanguage;
    /**
     * Create a failed result
     */
    private createFailedResult;
    /**
     * Initialize template patterns for quick matching
     */
    private initializeTemplates;
    /**
     * Create fallback booster for when agent-booster module is not available
     */
    private createFallbackBooster;
}
/**
 * Create and initialize an Agent Booster adapter
 *
 * @param config - Optional configuration overrides
 * @returns Initialized adapter instance
 *
 * @example
 * ```typescript
 * const adapter = await createAgentBoosterAdapter({
 *   confidenceThreshold: 0.8,
 * });
 *
 * if (adapter.isAvailable()) {
 *   const result = await adapter.transform({
 *     code: 'const x = obj.value',
 *     instruction: 'Add null checks',
 *     language: 'typescript',
 *   });
 * }
 * ```
 */
export declare function createAgentBoosterAdapter(config?: Partial<AgentBoosterConfig>): Promise<AgentBoosterAdapter>;
export {};
//# sourceMappingURL=agent-booster-adapter.d.ts.map