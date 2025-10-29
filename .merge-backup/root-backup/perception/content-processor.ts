/**
 * Content Processor - Normalize content to unified format
 *
 * Processes raw content from multiple sources into a standardized
 * format for storage and analysis.
 */

import type {
  ProcessedContent,
  PerceptionSource,
  ScraperResult,
  SearchItem,
  ContentStructure,
  ContentMetadata,
  ExtractedData,
  Heading,
  CodeBlock,
} from './types.js';

export class ContentProcessor {
  constructor(
    private config: {
      extractImages?: boolean;
      extractLinks?: boolean;
      maxContentLength?: number;
      preserveMarkdown?: boolean;
    } = {}
  ) {}

  /**
   * Process scraper result into unified format
   */
  processScraperResult(result: ScraperResult): PerceptionSource {
    const content = this.truncateContent(result.content);

    return {
      id: this.generateId(result.url),
      type: 'web-scrape',
      provider: 'playwright',
      url: result.url,
      title: result.title || this.extractTitleFromUrl(result.url),
      content,
      extractedAt: Date.now(),
      metadata: {
        wordCount: result.metadata.wordCount,
        contentType: result.metadata.contentType,
      },
      links: this.config.extractLinks ? result.links : undefined,
      images: this.config.extractImages ? result.images : undefined,
    };
  }

  /**
   * Process search result into unified format
   */
  processSearchResult(item: SearchItem, provider: string): PerceptionSource {
    return {
      id: this.generateId(item.url),
      type: 'search-result',
      provider,
      url: item.url,
      title: item.title,
      content: item.snippet,
      snippet: item.snippet,
      extractedAt: Date.now(),
      metadata: {
        publishedDate: item.publishedDate,
        wordCount: this.countWords(item.snippet),
      },
      relevanceScore: item.relevanceScore,
    };
  }

  /**
   * Process content into detailed structure
   */
  async processContent(content: string, url: string): Promise<ProcessedContent> {
    const structure = this.analyzeStructure(content);
    const metadata = this.extractMetadata(content);
    const extractedData = this.extractData(content);

    return {
      id: this.generateId(url),
      originalUrl: url,
      source: 'perception',
      title: this.extractTitle(content),
      content: this.truncateContent(content),
      structure,
      metadata,
      extractedData,
    };
  }

  /**
   * Analyze content structure
   */
  private analyzeStructure(content: string): ContentStructure {
    const headings = this.extractHeadings(content);
    const paragraphs = this.countParagraphs(content);
    const codeBlocks = this.extractCodeBlocks(content);
    const lists = this.extractLists(content);
    const tables = this.extractTables(content);

    return {
      headings,
      paragraphs,
      codeBlocks,
      lists,
      tables,
    };
  }

