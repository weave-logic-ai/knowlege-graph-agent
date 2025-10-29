#!/usr/bin/env tsx
/**
 * Graph Analysis Tool
 * Analyzes knowledge graph connectivity, calculates metrics, and generates reports
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import matter from 'gray-matter';

interface GraphNode {
  path: string;
  relativePath: string;
  title: string;
  tags: string[];
  outboundLinks: string[];
  inboundLinks: string[];
  linkCount: number;
  isOrphan: boolean;
}

interface GraphMetrics {
  totalFiles: number;
  totalLinks: number;
  orphanedFiles: number;
  averageLinkDensity: number;
  hubDocuments: Array<{ path: string; inboundLinks: number }>;
  clusters: number;
  weaklyConnected: number; // Files with <2 total links
  wellConnected: number;   // Files with 5+ total links
}

interface GraphReport {
  timestamp: string;
  baseDir: string;
  metrics: GraphMetrics;
  nodes: GraphNode[];
  orphans: string[];
  hubs: string[];
  recommendations: string[];
}

class GraphAnalyzer {
  private nodes: Map<string, GraphNode> = new Map();
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  /**
   * Find all markdown files recursively
   */
  private findMarkdownFiles(dir: string, files: string[] = []): string[] {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (!entry.startsWith('.') && entry !== 'node_modules') {
          this.findMarkdownFiles(fullPath, files);
        }
      } else if (entry.endsWith('.md')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Extract wikilinks from markdown content
   */
  private extractWikilinks(content: string): string[] {
    const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
    const links: string[] = [];
    let match;

    while ((match = wikilinkRegex.exec(content)) !== null) {
      // Handle [[link|alias]] format
      const link = match[1].split('|')[0].trim();
      links.push(link);
    }

    return links;
  }

  /**
   * Normalize wikilink to file path
   */
  private normalizeWikilink(wikilink: string, fromFile: string): string | null {
    // Remove .md extension if present
    const link = wikilink.replace(/\.md$/, '');

    // Try to find the file
    const possiblePaths = [
      // Absolute from base
      join(this.baseDir, `${link}.md`),
      // Relative to current file
      join(dirname(fromFile), `${link}.md`),
      // Search in common directories
      join(this.baseDir, 'docs', `${link}.md`),
      join(this.baseDir, '_planning', `${link}.md`),
    ];

    for (const path of possiblePaths) {
      try {
        if (statSync(path).isFile()) {
          return path;
        }
      } catch {
        // File doesn't exist, continue
      }
    }

    return null;
  }

  /**
   * Parse a markdown file and extract metadata
   */
  private parseFile(filePath: string): GraphNode {
    const content = readFileSync(filePath, 'utf-8');
    let frontmatter: any = {};
    let markdown = content;

    try {
      const parsed = matter(content);
      frontmatter = parsed.data;
      markdown = parsed.content;
    } catch (error) {
      // If frontmatter parsing fails (e.g., wikilinks in YAML), just use the full content
      console.error(`Warning: Could not parse frontmatter for ${filePath}: ${error}`);
    }

    const relativePath = relative(this.baseDir, filePath);
    const outboundLinks = this.extractWikilinks(markdown);

    return {
      path: filePath,
      relativePath,
      title: frontmatter.title || relativePath,
      tags: frontmatter.tags || [],
      outboundLinks,
      inboundLinks: [],
      linkCount: 0,
      isOrphan: false,
    };
  }

  /**
   * Build the complete graph
   */
  public buildGraph(): void {
    console.error('🔍 Scanning for markdown files...');
    const files = this.findMarkdownFiles(this.baseDir);
    console.error(`📄 Found ${files.length} files`);

    console.error('📊 Parsing files and extracting links...');
    // First pass: parse all files
    for (const file of files) {
      const node = this.parseFile(file);
      this.nodes.set(file, node);
    }

    console.error('🔗 Building link graph...');
    // Second pass: resolve outbound links to inbound links
    for (const [filePath, node] of this.nodes.entries()) {
      for (const wikilink of node.outboundLinks) {
        const targetPath = this.normalizeWikilink(wikilink, filePath);
        if (targetPath && this.nodes.has(targetPath)) {
          const targetNode = this.nodes.get(targetPath)!;
          targetNode.inboundLinks.push(filePath);
        }
      }
    }

    // Third pass: calculate metrics
    for (const node of this.nodes.values()) {
      node.linkCount = node.inboundLinks.length + node.outboundLinks.length;
      node.isOrphan = node.linkCount === 0;
    }

    console.error('✅ Graph built successfully');
  }

  /**
   * Calculate graph metrics
   */
  public calculateMetrics(): GraphMetrics {
    const nodes = Array.from(this.nodes.values());
    const totalFiles = nodes.length;
    const totalLinks = nodes.reduce((sum, n) => sum + n.outboundLinks.length, 0);
    const orphanedFiles = nodes.filter(n => n.isOrphan).length;
    const averageLinkDensity = totalFiles > 0 ? totalLinks / totalFiles : 0;

    // Find hub documents (high inbound links)
    const hubs = nodes
      .filter(n => n.inboundLinks.length > 10)
      .sort((a, b) => b.inboundLinks.length - a.inboundLinks.length)
      .slice(0, 10)
      .map(n => ({ path: n.relativePath, inboundLinks: n.inboundLinks.length }));

    const weaklyConnected = nodes.filter(n => n.linkCount > 0 && n.linkCount < 2).length;
    const wellConnected = nodes.filter(n => n.linkCount >= 5).length;

    // Calculate connected components (simplified)
    const clusters = this.countClusters();

    return {
      totalFiles,
      totalLinks,
      orphanedFiles,
      averageLinkDensity: Math.round(averageLinkDensity * 100) / 100,
      hubDocuments: hubs,
      clusters,
      weaklyConnected,
      wellConnected,
    };
  }

  /**
   * Count connected components using DFS
   */
  private countClusters(): number {
    const visited = new Set<string>();
    let clusterCount = 0;

    const dfs = (nodePath: string) => {
      if (visited.has(nodePath)) return;
      visited.add(nodePath);

      const node = this.nodes.get(nodePath);
      if (!node) return;

      // Visit all connected nodes
      for (const link of node.outboundLinks) {
        const targetPath = this.normalizeWikilink(link, nodePath);
        if (targetPath && this.nodes.has(targetPath)) {
          dfs(targetPath);
        }
      }

      for (const link of node.inboundLinks) {
        dfs(link);
      }
    };

    for (const nodePath of this.nodes.keys()) {
      if (!visited.has(nodePath)) {
        clusterCount++;
        dfs(nodePath);
      }
    }

    return clusterCount;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(metrics: GraphMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.orphanedFiles > 0) {
      recommendations.push(
        `🔴 CRITICAL: ${metrics.orphanedFiles} orphaned files with no connections. Run find-orphans.ts to identify them.`
      );
    }

    if (metrics.weaklyConnected > metrics.totalFiles * 0.3) {
      recommendations.push(
        `⚠️  WARNING: ${metrics.weaklyConnected} files have weak connectivity (<2 links). Consider adding more cross-references.`
      );
    }

    if (metrics.averageLinkDensity < 3) {
      recommendations.push(
        `📊 INFO: Average link density is ${metrics.averageLinkDensity}. Target: 5+ links per document for better connectivity.`
      );
    }

    if (metrics.clusters > 10) {
      recommendations.push(
        `🔀 INFO: ${metrics.clusters} disconnected clusters detected. Consider adding bridge documents to connect related topics.`
      );
    }

    if (metrics.hubDocuments.length > 0) {
      recommendations.push(
        `✅ GOOD: ${metrics.hubDocuments.length} hub documents identified. These are well-connected entry points.`
      );
    }

    return recommendations;
  }

  /**
   * Generate full report
   */
  public generateReport(): GraphReport {
    const metrics = this.calculateMetrics();
    const nodes = Array.from(this.nodes.values());

    return {
      timestamp: new Date().toISOString(),
      baseDir: this.baseDir,
      metrics,
      nodes: nodes.map(n => ({
        path: n.relativePath,
        relativePath: n.relativePath,
        title: n.title,
        tags: n.tags,
        outboundLinks: n.outboundLinks,
        inboundLinks: n.inboundLinks.map(p => relative(this.baseDir, p)),
        linkCount: n.linkCount,
        isOrphan: n.isOrphan,
      })),
      orphans: nodes.filter(n => n.isOrphan).map(n => n.relativePath),
      hubs: metrics.hubDocuments.map(h => h.path),
      recommendations: this.generateRecommendations(metrics),
    };
  }
}

