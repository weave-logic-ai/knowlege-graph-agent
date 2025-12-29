/**
 * Vector Upsert Tool
 *
 * MCP tool for inserting or updating vectors in the knowledge graph.
 * Supports single vector operations with metadata.
 *
 * @module mcp-server/tools/vector/upsert
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler } from '../../types/index.js';
import type { EnhancedVectorStore } from '../../../vector/services/vector-store.js';
/**
 * Vector upsert tool definition
 *
 * Provides the ability to insert or update vectors in the knowledge graph.
 * If a vector with the given ID exists, it will be updated; otherwise,
 * a new vector will be created.
 */
export declare const vectorUpsertTool: Tool;
/**
 * Create vector upsert handler
 *
 * Creates a handler function that inserts or updates vectors in the
 * knowledge graph vector store.
 *
 * @param vectorStore - Vector store instance for storage operations
 * @returns Tool handler function
 *
 * @example
 * ```typescript
 * const handler = createVectorUpsertHandler(vectorStore);
 * const result = await handler({
 *   id: 'doc-123',
 *   vector: [0.1, 0.2, ...], // 1536 dimensions
 *   metadata: {
 *     title: 'Neural Networks',
 *     type: 'concept',
 *     tags: ['AI', 'ML'],
 *   },
 * });
 * ```
 */
export declare function createVectorUpsertHandler(vectorStore?: EnhancedVectorStore): ToolHandler;
//# sourceMappingURL=upsert.d.ts.map