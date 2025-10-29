import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { simpleGit, type SimpleGit } from 'simple-git';
import { WorkflowBranchManager } from '../../../../src/workflows/kg/git/branch-manager.js';
import { SafeCommit, type CommitOptions } from '../../../../src/workflows/kg/git/safe-commit.js';
import { WorkflowRollback } from '../../../../src/workflows/kg/git/rollback.js';
import { GitIntegration } from '../../../../src/workflows/kg/git/index.js';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

describe('Git Integration Layer', () => {
  let tempDir: string;
  let vaultRoot: string;
  let git: SimpleGit;

  beforeEach(async () => {
    // Create temporary git repository for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'git-test-'));
    vaultRoot = tempDir;
    git = simpleGit(vaultRoot);

    // Initialize git repo
    await git.init();
    await git.addConfig('user.name', 'Test User');
    await git.addConfig('user.email', 'test@example.com');

    // Create initial commit
    await fs.writeFile(path.join(vaultRoot, 'README.md'), '# Test Repo');
    await git.add('README.md');
    await git.commit('Initial commit');
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('WorkflowBranchManager', () => {
    let branchManager: WorkflowBranchManager;

    beforeEach(() => {
      branchManager = new WorkflowBranchManager(vaultRoot);
    });

    it('should create a workflow branch', async () => {
      const branchName = await branchManager.createWorkflowBranch('test-workflow');

      expect(branchName).toMatch(/^workflow\/test-workflow-\d+$/);

      const branches = await git.branchLocal();
      expect(branches.all).toContain(branchName);
    });

    it('should create branch from specified base branch', async () => {
      // Create a feature branch first
      await git.checkoutLocalBranch('feature-branch');
      await fs.writeFile(path.join(vaultRoot, 'feature.md'), 'Feature');
      await git.add('feature.md');
      await git.commit('Add feature');

      // Create workflow branch from feature branch
      const branchName = await branchManager.createWorkflowBranch('test', 'feature-branch');

      expect(branchName).toMatch(/^workflow\/test-\d+$/);

      // Verify we're on the new branch
      const currentBranch = await branchManager.getCurrentBranch();
      expect(currentBranch).toBe(branchName);
    });

    it('should check if branch exists', async () => {
      const branchName = await branchManager.createWorkflowBranch('test');

      const exists = await branchManager.branchExists(branchName);
      expect(exists).toBe(true);

      const notExists = await branchManager.branchExists('non-existent-branch');
      expect(notExists).toBe(false);
    });

    it('should checkout a branch', async () => {
      const branchName = await branchManager.createWorkflowBranch('test');

      // Switch back to master
      await git.checkout('master');

      // Checkout workflow branch
      await branchManager.checkout(branchName);

      const currentBranch = await branchManager.getCurrentBranch();
      expect(currentBranch).toBe(branchName);
    });

    it('should delete a workflow branch', async () => {
      const branchName = await branchManager.createWorkflowBranch('test');

      await branchManager.deleteWorkflowBranch(branchName);

      const exists = await branchManager.branchExists(branchName);
      expect(exists).toBe(false);

      // Verify we're on master
      const currentBranch = await branchManager.getCurrentBranch();
      expect(currentBranch).toBe('master');
    });

    it('should force delete a branch with uncommitted changes', async () => {
      const branchName = await branchManager.createWorkflowBranch('test');

      // Create uncommitted changes
      await fs.writeFile(path.join(vaultRoot, 'test.md'), 'Test');
      await git.add('test.md');
      await git.commit('Add test file');

      // Force delete
      await branchManager.deleteWorkflowBranch(branchName, true);

      const exists = await branchManager.branchExists(branchName);
      expect(exists).toBe(false);
    });

    it('should get current branch name', async () => {
      const currentBranch = await branchManager.getCurrentBranch();
      expect(currentBranch).toBe('master');

      const branchName = await branchManager.createWorkflowBranch('test');
      const newBranch = await branchManager.getCurrentBranch();
      expect(newBranch).toBe(branchName);
    });
  });

  describe('SafeCommit', () => {
    let safeCommit: SafeCommit;

    beforeEach(() => {
      safeCommit = new SafeCommit(vaultRoot);
    });

    it('should commit changes with metadata', async () => {
      // Create test file
      const testFile = path.join(vaultRoot, 'test.md');
      await fs.writeFile(testFile, 'Test content');

      const options: CommitOptions = {
        message: 'Test commit',
        files: ['test.md'],
        workflowId: 'workflow-123',
        metadata: { step: 'execution', version: '1.0' },
      };

      const commitHash = await safeCommit.commit(options);

      expect(commitHash).toBeTruthy();

      // Verify commit message (simple-git only returns subject in .message)
      const log = await git.log({ maxCount: 1 });
      expect(log.latest?.message).toContain('Test commit');

      // Get full commit message including body
      const fullLog = await git.show(['HEAD', '--format=%B', '--no-patch']);
      expect(fullLog).toContain('Workflow-Id: workflow-123');
      expect(fullLog).toContain('Files-Modified: 1');
      expect(fullLog).toContain('Metadata:');
      expect(fullLog).toContain('Generated-By: Weaver Knowledge Graph Workflow');
    });

    it('should stage and commit multiple files', async () => {
      // Create multiple test files
      await fs.writeFile(path.join(vaultRoot, 'file1.md'), 'Content 1');
      await fs.writeFile(path.join(vaultRoot, 'file2.md'), 'Content 2');
      await fs.writeFile(path.join(vaultRoot, 'file3.md'), 'Content 3');

      const options: CommitOptions = {
        message: 'Multi-file commit',
        files: ['file1.md', 'file2.md', 'file3.md'],
        workflowId: 'workflow-456',
      };

      await safeCommit.commit(options);

      // Verify all files are committed
      const status = await git.status();
      expect(status.files).toHaveLength(0);
    });

    it('should check if there are uncommitted changes', async () => {
      // No changes initially
      let hasChanges = await safeCommit.hasChanges();
      expect(hasChanges).toBe(false);

      // Create uncommitted file
      await fs.writeFile(path.join(vaultRoot, 'new-file.md'), 'New content');

      hasChanges = await safeCommit.hasChanges();
      expect(hasChanges).toBe(true);
    });

    it('should get list of modified files', async () => {
      // Create and modify files
      await fs.writeFile(path.join(vaultRoot, 'modified1.md'), 'Content');
      await fs.writeFile(path.join(vaultRoot, 'modified2.md'), 'Content');

      const modifiedFiles = await safeCommit.getModifiedFiles();

      expect(modifiedFiles).toHaveLength(2);
      expect(modifiedFiles).toContain('modified1.md');
      expect(modifiedFiles).toContain('modified2.md');
    });

    it('should handle commit without metadata', async () => {
      await fs.writeFile(path.join(vaultRoot, 'test.md'), 'Test');

      const options: CommitOptions = {
        message: 'Simple commit',
        files: ['test.md'],
        workflowId: 'workflow-789',
      };

      const commitHash = await safeCommit.commit(options);
      expect(commitHash).toBeTruthy();

      const log = await git.log({ maxCount: 1 });
      expect(log.latest?.message).toContain('Simple commit');
      expect(log.latest?.message).not.toContain('Metadata:');
    });
  });

  describe('WorkflowRollback', () => {
    let rollback: WorkflowRollback;
    let safeCommit: SafeCommit;

    beforeEach(() => {
      rollback = new WorkflowRollback(vaultRoot);
      safeCommit = new SafeCommit(vaultRoot);
    });

    it('should rollback last commit', async () => {
      // Create a commit to rollback
      await fs.writeFile(path.join(vaultRoot, 'rollback-test.md'), 'Content');
      await safeCommit.commit({
        message: 'Commit to rollback',
        files: ['rollback-test.md'],
        workflowId: 'workflow-rollback',
      });

      // Get commit count before rollback
      const logBefore = await git.log();
      const commitCountBefore = logBefore.all.length;

      // Rollback
      await rollback.rollbackLastCommit();

      // Verify rollback created a revert commit
      const logAfter = await git.log();
      expect(logAfter.all.length).toBe(commitCountBefore + 1);
      expect(logAfter.latest?.message).toContain('Revert');
    });

    it('should discard uncommitted changes', async () => {
      // Create uncommitted changes
      await fs.writeFile(path.join(vaultRoot, 'discard-test.md'), 'Content to discard');

      // Verify changes exist
      let hasChanges = await safeCommit.hasChanges();
      expect(hasChanges).toBe(true);

      // Discard changes
      await rollback.discardChanges();

      // Verify changes are gone
      hasChanges = await safeCommit.hasChanges();
      expect(hasChanges).toBe(false);

      // Verify file doesn't exist
      const fileExists = await fs.access(path.join(vaultRoot, 'discard-test.md'))
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(false);
    });

    it('should generate rollback command', () => {
      const branchName = 'workflow/test-1234567890';
      const command = rollback.generateRollbackCommand(branchName);

      expect(command).toBe('git checkout master && git branch -D workflow/test-1234567890');
    });
  });

  describe('GitIntegration', () => {
    let gitIntegration: GitIntegration;

    beforeEach(() => {
      gitIntegration = new GitIntegration(vaultRoot);
    });

    it('should expose all integration components', () => {
      expect(gitIntegration.branches).toBeInstanceOf(WorkflowBranchManager);
      expect(gitIntegration.commit).toBeInstanceOf(SafeCommit);
      expect(gitIntegration.rollback).toBeInstanceOf(WorkflowRollback);
    });

    it('should support complete workflow with branch, commit, and rollback', async () => {
      // Create workflow branch
      const branchName = await gitIntegration.branches.createWorkflowBranch('integration-test');
      expect(branchName).toMatch(/^workflow\/integration-test-\d+$/);

      // Make changes and commit
      await fs.writeFile(path.join(vaultRoot, 'workflow-file.md'), 'Workflow content');
      const commitHash = await gitIntegration.commit.commit({
        message: 'Workflow changes',
        files: ['workflow-file.md'],
        workflowId: 'integration-test-123',
        metadata: { phase: 'testing' },
      });
      expect(commitHash).toBeTruthy();

      // Generate rollback command
      const rollbackCmd = gitIntegration.rollback.generateRollbackCommand(branchName);
      expect(rollbackCmd).toContain(branchName);

      // Clean up (force delete since branch has commits)
      await gitIntegration.branches.deleteWorkflowBranch(branchName, true);
      const exists = await gitIntegration.branches.branchExists(branchName);
      expect(exists).toBe(false);
    });

    it('should handle workflow with uncommitted changes and discard', async () => {
      const branchName = await gitIntegration.branches.createWorkflowBranch('discard-test');

      // Create uncommitted changes
      await fs.writeFile(path.join(vaultRoot, 'temp.md'), 'Temporary content');

      // Verify changes exist
      let hasChanges = await gitIntegration.commit.hasChanges();
      expect(hasChanges).toBe(true);

      // Discard changes
      await gitIntegration.rollback.discardChanges();

      // Verify changes are gone
      hasChanges = await gitIntegration.commit.hasChanges();
      expect(hasChanges).toBe(false);

      // Clean up branch (force delete in case of any changes)
      await gitIntegration.branches.deleteWorkflowBranch(branchName, true);
    });
  });
});
