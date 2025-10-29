import { WorkflowBranchManager } from './branch-manager.js';
import { SafeCommit } from './safe-commit.js';
import { WorkflowRollback } from './rollback.js';

export class GitIntegration {
  public branches: WorkflowBranchManager;
  public commit: SafeCommit;
  public rollback: WorkflowRollback;

  constructor(vaultRoot: string) {
    this.branches = new WorkflowBranchManager(vaultRoot);
    this.commit = new SafeCommit(vaultRoot);
    this.rollback = new WorkflowRollback(vaultRoot);
  }
}

export { WorkflowBranchManager, SafeCommit, WorkflowRollback };
export type { CommitOptions } from './safe-commit.js';
