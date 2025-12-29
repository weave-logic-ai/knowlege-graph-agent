/**
 * Search Nodes Tool
 *
 * MCP tool for searching nodes in the knowledge graph by content or metadata.
 *
 * @module mcp-server/tools/search/nodes
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import type { KnowledgeGraphDatabase } from '../../../core/database.js';
import type { NodeType, NodeStatus } from '../../../core/types.js';

/**
 * Search nodes tool definition
 */
export const searchNodesTool: Tool = {
  name: 'kg_search_nodes',
  description: 'Search for nodes in the knowledge graph by content, metadata, type, or status. Supports full-text search with filtering options.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'Search query to match against node content and titles',
      },
      type: {
        type: 'string',
        description: 'Filter by node type',
        enum: ['concept', 'technical', 'feature', 'primitive', 'service', 'guide', 'standard', 'integration'],
      },
      status: {
        type: 'string',
        description: 'Filter by node status',
        enum: ['draft', 'active', 'deprecated', 'archived'],
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 20, max: 100)',
        default: 20,
        minimum: 1,
        maximum: 100,
      },
    },
    required: ['query'],
  },
};

/**
 * Create search nodes handler
 *
 * @param database - Knowledge graph database instance
 * @returns Tool handler function
 */
export function createSearchNodesHandler(database?: KnowledgeGraphDatabase): ToolHandler {
  return async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const { query, type, status, limit = 20 } = params || {};

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
      const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);

      // Execute search
      let results = database.searchNodes(query as string, safeLimit * 2); // Get extra for filtering

      // Apply type filter
      if (type && typeof type === 'string') {
        results = results.filter(node => node.type === (type as NodeType));
      }

      // Apply status filter
      if (status && typeof status === 'string') {
        results = results.filter(node => node.status === (status as NodeStatus));
      }

      // Apply final limit
      results = results.slice(0, safeLimit);

      // Format results
      const formattedResults = results.map(node => ({
        id: node.id,
        title: node.title,
        type: node.type,
        status: node.status,
        path: node.path,
        tags: node.tags,
        description: node.frontmatter?.description || null,
        wordCount: node.wordCount,
        lastModified: node.lastModified?.toISOString(),
        // Include a content snippet
        snippet: node.content?.slice(0, 200)?.replace(/\n/g, ' ').trim() + (node.content && node.content.length > 200 ? '...' : ''),
      }));

      return {
        success: true,
        data: {
          nodes: formattedResults,
          count: formattedResults.length,
          query,
          filters: {
            type: type || null,
            status: status || null,
          },
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
