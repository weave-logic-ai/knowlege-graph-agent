/**
 * Shadow Cache - File Metadata Caching
 *
 * Provides a caching layer for file metadata to enable incremental updates
 * and improve performance when analyzing large codebases.
 *
 * @module core/cache
 */
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
export type FileType = 'markdown' | 'typescript' | 'javascript' | 'python' | 'rust' | 'go' | 'java' | 'php' | 'ruby' | 'yaml' | 'json' | 'toml' | 'config' | 'docker' | 'other';
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
export declare class ShadowCache {
    private projectRoot;
    private cacheDir;
    private cachePath;
    private defaultTTL;
    private maxEntries;
    private persist;
    private entries;
    private hitCount;
    private missCount;
    private loaded;
    private dirty;
    private createdAt;
    private updatedAt;
    constructor(options: ShadowCacheOptions);
    /**
     * Load cache from disk
     */
    load(): Promise<boolean>;
    /**
     * Save cache to disk
     */
    save(): Promise<boolean>;
    /**
     * Get cached metadata for a file
     */
    get(filePath: string): FileMetadata | undefined;
    /**
     * Set cached metadata for a file
     */
    set(filePath: string, metadata: Partial<FileMetadata>): FileMetadata;
    /**
     * Remove a file from cache
     */
    delete(filePath: string): boolean;
    /**
     * Check if a file exists in cache
     */
    has(filePath: string): boolean;
    /**
     * Check if a file has changed since caching
     */
    hasChanged(filePath: string): boolean;
    /**
     * Detect changes for a list of files
     */
    detectChanges(filePaths: string[]): Promise<FileChange[]>;
    /**
     * Update cache with detected changes
     */
    applyChanges(changes: FileChange[]): void;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Clear all cache entries
     */
    clear(): void;
    /**
     * Prune stale entries
     */
    prune(): Promise<number>;
    /**
     * Get all cached file paths
     */
    getAllPaths(): string[];
    /**
     * Get files by type
     */
    getByType(type: FileType): FileMetadata[];
    /**
     * Invalidate entries matching a pattern
     */
    invalidate(pattern: RegExp): number;
    private normalizePath;
    private computeMetadata;
    private inferFileType;
    private estimateSize;
}
/**
 * Create a shadow cache for a project
 */
export declare function createShadowCache(options: ShadowCacheOptions): ShadowCache;
/**
 * Load or create shadow cache for a project
 */
export declare function loadShadowCache(projectRoot: string): Promise<ShadowCache>;
//# sourceMappingURL=cache.d.ts.map