#!/usr/bin/env tsx
/**
 * Orphan Detector
 * Finds all files with 0 connections and suggests hub documents to link to
 */

import { readFileSync } from 'fs';
import { join, dirname, basename } from 'path';

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
  metrics: {
    hubDocuments: Array<{ path: string; inboundLinks: number }>;
  };
  nodes: GraphNode[];
  orphans: string[];
}

interface OrphanGroup {
  directory: string;
  files: string[];
  suggestedHubs: string[];
  priority: 'high' | 'medium' | 'low';
}

interface OrphanReport {
  timestamp: string;
  totalOrphans: number;
  orphansByDirectory: OrphanGroup[];
  quickWins: string[]; // Orphans that are easy to connect
}

class OrphanDetector {
  private report: GraphReport;

  constructor(graphReportPath: string) {
    const content = readFileSync(graphReportPath, 'utf-8');
    this.report = JSON.parse(content);
  }

  /**
   * Group orphans by directory
   */
  private groupByDirectory(): Map<string, string[]> {
    const groups = new Map<string, string[]>();

    for (const orphanPath of this.report.orphans) {
      const dir = dirname(orphanPath);
      if (!groups.has(dir)) {
        groups.set(dir, []);
      }
      groups.get(dir)!.push(orphanPath);
    }

    return groups;
  }

  /**
   * Suggest hub documents based on path similarity and tags
   */
  private suggestHubs(orphanPath: string): string[] {
    const hubs = this.report.metrics.hubDocuments.map(h => h.path);
    const orphanDir = dirname(orphanPath);
    const orphanName = basename(orphanPath, '.md');

    // Get orphan node for tags
    const orphanNode = this.report.nodes.find(n => n.relativePath === orphanPath);
    const orphanTags = orphanNode?.tags || [];

    // Score each hub
    const scored = hubs.map(hub => {
      let score = 0;
      const hubDir = dirname(hub);
      const hubNode = this.report.nodes.find(n => n.relativePath === hub);

      // Same directory: +10 points
      if (hubDir === orphanDir) score += 10;

      // Parent directory: +5 points
      if (orphanDir.startsWith(hubDir)) score += 5;

      // Shared path components: +2 per component
      const orphanParts = orphanDir.split('/');
      const hubParts = hubDir.split('/');
      const sharedParts = orphanParts.filter(p => hubParts.includes(p));
      score += sharedParts.length * 2;

      // Shared tags: +3 per tag
      if (hubNode) {
        const sharedTags = orphanTags.filter(t => hubNode.tags.includes(t));
        score += sharedTags.length * 3;
      }

      // Name similarity (simple keyword match): +1 per match
      const orphanKeywords = orphanName.toLowerCase().split('-');
      const hubKeywords = hub.toLowerCase().split(/[-\/]/);
      const sharedKeywords = orphanKeywords.filter(k => hubKeywords.includes(k));
      score += sharedKeywords.length;

      return { hub, score };
    });

    // Sort by score and return top 3
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.hub);
  }

  /**
   * Determine priority for connecting an orphan
   */
  private calculatePriority(orphanPath: string, directory: string): 'high' | 'medium' | 'low' {
    // High priority: docs, planning, specs
    if (
      directory.includes('docs') ||
      directory.includes('_planning') ||
      directory.includes('specs')
    ) {
      return 'high';
    }

    // Medium priority: src, tests
    if (
      directory.includes('src') ||
      directory.includes('tests')
    ) {
      return 'medium';
    }

    // Low priority: everything else
    return 'low';
  }

  /**
   * Find "quick win" orphans - easy to connect
   */
  private findQuickWins(): string[] {
    const quickWins: string[] = [];

    for (const orphanPath of this.report.orphans) {
      const orphanNode = this.report.nodes.find(n => n.relativePath === orphanPath);
      if (!orphanNode) continue;

      // Quick win criteria:
      // 1. Has tags (easy to find related docs)
      // 2. In a well-known directory (docs, planning)
      // 3. Name suggests it's documentation

      const hasGoodTags = orphanNode.tags.length >= 2;
      const inGoodDir = orphanPath.includes('docs') || orphanPath.includes('_planning');
      const isDocumentation = orphanPath.toLowerCase().includes('readme') ||
                             orphanPath.toLowerCase().includes('guide') ||
                             orphanPath.toLowerCase().includes('overview');

      if ((hasGoodTags && inGoodDir) || isDocumentation) {
        quickWins.push(orphanPath);
      }
    }

    return quickWins;
  }

  /**
   * Generate orphan report
   */
  public generateReport(): OrphanReport {
    const groups = this.groupByDirectory();
    const orphansByDirectory: OrphanGroup[] = [];

    for (const [directory, files] of groups.entries()) {
      // Get suggested hubs for first file (representative)
      const suggestedHubs = files.length > 0 ? this.suggestHubs(files[0]) : [];
      const priority = this.calculatePriority(files[0], directory);

      orphansByDirectory.push({
        directory,
        files,
        suggestedHubs,
        priority,
      });
    }

    // Sort by priority (high -> medium -> low) and then by file count
    orphansByDirectory.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.files.length - a.files.length;
    });

    return {
      timestamp: new Date().toISOString(),
      totalOrphans: this.report.orphans.length,
      orphansByDirectory,
      quickWins: this.findQuickWins(),
    };
  }
}

// Main execution
async function main() {
  const reportPath = process.argv[2] || join(process.cwd(), 'report.json');

  console.error(`🔍 Analyzing orphans from: ${reportPath}\n`);

  const detector = new OrphanDetector(reportPath);
  const report = detector.generateReport();

  // Output JSON to stdout
  console.log(JSON.stringify(report, null, 2));

  // Output summary to stderr
  console.error('\n🔴 ORPHAN ANALYSIS SUMMARY');
  console.error('='.repeat(50));
  console.error(`📊 Total orphans: ${report.totalOrphans}`);
  console.error(`🚀 Quick wins: ${report.quickWins.length}`);
  console.error(`📁 Directories affected: ${report.orphansByDirectory.length}`);

  console.error('\n📋 ORPHANS BY DIRECTORY (PRIORITIZED):');
  for (const group of report.orphansByDirectory) {
    const priorityIcon = group.priority === 'high' ? '🔴' : group.priority === 'medium' ? '🟡' : '🟢';
    console.error(`\n${priorityIcon} ${group.directory} (${group.files.length} files, priority: ${group.priority})`);
    console.error(`   Files: ${group.files.slice(0, 3).join(', ')}${group.files.length > 3 ? '...' : ''}`);
    if (group.suggestedHubs.length > 0) {
      console.error(`   Suggested hubs: ${group.suggestedHubs.join(', ')}`);
    }
  }

  if (report.quickWins.length > 0) {
    console.error('\n🚀 QUICK WINS (Easy to connect):');
    report.quickWins.forEach(qw => console.error(`  - ${qw}`));
  }

  console.error('='.repeat(50));
}

main();
