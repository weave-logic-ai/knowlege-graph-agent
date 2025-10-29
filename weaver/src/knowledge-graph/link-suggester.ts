/**
 * Link Suggester - AI-Powered Connection Suggestion Engine
 * Analyzes content and metadata to suggest meaningful wikilink connections
 */

import type {
  GraphNode,
  ConnectionSuggestion,
  MetadataIndex,
  SimilarityScore,
} from './types.js';

export class LinkSuggester {
  private nodes: Map<string, GraphNode>;
  private metadataIndex: MetadataIndex;

  constructor(nodes: Map<string, GraphNode>, metadataIndex: MetadataIndex) {
    this.nodes = nodes;
    this.metadataIndex = metadataIndex;
  }

  /**
   * Generate connection suggestions for all files
   */
  async generateSuggestions(
    maxSuggestionsPerFile = 5,
    minScore = 5.0
  ): Promise<ConnectionSuggestion[]> {
    console.log('🤖 Generating connection suggestions...');
    const startTime = Date.now();

    const suggestions: ConnectionSuggestion[] = [];
    const processedPairs = new Set<string>();

    for (const [nodeId, node] of Array.from(this.nodes.entries())) {
      // Skip if file already has many connections
      const totalConnections =
        node.incomingLinks.length + node.outgoingLinks.length;
      if (totalConnections > 20) continue;

      const fileSuggestions = await this.suggestForFile(
        nodeId,
        node,
        maxSuggestionsPerFile,
        minScore,
        processedPairs
      );
      suggestions.push(...fileSuggestions);
    }

    // Sort by score and deduplicate
    const uniqueSuggestions = this.deduplicateSuggestions(suggestions);
    const sorted = uniqueSuggestions.sort((a, b) => b.score - a.score);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Generated ${sorted.length} suggestions in ${duration}s`);

    return sorted;
  }

  /**
   * Generate suggestions for a single file
   */
  private async suggestForFile(
    nodeId: string,
    node: GraphNode,
    maxSuggestions: number,
    minScore: number,
    processedPairs: Set<string>
  ): Promise<ConnectionSuggestion[]> {
    const suggestions: ConnectionSuggestion[] = [];
    const candidates = this.findCandidates(nodeId, node);

    for (const candidateId of Array.from(candidates)) {
      // Skip if already connected
      if (node.outgoingLinks.includes(candidateId)) continue;
      if (node.incomingLinks.includes(candidateId)) continue;

      // Skip if pair already processed
      const pairKey = this.getPairKey(nodeId, candidateId);
      if (processedPairs.has(pairKey)) continue;

      const candidate = this.nodes.get(candidateId);
      if (!candidate) continue;

      const suggestion = this.scoreSuggestion(nodeId, node, candidateId, candidate);

      if (suggestion.score >= minScore) {
        suggestions.push(suggestion);
        processedPairs.add(pairKey);
      }
    }

    return suggestions.sort((a, b) => b.score - a.score).slice(0, maxSuggestions);
  }

  /**
   * Find candidate files for connection
   */
  private findCandidates(nodeId: string, node: GraphNode): Set<string> {
    const candidates = new Set<string>();

    // Add files with shared tags
    if (node.frontmatter.tags) {
      for (const tag of node.frontmatter.tags) {
        const tagged = this.metadataIndex.byTag.get(tag) || [];
        tagged.forEach((id) => {
          if (id !== nodeId) candidates.add(id);
        });
      }
    }

    // Add files in same category
    if (node.frontmatter.category) {
      const categorized =
        this.metadataIndex.byCategory.get(node.frontmatter.category) || [];
      categorized.forEach((id) => {
        if (id !== nodeId) candidates.add(id);
      });
    }

    // Add files with similar paths (same directory or parent)
    const nodePath = nodeId.split('/');
    for (const [otherId] of Array.from(this.nodes.entries())) {
      if (otherId === nodeId) continue;
      const otherPath = otherId.split('/');

      // Same directory
      if (nodePath.slice(0, -1).join('/') === otherPath.slice(0, -1).join('/')) {
        candidates.add(otherId);
      }

      // Parent/child relationship
      if (
        nodePath.slice(0, -1).join('/').startsWith(otherPath.slice(0, -1).join('/')) ||
        otherPath.slice(0, -1).join('/').startsWith(nodePath.slice(0, -1).join('/'))
      ) {
        candidates.add(otherId);
      }
    }

    // Add files with textual similarity (using simple keyword matching)
    const keywords = this.extractKeywords(node.content);
    for (const [otherId, otherNode] of Array.from(this.nodes.entries())) {
      if (otherId === nodeId) continue;
      const otherKeywords = this.extractKeywords(otherNode.content);
      const overlap = keywords.filter((k) => otherKeywords.includes(k));
      if (overlap.length >= 3) {
        candidates.add(otherId);
      }
    }

    return candidates;
  }

  /**
   * Score a potential connection
   */
  private scoreSuggestion(
    sourceId: string,
    sourceNode: GraphNode,
    targetId: string,
    targetNode: GraphNode
  ): ConnectionSuggestion {
    let score = 0;
    let reason = '';
    const metadata: ConnectionSuggestion['metadata'] = {};

    // Shared tags (highest weight)
    const sharedTags = this.getSharedTags(sourceNode, targetNode);
    if (sharedTags.length > 0) {
      score += sharedTags.length * 2.5;
      metadata.sharedTags = sharedTags;
      reason += `Shared tags: ${sharedTags.join(', ')}. `;
    }

    // Same category (high weight)
    if (
      sourceNode.frontmatter.category &&
      sourceNode.frontmatter.category === targetNode.frontmatter.category
    ) {
      score += 3.0;
      metadata.sharedCategories = [sourceNode.frontmatter.category];
      reason += `Same category: ${sourceNode.frontmatter.category}. `;
    }

    // Path proximity (medium weight)
    const pathSimilarity = this.calculatePathSimilarity(sourceId, targetId);
    if (pathSimilarity > 0.5) {
      score += pathSimilarity * 2.0;
      reason += `Related location (${(pathSimilarity * 100).toFixed(0)}% similar path). `;
    }

    // Content similarity (medium weight)
    const contentSimilarity = this.calculateContentSimilarity(sourceNode, targetNode);
    if (contentSimilarity > 0.3) {
      score += contentSimilarity * 2.5;
      metadata.semanticSimilarity = contentSimilarity;
      reason += `Similar content (${(contentSimilarity * 100).toFixed(0)}% match). `;
    }

    // Word count similarity (low weight - prefer connecting similar-sized docs)
    const wordCountSimilarity = this.calculateWordCountSimilarity(
      sourceNode.wordCount,
      targetNode.wordCount
    );
    if (wordCountSimilarity > 0.7) {
      score += 0.5;
    }

    // Temporal proximity (low weight)
    if (sourceNode.frontmatter.date && targetNode.frontmatter.date) {
      const temporal = this.calculateTemporalProximity(
        sourceNode.frontmatter.date,
        targetNode.frontmatter.date
      );
      if (temporal > 0.8) {
        score += 0.5;
        reason += `Created around same time. `;
      }
    }

    // Boost for orphaned files
    const sourceIsOrphaned =
      sourceNode.incomingLinks.length === 0 && sourceNode.outgoingLinks.length === 0;
    const targetIsOrphaned =
      targetNode.incomingLinks.length === 0 && targetNode.outgoingLinks.length === 0;
    if (sourceIsOrphaned || targetIsOrphaned) {
      score += 1.5;
      reason += 'Reconnects orphaned file. ';
    }

    // Determine if bidirectional
    const bidirectional = score >= 7.0 || sharedTags.length >= 2;

    return {
      sourceFile: sourceId,
      targetFile: targetId,
      score: Math.round(score * 10) / 10,
      reason: reason.trim() || 'Related content',
      bidirectional,
      metadata,
    };
  }

  /**
   * Calculate Jaccard similarity between tag sets
   */
  private getSharedTags(nodeA: GraphNode, nodeB: GraphNode): string[] {
    const tagsA = new Set(nodeA.frontmatter.tags || []);
    const tagsB = new Set(nodeB.frontmatter.tags || []);
    return Array.from(tagsA).filter((tag) => tagsB.has(tag));
  }

  /**
   * Calculate path similarity (shared directory structure)
   */
  private calculatePathSimilarity(pathA: string, pathB: string): number {
    const partsA = pathA.split('/');
    const partsB = pathB.split('/');
    let shared = 0;

    const minLen = Math.min(partsA.length, partsB.length);
    for (let i = 0; i < minLen; i++) {
      if (partsA[i] === partsB[i]) {
        shared++;
      } else {
        break;
      }
    }

    return shared / Math.max(partsA.length, partsB.length);
  }

  /**
   * Calculate content similarity using keyword overlap
   */
  private calculateContentSimilarity(nodeA: GraphNode, nodeB: GraphNode): number {
    const keywordsA = this.extractKeywords(nodeA.content);
    const keywordsB = this.extractKeywords(nodeB.content);

    if (keywordsA.length === 0 || keywordsB.length === 0) return 0;

    const setA = new Set(keywordsA);
    const setB = new Set(keywordsB);
    const intersection = Array.from(setA).filter((k) => setB.has(k)).length;
    const union = new Set([...keywordsA, ...keywordsB]).size;

    return union > 0 ? intersection / union : 0;
  }

  /**
   * Extract important keywords from content
   */
  private extractKeywords(content: string, topN = 20): string[] {
    const stopwords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'as',
      'is',
      'was',
      'are',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'should',
      'could',
      'can',
      'may',
      'might',
      'this',
      'that',
      'these',
      'those',
      'it',
      'its',
      'their',
      'them',
      'they',
    ]);

    const words = content
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopwords.has(w));

    // Count frequency
    const frequency = new Map<string, number>();
    for (const word of words) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }

    // Return top N by frequency
    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map((e) => e[0]);
  }

  /**
   * Calculate word count similarity
   */
  private calculateWordCountSimilarity(countA: number, countB: number): number {
    const min = Math.min(countA, countB);
    const max = Math.max(countA, countB);
    return max > 0 ? min / max : 0;
  }

  /**
   * Calculate temporal proximity (closer dates = higher score)
   */
  private calculateTemporalProximity(dateA: string, dateB: string): number {
    try {
      const timeA = new Date(dateA).getTime();
      const timeB = new Date(dateB).getTime();
      const diffDays = Math.abs(timeA - timeB) / (1000 * 60 * 60 * 24);

      // Exponential decay: same day = 1.0, 30 days = ~0.5, 90 days = ~0.1
      return Math.exp(-diffDays / 30);
    } catch {
      return 0;
    }
  }

  /**
   * Deduplicate suggestions (remove reverse duplicates)
   */
  private deduplicateSuggestions(
    suggestions: ConnectionSuggestion[]
  ): ConnectionSuggestion[] {
    const seen = new Set<string>();
    const unique: ConnectionSuggestion[] = [];

    for (const suggestion of suggestions) {
      const key = this.getPairKey(suggestion.sourceFile, suggestion.targetFile);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(suggestion);
      }
    }

    return unique;
  }

  /**
   * Get unique key for file pair
   */
  private getPairKey(fileA: string, fileB: string): string {
    return [fileA, fileB].sort().join('|||');
  }

  /**
   * Get top N suggestions
   */
  getTopSuggestions(
    suggestions: ConnectionSuggestion[],
    n = 100
  ): ConnectionSuggestion[] {
    return suggestions.slice(0, n);
  }

  /**
   * Get suggestions for specific file
   */
  getSuggestionsForFile(
    suggestions: ConnectionSuggestion[],
    filePath: string
  ): ConnectionSuggestion[] {
    return suggestions.filter(
      (s) => s.sourceFile === filePath || s.targetFile === filePath
    );
  }
}
