/**
 * Perception System
 * Gathers context from past experiences, vault notes, and external sources
 */

import type {
  Task,
  Context,
  Experience,
  Note,
  ExternalKnowledge,
  PerceptionInput,
  PerceptionOutput,
  PerceptionError,
} from './types';

interface ClaudeFlowClient {
  memory_search: (params: any) => Promise<any[]>;
  memory_usage: (params: any) => Promise<any>;
}

interface ShadowCache {
  queryFiles: (params: any) => Promise<any[]>;
  getFileContent: (path: string) => Promise<string>;
}

interface WebFetchTool {
  fetch: (url: string) => Promise<string>;
  search: (query: string) => Promise<any[]>;
}

/**
 * Perception System
 * Implements multi-source information gathering and context fusion
 */
export class PerceptionSystem {
  constructor(
    private claudeFlow: ClaudeFlowClient,
    private shadowCache: ShadowCache,
    private webFetch?: WebFetchTool
  ) {}

  /**
   * Main perception method - gathers all context for a task
   */
  async perceive(input: PerceptionInput): Promise<PerceptionOutput> {
    const { task, maxExperiences = 10, maxNotes = 20, includeExternalKnowledge = false } = input;

    try {
      // Parallel perception from all sources
      const [experiences, relatedNotes, externalKnowledge] = await Promise.all([
        this.searchExperiences(task, maxExperiences),
        this.semanticSearch(task, maxNotes),
        includeExternalKnowledge ? this.gatherExternalKnowledge(task) : Promise.resolve([]),
      ]);

      // Fuse all sources into unified context
      const context = this.fuseContext(task, experiences, relatedNotes, externalKnowledge);

      // Calculate confidence based on source quality
      const confidence = this.calculatePerceptionConfidence(experiences, relatedNotes, externalKnowledge);

      return {
        context,
        confidence,
        sources: [
          { type: 'experience', count: experiences.length, quality: this.assessQuality(experiences) },
          { type: 'note', count: relatedNotes.length, quality: this.assessQuality(relatedNotes) },
          { type: 'external', count: externalKnowledge.length, quality: this.assessQuality(externalKnowledge) },
        ],
      };
    } catch (error) {
      throw new (PerceptionError as any)(
        `Failed to perceive context for task: ${error.message}`,
        { task, error }
      );
    }
  }

