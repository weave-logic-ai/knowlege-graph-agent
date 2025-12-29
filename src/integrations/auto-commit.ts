/**
 * Auto-Commit Integration
 *
 * Provides automatic commit functionality with intelligent message generation
 * based on knowledge graph changes and file modifications.
 *
 * @module integrations/auto-commit
 */

import { GitClient, GitStatusSummary, GitDiffSummary, createGitClient } from './git.js';
import { createLogger, Logger, KnowledgeGraphError, ErrorCategory, ErrorSeverity } from '../utils/index.js';

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
export enum ChangeType {
  ADD = 'add',
  UPDATE = 'update',
  DELETE = 'delete',
  RENAME = 'rename',
  REFACTOR = 'refactor',
  FIX = 'fix',
  DOCS = 'docs',
  CONFIG = 'config',
  STYLE = 'style',
  TEST = 'test',
  BUILD = 'build',
  CHORE = 'chore',
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
export class AutoCommitError extends KnowledgeGraphError {
  constructor(message: string) {
    super(message, {
      category: ErrorCategory.RESOURCE,
      severity: ErrorSeverity.ERROR,
      retryable: false,
      code: 'AUTO_COMMIT_ERROR',
    });
    this.name = 'AutoCommitError';
  }
}

/**
 * File extension to change type mapping
 */
const FILE_TYPE_MAPPINGS: Record<string, ChangeType> = {
  // Documentation
  '.md': ChangeType.DOCS,
  '.mdx': ChangeType.DOCS,
  '.txt': ChangeType.DOCS,
  '.rst': ChangeType.DOCS,

  // Configuration
  '.json': ChangeType.CONFIG,
  '.yaml': ChangeType.CONFIG,
  '.yml': ChangeType.CONFIG,
  '.toml': ChangeType.CONFIG,
  '.ini': ChangeType.CONFIG,
  '.env': ChangeType.CONFIG,
  '.config': ChangeType.CONFIG,

  // Tests
  '.test.ts': ChangeType.TEST,
  '.test.js': ChangeType.TEST,
  '.spec.ts': ChangeType.TEST,
  '.spec.js': ChangeType.TEST,

  // Build
  '.dockerfile': ChangeType.BUILD,
  '.dockerignore': ChangeType.BUILD,

  // Style
  '.css': ChangeType.STYLE,
  '.scss': ChangeType.STYLE,
  '.sass': ChangeType.STYLE,
  '.less': ChangeType.STYLE,
};

/**
 * Directory to scope mapping
 */
const DIRECTORY_SCOPE_MAPPINGS: Record<string, string> = {
  'src/cli': 'cli',
  'src/core': 'core',
  'src/utils': 'utils',
  'src/integrations': 'integrations',
  'src/templates': 'templates',
  'tests': 'test',
  'docs': 'docs',
  'scripts': 'scripts',
};

/**
 * AutoCommit Class
 *
 * Provides intelligent auto-commit functionality with smart message generation.
 */
export class AutoCommit {
  private git: GitClient;
  private logger: Logger;
  private config: Required<AutoCommitConfig>;

  constructor(config: AutoCommitConfig = {}) {
    this.config = {
      gitClient: config.gitClient || createGitClient({ workingDirectory: config.workingDirectory }),
      logger: config.logger || createLogger('auto-commit'),
      workingDirectory: config.workingDirectory || process.cwd(),
      messagePrefix: config.messagePrefix || '',
      includeFileList: config.includeFileList ?? true,
      maxFilesInMessage: config.maxFilesInMessage ?? 5,
      messageTemplate: config.messageTemplate || '{type}{scope}: {description}',
      stageAll: config.stageAll ?? false,
      excludePatterns: config.excludePatterns || ['.env', '.env.local', '*.log', 'node_modules'],
    };

    this.git = this.config.gitClient;
    this.logger = this.config.logger;
  }

