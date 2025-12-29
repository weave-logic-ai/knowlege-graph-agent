/**
 * Search Tags Tool
 *
 * MCP tool for searching nodes by tags in the knowledge graph.
 *
 * @module mcp-server/tools/search/tags
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler } from '../../types/index.js';
import type { KnowledgeGraphDatabase } from '../../../core/database.js';
/**
 * Search tags tool definition
 */
export declare const searchTagsTool: Tool;
/**
 * Create search tags handler
 *
 * @param database - Knowledge graph database instance
 * @returns Tool handler function
 */
export declare function createSearchTagsHandler(database?: KnowledgeGraphDatabase): ToolHandler;
//# sourceMappingURL=tags.d.ts.map