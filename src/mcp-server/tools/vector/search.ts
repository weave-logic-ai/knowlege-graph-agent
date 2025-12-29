/**
 * Vector Search Tool
 *
 * MCP tool for semantic vector search in the knowledge graph.
 * Supports both pure vector similarity search and hybrid search
 * combining vector similarity with keyword matching.
 *
 * @module mcp-server/tools/vector/search
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import type { EnhancedVectorStore } from '../../../vector/services/vector-store.js';
import type { SearchResult, HybridSearchResult } from '../../../vector/types.js';

/**
 * Vector search tool definition
 *
 * Provides semantic vector search capabilities with optional hybrid search
 * combining vector similarity with keyword matching.
 */
export const vectorSearchTool: Tool = {
  name: 'kg_vector_search',
  description:
    'Perform semantic vector search on the knowledge graph. Supports pure vector similarity search and hybrid search combining vector similarity with keyword matching for more precise results.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description:
          'Search query string. Will be converted to an embedding vector for similarity search.',
      },
      k: {
        type: 'number',
        description: 'Number of results to return (default: 10, max: 100)',
        default: 10,
        minimum: 1,
        maximum: 100,
      },
      type: {
        type: 'string',
        description: 'Filter results by node type',
        enum: [
          'concept',
          'technical',
          'feature',
          'primitive',
          'service',
          'guide',
          'standard',
          'integration',
        ],
      },
      hybrid: {
        type: 'boolean',
        description:
          'Enable hybrid search combining vector similarity with keyword matching (default: false)',
        default: false,
      },
      minScore: {
        type: 'number',
        description: 'Minimum similarity score threshold (0-1, default: 0)',
        default: 0,
        minimum: 0,
        maximum: 1,
      },
      includeVectors: {
        type: 'boolean',
        description: 'Include raw vector data in results (default: false)',
        default: false,
      },
      namespace: {
        type: 'string',
        description: 'Filter by vector namespace',
      },
    },
    required: ['query'],
  },
};

/**
 * Parameters for vector search
 */
interface VectorSearchParams {
  /** Search query string */
  query: string;
  /** Number of results to return */
  k?: number;
  /** Filter by node type */
  type?: string;
  /** Enable hybrid search */
  hybrid?: boolean;
  /** Minimum similarity score */
  minScore?: number;
  /** Include vectors in results */
  includeVectors?: boolean;
  /** Namespace filter */
  namespace?: string;
}

/**
 * Simple text-to-vector conversion for demonstration
 *
 * In production, this would call an embedding service (OpenAI, Anthropic, etc.)
 * For now, generates a deterministic pseudo-embedding from text.
 *
 * @param text - Text to convert
 * @param dimensions - Vector dimensions (default: 1536 for OpenAI compatibility)
 * @returns Pseudo-embedding vector
 * @internal
 */
function textToVector(text: string, dimensions: number = 1536): number[] {
  const vector: number[] = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase().trim();

  // Generate deterministic values based on character codes
  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i);
    const idx = (charCode * (i + 1)) % dimensions;
    vector[idx] += Math.sin(charCode * (i + 1)) * 0.1;
  }

  // Normalize to unit vector
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }
  }

  return vector;
}

/**
 * Perform keyword matching for hybrid search
 *
 * Scores results based on keyword overlap with the query.
 *
 * @param query - Search query
 * @param metadata - Result metadata to search
 * @returns Keyword match score (0-1)
 * @internal
 */
function calculateKeywordScore(
  query: string,
  metadata: Record<string, unknown>
): number {
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);
  if (queryTerms.length === 0) return 0;

  let matchCount = 0;
  const searchableFields = ['title', 'content', 'description', 'tags'];

  for (const field of searchableFields) {
    const value = metadata[field];
    if (typeof value === 'string') {
      const fieldLower = value.toLowerCase();
      for (const term of queryTerms) {
        if (fieldLower.includes(term)) {
          matchCount++;
        }
      }
    } else if (Array.isArray(value)) {
      const fieldValues = value.join(' ').toLowerCase();
      for (const term of queryTerms) {
        if (fieldValues.includes(term)) {
          matchCount++;
        }
      }
    }
  }

  return Math.min(1, matchCount / (queryTerms.length * searchableFields.length));
}

