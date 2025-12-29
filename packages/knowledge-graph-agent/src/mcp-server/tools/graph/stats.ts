/**
 * Graph Stats Tool
 *
 * MCP tool for retrieving statistics about the knowledge graph.
 *
 * @module mcp-server/tools/graph/stats
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import type { KnowledgeGraphDatabase } from '../../../core/database.js';

/**
 * Graph stats tool definition
 */
export const graphStatsTool: Tool = {
  name: 'kg_graph_stats',
  description: 'Get comprehensive statistics about the knowledge graph including node counts, edge counts, and distribution by type and status.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      detailed: {
        type: 'boolean',
        description: 'Include detailed breakdown by type, status, and connectivity metrics',
        default: false,
      },
    },
  },
};

/**
 * Create graph stats handler
 *
 * @param database - Knowledge graph database instance
 * @returns Tool handler function
 */
export function createGraphStatsHandler(database?: KnowledgeGraphDatabase): ToolHandler {
  return async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const { detailed = false } = params || {};

    try {
      // Check database availability
      if (!database) {
        return {
          success: false,
          error: 'Database not initialized. Run graph generation first.',
          metadata: { executionTime: Date.now() - startTime },
        };
      }

      // Get statistics from database
      const stats = database.getStats();

      // Build response based on detail level
      const response: Record<string, unknown> = {
        totalNodes: stats.totalNodes || 0,
        totalEdges: stats.totalEdges || 0,
        averageLinksPerNode: stats.avgLinksPerNode || 0,
        orphanNodes: stats.orphanNodes || 0,
      };

      // Add detailed breakdown if requested
      if (detailed) {
        response.nodesByType = stats.nodesByType;
        response.nodesByStatus = stats.nodesByStatus;
        response.mostConnected = stats.mostConnected;

        // Get tags distribution
        const tags = database.getAllTags();
        response.topTags = tags.slice(0, 10);
        response.totalTags = tags.length;

        // Get metadata
        response.lastGenerated = database.getMetadata('lastGenerated');
        response.lastUpdated = database.getMetadata('lastUpdated');
        response.version = database.getMetadata('version');
      }

      return {
        success: true,
        data: response,
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
