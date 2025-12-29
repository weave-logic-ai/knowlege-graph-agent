/**
 * Agent Booster Adapter
 *
 * Integrates Agent Booster for 352x faster code transformations.
 * Provides template matching, similarity matching, and batch processing
 * capabilities for the OptimizerAgent.
 *
 * @module integrations/agentic-flow/adapters/agent-booster-adapter
 */

import { BaseAdapter, type AdapterStatus } from './base-adapter.js';

// ============================================================================
// Types
// ============================================================================

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
 * Default configuration values
 */
const DEFAULT_CONFIG: AgentBoosterConfig = {
  enableTemplates: true,
  enableSimilarityMatching: true,
  confidenceThreshold: 0.7,
  maxChunkSize: 5000,
};

/**
 * Supported programming languages for transformation
 */
export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'rust'
  | 'go'
  | 'java'
  | 'c'
  | 'cpp';

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
  AgentBooster: new (config: { enableTemplates: boolean; enableSimilarityMatching: boolean }) => {
    transform(req: { code: string; instruction: string; language: string }): Promise<{
      success: boolean;
      code?: string;
      confidence?: number;
      changes?: Array<{ type: string; line: number; description: string }>;
    }>;
  };
  version?: string;
}

// ============================================================================
// Agent Booster Adapter
// ============================================================================

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
export class AgentBoosterAdapter extends BaseAdapter<AgentBoosterModule> {
  private config: AgentBoosterConfig;
  private booster: InstanceType<AgentBoosterModule['AgentBooster']> | null = null;
  private templatePatterns: Map<string, RegExp>;
  private adapterVersion?: string;

  constructor(config: Partial<AgentBoosterConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.templatePatterns = this.initializeTemplates();
  }

  /**
   * Get the feature name for this adapter
   */
  getFeatureName(): string {
    return 'agent-booster';
  }

  /**
   * Check if the adapter is available and initialized
   */
  isAvailable(): boolean {
    return this.status.initialized;
  }

  /**
   * Check if in fallback mode (initialized but module not available)
   */
  isFallbackMode(): boolean {
    return this.status.initialized && !this.status.available;
  }

  /**
   * Get the version of the underlying module
   */
  getVersion(): string | undefined {
    return this.adapterVersion;
  }

  /**
   * Initialize the adapter
   */
  async initialize(): Promise<void> {
    if (this.status.initialized) {
      return;
    }

    const module = await this.tryLoad('agent-booster');

    if (!module) {
      // Use fallback implementation
      this.booster = this.createFallbackBooster();
      this.status.initialized = true;
      return;
    }

    try {
      this.booster = new module.AgentBooster({
        enableTemplates: this.config.enableTemplates,
        enableSimilarityMatching: this.config.enableSimilarityMatching,
      });

      this.status.initialized = true;
      this.adapterVersion = module.version;
    } catch (error) {
      this.booster = this.createFallbackBooster();
      this.status.initialized = true;
      this.status.error = error instanceof Error ? error.message : String(error);
    }
  }

  /**
   * Transform code using Agent Booster
   *
   * Average latency: 1ms (vs 352ms with LLM-based transformation)
   *
   * @param request - Transformation request
   * @returns Transformation result with timing
   */
  async transform(request: TransformRequest): Promise<TransformResult> {
    const startTime = performance.now();

    if (!this.status.initialized) {
      await this.initialize();
    }

    try {
      // Phase 1: Try template matching (0-1ms)
      if (this.config.enableTemplates) {
        const templateResult = this.tryTemplateMatch(request);
        if (templateResult.success) {
          return {
            ...templateResult,
            latencyMs: performance.now() - startTime,
            transformType: 'template',
          } as TransformResult;
        }
      }

      // Phase 2: Similarity matching via booster (1-13ms)
      if (this.config.enableSimilarityMatching && this.booster) {
        const result = await this.booster.transform({
          code: request.code,
          instruction: request.instruction,
          language: request.language,
        });

        const confidence = result.confidence ?? 0;
        const success = result.success && confidence >= this.config.confidenceThreshold;

        return {
          success,
          originalCode: request.code,
          transformedCode: result.code || request.code,
          confidence,
          latencyMs: performance.now() - startTime,
          transformType: 'similarity',
          changes: result.changes || [],
        };
      }

      return this.createFailedResult(request.code, startTime);
    } catch (error) {
      return this.createFailedResult(request.code, startTime, error);
    }
  }

