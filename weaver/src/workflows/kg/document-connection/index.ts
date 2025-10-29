/**
 * Document Connection Workflow
 *
 * Automatically connects documents based on context similarity.
 * Follows Workflow DevKit best practices:
 * - Workflow function orchestrates step calls
 * - Steps are separate functions with full Node.js access
 * - Normal imports (no dynamic imports)
 */

import { buildDocumentContext, findConnectionCandidates, updateDocumentConnections } from './steps.js';

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
 * Orchestrates the document connection process:
 * 1. Build document context
 * 2. Find similar documents
 * 3. Update document metadata
 *
 * @param input - Workflow parameters
 * @returns Connection result
 */
export async function documentConnectionWorkflow(
  input: DocumentConnectionInput
): Promise<DocumentConnectionResult> {
  'use workflow';

  const startTime = Date.now();

  try {
    // Step 1: Build document context
    const { documentContext, relativePath } = await buildDocumentContext({
      filePath: input.filePath,
      vaultRoot: input.vaultRoot,
      eventType: input.eventType,
    });

    // Step 2: Find candidate connections
    const candidates = await findConnectionCandidates({
      filePath: input.filePath,
      vaultRoot: input.vaultRoot,
      documentContext,
    });

    // Step 3: Update document with connections
    const filesModified = await updateDocumentConnections({
      filePath: input.filePath,
      candidates,
      dryRun: input.dryRun,
    });

    const duration = Date.now() - startTime;

    return {
      success: true,
      connections: candidates.length,
      filesModified,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      connections: 0,
      filesModified: [],
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
