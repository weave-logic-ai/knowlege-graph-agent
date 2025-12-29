/**
 * Dependency Health Analyzer Plugin
 *
 * A plugin for the knowledge-graph-agent that analyzes npm dependencies
 * for vulnerabilities, outdated packages, and health metrics.
 *
 * Features:
 * - Vulnerability scanning via npm audit
 * - Outdated package detection via npm outdated
 * - npm registry metadata fetching
 * - Health score calculation
 * - Knowledge graph node generation
 * - Streaming analysis support
 * - AnalyzerPlugin interface implementation
 *
 * @module plugins/analyzers/dependency-health
 */
import { KnowledgeGraphManager } from '../../../core/graph.js';
import { DependencyHealthAnalyzer, createDependencyHealthAnalyzer } from './analyzer.js';
import { DependencyGraphGenerator, createDependencyGraphGenerator } from './graph-generator.js';
import { NpmClient, createNpmClient } from './npm-client.js';
import { VulnerabilityChecker, createVulnerabilityChecker } from './vulnerability.js';
import type { KnowledgeNode, GraphEdge } from '../../../core/types.js';
import type { SeedAnalysis } from '../../../cultivation/types.js';
import type { AnalyzerPlugin, AnalysisInput, AnalysisResult, AnalysisStreamChunk, PluginContext } from '../../types.js';
import type { DependencyHealthConfig, DependencyHealthAnalysis, DependencyHealthScore, DependencyAnalyzerPluginConfig } from './types.js';
export * from './types.js';
export { DependencyHealthAnalyzer, createDependencyHealthAnalyzer, DependencyGraphGenerator, createDependencyGraphGenerator, NpmClient, createNpmClient, VulnerabilityChecker, createVulnerabilityChecker, };
/**
 * Plugin result interface
 */
export interface DependencyHealthPluginResult {
    /** Whether the plugin executed successfully */
    success: boolean;
    /** The full analysis result */
    analysis: DependencyHealthAnalysis;
    /** Generated knowledge graph nodes */
    nodes: KnowledgeNode[];
    /** Generated knowledge graph edges */
    edges: GraphEdge[];
    /** Markdown report content */
    report: string;
    /** Any errors encountered */
    errors: string[];
}
/**
 * DependencyHealthPlugin class
 *
 * Main plugin entry point that coordinates analysis and graph generation.
 */
export declare class DependencyHealthPlugin {
    private projectRoot;
    private config;
    private analyzer;
    private graphGenerator;
    constructor(projectRoot: string, config?: Partial<DependencyHealthConfig>);
    /**
     * Run the full dependency health analysis pipeline
     */
    run(): Promise<DependencyHealthPluginResult>;
    /**
     * Hook into SeedGenerator pipeline
     *
     * This method can be called after package.json parsing to enhance
     * DependencyInfo objects with health data.
     */
    enhanceSeedAnalysis(seedAnalysis: SeedAnalysis): Promise<SeedAnalysis>;
    /**
     * Add health nodes to an existing knowledge graph
     */
    addToGraph(graph: KnowledgeGraphManager): Promise<void>;
    /**
     * Get analysis for a single package
     */
    analyzePackage(packageName: string): Promise<DependencyHealthScore | null>;
    /**
     * Get all unhealthy packages
     */
    getUnhealthyPackages(): Promise<DependencyHealthScore[]>;
    /**
     * Clear internal caches
     */
    clearCache(): void;
}
/**
 * Create a dependency health plugin instance
 */
export declare function createDependencyHealthPlugin(projectRoot: string, config?: Partial<DependencyHealthConfig>): DependencyHealthPlugin;
/**
 * Run dependency health analysis as a standalone function
 */
export declare function analyzeDependencyHealth(projectRoot: string, config?: Partial<DependencyHealthConfig>): Promise<DependencyHealthPluginResult>;
/**
 * Integration hook for SeedGenerator
 *
 * Usage in seed-generator.ts:
 * ```typescript
 * import { enhanceDependenciesWithHealth } from '../plugins/analyzers/dependency-health';
 *
 * // After analyzing dependencies
 * if (options.analyzeHealth) {
 *   analysis = await enhanceDependenciesWithHealth(analysis, projectRoot);
 * }
 * ```
 */
export declare function enhanceDependenciesWithHealth(seedAnalysis: SeedAnalysis, projectRoot: string, config?: Partial<DependencyHealthConfig>): Promise<SeedAnalysis>;
/**
 * DependencyHealthAnalyzerPlugin
 *
 * Implements the AnalyzerPlugin interface for analyzing npm dependencies.
 * Provides vulnerability scanning, outdated package detection, and health scoring.
 *
 * @example
 * ```typescript
 * const plugin = new DependencyHealthAnalyzerPlugin();
 * await plugin.initialize(context);
 *
 * const result = await plugin.analyze({
 *   id: 'analysis-1',
 *   content: packageJsonContent,
 *   contentType: 'package.json',
 *   filePath: '/project/package.json'
 * });
 *
 * console.log(`Health Score: ${result.qualityScore}`);
 * ```
 */
export declare class DependencyHealthAnalyzerPlugin implements AnalyzerPlugin {
    readonly name = "dependency-health-analyzer";
    readonly version = "1.0.0";
    readonly type: "analyzer";
    readonly supportedContentTypes: string[];
    private context;
    private config;
    private analyzer;
    private graphGenerator;
    constructor(config?: Partial<DependencyAnalyzerPluginConfig>);
    /**
     * Initialize the plugin
     */
    initialize(context: PluginContext): Promise<void>;
    /**
     * Destroy the plugin and clean up resources
     */
    destroy(): Promise<void>;
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
     * Get analyzer-specific configuration options
     */
    getConfigOptions(): Record<string, {
        type: 'string' | 'number' | 'boolean' | 'array' | 'object';
        description: string;
        default?: unknown;
        required?: boolean;
    }>;
    /**
     * Get plugin health status
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
    private extractDependencies;
    private cleanVersion;
    private checkVulnerabilities;
    private checkSingleDependency;
    private versionInRange;
    private compareVersions;
    private identifyOutdatedPatterns;
    private checkOutdatedPattern;
    private calculateHealthMetrics;
    private calculateSingleHealthScore;
    private generateEntities;
    private generateRelationships;
    private generateTags;
    private generateSuggestions;
    private generateSummary;
    private createSuccessResult;
    private createErrorResult;
}
/**
 * Factory function to create a DependencyHealthAnalyzerPlugin instance
 */
export declare function createDependencyHealthAnalyzerPlugin(config?: Partial<DependencyAnalyzerPluginConfig>): DependencyHealthAnalyzerPlugin;
//# sourceMappingURL=index.d.ts.map