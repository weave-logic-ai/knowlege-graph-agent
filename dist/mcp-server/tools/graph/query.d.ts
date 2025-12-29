/**
 * Graph Query Tool
 *
 * MCP tool for querying the knowledge graph for nodes and relationships.
 *
 * @module mcp-server/tools/graph/query
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler } from '../../types/index.js';
import type { KnowledgeGraphDatabase } from '../../../core/database.js';
/**
 * Graph query tool definition
 */
export declare const graphQueryTool: Tool;
/**
 * Create graph query handler
 *
 * @param database - Knowledge graph database instance
 * @returns Tool handler function
 */
export declare function createGraphQueryHandler(database?: KnowledgeGraphDatabase): ToolHandler;
//# sourceMappingURL=query.d.ts.map