/**
 * Document Connection Steps
 *
 * Step functions have full Node.js runtime access and automatic retry.
 */

import { logger } from '../../../utils/logger.js';
import { WorkflowIntegration } from '../workflow-integration.js';
import { calculateContextSimilarity } from '../context/index.js';
import path from 'path';
import fs from 'fs/promises';
import matter from 'gray-matter';
import type { DocumentContext } from '../context/index.js';

/**
 * Connection candidate result
 */
export interface ConnectionCandidate {
  filePath: string;
  relativePath: string;
  score: number;
  reason: string;
}

/**
 * Step 1: Build document context from file
 */
export async function buildDocumentContext(params: {
  filePath: string;
  vaultRoot: string;
  eventType: 'add' | 'change';
}): Promise<{ documentContext: DocumentContext; relativePath: string }> {
  'use step';

  logger.info('Building document context', { file: params.filePath });

  const integration = new WorkflowIntegration(params.vaultRoot);
  const relativePath = path.relative(params.vaultRoot, params.filePath);

  const documentContext = await integration.buildContext({
    type: params.eventType,
    path: params.filePath,
    absolutePath: params.filePath,
    relativePath,
    timestamp: new Date(),
  });

  logger.info('Context built successfully', {
    file: relativePath,
    primitives: documentContext.primitives.platforms.length,
  });

  return { documentContext, relativePath };
}

/**
 * Step 2: Find candidate connections based on context similarity
 */
export async function findConnectionCandidates(params: {
  filePath: string;
  vaultRoot: string;
  documentContext: DocumentContext;
}): Promise<ConnectionCandidate[]> {
  'use step';

  logger.info('Finding connection candidates');

  // Find all markdown files in vault
  async function findMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
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
      // Silently skip inaccessible directories
    }
    return files;
  }

  const markdownFiles = await findMarkdownFiles(params.vaultRoot);
  const otherFiles = markdownFiles.filter((f) => f !== params.filePath);

  logger.info('Found candidate files', { total: otherFiles.length });

  // Analyze candidates (limit to 20 for performance)
  const integration = new WorkflowIntegration(params.vaultRoot);
  const analysisLimit = Math.min(20, otherFiles.length);
  const candidateResults: ConnectionCandidate[] = [];

  for (let i = 0; i < analysisLimit; i++) {
    const filePath = otherFiles[i];
    try {
      const relativePath = path.relative(params.vaultRoot, filePath);
      const candidateContext = await integration.buildContext({
        type: 'add',
        path: filePath,
        absolutePath: filePath,
        relativePath,
        timestamp: new Date(),
      });

      const similarity = calculateContextSimilarity(
        params.documentContext,
        candidateContext
      );
      const score = Math.round(similarity * 100);

      if (score > 30) {
        candidateResults.push({
          filePath,
          relativePath,
          score,
          reason: `${score}% context similarity`,
        });
      }
    } catch (error) {
      continue;
    }
  }

  // Sort by score and take top 5
  const topCandidates = candidateResults.sort((a, b) => b.score - a.score).slice(0, 5);

  logger.info('Candidates analyzed', {
    total: candidateResults.length,
    top: topCandidates.length,
  });

  return topCandidates;
}

/**
 * Step 3: Update document with connection metadata
 */
export async function updateDocumentConnections(params: {
  filePath: string;
  candidates: ConnectionCandidate[];
  dryRun?: boolean;
}): Promise<string[]> {
  'use step';

  if (params.dryRun) {
    logger.info('Dry run - skipping file updates');
    return [];
  }

  if (params.candidates.length === 0) {
    logger.info('No connections to add');
    return [];
  }

  logger.info('Updating document connections', {
    file: params.filePath,
    connections: params.candidates.length,
  });

  // Read current file
  const content = await fs.readFile(params.filePath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);

  // Update frontmatter
  const existingConnections = Array.isArray(frontmatter.related_to)
    ? frontmatter.related_to
    : [];

  const newConnections = params.candidates
    .map((c) => c.relativePath)
    .filter((path) => !existingConnections.includes(path));

  if (newConnections.length === 0) {
    logger.info('All connections already exist');
    return [];
  }

  frontmatter.related_to = [...existingConnections, ...newConnections];
  frontmatter.last_connected = new Date().toISOString();

  // Write updated content
  const updatedContent = matter.stringify(body, frontmatter);
  await fs.writeFile(params.filePath, updatedContent, 'utf-8');

  logger.info('Document updated successfully', {
    newConnections: newConnections.length,
    totalConnections: frontmatter.related_to.length,
  });

  return [params.filePath];
}