  /**
   * Extract headings from content
   */
  private extractHeadings(content: string): Heading[] {
    const headings: Heading[] = [];
    const lines = content.split('\n');

    lines.forEach(line => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim(),
          id: this.slugify(match[2]),
        });
      }
    });

    return headings;
  }

  /**
   * Extract code blocks from content
   */
  private extractCodeBlocks(content: string): CodeBlock[] {
    const codeBlocks: CodeBlock[] = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || undefined,
        code: match[2].trim(),
        lineCount: match[2].split('\n').length,
      });
    }

    return codeBlocks;
  }

  /**
   * Extract lists from content
   */
  private extractLists(content: string): any[] {
    const lists: any[] = [];
    const lines = content.split('\n');
    let currentList: { type: 'ordered' | 'unordered'; items: string[] } | null = null;

    lines.forEach(line => {
      const unordered = line.match(/^[\s]*[-*+]\s+(.+)$/);
      const ordered = line.match(/^[\s]*\d+\.\s+(.+)$/);

      if (unordered) {
        if (!currentList || currentList.type !== 'unordered') {
          if (currentList) lists.push(currentList);
          currentList = { type: 'unordered', items: [] };
        }
        currentList.items.push(unordered[1].trim());
      } else if (ordered) {
        if (!currentList || currentList.type !== 'ordered') {
          if (currentList) lists.push(currentList);
          currentList = { type: 'ordered', items: [] };
        }
        currentList.items.push(ordered[1].trim());
      } else if (currentList && line.trim() === '') {
        lists.push(currentList);
        currentList = null;
      }
    });

    if (currentList) lists.push(currentList);

    return lists;
  }

  /**
   * Extract tables from content
   */
  private extractTables(content: string): any[] {
    const tables: any[] = [];
    const lines = content.split('\n');
    let inTable = false;
    let currentTable: { headers: string[]; rows: string[][] } | null = null;

    lines.forEach((line, index) => {
      const cells = line.split('|').map(c => c.trim()).filter(c => c);

      if (cells.length > 0) {
        if (!inTable) {
          // Check if next line is separator
          const nextLine = lines[index + 1];
          if (nextLine && nextLine.match(/^\|?[\s\-|:]+\|?$/)) {
            currentTable = { headers: cells, rows: [] };
            inTable = true;
          }
        } else if (line.match(/^\|?[\s\-|:]+\|?$/)) {
          // Separator line, skip
        } else {
          currentTable?.rows.push(cells);
        }
      } else if (inTable) {
        if (currentTable) tables.push(currentTable);
        currentTable = null;
        inTable = false;
      }
    });

    if (currentTable) tables.push(currentTable);

    return tables;
  }

  /**
   * Extract metadata from content
   */
  private extractMetadata(content: string): ContentMetadata {
    const wordCount = this.countWords(content);
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
    const language = this.detectLanguage(content);
    const keywords = this.extractKeywords(content);

    return {
      wordCount,
      readingTime,
      language,
      keywords,
    };
  }

  /**
   * Extract data (links, images, references)
   */
  private extractData(content: string): ExtractedData {
    return {
      links: this.extractMarkdownLinks(content),
      images: this.extractMarkdownImages(content),
      references: this.extractReferences(content),
    };
  }

  /**
   * Extract markdown links
   */
  private extractMarkdownLinks(content: string): any[] {
    const links: any[] = [];
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      links.push({
        text: match[1],
        href: match[2],
      });
    }

    return links;
  }

  /**
   * Extract markdown images
   */
  private extractMarkdownImages(content: string): any[] {
    const images: any[] = [];
    const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      images.push({
        alt: match[1],
        src: match[2],
      });
    }

    return images;
  }

  /**
   * Extract references from content
   */
  private extractReferences(content: string): any[] {
    const references: any[] = [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let match;

    while ((match = urlRegex.exec(content)) !== null) {
      const url = match[1];
      references.push({
        text: url,
        url,
        type: this.classifyReferenceType(url),
      });
    }

    return references;
  }

  /**
   * Classify reference type based on URL
   */
  private classifyReferenceType(url: string): string {
    if (url.includes('github.com')) return 'code';
    if (url.includes('docs.') || url.includes('/docs/')) return 'documentation';
    if (url.includes('api.') || url.includes('/api/')) return 'api';
    return 'external';
  }

  /**
   * Extract title from content
   */
  private extractTitle(content: string): string {
    const firstLine = content.split('\n')[0];
    const match = firstLine.match(/^#\s+(.+)$/);
    return match ? match[1].trim() : firstLine.substring(0, 100);
  }

  /**
   * Extract title from URL
   */
  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.split('/').filter(p => p);
      return path[path.length - 1]?.replace(/[-_]/g, ' ') || urlObj.hostname;
    } catch {
      return url;
    }
  }

  /**
   * Count paragraphs
   */
  private countParagraphs(content: string): number {
    return content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
  }

  /**
   * Count words
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Detect language (simplified)
   */
  private detectLanguage(content: string): string {
    // Simple heuristic - can be enhanced with actual language detection library
    const hasNonAscii = /[^\x00-\x7F]/.test(content);
    return hasNonAscii ? 'multilingual' : 'en';
  }

  /**
   * Extract keywords (simplified)
   */
  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 4); // Only words longer than 4 chars

    const frequency = new Map<string, number>();
    words.forEach(word => {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    });

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Truncate content to max length
   */
  private truncateContent(content: string): string {
    const maxLength = this.config.maxContentLength ?? 50000;
    return content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content;
  }

  /**
   * Generate unique ID from URL
   */
  private generateId(url: string): string {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `perception_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Convert text to slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }
}
