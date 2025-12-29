/**
 * Graph Generate Tool
 *
 * MCP tool for generating or regenerating the knowledge graph from documentation.
 *
 * @module mcp-server/tools/graph/generate
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler } from '../../types/index.js';
/**
 * Graph generate tool definition
 */
export declare const graphGenerateTool: Tool;
/**
 * Create graph generate handler
 *
 * @param projectRoot - Project root directory path
 * @returns Tool handler function
 */
export declare function createGraphGenerateHandler(projectRoot?: string): ToolHandler;
//# sourceMappingURL=generate.d.ts.map