#!/usr/bin/env tsx
/**
 * Connection Suggester
 * Analyzes orphans and suggests specific connections based on path, tags, and content
 */

import { readFileSync } from 'fs';
import { join, basename, dirname, extname } from 'path';
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

interface GraphReport {
  baseDir: string;
  nodes: GraphNode[];
  orphans: string[];
}

interface ConnectionSuggestion {
  orphanFile: string;
  suggestedConnections: Array<{
    targetFile: string;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
    score: number;
  }>;
  keywords: string[];
  tags: string[];
}

interface SuggestionReport {
  timestamp: string;
  totalOrphans: number;
  suggestions: ConnectionSuggestion[];
}

class ConnectionSuggester {
  private report: GraphReport;
  private baseDir: string;

  constructor(graphReportPath: string) {
    const content = readFileSync(graphReportPath, 'utf-8');
    this.report = JSON.parse(content);
    this.baseDir = this.report.baseDir;
  }

  /**
   * Extract keywords from file path and name
   */
  private extractPathKeywords(filePath: string): string[] {
    const parts = filePath.split('/');
    const keywords: string[] = [];

    for (const part of parts) {
      // Split on dashes, underscores, and camelCase
      const words = part
        .replace(/\.md$/, '')
        .split(/[-_]/)
        .flatMap(w => w.split(/(?=[A-Z])/))
        .map(w => w.toLowerCase())
        .filter(w => w.length > 2); // Filter out short words

      keywords.push(...words);
    }

    return [...new Set(keywords)]; // Deduplicate
  }

