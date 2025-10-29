/**
 * Graph Analyzer - Core Analysis Engine
 * Analyzes markdown knowledge base structure and connectivity
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, relative, basename, dirname } from 'path';
import matter from 'gray-matter';
import type {
  GraphNode,
  GraphEdge,
  GraphMetrics,
  AnalysisResult,
  MetadataIndex,
  ClusterInfo,
  Frontmatter,
} from './types.js';

export class GraphAnalyzer {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];
  private metadataIndex: MetadataIndex = {
    byTag: new Map(),
    byCategory: new Map(),
    byDate: new Map(),
    byWordCount: new Map(),
  };

  constructor(private rootPath: string) {}

  /**
   * Analyze entire knowledge base
   */
  async analyze(): Promise<AnalysisResult> {
    console.log('🔍 Starting knowledge graph analysis...');
    const startTime = Date.now();

    // Discover and parse all markdown files
    await this.discoverFiles(this.rootPath);
    console.log(`📄 Discovered ${this.nodes.size} markdown files`);

    // Extract connections
    await this.extractConnections();
    console.log(`🔗 Found ${this.edges.length} explicit connections`);

    // Build metadata index
    this.buildMetadataIndex();
    console.log(`🏷️  Indexed metadata`);

    // Calculate metrics
    const metrics = this.calculateMetrics();
    console.log(`📊 Calculated graph metrics`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Analysis complete in ${duration}s`);

    return {
      metrics,
      nodes: this.nodes,
      edges: this.edges,
      suggestions: [], // Will be populated by link-suggester
      orphanedFiles: this.findOrphanedFiles(),
      hubFiles: this.findHubFiles(),
      timestamp: new Date(),
    };
  }

  /**
   * Recursively discover all markdown files
   */
  private async discoverFiles(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      // Skip node_modules, .git, etc.
      if (this.shouldSkip(entry.name)) continue;

      if (entry.isDirectory()) {
        await this.discoverFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        await this.parseFile(fullPath);
      }
    }
  }

  /**
   * Parse individual markdown file
   */
  private async parseFile(filePath: string): Promise<void> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const { data: frontmatter, content: markdownContent } = matter(content);
      const stats = await stat(filePath);

      const relativePath = relative(this.rootPath, filePath);
      const node: GraphNode = {
        id: relativePath,
        path: filePath,
        filename: basename(filePath),
        content: markdownContent,
        frontmatter: frontmatter as Frontmatter,
        outgoingLinks: [],
        incomingLinks: [],
        wordCount: this.countWords(markdownContent),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      };

      this.nodes.set(relativePath, node);
    } catch (error) {
      console.warn(`⚠️  Failed to parse ${filePath}:`, error);
    }
  }

  /**
   * Extract wikilinks and create edges
   */
  private async extractConnections(): Promise<void> {
    const wikilinkRegex = /\[\[([^\]]+)\]\]/g;

    for (const [nodeId, node] of Array.from(this.nodes.entries())) {
      const matches = Array.from(node.content.matchAll(wikilinkRegex));

      for (const match of matches) {
        const linkText = match[1];
        const targetFile = this.resolveWikilink(linkText, nodeId);

        if (targetFile && this.nodes.has(targetFile)) {
          node.outgoingLinks.push(targetFile);
          const targetNode = this.nodes.get(targetFile);
          if (targetNode) {
            targetNode.incomingLinks.push(nodeId);
          }

          this.edges.push({
            source: nodeId,
            target: targetFile,
            weight: 1.0,
            type: 'explicit',
          });
        }
      }
    }
  }

  /**
   * Resolve wikilink to actual file path
   */
  private resolveWikilink(linkText: string, sourceFile: string): string | null {
    // Handle [[file|alias]] syntax
    const parts = linkText.split('|');
    const targetName = parts[0].trim();

    // Try exact match first
    for (const [nodeId, node] of Array.from(this.nodes.entries())) {
      const baseName = basename(node.filename, '.md');
      if (baseName === targetName || node.filename === targetName) {
        return nodeId;
      }

      // Check aliases in frontmatter
      if (node.frontmatter.aliases?.includes(targetName)) {
        return nodeId;
      }
    }

    // Try relative path resolution
    const sourceDir = dirname(sourceFile);
    const possiblePath = join(sourceDir, `${targetName}.md`);
    if (this.nodes.has(possiblePath)) {
      return possiblePath;
    }

    return null;
  }

  /**
   * Build metadata index for fast lookups
   */
  private buildMetadataIndex(): void {
    for (const [nodeId, node] of Array.from(this.nodes.entries())) {
      // Index by tags
      if (node.frontmatter.tags) {
        for (const tag of node.frontmatter.tags) {
          if (!this.metadataIndex.byTag.has(tag)) {
            this.metadataIndex.byTag.set(tag, []);
          }
          this.metadataIndex.byTag.get(tag)!.push(nodeId);
        }
      }

      // Index by category
      if (node.frontmatter.category) {
        const category = node.frontmatter.category;
        if (!this.metadataIndex.byCategory.has(category)) {
          this.metadataIndex.byCategory.set(category, []);
        }
        this.metadataIndex.byCategory.get(category)!.push(nodeId);
      }

      // Index by date
      if (node.frontmatter.date) {
        const date = node.frontmatter.date;
        if (!this.metadataIndex.byDate.has(date)) {
          this.metadataIndex.byDate.set(date, []);
        }
        this.metadataIndex.byDate.get(date)!.push(nodeId);
      }

      // Index by word count range
      const bucket = this.getWordCountBucket(node.wordCount);
      if (!this.metadataIndex.byWordCount.has(bucket)) {
        this.metadataIndex.byWordCount.set(bucket, []);
      }
      this.metadataIndex.byWordCount.get(bucket)!.push(nodeId);
    }
  }

  /**
   * Calculate comprehensive graph metrics
   */
  private calculateMetrics(): GraphMetrics {
    const totalNodes = this.nodes.size;
    const totalEdges = this.edges.length;

    // Count connected vs disconnected nodes
    const connectedNodes = new Set<string>();
    for (const edge of this.edges) {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    }

    const disconnectedNodes = totalNodes - connectedNodes.size;

    // Find orphaned nodes (no incoming or outgoing links)
    let orphanedNodes = 0;
    for (const node of Array.from(this.nodes.values())) {
      if (node.incomingLinks.length === 0 && node.outgoingLinks.length === 0) {
        orphanedNodes++;
      }
    }

    // Calculate average degree
    const nodeArray = Array.from(this.nodes.values());
    const degrees = nodeArray.map(
      (n) => n.incomingLinks.length + n.outgoingLinks.length
    );
    const averageDegree = degrees.reduce((a, b) => a + b, 0) / totalNodes;

    // Calculate density
    const maxEdges = totalNodes * (totalNodes - 1);
    const density = maxEdges > 0 ? totalEdges / maxEdges : 0;

    // Find largest connected component
    const largestComponentSize = this.findLargestComponent();

    // Estimate clusters using simple connected components
    const clusters = this.countClusters();

    return {
      totalNodes,
      totalEdges,
      connectedNodes: connectedNodes.size,
      disconnectedNodes,
      orphanedNodes,
      averageDegree,
      density,
      clusters,
      largestComponentSize,
    };
  }

  /**
   * Find largest connected component size
   */
  private findLargestComponent(): number {
    const visited = new Set<string>();
    let largestSize = 0;

    const dfs = (nodeId: string, component: Set<string>): void => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      component.add(nodeId);

      const node = this.nodes.get(nodeId);
      if (!node) return;

      for (const neighbor of [...node.incomingLinks, ...node.outgoingLinks]) {
        dfs(neighbor, component);
      }
    };

    for (const nodeId of Array.from(this.nodes.keys())) {
      if (!visited.has(nodeId)) {
        const component = new Set<string>();
        dfs(nodeId, component);
        largestSize = Math.max(largestSize, component.size);
      }
    }

    return largestSize;
  }

  /**
   * Count number of connected components (clusters)
   */
  private countClusters(): number {
    const visited = new Set<string>();
    let clusterCount = 0;

    const dfs = (nodeId: string): void => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = this.nodes.get(nodeId);
      if (!node) return;

      for (const neighbor of [...node.incomingLinks, ...node.outgoingLinks]) {
        dfs(neighbor);
      }
    };

    for (const nodeId of Array.from(this.nodes.keys())) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
        clusterCount++;
      }
    }

    return clusterCount;
  }

  /**
   * Find files with no connections
   */
  private findOrphanedFiles(): string[] {
    const orphaned: string[] = [];
    for (const [nodeId, node] of Array.from(this.nodes.entries())) {
      if (node.incomingLinks.length === 0 && node.outgoingLinks.length === 0) {
        orphaned.push(nodeId);
      }
    }
    return orphaned.sort();
  }

  /**
   * Find highly connected hub files
   */
  private findHubFiles(topN = 20): Array<{ path: string; degree: number }> {
    const hubs = Array.from(this.nodes.entries())
      .map(([path, node]) => ({
        path,
        degree: node.incomingLinks.length + node.outgoingLinks.length,
      }))
      .filter((h) => h.degree > 0)
      .sort((a, b) => b.degree - a.degree)
      .slice(0, topN);

    return hubs;
  }

  /**
   * Get metadata index for use by suggester
   */
  getMetadataIndex(): MetadataIndex {
    return this.metadataIndex;
  }

  /**
   * Get all nodes
   */
  getNodes(): Map<string, GraphNode> {
    return this.nodes;
  }

  /**
   * Get all edges
   */
  getEdges(): GraphEdge[] {
    return this.edges;
  }

  // Utility methods

  private shouldSkip(name: string): boolean {
    const skipPatterns = [
      'node_modules',
      '.git',
      '.DS_Store',
      'dist',
      'build',
      '.cache',
      '.graph-data',
    ];
    return skipPatterns.some((pattern) => name.includes(pattern));
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter((w) => w.length > 0).length;
  }

  private getWordCountBucket(count: number): string {
    if (count < 100) return '0-100';
    if (count < 500) return '100-500';
    if (count < 1000) return '500-1000';
    if (count < 2000) return '1000-2000';
    return '2000+';
  }
}
