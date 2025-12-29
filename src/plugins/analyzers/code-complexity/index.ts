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

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { createLogger } from '../../../utils/logger.js';
import { AdvancedCache } from '../../../caching/index.js';
import { CodeComplexityAnalyzer, analyzeProjectComplexity } from './analyzer.js';
import { ComplexityGraphGenerator, generateComplexityNodes } from './graph-generator.js';
import type {
  AnalyzerConfig,
  ComplexityPluginOptions,
  ComplexityPluginResult,
  ComplexityNode,
  ComplexityEdge,
  ProjectAnalysis,
  FileAnalysis,
  ComplexityAnalysisCache,
  DEFAULT_CONFIG,
} from './types.js';
import { DEFAULT_THRESHOLDS } from './types.js';

// Re-export types
export type {
  AnalyzerConfig,
  ComplexityPluginOptions,
  ComplexityPluginResult,
  ComplexityNode,
  ComplexityEdge,
  ProjectAnalysis,
  FileAnalysis,
  FunctionAnalysis,
  ComplexityScore,
  ComplexityLevel,
  ComplexityThresholds,
  HalsteadMetrics,
} from './types.js';

export { DEFAULT_THRESHOLDS, EMPTY_HALSTEAD_METRICS } from './types.js';

// Re-export AnalyzerPlugin implementation (primary export)
export {
  CodeComplexityAnalyzerPlugin,
  createCodeComplexityAnalyzerPlugin,
  type CodeComplexityPluginConfig,
} from './plugin.js';

// Re-export analyzer (legacy)
export { CodeComplexityAnalyzer, analyzeProjectComplexity, analyzeFileComplexity } from './analyzer.js';

// Re-export graph generator
export { ComplexityGraphGenerator, generateComplexityNodes } from './graph-generator.js';

// Re-export metrics
export {
  calculateCyclomaticComplexity,
  calculateCognitiveComplexity,
  calculateMaxNestingDepth,
  calculateMaintainabilityIndex,
  calculateHalsteadMetrics,
} from './metrics.js';

const logger = createLogger('code-complexity-plugin');

// ============================================================================
// Code Complexity Plugin
// ============================================================================

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
export class CodeComplexityPlugin {
  private projectRoot: string;
  private config: Partial<AnalyzerConfig>;
  private options: ComplexityPluginOptions;
  private cache: AdvancedCache<ComplexityAnalysisCache> | null = null;
  private analyzer: CodeComplexityAnalyzer;
  private graphGenerator: ComplexityGraphGenerator;

  constructor(options: ComplexityPluginOptions & { projectRoot: string }) {
    this.projectRoot = options.projectRoot ?? '.';
    this.config = options.config ?? {};
    this.options = options;

    // Initialize cache if enabled
    if (options.useCache) {
      this.cache = new AdvancedCache<ComplexityAnalysisCache>({
        maxEntries: 1000,
        defaultTtl: options.cacheTtl ?? 3600000, // 1 hour default
        evictionPolicy: 'lru',
      });
    }

    // Initialize analyzer
    this.analyzer = new CodeComplexityAnalyzer({
      ...this.config,
      projectRoot: this.projectRoot,
    });

    // Initialize graph generator
    this.graphGenerator = new ComplexityGraphGenerator(this.projectRoot, this.config);
  }

  // ==========================================================================
  // Main Analysis
  // ==========================================================================

