/**
 * Vector DB Workflows
 *
 * Workflow definitions for vector database operations:
 * - Document chunking
 * - Embedding generation
 * - Vector indexing
 * - Similarity search
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import type { WorkflowDefinition, WorkflowContext } from '../workflow-engine/index.js';
import { markdownParser } from '../workflows/learning-loop/markdown-parser.js';
import { StrategySelector } from '../chunking/index.js';
import type { ContentType, ChunkingConfig } from '../chunking/index.js';
import type { Chunk as ChunkType } from '../chunking/index.js';
import { BatchEmbeddingProcessor, FileVectorStorage } from '../embeddings/index.js';
import type { EmbeddingModelType } from '../embeddings/index.js';

/**
 * Chunking Workflow
 *
 * Triggered when chunking-strategy.md status changes to "completed"
 * Chunks the document according to user-selected strategy
 */
export const chunkingWorkflow: WorkflowDefinition = {
  id: 'vector-db:chunking',
  name: 'Document Chunking',
  description: 'Chunks documents according to strategy defined in markdown',
  triggers: ['file:change'],
  enabled: true,
  fileFilter: '.weaver/vectors/sources/**/chunking-strategy.md',

  handler: async (context: WorkflowContext) => {
    const { fileEvent } = context;
    if (!fileEvent) return;

    try {
      // Parse the chunking strategy markdown
      const parsed = await markdownParser.parse(fileEvent.absolutePath);

      // Only proceed if status is "completed"
      if (parsed.frontmatter.status !== 'completed') {
        logger.debug('Chunking strategy not completed yet', {
          file: fileEvent.relativePath,
          status: parsed.frontmatter.status,
        });
        return;
      }

      // Determine content type from frontmatter
      const contentType = (parsed.frontmatter.content_type || 'semantic') as ContentType;

      logger.info('🔪 Starting chunking workflow', {
        workflow: 'vector-db:chunking',
        docId: parsed.frontmatter.doc_id,
        contentType,
      });

      // Select appropriate chunking strategy
      const selector = new StrategySelector();
      const chunker = selector.selectStrategy(contentType);

      // Read source document
      const documentPath = parsed.frontmatter.source_path;
      const document = await fs.readFile(documentPath, 'utf-8');

      // Extract user input
      const userInput = markdownParser.extractStructuredInput(parsed);

      // Build chunking configuration (using frontmatter or defaults)
      const config: ChunkingConfig = {
        docId: parsed.frontmatter.doc_id,
        sourcePath: documentPath,
        maxTokens: (userInput as any).maxTokens || parsed.frontmatter.max_tokens || 512,
        overlap: (userInput as any).overlap || parsed.frontmatter.overlap || 50,
        includeContext: (userInput as any).includeContext !== false,
        contextWindowSize: (userInput as any).contextWindowSize || 50,
        // Strategy-specific settings
        eventBoundaries: (userInput as any).eventBoundaries,
        temporalLinks: (userInput as any).temporalLinks,
        similarityThreshold: (userInput as any).similarityThreshold,
        minChunkSize: (userInput as any).minChunkSize,
        decisionKeywords: (userInput as any).decisionKeywords,
        includeAlternatives: (userInput as any).includeAlternatives,
        stepDelimiters: (userInput as any).stepDelimiters,
        includePrerequisites: (userInput as any).includePrerequisites,
        includeOutcomes: (userInput as any).includeOutcomes,
      };

      // Apply chunking strategy
      const result = await chunker.chunk(document, config);

      logger.info('📦 Document chunked successfully', {
        workflow: 'vector-db:chunking',
        docId: parsed.frontmatter.doc_id,
        strategy: chunker.name,
        chunkCount: result.chunks.length,
        avgChunkSize: Math.round(result.stats.avgChunkSize),
        duration: result.stats.durationMs,
      });

      // Generate chunk markdown files
      const chunkDir = path.join(
        path.dirname(fileEvent.absolutePath),
        'chunks'
      );
      await fs.mkdir(chunkDir, { recursive: true });

      for (const chunk of result.chunks) {
        const chunkMarkdown = generateChunkMarkdown(chunk);

        const chunkFilename = `chunk-${String(chunk.metadata.index + 1).padStart(3, '0')}.md`;
        const chunkPath = path.join(chunkDir, chunkFilename);
        await fs.writeFile(chunkPath, chunkMarkdown);
      }

      // Update document metadata
      const metadataPath = path.join(
        path.dirname(fileEvent.absolutePath),
        'metadata.md'
      );
      await updateDocumentMetadata(metadataPath, {
        status: 'chunked',
        chunkCount: result.chunks.length,
        chunkedAt: new Date().toISOString(),
      });

      logger.info('✅ Chunking workflow completed', {
        workflow: 'vector-db:chunking',
        docId: parsed.frontmatter.doc_id,
        chunkCount: result.chunks.length,
      });

      // Automatically trigger embedding workflow
      // This will be picked up by the embedding workflow file watcher
      const chunkIds = result.chunks.map(c => c.metadata.chunk_id);
      await generateEmbeddingWorkflowTemplate(
        parsed.frontmatter.doc_id,
        chunkIds
      );

    } catch (error) {
      logger.error('Chunking workflow failed', error as Error, {
        workflow: 'vector-db:chunking',
        file: fileEvent.relativePath,
      });
      throw error;
    }
  },
};

