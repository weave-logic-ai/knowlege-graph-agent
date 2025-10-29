/**
 * Diff Analyzer - Parse and analyze git diffs
 *
 * Extracts structured information from git diffs including:
 * - Files changed (added, modified, deleted, renamed)
 * - Change type detection (feat, fix, docs, etc.)
 * - Scope inference from file paths
 * - Breaking change heuristics
 * - Line statistics
 *
 * @module git/diff-analyzer
 */

export interface DiffStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface FileChange {
  path: string;
  oldPath?: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  insertions: number;
  deletions: number;
}

export interface DiffAnalysis {
  files: FileChange[];
  stats: DiffStats;
  suggestedType: ConventionalCommitType;
  suggestedScope?: string;
  hasBreakingChanges: boolean;
  breakingChangeIndicators: string[];
}

export type ConventionalCommitType =
  | 'feat'
  | 'fix'
  | 'docs'
  | 'style'
  | 'refactor'
  | 'perf'
  | 'test'
  | 'build'
  | 'ci'
  | 'chore'
  | 'revert';

/**
 * Parse git diff output to extract file changes
 */
export function parseDiff(diffOutput: string): FileChange[] {
  const changes: FileChange[] = [];
  const lines = diffOutput.split('\n');

  let currentFile: Partial<FileChange> | null = null;
  let insertions = 0;
  let deletions = 0;

  for (const line of lines) {
    // New file header
    if (line.startsWith('diff --git')) {
      // Save previous file if exists
      if (currentFile?.path) {
        changes.push({
          path: currentFile.path,
          oldPath: currentFile.oldPath,
          status: currentFile.status ?? 'modified',
          insertions,
          deletions
        });
      }

      // Reset counters
      insertions = 0;
      deletions = 0;
      currentFile = {};
      continue;
    }

    // New file
    if (line.startsWith('new file mode')) {
      if (currentFile) currentFile.status = 'added';
      continue;
    }

    // Deleted file
    if (line.startsWith('deleted file mode')) {
      if (currentFile) currentFile.status = 'deleted';
      continue;
    }

    // Renamed file
    if (line.startsWith('rename from')) {
      const oldPath = line.replace('rename from ', '').trim();
      if (currentFile) {
        currentFile.oldPath = oldPath;
        currentFile.status = 'renamed';
      }
      continue;
    }

    if (line.startsWith('rename to')) {
      const newPath = line.replace('rename to ', '').trim();
      if (currentFile) currentFile.path = newPath;
      continue;
    }

    // File path in --- and +++ lines
    if (line.startsWith('---')) {
      const match = line.match(/^--- a\/(.+)$/);
      if (match?.[1] && currentFile && !currentFile.oldPath) {
        currentFile.oldPath = match[1];
      }
      continue;
    }

    if (line.startsWith('+++')) {
      const match = line.match(/^\+\+\+ b\/(.+)$/);
      if (match?.[1] && currentFile) {
        currentFile.path = match[1];
        if (!currentFile.status) {
          currentFile.status = 'modified';
        }
      }
      continue;
    }

    // Count insertions and deletions
    if (line.startsWith('+') && !line.startsWith('+++')) {
      insertions++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++;
    }
  }

  // Save last file
  if (currentFile?.path) {
    changes.push({
      path: currentFile.path,
      oldPath: currentFile.oldPath,
      status: currentFile.status ?? 'modified',
      insertions,
      deletions
    });
  }

  return changes;
}

/**
 * Calculate diff statistics
 */
export function calculateStats(files: FileChange[]): DiffStats {
  return {
    filesChanged: files.length,
    insertions: files.reduce((sum, f) => sum + f.insertions, 0),
    deletions: files.reduce((sum, f) => sum + f.deletions, 0)
  };
}

/**
 * Infer commit type from file changes
 */
