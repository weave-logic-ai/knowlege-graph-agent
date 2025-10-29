/**
 * GitClient - Simple-git wrapper for all git operations
 *
 * Provides a clean interface for git operations with automatic repo initialization,
 * configuration management, and comprehensive error handling.
 *
 * @module git/git-client
 */

import { simpleGit, SimpleGit, StatusResult, LogResult } from 'simple-git';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { config } from '../config/index.js';
import { gitLogger } from './git-logger.js';

export interface GitCommitResult {
  sha: string;
  message: string;
  files: string[];
  timestamp: Date;
}

export interface GitStatusInfo {
  staged: string[];
  unstaged: string[];
  untracked: string[];
  branch: string;
  tracking?: string;
  ahead: number;
  behind: number;
}

/**
 * GitClient - Wrapper around simple-git for all git operations
 */
export class GitClient {
  private git: SimpleGit;
  private repoPath: string;
  private isInitialized = false;

  constructor(repoPath: string) {
    this.repoPath = resolve(repoPath);
    this.git = simpleGit(this.repoPath);
  }

  /**
   * Initialize git repository and configure user
   */
  async init(): Promise<void> {
    const startTime = Date.now();
    try {
      // Check if already a git repo
      const isRepo = await this.git.checkIsRepo();

      if (!isRepo) {
        // Initialize new repo
        await this.git.init();
        console.log(`[GitClient] Initialized new git repository at ${this.repoPath}`);
      }

      // Configure git user from config
      await this.configureUser();

      this.isInitialized = true;

      gitLogger.logSuccess('init', {
        duration: Date.now() - startTime,
        metadata: { repoPath: this.repoPath, wasNewRepo: !isRepo },
      });
    } catch (error) {
      gitLogger.logError('init', error instanceof Error ? error : new Error(String(error)), {
        duration: Date.now() - startTime,
      });
      throw new Error(`Failed to initialize git repository: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Configure git user from environment or defaults
   */
  private async configureUser(): Promise<void> {
    const authorName = config.git.authorName;
    const authorEmail = config.git.authorEmail;

    try {
      await this.git.addConfig('user.name', authorName);
      await this.git.addConfig('user.email', authorEmail);
      console.log(`[GitClient] Configured git user: ${authorName} <${authorEmail}>`);
    } catch (error) {
      console.warn(`[GitClient] Failed to configure git user:`, error);
    }
  }

  /**
   * Get detailed git status
   */
  async status(): Promise<GitStatusInfo> {
    await this.ensureInitialized();

    try {
      const status: StatusResult = await this.git.status();

      return {
        staged: status.staged,
        unstaged: status.modified.concat(status.deleted),
        untracked: status.not_added,
        branch: status.current || 'main',
        tracking: status.tracking || undefined,
        ahead: status.ahead,
        behind: status.behind,
      };
    } catch (error) {
      throw new Error(`Failed to get git status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Stage files for commit
   */
  async add(files: string | string[]): Promise<void> {
    await this.ensureInitialized();

    try {
      const fileList = Array.isArray(files) ? files : [files];
      await this.git.add(fileList);
      console.log(`[GitClient] Staged ${fileList.length} file(s)`);
    } catch (error) {
      throw new Error(`Failed to stage files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a commit
   */
  async commit(message: string): Promise<GitCommitResult> {
    await this.ensureInitialized();

    const startTime = Date.now();
    try {
      const result = await this.git.commit(message);
      const sha = result.commit;

      // Get files from the commit
      const show = await this.git.show([sha, '--name-only', '--format=']);
      const files = show.split('\n').filter(f => f.trim());

      const commitResult = {
        sha,
        message,
        files,
        timestamp: new Date(),
      };

      gitLogger.logSuccess('commit', {
        sha,
        files,
        message,
        duration: Date.now() - startTime,
      });

      return commitResult;
    } catch (error) {
      gitLogger.logError('commit', error instanceof Error ? error : new Error(String(error)), {
        message,
        duration: Date.now() - startTime,
      });
      throw new Error(`Failed to create commit: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Stage and commit files in one operation
   */
  async addAndCommit(files: string | string[], message: string): Promise<GitCommitResult> {
    await this.add(files);
    return await this.commit(message);
  }

  /**
   * Get commit log
   */
  async log(options?: { maxCount?: number; from?: string; to?: string }): Promise<LogResult> {
    await this.ensureInitialized();

    try {
      const logOptions: Record<string, unknown> = {};

      if (options?.maxCount) {
        logOptions['--max-count'] = options.maxCount;
      }

      if (options?.from && options?.to) {
        logOptions['from'] = options.from;
        logOptions['to'] = options.to;
      }

      return await this.git.log(logOptions);
    } catch (error) {
      throw new Error(`Failed to get git log: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get diff for files
   */
  async diff(options?: { cached?: boolean; files?: string[] }): Promise<string> {
    await this.ensureInitialized();

    try {
      const diffOptions: string[] = [];

      if (options?.cached) {
        diffOptions.push('--cached');
      }

      if (options?.files && options.files.length > 0) {
        diffOptions.push('--', ...options.files);
      }

      const result = await this.git.diff(diffOptions);
      return result;
    } catch (error) {
      throw new Error(`Failed to get git diff: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Push commits to remote
   */
  async push(remote = 'origin', branch?: string): Promise<void> {
    await this.ensureInitialized();

    try {
      const statusInfo = await this.status();
      const currentBranch = branch || statusInfo.branch;

      await this.git.push(remote, currentBranch);
      console.log(`[GitClient] Pushed to ${remote}/${currentBranch}`);
    } catch (error) {
      throw new Error(`Failed to push: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Pull commits from remote
   */
  async pull(remote = 'origin', branch?: string): Promise<void> {
    await this.ensureInitialized();

    try {
      const statusInfo = await this.status();
      const currentBranch = branch || statusInfo.branch;

      await this.git.pull(remote, currentBranch);
      console.log(`[GitClient] Pulled from ${remote}/${currentBranch}`);
    } catch (error) {
      throw new Error(`Failed to pull: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if repository is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  /**
   * Get the repository path
   */
  getRepoPath(): string {
    return this.repoPath;
  }

  /**
   * Check if file/directory exists in repo
   */
  pathExists(path: string): boolean {
    const fullPath = resolve(this.repoPath, path);
    return existsSync(fullPath);
  }
}

/**
 * Create a GitClient instance for the vault
 */
export function createVaultGitClient(): GitClient {
  return new GitClient(config.vault.path);
}
