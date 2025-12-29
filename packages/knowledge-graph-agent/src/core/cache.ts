/**
 * Shadow Cache - File Metadata Caching
 *
 * Provides a caching layer for file metadata to enable incremental updates
 * and improve performance when analyzing large codebases.
 *
 * @module core/cache
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import { createHash } from 'crypto';
import { createLogger } from '../utils/index.js';

const logger = createLogger('shadow-cache');

/**
 * File metadata stored in cache
 */
export interface FileMetadata {
  /** Relative path from project root */
  path: string;
  /** File size in bytes */
  size: number;
  /** Modification time (Unix timestamp) */
  mtime: number;
  /** Content hash (MD5) */
  hash: string;
  /** File type inferred from extension */
  type: FileType;
  /** When this entry was cached */
  cachedAt: number;
}

/**
 * File types for classification
 */
export type FileType =
  | 'markdown'
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'rust'
  | 'go'
  | 'java'
  | 'php'
  | 'ruby'
  | 'yaml'
  | 'json'
  | 'toml'
  | 'config'
  | 'docker'
  | 'other';

/**
 * Cache entry change type
 */
export type ChangeType = 'added' | 'modified' | 'deleted' | 'unchanged';

/**
 * File change information
 */
export interface FileChange {
  path: string;
  change: ChangeType;
  oldMeta?: FileMetadata;
  newMeta?: FileMetadata;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  totalEntries: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  sizeBytes: number;
  lastUpdated: number | null;
  staleEntries: number;
}

/**
 * Shadow Cache options
 */
export interface ShadowCacheOptions {
  /** Project root directory */
  projectRoot: string;
  /** Cache directory (relative to .kg) */
  cacheDir?: string;
  /** Default TTL in milliseconds (default: 1 hour) */
  defaultTTL?: number;
  /** Maximum entries before pruning (default: 10000) */
  maxEntries?: number;
  /** Enable persistence to disk (default: true) */
  persist?: boolean;
}

/**
 * Cache data structure stored on disk
 */
interface CacheData {
  version: number;
  projectRoot: string;
  createdAt: number;
  updatedAt: number;
  entries: Record<string, FileMetadata>;
}

const CACHE_VERSION = 1;
const CACHE_FILENAME = 'shadow-cache.json';

/**
 * Shadow Cache for file metadata
 *
 * Provides efficient caching of file metadata to enable:
 * - Incremental graph updates (only process changed files)
 * - Fast file existence/modification checks
 * - Content hash comparison
 *
 * @example
 * ```typescript
 * const cache = new ShadowCache({ projectRoot: '/my/project' });
 * await cache.load();
 *
 * // Check for changes
 * const changes = await cache.detectChanges(['docs/**\/*.md']);
 *
 * // Process only changed files
 * for (const change of changes) {
 *   if (change.change !== 'unchanged') {
 *     console.log(`${change.path}: ${change.change}`);
 *   }
 * }
 *
 * // Update cache with processed files
 * await cache.save();
 * ```
 */
export class ShadowCache {
  private projectRoot: string;
  private cacheDir: string;
  private cachePath: string;
  private defaultTTL: number;
  private maxEntries: number;
  private persist: boolean;

  private entries: Map<string, FileMetadata> = new Map();
  private hitCount = 0;
  private missCount = 0;
  private loaded = false;
  private dirty = false;
  private createdAt: number;
  private updatedAt: number;

  constructor(options: ShadowCacheOptions) {
    this.projectRoot = options.projectRoot;
    this.cacheDir = options.cacheDir || '.kg';
    this.cachePath = join(this.projectRoot, this.cacheDir, CACHE_FILENAME);
    this.defaultTTL = options.defaultTTL || 60 * 60 * 1000; // 1 hour
    this.maxEntries = options.maxEntries || 10000;
    this.persist = options.persist !== false;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }

  /**
   * Load cache from disk
   */
  async load(): Promise<boolean> {
    if (!this.persist) {
      this.loaded = true;
      return true;
    }

    try {
      if (existsSync(this.cachePath)) {
        const data = JSON.parse(readFileSync(this.cachePath, 'utf-8')) as CacheData;

        // Verify cache is for this project
        if (data.projectRoot !== this.projectRoot) {
          logger.warn('Cache project root mismatch, starting fresh');
          this.loaded = true;
          return false;
        }

        // Check version compatibility
        if (data.version !== CACHE_VERSION) {
          logger.warn('Cache version mismatch, starting fresh', {
            cacheVersion: data.version,
            expectedVersion: CACHE_VERSION,
          });
          this.loaded = true;
          return false;
        }

        // Load entries
        this.entries = new Map(Object.entries(data.entries));
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
        this.loaded = true;

        logger.info('Cache loaded', { entries: this.entries.size });
        return true;
      }
    } catch (error) {
      logger.error('Failed to load cache', error instanceof Error ? error : new Error(String(error)));
    }

    this.loaded = true;
    return false;
  }

