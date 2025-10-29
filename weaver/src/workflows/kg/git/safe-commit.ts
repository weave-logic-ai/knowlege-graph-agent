import { simpleGit, type SimpleGit } from 'simple-git';
import { logger } from '../../../utils/logger.js';

export interface CommitOptions {
  message: string;
  files: string[];
  workflowId: string;
  metadata?: Record<string, unknown>;
}

export class SafeCommit {
  private git: SimpleGit;

  constructor(vaultRoot: string) {
    this.git = simpleGit(vaultRoot);
  }

  /**
   * Commit changes atomically
   */
  async commit(options: CommitOptions): Promise<string> {
    try {
      // Stage files
      for (const file of options.files) {
        await this.git.add(file);
      }

      // Create commit message with metadata
      const fullMessage = this.buildCommitMessage(options);

      // Commit
      const result = await this.git.commit(fullMessage);

      logger.info('Committed workflow changes', {
        workflowId: options.workflowId,
        files: options.files.length,
        commit: result.commit,
      });

      return result.commit;
    } catch (error) {
      logger.error('Failed to commit workflow changes', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Build commit message with metadata
   */
  private buildCommitMessage(options: CommitOptions): string {
    let message = options.message;

    // Add workflow metadata
    message += `\n\n`;
    message += `Workflow-Id: ${options.workflowId}\n`;
    message += `Files-Modified: ${options.files.length}\n`;

    if (options.metadata) {
      message += `Metadata: ${JSON.stringify(options.metadata)}\n`;
    }

    message += `Generated-By: Weaver Knowledge Graph Workflow\n`;

    return message;
  }

  /**
   * Check if there are uncommitted changes
   */
  async hasChanges(): Promise<boolean> {
    const status = await this.git.status();
    return status.files.length > 0;
  }

  /**
   * Get list of modified files
   */
  async getModifiedFiles(): Promise<string[]> {
    const status = await this.git.status();
    return status.files.map(f => f.path);
  }
}
