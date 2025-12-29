/**
 * Vector Upsert Tool
 *
 * MCP tool for inserting or updating vectors in the knowledge graph.
 * Supports single vector operations with metadata.
 *
 * @module mcp-server/tools/vector/upsert
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import type { EnhancedVectorStore } from '../../../vector/services/vector-store.js';

/**
 * Vector upsert tool definition
 *
 * Provides the ability to insert or update vectors in the knowledge graph.
 * If a vector with the given ID exists, it will be updated; otherwise,
 * a new vector will be created.
 */
export const vectorUpsertTool: Tool = {
  name: 'kg_vector_upsert',
  description:
    'Insert or update a vector in the knowledge graph. If a vector with the given ID exists, it will be replaced; otherwise, a new vector will be created.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      id: {
        type: 'string',
        description: 'Unique identifier for the vector. Used for retrieval and updates.',
      },
      vector: {
        type: 'array',
        items: { type: 'number' },
        description:
          'The embedding vector as an array of numbers. Must match the configured dimensions.',
      },
      metadata: {
        type: 'object',
        description:
          'Optional metadata to associate with the vector. Can include title, content, type, tags, etc.',
        properties: {
          title: { type: 'string', description: 'Title of the source document' },
          content: { type: 'string', description: 'Text content snippet' },
          type: {
            type: 'string',
            description: 'Node type',
            enum: [
              'concept',
              'technical',
              'feature',
              'primitive',
              'service',
              'guide',
              'standard',
              'integration',
            ],
          },
          path: { type: 'string', description: 'Source file path' },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Associated tags',
          },
          sourceId: { type: 'string', description: 'Reference to source node' },
        },
        additionalProperties: true,
      },
      namespace: {
        type: 'string',
        description: 'Optional namespace for organizing vectors (default: "default")',
      },
    },
    required: ['id', 'vector'],
  },
};

/**
 * Parameters for vector upsert
 */
interface VectorUpsertParams {
  /** Unique vector identifier */
  id: string;
  /** Embedding vector */
  vector: number[];
  /** Optional metadata */
  metadata?: Record<string, unknown>;
  /** Optional namespace */
  namespace?: string;
}

/**
 * Validate vector dimensions
 *
 * Checks if the provided vector matches the expected dimensions.
 *
 * @param vector - Vector to validate
 * @param expectedDimensions - Expected number of dimensions
 * @returns Validation result with error message if invalid
 * @internal
 */
function validateVector(
  vector: unknown,
  expectedDimensions: number
): { valid: boolean; error?: string } {
  if (!Array.isArray(vector)) {
    return { valid: false, error: 'Vector must be an array' };
  }

  if (vector.length === 0) {
    return { valid: false, error: 'Vector cannot be empty' };
  }

  if (vector.length !== expectedDimensions) {
    return {
      valid: false,
      error: `Vector dimension mismatch: expected ${expectedDimensions}, got ${vector.length}`,
    };
  }

  for (let i = 0; i < vector.length; i++) {
    if (typeof vector[i] !== 'number' || !isFinite(vector[i])) {
      return {
        valid: false,
        error: `Invalid vector element at index ${i}: must be a finite number`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate vector ID
 *
 * Ensures the ID is a valid, non-empty string.
 *
 * @param id - ID to validate
 * @returns Validation result with error message if invalid
 * @internal
 */
function validateId(id: unknown): { valid: boolean; error?: string } {
  if (typeof id !== 'string') {
    return { valid: false, error: 'ID must be a string' };
  }

  if (id.trim().length === 0) {
    return { valid: false, error: 'ID cannot be empty' };
  }

  if (id.length > 256) {
    return { valid: false, error: 'ID must be at most 256 characters' };
  }

  // Check for valid characters (alphanumeric, dash, underscore, colon)
  if (!/^[\w\-:./]+$/.test(id)) {
    return {
      valid: false,
      error: 'ID can only contain alphanumeric characters, dashes, underscores, colons, dots, and slashes',
    };
  }

  return { valid: true };
}

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
export function createVectorUpsertHandler(
  vectorStore?: EnhancedVectorStore
): ToolHandler {
  return async (params: Record<string, unknown>): Promise<ToolResult> => {
    const startTime = Date.now();
    const typedParams = params as unknown as VectorUpsertParams;
    const { id, vector, metadata = {}, namespace } = typedParams;

    try {
      // Validate ID
      const idValidation = validateId(id);
      if (!idValidation.valid) {
        return {
          success: false,
          error: idValidation.error,
          metadata: { executionTime: Date.now() - startTime },
        };
      }

      // Check vector store availability
      if (!vectorStore) {
        return {
          success: false,
          error: 'Vector store not initialized. Configure vector storage first.',
          metadata: { executionTime: Date.now() - startTime },
        };
      }

      // Ensure vector store is ready
      if (!vectorStore.isReady()) {
        await vectorStore.initialize();
      }

      // Get expected dimensions
      const config = vectorStore.getConfig();
      const expectedDimensions = config.index.dimensions;

      // Validate vector
      const vectorValidation = validateVector(vector, expectedDimensions);
      if (!vectorValidation.valid) {
        return {
          success: false,
          error: vectorValidation.error,
          metadata: { executionTime: Date.now() - startTime },
        };
      }

      // Check if vector exists (for upsert behavior)
      const existing = await vectorStore.get(id);
      const isUpdate = existing !== null;

      // If updating, delete the old vector first
      if (isUpdate) {
        await vectorStore.delete(id);
      }

      // Build metadata with namespace
      const fullMetadata: Record<string, unknown> = {
        ...metadata,
        updatedAt: new Date().toISOString(),
      };

      if (namespace) {
        fullMetadata.namespace = namespace;
      }

      // Insert the vector
      await vectorStore.insert({
        id,
        vector: vector as number[],
        metadata: fullMetadata,
      });

      // Get updated stats
      const stats = vectorStore.getStats();

      return {
        success: true,
        data: {
          id,
          operation: isUpdate ? 'updated' : 'inserted',
          dimensions: vector.length,
          hasMetadata: Object.keys(metadata).length > 0,
          namespace: namespace || 'default',
        },
        metadata: {
          executionTime: Date.now() - startTime,
          totalVectors: stats.totalVectors,
          wasUpdate: isUpdate,
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
