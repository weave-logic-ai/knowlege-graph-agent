/**
 * Directory Scanner for Vault Initialization
 * Fast, reliable directory traversal with .gitignore support
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync, statSync } from 'node:fs';
import fg from 'fast-glob';
import ignore, { type Ignore } from 'ignore';

export interface FileNode {
  path: string;
  relativePath: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
}

export interface ScanOptions {
  /**
   * Respect .gitignore patterns (default: true)
   */
  respectGitignore?: boolean;

  /**
   * Maximum depth to traverse (default: Infinity)
   */
  maxDepth?: number;

  /**
   * Custom ignore patterns in addition to defaults
   */
  customIgnore?: string[];

  /**
   * Include directories in results (default: false)
   */
  includeDirs?: boolean;

  /**
   * Follow symbolic links (default: false)
   */
  followSymlinks?: boolean;
}

export interface ScanStats {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  duration: number;
  ignored: number;
}

/**
 * Default patterns to ignore
 */
const DEFAULT_IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  '.next/**',
  'out/**',
  'coverage/**',
  '.nyc_output/**',
  '.turbo/**',
  '.cache/**',
  '.swarm/**',
  '.task-logs/**',
  '**/*.log',
  '.DS_Store',
  'Thumbs.db',
];

/**
 * Cache for resolved symlinks to detect cycles
 */
const symlinkCache = new Map<string, Set<string>>();

/**
 * Parse .gitignore file and create ignore matcher
 */
async function loadGitignore(rootPath: string): Promise<Ignore | null> {
  const gitignorePath = path.join(rootPath, '.gitignore');

  try {
    if (!existsSync(gitignorePath)) {
      return null;
    }

    const content = await fs.readFile(gitignorePath, 'utf-8');
    const ig = ignore();
    ig.add(content);
    return ig;
  } catch (error) {
    console.warn(`Failed to read .gitignore: ${error}`);
    return null;
  }
}

/**
 * Check if a path is a symbolic link and detect cycles
 */
async function checkSymlink(filePath: string, rootPath: string): Promise<boolean> {
  try {
    const stats = await fs.lstat(filePath);
    if (!stats.isSymbolicLink()) {
      return false;
    }

    const realPath = await fs.realpath(filePath);
    const cacheKey = rootPath;

    if (!symlinkCache.has(cacheKey)) {
      symlinkCache.set(cacheKey, new Set());
    }

    const visited = symlinkCache.get(cacheKey)!;
    if (visited.has(realPath)) {
      console.warn(`Symlink cycle detected: ${filePath} -> ${realPath}`);
      return true; // Cycle detected
    }

    visited.add(realPath);
    return false;
  } catch {
    return false;
  }
}


/**
 * Scan directory using fast-glob for optimal performance
 */
export async function scanDirectory(
  rootPath: string,
  options: ScanOptions = {}
): Promise<FileNode[]> {
  // Validate root path
  if (!existsSync(rootPath)) {
    throw new Error(`Path does not exist: ${rootPath}`);
  }

  const stats = statSync(rootPath);
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${rootPath}`);
  }

  const {
    respectGitignore = true,
    maxDepth = Infinity,
    customIgnore = [],
    includeDirs = false,
    followSymlinks = false,
  } = options;

  // Build ignore patterns
  const ignorePatterns = [...DEFAULT_IGNORE_PATTERNS, ...customIgnore];

  // Load .gitignore if requested
  let gitignore: Ignore | null = null;
  if (respectGitignore) {
    gitignore = await loadGitignore(rootPath);
  }

  // Configure fast-glob with depth control
  const globOptions: fg.Options = {
    cwd: rootPath,
    ignore: ignorePatterns,
    absolute: false,
    dot: true,
    followSymbolicLinks: followSymlinks,
    onlyFiles: !includeDirs,
    stats: true,
    suppressErrors: true,
  };

  // Add depth if specified
  if (maxDepth !== Infinity) {
    globOptions.deep = maxDepth;
  }

  const entries = await fg('**/*', globOptions);

  // Process entries
  const results: FileNode[] = [];
  const stats_data = {
    totalFiles: 0,
    totalDirectories: 0,
    totalSize: 0,
    ignored: 0,
  };

  for (const entry of entries) {
    const relativePath = typeof entry === 'string' ? entry : (entry as { path: string }).path;
    const fullPath = path.join(rootPath, relativePath);

    // Apply .gitignore rules
    if (gitignore && gitignore.ignores(relativePath)) {
      stats_data.ignored++;
      continue;
    }

    // Check for symlink cycles
    if (followSymlinks && await checkSymlink(fullPath, rootPath)) {
      continue;
    }

    try {
      const fileStats = await fs.stat(fullPath);
      const isDirectory = fileStats.isDirectory();

      // Get metadata for files
      let metadata: Pick<FileNode, 'size' | 'modified'> = {};
      if (!isDirectory) {
        metadata = {
          size: fileStats.size,
          modified: fileStats.mtime,
        };
        stats_data.totalFiles++;
        stats_data.totalSize += fileStats.size;
      } else {
        stats_data.totalDirectories++;
      }

      // Add to results if not a directory or if includeDirs is true
      if (!isDirectory || includeDirs) {
        results.push({
          path: fullPath,
          relativePath,
          type: isDirectory ? 'directory' : 'file',
          ...metadata,
        });
      }
    } catch (error) {
      // Skip files that can't be accessed
      console.warn(`Failed to stat ${fullPath}: ${error}`);
      continue;
    }
  }

  // Clear symlink cache for this scan
  symlinkCache.delete(rootPath);

  return results;
}

/**
 * Scan directory and return statistics
 */
export async function scanDirectoryWithStats(
  rootPath: string,
  options: ScanOptions = {}
): Promise<{ files: FileNode[]; stats: ScanStats }> {
  const startTime = Date.now();
  const files = await scanDirectory(rootPath, options);

  const stats: ScanStats = {
    totalFiles: files.filter(f => f.type === 'file').length,
    totalDirectories: files.filter(f => f.type === 'directory').length,
    totalSize: files.reduce((sum, f) => sum + (f.size || 0), 0),
    duration: Date.now() - startTime,
    ignored: 0, // This is tracked during scan but not exposed here
  };

  return { files, stats };
}

/**
 * Scan multiple directories in parallel
 */
export async function scanDirectories(
  paths: string[],
  options: ScanOptions = {}
): Promise<Map<string, FileNode[]>> {
  const results = await Promise.all(
    paths.map(async (p) => {
      const files = await scanDirectory(p, options);
      return [p, files] as const;
    })
  );

  return new Map(results);
}

/**
 * Count files in directory (fast, no metadata)
 */
export async function countFiles(
  rootPath: string,
  options: ScanOptions = {}
): Promise<number> {
  const { customIgnore = [] } = options;

  const ignorePatterns = [...DEFAULT_IGNORE_PATTERNS, ...customIgnore];

  // Use fast-glob to count files
  const files = await fg('**/*', {
    cwd: rootPath,
    ignore: ignorePatterns,
    onlyFiles: true,
    suppressErrors: true,
  });

  return files.length;
}
