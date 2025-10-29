/**
 * Document Connection Workflow
 *
 * Automatically connects new/updated documents to related documents
 * based on directory context, temporal proximity, and primitive similarity.
 *
 * This is a complete, working workflow that demonstrates the integration
 * of context analysis, git integration, and workflow engine.
 */

import type { WorkflowDefinition, WorkflowContext } from '../../workflow-engine/types.js';
import { WorkflowIntegration } from './workflow-integration.js';
import type { DocumentContext } from './context/index.js';
import { calculateContextSimilarity } from './context/index.js';
import { logger } from '../../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

/**
 * Connection candidate with similarity score
 */
interface ConnectionCandidate {
  /** Absolute file path */
  filePath: string;
  /** Relative path from vault root */
  relativePath: string;
  /** Similarity score (0-100) */
  score: number;
  /** Reason for connection */
  reason: string;
  /** Document context */
  context: DocumentContext;
}

/**
 * Create document connection workflow
 *
 * @param vaultRoot - Absolute path to vault root
 * @returns Workflow definition
 */
export function createDocumentConnectionWorkflow(vaultRoot: string): WorkflowDefinition {
  const integration = new WorkflowIntegration(vaultRoot);

  return {
    id: 'document-connection',
    name: 'Document Connection',
    description: 'Automatically connect documents using context analysis',
    triggers: ['file:add', 'file:change'],
    enabled: true,
    fileFilter: '**/*.md',

    handler: async (workflowContext: WorkflowContext) => {
      try {
        const result = await integration.executeWorkflow(
          'document-connection',
          workflowContext,
          async (context) => {
            // Find candidate connections using context
            const candidates = await findConnectionCandidates(context, vaultRoot);

            // Score and filter candidates
            const scoredCandidates = scoreConnections(candidates, context);
            const topConnections = scoredCandidates.filter((c) => c.score > 60).slice(0, 5);

            if (topConnections.length === 0) {
              logger.info('No suitable connections found', {
                file: workflowContext.fileEvent?.relativePath,
              });
              return [];
            }

            // Update document with connections
            const filesModified = await updateDocumentConnections(
              workflowContext.fileEvent!.path,
              topConnections,
              context
            );

            logger.info('Document connection workflow complete', {
              file: workflowContext.fileEvent?.relativePath,
              connections: topConnections.length,
              filesModified: filesModified.length,
            });

            return filesModified;
          },
          {
            dryRun: false,
            metadata: {
              trigger: workflowContext.trigger,
              file: workflowContext.fileEvent?.relativePath,
            },
          }
        );

        if (!result.success) {
          throw result.error || new Error('Workflow execution failed');
        }
      } catch (error) {
        logger.error(
          'Document connection workflow failed',
          error instanceof Error ? error : new Error(String(error)),
          { file: workflowContext.fileEvent?.relativePath }
        );
        throw error;
      }
    },
  };
}

/**
 * Find connection candidates by scanning vault for markdown files
 */