  /**
   * Analyze changes and determine the appropriate change type
   */
  async analyzeChanges(status?: GitStatusSummary): Promise<ChangeAnalysis> {
    const currentStatus = status || await this.git.getStatus();
    const files = currentStatus.files.map(f => f.path);

    if (files.length === 0) {
      return {
        type: ChangeType.CHORE,
        description: 'no changes detected',
        breaking: false,
        files: [],
      };
    }

    // Analyze file types and determine primary change type
    const typeScores: Record<ChangeType, number> = {} as Record<ChangeType, number>;
    const scopes: string[] = [];

    for (const file of files) {
      const fileType = this.getFileChangeType(file);
      typeScores[fileType] = (typeScores[fileType] || 0) + 1;

      const scope = this.getFileScope(file);
      if (scope && !scopes.includes(scope)) {
        scopes.push(scope);
      }
    }

    // Determine primary type by highest score
    let primaryType = ChangeType.UPDATE;
    let maxScore = 0;

    for (const [type, score] of Object.entries(typeScores)) {
      if (score > maxScore) {
        maxScore = score;
        primaryType = type as ChangeType;
      }
    }

    // Check for additions/deletions
    const addedFiles = currentStatus.files.filter(f => f.indexStatus === 'A' || f.workingTreeStatus === '?');
    const deletedFiles = currentStatus.files.filter(f => f.indexStatus === 'D' || f.workingTreeStatus === 'D');

    if (addedFiles.length > deletedFiles.length && addedFiles.length > currentStatus.modified) {
      primaryType = ChangeType.ADD;
    } else if (deletedFiles.length > addedFiles.length && deletedFiles.length > currentStatus.modified) {
      primaryType = ChangeType.DELETE;
    }

    // Generate description based on changes
    const description = this.generateDescription(files, primaryType, currentStatus);

    // Determine scope
    const scope = scopes.length === 1 ? scopes[0] : (scopes.length > 1 ? scopes.slice(0, 2).join(',') : undefined);

    return {
      type: primaryType,
      scope,
      description,
      breaking: false,
      files,
      context: {
        staged: currentStatus.staged,
        modified: currentStatus.modified,
        untracked: currentStatus.untracked,
        deleted: currentStatus.deleted,
      },
    };
  }

  /**
   * Generate a commit message based on analysis
   */
  generateCommitMessage(analysis: ChangeAnalysis): string {
    const { type, scope, description, breaking, files } = analysis;

    // Build the main message
    let message = this.config.messageTemplate
      .replace('{type}', type)
      .replace('{scope}', scope ? `(${scope})` : '')
      .replace('{description}', description);

    // Add prefix if configured
    if (this.config.messagePrefix) {
      message = `${this.config.messagePrefix} ${message}`;
    }

    // Add breaking change indicator
    if (breaking) {
      message = message.replace(':', '!:');
    }

    // Add file list if configured
    if (this.config.includeFileList && files.length > 0) {
      const fileList = files.slice(0, this.config.maxFilesInMessage);
      const remaining = files.length - fileList.length;

      message += '\n\nFiles:\n';
      message += fileList.map(f => `- ${f}`).join('\n');

      if (remaining > 0) {
        message += `\n- ... and ${remaining} more files`;
      }
    }

    return message;
  }