  /**
   * Run complete complexity analysis
   */
  async analyze(): Promise<ComplexityPluginResult> {
    logger.info('Starting code complexity analysis', {
      projectRoot: this.projectRoot,
    });

    const result: ComplexityPluginResult = {
      success: false,
      analysis: null as unknown as ProjectAnalysis,
      nodes: [],
      edges: [],
      errors: [],
      warnings: [],
    };

    try {
      // Run project analysis
      const analysis = await this.analyzer.analyzeProject();
      result.analysis = analysis;

      // Generate knowledge graph nodes
      if (this.config.generateGraphNodes !== false) {
        const { nodes, edges } = generateComplexityNodes(analysis, this.projectRoot);
        result.nodes = nodes;
        result.edges = edges;
      }

      // Generate report if requested
      if (this.options.generateReport) {
        await this.generateReport(analysis);
      }

      result.success = true;

      logger.info('Complexity analysis complete', {
        files: analysis.metrics.totalFiles,
        functions: analysis.metrics.totalFunctions,
        hotspots: analysis.hotspots.length,
        nodes: result.nodes.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(message);
      logger.error('Complexity analysis failed', error instanceof Error ? error : new Error(message));
    }

    return result;
  }

  /**
   * Analyze a single file
   */
  async analyzeFile(filePath: string): Promise<FileAnalysis | null> {
    // Check cache first
    if (this.cache) {
      const cached = this.cache.get(filePath);
      if (cached) {
        // TODO: Check mtime for cache invalidation
        return cached.analysis;
      }
    }

    const analysis = await this.analyzer.analyzeFile(filePath);

    // Cache result
    if (this.cache && analysis) {
      this.cache.set(filePath, {
        filePath,
        mtime: Date.now(),
        analysis,
        cachedAt: Date.now(),
      });
    }

    return analysis;
  }

  // ==========================================================================
  // Report Generation
  // ==========================================================================

  /**
   * Generate markdown report
   */
  async generateReport(analysis: ProjectAnalysis): Promise<string> {
    const report = this.graphGenerator.generateProjectReport(analysis);

    // Write to file if path specified
    if (this.options.reportPath) {
      const reportPath = this.options.reportPath.startsWith('/')
        ? this.options.reportPath
        : join(this.projectRoot, this.options.reportPath);

      const dir = dirname(reportPath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(reportPath, report, 'utf-8');
      logger.info(`Report written to ${reportPath}`);
    }

    return report;
  }

  // ==========================================================================
  // Pipeline Integration
  // ==========================================================================

  /**
   * Hook for SeedGenerator pipeline
   *
   * Called during seed generation to add complexity analysis results
   * to the knowledge graph.
   */
  async seedGeneratorHook(context: {
    projectRoot: string;
    docsPath: string;
    dependencies: unknown[];
  }): Promise<{
    nodes: ComplexityNode[];
    edges: ComplexityEdge[];
    metadata: Record<string, unknown>;
  }> {
    logger.info('Running complexity analysis for SeedGenerator');

    const result = await this.analyze();

    return {
      nodes: result.nodes,
      edges: result.edges,
      metadata: {
        totalFiles: result.analysis?.metrics.totalFiles ?? 0,
        totalFunctions: result.analysis?.metrics.totalFunctions ?? 0,
        avgComplexity: result.analysis?.metrics.avgCyclomatic ?? 0,
        hotspots: result.analysis?.hotspots.length ?? 0,
      },
    };
  }

  /**
   * Hook for DeepAnalyzer pipeline
   *
   * Called during deep analysis to provide complexity insights
   * for the AI agents to consider.
   */
  async deepAnalyzerHook(context: {
    projectRoot: string;
    agentType: string;
  }): Promise<{
    insights: string[];
    recommendations: string[];
    complexityData: ProjectAnalysis | null;
  }> {
    const result = await this.analyze();
    const insights: string[] = [];
    const recommendations: string[] = [];

    if (result.analysis) {
      const { metrics, hotspots, complexFunctions } = result.analysis;

      // Generate insights
      insights.push(
        `Project has ${metrics.totalFunctions} functions with average cyclomatic complexity of ${metrics.avgCyclomatic}`
      );

      if (metrics.avgMaintainability < 50) {
        insights.push(
          `Low maintainability index (${metrics.avgMaintainability}) indicates technical debt`
        );
      }

      if (hotspots.length > 0) {
        insights.push(
          `Found ${hotspots.length} files with high complexity that need attention`
        );
      }

      // Generate recommendations
      if (complexFunctions.length > 0) {
        recommendations.push(
          `Prioritize refactoring ${complexFunctions.length} complex functions`
        );
      }

      if (metrics.complexityDistribution.critical > 0) {
        recommendations.push(
          `${metrics.complexityDistribution.critical} functions have critical complexity - immediate attention needed`
        );
      }
    }

    return {
      insights,
      recommendations,
      complexityData: result.analysis,
    };
  }

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    if (this.cache) {
      this.cache.clear();
      logger.debug('Cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { hits: number; misses: number; hitRate: number; entries: number } | null {
    if (!this.cache) return null;
    const stats = this.cache.getStats();
    return {
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hitRate,
      entries: stats.entryCount,
    };
  }

  // ==========================================================================
  // Getters
  // ==========================================================================

  /**
   * Get current configuration
   */
  getConfig(): Partial<AnalyzerConfig> {
    return { ...this.config };
  }

  /**
   * Get project root
   */
  getProjectRoot(): string {
    return this.projectRoot;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a code complexity plugin instance
 */
export function createComplexityPlugin(
  projectRoot: string,
  options?: ComplexityPluginOptions
): CodeComplexityPlugin {
  return new CodeComplexityPlugin({
    ...options,
    projectRoot,
  });
}

/**
 * Quick analysis function for simple use cases
 */
export async function analyzeComplexity(
  projectRoot: string,
  options?: Partial<AnalyzerConfig>
): Promise<ComplexityPluginResult> {
  const plugin = new CodeComplexityPlugin({
    projectRoot,
    config: options,
  });
  return plugin.analyze();
}

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
export function registerWithSeedGenerator(
  seedGenerator: { registerPlugin?: (name: string, hook: unknown) => void },
  projectRoot: string,
  options?: ComplexityPluginOptions
): CodeComplexityPlugin {
  const plugin = createComplexityPlugin(projectRoot, options);

  if (seedGenerator.registerPlugin) {
    seedGenerator.registerPlugin('code-complexity', plugin.seedGeneratorHook.bind(plugin));
    logger.info('Registered code complexity plugin with SeedGenerator');
  }

  return plugin;
}

// ============================================================================
// Plugin Metadata
// ============================================================================

/**
 * Plugin metadata for registration and discovery
 */
export const pluginMetadata = {
  name: 'code-complexity-analyzer',
  version: '1.0.0',
  description: 'Analyzes code complexity and generates knowledge graph nodes',
  author: 'Weave-NN',
  capabilities: [
    'cyclomatic-complexity',
    'cognitive-complexity',
    'maintainability-index',
    'knowledge-graph-generation',
    'cache-support',
  ],
  supportedLanguages: ['typescript', 'javascript', 'tsx', 'jsx'],
  hooks: ['seedGenerator', 'deepAnalyzer'],
};

// Default export
export default CodeComplexityPlugin;
