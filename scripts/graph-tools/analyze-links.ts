#!/usr/bin/env bun
/**
 * Link Structure Analyzer
 * Analyzes markdown files to map knowledge graph structure
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, relative, dirname, resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

// Types
interface LinkReport {
  file: string;
  incomingLinks: string[];
  outgoingLinks: string[];
  brokenLinks: string[];
  isOrphaned: boolean;
  linkCount: number;
}

interface GraphAnalysis {
  totalFiles: number;
  connectedFiles: number;
  disconnectedFiles: string[];
  linkDensity: number;
  clusters: FileCluster[];
  orphans: string[];
  brokenLinkCount: number;
  metrics: GraphMetrics;
}

interface FileCluster {
  id: number;
  files: string[];
  size: number;
  centralFile: string;
}

interface GraphMetrics {
  averageLinksPerFile: number;
  maxLinks: number;
  minLinks: number;
  isolatedFiles: number;
  stronglyConnectedFiles: number;
}

// Configuration
const PROJECT_ROOT = resolve(dirname(dirname(__dirname)));
const DOCS_DIRS = [
  'weave-nn/docs',
  'weave-nn/_planning/phases',
  'weave-nn/_planning/specs',
  'weave-nn/_planning/research'
];

const WIKI_LINK_REGEX = /\[\[([^\]|]+)(\|[^\]]+)?\]\]/g;
const MD_LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;

// File scanning
function findMarkdownFiles(baseDir: string): string[] {
  const files: string[] = [];

  function scan(dir: string) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          scan(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning ${dir}:`, error);
    }
  }

  scan(baseDir);
  return files;
}

// Link extraction
function extractLinks(content: string, sourceFile: string): string[] {
  const links: string[] = [];

  // Extract wiki-style links [[target]] or [[target|alias]]
  let match;
  while ((match = WIKI_LINK_REGEX.exec(content)) !== null) {
    links.push(match[1].trim());
  }

  // Extract markdown links [text](path)
  while ((match = MD_LINK_REGEX.exec(content)) !== null) {
    const url = match[2].trim();

    // Only process relative links to .md files
    if (!url.startsWith('http') && !url.startsWith('#') && url.includes('.md')) {
      links.push(url);
    }
  }

  return links;
}

// Resolve link path
function resolveLinkPath(link: string, sourceFile: string, allFiles: string[]): string | null {
  const sourceDir = dirname(sourceFile);

  // Handle wiki-style links (look for filename match)
  if (!link.includes('/') && !link.endsWith('.md')) {
    const targetName = `${link}.md`;
    const found = allFiles.find(f => f.endsWith(targetName));
    if (found) return found;
  }

  // Handle relative markdown links
  if (link.startsWith('.')) {
    const resolved = resolve(sourceDir, link);
    if (existsSync(resolved)) return resolved;
  }

  // Handle absolute paths from project root
  if (link.startsWith('/')) {
    const resolved = join(PROJECT_ROOT, link);
    if (existsSync(resolved)) return resolved;
  }

  return null;
}

// Analyze links for all files
function analyzeLinkStructure(files: string[]): Map<string, LinkReport> {
  const reports = new Map<string, LinkReport>();

  // Initialize reports
  files.forEach(file => {
    reports.set(file, {
      file: relative(PROJECT_ROOT, file),
      incomingLinks: [],
      outgoingLinks: [],
      brokenLinks: [],
      isOrphaned: false,
      linkCount: 0
    });
  });

  // Extract outgoing links
  files.forEach(sourceFile => {
    const content = readFileSync(sourceFile, 'utf-8');
    const links = extractLinks(content, sourceFile);
    const report = reports.get(sourceFile)!;

    links.forEach(link => {
      const targetFile = resolveLinkPath(link, sourceFile, files);

      if (targetFile && reports.has(targetFile)) {
        // Valid internal link
        report.outgoingLinks.push(relative(PROJECT_ROOT, targetFile));
        const targetReport = reports.get(targetFile)!;
        targetReport.incomingLinks.push(report.file);
      } else {
        // Broken link
        report.brokenLinks.push(link);
      }
    });

    report.linkCount = report.outgoingLinks.length + report.incomingLinks.length;
  });

  // Identify orphans (no incoming or outgoing links)
  reports.forEach(report => {
    report.isOrphaned = report.incomingLinks.length === 0 && report.outgoingLinks.length === 0;
  });

  return reports;
}

// Find connected components (clusters)
function findClusters(reports: Map<string, LinkReport>): FileCluster[] {
  const visited = new Set<string>();
  const clusters: FileCluster[] = [];
  let clusterId = 0;

  function dfs(file: string, cluster: Set<string>) {
    if (visited.has(file)) return;
    visited.add(file);
    cluster.add(file);

    const report = reports.get(file);
    if (!report) return;

    // Follow outgoing links
    report.outgoingLinks.forEach(target => {
      const fullPath = Array.from(reports.keys()).find(f =>
        relative(PROJECT_ROOT, f) === target
      );
      if (fullPath) dfs(fullPath, cluster);
    });

    // Follow incoming links
    report.incomingLinks.forEach(source => {
      const fullPath = Array.from(reports.keys()).find(f =>
        relative(PROJECT_ROOT, f) === source
      );
      if (fullPath) dfs(fullPath, cluster);
    });
  }

  reports.forEach((_, file) => {
    if (!visited.has(file)) {
      const cluster = new Set<string>();
      dfs(file, cluster);

      if (cluster.size > 0) {
        const files = Array.from(cluster).map(f => relative(PROJECT_ROOT, f));

        // Find central file (most connections)
        const centralFile = files.reduce((central, current) => {
          const currentReport = reports.get(Array.from(reports.keys()).find(k =>
            relative(PROJECT_ROOT, k) === current
          )!)!;
          const centralReport = reports.get(Array.from(reports.keys()).find(k =>
            relative(PROJECT_ROOT, k) === central
          )!)!;

          return currentReport.linkCount > centralReport.linkCount ? current : central;
        });

        clusters.push({
          id: clusterId++,
          files,
          size: cluster.size,
          centralFile
        });
      }
    }
  });

  return clusters.sort((a, b) => b.size - a.size);
}

// Calculate graph metrics
function calculateMetrics(reports: Map<string, LinkReport>): GraphMetrics {
  const linkCounts = Array.from(reports.values()).map(r => r.linkCount);

  return {
    averageLinksPerFile: linkCounts.reduce((a, b) => a + b, 0) / linkCounts.length,
    maxLinks: Math.max(...linkCounts),
    minLinks: Math.min(...linkCounts),
    isolatedFiles: Array.from(reports.values()).filter(r => r.isOrphaned).length,
    stronglyConnectedFiles: Array.from(reports.values()).filter(r =>
      r.incomingLinks.length >= 2 && r.outgoingLinks.length >= 2
    ).length
  };
}

// Generate analysis report
function generateAnalysis(reports: Map<string, LinkReport>): GraphAnalysis {
  const orphans = Array.from(reports.values())
    .filter(r => r.isOrphaned)
    .map(r => r.file);

  const disconnected = Array.from(reports.values())
    .filter(r => r.linkCount === 0)
    .map(r => r.file);

  const brokenLinkCount = Array.from(reports.values())
    .reduce((sum, r) => sum + r.brokenLinks.length, 0);

  const clusters = findClusters(reports);
  const metrics = calculateMetrics(reports);

  return {
    totalFiles: reports.size,
    connectedFiles: reports.size - orphans.length,
    disconnectedFiles: disconnected,
    linkDensity: metrics.averageLinksPerFile,
    clusters,
    orphans,
    brokenLinkCount,
    metrics
  };
}

// Pretty print analysis
function printAnalysis(analysis: GraphAnalysis) {
  console.log('\n📊 Knowledge Graph Analysis\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📈 **Overall Statistics**\n');
  console.log(`  Total Files: ${analysis.totalFiles}`);
  console.log(`  Connected Files: ${analysis.connectedFiles} (${Math.round(analysis.connectedFiles / analysis.totalFiles * 100)}%)`);
  console.log(`  Orphaned Files: ${analysis.orphans.length} (${Math.round(analysis.orphans.length / analysis.totalFiles * 100)}%)`);
  console.log(`  Broken Links: ${analysis.brokenLinkCount}`);
  console.log(`  Link Density: ${analysis.linkDensity.toFixed(2)} links/file\n`);

  console.log('📊 **Link Distribution**\n');
  console.log(`  Average Links: ${analysis.metrics.averageLinksPerFile.toFixed(2)}`);
  console.log(`  Max Links: ${analysis.metrics.maxLinks}`);
  console.log(`  Min Links: ${analysis.metrics.minLinks}`);
  console.log(`  Strongly Connected: ${analysis.metrics.stronglyConnectedFiles}\n`);

  console.log(`🔗 **Graph Clusters** (${analysis.clusters.length} found)\n`);
  analysis.clusters.slice(0, 5).forEach(cluster => {
    console.log(`  Cluster ${cluster.id}: ${cluster.size} files`);
    console.log(`    Central: ${cluster.centralFile}`);
    if (cluster.size <= 5) {
      cluster.files.forEach(f => console.log(`      - ${f}`));
    }
  });

  if (analysis.orphans.length > 0) {
    console.log(`\n🔴 **Orphaned Files** (${analysis.orphans.length} total)\n`);
    analysis.orphans.slice(0, 10).forEach(file => {
      console.log(`  - ${file}`);
    });
    if (analysis.orphans.length > 10) {
      console.log(`  ... and ${analysis.orphans.length - 10} more`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

// Main execution
async function main() {
  console.log('🔍 Analyzing knowledge graph structure...\n');

  const allFiles: string[] = [];

  DOCS_DIRS.forEach(dir => {
    const fullPath = join(PROJECT_ROOT, dir);
    if (existsSync(fullPath)) {
      const files = findMarkdownFiles(fullPath);
      allFiles.push(...files);
      console.log(`  Scanned: ${dir} (${files.length} files)`);
    }
  });

  console.log(`\n  Total: ${allFiles.length} markdown files\n`);

  const reports = analyzeLinkStructure(allFiles);
  const analysis = generateAnalysis(reports);

  // Print to console
  printAnalysis(analysis);

  // Save JSON report
  const reportDir = join(PROJECT_ROOT, 'scripts/graph-tools/reports');
  mkdirSync(reportDir, { recursive: true });

  const reportPath = join(reportDir, `link-analysis-${Date.now()}.json`);
  writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    analysis,
    reports: Array.from(reports.values())
  }, null, 2));

  console.log(`📝 Full report saved: ${relative(PROJECT_ROOT, reportPath)}\n`);

  // Exit with error if high orphan rate
  const orphanRate = analysis.orphans.length / analysis.totalFiles;
  if (orphanRate > 0.3) {
    console.log('⚠️  WARNING: >30% of files are orphaned. Run reconnection strategy.\n');
    process.exit(1);
  }

  console.log('✅ Analysis complete!\n');
}

main().catch(console.error);
