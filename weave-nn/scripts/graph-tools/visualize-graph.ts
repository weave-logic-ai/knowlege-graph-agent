#!/usr/bin/env tsx
/**
 * Graph Visualizer
 * Generates Mermaid diagram of knowledge graph with color-coded connectivity
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, basename, dirname } from 'path';

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

interface GraphReport {
  baseDir: string;
  metrics: {
    hubDocuments: Array<{ path: string; inboundLinks: number }>;
  };
  nodes: GraphNode[];
  orphans: string[];
}

class GraphVisualizer {
  private report: GraphReport;

  constructor(graphReportPath: string) {
    const content = readFileSync(graphReportPath, 'utf-8');
    this.report = JSON.parse(content);
  }

  /**
   * Sanitize node ID for Mermaid
   */
  private sanitizeNodeId(path: string): string {
    return path
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/^_+/, '')
      .replace(/_+$/, '');
  }

  /**
   * Get node label (shortened path or title)
   */
  private getNodeLabel(node: GraphNode): string {
    const name = basename(node.relativePath, '.md');
    const dir = basename(dirname(node.relativePath));
    return dir !== '.' ? `${dir}/${name}` : name;
  }

  /**
   * Determine node color based on connectivity
   */
  private getNodeColor(node: GraphNode): string {
    if (node.isOrphan) return 'fill:#ff4444,stroke:#cc0000,color:#fff'; // Red
    if (node.linkCount < 2) return 'fill:#ffaa00,stroke:#cc8800,color:#000'; // Yellow
    if (node.linkCount >= 10) return 'fill:#4444ff,stroke:#0000cc,color:#fff'; // Blue (hub)
    if (node.linkCount >= 5) return 'fill:#44ff44,stroke:#00cc00,color:#000'; // Green
    return 'fill:#aaaaaa,stroke:#888888,color:#000'; // Gray (moderate)
  }

  /**
   * Generate cluster-based visualization
   */
  private generateClusterView(): string {
    const lines: string[] = [];
    lines.push('```mermaid');
    lines.push('graph TD');
    lines.push('');

    // Group nodes by directory
    const byDirectory = new Map<string, GraphNode[]>();
    for (const node of this.report.nodes) {
      const dir = dirname(node.relativePath);
      if (!byDirectory.has(dir)) {
        byDirectory.set(dir, []);
      }
      byDirectory.get(dir)!.push(node);
    }

    // Limit to top directories by node count
    const topDirs = Array.from(byDirectory.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10);

    let nodeCounter = 0;
    const nodeMap = new Map<string, string>();

    for (const [dir, nodes] of topDirs) {
      const dirId = this.sanitizeNodeId(dir);
      lines.push(`  subgraph ${dirId}["📁 ${basename(dir) || 'root'}"]`);

      // Limit nodes per directory for readability
      const limitedNodes = nodes.slice(0, 15);

      for (const node of limitedNodes) {
        const nodeId = `node${nodeCounter++}`;
        nodeMap.set(node.relativePath, nodeId);
        const label = this.getNodeLabel(node);
        const color = this.getNodeColor(node);

        lines.push(`    ${nodeId}["${label}"]`);
        lines.push(`    style ${nodeId} ${color}`);
      }

      if (nodes.length > 15) {
        lines.push(`    more${dirId}["... ${nodes.length - 15} more files"]`);
        lines.push(`    style more${dirId} fill:#f0f0f0,stroke:#ccc`);
      }

      lines.push('  end');
      lines.push('');
    }

    // Add connections (limited for readability)
    lines.push('  %% Key connections');
    let connectionCount = 0;
    const maxConnections = 50;

    for (const node of this.report.nodes) {
      if (connectionCount >= maxConnections) break;
      if (!nodeMap.has(node.relativePath)) continue;

      const sourceId = nodeMap.get(node.relativePath)!;

      for (const outbound of node.outboundLinks.slice(0, 3)) {
        const targetNode = this.report.nodes.find(n =>
          n.outboundLinks.includes(outbound) || n.relativePath === outbound
        );
        if (targetNode && nodeMap.has(targetNode.relativePath)) {
          const targetId = nodeMap.get(targetNode.relativePath)!;
          lines.push(`  ${sourceId} --> ${targetId}`);
          connectionCount++;
        }
      }
    }

    lines.push('```');
    return lines.join('\n');
  }

  /**
   * Generate hub-focused visualization
   */
  private generateHubView(): string {
    const lines: string[] = [];
    lines.push('```mermaid');
    lines.push('graph LR');
    lines.push('');

    // Get hub documents
    const hubs = this.report.metrics.hubDocuments.slice(0, 5);
    const hubPaths = new Set(hubs.map(h => h.path));

    // Create hub nodes
    lines.push('  %% Hub Documents');
    const nodeMap = new Map<string, string>();

    hubs.forEach((hub, idx) => {
      const nodeId = `hub${idx}`;
      const hubNode = this.report.nodes.find(n => n.relativePath === hub.path);
      if (hubNode) {
        nodeMap.set(hub.path, nodeId);
        const label = this.getNodeLabel(hubNode);
        lines.push(`  ${nodeId}["🌟 ${label}<br/>(${hub.inboundLinks} links)"]`);
        lines.push(`  style ${nodeId} fill:#4444ff,stroke:#0000cc,color:#fff`);
      }
    });

    lines.push('');
    lines.push('  %% Connected Documents');

    // Show top connected documents to each hub
    let connectedIdx = 0;
    for (const hub of hubs) {
      const hubNode = this.report.nodes.find(n => n.relativePath === hub.path);
      if (!hubNode) continue;

      const hubId = nodeMap.get(hub.path)!;
      const connected = hubNode.inboundLinks.slice(0, 5);

      for (const connectedPath of connected) {
        const connectedNode = this.report.nodes.find(n =>
          n.relativePath === connectedPath || n.path === connectedPath
        );
        if (!connectedNode) continue;

        const connId = `conn${connectedIdx++}`;
        nodeMap.set(connectedNode.relativePath, connId);
        const label = this.getNodeLabel(connectedNode);
        const color = this.getNodeColor(connectedNode);

        lines.push(`  ${connId}["${label}"]`);
        lines.push(`  style ${connId} ${color}`);
        lines.push(`  ${connId} --> ${hubId}`);
      }
    }

    lines.push('```');
    return lines.join('\n');
  }

  /**
   * Generate orphan-focused visualization
   */
  private generateOrphanView(): string {
    const lines: string[] = [];
    lines.push('```mermaid');
    lines.push('graph TD');
    lines.push('');

    // Show orphans by directory
    const orphanNodes = this.report.nodes.filter(n => n.isOrphan).slice(0, 20);
    const byDir = new Map<string, GraphNode[]>();

    for (const node of orphanNodes) {
      const dir = dirname(node.relativePath);
      if (!byDir.has(dir)) {
        byDir.set(dir, []);
      }
      byDir.get(dir)!.push(node);
    }

    let idx = 0;
    for (const [dir, nodes] of byDir.entries()) {
      const dirId = this.sanitizeNodeId(dir);
      lines.push(`  subgraph ${dirId}["📁 ${basename(dir) || 'root'}"]`);

      for (const node of nodes) {
        const nodeId = `orphan${idx++}`;
        const label = this.getNodeLabel(node);
        lines.push(`    ${nodeId}["🔴 ${label}"]`);
        lines.push(`    style ${nodeId} fill:#ff4444,stroke:#cc0000,color:#fff`);
      }

      lines.push('  end');
    }

    if (this.report.orphans.length > 20) {
      lines.push(`  more["... ${this.report.orphans.length - 20} more orphans"]`);
      lines.push(`  style more fill:#f0f0f0,stroke:#ccc`);
    }

    lines.push('```');
    return lines.join('\n');
  }

  /**
   * Generate legend
   */
  private generateLegend(): string {
    return `
## Legend

- 🔴 **Red**: Orphaned files (0 connections)
- 🟡 **Yellow**: Weakly connected (<2 total links)
- **Gray**: Moderately connected (2-4 links)
- 🟢 **Green**: Well connected (5-9 links)
- 🔵 **Blue**: Hub documents (10+ inbound links)
`;
  }

  /**
   * Generate complete visualization document
   */
  public generateVisualization(): string {
    const sections: string[] = [];

    sections.push('# Knowledge Graph Visualization');
    sections.push('');
    sections.push(`Generated: ${new Date().toISOString()}`);
    sections.push('');
    sections.push('## Summary');
    sections.push('');
    sections.push(`- **Total Files**: ${this.report.nodes.length}`);
    sections.push(`- **Total Links**: ${this.report.nodes.reduce((sum, n) => sum + n.outboundLinks.length, 0)}`);
    sections.push(`- **Orphaned Files**: ${this.report.orphans.length}`);
    sections.push(`- **Hub Documents**: ${this.report.metrics.hubDocuments.length}`);
    sections.push('');

    sections.push(this.generateLegend());
    sections.push('');

    sections.push('## Hub Documents View');
    sections.push('');
    sections.push('This view shows the main hub documents and their key connections.');
    sections.push('');
    sections.push(this.generateHubView());
    sections.push('');

    sections.push('## Directory Cluster View');
    sections.push('');
    sections.push('This view shows documents grouped by directory with key interconnections.');
    sections.push('');
    sections.push(this.generateClusterView());
    sections.push('');

    if (this.report.orphans.length > 0) {
      sections.push('## Orphaned Files View');
      sections.push('');
      sections.push('🔴 These files have no connections and need to be integrated into the graph.');
      sections.push('');
      sections.push(this.generateOrphanView());
      sections.push('');
    }

    return sections.join('\n');
  }
}

// Main execution
async function main() {
  const reportPath = process.argv[2] || join(process.cwd(), 'report.json');
  const outputPath = process.argv[3] || join(process.cwd(), 'weave-nn/docs/GRAPH-VISUALIZATION.md');

  console.error(`📊 Generating graph visualization from: ${reportPath}\n`);

  const visualizer = new GraphVisualizer(reportPath);
  const markdown = visualizer.generateVisualization();

  // Write to file
  writeFileSync(outputPath, markdown);

  console.error('\n✅ VISUALIZATION GENERATED');
  console.error('='.repeat(50));
  console.error(`📄 Output: ${outputPath}`);
  console.error(`📊 Document size: ${markdown.length} bytes`);
  console.error('\n💡 Open the file in a Markdown viewer that supports Mermaid diagrams');
  console.error('='.repeat(50));

  // Also output to stdout
  console.log(markdown);
}

main();
