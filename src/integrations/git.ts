/**
 * Git Integration
 *
 * Provides Git operations for the knowledge graph agent using simple-git.
 *
 * @module integrations/git
 */

import simpleGit, {
  SimpleGit,
  StatusResult,
  DiffResult,
  LogResult,
  DefaultLogFields,
} from 'simple-git';
import { createLogger, Logger, KnowledgeGraphError, ErrorCategory, ErrorSeverity } from '../utils/index.js';

/**
 * Git client configuration
 */
export interface GitClientConfig {
  /** Working directory for git operations */
  workingDirectory?: string;
  /** Logger instance */
  logger?: Logger;
  /** Timeout for git operations in milliseconds */
  timeout?: number;
}

/**
 * Git status summary
 */
export interface GitStatusSummary {
  /** Current branch name */
  branch: string;
  /** Whether the repository is clean */
  isClean: boolean;
  /** Number of staged files */
  staged: number;
  /** Number of modified files */
  modified: number;
  /** Number of untracked files */
  untracked: number;
  /** Number of deleted files */
  deleted: number;
  /** Number of renamed files */
  renamed: number;
  /** Number of conflicted files */
  conflicted: number;
  /** Tracking information */
  tracking?: {
    ahead: number;
    behind: number;
    remote?: string;
  };
  /** List of changed files */
  files: GitFileStatus[];
}

/**
 * Individual file status
 */
export interface GitFileStatus {
  /** File path */
  path: string;
  /** Index status (staged) */
  indexStatus: string;
  /** Working tree status */
  workingTreeStatus: string;
  /** Whether the file is staged */
  isStaged: boolean;
}

/**
 * Git diff summary
 */
export interface GitDiffSummary {
  /** Number of changed files */
  changed: number;
  /** Number of insertions */
  insertions: number;
  /** Number of deletions */
  deletions: number;
  /** List of changed files with details */
  files: GitDiffFile[];
}

/**
 * Git diff file details
 */
export interface GitDiffFile {
  /** File path */
  file: string;
  /** Number of insertions */
  insertions: number;
  /** Number of deletions */
  deletions: number;
  /** Whether the file is binary */
  binary: boolean;
}

/**
 * Git commit info
 */
export interface GitCommitInfo {
  /** Commit hash */
  hash: string;
  /** Abbreviated commit hash */
  hashAbbrev: string;
  /** Author name */
  author: string;
  /** Author email */
  email: string;
  /** Commit date */
  date: Date;
  /** Commit message */
  message: string;
  /** Commit body */
  body?: string;
  /** Parent commit hashes */
  parents: string[];
}

/**
 * Git remote info
 */
export interface GitRemoteInfo {
  /** Remote name */
  name: string;
  /** Fetch URL */
  fetchUrl: string;
  /** Push URL */
  pushUrl: string;
}

/**
 * Git branch info
 */
export interface GitBranchInfo {
  /** Current branch name */
  current: string;
  /** Whether the branch is detached */
  detached: boolean;
  /** All local branches */
  local: string[];
  /** All remote branches */
  remote: string[];
}

/**
 * Git commit options
 */
export interface GitCommitOptions {
  /** Commit message */
  message: string;
  /** Whether to amend the previous commit */
  amend?: boolean;
  /** Whether to allow empty commits */
  allowEmpty?: boolean;
  /** Specific files to commit (all staged if empty) */
  files?: string[];
  /** Author override */
  author?: {
    name: string;
    email: string;
  };
}

/**
 * Git commit result
 */
export interface GitCommitResult {
  /** Whether the commit was successful */
  success: boolean;
  /** Commit hash */
  hash?: string;
  /** Branch name */
  branch?: string;
  /** Commit summary */
  summary?: {
    changes: number;
    insertions: number;
    deletions: number;
  };
  /** Error message if failed */
  error?: string;
}

/**
 * Git error class
 */
export class GitError extends KnowledgeGraphError {
  public readonly gitCommand?: string;
  public readonly gitOutput?: string;