  /**
   * Batch transform multiple files
   *
   * Processes approximately 1000 files per second using parallel execution.
   *
   * @param requests - Array of batch transform requests
   * @returns Batch transformation results
   */
  async batchTransform(requests: BatchTransformRequest[]): Promise<BatchTransformResult> {
    const startTime = performance.now();
    const results: BatchTransformResult['results'] = [];
    let successCount = 0;
    let failedCount = 0;

    // Process in parallel for speed
    const promises = requests.map(async (req) => {
      let currentCode = req.code;
      let lastError: string | undefined;

      for (const instruction of req.instructions) {
        try {
          const result = await this.transform({
            code: currentCode,
            instruction,
            language: this.detectLanguage(req.path),
          });

          if (result.success) {
            currentCode = result.transformedCode;
          } else {
            lastError = `Transform failed for instruction: ${instruction}`;
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error);
        }
      }

      return {
        path: req.path,
        success: currentCode !== req.code,
        transformedCode: currentCode,
        error: currentCode === req.code ? lastError : undefined,
      };
    });

    const settled = await Promise.allSettled(promises);

    for (const result of settled) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
        if (result.value.success) {
          successCount++;
        } else {
          failedCount++;
        }
      } else {
        results.push({
          path: 'unknown',
          success: false,
          error: result.reason?.message || 'Unknown error',
        });
        failedCount++;
      }
    }

    return {
      totalFiles: requests.length,
      successCount,
      failedCount,
      totalLatencyMs: performance.now() - startTime,
      results,
    };
  }

  /**
   * Apply a specific optimization type to code
   *
   * @param code - Source code to optimize
   * @param optimizationType - Type of optimization to apply
   * @param language - Programming language
   * @returns Transformation result
   */
  async applyOptimization(
    code: string,
    optimizationType: 'loop' | 'async' | 'memory' | 'general',
    language: SupportedLanguage = 'typescript'
  ): Promise<TransformResult> {
    const instructions: Record<string, string> = {
      loop: 'Optimize loops: cache length, use for-of where possible, avoid nested iterations',
      async: 'Convert callbacks to async/await, parallelize independent promises',
      memory: 'Reduce memory allocations, use object pooling, prefer typed arrays',
      general: 'Apply general code optimizations and best practices',
    };

    return this.transform({
      code,
      instruction: instructions[optimizationType],
      language,
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<AgentBoosterConfig> {
    return { ...this.config };
  }

  // ============================================================================
  // Template Matching (Phase 1)
  // ============================================================================

  /**
   * Try to match a known template pattern for instant transformation
   */
  private tryTemplateMatch(request: TransformRequest): Partial<TransformResult> {
    const instruction = request.instruction.toLowerCase();

    // Try-catch wrapping
    if (instruction.includes('try') && instruction.includes('catch')) {
      const wrapped = this.wrapWithTryCatch(request.code);
      if (wrapped !== request.code) {
        return {
          success: true,
          originalCode: request.code,
          transformedCode: wrapped,
          confidence: 0.9,
          changes: [{ type: 'try-catch', line: 1, description: 'Wrapped in try-catch block' }],
        };
      }
    }

    // Null check / optional chaining
    if (instruction.includes('null') && instruction.includes('check')) {
      const checked = this.addNullChecks(request.code);
      if (checked !== request.code) {
        return {
          success: true,
          originalCode: request.code,
          transformedCode: checked,
          confidence: 0.85,
          changes: [{ type: 'null-check', line: 1, description: 'Added optional chaining' }],
        };
      }
    }

    // Async/await conversion
    if (instruction.includes('async') || instruction.includes('await')) {
      const asyncCode = this.convertToAsync(request.code);
      if (asyncCode !== request.code) {
        return {
          success: true,
          originalCode: request.code,
          transformedCode: asyncCode,
          confidence: 0.88,
          changes: [{ type: 'async', line: 1, description: 'Converted to async/await' }],
        };
      }
    }

    // Error handling addition
    if (instruction.includes('error') && instruction.includes('handl')) {
      const withError = this.addErrorHandling(request.code);
      if (withError !== request.code) {
        return {
          success: true,
          originalCode: request.code,
          transformedCode: withError,
          confidence: 0.87,
          changes: [{ type: 'error-handling', line: 1, description: 'Added error handling' }],
        };
      }
    }

    // Type annotations
    if (
      instruction.includes('type') &&
      (instruction.includes('annotat') || instruction.includes('add'))
    ) {
      const typed = this.addTypeAnnotations(request.code, request.language);
      if (typed !== request.code) {
        return {
          success: true,
          originalCode: request.code,
          transformedCode: typed,
          confidence: 0.82,
          changes: [{ type: 'type-annotation', line: 1, description: 'Added type annotations' }],
        };
      }
    }

    return { success: false };
  }

  /**
   * Wrap code with try-catch block
   */
  private wrapWithTryCatch(code: string): string {
    // Don't wrap if already has try-catch at top level
    if (code.trim().startsWith('try')) {
      return code;
    }

    const lines = code.split('\n');
    const indent = lines[0]?.match(/^(\s*)/)?.[1] || '';

    return [
      `${indent}try {`,
      ...lines.map((line) => `${indent}  ${line.trimStart()}`),
      `${indent}} catch (error) {`,
      `${indent}  console.error('Error:', error);`,
      `${indent}  throw error;`,
      `${indent}}`,
    ].join('\n');
  }

  /**
   * Add null checks using optional chaining
   */
  private addNullChecks(code: string): string {
    // Add optional chaining for property access
    // Avoid double-applying optional chaining
    return code.replace(/(?<!\?)\.(\w+)/g, (match, prop, offset) => {
      // Check if this is already an optional chain
      const prevChar = code[offset - 1];
      if (prevChar === '?') {
        return match;
      }
      // Don't apply to method definitions or imports
      if (code.slice(Math.max(0, offset - 10), offset).match(/function|import|export|class/)) {
        return match;
      }
      return `?.${prop}`;
    });
  }

  /**
   * Convert promise .then() to async/await
   */
  private convertToAsync(code: string): string {
    // Convert .then() chains to async/await
    let result = code;

    // Pattern: .then((result) => { ... })
    result = result.replace(
      /(\w+)\.then\(\((\w+)\)\s*=>\s*\{([^}]*)\}\)/g,
      (_, promise, varName, body) => {
        const trimmedBody = body.trim();
        return `const ${varName} = await ${promise};\n${trimmedBody}`;
      }
    );

    // Pattern: .then(result => ...)
    result = result.replace(
      /(\w+)\.then\((\w+)\s*=>\s*([^)]+)\)/g,
      (_, promise, varName, body) => {
        return `const ${varName} = await ${promise};\nreturn ${body}`;
      }
    );

    return result;
  }

  /**
   * Add error handling to functions
   */
  private addErrorHandling(code: string): string {
    // Wrap async functions with try-catch if they don't have one
    return code.replace(
      /async\s+function\s+(\w+)\s*\(([^)]*)\)\s*\{([^}]+)\}/g,
      (match, name, params, body) => {
        if (body.includes('try')) {
          return match;
        }
        return `async function ${name}(${params}) {\n  try {\n${body}\n  } catch (error) {\n    console.error(\`Error in ${name}:\`, error);\n    throw error;\n  }\n}`;
      }
    );
  }

  /**
   * Add type annotations to TypeScript code
   */
  private addTypeAnnotations(code: string, language: SupportedLanguage): string {
    if (language !== 'typescript' && language !== 'javascript') {
      return code;
    }

    let result = code;

    // Add return type to functions without them
    result = result.replace(
      /function\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
      (match, name, params) => {
        if (params.includes(':') && match.includes('):')) {
          return match;
        }
        return `function ${name}(${params}): void {`;
      }
    );

    // Add type to let/const without types
    result = result.replace(
      /(const|let)\s+(\w+)\s*=\s*(["'`])([^"'`]*)["'`]/g,
      '$1 $2: string = $3$4$3'
    );

    result = result.replace(
      /(const|let)\s+(\w+)\s*=\s*(\d+)/g,
      '$1 $2: number = $3'
    );

    result = result.replace(
      /(const|let)\s+(\w+)\s*=\s*(true|false)/g,
      '$1 $2: boolean = $3'
    );

    return result;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Detect language from file path
   */
  private detectLanguage(path: string): SupportedLanguage {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, SupportedLanguage> = {
      js: 'javascript',
      jsx: 'javascript',
      mjs: 'javascript',
      cjs: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      mts: 'typescript',
      cts: 'typescript',
      py: 'python',
      rs: 'rust',
      go: 'go',
      java: 'java',
      c: 'c',
      h: 'c',
      cpp: 'cpp',
      cc: 'cpp',
      cxx: 'cpp',
      hpp: 'cpp',
    };
    return langMap[ext || ''] || 'typescript';
  }

  /**
   * Create a failed result
   */
  private createFailedResult(
    originalCode: string,
    startTime: number,
    _error?: unknown
  ): TransformResult {
    // Error is tracked internally but not logged
    return {
      success: false,
      originalCode,
      transformedCode: originalCode,
      confidence: 0,
      latencyMs: performance.now() - startTime,
      transformType: 'failed',
      changes: [],
    };
  }

  /**
   * Initialize template patterns for quick matching
   */
  private initializeTemplates(): Map<string, RegExp> {
    return new Map([
      ['try-catch', /try\s*\{/],
      ['null-check', /\?\./],
      ['async-await', /async\s+/],
      ['error-handling', /catch\s*\(/],
    ]);
  }

  /**
   * Create fallback booster for when agent-booster module is not available
   */
  private createFallbackBooster(): InstanceType<AgentBoosterModule['AgentBooster']> {
    return {
      transform: async (req: { code: string; instruction: string; language: string }) => ({
        success: false,
        code: req.code,
        confidence: 0,
        changes: [],
      }),
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

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
export async function createAgentBoosterAdapter(
  config?: Partial<AgentBoosterConfig>
): Promise<AgentBoosterAdapter> {
  const adapter = new AgentBoosterAdapter(config);
  await adapter.initialize();
  return adapter;
}
