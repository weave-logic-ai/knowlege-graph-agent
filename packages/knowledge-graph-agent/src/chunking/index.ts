/**
 * Document Chunking Module
 *
 * Provides intelligent document chunking for RAG and vector search.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Chunking strategy
 */
export type ChunkStrategy =
  | 'fixed'      // Fixed size chunks
  | 'sentence'   // Sentence-based chunks
  | 'paragraph'  // Paragraph-based chunks
  | 'semantic'   // Semantic-based chunks
  | 'markdown'   // Markdown structure-aware chunks
  | 'code';      // Code-aware chunks

/**
 * Chunking options
 */
export interface ChunkOptions {
  /** Chunking strategy */
  strategy: ChunkStrategy;
  /** Target chunk size in characters */
  chunkSize?: number;
  /** Overlap between chunks in characters */
  overlap?: number;
  /** Minimum chunk size */
  minChunkSize?: number;
  /** Maximum chunk size */
  maxChunkSize?: number;
  /** Include metadata in chunks */
  includeMetadata?: boolean;
  /** Preserve code blocks */
  preserveCodeBlocks?: boolean;
}

/**
 * Chunk metadata
 */
export interface ChunkMetadata {
  /** Source document path */
  source: string;
  /** Chunk index in document */
  index: number;
  /** Total chunks in document */
  total: number;
  /** Start position in original document */
  startPosition: number;
  /** End position in original document */
  endPosition: number;
  /** Heading hierarchy */
  headings?: string[];
  /** Code language (for code chunks) */
  language?: string;
}

/**
 * A single chunk
 */
export interface Chunk {
  /** Unique chunk ID */
  id: string;
  /** Chunk content */
  content: string;
  /** Chunk metadata */
  metadata: ChunkMetadata;
  /** Token count estimate */
  tokenCount?: number;
}

/**
 * Chunking result
 */
export interface ChunkResult {
  /** Generated chunks */
  chunks: Chunk[];
  /** Original document length */
  originalLength: number;
  /** Strategy used */
  strategy: ChunkStrategy;
  /** Processing time in milliseconds */
  processingTime: number;
}

// ============================================================================
// Chunker Implementation
// ============================================================================

/**
 * Document Chunker for splitting documents into chunks
 */
export class Chunker {
  private defaultOptions: ChunkOptions = {
    strategy: 'paragraph',
    chunkSize: 1000,
    overlap: 100,
    minChunkSize: 100,
    maxChunkSize: 2000,
    includeMetadata: true,
    preserveCodeBlocks: true,
  };

  constructor(options?: Partial<ChunkOptions>) {
    if (options) {
      this.defaultOptions = { ...this.defaultOptions, ...options };
    }
  }

