/**
 * Auto-Commit Integration
 *
 * Provides automatic commit functionality with intelligent message generation
 * based on knowledge graph changes and file modifications.
 *
 * @module integrations/auto-commit
 */
import { GitClient, GitStatusSummary } from './git.js';
import { Logger, KnowledgeGraphError } from '../utils/index.js';
/**
 * Auto-commit configuration
 */
export interface AutoCommitConfig {
    /** Git client instance (created if not provided) */
    gitClient?: GitClient;
    /** Logger instance */
    logger?: Logger;
    /** Working directory */
    workingDirectory?: string;
    /** Prefix for auto-generated commit messages */
    messagePrefix?: string;
    /** Whether to include file list in commit message */
    includeFileList?: boolean;
    /** Maximum number of files to list in commit message */
    maxFilesInMessage?: number;
    /** Custom commit message template */
    messageTemplate?: string;
    /** Whether to stage all changes before commit */
    stageAll?: boolean;
    /** Files or patterns to always exclude */
    excludePatterns?: string[];
}
/**
 * Change type categories
 */
export declare enum ChangeType {
    ADD = "add",
    UPDATE = "update",
    DELETE = "delete",
    RENAME = "rename",
    REFACTOR = "refactor",
    FIX = "fix",
    DOCS = "docs",
    CONFIG = "config",
    STYLE = "style",
    TEST = "test",
    BUILD = "build",
    CHORE = "chore"
}
/**
 * Analyzed change information
 */
export interface ChangeAnalysis {
    /** Primary change type */
    type: ChangeType;
    /** Affected scope (e.g., component name) */
    scope?: string;
    /** Brief description of changes */
    description: string;
    /** Whether this is a breaking change */
    breaking: boolean;
    /** Files involved in this change */
    files: string[];
    /** Additional context */
    context?: Record<string, unknown>;
}
/**
 * Commit decision result
 */
export interface CommitDecision {
    /** Whether to proceed with commit */
    shouldCommit: boolean;
    /** Reason for the decision */
    reason: string;
    /** Suggested commit message if should commit */
    suggestedMessage?: string;
    /** Analysis of changes */
    analysis?: ChangeAnalysis;
}
/**
 * Auto-commit result
 */
export interface AutoCommitResult {
    /** Whether the commit was successful */
    success: boolean;
    /** Commit hash if successful */
    hash?: string;
    /** Generated commit message */
    message?: string;
    /** Error message if failed */
    error?: string;
    /** Change analysis */
    analysis?: ChangeAnalysis;
}
/**
 * Auto-commit error
 */
export declare class AutoCommitError extends KnowledgeGraphError {
    constructor(message: string);
}
/**
 * AutoCommit Class
 *
 * Provides intelligent auto-commit functionality with smart message generation.
 */
export declare class AutoCommit {
    private git;
    private logger;
    private config;
    constructor(config?: AutoCommitConfig);
    /**
     * Analyze changes and determine the appropriate change type
     */
    analyzeChanges(status?: GitStatusSummary): Promise<ChangeAnalysis>;
    /**
     * Generate a commit message based on analysis
     */
    generateCommitMessage(analysis: ChangeAnalysis): string;
    /**
     * Determine if changes should be committed
     */
    shouldCommit(options?: {
        minFiles?: number;
        minChanges?: number;
        excludeTypes?: ChangeType[];
    }): Promise<CommitDecision>;
    /**
     * Perform an auto-commit
     */
    commit(options?: {
        message?: string;
        stageAll?: boolean;
        files?: string[];
        dryRun?: boolean;
    }): Promise<AutoCommitResult>;
    /**
     * Smart commit with knowledge graph awareness
     */
    smartCommit(options?: {
        knowledgeGraphChanges?: {
            nodesAdded?: number;
            nodesUpdated?: number;
            nodesDeleted?: number;
            linksChanged?: number;
        };
        additionalContext?: Record<string, unknown>;
        dryRun?: boolean;
    }): Promise<AutoCommitResult>;
    /**
     * Get file change type based on path and extension
     */
    private getFileChangeType;
    /**
     * Get scope from file path
     */
    private getFileScope;
    /**
     * Generate description based on files and type
     */
    private generateDescription;
    /**
     * Get verb for change type
     */
    private getTypeVerb;
    /**
     * Filter out excluded files
     */
    private filterExcludedFiles;
}
/**
 * Create an AutoCommit instance
 */
export declare function createAutoCommit(config?: AutoCommitConfig): AutoCommit;
//# sourceMappingURL=auto-commit.d.ts.map