/**
 * Embedding Workflow
 *
 * Triggered when embedding-workflow.md status changes to "completed"
 * Generates embeddings for chunks using selected model
 */
export const embeddingWorkflow: WorkflowDefinition = {
  id: 'vector-db:embedding',
  name: 'Embedding Generation',
  description: 'Generates vector embeddings for document chunks',
  triggers: ['file:change'],
  enabled: true,
  fileFilter: '.weaver/vectors/workflows/embedding-*.md',

  handler: async (context: WorkflowContext) => {
    const { fileEvent } = context;
    if (!fileEvent) return;

    try {
      // Parse the embedding workflow markdown
      const parsed = await markdownParser.parse(fileEvent.absolutePath);

      // Only proceed if status is "completed"
      if (parsed.frontmatter.status !== 'completed') {
        return;
      }

      logger.info('🧠 Starting embedding workflow', {
        workflow: 'vector-db:embedding',
        batchId: parsed.frontmatter.batch_id,
        chunkCount: parsed.frontmatter.chunk_ids?.length || 0,
      });

      // Extract user input
      const userInput = markdownParser.extractStructuredInput(parsed);

      // Get model type from user selection
      const selectedModel = (userInput as any).selectedModel || 'all-MiniLM-L6-v2';
      const modelType = selectedModel as EmbeddingModelType;

      // Load chunks from chunk files
      const chunkIds = parsed.frontmatter.chunk_ids || [];
      const docId = parsed.frontmatter.doc_id;
      const sourceDir = path.dirname(path.dirname(fileEvent.absolutePath));
      const chunksDir = path.join(sourceDir, docId, 'chunks');

      const chunks: Array<{ id: string; content: string }> = [];
      for (const chunkId of chunkIds) {
        try {
          const chunkFiles = await fs.readdir(chunksDir);
          const chunkFile = chunkFiles.find(f => f.includes(chunkId) || f.startsWith('chunk-'));

          if (chunkFile) {
            const chunkPath = path.join(chunksDir, chunkFile);
            const chunkData = await fs.readFile(chunkPath, 'utf-8');
            const chunkParsed = await markdownParser.parse(chunkPath);

            chunks.push({
              id: chunkParsed.frontmatter.chunk_id || chunkId,
              content: chunkParsed.content || chunkData,
            });
          }
        } catch (error) {
          logger.warn('Failed to load chunk', { chunkId, error: (error as Error).message });
        }
      }

      if (chunks.length === 0) {
        logger.warn('No chunks found for embedding', {
          workflow: 'vector-db:embedding',
          chunkIds,
        });
        return;
      }

      // Process embeddings in batches
      const batchSize = (userInput as any).batchSize || 32;
      const processor = new BatchEmbeddingProcessor();

      const result = await processor.process({
        chunks,
        modelType,
        batchSize,
        onProgress: (completed, total) => {
          logger.debug('Embedding progress', {
            workflow: 'vector-db:embedding',
            completed,
            total,
            progress: `${((completed / total) * 100).toFixed(1)}%`,
          });
        },
      });

      logger.info('✅ Embeddings generated successfully', {
        workflow: 'vector-db:embedding',
        embeddingCount: result.embeddings.length,
        dimensions: result.stats.dimensions,
        avgProcessingTime: `${result.stats.avgProcessingTime.toFixed(2)}ms`,
        errors: result.errors.length,
      });

      // Store embeddings using vector storage
      const embeddingsDir = path.join(sourceDir, docId, 'embeddings');
      const storage = new FileVectorStorage({
        storageDir: embeddingsDir,
        indexing: true,
      });

      await storage.storeBatch(result.embeddings);

      // Update chunk files with embedding references
      for (const embedding of result.embeddings) {
        await updateChunkEmbedding(embedding.chunkId, embedding.id, chunksDir);
      }

      // Automatically trigger indexing workflow
      const embeddingIds = result.embeddings.map(e => e.id);
      await generateIndexingWorkflowTemplate(docId, embeddingIds, sourceDir);

    } catch (error) {
      logger.error('Embedding workflow failed', error as Error, {
        workflow: 'vector-db:embedding',
        file: fileEvent.relativePath,
      });
      throw error;
    }
  },
};