  /**
   * Extract keywords from content
   */
  private extractContentKeywords(filePath: string): string[] {
    try {
      const fullPath = join(this.baseDir, filePath);
      const content = readFileSync(fullPath, 'utf-8');
      const { content: markdown } = matter(content);

      // Extract headings and common technical terms
      const headingRegex = /^#{1,6}\s+(.+)$/gm;
      const keywords: string[] = [];
      let match;

      while ((match = headingRegex.exec(markdown)) !== null) {
        const heading = match[1].toLowerCase();
        keywords.push(...heading.split(/\s+/).filter(w => w.length > 3));
      }

      // Extract code blocks language hints
      const codeBlockRegex = /```(\w+)/g;
      while ((match = codeBlockRegex.exec(markdown)) !== null) {
        keywords.push(match[1]);
      }

      return [...new Set(keywords)];
    } catch (error) {
      return [];
    }
  }

  /**
   * Calculate similarity score between two sets of keywords
   */
  private calculateSimilarity(keywords1: string[], keywords2: string[]): number {
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);

    const intersection = [...set1].filter(k => set2.has(k)).length;
    const union = new Set([...set1, ...set2]).size;

    return union > 0 ? intersection / union : 0;
  }

  /**
   * Score a potential connection
   */
  private scoreConnection(orphan: GraphNode, candidate: GraphNode): {
    score: number;
    reasons: string[];
  } {
    let score = 0;
    const reasons: string[] = [];

    // 1. Same directory: +20 points
    const orphanDir = dirname(orphan.relativePath);
    const candidateDir = dirname(candidate.relativePath);
    if (orphanDir === candidateDir) {
      score += 20;
      reasons.push('Same directory');
    }

    // 2. Parent/child directory: +10 points
    if (orphanDir.startsWith(candidateDir) || candidateDir.startsWith(orphanDir)) {
      score += 10;
      reasons.push('Related directory structure');
    }

    // 3. Shared tags: +5 points per tag
    const sharedTags = orphan.tags.filter(t => candidate.tags.includes(t));
    if (sharedTags.length > 0) {
      score += sharedTags.length * 5;
      reasons.push(`Shared tags: ${sharedTags.join(', ')}`);
    }

    // 4. Path keyword similarity: +15 points max
    const orphanPathKeywords = this.extractPathKeywords(orphan.relativePath);
    const candidatePathKeywords = this.extractPathKeywords(candidate.relativePath);
    const pathSimilarity = this.calculateSimilarity(orphanPathKeywords, candidatePathKeywords);
    const pathScore = Math.round(pathSimilarity * 15);
    if (pathScore > 0) {
      score += pathScore;
      reasons.push(`Path similarity: ${Math.round(pathSimilarity * 100)}%`);
    }

    // 5. Content keyword similarity: +15 points max
    const orphanContentKeywords = this.extractContentKeywords(orphan.relativePath);
    const candidateContentKeywords = this.extractContentKeywords(candidate.relativePath);
    const contentSimilarity = this.calculateSimilarity(orphanContentKeywords, candidateContentKeywords);
    const contentScore = Math.round(contentSimilarity * 15);
    if (contentScore > 0) {
      score += contentScore;
      reasons.push(`Content similarity: ${Math.round(contentSimilarity * 100)}%`);
    }

    // 6. Well-connected candidate (hub): +10 points
    if (candidate.linkCount >= 10) {
      score += 10;
      reasons.push('Hub document (well-connected)');
    }

    // 7. Similar file naming pattern: +5 points
    const orphanName = basename(orphan.relativePath, '.md');
    const candidateName = basename(candidate.relativePath, '.md');
    if (orphanName.includes(candidateName) || candidateName.includes(orphanName)) {
      score += 5;
      reasons.push('Similar file names');
    }

    return { score, reasons };
  }

  /**
   * Suggest connections for an orphan
   */
  private suggestForOrphan(orphanPath: string): ConnectionSuggestion {
    const orphanNode = this.report.nodes.find(n => n.relativePath === orphanPath);
    if (!orphanNode) {
      return {
        orphanFile: orphanPath,
        suggestedConnections: [],
        keywords: [],
        tags: [],
      };
    }

    // Score all non-orphan nodes
    const candidates = this.report.nodes
      .filter(n => !n.isOrphan && n.relativePath !== orphanPath)
      .map(candidate => {
        const { score, reasons } = this.scoreConnection(orphanNode, candidate);
        return {
          targetFile: candidate.relativePath,
          reason: reasons.join('; '),
          score,
          confidence: score >= 30 ? 'high' as const : score >= 15 ? 'medium' as const : 'low' as const,
        };
      })
      .filter(c => c.score > 0) // Only include candidates with some score
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 suggestions

    return {
      orphanFile: orphanPath,
      suggestedConnections: candidates,
      keywords: this.extractPathKeywords(orphanPath),
      tags: orphanNode.tags,
    };
  }

  /**
   * Generate suggestions report
   */
  public generateReport(): SuggestionReport {
    const suggestions = this.report.orphans.map(orphan =>
      this.suggestForOrphan(orphan)
    );

    return {
      timestamp: new Date().toISOString(),
      totalOrphans: this.report.orphans.length,
      suggestions: suggestions.filter(s => s.suggestedConnections.length > 0),
    };
  }
}

// Main execution
async function main() {
  const reportPath = process.argv[2] || join(process.cwd(), 'report.json');

  console.error(`🔗 Generating connection suggestions from: ${reportPath}\n`);

  const suggester = new ConnectionSuggester(reportPath);
  const report = suggester.generateReport();

  // Output JSON to stdout
  console.log(JSON.stringify(report, null, 2));

  // Output summary to stderr
  console.error('\n🔗 CONNECTION SUGGESTIONS SUMMARY');
  console.error('='.repeat(50));
  console.error(`📊 Total orphans analyzed: ${report.totalOrphans}`);
  console.error(`✅ Orphans with suggestions: ${report.suggestions.length}`);
  console.error(`❌ Orphans without suggestions: ${report.totalOrphans - report.suggestions.length}`);

  // Show top suggestions
  const topSuggestions = report.suggestions
    .filter(s => s.suggestedConnections.length > 0)
    .sort((a, b) => b.suggestedConnections[0].score - a.suggestedConnections[0].score)
    .slice(0, 5);

  if (topSuggestions.length > 0) {
    console.error('\n🌟 TOP SUGGESTIONS (High Confidence):');
    for (const suggestion of topSuggestions) {
      console.error(`\n📄 ${suggestion.orphanFile}`);
      const topConnection = suggestion.suggestedConnections[0];
      console.error(`   → ${topConnection.targetFile}`);
      console.error(`   ${topConnection.confidence.toUpperCase()}: ${topConnection.reason}`);
      console.error(`   Score: ${topConnection.score}`);
    }
  }

  console.error('\n💡 RECOMMENDATIONS:');
  const highConfidence = report.suggestions.filter(s =>
    s.suggestedConnections.some(c => c.confidence === 'high')
  ).length;
  console.error(`  - ${highConfidence} orphans have high-confidence connections`);
  console.error(`  - Review suggestions.json for complete analysis`);
  console.error(`  - Start with high-confidence suggestions for quick wins`);
  console.error('='.repeat(50));
}

main();
