#!/usr/bin/env tsx
/**
 * Quick script to run graph analysis
 * Usage: npx tsx scripts/analyze-graph.ts
 */

import { runFullAnalysis } from '../src/knowledge-graph/index.js';
import { join } from 'path';

async function main() {
  const rootPath = join(process.cwd(), '..');
  const outputDir = join(process.cwd(), '.graph-data');

  console.log('🚀 Running knowledge graph analysis...\n');
  console.log(`Root: ${rootPath}`);
  console.log(`Output: ${outputDir}\n`);

  const result = await runFullAnalysis({
    rootPath,
    outputDir,
    maxSuggestionsPerFile: 5,
    minScore: 5.0,
    topNSuggestions: 100,
  });

  console.log('\n✅ Analysis complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   Total files: ${result.analysis.metrics.totalNodes}`);
  console.log(`   Orphaned files: ${result.analysis.metrics.orphanedNodes}`);
  console.log(`   Suggestions generated: ${result.suggestions.length}`);
  console.log(`   Files to update: ${result.preview.size}`);

  console.log(`\n💾 Results saved to: ${outputDir}`);
  console.log(`   - analysis-results.json (graph metrics)`);
  console.log(`   - suggestions.json (all connection suggestions)`);

  console.log(`\n🎯 Next steps:`);
  console.log(`   1. Review top suggestions above`);
  console.log(`   2. Run batch connector to apply connections`);
  console.log(`   3. Store progress in memory coordinator`);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
