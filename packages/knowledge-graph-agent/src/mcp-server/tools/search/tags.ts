/**
 * Search Tags Tool
 *
 * MCP tool for searching nodes by tags in the knowledge graph.
 *
 * @module mcp-server/tools/search/tags
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import type { KnowledgeGraphDatabase } from '../../../core/database.js';

/**
 * Search tags tool definition
 */
export const searchTagsTool: Tool = {
  name: 'kg_search_tags',
  description: 'Search for nodes by tags. Can require all tags to match or any tag to match.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of tags to search for',
      },
      matchAll: {
        type: 'boolean',
        description: 'If true, nodes must have ALL specified tags. If false, nodes with ANY of the tags are returned.',
        default: false,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 20, max: 100)',
        default: 20,
        minimum: 1,
        maximum: 100,
      },
    },
    required: ['tags'],
  },
};

/**
 * Create search tags handler
 *
 * @param database - Knowledge graph database instance
 * @returns Tool handler function
 */
export function createSearchTagsHandler(database?: KnowledgeGraphDatabase): ToolHandler {
  return async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const { tags, matchAll = false, limit = 20 } = params || {};

    try {
      // Validate required parameters
      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return {
          success: false,
          error: 'Tags parameter is required and must be a non-empty array of strings',
          metadata: { executionTime: Date.now() - startTime },
        };
      }

      // Validate tag array contents
      const validTags = tags.filter(t => typeof t === 'string' && t.trim().length > 0);
      if (validTags.length === 0) {
        return {
          success: false,
          error: 'At least one valid tag string is required',
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

      // Get nodes for each tag
      const tagNodeSets: Map<string, Set<string>> = new Map();

      for (const tag of validTags) {
        const nodes = database.getNodesByTag(tag);
        tagNodeSets.set(tag, new Set(nodes.map(n => n.id)));
      }

      // Find matching node IDs based on match mode
      let matchingIds: Set<string>;

      if (matchAll) {
        // Intersection: nodes must have ALL tags
        const sets = Array.from(tagNodeSets.values());
        if (sets.length === 0) {
          matchingIds = new Set();
        } else {
          matchingIds = sets.reduce((acc, set) => {
            return new Set([...acc].filter(id => set.has(id)));
          });
        }
      } else {
        // Union: nodes can have ANY tag
        matchingIds = new Set<string>();
        for (const nodeSet of tagNodeSets.values()) {
          for (const id of nodeSet) {
            matchingIds.add(id);
          }
        }
      }

      // Get full node data for matching IDs (up to limit)
      const matchingIdArray = Array.from(matchingIds).slice(0, safeLimit);
      const results = matchingIdArray
        .map(id => database.getNode(id))
        .filter((node): node is NonNullable<typeof node> => node !== null);

      // Format results
      const formattedResults = results.map(node => ({
        id: node.id,
        title: node.title,
        type: node.type,
        status: node.status,
        path: node.path,
        tags: node.tags,
        matchedTags: validTags.filter(t => node.tags.includes(t)),
        lastModified: node.lastModified?.toISOString(),
      }));

      // Sort by number of matched tags (descending)
      formattedResults.sort((a, b) => b.matchedTags.length - a.matchedTags.length);

      return {
        success: true,
        data: {
          nodes: formattedResults,
          count: formattedResults.length,
          tags: validTags,
          matchAll,
          totalMatching: matchingIds.size,
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
