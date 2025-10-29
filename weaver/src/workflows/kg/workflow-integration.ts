/**
 * Workflow Integration Layer
 *
 * Connects context analysis and git integration with the workflow engine.
 * Provides a unified API for workflows with automatic git branch management,
 * context building, and error handling with rollback.
 */

import { GitIntegration } from './git/index.js';
import { buildDocumentContext, type DocumentContext } from './context/index.js';
import type { FileEvent } from '../../file-watcher/types.js';
import type { WorkflowContext } from '../../workflow-engine/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Options for workflow execution
 */
export interface WorkflowExecutionOptions {
  /** Enable dry-run mode (no git operations) */
  dryRun?: boolean;
  /** Custom branch name (defaults to workflow-{id}-{timestamp}) */
  branchName?: string;
  /** Additional metadata to include in commits */
  metadata?: Record<string, unknown>;
  /** Base branch to create workflow branch from */
  baseBranch?: string;
}

/**
 * Result of workflow execution
 */
export interface WorkflowExecutionResult {
  /** Whether execution succeeded */
  success: boolean;
  /** Git branch name created (if any) */
  branchName?: string;
  /** List of files modified during workflow */
  filesModified: string[];
  /** Document context (if available) */
  context?: DocumentContext;
  /** Error if execution failed */
  error?: Error;
  /** Execution duration in milliseconds */
  duration?: number;
}

/**
 * Integration layer connecting context analysis and git integration
 * with the workflow engine. Provides a unified API for workflows.
 */
export class WorkflowIntegration {
  private vaultRoot: string;
  private git: GitIntegration;

  constructor(vaultRoot: string) {
    this.vaultRoot = vaultRoot;
    this.git = new GitIntegration(vaultRoot);
  }

  /**
   * Prepare for workflow execution:
   * - Build document context
   * - Create git branch (unless dry-run)
   * - Return execution environment
   *
   * @param workflowId - Unique workflow identifier
   * @param workflowContext - Workflow execution context
   * @param options - Execution options
   * @returns Execution environment with context and branch
   */
  async prepareWorkflow(
    workflowId: string,
    workflowContext: WorkflowContext,
    options: WorkflowExecutionOptions = {}
  ): Promise<{
    context: DocumentContext;
    branchName?: string;
  }> {
    // Build document context from file event
    const fileEvent = workflowContext.fileEvent;
    if (!fileEvent) {
      throw new Error('File event required for workflow preparation');
    }

    logger.debug('Preparing workflow', {
      workflowId,
      file: fileEvent.relativePath,
      dryRun: options.dryRun,
    });

    // Build context analysis
    const context = await buildDocumentContext(fileEvent, this.vaultRoot);

    // Create git branch unless dry-run
    let branchName: string | undefined;
    if (!options.dryRun) {
      const baseBranch = options.baseBranch || 'master';
      branchName = await this.git.branches.createWorkflowBranch(
        options.branchName || workflowId,
        baseBranch
      );

      logger.info('Workflow prepared', {
        workflowId,
        branchName,
        file: fileEvent.relativePath,
        purpose: context.directory.purpose,
        domain: context.primitives.domain,
      });
    } else {
      logger.info('Workflow prepared (dry-run)', {
        workflowId,
        file: fileEvent.relativePath,
      });
    }

    return { context, branchName };
  }

  /**
   * Commit workflow changes with metadata
   *
   * @param workflowId - Workflow identifier
   * @param message - Commit message
   * @param files - Files to commit
   * @param metadata - Additional metadata
   * @returns Commit SHA
   */
  async commitWorkflow(
    workflowId: string,
    message: string,
    files: string[],
    metadata?: Record<string, unknown>
  ): Promise<string> {
    logger.debug('Committing workflow changes', {
      workflowId,
      fileCount: files.length,
    });

    const commitSha = await this.git.commit.commit({
      message,
      files,
      workflowId,
      metadata,
    });

    logger.info('Workflow changes committed', {
      workflowId,
      commit: commitSha,
      files: files.length,
    });

    return commitSha;
  }

