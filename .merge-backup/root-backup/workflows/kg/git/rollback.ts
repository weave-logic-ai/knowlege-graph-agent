import { simpleGit, type SimpleGit } from 'simple-git';
import { logger } from '../../../utils/logger.js';

export class WorkflowRollback {
  private git: SimpleGit;

  constructor(vaultRoot: string) {
    this.git = simpleGit(vaultRoot);
  }

  /**
   * Rollback to previous state (revert last commit)
   */
  async rollbackLastCommit(): Promise<void> {
    try {
      await this.git.revert('HEAD');
      logger.info('Rolled back last commit');
    } catch (error) {
      logger.error('Failed to rollback', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Discard all uncommitted changes
   */
  async discardChanges(): Promise<void> {
    try {
      // Reset tracked files
      await this.git.reset(['--hard']);
      // Clean untracked files
      await this.git.clean('f', ['-d']);
      logger.info('Discarded all uncommitted changes');
    } catch (error) {
      logger.error('Failed to discard changes', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Create a rollback command for user
   */
  generateRollbackCommand(branchName: string): string {
    return `git checkout master && git branch -D ${branchName}`;
  }
}