export function inferCommitType(files: FileChange[]): ConventionalCommitType {
  const paths = files.map(f => f.path.toLowerCase());

  // Test files
  if (paths.some(p => p.includes('test') || p.includes('spec') || p.includes('__tests__'))) {
    return 'test';
  }

  // Documentation
  if (paths.every(p => p.endsWith('.md') || p.includes('docs/'))) {
    return 'docs';
  }

  // CI/CD
  if (paths.some(p =>
    p.includes('.github/workflows') ||
    p.includes('.gitlab-ci') ||
    p.includes('jenkinsfile') ||
    p.includes('.circleci')
  )) {
    return 'ci';
  }

  // Build files
  if (paths.some(p =>
    p.includes('package.json') ||
    p.includes('package-lock.json') ||
    p.includes('yarn.lock') ||
    p.includes('pnpm-lock') ||
    p.includes('bun.lockb') ||
    p.includes('webpack') ||
    p.includes('vite.config') ||
    p.includes('tsconfig')
  )) {
    return 'build';
  }

  // Style/formatting
  if (paths.some(p =>
    p.includes('.css') ||
    p.includes('.scss') ||
    p.includes('.less') ||
    p.includes('prettier') ||
    p.includes('eslint')
  )) {
    return 'style';
  }

  // New files suggest feature
  const hasNewFiles = files.some(f => f.status === 'added');
  if (hasNewFiles) {
    return 'feat';
  }

  // Default to fix or refactor based on change size
  const totalChanges = files.reduce((sum, f) => sum + f.insertions + f.deletions, 0);
  return totalChanges > 100 ? 'refactor' : 'fix';
}

/**
 * Infer scope from file paths
 */
export function inferScope(files: FileChange[]): string | undefined {
  if (files.length === 0) return undefined;

  // Extract directory names
  const directories = files
    .map(f => {
      const parts = f.path.split('/');
      return parts.length > 1 ? parts[0] : null;
    })
    .filter((d): d is string => d !== null);

  if (directories.length === 0) return undefined;

  // Find most common directory
  const dirCounts = new Map<string, number>();
  for (const dir of directories) {
    dirCounts.set(dir, (dirCounts.get(dir) ?? 0) + 1);
  }

  const sortedDirs = Array.from(dirCounts.entries())
    .sort((a, b) => b[1] - a[1]);

  const [mostCommonDir, count] = sortedDirs[0] ?? [undefined, 0];

  // Use scope if it's common across most files
  if (mostCommonDir && count >= files.length * 0.5) {
    // Clean up scope name
    return mostCommonDir
      .replace(/^(src|lib|dist|build)\//, '')
      .replace(/\/(index|main)$/, '')
      .replace(/[_-]/g, '-')
      .toLowerCase();
  }

  return undefined;
}

/**
 * Detect potential breaking changes
 */
export function detectBreakingChanges(
  files: FileChange[],
  diffOutput: string
): { hasBreakingChanges: boolean; indicators: string[] } {
  const indicators: string[] = [];

  // Check for deleted files
  const deletedFiles = files.filter(f => f.status === 'deleted');
  if (deletedFiles.length > 0) {
    indicators.push(`Deleted ${deletedFiles.length} file(s)`);
  }

  // Check for renamed files
  const renamedFiles = files.filter(f => f.status === 'renamed');
  if (renamedFiles.length > 0) {
    indicators.push(`Renamed ${renamedFiles.length} file(s)`);
  }

  // Check diff content for breaking change keywords
  const diffLower = diffOutput.toLowerCase();
  const breakingKeywords = [
    'breaking change',
    'breaking:',
    'deprecated',
    'removed',
    'renamed parameter',
    'changed signature',
    'incompatible'
  ];

  for (const keyword of breakingKeywords) {
    if (diffLower.includes(keyword)) {
      indicators.push(`Contains "${keyword}"`);
    }
  }

  // Check for major version changes in package.json
  if (diffOutput.includes('package.json')) {
    const versionMatch = diffOutput.match(/[-+]\s*"version":\s*"(\d+)\./);
    if (versionMatch) {
      indicators.push('Version number changed');
    }
  }

  return {
    hasBreakingChanges: indicators.length > 0,
    indicators
  };
}

/**
 * Analyze git diff output completely
 */
export function analyzeDiff(diffOutput: string): DiffAnalysis {
  const files = parseDiff(diffOutput);
  const stats = calculateStats(files);
  const suggestedType = inferCommitType(files);
  const suggestedScope = inferScope(files);
  const { hasBreakingChanges, indicators } = detectBreakingChanges(files, diffOutput);

  return {
    files,
    stats,
    suggestedType,
    suggestedScope,
    hasBreakingChanges,
    breakingChangeIndicators: indicators
  };
}
