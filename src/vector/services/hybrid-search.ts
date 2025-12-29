/**
 * Hybrid Search Service
 *
 * Combines vector similarity search with full-text search (FTS) for improved
 * search relevance. Uses a weighted scoring approach to merge results from
 * both search methods.
 *
 * @module vector/services/hybrid-search
 */

import type { SearchResult, HybridSearchResult } from '../types.js';
import type { EnhancedVectorStore } from './vector-store.js';
import type { EmbeddingService } from './embedding-service.js';
import { createLogger } from '../../utils/index.js';

const logger = createLogger('hybrid-search');

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
 * Default hybrid search configuration
 */
const DEFAULT_CONFIG: HybridSearchConfig = {
  vectorWeight: 0.6,
  ftsWeight: 0.4,
  limit: 20,
  minScore: 0.3,
  hybridBoost: 1.2,
  normalizeScores: true,
};

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
export class HybridSearch {
  private vectorStore: EnhancedVectorStore;
  private embeddingService: EmbeddingService;
  private config: HybridSearchConfig;
  private ftsProvider: FTSProvider | null = null;

  /**
   * Create a new HybridSearch instance
   *
   * @param vectorStore - Vector store for similarity search
   * @param embeddingService - Service for generating query embeddings
   * @param config - Optional configuration overrides
   */
  constructor(
    vectorStore: EnhancedVectorStore,
    embeddingService: EmbeddingService,
    config: Partial<HybridSearchConfig> = {}
  ) {
    this.vectorStore = vectorStore;
    this.embeddingService = embeddingService;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set the full-text search provider
   *
   * @param provider - FTS provider implementation
   */
  setFTSProvider(provider: FTSProvider): void {
    this.ftsProvider = provider;
  }

  /**
   * Perform hybrid search combining vector and FTS
   *
   * @param query - Search query
   * @returns Search response with results and statistics
   */
  async search(query: HybridSearchQuery): Promise<HybridSearchResponse> {
    const startTime = Date.now();
    const limit = query.limit ?? this.config.limit;
    const minScore = query.minScore ?? this.config.minScore;
    const vectorWeight = query.vectorWeight ?? this.config.vectorWeight;
    const ftsWeight = query.ftsWeight ?? this.config.ftsWeight;

    let vectorSearchMs = 0;
    let ftsSearchMs = 0;
    let vectorResults: SearchResult[] = [];
    let ftsResults: FTSResult[] = [];

    // Run vector search and FTS in parallel
    const [vectorResultsPromise, ftsResultsPromise] = await Promise.allSettled([
      this.performVectorSearch(query.query, limit * 2),
      this.performFTSSearch(query.query, limit * 2),
    ]);

    // Extract vector results
    if (vectorResultsPromise.status === 'fulfilled') {
      vectorResults = vectorResultsPromise.value.results;
      vectorSearchMs = vectorResultsPromise.value.durationMs;
    } else {
      logger.warn('Vector search failed', {
        error: vectorResultsPromise.reason,
      });
    }

    // Extract FTS results
    if (ftsResultsPromise.status === 'fulfilled') {
      ftsResults = ftsResultsPromise.value.results;
      ftsSearchMs = ftsResultsPromise.value.durationMs;
    } else {
      logger.warn('FTS search failed', {
        error: ftsResultsPromise.reason,
      });
    }

    // Merge results
    const mergeStartTime = Date.now();
    const merged = this.mergeResults(
      vectorResults,
      ftsResults,
      vectorWeight,
      ftsWeight
    );

    // Filter by minimum score
    const filtered = merged.filter((r) => r.combinedScore >= minScore);

    // Filter by node types if specified
    let final = filtered;
    if (query.nodeTypes && query.nodeTypes.length > 0) {
      final = filtered.filter((r) => {
        const nodeType = r.metadata?.type as string | undefined;
        return nodeType && query.nodeTypes!.includes(nodeType);
      });
    }

    // Limit and rank results
    const results = final.slice(0, limit).map((r, i) => ({
      ...r,
      rank: i + 1,
    }));

    const mergeMs = Date.now() - mergeStartTime;
    const totalDurationMs = Date.now() - startTime;

    logger.info('Hybrid search completed', {
      query: query.query.slice(0, 50),
      vectorResults: vectorResults.length,
      ftsResults: ftsResults.length,
      finalResults: results.length,
      totalDurationMs,
    });

    return {
      results,
      stats: {
        totalDurationMs,
        vectorSearchMs,
        ftsSearchMs,
        mergeMs,
        vectorResultCount: vectorResults.length,
        ftsResultCount: ftsResults.length,
        finalResultCount: results.length,
      },
      query: query.query,
    };
  }

  /**
   * Perform vector similarity search
   *
   * @param query - Text query
   * @param limit - Max results
   * @returns Vector search results with timing
   */
  private async performVectorSearch(
    query: string,
    limit: number
  ): Promise<{ results: SearchResult[]; durationMs: number }> {
    const startTime = Date.now();

    // Generate query embedding
    const embeddingResult = await this.embeddingService.embed(query);

    // Search vector store
    const results = await this.vectorStore.search({
      vector: Array.from(embeddingResult.embedding),
      k: limit,
      minScore: 0, // We'll filter by minScore after merge
    });

    return {
      results,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Perform full-text search
   *
   * @param query - Text query
   * @param limit - Max results
   * @returns FTS results with timing
   */
  private async performFTSSearch(
    query: string,
    limit: number
  ): Promise<{ results: FTSResult[]; durationMs: number }> {
    const startTime = Date.now();

    if (!this.ftsProvider) {
      return { results: [], durationMs: Date.now() - startTime };
    }

    const results = await this.ftsProvider.search(query, limit);

    return {
      results,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Merge vector and FTS results using weighted scoring
   *
   * @param vectorResults - Results from vector search
   * @param ftsResults - Results from FTS
   * @param vectorWeight - Weight for vector scores
   * @param ftsWeight - Weight for FTS scores
   * @returns Merged and ranked results
   */
  private mergeResults(
    vectorResults: SearchResult[],
    ftsResults: FTSResult[],
    vectorWeight: number,
    ftsWeight: number
  ): ExtendedHybridSearchResult[] {
    const combined = new Map<string, ExtendedHybridSearchResult>();

    // Normalize scores if configured
    const normalizedVector = this.config.normalizeScores
      ? this.normalizeScores(vectorResults.map((r) => ({ id: r.id, score: r.score })))
      : new Map(vectorResults.map((r) => [r.id, r.score]));

    const normalizedFTS = this.config.normalizeScores
      ? this.normalizeScores(
          ftsResults.map((r) => ({ id: r.id, score: r.score ?? 0.5 }))
        )
      : new Map(ftsResults.map((r) => [r.id, r.score ?? 0.5]));

    // Add vector results
    for (const result of vectorResults) {
      const vectorScore = normalizedVector.get(result.id) ?? 0;
      combined.set(result.id, {
        nodeId: result.id,
        content: (result.metadata?.content as string) ?? '',
        vectorScore,
        ftsScore: 0,
        combinedScore: vectorScore * vectorWeight,
        source: 'vector',
        rank: 0,
        metadata: result.metadata,
      });
    }

    // Merge FTS results
    for (const result of ftsResults) {
      const ftsScore = normalizedFTS.get(result.id) ?? 0;
      const existing = combined.get(result.id);

      if (existing) {
        // Result appears in both - apply hybrid boost
        existing.ftsScore = ftsScore;
        existing.combinedScore =
          (existing.vectorScore * vectorWeight + ftsScore * ftsWeight) *
          this.config.hybridBoost;
        existing.source = 'hybrid';
        existing.snippets = result.snippets;
      } else {
        // FTS-only result
        combined.set(result.id, {
          nodeId: result.id,
          content: result.content,
          vectorScore: 0,
          ftsScore,
          combinedScore: ftsScore * ftsWeight,
          source: 'fts',
          rank: 0,
          metadata: result.metadata,
          snippets: result.snippets,
        });
      }
    }

    // Sort by combined score and return
    return Array.from(combined.values()).sort(
      (a, b) => b.combinedScore - a.combinedScore
    );
  }

  /**
   * Normalize scores to 0-1 range
   *
   * @param items - Items with scores to normalize
   * @returns Map of id to normalized score
   */
  private normalizeScores(
    items: Array<{ id: string; score: number }>
  ): Map<string, number> {
    if (items.length === 0) {
      return new Map();
    }

    const scores = items.map((i) => i.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const range = max - min;

    const result = new Map<string, number>();

    for (const item of items) {
      const normalized = range === 0 ? 1 : (item.score - min) / range;
      result.set(item.id, normalized);
    }

    return result;
  }

  /**
   * Update configuration
   *
   * @param config - Configuration updates
   */
  updateConfig(config: Partial<HybridSearchConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   *
   * @returns Copy of current configuration
   */
  getConfig(): HybridSearchConfig {
    return { ...this.config };
  }
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
export function createHybridSearch(
  vectorStore: EnhancedVectorStore,
  embeddingService: EmbeddingService,
  config?: Partial<HybridSearchConfig>
): HybridSearch {
  return new HybridSearch(vectorStore, embeddingService, config);
}
