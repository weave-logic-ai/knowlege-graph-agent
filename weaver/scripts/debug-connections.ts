#!/usr/bin/env node
/**
 * Debug Connection Paths
 */

import { readFile } from 'fs/promises';
import { GraphAnalyzer } from '../src/knowledge-graph/graph-analyzer.js';

async function main() {
  // Load suggestions
  const suggestionsPath = '/home/aepod/dev/weave-nn/weaver/.graph-data/suggestions.json';
  const data = JSON.parse(await readFile(suggestionsPath, 'utf-8'));
  const rawSuggestions = data.suggestions || data;

  console.log(`\n📋 Top 5 suggestion paths:`);
  rawSuggestions.slice(0, 5).forEach((s: any, i: number) => {
    console.log(`   ${i + 1}. ${s.source} → ${s.target}`);
  });

  // Analyze graph
  console.log(`\n📊 Analyzing graph...`);
  const analyzer = new GraphAnalyzer('/home/aepod/dev/weave-nn/weave-nn');
  await analyzer.analyze();

  const nodes = analyzer.getNodes();
  console.log(`\n🗂️  Node map has ${nodes.size} entries`);

  console.log(`\n📁 Sample node paths (first 5):`);
  let count = 0;
  for (const [path, node] of nodes.entries()) {
    if (count++ >= 5) break;
    console.log(`   ${count}. "${path}"`);
  }

  // Check if suggestion paths exist in node map
  console.log(`\n🔍 Checking if suggestion paths exist in node map:`);
  const sampleSuggestions = rawSuggestions.slice(0, 10);

  for (const s of sampleSuggestions) {
    const source = s.source || s.sourceFile;
    const exists = nodes.has(source);
    console.log(`   ${exists ? '✅' : '❌'} "${source}"`);
  }

  // Try to find matches with different path formats
  console.log(`\n🔧 Trying path variations for first suggestion:`);
  const first = sampleSuggestions[0];
  const sourcePath = first.source || first.sourceFile;

  console.log(`   Original: "${sourcePath}"`);
  console.log(`   Exists: ${nodes.has(sourcePath)}`);

  // Try with /home/aepod/dev/weave-nn/ prefix
  const absolutePath = `/home/aepod/dev/weave-nn/${sourcePath}`;
  console.log(`   Absolute: "${absolutePath}"`);
  console.log(`   Exists: ${nodes.has(absolutePath)}`);

  // Try just the filename part
  const parts = sourcePath.split('/');
  const filename = parts[parts.length - 1];
  console.log(`   Filename only: "${filename}"`);

  let filenameMatch = null;
  for (const [path, node] of nodes.entries()) {
    if (path.endsWith(filename)) {
      filenameMatch = path;
      break;
    }
  }
  console.log(`   Filename match: ${filenameMatch || 'not found'}`);
}

main().catch(console.error);