  /**
   * Save cache to disk
   */
  async save(): Promise<boolean> {
    if (!this.persist || !this.dirty) {
      return true;
    }

    try {
      // Ensure cache directory exists
      const cacheDir = dirname(this.cachePath);
      if (!existsSync(cacheDir)) {
        mkdirSync(cacheDir, { recursive: true });
      }

      // Prune if needed
      await this.prune();

      const data: CacheData = {
        version: CACHE_VERSION,
        projectRoot: this.projectRoot,
        createdAt: this.createdAt,
        updatedAt: Date.now(),
        entries: Object.fromEntries(this.entries),
      };

      writeFileSync(this.cachePath, JSON.stringify(data, null, 2));
      this.updatedAt = data.updatedAt;
      this.dirty = false;

      logger.info('Cache saved', { entries: this.entries.size });
      return true;
    } catch (error) {
      logger.error('Failed to save cache', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Get cached metadata for a file
   */
  get(filePath: string): FileMetadata | undefined {
    const relativePath = this.normalizePath(filePath);
    const entry = this.entries.get(relativePath);

    if (entry) {
      this.hitCount++;
      return entry;
    }

    this.missCount++;
    return undefined;
  }

  /**
   * Set cached metadata for a file
   */
  set(filePath: string, metadata: Partial<FileMetadata>): FileMetadata {
    const relativePath = this.normalizePath(filePath);
    const fullPath = join(this.projectRoot, relativePath);

    let entry: FileMetadata;

    if (metadata.hash && metadata.size !== undefined && metadata.mtime !== undefined) {
      // Full metadata provided
      entry = {
        path: relativePath,
        size: metadata.size,
        mtime: metadata.mtime,
        hash: metadata.hash,
        type: metadata.type || this.inferFileType(relativePath),
        cachedAt: Date.now(),
      };
    } else {
      // Compute from file
      entry = this.computeMetadata(fullPath, relativePath);
    }

    this.entries.set(relativePath, entry);
    this.dirty = true;
    return entry;
  }

  /**
   * Remove a file from cache
   */
  delete(filePath: string): boolean {
    const relativePath = this.normalizePath(filePath);
    const deleted = this.entries.delete(relativePath);
    if (deleted) {
      this.dirty = true;
    }
    return deleted;
  }

  /**
   * Check if a file exists in cache
   */
  has(filePath: string): boolean {
    const relativePath = this.normalizePath(filePath);
    return this.entries.has(relativePath);
  }

  /**
   * Check if a file has changed since caching
   */
  hasChanged(filePath: string): boolean {
    const relativePath = this.normalizePath(filePath);
    const fullPath = join(this.projectRoot, relativePath);
    const cached = this.entries.get(relativePath);

    if (!cached) {
      return true; // Not in cache = changed (new file)
    }

    try {
      const stats = statSync(fullPath);
      // Quick check: mtime and size
      if (stats.mtimeMs !== cached.mtime || stats.size !== cached.size) {
        return true;
      }
      return false;
    } catch {
      return true; // File doesn't exist = changed (deleted)
    }
  }

  /**
   * Detect changes for a list of files
   */
  async detectChanges(filePaths: string[]): Promise<FileChange[]> {
    const changes: FileChange[] = [];
    const currentFiles = new Set<string>();

    for (const filePath of filePaths) {
      const relativePath = this.normalizePath(filePath);
      const fullPath = join(this.projectRoot, relativePath);
      currentFiles.add(relativePath);

      const cached = this.entries.get(relativePath);

      try {
        const stats = statSync(fullPath);
        const newMeta = this.computeMetadata(fullPath, relativePath);

        if (!cached) {
          changes.push({
            path: relativePath,
            change: 'added',
            newMeta,
          });
        } else if (cached.mtime !== stats.mtimeMs || cached.size !== stats.size) {
          // Full hash comparison for definitive change detection
          if (cached.hash !== newMeta.hash) {
            changes.push({
              path: relativePath,
              change: 'modified',
              oldMeta: cached,
              newMeta,
            });
          } else {
            // mtime changed but content same (touch, etc.)
            changes.push({
              path: relativePath,
              change: 'unchanged',
              oldMeta: cached,
              newMeta,
            });
          }
        } else {
          changes.push({
            path: relativePath,
            change: 'unchanged',
            oldMeta: cached,
            newMeta: cached,
          });
        }
      } catch {
        if (cached) {
          changes.push({
            path: relativePath,
            change: 'deleted',
            oldMeta: cached,
          });
        }
      }
    }

    // Detect deleted files (in cache but not in current list)
    for (const [path, meta] of this.entries) {
      if (!currentFiles.has(path)) {
        changes.push({
          path,
          change: 'deleted',
          oldMeta: meta,
        });
      }
    }

    return changes;
  }

  /**
   * Update cache with detected changes
   */
  applyChanges(changes: FileChange[]): void {
    for (const change of changes) {
      switch (change.change) {
        case 'added':
        case 'modified':
          if (change.newMeta) {
            this.entries.set(change.path, change.newMeta);
          }
          break;
        case 'deleted':
          this.entries.delete(change.path);
          break;
      }
    }
    this.dirty = true;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    let staleCount = 0;
    const now = Date.now();

    for (const entry of this.entries.values()) {
      if (now - entry.cachedAt > this.defaultTTL) {
        staleCount++;
      }
    }

    const totalRequests = this.hitCount + this.missCount;

    return {
      totalEntries: this.entries.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      sizeBytes: this.estimateSize(),
      lastUpdated: this.updatedAt,
      staleEntries: staleCount,
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.entries.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.dirty = true;
  }

  /**
   * Prune stale entries
   */
  async prune(): Promise<number> {
    const now = Date.now();
    let prunedCount = 0;

    // Prune by TTL
    for (const [path, entry] of this.entries) {
      if (now - entry.cachedAt > this.defaultTTL) {
        this.entries.delete(path);
        prunedCount++;
      }
    }

    // Prune by max entries (LRU-ish: oldest cached first)
    if (this.entries.size > this.maxEntries) {
      const entries = Array.from(this.entries.entries())
        .sort((a, b) => a[1].cachedAt - b[1].cachedAt);

      const toRemove = entries.slice(0, entries.length - this.maxEntries);
      for (const [path] of toRemove) {
        this.entries.delete(path);
        prunedCount++;
      }
    }

    if (prunedCount > 0) {
      this.dirty = true;
      logger.info('Pruned cache entries', { count: prunedCount });
    }

    return prunedCount;
  }

  /**
   * Get all cached file paths
   */
  getAllPaths(): string[] {
    return Array.from(this.entries.keys());
  }

  /**
   * Get files by type
   */
  getByType(type: FileType): FileMetadata[] {
    return Array.from(this.entries.values()).filter(e => e.type === type);
  }

  /**
   * Invalidate entries matching a pattern
   */
  invalidate(pattern: RegExp): number {
    let count = 0;
    for (const path of this.entries.keys()) {
      if (pattern.test(path)) {
        this.entries.delete(path);
        count++;
      }
    }
    if (count > 0) {
      this.dirty = true;
    }
    return count;
  }

  // Private helpers

  private normalizePath(filePath: string): string {
    // Make path relative to project root
    if (filePath.startsWith(this.projectRoot)) {
      return relative(this.projectRoot, filePath);
    }
    return filePath;
  }

  private computeMetadata(fullPath: string, relativePath: string): FileMetadata {
    const stats = statSync(fullPath);
    const content = readFileSync(fullPath);
    const hash = createHash('md5').update(content).digest('hex');

    return {
      path: relativePath,
      size: stats.size,
      mtime: stats.mtimeMs,
      hash,
      type: this.inferFileType(relativePath),
      cachedAt: Date.now(),
    };
  }

  private inferFileType(filePath: string): FileType {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const filename = filePath.split('/').pop()?.toLowerCase() || '';

    // Docker files
    if (filename === 'dockerfile' || filename.startsWith('dockerfile.')) {
      return 'docker';
    }
    if (filename.includes('docker-compose') || filename === 'compose.yml' || filename === 'compose.yaml') {
      return 'docker';
    }

    // By extension
    switch (ext) {
      case 'md':
      case 'mdx':
        return 'markdown';
      case 'ts':
      case 'tsx':
      case 'mts':
      case 'cts':
        return 'typescript';
      case 'js':
      case 'jsx':
      case 'mjs':
      case 'cjs':
        return 'javascript';
      case 'py':
      case 'pyw':
        return 'python';
      case 'rs':
        return 'rust';
      case 'go':
        return 'go';
      case 'java':
        return 'java';
      case 'php':
        return 'php';
      case 'rb':
        return 'ruby';
      case 'yml':
      case 'yaml':
        return 'yaml';
      case 'json':
        return 'json';
      case 'toml':
        return 'toml';
      case 'ini':
      case 'env':
      case 'conf':
      case 'config':
        return 'config';
      default:
        return 'other';
    }
  }

  private estimateSize(): number {
    // Rough estimate: JSON serialization size
    let size = 0;
    for (const entry of this.entries.values()) {
      size += entry.path.length + entry.hash.length + 100; // ~100 bytes overhead per entry
    }
    return size;
  }
}

/**
 * Create a shadow cache for a project
 */
export function createShadowCache(options: ShadowCacheOptions): ShadowCache {
  return new ShadowCache(options);
}

/**
 * Load or create shadow cache for a project
 */
export async function loadShadowCache(projectRoot: string): Promise<ShadowCache> {
  const cache = new ShadowCache({ projectRoot });
  await cache.load();
  return cache;
}
