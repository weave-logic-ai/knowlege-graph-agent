/**
 * Graph Query Tool
 *
 * MCP tool for querying the knowledge graph for nodes and relationships.
 *
 * @module mcp-server/tools/graph/query
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import type { KnowledgeGraphDatabase } from '../../../core/database.js';

/**
 * Graph query tool definition
 */
export const graphQueryTool: Tool = {
  name: 'kg_graph_query',
  description: 'Query the knowledge graph for nodes and relationships. Supports full-text search across titles and content with optional type filtering.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'Search query string to match against node titles and content',
      },
      type: {
        type: 'string',
        description: 'Filter by node type (concept, technical, feature, primitive, service, guide, standard, integration)',
        enum: ['concept', 'technical', 'feature', 'primitive', 'service', 'guide', 'standard', 'integration'],
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10, max: 100)',
        default: 10,
        minimum: 1,
        maximum: 100,
      },
      includeRelations: {
        type: 'boolean',
        description: 'Include related nodes in the response (outgoing and incoming links)',
        default: false,
      },
    },
    required: ['query'],
  },
};

/**
 * Create graph query handler
 *
 * @param database - Knowledge graph database instance
 * @returns Tool handler function
 */
export function createGraphQueryHandler(database?: KnowledgeGraphDatabase): ToolHandler {
  return async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const { query, type, limit = 10, includeRelations = false } = params || {};

    try {
      // Validate required parameters
      if (!query || typeof query !== 'string') {
        return {
          success: false,
          error: 'Query parameter is required and must be a string',
          metadata: { executionTime: Date.now() - startTime },
        };
      }

      // Check database availability
      if (!database) {
        return {
          success: false,
          error: 'Database not initialized. Run graph generation first.',
          metadata: { executionTime: Date.now() - startTime },
        };
      }

      // Enforce limits
      const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 100);

      // Execute search
      let results = database.searchNodes(query as string, safeLimit);

      // Apply type filter if specified
      if (type && typeof type === 'string') {
        results = results.filter(node => node.type === type);
      }

      // Format results
      const formattedResults = results.map(node => {
        const baseResult = {
          id: node.id,
          title: node.title,
          type: node.type,
          status: node.status,
          path: node.path,
          tags: node.tags,
          wordCount: node.wordCount,
          lastModified: node.lastModified?.toISOString(),
        };

        // Include relations if requested
        if (includeRelations) {
          return {
            ...baseResult,
            outgoingLinks: node.outgoingLinks?.map(link => ({
              target: link.target,
              type: link.type,
              text: link.text,
            })),
            incomingLinks: node.incomingLinks?.map(link => ({
              source: link.target,
              type: link.type,
              text: link.text,
            })),
          };
        }

        return baseResult;
      });

      return {
        success: true,
        data: {
          nodes: formattedResults,
          count: formattedResults.length,
          query,
          type: type || null,
          totalAvailable: results.length,
        },
        metadata: {
          executionTime: Date.now() - startTime,
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
