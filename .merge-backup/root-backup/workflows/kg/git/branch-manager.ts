import { simpleGit, type SimpleGit } from 'simple-git';
import { logger } from '../../../utils/logger.js';

export class WorkflowBranchManager {
  private git: SimpleGit;
  private vaultRoot: string;

  constructor(vaultRoot: string) {
    this.vaultRoot = vaultRoot;
    this.git = simpleGit(vaultRoot);
  }

  /**
   * Create a new branch for workflow changes
   */
  async createWorkflowBranch(workflowName: string, baseBranch: string = 'master'): Promise<string> {
    const branchName = `workflow/${workflowName}-${Date.now()}`;

    try {
      // Ensure we're on base branch
      await this.git.checkout(baseBranch);

      // Create and checkout new branch
      await this.git.checkoutLocalBranch(branchName);

      logger.info('Created workflow branch', { branchName, baseBranch });
      return branchName;
    } catch (error) {
      logger.error('Failed to create workflow branch', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Check if a branch exists
   */
  async branchExists(branchName: string): Promise<boolean> {
    try {
      const branches = await this.git.branchLocal();
      return branches.all.includes(branchName);
    } catch {
      return false;
    }
  }

  /**
   * Switch to a branch
   */
  async checkout(branchName: string): Promise<void> {
    await this.git.checkout(branchName);
    logger.info('Checked out branch', { branchName });
  }

  /**
   * Delete a workflow branch
   */
  async deleteWorkflowBranch(branchName: string, force: boolean = false): Promise<void> {
    try {
      // Switch to master before deleting
      await this.git.checkout('master');

      // Delete branch
      await this.git.deleteLocalBranch(branchName, force);

      logger.info('Deleted workflow branch', { branchName });
    } catch (error) {
      logger.error('Failed to delete workflow branch', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string> {
    const status = await this.git.status();
    return status.current || 'master';
  }
}
