/**
 * Search Nodes Tool
 *
 * MCP tool for searching nodes in the knowledge graph by content or metadata.
 *
 * @module mcp-server/tools/search/nodes
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler } from '../../types/index.js';
import type { KnowledgeGraphDatabase } from '../../../core/database.js';
/**
 * Search nodes tool definition
 */
export declare const searchNodesTool: Tool;
/**
 * Create search nodes handler
 *
 * @param database - Knowledge graph database instance
 * @returns Tool handler function
 */
export declare function createSearchNodesHandler(database?: KnowledgeGraphDatabase): ToolHandler;
//# sourceMappingURL=nodes.d.ts.map