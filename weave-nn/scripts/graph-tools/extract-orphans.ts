#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Run analysis from project root
const projectRoot = join(process.cwd(), '../../..');
const output = execSync('npx tsx weave-nn/scripts/graph-tools/analyze-graph.ts 2>&1', {
  cwd: projectRoot,
  encoding: 'utf-8'
});

// Extract JSON part (between first { and last })
const jsonStart = output.indexOf('{');
const jsonEnd = output.lastIndexOf('}') + 1;

if (jsonStart === -1 || jsonEnd === 0) {
  console.error('No JSON found in output');
  process.exit(1);
}

const jsonStr = output.substring(jsonStart, jsonEnd);
const data = JSON.parse(jsonStr);

console.log('\n📊 ORPHAN ANALYSIS');
console.log('==================');
console.log(`Total files: ${data.metrics.totalFiles}`);
console.log(`Orphaned files: ${data.metrics.orphanedFiles}`);
console.log(`Orphan rate: ${(data.metrics.orphanedFiles / data.metrics.totalFiles * 100).toFixed(1)}%`);

// Group orphans by directory
const orphansByDir: Record<string, string[]> = {};
data.nodes.filter((n: any) => n.isOrphan).forEach((node: any) => {
  const dir = node.path.split('/').slice(0, -1).join('/') || 'root';
  if (!orphansByDir[dir]) orphansByDir[dir] = [];
  orphansByDir[dir].push(node.path);
});

console.log('\n📁 ORPHANS BY DIRECTORY:');
console.log('========================');
Object.entries(orphansByDir)
  .sort(([, a], [, b]) => b.length - a.length)
  .forEach(([dir, files]) => {
    console.log(`\n${dir}/ (${files.length} files):`);
    files.slice(0, 5).forEach(f => console.log(`  - ${f}`));
    if (files.length > 5) console.log(`  ... and ${files.length - 5} more`);
  });

// Output all orphans as JSON for processing
console.log('\n\n📄 ALL ORPHANS (JSON):');
console.log(JSON.stringify(data.nodes.filter((n: any) => n.isOrphan).map((n: any) => n.path), null, 2));
