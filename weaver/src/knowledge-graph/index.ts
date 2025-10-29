/**
 * Knowledge Graph Analysis Tool - Main Export
 * Automated wikilink suggestion engine for reconnecting knowledge bases
 */

export { GraphAnalyzer } from './graph-analyzer.js';
export { LinkSuggester } from './link-suggester.js';
export { BatchConnector } from './batch-connector.js';
export type {
  GraphNode,
  GraphEdge,
  GraphMetrics,
  AnalysisResult,
  ConnectionSuggestion,
  MetadataIndex,
  BatchConnectionConfig,
  BatchConnectionResult,
  Frontmatter,
  SimilarityScore,
  ClusterInfo,
  ConnectivityReport,
} from './types.js';

/**
 * Full workflow execution
 */
import { writeFile } from 'fs/promises';
import { GraphAnalyzer } from './graph-analyzer.js';
import { LinkSuggester } from './link-suggester.js';
import { BatchConnector } from './batch-connector.js';
import type { BatchConnectionConfig } from './types.js';

export interface WorkflowConfig {
  rootPath: string;
  outputDir: string;
  maxSuggestionsPerFile?: number;
  minScore?: number;
  topNSuggestions?: number;
  connectionConfig?: Partial<BatchConnectionConfig>;
}

export async function runFullAnalysis(config: WorkflowConfig) {
  console.log('🚀 Starting full knowledge graph analysis workflow...\n');

  // Step 1: Analyze graph structure
  const analyzer = new GraphAnalyzer(config.rootPath);
  const analysis = await analyzer.analyze();

  console.log('\n📊 Graph Metrics:');
  console.log(`   Total files: ${analysis.metrics.totalNodes}`);
  console.log(`   Connected: ${analysis.metrics.connectedNodes}`);
  console.log(`   Disconnected: ${analysis.metrics.disconnectedNodes}`);
  console.log(`   Orphaned: ${analysis.metrics.orphanedNodes}`);
  console.log(`   Average connections: ${analysis.metrics.averageDegree.toFixed(2)}`);
  console.log(`   Density: ${(analysis.metrics.density * 100).toFixed(4)}%`);
  console.log(`   Clusters: ${analysis.metrics.clusters}`);

  // Step 2: Generate suggestions
  const suggester = new LinkSuggester(
    analyzer.getNodes(),
    analyzer.getMetadataIndex()
  );

  const suggestions = await suggester.generateSuggestions(
    config.maxSuggestionsPerFile || 5,
    config.minScore || 5.0
  );

  console.log(`\n🔗 Generated ${suggestions.length} connection suggestions`);

  const topSuggestions = suggester.getTopSuggestions(
    suggestions,
    config.topNSuggestions || 100
  );

  // Step 3: Export results
  const resultsPath = `${config.outputDir}/analysis-results.json`;
  await writeFile(
    resultsPath,
    JSON.stringify(
      {
        timestamp: analysis.timestamp,
        metrics: analysis.metrics,
        orphanedFiles: analysis.orphanedFiles,
        hubFiles: analysis.hubFiles,
        topSuggestions: topSuggestions.slice(0, 50),
      },
      null,
      2
    ),
    'utf-8'
  );

  console.log(`\n💾 Saved analysis results to ${resultsPath}`);

  // Step 4: Export all suggestions
  const connector = new BatchConnector(analyzer.getNodes());
  const suggestionsPath = `${config.outputDir}/suggestions.json`;
  await connector.exportSuggestions(suggestions, suggestionsPath);

  // Step 5: Preview connections
  const defaultConfig: BatchConnectionConfig = {
    maxSuggestionsPerFile: config.maxSuggestionsPerFile || 5,
    minScore: config.minScore || 5.0,
    preserveExisting: true,
    addFrontmatter: true,
    bidirectional: true,
    dryRun: true,
    ...config.connectionConfig,
  };

  const preview = await connector.previewConnections(suggestions, defaultConfig);

  console.log(`\n📋 Connection Preview:`);
  console.log(`   Files to update: ${preview.size}`);
  console.log(
    `   Total connections: ${Array.from(preview.values()).reduce(
      (sum, list) => sum + list.length,
      0
    )}`
  );

  // Display top 10 suggestions
  console.log(`\n🌟 Top 10 Connection Suggestions:`);
  topSuggestions.slice(0, 10).forEach((s, i) => {
    console.log(
      `   ${i + 1}. [${s.score.toFixed(1)}] ${s.sourceFile} → ${s.targetFile}`
    );
    console.log(`      ${s.reason}`);
  });

  return {
    analysis,
    suggestions,
    topSuggestions,
    preview,
    connector,
    config: defaultConfig,
  };
}
