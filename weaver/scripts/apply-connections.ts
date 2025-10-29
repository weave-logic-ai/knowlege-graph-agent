#!/usr/bin/env node
/**
 * Apply Connection Suggestions Script
 * Reads suggestions.json and applies connections to files
 */

import { readFile } from 'fs/promises';
import { GraphAnalyzer } from '../src/knowledge-graph/graph-analyzer.js';
import { BatchConnector } from '../src/knowledge-graph/batch-connector.js';
import type { ConnectionSuggestion, BatchConnectionConfig } from '../src/knowledge-graph/types.js';

async function main() {
  const limit = parseInt(process.argv[2] || '100', 10);
  const dryRun = process.argv.includes('--dry-run');

  console.log(`🔗 Applying top ${limit} connection suggestions...`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (modifying files)'}\n`);

  // Load suggestions
  const suggestionsPath = '/home/aepod/dev/weave-nn/weaver/.graph-data/suggestions.json';
  console.log(`📂 Loading suggestions from: ${suggestionsPath}`);

  const data = JSON.parse(await readFile(suggestionsPath, 'utf-8'));
  const rawSuggestions = data.suggestions || data;

  // Convert from export format to internal format
  // Strip "weave-nn/" prefix to match node map paths
  const stripPrefix = (path: string) => path.replace(/^weave-nn\//, '');

  const allSuggestions: ConnectionSuggestion[] = rawSuggestions.map((s: any) => ({
    sourceFile: stripPrefix(s.source || s.sourceFile),
    targetFile: stripPrefix(s.target || s.targetFile),
    score: s.score,
    reason: s.reason,
    bidirectional: s.bidirectional,
    metadata: s.metadata,
  }));

  console.log(`   Found ${allSuggestions.length} total suggestions\n`);

  // Re-analyze to get nodes
  console.log(`📊 Re-analyzing graph to get current node map...`);
  const analyzer = new GraphAnalyzer('/home/aepod/dev/weave-nn/weave-nn');
  await analyzer.analyze();
  console.log(`   Loaded ${analyzer.getNodes().size} nodes from weave-nn directory\n`);

  // Note: Suggestions may include files from entire repo
  // but we're only applying to weave-nn vault for safety

  // Take top suggestions by score
  const topSuggestions = allSuggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  console.log(`🎯 Applying top ${topSuggestions.length} suggestions (scores ${topSuggestions[0]?.score.toFixed(1)} - ${topSuggestions[topSuggestions.length - 1]?.score.toFixed(1)})\n`);

  // Configure batch connector
  const config: BatchConnectionConfig = {
    maxSuggestionsPerFile: 5,
    minScore: 5.0,
    preserveExisting: true,
    addFrontmatter: true,
    bidirectional: true,
    dryRun: dryRun,
  };

  // Apply connections
  const connector = new BatchConnector(analyzer.getNodes());
  const result = await connector.applyConnections(topSuggestions, config);

  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${result.processed}`);
  console.log(`   Successful: ${result.successful}`);
  console.log(`   Failed: ${result.failed}`);
  console.log(`   Skipped: ${result.skipped}`);
  console.log(`   Total connections added: ${result.connectionsAdded}`);

  if (result.errors.length > 0) {
    console.log(`\n❌ Errors:`);
    result.errors.forEach((err) => {
      console.log(`   ${err.file}: ${err.error}`);
    });
  }

  if (dryRun) {
    console.log(`\n💡 This was a dry run. To apply changes, run without --dry-run`);
  } else {
    console.log(`\n✅ Connections applied successfully!`);
    console.log(`\n🔄 Next steps:`);
    console.log(`   1. Open Obsidian and refresh graph view`);
    console.log(`   2. Run graph analyzer again to see improvements`);
    console.log(`   3. Review the new "Related" sections in updated files`);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