/**
 * Create vector search handler
 *
 * Creates a handler function that performs semantic vector search
 * on the knowledge graph. Supports both pure vector search and
 * hybrid search combining vector similarity with keyword matching.
 *
 * @param vectorStore - Vector store instance for search operations
 * @returns Tool handler function
 *
 * @example
 * ```typescript
 * const handler = createVectorSearchHandler(vectorStore);
 * const result = await handler({
 *   query: 'neural network architecture',
 *   k: 10,
 *   hybrid: true,
 * });
 * ```
 */
export function createVectorSearchHandler(
  vectorStore?: EnhancedVectorStore
): ToolHandler {
  return async (params: Record<string, unknown>): Promise<ToolResult> => {
    const startTime = Date.now();
    const typedParams = params as unknown as VectorSearchParams;
    const {
      query,
      k = 10,
      type,
      hybrid = false,
      minScore = 0,
      includeVectors = false,
      namespace,
    } = typedParams;

    try {
      // Validate required parameters
      if (!query || typeof query !== 'string') {
        return {
          success: false,
          error: 'Query parameter is required and must be a string',
          metadata: { executionTime: Date.now() - startTime },
        };
      }

      // Check vector store availability
      if (!vectorStore) {
        return {
          success: false,
          error: 'Vector store not initialized. Configure vector storage first.',
          metadata: { executionTime: Date.now() - startTime },
        };
      }

      // Ensure vector store is ready
      if (!vectorStore.isReady()) {
        await vectorStore.initialize();
      }

      // Enforce limits
      const safeK = Math.min(Math.max(1, Number(k) || 10), 100);

      // Convert query to vector
      const queryVector = textToVector(query, vectorStore.getConfig().index.dimensions);

      // Build filter
      const filter: Record<string, unknown> = {};
      if (type && typeof type === 'string') {
        filter.type = type;
      }
      if (namespace && typeof namespace === 'string') {
        filter.namespace = namespace;
      }

      let results: SearchResult[] | HybridSearchResult[];

      if (hybrid) {
        // Hybrid search: combine vector + keyword
        const hybridResults = await vectorStore.hybridSearch({
          embedding: queryVector,
          limit: safeK * 2, // Get extra for re-ranking
          filters: Object.keys(filter).length > 0 ? filter : undefined,
          minScore: minScore > 0 ? minScore : undefined,
          includeVectors,
          namespace,
        });

        // Re-rank with keyword scores
        const reranked = hybridResults.map((result) => {
          const keywordScore = calculateKeywordScore(query, result.metadata);
          const combinedScore = result.score * 0.7 + keywordScore * 0.3;
          return {
            ...result,
            keywordScore,
            combinedScore,
            source: 'merged' as const,
          };
        });

        // Sort by combined score and take top k
        reranked.sort((a, b) => b.combinedScore - a.combinedScore);
        results = reranked.slice(0, safeK);
      } else {
        // Pure vector search
        results = await vectorStore.search({
          vector: queryVector,
          k: safeK,
          filter: Object.keys(filter).length > 0 ? filter : undefined,
          minScore: minScore > 0 ? minScore : undefined,
        });
      }

      // Format results
      const formattedResults = results.map((result) => {
        const formatted: Record<string, unknown> = {
          id: result.id,
          score: Math.round(result.score * 10000) / 10000,
          metadata: result.metadata,
        };

        if (includeVectors && result.vector) {
          formatted.vector = result.vector;
        }

        // Handle hybrid search results with combined/keyword scores
        const resultWithScores = result as unknown as Record<string, unknown>;
        if ('combinedScore' in resultWithScores && typeof resultWithScores.combinedScore === 'number') {
          formatted.combinedScore = Math.round(resultWithScores.combinedScore * 10000) / 10000;
        }
        if ('keywordScore' in resultWithScores && typeof resultWithScores.keywordScore === 'number') {
          formatted.keywordScore = Math.round(resultWithScores.keywordScore * 10000) / 10000;
        }
        if ('source' in result) {
          formatted.source = (result as HybridSearchResult).source;
        }

        return formatted;
      });

      // Get stats for metadata
      const stats = vectorStore.getStats();

      return {
        success: true,
        data: {
          results: formattedResults,
          count: formattedResults.length,
          query,
          searchMode: hybrid ? 'hybrid' : 'vector',
          filters: {
            type: type || null,
            minScore: minScore || null,
            namespace: namespace || null,
          },
        },
        metadata: {
          executionTime: Date.now() - startTime,
          totalVectors: stats.totalVectors,
          indexType: stats.indexType,
          cached: false,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { executionTime: Date.now() - startTime },
      };
    }
  };
}