  /**
   * Determine if changes should be committed
   */
  async shouldCommit(options: {
    minFiles?: number;
    minChanges?: number;
    excludeTypes?: ChangeType[];
  } = {}): Promise<CommitDecision> {
    const minFiles = options.minFiles ?? 1;
    const minChanges = options.minChanges ?? 1;
    const excludeTypes = options.excludeTypes ?? [];

    try {
      const status = await this.git.getStatus();

      // Check if there are any changes
      if (status.isClean) {
        return {
          shouldCommit: false,
          reason: 'No changes to commit',
        };
      }

      // Check minimum file threshold
      if (status.files.length < minFiles) {
        return {
          shouldCommit: false,
          reason: `Not enough files changed (${status.files.length} < ${minFiles})`,
        };
      }

      // Analyze changes
      const analysis = await this.analyzeChanges(status);

      // Check excluded types
      if (excludeTypes.includes(analysis.type)) {
        return {
          shouldCommit: false,
          reason: `Change type "${analysis.type}" is excluded`,
          analysis,
        };
      }

      // Check for excluded patterns
      const filteredFiles = this.filterExcludedFiles(status.files.map(f => f.path));
      if (filteredFiles.length === 0) {
        return {
          shouldCommit: false,
          reason: 'All changes match exclude patterns',
          analysis,
        };
      }

      // Get diff to check change volume
      const diff = await this.git.getDiff();
      const totalChanges = diff.insertions + diff.deletions;

      if (totalChanges < minChanges) {
        return {
          shouldCommit: false,
          reason: `Not enough changes (${totalChanges} < ${minChanges})`,
          analysis,
        };
      }

      // Generate suggested message
      const suggestedMessage = this.generateCommitMessage(analysis);

      return {
        shouldCommit: true,
        reason: `${status.files.length} files changed with ${totalChanges} line changes`,
        suggestedMessage,
        analysis,
      };
    } catch (error) {
      return {
        shouldCommit: false,
        reason: `Error analyzing changes: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Perform an auto-commit
   */
  async commit(options: {
    message?: string;
    stageAll?: boolean;
    files?: string[];
    dryRun?: boolean;
  } = {}): Promise<AutoCommitResult> {
    try {
      const stageAll = options.stageAll ?? this.config.stageAll;

      // Stage files if requested
      if (stageAll) {
        await this.git.add('.');
      } else if (options.files && options.files.length > 0) {
        await this.git.add(options.files);
      }

      // Get current status and analyze
      const status = await this.git.getStatus();
      const analysis = await this.analyzeChanges(status);

      // Generate or use provided message
      const message = options.message || this.generateCommitMessage(analysis);

      // Check if it's a dry run
      if (options.dryRun) {
        this.logger.info('Dry run - would commit with message:', { message });
        return {
          success: true,
          message,
          analysis,
        };
      }

      // Perform the commit
      const result = await this.git.commit({ message });

      if (result.success) {
        this.logger.info('Auto-commit successful', {
          hash: result.hash,
          message,
        });

        return {
          success: true,
          hash: result.hash,
          message,
          analysis,
        };
      }

      return {
        success: false,
        error: result.error,
        message,
        analysis,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Auto-commit failed', new Error(errorMessage));

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Smart commit with knowledge graph awareness
   */
  async smartCommit(options: {
    knowledgeGraphChanges?: {
      nodesAdded?: number;
      nodesUpdated?: number;
      nodesDeleted?: number;
      linksChanged?: number;
    };
    additionalContext?: Record<string, unknown>;
    dryRun?: boolean;
  } = {}): Promise<AutoCommitResult> {
    const decision = await this.shouldCommit();

    if (!decision.shouldCommit) {
      return {
        success: false,
        error: decision.reason,
      };
    }

    let message = decision.suggestedMessage || '';

    // Enhance message with knowledge graph context if provided
    if (options.knowledgeGraphChanges) {
      const { nodesAdded, nodesUpdated, nodesDeleted, linksChanged } = options.knowledgeGraphChanges;
      const kgChanges: string[] = [];

      if (nodesAdded) kgChanges.push(`${nodesAdded} nodes added`);
      if (nodesUpdated) kgChanges.push(`${nodesUpdated} nodes updated`);
      if (nodesDeleted) kgChanges.push(`${nodesDeleted} nodes deleted`);
      if (linksChanged) kgChanges.push(`${linksChanged} links changed`);

      if (kgChanges.length > 0) {
        message += `\n\nKnowledge Graph:\n- ${kgChanges.join('\n- ')}`;
      }
    }

    // Add additional context
    if (options.additionalContext) {
      message += `\n\nContext:\n${JSON.stringify(options.additionalContext, null, 2)}`;
    }

    return this.commit({
      message,
      stageAll: true,
      dryRun: options.dryRun,
    });
  }

  /**
   * Get file change type based on path and extension
   */
  private getFileChangeType(filePath: string): ChangeType {
    const lowerPath = filePath.toLowerCase();

    // Check for test files first (more specific patterns)
    if (lowerPath.includes('.test.') || lowerPath.includes('.spec.') || lowerPath.includes('/tests/')) {
      return ChangeType.TEST;
    }

    // Check for build files
    if (lowerPath.includes('dockerfile') || lowerPath.includes('makefile') || lowerPath.includes('.github/workflows')) {
      return ChangeType.BUILD;
    }

    // Check extension mappings
    for (const [ext, type] of Object.entries(FILE_TYPE_MAPPINGS)) {
      if (lowerPath.endsWith(ext)) {
        return type;
      }
    }

    // Check for config files by name
    if (lowerPath.includes('config') || lowerPath.includes('settings')) {
      return ChangeType.CONFIG;
    }

    // Default to update for code changes
    return ChangeType.UPDATE;
  }

  /**
   * Get scope from file path
   */
  private getFileScope(filePath: string): string | undefined {
    for (const [dir, scope] of Object.entries(DIRECTORY_SCOPE_MAPPINGS)) {
      if (filePath.startsWith(dir) || filePath.includes(`/${dir}/`)) {
        return scope;
      }
    }

    // Extract from path structure
    const parts = filePath.split('/');
    if (parts.length > 2 && parts[0] === 'src') {
      return parts[1];
    }

    return undefined;
  }

  /**
   * Generate description based on files and type
   */
  private generateDescription(files: string[], type: ChangeType, status: GitStatusSummary): string {
    // Single file - use file name
    if (files.length === 1) {
      const fileName = files[0].split('/').pop() || files[0];
      return `${this.getTypeVerb(type)} ${fileName}`;
    }

    // Multiple files - summarize
    const extensions = new Set(files.map(f => {
      const ext = f.split('.').pop();
      return ext ? `.${ext}` : '';
    }));

    if (extensions.size === 1 && extensions.has('.md')) {
      return `${this.getTypeVerb(type)} documentation`;
    }

    if (extensions.size === 1 && (extensions.has('.ts') || extensions.has('.js'))) {
      return `${this.getTypeVerb(type)} source files`;
    }

    return `${this.getTypeVerb(type)} ${files.length} files`;
  }

  /**
   * Get verb for change type
   */
  private getTypeVerb(type: ChangeType): string {
    switch (type) {
      case ChangeType.ADD:
        return 'add';
      case ChangeType.DELETE:
        return 'remove';
      case ChangeType.UPDATE:
        return 'update';
      case ChangeType.REFACTOR:
        return 'refactor';
      case ChangeType.FIX:
        return 'fix';
      case ChangeType.DOCS:
        return 'document';
      case ChangeType.CONFIG:
        return 'configure';
      case ChangeType.STYLE:
        return 'style';
      case ChangeType.TEST:
        return 'test';
      case ChangeType.BUILD:
        return 'build';
      case ChangeType.CHORE:
        return 'chore';
      default:
        return 'update';
    }
  }

  /**
   * Filter out excluded files
   */
  private filterExcludedFiles(files: string[]): string[] {
    return files.filter(file => {
      for (const pattern of this.config.excludePatterns) {
        // Simple pattern matching
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          if (regex.test(file)) return false;
        } else if (file.includes(pattern)) {
          return false;
        }
      }
      return true;
    });
  }
}

/**
 * Create an AutoCommit instance
 */
export function createAutoCommit(config: AutoCommitConfig = {}): AutoCommit {
  return new AutoCommit(config);
}