  constructor(
    message: string,
    gitCommand?: string,
    gitOutput?: string
  ) {
    super(message, {
      category: ErrorCategory.RESOURCE,
      severity: ErrorSeverity.ERROR,
      retryable: false,
      code: 'GIT_ERROR',
      context: { gitCommand, gitOutput },
    });
    this.name = 'GitError';
    this.gitCommand = gitCommand;
    this.gitOutput = gitOutput;
  }
}

/**
 * Git Client
 *
 * Provides a high-level interface for Git operations.
 */
export class GitClient {
  private git: SimpleGit;
  private logger: Logger;
  private workingDirectory: string;

  constructor(config: GitClientConfig = {}) {
    this.workingDirectory = config.workingDirectory || process.cwd();
    this.logger = config.logger || createLogger('git');

    this.git = simpleGit({
      baseDir: this.workingDirectory,
      binary: 'git',
      maxConcurrentProcesses: 6,
      timeout: {
        block: config.timeout || 30000,
      },
    });
  }

  /**
   * Check if the current directory is a git repository
   */
  async isRepo(): Promise<boolean> {
    try {
      await this.git.revparse(['--git-dir']);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the current git status
   */
  async getStatus(): Promise<GitStatusSummary> {
    try {
      const status: StatusResult = await this.git.status();

      const files: GitFileStatus[] = status.files.map(f => ({
        path: f.path,
        indexStatus: f.index || ' ',
        workingTreeStatus: f.working_dir || ' ',
        isStaged: f.index !== ' ' && f.index !== '?',
      }));

      return {
        branch: status.current || 'HEAD',
        isClean: status.isClean(),
        staged: status.staged.length,
        modified: status.modified.length,
        untracked: status.not_added.length,
        deleted: status.deleted.length,
        renamed: status.renamed.length,
        conflicted: status.conflicted.length,
        tracking: status.tracking
          ? {
              ahead: status.ahead,
              behind: status.behind,
              remote: status.tracking,
            }
          : undefined,
        files,
      };
    } catch (error) {
      throw new GitError(
        `Failed to get git status: ${error instanceof Error ? error.message : String(error)}`,
        'git status',
        String(error)
      );
    }
  }

  /**
   * Get the diff of changes
   */
  async getDiff(options: {
    staged?: boolean;
    file?: string;
    cached?: boolean;
  } = {}): Promise<GitDiffSummary> {
    try {
      const args: string[] = ['--stat'];

      if (options.staged || options.cached) {
        args.push('--cached');
      }

      if (options.file) {
        args.push('--', options.file);
      }

      const diffResult: DiffResult = await this.git.diffSummary(args);

      return {
        changed: diffResult.changed,
        insertions: diffResult.insertions,
        deletions: diffResult.deletions,
        files: diffResult.files.map(f => ({
          file: f.file,
          insertions: 'insertions' in f ? f.insertions : 0,
          deletions: 'deletions' in f ? f.deletions : 0,
          binary: f.binary,
        })),
      };
    } catch (error) {
      throw new GitError(
        `Failed to get diff: ${error instanceof Error ? error.message : String(error)}`,
        'git diff',
        String(error)
      );
    }
  }

  /**
   * Get the full diff content
   */
  async getDiffContent(options: {
    staged?: boolean;
    file?: string;
  } = {}): Promise<string> {
    try {
      const args: string[] = [];

      if (options.staged) {
        args.push('--cached');
      }

      if (options.file) {
        args.push('--', options.file);
      }

      return await this.git.diff(args);
    } catch (error) {
      throw new GitError(
        `Failed to get diff content: ${error instanceof Error ? error.message : String(error)}`,
        'git diff',
        String(error)
      );
    }
  }

  /**
   * Stage files for commit
   */
  async add(files: string[] | string = '.'): Promise<void> {
    try {
      const fileList = Array.isArray(files) ? files : [files];
      await this.git.add(fileList);
      this.logger.debug('Staged files', { files: fileList });
    } catch (error) {
      throw new GitError(
        `Failed to stage files: ${error instanceof Error ? error.message : String(error)}`,
        'git add',
        String(error)
      );
    }
  }

  /**
   * Unstage files
   */
  async reset(files: string[] | string): Promise<void> {
    try {
      const fileList = Array.isArray(files) ? files : [files];
      await this.git.reset(['HEAD', '--', ...fileList]);
      this.logger.debug('Unstaged files', { files: fileList });
    } catch (error) {
      throw new GitError(
        `Failed to unstage files: ${error instanceof Error ? error.message : String(error)}`,
        'git reset',
        String(error)
      );
    }
  }

  /**
   * Create a commit
   */
  async commit(options: GitCommitOptions): Promise<GitCommitResult> {
    try {
      const commitArgs: string[] = [];

      if (options.amend) {
        commitArgs.push('--amend');
      }

      if (options.allowEmpty) {
        commitArgs.push('--allow-empty');
      }

      if (options.author) {
        commitArgs.push(`--author="${options.author.name} <${options.author.email}>"`);
      }

      // Handle specific files
      if (options.files && options.files.length > 0) {
        await this.add(options.files);
      }

      const result = await this.git.commit(options.message, undefined, {
        '--message': options.message,
      });

      this.logger.info('Created commit', {
        hash: result.commit,
        branch: result.branch,
      });

      return {
        success: true,
        hash: result.commit,
        branch: result.branch,
        summary: {
          changes: result.summary.changes,
          insertions: result.summary.insertions,
          deletions: result.summary.deletions,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to create commit', new Error(errorMessage));

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get commit log
   */
  async getLog(options: {
    maxCount?: number;
    file?: string;
    since?: Date;
    until?: Date;
    author?: string;
  } = {}): Promise<GitCommitInfo[]> {
    try {
      // Build log options as simple-git expects
      const logArgs: string[] = [];

      if (options.maxCount) {
        logArgs.push(`-n${options.maxCount}`);
      }

      if (options.since) {
        logArgs.push(`--since=${options.since.toISOString()}`);
      }

      if (options.until) {
        logArgs.push(`--until=${options.until.toISOString()}`);
      }

      if (options.author) {
        logArgs.push(`--author=${options.author}`);
      }

      if (options.file) {
        logArgs.push('--', options.file);
      }

      const log: LogResult<DefaultLogFields> = await this.git.log(logArgs);

      return log.all.map(entry => ({
        hash: entry.hash,
        hashAbbrev: entry.hash.substring(0, 7),
        author: entry.author_name,
        email: entry.author_email,
        date: new Date(entry.date),
        message: entry.message,
        body: entry.body || undefined,
        parents: entry.refs ? entry.refs.split(',').map(r => r.trim()) : [],
      }));
    } catch (error) {
      throw new GitError(
        `Failed to get log: ${error instanceof Error ? error.message : String(error)}`,
        'git log',
        String(error)
      );
    }
  }

  /**
   * Get current branch information
   */
  async getBranch(): Promise<GitBranchInfo> {
    try {
      const branchSummary = await this.git.branch(['-a']);

      const local: string[] = [];
      const remote: string[] = [];

      for (const [name, branch] of Object.entries(branchSummary.branches)) {
        if (name.startsWith('remotes/')) {
          remote.push(name.replace('remotes/', ''));
        } else {
          local.push(name);
        }
      }

      return {
        current: branchSummary.current,
        detached: branchSummary.detached,
        local,
        remote,
      };
    } catch (error) {
      throw new GitError(
        `Failed to get branch info: ${error instanceof Error ? error.message : String(error)}`,
        'git branch',
        String(error)
      );
    }
  }

  /**
   * Get remote information
   */
  async getRemotes(): Promise<GitRemoteInfo[]> {
    try {
      const remotes = await this.git.getRemotes(true);

      return remotes.map(remote => ({
        name: remote.name,
        fetchUrl: remote.refs.fetch || '',
        pushUrl: remote.refs.push || '',
      }));
    } catch (error) {
      throw new GitError(
        `Failed to get remotes: ${error instanceof Error ? error.message : String(error)}`,
        'git remote',
        String(error)
      );
    }
  }

  /**
   * Push to remote
   */
  async push(options: {
    remote?: string;
    branch?: string;
    setUpstream?: boolean;
    force?: boolean;
  } = {}): Promise<void> {
    try {
      const remote = options.remote || 'origin';
      const args: string[] = [];

      if (options.setUpstream) {
        args.push('-u');
      }

      if (options.force) {
        args.push('--force');
      }

      args.push(remote);

      if (options.branch) {
        args.push(options.branch);
      }

      await this.git.push(args);
      this.logger.info('Pushed to remote', { remote, branch: options.branch });
    } catch (error) {
      throw new GitError(
        `Failed to push: ${error instanceof Error ? error.message : String(error)}`,
        'git push',
        String(error)
      );
    }
  }

  /**
   * Pull from remote
   */
  async pull(options: {
    remote?: string;
    branch?: string;
    rebase?: boolean;
  } = {}): Promise<void> {
    try {
      const remote = options.remote || 'origin';
      const pullArgs: string[] = [];

      if (options.rebase) {
        pullArgs.push('--rebase');
      }

      pullArgs.push(remote);

      if (options.branch) {
        pullArgs.push(options.branch);
      }

      await this.git.pull(pullArgs);
      this.logger.info('Pulled from remote', { remote, branch: options.branch });
    } catch (error) {
      throw new GitError(
        `Failed to pull: ${error instanceof Error ? error.message : String(error)}`,
        'git pull',
        String(error)
      );
    }
  }

  /**
   * Fetch from remote
   */
  async fetch(options: {
    remote?: string;
    all?: boolean;
    prune?: boolean;
  } = {}): Promise<void> {
    try {
      const args: string[] = [];

      if (options.all) {
        args.push('--all');
      }

      if (options.prune) {
        args.push('--prune');
      }

      if (options.remote) {
        args.push(options.remote);
      }

      await this.git.fetch(args);
      this.logger.debug('Fetched from remote', options);
    } catch (error) {
      throw new GitError(
        `Failed to fetch: ${error instanceof Error ? error.message : String(error)}`,
        'git fetch',
        String(error)
      );
    }
  }

  /**
   * Stash changes
   */
  async stash(options: {
    message?: string;
    includeUntracked?: boolean;
  } = {}): Promise<void> {
    try {
      const args: string[] = ['push'];

      if (options.message) {
        args.push('-m', options.message);
      }

      if (options.includeUntracked) {
        args.push('--include-untracked');
      }

      await this.git.stash(args);
      this.logger.debug('Stashed changes', options);
    } catch (error) {
      throw new GitError(
        `Failed to stash: ${error instanceof Error ? error.message : String(error)}`,
        'git stash',
        String(error)
      );
    }
  }

  /**
   * Pop stash
   */
  async stashPop(): Promise<void> {
    try {
      await this.git.stash(['pop']);
      this.logger.debug('Popped stash');
    } catch (error) {
      throw new GitError(
        `Failed to pop stash: ${error instanceof Error ? error.message : String(error)}`,
        'git stash pop',
        String(error)
      );
    }
  }

  /**
   * Get the root directory of the git repository
   */
  async getRoot(): Promise<string> {
    try {
      const root = await this.git.revparse(['--show-toplevel']);
      return root.trim();
    } catch (error) {
      throw new GitError(
        `Failed to get repository root: ${error instanceof Error ? error.message : String(error)}`,
        'git rev-parse',
        String(error)
      );
    }
  }

  /**
   * Get the current HEAD commit hash
   */
  async getHead(): Promise<string> {
    try {
      const head = await this.git.revparse(['HEAD']);
      return head.trim();
    } catch (error) {
      throw new GitError(
        `Failed to get HEAD: ${error instanceof Error ? error.message : String(error)}`,
        'git rev-parse',
        String(error)
      );
    }
  }

  /**
   * Check if there are uncommitted changes
   */
  async hasUncommittedChanges(): Promise<boolean> {
    const status = await this.getStatus();
    return !status.isClean;
  }

  /**
   * Get the underlying simple-git instance for advanced operations
   */
  getRawClient(): SimpleGit {
    return this.git;
  }
}

/**
 * Create a GitClient instance
 */
export function createGitClient(config: GitClientConfig = {}): GitClient {
  return new GitClient(config);
}
