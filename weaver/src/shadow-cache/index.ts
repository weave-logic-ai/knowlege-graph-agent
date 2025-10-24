/**
 * Shadow Cache Module
 *
 * Main interface for the shadow cache system.
 * Combines database operations with file parsing.
 */

import { join } from 'path';
import { readdirSync } from 'fs';
import { ShadowCacheDatabase } from './database.js';
import { parseMarkdownFile, hasFileChanged } from './parser.js';
import { logger } from '../utils/logger.js';
import type { CachedFile, FileUpdate, CacheStats } from './types.js';

export class ShadowCache {
  private db: ShadowCacheDatabase;
  private vaultPath: string;

  constructor(dbPath: string, vaultPath: string) {
    this.db = new ShadowCacheDatabase(dbPath);
    this.vaultPath = vaultPath;
  }

  /**
   * Add or update a file in the cache
   */
  async upsertFile(fileUpdate: FileUpdate): Promise<void> {
    const db = this.db.getDatabase();

    try {
      db.transaction(() => {
        // Insert or update file
        const fileStmt = db.prepare(`
          INSERT INTO files (
            path, filename, directory, size, created_at, modified_at,
            content_hash, frontmatter, type, status, title, cache_updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(path) DO UPDATE SET
            filename = excluded.filename,
            directory = excluded.directory,
            size = excluded.size,
            modified_at = excluded.modified_at,
            content_hash = excluded.content_hash,
            frontmatter = excluded.frontmatter,
            type = excluded.type,
            status = excluded.status,
            title = excluded.title,
            cache_updated_at = datetime('now')
        `);

        const frontmatterJson = fileUpdate.frontmatter ? JSON.stringify(fileUpdate.frontmatter) : null;

        fileStmt.run(
          fileUpdate.path,
          fileUpdate.filename,
          fileUpdate.directory,
          fileUpdate.size,
          fileUpdate.created_at.toISOString(),
          fileUpdate.modified_at.toISOString(),
          fileUpdate.content_hash,
          frontmatterJson,
          fileUpdate.frontmatter?.type || null,
          fileUpdate.frontmatter?.status || null,
          fileUpdate.title,
        );

        // Get file ID
        const file = this.db.getFile(fileUpdate.path);
        if (!file) {
          throw new Error(`Failed to retrieve file after insert: ${fileUpdate.path}`);
        }

        // Delete old tags and links
        db.prepare('DELETE FROM file_tags WHERE file_id = ?').run(file.id);
        db.prepare('DELETE FROM links WHERE source_file_id = ?').run(file.id);

        // Insert tags
        for (const tag of fileUpdate.tags) {
          // Insert tag if not exists
          const tagStmt = db.prepare('INSERT OR IGNORE INTO tags (tag) VALUES (?)');
          tagStmt.run(tag);

          // Get tag ID
          const tagRecord = db.prepare('SELECT id FROM tags WHERE tag = ?').get(tag) as { id: number };

          // Insert file-tag relationship
          db.prepare('INSERT INTO file_tags (file_id, tag_id) VALUES (?, ?)').run(file.id, tagRecord.id);
        }

        // Insert links
        for (const link of fileUpdate.links) {
          db.prepare(`
            INSERT INTO links (source_file_id, target_path, link_type, link_text)
            VALUES (?, ?, ?, ?)
          `).run(file.id, link.target_path, link.link_type, link.link_text);
        }
      })();

      logger.debug('File cached', { path: fileUpdate.path, tags: fileUpdate.tags.length, links: fileUpdate.links.length });
    } catch (error) {
      logger.error('Failed to upsert file in cache', error instanceof Error ? error : new Error(String(error)), {
        path: fileUpdate.path,
      });
      throw error;
    }
  }

  /**
   * Remove a file from the cache
   */
  removeFile(relativePath: string): void {
    const db = this.db.getDatabase();
    const stmt = db.prepare('DELETE FROM files WHERE path = ?');
    stmt.run(relativePath);
    logger.debug('File removed from cache', { path: relativePath });
  }