/**
 * Indexing Workflow
 *
 * Triggered when indexing-workflow.md status changes to "completed"
 * Builds vector index for similarity search
 */
export const indexingWorkflow: WorkflowDefinition = {
  id: 'vector-db:indexing',
  name: 'Vector Indexing',
  description: 'Builds vector index for efficient similarity search',
  triggers: ['file:change'],
  enabled: true,
  fileFilter: '.weaver/vectors/workflows/indexing-*.md',

  handler: async (context: WorkflowContext) => {
    const { fileEvent } = context;
    if (!fileEvent) return;

    try {
      // Parse the indexing workflow markdown
      const parsed = await markdownParser.parse(fileEvent.absolutePath);

      if (parsed.frontmatter.status !== 'completed') {
        return;
      }

      logger.info('🗂️  Starting indexing workflow', {
        workflow: 'vector-db:indexing',
        embeddingCount: parsed.frontmatter.embedding_ids?.length || 0,
      });

      // Extract user input
      const userInput = markdownParser.extractStructuredInput(parsed);

      // Load all vectors
      const embeddingIds = parsed.frontmatter.embedding_ids || [];
      const vectors = await Promise.all(
        embeddingIds.map((id: string) => loadVector(id))
      );

      // Build index
      const indexType = (userInput as any).indexType || 'hnsw';
      const vectorIndex = await buildVectorIndex(vectors, indexType);

      logger.info('📊 Index built successfully', {
        workflow: 'vector-db:indexing',
        vectorCount: vectors.length,
        indexType,
      });

      // Compute similarity neighbors
      const neighbors = await Promise.all(
        vectors.map(async (vector) => {
          const similar = await vectorIndex.search(vector.vector, 5);
          return { vectorId: vector.id, neighbors: similar };
        })
      );

      // Store index
      const indexDir = '.weaver/vectors/indexes';
      await fs.mkdir(indexDir, { recursive: true });

      const indexMarkdown = await generateIndexMarkdown(
        vectorIndex,
        vectors,
        neighbors
      );
      await fs.writeFile(
        path.join(indexDir, 'primary-index.md'),
        indexMarkdown
      );

      // Update embeddings with neighbor links
      for (const { vectorId, neighbors: similarVectors } of neighbors) {
        await updateEmbeddingNeighbors(vectorId, similarVectors);
      }

      logger.info('✅ Indexing workflow completed', {
        workflow: 'vector-db:indexing',
        vectorCount: vectors.length,
      });

    } catch (error) {
      logger.error('Indexing workflow failed', error as Error, {
        workflow: 'vector-db:indexing',
        file: fileEvent.relativePath,
      });
      throw error;
    }
  },
};

/**
 * Get all vector DB workflows
 */
export function getVectorDBWorkflows(): WorkflowDefinition[] {
  return [
    chunkingWorkflow,
    embeddingWorkflow,
    indexingWorkflow,
  ];
}

// ============================================================================
// Helper Functions (Placeholder implementations)
// ============================================================================

