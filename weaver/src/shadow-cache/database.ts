/**
 * Shadow Cache Database
 *
 * SQLite database for caching file metadata.
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { logger } from '../utils/logger.js';
import type { CachedFile, Tag, Link, CacheStats } from './types.js';

export class ShadowCacheDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {

    // Ensure data directory exists
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      logger.info('Created data directory', { path: dir });
    }

    // Open database
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    this.db.pragma('foreign_keys = ON'); // Enable foreign key constraints

    logger.info('Shadow cache database opened', { path: dbPath });

    // Initialize schema
    this.initializeSchema();
  }

  /**
   * Initialize database schema
   */
  private initializeSchema(): void {
    try {
      // Read schema SQL file
      const schemaPath = join(dirname(new URL(import.meta.url).pathname), 'schema.sql');
      const schemaSql = readFileSync(schemaPath, 'utf-8');

      // Remove comments and execute entire schema as one batch
      const cleanedSql = schemaSql
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');

      // Execute entire schema
      this.db.exec(cleanedSql);

      logger.info('Shadow cache schema initialized');
    } catch (error) {
      logger.error('Failed to initialize schema', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalFiles = this.db.prepare('SELECT COUNT(*) as count FROM files').get() as { count: number };
    const totalTags = this.db.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number };
    const totalLinks = this.db.prepare('SELECT COUNT(*) as count FROM links').get() as { count: number };

    const lastSync = this.db.prepare("SELECT value FROM cache_metadata WHERE key = 'last_full_sync'").get() as { value: string } | undefined;
    const version = this.db.prepare("SELECT value FROM cache_metadata WHERE key = 'version'").get() as { value: string };

    // Get database file size
    const dbSize = this.db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get() as { size: number };

    return {
      totalFiles: totalFiles.count,
      totalTags: totalTags.count,
      totalLinks: totalLinks.count,
      lastFullSync: lastSync?.value || null,
      cacheVersion: version.value,
      databaseSize: dbSize.size,
    };
  }

  /**
   * Get file by path
   */
  getFile(path: string): CachedFile | null {
    const stmt = this.db.prepare('SELECT * FROM files WHERE path = ?');
    return stmt.get(path) as CachedFile | null;
  }

  /**
   * Get all files
   */
  getAllFiles(): CachedFile[] {
    const stmt = this.db.prepare('SELECT * FROM files ORDER BY path');
    return stmt.all() as CachedFile[];
  }

  /**
   * Get files by directory
   */
  getFilesByDirectory(directory: string): CachedFile[] {
    const stmt = this.db.prepare('SELECT * FROM files WHERE directory = ? ORDER BY filename');
    return stmt.all(directory) as CachedFile[];
  }

  /**
   * Get files by type
   */
  getFilesByType(type: string): CachedFile[] {
    const stmt = this.db.prepare('SELECT * FROM files WHERE type = ? ORDER BY path');
    return stmt.all(type) as CachedFile[];
  }

  /**
   * Get files by status
   */
  getFilesByStatus(status: string): CachedFile[] {
    const stmt = this.db.prepare('SELECT * FROM files WHERE status = ? ORDER BY path');
    return stmt.all(status) as CachedFile[];
  }

  /**
   * Get files by tag
   */
  getFilesByTag(tag: string): CachedFile[] {
    const stmt = this.db.prepare(`
      SELECT f.* FROM files f
      JOIN file_tags ft ON f.id = ft.file_id
      JOIN tags t ON ft.tag_id = t.id
      WHERE t.tag = ?
      ORDER BY f.path
    `);
    return stmt.all(tag) as CachedFile[];
  }

  /**
   * Get tags for a file
   */
  getFileTags(fileId: number): string[] {
    const stmt = this.db.prepare(`
      SELECT t.tag FROM tags t
      JOIN file_tags ft ON t.id = ft.tag_id
      WHERE ft.file_id = ?
      ORDER BY t.tag
    `);
    return (stmt.all(fileId) as Tag[]).map(t => t.tag);
  }

  /**
   * Get all tags
   */
  getAllTags(): Tag[] {
    const stmt = this.db.prepare('SELECT * FROM tags ORDER BY tag');
    return stmt.all() as Tag[];
  }

  /**
   * Get outgoing links for a file
   */
  getOutgoingLinks(fileId: number): Link[] {
    const stmt = this.db.prepare('SELECT * FROM links WHERE source_file_id = ?');
    return stmt.all(fileId) as Link[];
  }

  /**
   * Get incoming links to a file path
   */
  getIncomingLinks(targetPath: string): Link[] {
    const stmt = this.db.prepare('SELECT * FROM links WHERE target_path = ?');
    return stmt.all(targetPath) as Link[];
  }

  /**
   * Search files by title or content
   */
  searchFiles(query: string): CachedFile[] {
    const stmt = this.db.prepare(`
      SELECT * FROM files
      WHERE title LIKE ? OR path LIKE ?
      ORDER BY path
      LIMIT 100
    `);
    const pattern = `%${query}%`;
    return stmt.all(pattern, pattern) as CachedFile[];
  }

  /**
   * Update cache metadata
   */
  updateMetadata(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO cache_metadata (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')
    `);
    stmt.run(key, value, value);
  }

  /**
   * Clear all cache data
   */
  clear(): void {
    this.db.exec('DELETE FROM file_tags');
    this.db.exec('DELETE FROM links');
    this.db.exec('DELETE FROM tags');
    this.db.exec('DELETE FROM files');
    logger.info('Shadow cache cleared');
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      logger.info('Shadow cache database closed');
    }
  }

  /**
   * Get raw database instance (for advanced queries)
   */
  getDatabase(): Database.Database {
    return this.db;
  }
}

/**
 * Create a shadow cache database instance
 */
export function createShadowCache(dbPath: string): ShadowCacheDatabase {
  return new ShadowCacheDatabase(dbPath);
}
