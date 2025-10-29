#!/usr/bin/env node
/**
 * Knowledge Graph CLI
 * Command-line interface for graph analysis and batch connections
 */

import { runFullAnalysis } from './index.js';
import { BatchConnector } from './batch-connector.js';
import { readFile } from 'fs/promises';
import type { ConnectionSuggestion, BatchConnectionConfig } from './types.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    printHelp();
    return;
  }

  switch (command) {
    case 'analyze':
      await runAnalyze(args.slice(1));
      break;
    case 'connect':
      await runConnect(args.slice(1));
      break;
    case 'preview':
      await runPreview(args.slice(1));
      break;
    default:
      console.error(`❌ Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

async function runAnalyze(args: string[]) {
  const rootPath = args[0] || process.cwd();
  const outputDir = args[1] || './.graph-data';

  console.log(`📊 Analyzing knowledge graph at: ${rootPath}\n`);

  const result = await runFullAnalysis({
    rootPath,
    outputDir,
    maxSuggestionsPerFile: 5,
    minScore: 5.0,
    topNSuggestions: 100,
  });

  console.log('\n✅ Analysis complete!');
  console.log(`\nNext steps:`);
  console.log(`  1. Review suggestions: cat ${outputDir}/suggestions.json`);
  console.log(`  2. Preview connections: npm run kg:preview`);
  console.log(`  3. Apply connections: npm run kg:connect`);
}

async function runPreview(args: string[]) {
  const suggestionsFile = args[0] || './.graph-data/suggestions.json';

  console.log(`🔍 Loading suggestions from: ${suggestionsFile}\n`);

  const data = JSON.parse(await readFile(suggestionsFile, 'utf-8'));
  const suggestions: ConnectionSuggestion[] = data.suggestions;

  console.log(`📋 Preview of ${suggestions.length} suggestions:`);
  console.log(`\nTop 20 connections:\n`);

  suggestions.slice(0, 20).forEach((s, i) => {
    console.log(`${i + 1}. [Score: ${s.score}] ${s.bidirectional ? '↔' : '→'}`);
    console.log(`   ${s.sourceFile} → ${s.targetFile}`);
    console.log(`   ${s.reason}`);
    console.log();
  });
}

async function runConnect(args: string[]) {
  const suggestionsFile = args[0] || './.graph-data/suggestions.json';
  const dryRun = args.includes('--dry-run');

  console.log(`🔗 ${dryRun ? '[DRY RUN] ' : ''}Applying connections...\n`);

  const data = JSON.parse(await readFile(suggestionsFile, 'utf-8'));
  const suggestions: ConnectionSuggestion[] = data.suggestions;

  // Note: Need to recreate nodes map - this is a simplified version
  // In production, load from analysis results
  console.log(
    `⚠️  Note: This requires full analysis results. Run 'analyze' first.`
  );
  console.log(`Would process ${suggestions.length} suggestions`);
}

function printHelp() {
  console.log(`
Knowledge Graph Analysis Tool

USAGE:
  npm run kg:analyze [root-path] [output-dir]
  npm run kg:preview [suggestions-file]
  npm run kg:connect [suggestions-file] [--dry-run]

COMMANDS:
  analyze   - Analyze knowledge graph and generate suggestions
  preview   - Preview connection suggestions
  connect   - Apply connection suggestions to files
  help      - Show this help message

EXAMPLES:
  # Analyze current directory
  npm run kg:analyze

  # Analyze specific directory
  npm run kg:analyze ./docs ./output

  # Preview suggestions
  npm run kg:preview ./.graph-data/suggestions.json

  # Apply connections (dry run)
  npm run kg:connect --dry-run

  # Apply connections (real)
  npm run kg:connect

OPTIONS:
  --dry-run    Don't modify files, just show what would change
  `);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
