/**
 * Auto-Linking Rule - Automatically create wikilinks to other notes
 *
 * Triggers: Note updated
 * Condition: Content length > 200 characters
 * Action: Detect phrases matching note titles, create wikilinks
 *
 * @category Agent Rules
 */

import type { ClaudeClient } from '../claude-client.js';
import { PromptBuilder } from '../prompt-builder.js';

export interface AutoLinkRuleConfig {
  /**
   * Claude client instance for ambiguous mention resolution
   */
  claudeClient: ClaudeClient;

  /**
   * Minimum content length to trigger linking (default: 200)
   */
  minContentLength?: number;

  /**
   * Fuzzy match threshold (0-1, default: 0.8)
   */
  matchThreshold?: number;

  /**
   * Maximum number of links to create per note (default: 10)
   */
  maxLinks?: number;

  /**
   * Function to get available note titles from shadow cache
   */
  getNoteTitle: (query: string) => Promise<string[]>;
}

export interface DetectedMention {
  phrase: string;
  noteTitle: string;
  confidence: number;
  position: { start: number; end: number };
}

export interface AutoLinkResult {
  success: boolean;
  linksCreated?: number;
  updatedContent?: string;
  mentions?: DetectedMention[];
  error?: string;
}

/**
 * Auto-Linking Rule Implementation
 */
export class AutoLinkRule {
  private client: ClaudeClient;
  private minContentLength: number;
  private matchThreshold: number;
  private maxLinks: number;
  private getNoteTitle: (query: string) => Promise<string[]>;

  constructor(config: AutoLinkRuleConfig) {
    this.client = config.claudeClient;
    this.minContentLength = config.minContentLength ?? 200;
    this.matchThreshold = config.matchThreshold ?? 0.8;
    this.maxLinks = config.maxLinks ?? 10;
    this.getNoteTitle = config.getNoteTitle;
  }

  /**
   * Check if the rule should trigger
   */
  shouldTrigger(content: string): boolean {
    // Remove frontmatter and existing links for accurate content length check
    const cleanContent = content
      .replace(/^---[\s\S]*?---/m, '')
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
      .trim();

    return cleanContent.length >= this.minContentLength;
  }

