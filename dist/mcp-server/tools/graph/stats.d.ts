/**
 * Graph Stats Tool
 *
 * MCP tool for retrieving statistics about the knowledge graph.
 *
 * @module mcp-server/tools/graph/stats
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler } from '../../types/index.js';
import type { KnowledgeGraphDatabase } from '../../../core/database.js';
/**
 * Graph stats tool definition
 */
export declare const graphStatsTool: Tool;
/**
 * Create graph stats handler
 *
 * @param database - Knowledge graph database instance
 * @returns Tool handler function
 */
export declare function createGraphStatsHandler(database?: KnowledgeGraphDatabase): ToolHandler;
//# sourceMappingURL=stats.d.ts.map