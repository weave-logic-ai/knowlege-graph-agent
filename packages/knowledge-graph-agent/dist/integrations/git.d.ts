/**
 * Git Integration
 *
 * Provides Git operations for the knowledge graph agent using simple-git.
 *
 * @module integrations/git
 */
import { SimpleGit } from 'simple-git';
import { Logger, KnowledgeGraphError } from '../utils/index.js';
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
export declare class GitError extends KnowledgeGraphError {
    readonly gitCommand?: string;
    readonly gitOutput?: string;
    constructor(message: string, gitCommand?: string, gitOutput?: string);
}
/**
 * Git Client
 *
 * Provides a high-level interface for Git operations.
 */
export declare class GitClient {
    private git;
    private logger;
    private workingDirectory;
    constructor(config?: GitClientConfig);
    /**
     * Check if the current directory is a git repository
     */
    isRepo(): Promise<boolean>;
    /**
     * Get the current git status
     */
    getStatus(): Promise<GitStatusSummary>;
    /**
     * Get the diff of changes
     */
    getDiff(options?: {
        staged?: boolean;
        file?: string;
        cached?: boolean;
    }): Promise<GitDiffSummary>;
    /**
     * Get the full diff content
     */
    getDiffContent(options?: {
        staged?: boolean;
        file?: string;
    }): Promise<string>;
    /**
     * Stage files for commit
     */
    add(files?: string[] | string): Promise<void>;
    /**
     * Unstage files
     */
    reset(files: string[] | string): Promise<void>;
    /**
     * Create a commit
     */
    commit(options: GitCommitOptions): Promise<GitCommitResult>;
    /**
     * Get commit log
     */
    getLog(options?: {
        maxCount?: number;
        file?: string;
        since?: Date;
        until?: Date;
        author?: string;
    }): Promise<GitCommitInfo[]>;
    /**
     * Get current branch information
     */
    getBranch(): Promise<GitBranchInfo>;
    /**
     * Get remote information
     */
    getRemotes(): Promise<GitRemoteInfo[]>;
    /**
     * Push to remote
     */
    push(options?: {
        remote?: string;
        branch?: string;
        setUpstream?: boolean;
        force?: boolean;
    }): Promise<void>;
    /**
     * Pull from remote
     */
    pull(options?: {
        remote?: string;
        branch?: string;
        rebase?: boolean;
    }): Promise<void>;
    /**
     * Fetch from remote
     */
    fetch(options?: {
        remote?: string;
        all?: boolean;
        prune?: boolean;
    }): Promise<void>;
    /**
     * Stash changes
     */
    stash(options?: {
        message?: string;
        includeUntracked?: boolean;
    }): Promise<void>;
    /**
     * Pop stash
     */
    stashPop(): Promise<void>;
    /**
     * Get the root directory of the git repository
     */
    getRoot(): Promise<string>;
    /**
     * Get the current HEAD commit hash
     */
    getHead(): Promise<string>;
    /**
     * Check if there are uncommitted changes
     */
    hasUncommittedChanges(): Promise<boolean>;
    /**
     * Get the underlying simple-git instance for advanced operations
     */
    getRawClient(): SimpleGit;
}
/**
 * Create a GitClient instance
 */
export declare function createGitClient(config?: GitClientConfig): GitClient;
//# sourceMappingURL=git.d.ts.map