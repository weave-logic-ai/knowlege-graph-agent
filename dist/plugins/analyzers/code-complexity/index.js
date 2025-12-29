import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { createLogger } from "../../../utils/logger.js";
import { AdvancedCache } from "../../../caching/index.js";
import { CodeComplexityAnalyzer } from "./analyzer.js";
import { analyzeFileComplexity, analyzeProjectComplexity } from "./analyzer.js";
import { ComplexityGraphGenerator, generateComplexityNodes } from "./graph-generator.js";
import { CodeComplexityAnalyzerPlugin, createCodeComplexityAnalyzerPlugin } from "./plugin.js";
const logger = createLogger("code-complexity-plugin");
class CodeComplexityPlugin {
  projectRoot;
  config;
  options;
  cache = null;
  analyzer;
  graphGenerator;
  constructor(options) {
    this.projectRoot = options.projectRoot ?? ".";
    this.config = options.config ?? {};
    this.options = options;
    if (options.useCache) {
      this.cache = new AdvancedCache({
        maxEntries: 1e3,
        defaultTtl: options.cacheTtl ?? 36e5,
        // 1 hour default
        evictionPolicy: "lru"
      });
    }
    this.analyzer = new CodeComplexityAnalyzer({
      ...this.config,
      projectRoot: this.projectRoot
    });
    this.graphGenerator = new ComplexityGraphGenerator(this.projectRoot, this.config);
  }
  // ==========================================================================
  // Main Analysis
  // ==========================================================================
  /**
   * Run complete complexity analysis
   */
  async analyze() {
    logger.info("Starting code complexity analysis", {
      projectRoot: this.projectRoot
    });
    const result = {
      success: false,
      analysis: null,
      nodes: [],
      edges: [],
      errors: [],
      warnings: []
    };
    try {
      const analysis = await this.analyzer.analyzeProject();
      result.analysis = analysis;
      if (this.config.generateGraphNodes !== false) {
        const { nodes, edges } = generateComplexityNodes(analysis, this.projectRoot);
        result.nodes = nodes;
        result.edges = edges;
      }
      if (this.options.generateReport) {
        await this.generateReport(analysis);
      }
      result.success = true;
      logger.info("Complexity analysis complete", {
        files: analysis.metrics.totalFiles,
        functions: analysis.metrics.totalFunctions,
        hotspots: analysis.hotspots.length,
        nodes: result.nodes.length
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(message);
      logger.error("Complexity analysis failed", error instanceof Error ? error : new Error(message));
    }
    return result;
  }
  /**
   * Analyze a single file
   */
  async analyzeFile(filePath) {
    if (this.cache) {
      const cached = this.cache.get(filePath);
      if (cached) {
        return cached.analysis;
      }
    }
    const analysis = await this.analyzer.analyzeFile(filePath);
    if (this.cache && analysis) {
      this.cache.set(filePath, {
        filePath,
        mtime: Date.now(),
        analysis,
        cachedAt: Date.now()
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
  async generateReport(analysis) {
    const report = this.graphGenerator.generateProjectReport(analysis);
    if (this.options.reportPath) {
      const reportPath = this.options.reportPath.startsWith("/") ? this.options.reportPath : join(this.projectRoot, this.options.reportPath);
      const dir = dirname(reportPath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      await writeFile(reportPath, report, "utf-8");
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
  async seedGeneratorHook(context) {
    logger.info("Running complexity analysis for SeedGenerator");
    const result = await this.analyze();
    return {
      nodes: result.nodes,
      edges: result.edges,
      metadata: {
        totalFiles: result.analysis?.metrics.totalFiles ?? 0,
        totalFunctions: result.analysis?.metrics.totalFunctions ?? 0,
        avgComplexity: result.analysis?.metrics.avgCyclomatic ?? 0,
        hotspots: result.analysis?.hotspots.length ?? 0
      }
    };
  }
  /**
   * Hook for DeepAnalyzer pipeline
   *
   * Called during deep analysis to provide complexity insights
   * for the AI agents to consider.
   */
  async deepAnalyzerHook(context) {
    const result = await this.analyze();
    const insights = [];
    const recommendations = [];
    if (result.analysis) {
      const { metrics, hotspots, complexFunctions } = result.analysis;
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
      complexityData: result.analysis
    };
  }
  // ==========================================================================
  // Cache Management
  // ==========================================================================
  /**
   * Clear analysis cache
   */
  clearCache() {
    if (this.cache) {
      this.cache.clear();
      logger.debug("Cache cleared");
    }
  }
  /**
   * Get cache statistics
   */
  getCacheStats() {
    if (!this.cache) return null;
    const stats = this.cache.getStats();
    return {
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hitRate,
      entries: stats.entryCount
    };
  }
  // ==========================================================================
  // Getters
  // ==========================================================================
  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Get project root
   */
  getProjectRoot() {
    return this.projectRoot;
  }
}
function createComplexityPlugin(projectRoot, options) {
  return new CodeComplexityPlugin({
    ...options,
    projectRoot
  });
}
async function analyzeComplexity(projectRoot, options) {
  const plugin = new CodeComplexityPlugin({
    projectRoot,
    config: options
  });
  return plugin.analyze();
}
function registerWithSeedGenerator(seedGenerator, projectRoot, options) {
  const plugin = createComplexityPlugin(projectRoot, options);
  if (seedGenerator.registerPlugin) {
    seedGenerator.registerPlugin("code-complexity", plugin.seedGeneratorHook.bind(plugin));
    logger.info("Registered code complexity plugin with SeedGenerator");
  }
  return plugin;
}
const pluginMetadata = {
  name: "code-complexity-analyzer",
  version: "1.0.0",
  description: "Analyzes code complexity and generates knowledge graph nodes",
  author: "Weave-NN",
  capabilities: [
    "cyclomatic-complexity",
    "cognitive-complexity",
    "maintainability-index",
    "knowledge-graph-generation",
    "cache-support"
  ],
  supportedLanguages: ["typescript", "javascript", "tsx", "jsx"],
  hooks: ["seedGenerator", "deepAnalyzer"]
};
export {
  CodeComplexityAnalyzer,
  CodeComplexityAnalyzerPlugin,
  CodeComplexityPlugin,
  ComplexityGraphGenerator,
  analyzeComplexity,
  analyzeFileComplexity,
  analyzeProjectComplexity,
  createCodeComplexityAnalyzerPlugin,
  createComplexityPlugin,
  CodeComplexityPlugin as default,
  generateComplexityNodes,
  pluginMetadata,
  registerWithSeedGenerator
};
//# sourceMappingURL=index.js.map