function generateChunkMarkdown(chunk: ChunkType): string {
  const meta = chunk.metadata;

  // Build frontmatter
  const frontmatter = {
    chunk_id: meta.chunk_id,
    doc_id: meta.doc_id,
    source_path: meta.source_path,
    index: meta.index,
    content_type: meta.content_type,
    memory_level: meta.memory_level,
    strategy: meta.strategy,
    size_tokens: meta.size_tokens,
    overlap_tokens: meta.overlap_tokens,
    boundary_type: meta.boundary_type,
    created_at: meta.created_at.toISOString(),
    ...(meta.previous_chunk && { previous_chunk: meta.previous_chunk }),
    ...(meta.next_chunk && { next_chunk: meta.next_chunk }),
    ...(meta.learning_session_id && { learning_session_id: meta.learning_session_id }),
    ...(meta.sop_id && { sop_id: meta.sop_id }),
    ...(meta.stage && { stage: meta.stage }),
    ...(meta.concepts && meta.concepts.length > 0 && { concepts: meta.concepts }),
  };

  const frontmatterYaml = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`;
      }
      return `${key}: ${typeof value === 'string' ? `"${value}"` : value}`;
    })
    .join('\n');

  // Build markdown
  let markdown = `---\n${frontmatterYaml}\n---\n\n`;
  markdown += `# Chunk ${meta.index + 1}\n\n`;

  if (meta.context_before) {
    markdown += `## Context Before\n\n${meta.context_before}\n\n---\n\n`;
  }

  markdown += `## Content\n\n${chunk.content}\n\n`;

  if (meta.context_after) {
    markdown += `---\n\n## Context After\n\n${meta.context_after}\n\n`;
  }

  return markdown;
}

async function updateDocumentMetadata(
  metadataPath: string,
  updates: Record<string, any>
): Promise<void> {
  // TODO: Update metadata markdown file
}

async function generateEmbeddingWorkflowTemplate(
  docId: string,
  chunkIds: string[]
): Promise<void> {
  // TODO: Generate embedding workflow markdown template
}

async function updateChunkEmbedding(
  chunkId: string,
  embeddingId: string,
  chunksDir: string
): Promise<void> {
  try {
    const chunkFiles = await fs.readdir(chunksDir);
    const chunkFile = chunkFiles.find(f => f.includes(chunkId));

    if (chunkFile) {
      const chunkPath = path.join(chunksDir, chunkFile);
      const chunkData = await fs.readFile(chunkPath, 'utf-8');

      // Update frontmatter with embedding_id
      const updated = chunkData.replace(
        /^---\n/,
        `---\nembedding_id: "${embeddingId}"\n`
      );

      await fs.writeFile(chunkPath, updated);
    }
  } catch (error) {
    logger.warn('Failed to update chunk with embedding reference', {
      chunkId,
      embeddingId,
      error: (error as Error).message,
    });
  }
}

async function generateIndexingWorkflowTemplate(
  docId: string,
  embeddingIds: string[],
  sourceDir: string
): Promise<void> {
  const workflowsDir = path.join(sourceDir, 'workflows');
  await fs.mkdir(workflowsDir, { recursive: true });

  const template = `---
status: pending
doc_id: "${docId}"
embedding_ids: ${JSON.stringify(embeddingIds)}
created_at: ${new Date().toISOString()}
---

# Vector Indexing Workflow

**Document**: ${docId}
**Embeddings**: ${embeddingIds.length} vectors ready for indexing

## Index Configuration

- **Index type**: HNSW (Hierarchical Navigable Small World)
- **Similarity metric**: Cosine similarity
- **Build neighbors**: Yes (top 5 per vector)

## Completion

Set status to "completed" to trigger indexing:

\`\`\`yaml
status: completed
\`\`\`
`;

  const workflowPath = path.join(workflowsDir, `indexing-${docId}.md`);
  await fs.writeFile(workflowPath, template);

  logger.info('Indexing workflow template created', {
    docId,
    embeddingCount: embeddingIds.length,
    workflowPath,
  });
}

async function loadVector(embeddingId: string): Promise<any> {
  // TODO: Load vector from file
  return { id: embeddingId, vector: [] };
}

async function buildVectorIndex(vectors: any[], indexType: string): Promise<any> {
  // TODO: Build vector index
  return {
    search: async (query: number[], k: number) => {
      // Placeholder search logic
      return [];
    },
  };
}

async function generateIndexMarkdown(
  index: any,
  vectors: any[],
  neighbors: any[]
): Promise<string> {
  // TODO: Generate index markdown from template
  return '';
}

async function updateEmbeddingNeighbors(
  vectorId: string,
  neighbors: any[]
): Promise<void> {
  // TODO: Update embedding markdown with neighbor links
}
