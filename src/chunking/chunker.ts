/**
 * Text Chunker - Split large documents into manageable chunks
 *
 * Provides multiple chunking strategies for different content types:
 * - Fixed: Simple character-based chunking with overlap
 * - Semantic: Paragraph-based chunking respecting natural boundaries
 * - Markdown: Respects markdown structure (headers, sections)
 * - Code: Preserves code blocks and structure
 * - Adaptive: Auto-selects the best strategy based on content
 *
 * @module chunking/chunker
 */

import { createHash } from 'crypto';
import { createLogger } from '../utils/index.js';
import type {
  ChunkOptions,
  Chunk,
  ChunkMetadata,
  ChunkResult,
  ChunkerConfig,
} from './types.js';

const logger = createLogger('chunker');

/**
 * Default chunker configuration
 */
const DEFAULT_CONFIG: ChunkerConfig = {
  defaultStrategy: 'adaptive',
  defaultMaxSize: 2000,
  defaultOverlap: 50,
};

/**
 * Text Chunker class
 *
 * Splits documents into chunks using various strategies.
 * Maintains document structure and provides metadata for each chunk.
 */
export class Chunker {
  private config: ChunkerConfig;
  private defaultOptions: ChunkOptions;

  constructor(config: Partial<ChunkerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.defaultOptions = {
      strategy: this.config.defaultStrategy,
      maxSize: this.config.defaultMaxSize,
      minSize: 100,
      overlap: this.config.defaultOverlap,
      preserveStructure: true,
    };
  }

  /**
   * Chunk content using the specified or default strategy
   *
   * @param content - The content to chunk
   * @param options - Chunking options
   * @returns ChunkResult with all chunks and metadata
   */
  chunk(content: string, options?: Partial<ChunkOptions>): ChunkResult {
    const startTime = Date.now();
    const opts = { ...this.defaultOptions, ...options };

    if (!content || content.trim().length === 0) {
      logger.debug('Empty content provided, returning empty result');
      return {
        chunks: [],
        totalSize: 0,
        strategy: opts.strategy,
        processingTime: Date.now() - startTime,
      };
    }

    let chunks: Chunk[];

    switch (opts.strategy) {
      case 'fixed':
        chunks = this.chunkFixed(content, opts);
        break;
      case 'semantic':
        chunks = this.chunkSemantic(content, opts);
        break;
      case 'markdown':
        chunks = this.chunkMarkdown(content, opts);
        break;
      case 'code':
        chunks = this.chunkCode(content, opts);
        break;
      case 'adaptive':
        chunks = this.chunkAdaptive(content, opts);
        break;
      default:
        logger.warn(`Unknown strategy: ${opts.strategy}, falling back to fixed`);
        chunks = this.chunkFixed(content, opts);
    }

    const result: ChunkResult = {
      chunks,
      totalSize: content.length,
      strategy: opts.strategy,
      processingTime: Date.now() - startTime,
    };

    logger.debug(`Chunked content into ${chunks.length} chunks`, {
      strategy: opts.strategy,
      totalSize: content.length,
      processingTime: result.processingTime,
    });

    return result;
  }

  /**
   * Fixed-size chunking with optional overlap
   *
   * Simple character-based chunking. Best for uniform content
   * where structure doesn't matter.
   */
  private chunkFixed(content: string, opts: ChunkOptions): Chunk[] {
    const chunks: Chunk[] = [];
    let offset = 0;
    const minSize = opts.minSize || 0;
    const overlap = opts.overlap || 0;

    while (offset < content.length) {
      const endOffset = Math.min(offset + opts.maxSize, content.length);
      const chunkContent = content.slice(offset, endOffset);

      chunks.push(this.createChunk(chunkContent, offset, endOffset));

      // Move to next position with overlap
      offset = endOffset - overlap;

      // Avoid infinite loop for small remaining content
      if (offset >= content.length - minSize) {
        break;
      }
    }

    return chunks;
  }

  /**
   * Semantic chunking based on paragraph boundaries
   *
   * Respects natural paragraph breaks (double newlines).
   * Groups paragraphs until maxSize is reached.
   */
  private chunkSemantic(content: string, opts: ChunkOptions): Chunk[] {
    // Split on paragraph boundaries (double newlines)
    const paragraphs = content.split(/\n\n+/);
    const chunks: Chunk[] = [];
    let currentChunk = '';
    let startOffset = 0;
    let currentOffset = 0;
    const minSize = opts.minSize || 0;

    for (const para of paragraphs) {
      const paraWithSeparator = para + '\n\n';
      const newLength = currentChunk.length + paraWithSeparator.length;

      // Check if adding this paragraph would exceed maxSize
      if (newLength > opts.maxSize && currentChunk.length >= minSize) {
        // Save current chunk
        chunks.push(this.createChunk(currentChunk.trim(), startOffset, currentOffset));

        // Start new chunk
        currentChunk = '';
        startOffset = currentOffset;
      }

      currentChunk += paraWithSeparator;
      currentOffset += paraWithSeparator.length;
    }

    // Don't forget the last chunk
    if (currentChunk.trim()) {
      chunks.push(this.createChunk(currentChunk.trim(), startOffset, content.length));
    }

    return chunks;
  }