  /**
   * Search for relevant past experiences using MCP memory
   */
  private async searchExperiences(task: Task, limit: number): Promise<Experience[]> {
    try {
      // Use Claude-Flow memory search
      const results = await this.claudeFlow.memory_search({
        pattern: task.description,
        namespace: 'weaver_experiences',
        limit,
      });

      // Parse and filter experiences
      return results
        .map((r) => {
          try {
            return JSON.parse(r.value) as Experience;
          } catch {
            return null;
          }
        })
        .filter((exp): exp is Experience => exp !== null && this.isRelevant(exp, task));
    } catch (error) {
      console.warn(`Experience search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Semantic search in vault using shadow cache
   */
  private async semanticSearch(task: Task, limit: number): Promise<Note[]> {
    try {
      // Extract search terms from task
      const searchTerms = this.extractSearchTerms(task);

      // Query shadow cache with FTS5 search
      const files = await this.shadowCache.queryFiles({
        search: searchTerms.join(' '),
        tags: task.domain ? [task.domain] : undefined,
        limit,
      });

      // Load file contents and parse
      const notes = await Promise.all(
        files.map(async (file) => {
          try {
            const content = await this.shadowCache.getFileContent(file.path);
            return this.parseNote(file.path, content);
          } catch {
            return null;
          }
        })
      );

      return notes.filter((note): note is Note => note !== null);
    } catch (error) {
      console.warn(`Semantic search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Gather external knowledge (web search, APIs)
   */
  private async gatherExternalKnowledge(task: Task): Promise<ExternalKnowledge[]> {
    if (!this.webFetch) {
      return [];
    }

    try {
      const query = this.buildSearchQuery(task);
      const results = await this.webFetch.search(query);

      return results.slice(0, 3).map((result) => ({
        source: result.source || 'web',
        content: result.content || result.snippet,
        url: result.url,
        confidence: result.score || 0.5,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn(`External knowledge gathering failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fuse all perception sources into unified context
   */
  private fuseContext(
    task: Task,
    experiences: Experience[],
    relatedNotes: Note[],
    externalKnowledge: ExternalKnowledge[]
  ): Context {
    return {
      task,
      pastExperiences: this.rankExperiences(experiences, task),
      relatedNotes: this.rankNotes(relatedNotes, task),
      externalKnowledge: externalKnowledge.length > 0 ? externalKnowledge : undefined,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate perception confidence based on source quality
   */
  private calculatePerceptionConfidence(
    experiences: Experience[],
    notes: Note[],
    external: ExternalKnowledge[]
  ): number {
    const expWeight = 0.5;
    const noteWeight = 0.3;
    const extWeight = 0.2;

    const expScore = experiences.length > 0 ? Math.min(experiences.length / 5, 1.0) : 0;
    const noteScore = notes.length > 0 ? Math.min(notes.length / 10, 1.0) : 0;
    const extScore = external.length > 0 ? Math.min(external.length / 3, 1.0) : 0;

    return expScore * expWeight + noteScore * noteWeight + extScore * extWeight;
  }

  /**
   * Assess quality of perception sources
   */
  private assessQuality(items: any[]): number {
    if (items.length === 0) return 0;

    // Calculate quality based on relevance, recency, and completeness
    const qualityScores = items.map((item) => {
      let score = 0.5; // Base score

      // Recency bonus (if timestamp available)
      if (item.timestamp) {
        const daysSince = (Date.now() - item.timestamp) / (1000 * 60 * 60 * 24);
        score += Math.max(0, (30 - daysSince) / 30) * 0.3;
      }

      // Relevance bonus (if score available)
      if (item.relevanceScore) {
        score += item.relevanceScore * 0.2;
      }

      return Math.min(score, 1.0);
    });

    return qualityScores.reduce((sum, s) => sum + s, 0) / qualityScores.length;
  }

  /**
   * Check if experience is relevant to task
   */
  private isRelevant(experience: Experience, task: Task): boolean {
    // Domain match
    if (experience.domain && task.domain && experience.domain !== task.domain) {
      return false;
    }

    // Task description similarity (basic keyword matching)
    const expWords = new Set(experience.task.description.toLowerCase().split(/\s+/));
    const taskWords = task.description.toLowerCase().split(/\s+/);
    const overlap = taskWords.filter((w) => expWords.has(w)).length;
    const similarity = overlap / Math.max(expWords.size, taskWords.length);

    return similarity >= 0.2; // 20% keyword overlap threshold
  }

  /**
   * Extract search terms from task
   */
  private extractSearchTerms(task: Task): string[] {
    const words = task.description.toLowerCase().split(/\s+/);

    // Remove common stop words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'to', 'in', 'on', 'at']);
    const terms = words.filter((w) => !stopWords.has(w) && w.length > 2);

    // Add domain as search term
    if (task.domain) {
      terms.push(task.domain);
    }

    return terms;
  }

  /**
   * Parse note from file content
   */
  private parseNote(path: string, content: string): Note {
    // Basic markdown parsing (frontmatter, tags, links)
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    const frontmatter = frontmatterMatch ? this.parseFrontmatter(frontmatterMatch[1]) : {};

    const tags = this.extractTags(content);
    const links = this.extractLinks(content);

    return {
      path,
      content,
      tags,
      links,
      frontmatter,
    };
  }

  /**
   * Parse YAML frontmatter
   */
  private parseFrontmatter(yaml: string): Record<string, any> {
    const result: Record<string, any> = {};

    yaml.split('\n').forEach((line) => {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        result[match[1]] = match[2];
      }
    });

    return result;
  }

  /**
   * Extract tags from markdown content
   */
  private extractTags(content: string): string[] {
    const tagPattern = /#(\w+)/g;
    const matches = content.matchAll(tagPattern);
    return Array.from(matches, (m) => m[1]);
  }

  /**
   * Extract wikilinks from markdown content
   */
  private extractLinks(content: string): string[] {
    const linkPattern = /\[\[([^\]]+)\]\]/g;
    const matches = content.matchAll(linkPattern);
    return Array.from(matches, (m) => m[1]);
  }

  /**
   * Rank experiences by relevance to task
   */
  private rankExperiences(experiences: Experience[], task: Task): Experience[] {
    return experiences
      .map((exp) => ({
        ...exp,
        relevanceScore: this.calculateRelevance(exp, task),
      }))
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  /**
   * Rank notes by relevance to task
   */
  private rankNotes(notes: Note[], task: Task): Note[] {
    return notes
      .map((note) => ({
        ...note,
        relevanceScore: this.calculateNoteRelevance(note, task),
      }))
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  /**
   * Calculate experience relevance score
   */
  private calculateRelevance(experience: Experience, task: Task): number {
    let score = 0;

    // Domain match
    if (experience.domain === task.domain) {
      score += 0.4;
    }

    // Success bonus
    if (experience.success) {
      score += 0.2;
    }

    // Recency bonus
    const daysSince = (Date.now() - experience.timestamp) / (1000 * 60 * 60 * 24);
    score += Math.max(0, (30 - daysSince) / 30) * 0.2;

    // Description similarity
    const similarity = this.calculateTextSimilarity(experience.task.description, task.description);
    score += similarity * 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate note relevance score
   */
  private calculateNoteRelevance(note: Note, task: Task): number {
    let score = 0;

    // Tag overlap
    if (task.domain && note.tags.includes(task.domain)) {
      score += 0.3;
    }

    // Content similarity
    const similarity = this.calculateTextSimilarity(note.content, task.description);
    score += similarity * 0.7;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate text similarity (basic keyword overlap)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Build search query for external knowledge
   */
  private buildSearchQuery(task: Task): string {
    const terms = this.extractSearchTerms(task);
    return terms.join(' ');
  }
}
