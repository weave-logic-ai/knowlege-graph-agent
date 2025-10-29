/**
 * Chunk Manager
 *
 * Orchestrator for the chunking pipeline.
 * Coordinates document parsing, chunking strategy selection, and storage.
 */

import { parseDocument, extractMetadata, extractDocId, extractContentType } from './document-parser.js';
import { StrategySelector } from './strategy-selector.js';
import { ChunkStorage } from './chunk-storage.js';
import { createLogger } from '../utils/logger.js';
import type { ChunkingConfig, ChunkingResult, ContentType, Chunk } from './types.js';

const logger = createLogger('chunking:manager');

/**
 * Custom error for chunking operations
 */
export class ChunkingError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ChunkingError';
  }
}

/**
 * Chunking request
 */
export interface ChunkingRequest {
  content: string;
  sourcePath: string;
  contentType?: ContentType;
  config?: ChunkingConfig;
}

/**
 * Chunking response
 */
export interface ChunkingResponse {
  result: ChunkingResult;
  metadata: Record<string, unknown>;
}

export class ChunkManager {
  private strategySelector: StrategySelector;
  private storage: ChunkStorage;

  constructor(storagePath: string) {
    this.strategySelector = new StrategySelector();
    this.storage = new ChunkStorage(storagePath);

    logger.info('Chunk manager initialized', { storagePath });
  }

  /**
   * Process document and create chunks
   *
   * @param request - Chunking request
   * @returns Chunking response with chunks and metadata
   */
  async processDocument(request: ChunkingRequest): Promise<ChunkingResponse> {
    const startTime = Date.now();

    try {
      logger.info('Processing document', { path: request.sourcePath });

      // 1. Parse document
      const parsed = parseDocument(request.content);
      const metadata = extractMetadata(parsed);

      // 2. Determine content type
      const contentType = request.contentType || extractContentType(parsed) as ContentType || 'document';
      logger.debug('Determined content type', { contentType });

      // 3. Select chunking strategy
      const chunker = this.strategySelector.selectStrategy(contentType);

      // 4. Prepare chunking config
      const docId = extractDocId(parsed) || this.generateDocId(request.sourcePath);
      const config: ChunkingConfig = {
        ...chunker.getDefaultConfig(),
        ...request.config,
        docId,
        sourcePath: request.sourcePath,
      };

      // 5. Validate config
      const validation = chunker.validate(config);
      if (!validation.valid) {
        throw new ChunkingError(`Invalid chunking config: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        logger.warn('Chunking config warnings', { warnings: validation.warnings });
      }

      // 6. Chunk document
      const result = await chunker.chunk(parsed.content, config);

      // 7. Store chunks and relationships
      this.storage.storeChunks(result.chunks);
      this.storeChunkRelationships(result.chunks);

      const durationMs = Date.now() - startTime;

      logger.info('Document processed successfully', {
        path: request.sourcePath,
        docId,
        contentType,
        chunks: result.chunks.length,
        duration: durationMs,
      });

      return {
        result,
        metadata: {
          ...metadata,
          contentType,
          docId,
          processingTime: durationMs,
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to process document', err, { path: request.sourcePath });
      throw new ChunkingError(`Failed to process document: ${request.sourcePath}`, err);
    }
  }

  /**
   * Get chunks for a document
   *
   * @param docId - Document ID
   * @returns Array of chunks
   */
  getChunks(docId: string): Chunk[] {
    try {
      return this.storage.getChunksByDocId(docId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get chunks', err, { docId });
      throw new ChunkingError(`Failed to get chunks for document: ${docId}`, err);
    }
  }

  /**
   * Search chunks using full-text search
   *
   * @param query - Search query
   * @param limit - Maximum results
   * @returns Array of matching chunks
   */
  searchChunks(query: string, limit = 10): Chunk[] {
    try {
      return this.storage.searchChunks(query, limit);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to search chunks', err, { query });
      throw new ChunkingError('Failed to search chunks', err);
    }
  }

  /**
   * Delete chunks for a document
   *
   * @param docId - Document ID
   */
  deleteChunks(docId: string): void {
    try {
      this.storage.deleteChunksByDocId(docId);
      logger.info('Deleted chunks', { docId });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete chunks', err, { docId });
      throw new ChunkingError(`Failed to delete chunks for document: ${docId}`, err);
    }
  }

  /**
   * Get chunking statistics
   */
  getStats(): {
    totalChunks: number;
    totalDocs: number;
    totalRelationships: number;
    dbSize: number;
  } {
    return this.storage.getStats();
  }

  /**
   * Get available chunking strategies
   */
  getAvailableStrategies(): ContentType[] {
    return this.strategySelector.getAvailableStrategies();
  }

  /**
   * Close chunk manager and release resources
   */
  close(): void {
    this.storage.close();
    logger.info('Chunk manager closed');
  }

  /**
   * Store chunk relationships (parent, child, previous, next)
   */
  private storeChunkRelationships(chunks: Chunk[]): void {
    for (const chunk of chunks) {
      const metadata = chunk.metadata;

      if (metadata.parent_chunk) {
        this.storage.storeRelationship(chunk.id, metadata.parent_chunk, 'parent');
      }

      if (metadata.child_chunks) {
        for (const childId of metadata.child_chunks) {
          this.storage.storeRelationship(chunk.id, childId, 'child');
        }
      }

      if (metadata.previous_chunk) {
        this.storage.storeRelationship(chunk.id, metadata.previous_chunk, 'previous');
      }

      if (metadata.next_chunk) {
        this.storage.storeRelationship(chunk.id, metadata.next_chunk, 'next');
      }

      if (metadata.related_chunks) {
        for (const relatedId of metadata.related_chunks) {
          this.storage.storeRelationship(chunk.id, relatedId, 'related');
        }
      }
    }

    logger.debug('Stored chunk relationships', { chunks: chunks.length });
  }

  /**
   * Generate document ID from source path
   */
  private generateDocId(sourcePath: string): string {
    // Simple hash function for generating doc IDs
    const hash = sourcePath.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);

    return `doc-${Math.abs(hash).toString(36)}`;
  }
}

/**
 * Create a chunk manager instance
 */
export function createChunkManager(storagePath: string): ChunkManager {
  return new ChunkManager(storagePath);
}
