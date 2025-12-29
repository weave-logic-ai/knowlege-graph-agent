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
import type { ChunkOptions, ChunkResult, ChunkerConfig } from './types.js';
/**
 * Text Chunker class
 *
 * Splits documents into chunks using various strategies.
 * Maintains document structure and provides metadata for each chunk.
 */
export declare class Chunker {
    private config;
    private defaultOptions;
    constructor(config?: Partial<ChunkerConfig>);
    /**
     * Chunk content using the specified or default strategy
     *
     * @param content - The content to chunk
     * @param options - Chunking options
     * @returns ChunkResult with all chunks and metadata
     */
    chunk(content: string, options?: Partial<ChunkOptions>): ChunkResult;
    /**
     * Fixed-size chunking with optional overlap
     *
     * Simple character-based chunking. Best for uniform content
     * where structure doesn't matter.
     */
    private chunkFixed;
    /**
     * Semantic chunking based on paragraph boundaries
     *
     * Respects natural paragraph breaks (double newlines).
     * Groups paragraphs until maxSize is reached.
     */
    private chunkSemantic;
    /**
     * Markdown-aware chunking
     *
     * Respects markdown header structure. Each major section
     * becomes its own chunk when possible.
     */
    private chunkMarkdown;
    /**
     * Code-aware chunking
     *
     * Preserves code blocks (fenced with ```) as atomic units.
     * Non-code sections are chunked semantically.
     */
    private chunkCode;
    /**
     * Adaptive chunking - auto-selects best strategy
     *
     * Analyzes content to determine the best chunking strategy:
     * - Code blocks present -> code strategy
     * - Markdown headers present -> markdown strategy
     * - Default -> semantic strategy
     */
    private chunkAdaptive;
    /**
     * Create a chunk object with metadata
     */
    private createChunk;
    /**
     * Detect content type from the content itself
     */
    private detectType;
    /**
     * Get the current configuration
     */
    getConfig(): ChunkerConfig;
    /**
     * Update configuration
     */
    setConfig(config: Partial<ChunkerConfig>): void;
}
/**
 * Create a new Chunker instance with optional configuration
 */
export declare function createChunker(config?: Partial<ChunkerConfig>): Chunker;
/**
 * Convenience function to chunk a document without creating a Chunker instance
 */
export declare function chunkDocument(content: string, options?: Partial<ChunkOptions>): ChunkResult;
//# sourceMappingURL=chunker.d.ts.map