  /**
   * Chunk a document
   */
  chunk(content: string, source: string, options?: Partial<ChunkOptions>): ChunkResult {
    const startTime = Date.now();
    const opts = { ...this.defaultOptions, ...options };

    let chunks: Chunk[];
    switch (opts.strategy) {
      case 'fixed':
        chunks = this.chunkFixed(content, source, opts);
        break;
      case 'sentence':
        chunks = this.chunkBySentence(content, source, opts);
        break;
      case 'paragraph':
        chunks = this.chunkByParagraph(content, source, opts);
        break;
      case 'markdown':
        chunks = this.chunkByMarkdown(content, source, opts);
        break;
      case 'code':
        chunks = this.chunkByCode(content, source, opts);
        break;
      case 'semantic':
        chunks = this.chunkSemantic(content, source, opts);
        break;
      default:
        chunks = this.chunkByParagraph(content, source, opts);
    }

    return {
      chunks,
      originalLength: content.length,
      strategy: opts.strategy,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Fixed-size chunking
   */
  private chunkFixed(content: string, source: string, opts: ChunkOptions): Chunk[] {
    const chunks: Chunk[] = [];
    const chunkSize = opts.chunkSize || 1000;
    const overlap = opts.overlap || 0;

    let position = 0;
    let index = 0;

    while (position < content.length) {
      const end = Math.min(position + chunkSize, content.length);
      const chunkContent = content.slice(position, end);

      chunks.push({
        id: `${source}-${index}`,
        content: chunkContent,
        metadata: {
          source,
          index,
          total: 0, // Will be updated after
          startPosition: position,
          endPosition: end,
        },
        tokenCount: this.estimateTokens(chunkContent),
      });

      position = end - overlap;
      index++;
    }

    // Update total count
    chunks.forEach((chunk) => {
      chunk.metadata.total = chunks.length;
    });

    return chunks;
  }

  /**
   * Sentence-based chunking
   */
  private chunkBySentence(content: string, source: string, opts: ChunkOptions): Chunk[] {
    const sentences = content.split(/(?<=[.!?])\s+/);
    return this.aggregateChunks(sentences, source, opts);
  }

  /**
   * Paragraph-based chunking
   */
  private chunkByParagraph(content: string, source: string, opts: ChunkOptions): Chunk[] {
    const paragraphs = content.split(/\n\n+/);
    return this.aggregateChunks(paragraphs, source, opts);
  }

  /**
   * Markdown-aware chunking
   */
  private chunkByMarkdown(content: string, source: string, opts: ChunkOptions): Chunk[] {
    const sections: string[] = [];
    const headings: string[][] = [];

    // Split by headers
    const headerRegex = /^(#{1,6})\s+(.+)$/gm;
    let lastIndex = 0;
    let currentHeadings: string[] = [];
    let match;

    while ((match = headerRegex.exec(content)) !== null) {
      if (lastIndex < match.index) {
        sections.push(content.slice(lastIndex, match.index).trim());
        headings.push([...currentHeadings]);
      }

      const level = match[1].length;
      const heading = match[2];

      // Update heading hierarchy
      currentHeadings = currentHeadings.slice(0, level - 1);
      currentHeadings[level - 1] = heading;

      lastIndex = match.index;
    }

    if (lastIndex < content.length) {
      sections.push(content.slice(lastIndex).trim());
      headings.push([...currentHeadings]);
    }

    return sections
      .filter((s) => s.length > 0)
      .map((section, index) => ({
        id: `${source}-${index}`,
        content: section,
        metadata: {
          source,
          index,
          total: sections.length,
          startPosition: 0,
          endPosition: section.length,
          headings: headings[index],
        },
        tokenCount: this.estimateTokens(section),
      }));
  }

  /**
   * Code-aware chunking
   */
  private chunkByCode(content: string, source: string, opts: ChunkOptions): Chunk[] {
    const chunks: Chunk[] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

    let lastIndex = 0;
    let index = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (lastIndex < match.index) {
        const textContent = content.slice(lastIndex, match.index).trim();
        if (textContent) {
          chunks.push({
            id: `${source}-${index}`,
            content: textContent,
            metadata: {
              source,
              index,
              total: 0,
              startPosition: lastIndex,
              endPosition: match.index,
            },
            tokenCount: this.estimateTokens(textContent),
          });
          index++;
        }
      }

      // Add code block
      const language = match[1] || 'unknown';
      const codeContent = match[2].trim();
      chunks.push({
        id: `${source}-${index}`,
        content: codeContent,
        metadata: {
          source,
          index,
          total: 0,
          startPosition: match.index,
          endPosition: match.index + match[0].length,
          language,
        },
        tokenCount: this.estimateTokens(codeContent),
      });
      index++;
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const textContent = content.slice(lastIndex).trim();
      if (textContent) {
        chunks.push({
          id: `${source}-${index}`,
          content: textContent,
          metadata: {
            source,
            index,
            total: 0,
            startPosition: lastIndex,
            endPosition: content.length,
          },
          tokenCount: this.estimateTokens(textContent),
        });
      }
    }

    // Update totals
    chunks.forEach((chunk) => {
      chunk.metadata.total = chunks.length;
    });

    return chunks;
  }

  /**
   * Semantic chunking (placeholder for more advanced implementation)
   */
  private chunkSemantic(content: string, source: string, opts: ChunkOptions): Chunk[] {
    // For now, fall back to paragraph chunking
    // Future: Use embeddings to find semantic boundaries
    return this.chunkByParagraph(content, source, opts);
  }

  /**
   * Aggregate small chunks into larger ones
   */
  private aggregateChunks(parts: string[], source: string, opts: ChunkOptions): Chunk[] {
    const chunks: Chunk[] = [];
    const chunkSize = opts.chunkSize || 1000;
    const minSize = opts.minChunkSize || 100;

    let currentContent = '';
    let index = 0;
    let startPos = 0;

    for (const part of parts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;

      if (currentContent.length + trimmedPart.length > chunkSize && currentContent.length >= minSize) {
        chunks.push({
          id: `${source}-${index}`,
          content: currentContent.trim(),
          metadata: {
            source,
            index,
            total: 0,
            startPosition: startPos,
            endPosition: startPos + currentContent.length,
          },
          tokenCount: this.estimateTokens(currentContent),
        });
        index++;
        startPos += currentContent.length;
        currentContent = trimmedPart;
      } else {
        currentContent += (currentContent ? '\n\n' : '') + trimmedPart;
      }
    }

    if (currentContent.trim()) {
      chunks.push({
        id: `${source}-${index}`,
        content: currentContent.trim(),
        metadata: {
          source,
          index,
          total: 0,
          startPosition: startPos,
          endPosition: startPos + currentContent.length,
        },
        tokenCount: this.estimateTokens(currentContent),
      });
    }

    chunks.forEach((chunk) => {
      chunk.metadata.total = chunks.length;
    });

    return chunks;
  }

  /**
   * Estimate token count
   */
  private estimateTokens(content: string): number {
    // Rough estimation: ~4 characters per token for English
    return Math.ceil(content.length / 4);
  }
}

/**
 * Create a new Chunker instance
 */
export function createChunker(options?: Partial<ChunkOptions>): Chunker {
  return new Chunker(options);
}

/**
 * Convenience function to chunk a document
 */
export function chunkDocument(
  content: string,
  source: string,
  options?: Partial<ChunkOptions>
): ChunkResult {
  const chunker = new Chunker(options);
  return chunker.chunk(content, source, options);
}
