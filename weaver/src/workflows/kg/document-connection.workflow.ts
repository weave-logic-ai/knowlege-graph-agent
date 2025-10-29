/**
 * Document Connection Workflow - Workflow DevKit Version
 *
 * Phase 15 POC: Using 'use workflow' and 'use step' directives
 *
 * This workflow automatically connects documents using:
 * - Directory context analysis
 * - Content primitive overlap
 * - Temporal proximity
 *
 * Observability:
 * - View execution: npx workflow inspect runs
 * - Each step is tracked independently
 * - Durable execution survives restarts
 */

import path from 'path';

// Note: All imports moved inside steps to avoid VM context issues

/**
 * Connection candidate result
 */
interface ConnectionCandidate {
  filePath: string;
  relativePath: string;
  score: number;
  reason: string;
}

/**
 * Workflow input parameters
 */
export interface DocumentConnectionInput {
  /** Absolute path to the file that changed */
  filePath: string;
  /** Vault root directory */
  vaultRoot: string;
  /** Event type (add, change, delete) */
  eventType: 'add' | 'change';
  /** Dry run mode (don't modify files) */
  dryRun?: boolean;
}

/**
 * Workflow result
 */
export interface DocumentConnectionResult {
  success: boolean;
  connections: number;
  filesModified: string[];
  duration: number;
  error?: string;
}

/**
 * Document Connection Workflow
 *
 * Workflow DevKit entry point - uses 'use workflow' directive
 *
 * IMPORTANT: Main workflow function must be async (plugin requirement).
 * All async operations must be in step() calls (no direct awaits in workflow body).
 * Use dynamic imports inside steps to avoid VM context require() issues.
 *
 * @param input - Workflow parameters
 * @returns Connection result
 */
export async function documentConnectionWorkflow(
  input: DocumentConnectionInput
): Promise<DocumentConnectionResult> {
  'use workflow';

  const startTime = Date.now();

  // Step 1: Build document context
  const context = step('build-context', async () => {
    'use step';

    const logger = await import('../../utils/logger.js').then(m => m.logger);
    const { WorkflowIntegration } = await import('./workflow-integration.js');
    const path = await import('path');

    logger.info('Building document context', { file: input.filePath });

    const integration = new WorkflowIntegration(input.vaultRoot);
    const relativePath = path.relative(input.vaultRoot, input.filePath);

    const documentContext = await integration.buildContext({
      type: input.eventType,
      path: input.filePath,
      absolutePath: input.filePath,
      relativePath,
      timestamp: new Date(),
    });

    logger.info('Context built successfully', {
      file: relativePath,
      primitives: documentContext.primitives.platforms.length,
    });

    return { documentContext, relativePath };
  });

  // Step 2: Find candidate connections
  const candidates = step('find-candidates', async () => {
    'use step';

    const logger = await import('../../utils/logger.js').then(m => m.logger);
    const { WorkflowIntegration } = await import('./workflow-integration.js');
    const { calculateContextSimilarity } = await import('./context/index.js');
    const path = await import('path');
    const fs = await import('fs/promises');

    logger.info('Finding connection candidates');

    // Find all markdown files
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

    const markdownFiles = await findMarkdownFiles(input.vaultRoot);
    const otherFiles = markdownFiles.filter((f) => f !== input.filePath);

    logger.info('Found candidate files', { total: otherFiles.length });

    // Analyze candidates (limit to 20)
    const integration = new WorkflowIntegration(input.vaultRoot);
    const analysisLimit = Math.min(20, otherFiles.length);
    const candidateResults: ConnectionCandidate[] = [];

    for (let i = 0; i < analysisLimit; i++) {
      const filePath = otherFiles[i];
      try {
        const relativePath = path.relative(input.vaultRoot, filePath);
        const candidateContext = await integration.buildContext({
          type: 'add',
          path: filePath,
          absolutePath: filePath,
          relativePath,
          timestamp: new Date(),
        });

        const similarity = calculateContextSimilarity(
          context.documentContext,
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
  });

  // Step 3: Update document with connections
  const filesModified = step('update-connections', async () => {
    'use step';

    const logger = await import('../../utils/logger.js').then(m => m.logger);
    const fs = await import('fs/promises');
    const matter = (await import('gray-matter')).default;

    if (input.dryRun) {
      logger.info('Dry run - skipping file updates');
      return [];
    }

    if (candidates.length === 0) {
      logger.info('No connections to add');
      return [];
    }

    logger.info('Updating document connections', {
      file: input.filePath,
      connections: candidates.length,
    });

    // Read current file
    const content = await fs.readFile(input.filePath, 'utf-8');
    const { data: frontmatter, content: body } = matter(content);

    // Update frontmatter
    const existingConnections = Array.isArray(frontmatter.related_to)
      ? frontmatter.related_to
      : [];

    const newConnections = candidates
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
    await fs.writeFile(input.filePath, updatedContent, 'utf-8');

    logger.info('Document updated successfully', {
      newConnections: newConnections.length,
      totalConnections: frontmatter.related_to.length,
    });

    return [input.filePath];
  });

  // Return success result (synchronous)
  const duration = Date.now() - startTime;
  return {
    success: true,
    connections: candidates.length,
    filesModified,
    duration,
  };
}

// Helper function to declare step type for Workflow DevKit
declare function step<T>(name: string, fn: () => Promise<T>): T;

/**
 * POC Test helper - Run workflow with test file
 */
export async function runPOCTest(vaultRoot: string, testFile: string) {
  console.log('\n🧪 Running Phase 15 POC Test\n');
  console.log(`Vault: ${vaultRoot}`);
  console.log(`Test file: ${testFile}\n`);

  const result = await documentConnectionWorkflow({
    filePath: path.join(vaultRoot, testFile),
    vaultRoot,
    eventType: 'change',
    dryRun: true, // Don't modify files in POC test
  });

  console.log('\n📊 POC Test Results:\n');
  console.log(`✅ Success: ${result.success}`);
  console.log(`🔗 Connections found: ${result.connections}`);
  console.log(`📝 Files modified: ${result.filesModified.length}`);
  console.log(`⏱️  Duration: ${result.duration}ms`);

  if (result.error) {
    console.log(`❌ Error: ${result.error}`);
  }

  console.log('\n📊 View execution details: npx workflow inspect runs\n');

  return result;
}
