#!/usr/bin/env tsx
/**
 * Knowledge Graph Validation Runner
 * Comprehensive validation of the knowledge graph structure
 */

import { validateGraph } from './validate-graph.js';

const config = {
  checkOrphans: true,
  checkBrokenLinks: true,
  checkMetadata: true,
  checkHubCoverage: true,
  generateReport: true,
  outputPath: '/home/aepod/dev/weave-nn/weave-nn/docs/KG-VALIDATION-REPORT.md'
};

async function main() {
  console.log('🚀 Starting Knowledge Graph Validation\n');

  const result = await validateGraph(config);

  console.log('\n📊 Validation Results:');
  console.log('━'.repeat(60));
  console.log(`Status: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Total Files: ${result.metrics.totalFiles}`);
  console.log(`Orphaned: ${result.metrics.orphanedFiles} (${result.metrics.orphanPercentage.toFixed(1)}%)`);
  console.log(`Hubs Created: ${result.metrics.totalHubs}`);
  console.log(`Hub Coverage: ${result.metrics.hubCoverage.toFixed(1)}%`);
  console.log(`Metadata Coverage: ${result.metrics.metadataCoverage.toFixed(1)}%`);
  console.log(`Broken Links: ${result.metrics.brokenLinks}`);
  console.log(`Avg Connections/File: ${result.metrics.avgConnectionsPerFile.toFixed(1)}`);
  console.log('━'.repeat(60));

  console.log('\n💡 Top Recommendations:');
  result.recommendations.slice(0, 5).forEach(rec => {
    console.log(`   ${rec}`);
  });

  console.log(`\n📄 Full report: ${config.outputPath}`);
}

main().catch(console.error);
