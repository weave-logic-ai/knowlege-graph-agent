/**
 * Code Complexity Analyzer Plugin
 *
 * Implements the AnalyzerPlugin interface for analyzing TypeScript/JavaScript
 * code complexity. Provides streaming analysis, cyclomatic complexity,
 * cognitive complexity, Halstead metrics, and deep nesting detection.
 *
 * @module plugins/analyzers/code-complexity/plugin
 */
import type { AnalyzerPlugin, AnalysisInput, AnalysisResult, AnalysisStreamChunk, PluginContext } from '../../types.js';
/**
 * Configuration options for the Code Complexity Analyzer plugin
 */
export interface CodeComplexityPluginConfig {
    /** Cyclomatic complexity threshold for "high" designation */
    cyclomaticHigh?: number;
    /** Cyclomatic complexity threshold for "critical" designation */
    cyclomaticCritical?: number;
    /** Cognitive complexity threshold for "high" designation */
    cognitiveHigh?: number;
    /** Cognitive complexity threshold for "critical" designation */
    cognitiveCritical?: number;
    /** Maximum recommended nesting depth */
    maxNestingDepth?: number;
    /** Maximum recommended function length (LOC) */
    maxFunctionLength?: number;
    /** Include Halstead metrics in analysis */
    includeHalstead?: boolean;
    /** Minimum complexity to include in results (filter out simple functions) */
    minComplexityToReport?: number;
}
/**
 * Code Complexity Analyzer Plugin
 *
 * Implements the AnalyzerPlugin interface for analyzing code complexity
 * in TypeScript and JavaScript files.
 *
 * Features:
 * - Cyclomatic complexity (McCabe) calculation
 * - Cognitive complexity (SonarSource) calculation
 * - Halstead software science metrics
 * - Deep nesting detection (> 4 levels)
 * - Lines of code counting
 * - Function and class counting
 * - Streaming analysis support
 * - Structured entity and relationship extraction
 *
 * @example
 * ```typescript
 * const plugin = new CodeComplexityAnalyzerPlugin();
 * await plugin.initialize(context);
 *
 * const result = await plugin.analyze({
 *   id: 'analysis-1',
 *   content: sourceCode,
 *   contentType: 'typescript',
 *   filePath: '/src/example.ts'
 * });
 *
 * console.log(`Found ${result.entities?.length} entities`);
 * ```
 */
export declare class CodeComplexityAnalyzerPlugin implements AnalyzerPlugin {
    readonly name = "code-complexity-analyzer";
    readonly version = "1.0.0";
    readonly type: "analyzer";
    readonly supportedContentTypes: string[];
    private context;
    private config;
    private thresholds;
    /**
     * Initialize the plugin with context
     */
    initialize(context: PluginContext): Promise<void>;
    /**
     * Cleanup plugin resources
     */
    destroy(): Promise<void>;
    /**
     * Check plugin health
     */
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
        details?: Record<string, unknown>;
    }>;
    /**
     * Get plugin statistics
     */
    getStats(): Promise<Record<string, unknown>>;
    /**
     * Check if this analyzer can handle the given content type
     */
    canAnalyze(contentType: string): boolean;
    /**
     * Analyze content and return structured results
     */
    analyze(input: AnalysisInput): Promise<AnalysisResult>;
    /**
     * Stream analysis results for large content
     */
    analyzeStream(input: AnalysisInput): AsyncIterable<AnalysisStreamChunk>;
    /**
     * Get configuration options for this analyzer
     */
    getConfigOptions(): Record<string, {
        type: 'string' | 'number' | 'boolean' | 'array' | 'object';
        description: string;
        default?: unknown;
        required?: boolean;
    }>;
    /**
     * Parse source code to AST
     */
    private parseContent;
    /**
     * Extract and analyze all functions from AST
     */
    private extractAndAnalyzeFunctions;
    /**
     * Get function information from node
     */
    private getFunctionInfo;
    /**
     * Analyze a single function node
     */
    private analyzeFunctionNode;
    /**
     * Get property name from key
     */
    private getPropertyName;
    /**
     * Get parameter count from function
     */
    private getParameterCount;
    /**
     * Count imports in AST
     */
    private countImports;
    /**
     * Count classes in AST
     */
    private countClasses;
    /**
     * Extract class names from AST
     */
    private extractClassNames;
    /**
     * Generate a summary of the analysis
     */
    private generateSummary;
}
/**
 * Create a new Code Complexity Analyzer Plugin instance
 */
export declare function createCodeComplexityAnalyzerPlugin(): CodeComplexityAnalyzerPlugin;
/**
 * Default export for plugin discovery
 */
export default CodeComplexityAnalyzerPlugin;
//# sourceMappingURL=plugin.d.ts.map