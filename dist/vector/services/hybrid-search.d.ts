/**
 * Hybrid Search Service
 *
 * Combines vector similarity search with full-text search (FTS) for improved
 * search relevance. Uses a weighted scoring approach to merge results from
 * both search methods.
 *
 * @module vector/services/hybrid-search
 */
import type { EnhancedVectorStore } from './vector-store.js';
import type { EmbeddingService } from './embedding-service.js';
/**
 * Configuration for hybrid search
 */
export interface HybridSearchConfig {
    /**
     * Weight for vector similarity results (0-1)
     * Higher values favor semantic similarity
     * @default 0.6
     */
    vectorWeight: number;
    /**
     * Weight for full-text search results (0-1)
     * Higher values favor keyword matching
     * @default 0.4
     */
    ftsWeight: number;
    /**
     * Maximum number of results to return
     * @default 20
     */
    limit: number;
    /**
     * Minimum combined score threshold (0-1)
     * Results below this score are filtered out
     * @default 0.3
     */
    minScore: number;
    /**
     * Boost factor for results that appear in both vector and FTS
     * @default 1.2
     */
    hybridBoost: number;
    /**
     * Whether to normalize scores before combining
     * @default true
     */
    normalizeScores: boolean;
}
/**
 * FTS (Full-Text Search) result from external search provider
 */
export interface FTSResult {
    /**
     * Node/document ID
     */
    id: string;
    /**
     * Content that matched
     */
    content: string;
    /**
     * FTS relevance score (0-1 normalized or raw)
     */
    score?: number;
    /**
     * Match snippets/highlights
     */
    snippets?: string[];
    /**
     * Additional metadata
     */
    metadata?: Record<string, unknown>;
}
/**
 * Extended hybrid search result with source tracking
 */
export interface ExtendedHybridSearchResult {
    /**
     * Node/document ID
     */
    nodeId: string;
    /**
     * Content of the matched node
     */
    content: string;
    /**
     * Vector similarity score (0-1)
     */
    vectorScore: number;
    /**
     * Full-text search score (0-1)
     */
    ftsScore: number;
    /**
     * Combined/weighted score
     */
    combinedScore: number;
    /**
     * Source of this result
     */
    source: 'vector' | 'fts' | 'hybrid';
    /**
     * Rank in the final result list
     */
    rank: number;
    /**
     * Optional metadata
     */
    metadata?: Record<string, unknown>;
    /**
     * Match snippets for highlighting
     */
    snippets?: string[];
}
/**
 * Search query input
 */
export interface HybridSearchQuery {
    /**
     * Text query for search
     */
    query: string;
    /**
     * Maximum results to return
     */
    limit?: number;
    /**
     * Minimum score threshold
     */
    minScore?: number;
    /**
     * Node types to filter by
     */
    nodeTypes?: string[];
    /**
     * Override vector weight
     */
    vectorWeight?: number;
    /**
     * Override FTS weight
     */
    ftsWeight?: number;
    /**
     * Include match snippets
     */
    includeSnippets?: boolean;
}
/**
 * Search statistics
 */
export interface SearchStats {
    /**
     * Total search time in milliseconds
     */
    totalDurationMs: number;
    /**
     * Vector search time
     */
    vectorSearchMs: number;
    /**
     * FTS search time
     */
    ftsSearchMs: number;
    /**
     * Merge/ranking time
     */
    mergeMs: number;
    /**
     * Number of vector results before merge
     */
    vectorResultCount: number;
    /**
     * Number of FTS results before merge
     */
    ftsResultCount: number;
    /**
     * Final result count after merge and filter
     */
    finalResultCount: number;
}
/**
 * Hybrid Search result with stats
 */
export interface HybridSearchResponse {
    /**
     * Search results
     */
    results: ExtendedHybridSearchResult[];
    /**
     * Search statistics
     */
    stats: SearchStats;
    /**
     * Original query
     */
    query: string;
}
/**
 * FTS provider interface for pluggable full-text search
 */
export interface FTSProvider {
    /**
     * Search for documents matching query
     */
    search(query: string, limit: number): Promise<FTSResult[]>;
}
/**
 * Hybrid Search Service
 *
 * Combines vector similarity search with full-text search to provide
 * better search relevance. Vector search captures semantic meaning
 * while FTS captures exact keyword matches.
 *
 * @example
 * ```typescript
 * const hybridSearch = new HybridSearch(vectorStore, embeddingService);
 *
 * // Set up FTS provider (e.g., SQLite FTS5)
 * hybridSearch.setFTSProvider({
 *   search: async (query, limit) => {
 *     return db.searchNodes(query, limit).map(node => ({
 *       id: node.id,
 *       content: node.content,
 *       score: 0.5,
 *     }));
 *   }
 * });
 *
 * // Perform hybrid search
 * const response = await hybridSearch.search({
 *   query: 'machine learning algorithms',
 *   limit: 10,
 * });
 * ```
 */
export declare class HybridSearch {
    private vectorStore;
    private embeddingService;
    private config;
    private ftsProvider;
    /**
     * Create a new HybridSearch instance
     *
     * @param vectorStore - Vector store for similarity search
     * @param embeddingService - Service for generating query embeddings
     * @param config - Optional configuration overrides
     */
    constructor(vectorStore: EnhancedVectorStore, embeddingService: EmbeddingService, config?: Partial<HybridSearchConfig>);
    /**
     * Set the full-text search provider
     *
     * @param provider - FTS provider implementation
     */
    setFTSProvider(provider: FTSProvider): void;
    /**
     * Perform hybrid search combining vector and FTS
     *
     * @param query - Search query
     * @returns Search response with results and statistics
     */
    search(query: HybridSearchQuery): Promise<HybridSearchResponse>;
    /**
     * Perform vector similarity search
     *
     * @param query - Text query
     * @param limit - Max results
     * @returns Vector search results with timing
     */
    private performVectorSearch;
    /**
     * Perform full-text search
     *
     * @param query - Text query
     * @param limit - Max results
     * @returns FTS results with timing
     */
    private performFTSSearch;
    /**
     * Merge vector and FTS results using weighted scoring
     *
     * @param vectorResults - Results from vector search
     * @param ftsResults - Results from FTS
     * @param vectorWeight - Weight for vector scores
     * @param ftsWeight - Weight for FTS scores
     * @returns Merged and ranked results
     */
    private mergeResults;
    /**
     * Normalize scores to 0-1 range
     *
     * @param items - Items with scores to normalize
     * @returns Map of id to normalized score
     */
    private normalizeScores;
    /**
     * Update configuration
     *
     * @param config - Configuration updates
     */
    updateConfig(config: Partial<HybridSearchConfig>): void;
    /**
     * Get current configuration
     *
     * @returns Copy of current configuration
     */
    getConfig(): HybridSearchConfig;
}
/**
 * Create a hybrid search instance
 *
 * Factory function for creating hybrid search services.
 *
 * @param vectorStore - Vector store for similarity search
 * @param embeddingService - Service for generating query embeddings
 * @param config - Optional configuration overrides
 * @returns New HybridSearch instance
 */
export declare function createHybridSearch(vectorStore: EnhancedVectorStore, embeddingService: EmbeddingService, config?: Partial<HybridSearchConfig>): HybridSearch;
//# sourceMappingURL=hybrid-search.d.ts.map