  /**
   * Sync a single file to the cache
   */
  async syncFile(absolutePath: string, relativePath: string): Promise<void> {
    try {
      // Check if file exists in cache and if it changed
      const cached = this.db.getFile(relativePath);
      if (cached && !hasFileChanged(absolutePath, cached.content_hash)) {
        logger.debug('File unchanged, skipping', { path: relativePath });
        return;
      }

      // Parse and cache file
      const fileUpdate = parseMarkdownFile(absolutePath, relativePath);
      await this.upsertFile(fileUpdate);

      logger.debug('File synced to cache', { path: relativePath });
    } catch (error) {
      logger.error('Failed to sync file', error instanceof Error ? error : new Error(String(error)), {
        path: relativePath,
      });
    }
  }

  /**
   * Perform a full sync of the vault
   */
  async syncVault(): Promise<void> {
    logger.info('Starting full vault sync', { vaultPath: this.vaultPath });

    const startTime = Date.now();
    let filesProcessed = 0;
    let filesUpdated = 0;

    try {
      // Recursively scan vault for .md files
      const markdownFiles = this.scanDirectory(this.vaultPath);

      // Process each file
      for (const absolutePath of markdownFiles) {
        const relativePath = absolutePath.replace(this.vaultPath + '/', '');

        try {
          const cached = this.db.getFile(relativePath);
          const changed = !cached || hasFileChanged(absolutePath, cached.content_hash);

          if (changed) {
            const fileUpdate = parseMarkdownFile(absolutePath, relativePath);
            await this.upsertFile(fileUpdate);
            filesUpdated++;
          }

          filesProcessed++;

          // Log progress every 50 files
          if (filesProcessed % 50 === 0) {
            logger.info('Sync progress', { processed: filesProcessed, updated: filesUpdated });
          }
        } catch (error) {
          logger.error('Failed to sync file', error instanceof Error ? error : new Error(String(error)), {
            path: relativePath,
          });
          // Continue with next file
        }
      }

      // Update metadata
      this.db.updateMetadata('last_full_sync', new Date().toISOString());

      const duration = Date.now() - startTime;
      logger.info('✅ Full vault sync completed', {
        filesProcessed,
        filesUpdated,
        duration: `${duration}ms`,
      });
    } catch (error) {
      logger.error('Full vault sync failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Recursively scan directory for markdown files
   */
  private scanDirectory(dirPath: string): string[] {
    const results: string[] = [];

    try {
      const entries = readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        // Skip hidden directories and node_modules
        if (entry.isDirectory()) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }
          results.push(...this.scanDirectory(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          results.push(fullPath);
        }
      }
    } catch (error) {
      logger.error('Failed to scan directory', error instanceof Error ? error : new Error(String(error)), {
        path: dirPath,
      });
    }

    return results;
  }

  /**
   * Get file by path
   */
  getFile(relativePath: string): CachedFile | null {
    return this.db.getFile(relativePath);
  }

  /**
   * Get all files
   */
  getAllFiles(): CachedFile[] {
    return this.db.getAllFiles();
  }

  /**
   * Get files by directory
   */
  getFilesByDirectory(directory: string): CachedFile[] {
    return this.db.getFilesByDirectory(directory);
  }

  /**
   * Get files by type
   */
  getFilesByType(type: string): CachedFile[] {
    return this.db.getFilesByType(type);
  }

  /**
   * Get files by status
   */
  getFilesByStatus(status: string): CachedFile[] {
    return this.db.getFilesByStatus(status);
  }

  /**
   * Get files by tag
   */
  getFilesByTag(tag: string): CachedFile[] {
    return this.db.getFilesByTag(tag);
  }

  /**
   * Search files
   */
  searchFiles(query: string): CachedFile[] {
    return this.db.searchFiles(query);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return this.db.getStats();
  }

  /**
   * Clear all cache data
   */
  clear(): void {
    this.db.clear();
  }

  /**
   * Close the cache
   */
  close(): void {
    this.db.close();
  }
}

/**
 * Create a shadow cache instance
 */
export function createShadowCache(dbPath: string, vaultPath: string): ShadowCache {
  return new ShadowCache(dbPath, vaultPath);
}

// Re-export types
export type { CachedFile, FileUpdate, CacheStats, Frontmatter } from './types.js';