  /**
   * Markdown-aware chunking
   *
   * Respects markdown header structure. Each major section
   * becomes its own chunk when possible.
   */
  private chunkMarkdown(content: string, opts: ChunkOptions): Chunk[] {
    // Split on markdown headers (preserve the header in the match)
    const sections = content.split(/(?=^#{1,6}\s)/m);
    const chunks: Chunk[] = [];
    let offset = 0;

    for (const section of sections) {
      if (!section.trim()) {
        offset += section.length;
        continue;
      }

      // Detect header level
      const headerMatch = section.match(/^(#{1,6})\s/);
      const level = headerMatch ? headerMatch[1].length : undefined;

      if (section.length <= opts.maxSize) {
        // Section fits in one chunk
        const chunk = this.createChunk(section, offset, offset + section.length, 'header');
        if (level) {
          chunk.metadata.level = level;
        }
        chunks.push(chunk);
      } else {
        // Section too large, use semantic chunking for sub-sections
        const subChunks = this.chunkSemantic(section, opts);
        subChunks.forEach((c, i) => {
          c.startOffset += offset;
          c.endOffset += offset;
          // Mark first chunk as header if it starts with one
          if (i === 0 && headerMatch) {
            c.metadata.type = 'header';
            c.metadata.level = level;
          }
          chunks.push(c);
        });
      }

      offset += section.length;
    }

    return chunks;
  }

  /**
   * Code-aware chunking
   *
   * Preserves code blocks (fenced with ```) as atomic units.
   * Non-code sections are chunked semantically.
   */
  private chunkCode(content: string, opts: ChunkOptions): Chunk[] {
    // Match code blocks with their language specifier
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const chunks: Chunk[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Process text before the code block
      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index);
        if (textBefore.trim()) {
          const textChunks = this.chunkSemantic(textBefore, opts);
          textChunks.forEach((c) => {
            c.startOffset += lastIndex;
            c.endOffset += lastIndex;
            chunks.push(c);
          });
        }
      }

      // Process the code block
      const codeBlock = match[0];
      const language = match[1] || undefined;
      const codeChunk = this.createChunk(codeBlock, match.index, match.index + codeBlock.length, 'code');
      codeChunk.metadata.language = language;
      chunks.push(codeChunk);

      lastIndex = match.index + codeBlock.length;
    }

    // Process remaining text after last code block
    if (lastIndex < content.length) {
      const remaining = content.slice(lastIndex);
      if (remaining.trim()) {
        const remainingChunks = this.chunkSemantic(remaining, opts);
        remainingChunks.forEach((c) => {
          c.startOffset += lastIndex;
          c.endOffset += lastIndex;
          chunks.push(c);
        });
      }
    }

    // If no code blocks found, fall back to semantic
    if (chunks.length === 0) {
      return this.chunkSemantic(content, opts);
    }

    return chunks;
  }

  /**
   * Adaptive chunking - auto-selects best strategy
   *
   * Analyzes content to determine the best chunking strategy:
   * - Code blocks present -> code strategy
   * - Markdown headers present -> markdown strategy
   * - Default -> semantic strategy
   */
  private chunkAdaptive(content: string, opts: ChunkOptions): Chunk[] {
    const hasCodeBlocks = /```[\w]*\n/.test(content);
    const hasHeaders = /^#{1,6}\s/m.test(content);

    if (hasCodeBlocks) {
      logger.debug('Adaptive: detected code blocks, using code strategy');
      return this.chunkCode(content, opts);
    }

    if (hasHeaders) {
      logger.debug('Adaptive: detected markdown headers, using markdown strategy');
      return this.chunkMarkdown(content, opts);
    }

    logger.debug('Adaptive: using semantic strategy');
    return this.chunkSemantic(content, opts);
  }

  /**
   * Create a chunk object with metadata
   */
  private createChunk(
    content: string,
    start: number,
    end: number,
    type?: ChunkMetadata['type']
  ): Chunk {
    // Generate deterministic ID from content
    const id = createHash('sha256').update(content).digest('hex').slice(0, 12);

    // Calculate metadata
    const words = content.split(/\s+/).filter(Boolean);
    const lines = content.split('\n');

    // Detect links (wiki-style [[link]] or markdown [text](url))
    const hasWikiLinks = /\[\[.+?\]\]/.test(content);
    const hasMarkdownLinks = /\[.+?\]\(.+?\)/.test(content);

    return {
      id,
      content,
      startOffset: start,
      endOffset: end,
      metadata: {
        type: type || this.detectType(content),
        wordCount: words.length,
        lineCount: lines.length,
        hasLinks: hasWikiLinks || hasMarkdownLinks,
      },
    };
  }

  /**
   * Detect content type from the content itself
   */
  private detectType(content: string): ChunkMetadata['type'] {
    // Check for header
    if (/^#{1,6}\s/.test(content)) {
      return 'header';
    }

    // Check for list items
    if (/^[-*+]\s|^\d+\.\s/m.test(content)) {
      return 'list';
    }

    // Check for code block
    if (/```/.test(content)) {
      return 'code';
    }

    // Check for mixed content (multiple types)
    const hasMultipleTypes =
      (/^#{1,6}\s/m.test(content) && /\n\n/.test(content)) ||
      (/```/.test(content) && /\n\n/.test(content));

    if (hasMultipleTypes) {
      return 'mixed';
    }

    return 'paragraph';
  }

  /**
   * Get the current configuration
   */
  getConfig(): ChunkerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<ChunkerConfig>): void {
    this.config = { ...this.config, ...config };
    this.defaultOptions = {
      ...this.defaultOptions,
      strategy: this.config.defaultStrategy,
      maxSize: this.config.defaultMaxSize,
      overlap: this.config.defaultOverlap,
    };
  }
}

/**
 * Create a new Chunker instance with optional configuration
 */
export function createChunker(config?: Partial<ChunkerConfig>): Chunker {
  return new Chunker(config);
}

/**
 * Convenience function to chunk a document without creating a Chunker instance
 */
export function chunkDocument(content: string, options?: Partial<ChunkOptions>): ChunkResult {
  const chunker = new Chunker();
  return chunker.chunk(content, options);
}
