/**
 * Chunking System Types
 *
 * Type definitions for the document chunking system.
 * Supports multiple chunking strategies for different content types.
 *
 * @module chunking/types
 */

/**
 * Available chunking strategies
 *
 * - fixed: Fixed-size chunks with optional overlap
 * - semantic: Paragraph-based semantic boundaries
 * - markdown: Respects markdown header structure
 * - code: Preserves code blocks and structure
 * - adaptive: Auto-selects best strategy based on content
 */
export type ChunkStrategy = 'fixed' | 'semantic' | 'markdown' | 'code' | 'adaptive';

/**
 * Configuration options for chunking
 */
export interface ChunkOptions {
  /** Chunking strategy to use */
  strategy: ChunkStrategy;

  /** Maximum chunk size in characters */
  maxSize: number;

  /** Minimum chunk size in characters (chunks smaller than this may be merged) */
  minSize?: number;

  /** Number of characters to overlap between chunks */
  overlap?: number;

  /** Whether to preserve document structure (headers, code blocks, etc.) */
  preserveStructure?: boolean;
}

/**
 * A single chunk of content
 */
export interface Chunk {
  /** Unique identifier for this chunk (hash-based) */
  id: string;

  /** The content of the chunk */
  content: string;

  /** Start offset in the original document */
  startOffset: number;

  /** End offset in the original document */
  endOffset: number;

  /** Metadata about the chunk */
  metadata: ChunkMetadata;
}

/**
 * Metadata about a chunk
 */
export interface ChunkMetadata {
  /** Type of content in the chunk */
  type: 'header' | 'paragraph' | 'code' | 'list' | 'mixed';

  /** Header level (1-6) if type is 'header' */
  level?: number;

  /** Programming language if type is 'code' */
  language?: string;

  /** Word count in the chunk */
  wordCount: number;

  /** Line count in the chunk */
  lineCount: number;

  /** Whether the chunk contains links (wiki-style or markdown) */
  hasLinks: boolean;

  /** Parent chunk ID if this is a sub-chunk */
  parentChunkId?: string;
}

/**
 * Result of a chunking operation
 */
export interface ChunkResult {
  /** Array of generated chunks */
  chunks: Chunk[];

  /** Total size of the original content */
  totalSize: number;

  /** Strategy that was used */
  strategy: ChunkStrategy;

  /** Time taken to process in milliseconds */
  processingTime: number;
}

/**
 * Chunker configuration
 */
export interface ChunkerConfig {
  /** Default strategy to use when none specified */
  defaultStrategy: ChunkStrategy;

  /** Default maximum chunk size */
  defaultMaxSize: number;

  /** Default overlap between chunks */
  defaultOverlap: number;
}
