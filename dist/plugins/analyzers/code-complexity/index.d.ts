/**
 * Code Complexity Analyzer Plugin
 *
 * A plugin for analyzing TypeScript/JavaScript code complexity and generating
 * knowledge graph nodes for complex functions and files.
 *
 * Features:
 * - Cyclomatic complexity (McCabe) analysis
 * - Cognitive complexity (SonarSource) analysis
 * - Halstead software science metrics (volume, difficulty, effort)
 * - Deep nesting detection (> 4 levels)
 * - Maintainability index calculation
 * - Knowledge graph node generation
 * - Shadow Cache integration
 * - SeedGenerator pipeline hooks
 * - Streaming analysis via analyzeStream()
 * - AnalyzerPlugin interface implementation
 *
 * @module plugins/analyzers/code-complexity
 *
 * @example
 * ```typescript
 * // Using the AnalyzerPlugin interface
 * import { CodeComplexityAnalyzerPlugin } from './plugins/analyzers/code-complexity';
 *
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
 * // Or using the legacy CodeComplexityPlugin
 * import { CodeComplexityPlugin } from './plugins/analyzers/code-complexity';
 *
 * const legacyPlugin = new CodeComplexityPlugin({
 *   projectRoot: '/my/project',
 *   config: {
 *     thresholds: { cyclomaticHigh: 10, cyclomaticCritical: 20 }
 *   }
 * });
 *
 * const result = await legacyPlugin.analyze();
 * console.log(`Found ${result.nodes.length} complexity hotspots`);
 * ```
 */
import type { AnalyzerConfig, ComplexityPluginOptions, ComplexityPluginResult, ComplexityNode, ComplexityEdge, ProjectAnalysis, FileAnalysis } from './types.js';
export type { AnalyzerConfig, ComplexityPluginOptions, ComplexityPluginResult, ComplexityNode, ComplexityEdge, ProjectAnalysis, FileAnalysis, FunctionAnalysis, ComplexityScore, ComplexityLevel, ComplexityThresholds, HalsteadMetrics, } from './types.js';
export { DEFAULT_THRESHOLDS, EMPTY_HALSTEAD_METRICS } from './types.js';
export { CodeComplexityAnalyzerPlugin, createCodeComplexityAnalyzerPlugin, type CodeComplexityPluginConfig, } from './plugin.js';
export { CodeComplexityAnalyzer, analyzeProjectComplexity, analyzeFileComplexity } from './analyzer.js';
export { ComplexityGraphGenerator, generateComplexityNodes } from './graph-generator.js';
export { calculateCyclomaticComplexity, calculateCognitiveComplexity, calculateMaxNestingDepth, calculateMaintainabilityIndex, calculateHalsteadMetrics, } from './metrics.js';
/**
 * Plugin for analyzing code complexity and generating knowledge graph nodes
 *
 * Integrates with:
 * - SeedGenerator pipeline for automatic analysis
 * - DeepAnalyzer for comprehensive codebase insights
 * - Shadow Cache for result caching
 * - Knowledge Graph for node generation
 *
 * @example
 * ```typescript
 * const plugin = new CodeComplexityPlugin({
 *   projectRoot: '/my/project',
 *   config: {
 *     patterns: { include: ['src/** /*.ts'], exclude: ['** /*.test.ts'] }
 *   },
 *   useCache: true,
 *   generateReport: true
 * });
 *
 * const result = await plugin.analyze();
 * ```
 */
export declare class CodeComplexityPlugin {
    private projectRoot;
    private config;
    private options;
    private cache;
    private analyzer;
    private graphGenerator;
    constructor(options: ComplexityPluginOptions & {
        projectRoot: string;
    });
    /**
     * Run complete complexity analysis
     */
    analyze(): Promise<ComplexityPluginResult>;
    /**
     * Analyze a single file
     */
    analyzeFile(filePath: string): Promise<FileAnalysis | null>;
    /**
     * Generate markdown report
     */
    generateReport(analysis: ProjectAnalysis): Promise<string>;
    /**
     * Hook for SeedGenerator pipeline
     *
     * Called during seed generation to add complexity analysis results
     * to the knowledge graph.
     */
    seedGeneratorHook(context: {
        projectRoot: string;
        docsPath: string;
        dependencies: unknown[];
    }): Promise<{
        nodes: ComplexityNode[];
        edges: ComplexityEdge[];
        metadata: Record<string, unknown>;
    }>;
    /**
     * Hook for DeepAnalyzer pipeline
     *
     * Called during deep analysis to provide complexity insights
     * for the AI agents to consider.
     */
    deepAnalyzerHook(context: {
        projectRoot: string;
        agentType: string;
    }): Promise<{
        insights: string[];
        recommendations: string[];
        complexityData: ProjectAnalysis | null;
    }>;
    /**
     * Clear analysis cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        hits: number;
        misses: number;
        hitRate: number;
        entries: number;
    } | null;
    /**
     * Get current configuration
     */
    getConfig(): Partial<AnalyzerConfig>;
    /**
     * Get project root
     */
    getProjectRoot(): string;
}
/**
 * Create a code complexity plugin instance
 */
export declare function createComplexityPlugin(projectRoot: string, options?: ComplexityPluginOptions): CodeComplexityPlugin;
/**
 * Quick analysis function for simple use cases
 */
export declare function analyzeComplexity(projectRoot: string, options?: Partial<AnalyzerConfig>): Promise<ComplexityPluginResult>;
/**
 * Register plugin with SeedGenerator
 *
 * @example
 * ```typescript
 * const seedGenerator = new SeedGenerator(vaultContext, projectRoot);
 *
 * // Register complexity plugin
 * registerWithSeedGenerator(seedGenerator, projectRoot);
 *
 * // Now seed generation will include complexity analysis
 * const analysis = await seedGenerator.analyze();
 * ```
 */
export declare function registerWithSeedGenerator(seedGenerator: {
    registerPlugin?: (name: string, hook: unknown) => void;
}, projectRoot: string, options?: ComplexityPluginOptions): CodeComplexityPlugin;
/**
 * Plugin metadata for registration and discovery
 */
export declare const pluginMetadata: {
    name: string;
    version: string;
    description: string;
    author: string;
    capabilities: string[];
    supportedLanguages: string[];
    hooks: string[];
};
export default CodeComplexityPlugin;
//# sourceMappingURL=index.d.ts.map