// Main execution
async function main() {
  const baseDir = process.argv[2] || process.cwd();

  console.error(`🚀 Starting graph analysis for: ${baseDir}\n`);

  const analyzer = new GraphAnalyzer(baseDir);
  analyzer.buildGraph();

  const report = analyzer.generateReport();

  // Output JSON report to stdout
  console.log(JSON.stringify(report, null, 2));

  // Output summary to stderr
  console.error('\n📊 GRAPH ANALYSIS SUMMARY');
  console.error('='.repeat(50));
  console.error(`📄 Total files: ${report.metrics.totalFiles}`);
  console.error(`🔗 Total links: ${report.metrics.totalLinks}`);
  console.error(`📊 Average link density: ${report.metrics.averageLinkDensity} links/file`);
  console.error(`🔴 Orphaned files: ${report.metrics.orphanedFiles}`);
  console.error(`⚠️  Weakly connected: ${report.metrics.weaklyConnected}`);
  console.error(`✅ Well connected: ${report.metrics.wellConnected}`);
  console.error(`🔀 Clusters: ${report.metrics.clusters}`);
  console.error(`🌟 Hub documents: ${report.metrics.hubDocuments.length}`);
  console.error('\n💡 RECOMMENDATIONS:');
  report.recommendations.forEach(rec => console.error(`  ${rec}`));
  console.error('='.repeat(50));
}

main();
