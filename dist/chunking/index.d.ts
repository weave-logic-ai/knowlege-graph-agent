/**
 * Document Chunking Module
 *
 * Provides intelligent document chunking for RAG and vector search.
 */
/**
 * Chunking strategy
 */
export type ChunkStrategy = 'fixed' | 'sentence' | 'paragraph' | 'semantic' | 'markdown' | 'code';
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
/**
 * Document Chunker for splitting documents into chunks
 */
export declare class Chunker {
    private defaultOptions;
    constructor(options?: Partial<ChunkOptions>);
    /**
     * Chunk a document
     */
    chunk(content: string, source: string, options?: Partial<ChunkOptions>): ChunkResult;
    /**
     * Fixed-size chunking
     */
    private chunkFixed;
    /**
     * Sentence-based chunking
     */
    private chunkBySentence;
    /**
     * Paragraph-based chunking
     */
    private chunkByParagraph;
    /**
     * Markdown-aware chunking
     */
    private chunkByMarkdown;
    /**
     * Code-aware chunking
     */
    private chunkByCode;
    /**
     * Semantic chunking (placeholder for more advanced implementation)
     */
    private chunkSemantic;
    /**
     * Aggregate small chunks into larger ones
     */
    private aggregateChunks;
    /**
     * Estimate token count
     */
    private estimateTokens;
}
/**
 * Create a new Chunker instance
 */
export declare function createChunker(options?: Partial<ChunkOptions>): Chunker;
/**
 * Convenience function to chunk a document
 */
export declare function chunkDocument(content: string, source: string, options?: Partial<ChunkOptions>): ChunkResult;
//# sourceMappingURL=index.d.ts.map