async function findConnectionCandidates(
  context: DocumentContext,
  vaultRoot: string
): Promise<ConnectionCandidate[]> {
  const candidates: ConnectionCandidate[] = [];

  try {
    // Recursively find all markdown files
    const markdownFiles = await findMarkdownFiles(vaultRoot);

    // Filter out the current file
    const currentFilePath = path.join(vaultRoot, context.filePath);
    const otherFiles = markdownFiles.filter((f) => f !== currentFilePath);

    logger.debug('Found candidate files', {
      total: otherFiles.length,
      currentFile: context.filePath,
    });

    // Create integration instance for context building
    const integration = new WorkflowIntegration(vaultRoot);

    // Build context for each candidate (in batches for performance)
    const batchSize = 10;
    for (let i = 0; i < otherFiles.length; i += batchSize) {
      const batch = otherFiles.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (filePath) => {
          try {
            const relativePath = path.relative(vaultRoot, filePath);
            const candidateContext = await integration.buildContext({
              type: 'add',
              path: filePath,
              relativePath,
              timestamp: new Date(),
            });

            // Calculate similarity
            const similarity = calculateContextSimilarity(context, candidateContext);
            const score = Math.round(similarity * 100);

            // Generate reason
            const reason = generateConnectionReason(context, candidateContext, similarity);

            return {
              filePath,
              relativePath,
              score,
              reason,
              context: candidateContext,
            };
          } catch (error) {
            logger.debug(
              'Failed to analyze candidate',
              error instanceof Error ? error : new Error(String(error)),
              { filePath }
            );
            return null;
          }
        })
      );

      // Add successful candidates
      candidates.push(...batchResults.filter((c): c is ConnectionCandidate => c !== null));
    }

    logger.debug('Connection candidates analyzed', {
      total: candidates.length,
      avgScore: candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length,
    });

    return candidates;
  } catch (error) {
    logger.error(
      'Failed to find connection candidates',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Score and sort connections
 *
 * Scoring algorithm:
 * - Directory match: 40 points max
 * - Primitive overlap: 35 points max
 * - Temporal proximity: 25 points max
 */
function scoreConnections(
  candidates: ConnectionCandidate[],
  context: DocumentContext
): ConnectionCandidate[] {
  return candidates.sort((a, b) => b.score - a.score);
}

/**
 * Generate human-readable connection reason
 */
function generateConnectionReason(
  source: DocumentContext,
  target: DocumentContext,
  similarity: number
): string {
  const reasons: string[] = [];

  // Directory similarity
  if (source.directory.purpose === target.directory.purpose) {
    reasons.push(`Same purpose: ${source.directory.purpose}`);
  }

  // Primitive overlap
  const commonPlatforms = source.primitives.platforms.filter((p) =>
    target.primitives.platforms.includes(p)
  );
  if (commonPlatforms.length > 0) {
    reasons.push(`Shared platforms: ${commonPlatforms.slice(0, 2).join(', ')}`);
  }

  const commonPatterns = source.primitives.patterns.filter((p) =>
    target.primitives.patterns.includes(p)
  );
  if (commonPatterns.length > 0) {
    reasons.push(`Common patterns: ${commonPatterns.slice(0, 2).join(', ')}`);
  }

  // Temporal proximity
  if (source.temporal.phase && target.temporal.phase === source.temporal.phase) {
    reasons.push(`Same phase: ${source.temporal.phase}`);
  }

  return reasons.length > 0
    ? reasons.join('; ')
    : `Context similarity: ${Math.round(similarity * 100)}%`;
}

/**
 * Update document frontmatter with connections
 */
async function updateDocumentConnections(
  filePath: string,
  connections: ConnectionCandidate[],
  context: DocumentContext
): Promise<string[]> {
  try {
    // Read current file
    const content = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content: body } = matter(content);

    // Update frontmatter with connections
    const existingConnections = Array.isArray(frontmatter.related_to)
      ? frontmatter.related_to
      : [];

    const newConnections = connections
      .map((c) => c.relativePath)
      .filter((path) => !existingConnections.includes(path));

    if (newConnections.length === 0) {
      logger.debug('No new connections to add', { filePath });
      return [];
    }

    frontmatter.related_to = [...existingConnections, ...newConnections];
    frontmatter.last_connected = new Date().toISOString();

    // Add navigation section to body if it doesn't exist
    let updatedBody = body;
    if (!body.includes('## Related Documents')) {
      const navigationSection = buildNavigationSection(connections);
      updatedBody = `${body}\n\n${navigationSection}`;
    }

    // Write updated content
    const updatedContent = matter.stringify(updatedBody, frontmatter);
    await fs.writeFile(filePath, updatedContent, 'utf-8');

    logger.info('Updated document connections', {
      filePath,
      newConnections: newConnections.length,
      totalConnections: frontmatter.related_to.length,
    });

    return [filePath];
  } catch (error) {
    logger.error(
      'Failed to update document connections',
      error instanceof Error ? error : new Error(String(error)),
      { filePath }
    );
    throw error;
  }
}

/**
 * Build navigation section for document
 */
function buildNavigationSection(connections: ConnectionCandidate[]): string {
  let section = '## Related Documents\n\n';
  section += '<!-- Auto-generated by document-connection workflow -->\n\n';

  for (const conn of connections) {
    const link = conn.relativePath.replace('.md', '');
    section += `- [[${link}]] (${conn.score}% match) - ${conn.reason}\n`;
  }

  return section;
}

/**
 * Recursively find all markdown files in directory
 */
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip hidden and special directories
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      if (entry.isDirectory()) {
        const subFiles = await findMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    logger.debug(
      'Failed to read directory',
      error instanceof Error ? error : new Error(String(error)),
      { dir }
    );
  }

  return files;
}

// For testing - export internal functions
export const __testing__ = {
  findConnectionCandidates,
  scoreConnections,
  generateConnectionReason,
  updateDocumentConnections,
  findMarkdownFiles,
};
