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
import type { ToolHandler } from '../../types/index.js';
import type { EnhancedVectorStore } from '../../../vector/services/vector-store.js';
/**
 * Vector search tool definition
 *
 * Provides semantic vector search capabilities with optional hybrid search
 * combining vector similarity with keyword matching.
 */
export declare const vectorSearchTool: Tool;
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
export declare function createVectorSearchHandler(vectorStore?: EnhancedVectorStore): ToolHandler;
//# sourceMappingURL=search.d.ts.map