  /**
   * Cleanup after workflow (success or failure)
   *
   * On success: Keep branch for review
   * On failure: Rollback changes and optionally delete branch
   *
   * @param success - Whether workflow succeeded
   * @param branchName - Branch to cleanup (if any)
   * @param deleteBranchOnFailure - Whether to delete branch on failure
   */
  async cleanupWorkflow(
    success: boolean,
    branchName?: string,
    deleteBranchOnFailure = false
  ): Promise<void> {
    if (!branchName) {
      logger.debug('No branch to cleanup');
      return;
    }

    if (!success) {
      logger.warn('Workflow failed, cleaning up', { branchName });

      // Discard uncommitted changes
      await this.git.rollback.discardChanges();

      // Optionally delete branch
      if (deleteBranchOnFailure) {
        try {
          await this.git.branches.deleteWorkflowBranch(branchName, true);
          logger.info('Deleted workflow branch', { branchName });
        } catch (error) {
          logger.error(
            'Failed to delete workflow branch',
            error instanceof Error ? error : new Error(String(error)),
            { branchName }
          );
        }
      } else {
        logger.info('Workflow branch preserved for review', { branchName });
      }
    } else {
      logger.info('Workflow succeeded, branch ready for review', { branchName });
    }
  }

  /**
   * Execute a workflow with full lifecycle management
   *
   * Handles:
   * - Context building
   * - Git branch creation
   * - Workflow handler execution
   * - Commit creation
   * - Error handling and rollback
   *
   * @param workflowId - Workflow identifier
   * @param workflowContext - Workflow execution context
   * @param handler - Workflow handler function (returns list of modified files)
   * @param options - Execution options
   * @returns Execution result
   */
  async executeWorkflow(
    workflowId: string,
    workflowContext: WorkflowContext,
    handler: (context: DocumentContext) => Promise<string[]>,
    options: WorkflowExecutionOptions = {}
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    let branchName: string | undefined;
    let context: DocumentContext | undefined;
    let filesModified: string[] = [];

    try {
      // Prepare workflow environment
      const prepared = await this.prepareWorkflow(workflowId, workflowContext, options);
      context = prepared.context;
      branchName = prepared.branchName;

      // Execute workflow handler
      logger.info('Executing workflow handler', { workflowId });
      filesModified = await handler(context);

      // Commit changes (unless dry-run)
      if (!options.dryRun && filesModified.length > 0) {
        const message = `${workflowId}: ${workflowContext.fileEvent?.relativePath || 'manual'}`;
        await this.commitWorkflow(workflowId, message, filesModified, options.metadata);
      }

      // Cleanup on success
      await this.cleanupWorkflow(true, branchName);

      const duration = Date.now() - startTime;

      logger.info('Workflow execution succeeded', {
        workflowId,
        filesModified: filesModified.length,
        duration,
        branchName,
      });

      return {
        success: true,
        branchName,
        filesModified,
        context,
        duration,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Cleanup on failure
      await this.cleanupWorkflow(false, branchName, options.dryRun);

      const duration = Date.now() - startTime;

      logger.error('Workflow execution failed', err, {
        workflowId,
        duration,
        branchName,
      });

      return {
        success: false,
        branchName,
        filesModified,
        context,
        error: err,
        duration,
      };
    }
  }

  /**
   * Get current git status
   */
  async getGitStatus(): Promise<{
    currentBranch: string;
    hasChanges: boolean;
    modifiedFiles: string[];
  }> {
    const currentBranch = await this.git.branches.getCurrentBranch();
    const hasChanges = await this.git.commit.hasChanges();
    const modifiedFiles = hasChanges ? await this.git.commit.getModifiedFiles() : [];

    return {
      currentBranch,
      hasChanges,
      modifiedFiles,
    };
  }

  /**
   * Build context for a specific file without executing workflow
   *
   * Useful for testing and analysis
   */
  async buildContext(fileEvent: FileEvent): Promise<DocumentContext> {
    return await buildDocumentContext(fileEvent, this.vaultRoot);
  }

  /**
   * Get vault root path
   */
  getVaultRoot(): string {
    return this.vaultRoot;
  }
}