  /**
   * Execute the auto-linking rule
   */
  async execute(content: string): Promise<AutoLinkResult> {
    try {
      if (!this.shouldTrigger(content)) {
        return {
          success: false,
          error: 'Content too short to trigger auto-linking'
        };
      }

      // Detect potential mentions
      const mentions = await this.detectMentions(content);

      if (mentions.length === 0) {
        return {
          success: true,
          linksCreated: 0,
          updatedContent: content,
          mentions: []
        };
      }

      // Filter out mentions with zero confidence (rejected by Claude)
      const validMentions = mentions.filter(m => m.confidence > 0);

      if (validMentions.length === 0) {
        return {
          success: true,
          linksCreated: 0,
          updatedContent: content,
          mentions: []
        };
      }

      // Create wikilinks (only first mention of each note)
      const updatedContent = this.createWikilinks(content, validMentions);

      return {
        success: true,
        linksCreated: validMentions.length,
        updatedContent,
        mentions: validMentions
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Detect mentions of other notes in the content
   */
  private async detectMentions(content: string): Promise<DetectedMention[]> {
    const mentions: DetectedMention[] = [];

    // Extract potential note references (noun phrases, proper nouns)
    const candidates = this.extractCandidatePhrases(content);

    for (const candidate of candidates.slice(0, 20)) {
      // Limit to 20 candidates to avoid too many API calls
      // Search shadow cache for matching note titles
      const matchingTitles = await this.getNoteTitle(candidate.phrase);

      for (const title of matchingTitles) {
        const confidence = this.calculateSimilarity(candidate.phrase, title);

        if (confidence >= this.matchThreshold) {
          mentions.push({
            phrase: candidate.phrase,
            noteTitle: title,
            confidence,
            position: candidate.position
          });
          break; // Only match to one note
        }
      }

      // Stop if we've found enough links
      if (mentions.length >= this.maxLinks) {
        break;
      }
    }

    // If ambiguous, ask Claude
    const ambiguousMentions = mentions.filter(m => m.confidence < 0.95);
    if (ambiguousMentions.length > 0) {
      await this.resolveAmbiguousMentions(content, ambiguousMentions);
    }

    return mentions;
  }

  /**
   * Extract candidate phrases from content
   */
  private extractCandidatePhrases(content: string): Array<{ phrase: string; position: { start: number; end: number } }> {
    const candidates: Array<{ phrase: string; position: { start: number; end: number } }> = [];

    // Remove existing wikilinks to avoid double-linking
    const cleanContent = content.replace(/\[\[([^\]]+)\]\]/g, '$1');

    // Extract 2-5 word phrases (potential note titles)
    const phraseRegex = /\b([A-Z][a-z]+(?:\s+[A-Za-z]+){1,4})\b/g;
    let match;

    while ((match = phraseRegex.exec(cleanContent)) !== null) {
      const phrase = match[1];
      if (phrase !== undefined) {
        candidates.push({
          phrase,
          position: { start: match.index, end: match.index + phrase.length }
        });
      }
    }

    return candidates;
  }

  /**
   * Calculate similarity between two strings (simple Levenshtein-based)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;

    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    return 1 - distance / maxLength;
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    const row0 = matrix[0];
    if (row0) {
      for (let j = 0; j <= str1.length; j++) {
        row0[j] = j;
      }
    }

    for (let i = 1; i <= str2.length; i++) {
      const currentRow = matrix[i];
      const prevRow = matrix[i - 1];
      if (!currentRow || !prevRow) continue;

      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          currentRow[j] = prevRow[j - 1] ?? 0;
        } else {
          currentRow[j] = Math.min(
            (prevRow[j - 1] ?? 0) + 1, // substitution
            (currentRow[j - 1] ?? 0) + 1,     // insertion
            (prevRow[j] ?? 0) + 1      // deletion
          );
        }
      }
    }

    const lastRow = matrix[str2.length];
    return lastRow?.[str1.length] ?? 0;
  }

  /**
   * Resolve ambiguous mentions using Claude
   */
  private async resolveAmbiguousMentions(
    content: string,
    mentions: DetectedMention[]
  ): Promise<void> {
    if (mentions.length === 0) return;

    const prompt = new PromptBuilder()
      .system('You are helping to identify which mentions in a note should be linked to which note titles.')
      .user(`Content snippet: ${content.substring(0, 500)}...

Ambiguous mentions:
${mentions.map(m => `- "${m.phrase}" → candidate: "${m.noteTitle}" (confidence: ${m.confidence})`).join('\n')}

For each mention, respond with "yes" if it should be linked to the candidate, "no" if not. Return JSON:
{
  "decisions": [true, false, ...]
}`)
      .expectJSON()
      .build();

    const response = await this.client.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
      maxTokens: 200
    });

    if (response.success && response.data) {
      const data = response.data as { decisions?: boolean[] };
      if (Array.isArray(data.decisions)) {
        // Remove mentions that Claude rejected
        data.decisions.forEach((keep, index) => {
          if (!keep && mentions[index]) {
            mentions[index].confidence = 0; // Mark for removal
          }
        });
      }
    }
  }

  /**
   * Create wikilinks in content (first mention only)
   */
  private createWikilinks(content: string, mentions: DetectedMention[]): string {
    let updatedContent = content;
    const linkedNotes = new Set<string>();

    // Sort mentions by position (descending) to avoid offset issues
    const sortedMentions = [...mentions]
      .filter(m => m.confidence > 0)
      .sort((a, b) => b.position.start - a.position.start);

    for (const mention of sortedMentions) {
      // Only link first occurrence of each note
      if (linkedNotes.has(mention.noteTitle)) {
        continue;
      }

      // Check if already a wikilink
      const before = updatedContent.substring(Math.max(0, mention.position.start - 2), mention.position.start);
      const after = updatedContent.substring(mention.position.end, mention.position.end + 2);

      if (before === '[[' || after === ']]') {
        continue;
      }

      // Replace phrase with wikilink
      const wikilink = `[[${mention.noteTitle}]]`;
      updatedContent =
        updatedContent.substring(0, mention.position.start) +
        wikilink +
        updatedContent.substring(mention.position.end);

      linkedNotes.add(mention.noteTitle);
    }

    return updatedContent;
  }

  /**
   * Get rule configuration
   */
  getConfig(): Readonly<{
    minContentLength: number;
    matchThreshold: number;
    maxLinks: number;
  }> {
    return {
      minContentLength: this.minContentLength,
      matchThreshold: this.matchThreshold,
      maxLinks: this.maxLinks
    };
  }
}

/**
 * Create an auto-linking rule instance
 */
export function createAutoLinkRule(config: AutoLinkRuleConfig): AutoLinkRule {
  return new AutoLinkRule(config);
}
