/**
 * Database Backup Manager
 *
 * Provides backup creation, restore, and automatic backup scheduling
 * for SQLite databases with optional compression.
 *
 * @module recovery/backup
 */

import {
  existsSync,
  mkdirSync,
  copyFileSync,
  unlinkSync,
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { join, resolve, relative, isAbsolute } from 'path';
import { createHash } from 'crypto';
import { gzipSync, gunzipSync } from 'zlib';
import { createLogger } from '../utils/index.js';
import type { BackupConfig, BackupInfo } from './types.js';

const logger = createLogger('backup-manager');

/**
 * Validate that a path doesn't contain traversal attacks
 * @param basePath - The allowed base directory
 * @param targetPath - The path to validate
 * @returns true if path is safe, false otherwise
 */
function validatePath(basePath: string, targetPath: string): boolean {
  const resolvedBase = resolve(basePath);
  const resolvedTarget = resolve(targetPath);

  // Ensure target is within base or is an absolute path that doesn't traverse
  if (isAbsolute(targetPath)) {
    // For absolute paths, check they don't contain suspicious patterns
    const normalized = resolve(targetPath);
    return !targetPath.includes('..') && normalized === targetPath;
  }

  // For relative paths, ensure they stay within base
  const rel = relative(resolvedBase, resolvedTarget);
  return !rel.startsWith('..') && !rel.startsWith('/');
}

/**
 * Manages database backups with compression and automatic scheduling
 */
export class BackupManager {
  private config: BackupConfig;
  private timer?: NodeJS.Timeout;
  private dbPath: string;

  /**
   * Create a new BackupManager
   *
   * @param dbPath - Path to the SQLite database file
   * @param config - Optional backup configuration
   */
  constructor(dbPath: string, config?: Partial<BackupConfig>) {
    this.dbPath = dbPath;

    // Determine backup path with security validation
    const defaultBackupPath = join(resolve(dbPath, '..'), 'backups');
    let backupPath = config?.backupPath ?? defaultBackupPath;

    // Security: Validate backup path to prevent path traversal attacks
    if (config?.backupPath) {
      const dbDir = resolve(dbPath, '..');
      if (!validatePath(dbDir, config.backupPath)) {
        logger.warn('Suspicious backup path detected, using default', {
          provided: config.backupPath,
          default: defaultBackupPath,
        });
        backupPath = defaultBackupPath;
      }
    }

    this.config = {
      enabled: config?.enabled ?? true,
      interval: config?.interval ?? 86400000, // 24 hours
      maxBackups: config?.maxBackups ?? 5,
      backupPath: resolve(backupPath), // Normalize the path
      compress: config?.compress ?? true,
    };

    // Ensure backup directory exists
    if (!existsSync(this.config.backupPath)) {
      mkdirSync(this.config.backupPath, { recursive: true });
    }
  }

  /**
   * Create a new backup of the database
   *
   * @returns Information about the created backup
   * @throws Error if backup creation fails
   */
  async createBackup(): Promise<BackupInfo> {
    const timestamp = new Date();
    const id = `backup-${timestamp.getTime()}`;
    const ext = this.config.compress ? '.db.gz' : '.db';
    const backupFilePath = join(this.config.backupPath, `${id}${ext}`);

    try {
      // Verify source database exists
      if (!existsSync(this.dbPath)) {
        throw new Error(`Database file not found: ${this.dbPath}`);
      }

      if (this.config.compress) {
        // Read, compress, and write
        const data = readFileSync(this.dbPath);
        const compressed = gzipSync(data);
        writeFileSync(backupFilePath, compressed);
      } else {
        // Simple copy
        copyFileSync(this.dbPath, backupFilePath);
      }

      const stats = statSync(backupFilePath);
      const checksum = this.calculateChecksum(backupFilePath);

      const info: BackupInfo = {
        id,
        path: backupFilePath,
        timestamp,
        size: stats.size,
        checksum,
        compressed: this.config.compress,
      };

      // Clean up old backups
      await this.cleanOldBackups();

      logger.info('Backup created', {
        id,
        size: stats.size,
        compressed: this.config.compress,
      });

      return info;
    } catch (error) {
      logger.error('Backup failed', error instanceof Error ? error : undefined, {
        dbPath: this.dbPath,
        backupPath: backupFilePath,
      });
      throw error;
    }
  }

  /**
   * Restore the database from a backup
   *
   * @param backupId - ID of the backup to restore
   * @throws Error if backup not found or restore fails
   */
  async restore(backupId: string): Promise<void> {
    const backup = this.getBackup(backupId);
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }

    // Verify backup integrity
    const currentChecksum = this.calculateChecksum(backup.path);
    if (currentChecksum !== backup.checksum) {
      throw new Error('Backup integrity check failed - checksum mismatch');
    }

    try {
      if (backup.compressed) {
        // Read, decompress, and write
        const compressed = readFileSync(backup.path);
        const data = gunzipSync(compressed);
        writeFileSync(this.dbPath, data);
      } else {
        // Simple copy
        copyFileSync(backup.path, this.dbPath);
      }

      logger.info('Backup restored', { id: backupId });
    } catch (error) {
      logger.error('Restore failed', error instanceof Error ? error : undefined, {
        backupId,
      });
      throw error;
    }
  }

  /**
   * List all available backups
   *
   * @returns Array of backup information, sorted by timestamp (newest first)
   */
  listBackups(): BackupInfo[] {
    if (!existsSync(this.config.backupPath)) {
      return [];
    }

    const files = readdirSync(this.config.backupPath);
    return files
      .filter((f) => f.startsWith('backup-') && (f.endsWith('.db') || f.endsWith('.db.gz')))
      .map((f) => {
        const path = join(this.config.backupPath, f);
        const stats = statSync(path);
        const id = f.replace(/\.db(\.gz)?$/, '');
        const timestampMs = parseInt(id.replace('backup-', ''), 10);

        return {
          id,
          path,
          timestamp: new Date(timestampMs),
          size: stats.size,
          checksum: this.calculateChecksum(path),
          compressed: f.endsWith('.gz'),
        };
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get a specific backup by ID
   *
   * @param id - Backup ID
   * @returns Backup information or undefined if not found
   */
  getBackup(id: string): BackupInfo | undefined {
    return this.listBackups().find((b) => b.id === id);
  }

  /**
   * Get the most recent backup
   *
   * @returns Most recent backup or undefined if no backups exist
   */
  getLatestBackup(): BackupInfo | undefined {
    const backups = this.listBackups();
    return backups.length > 0 ? backups[0] : undefined;
  }

  /**
   * Delete a specific backup
   *
   * @param backupId - ID of the backup to delete
   * @returns True if deleted, false if not found
   */
  deleteBackup(backupId: string): boolean {
    const backup = this.getBackup(backupId);
    if (!backup) {
      return false;
    }

    try {
      unlinkSync(backup.path);
      logger.info('Backup deleted', { id: backupId });
      return true;
    } catch (error) {
      logger.error('Failed to delete backup', error instanceof Error ? error : undefined, {
        id: backupId,
      });
      return false;
    }
  }

  /**
   * Verify a backup's integrity
   *
   * @param backupId - ID of the backup to verify
   * @returns True if backup is valid
   */
  verifyBackup(backupId: string): boolean {
    const backup = this.getBackup(backupId);
    if (!backup) {
      return false;
    }

    try {
      const currentChecksum = this.calculateChecksum(backup.path);
      return currentChecksum === backup.checksum;
    } catch {
      return false;
    }
  }

  /**
   * Get backup configuration
   */
  getConfig(): BackupConfig {
    return { ...this.config };
  }

  /**
   * Update backup configuration
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<BackupConfig>): void {
    Object.assign(this.config, config);

    // Recreate backup directory if changed
    if (config.backupPath && !existsSync(this.config.backupPath)) {
      mkdirSync(this.config.backupPath, { recursive: true });
    }

    // Restart auto backup if interval changed
    if (config.interval && this.timer) {
      this.stopAutoBackup();
      this.startAutoBackup();
    }
  }

  /**
   * Remove old backups exceeding maxBackups
   */
  private async cleanOldBackups(): Promise<void> {
    const backups = this.listBackups();
    if (backups.length <= this.config.maxBackups) {
      return;
    }

    const toDelete = backups.slice(this.config.maxBackups);
    for (const backup of toDelete) {
      try {
        unlinkSync(backup.path);
        logger.debug('Deleted old backup', { id: backup.id });
      } catch (error) {
        logger.warn('Failed to delete old backup', {
          id: backup.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Calculate SHA-256 checksum of a file
   */
  private calculateChecksum(filePath: string): string {
    const data = readFileSync(filePath);
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Start automatic backup scheduling
   */
  startAutoBackup(): void {
    if (!this.config.enabled || this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      this.createBackup().catch((err) => {
        logger.error('Auto backup failed', err instanceof Error ? err : undefined);
      });
    }, this.config.interval);

    logger.info('Auto backup started', { interval: this.config.interval });
  }

  /**
   * Stop automatic backup scheduling
   */
  stopAutoBackup(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
      logger.info('Auto backup stopped');
    }
  }

  /**
   * Check if auto backup is running
   */
  isAutoBackupRunning(): boolean {
    return this.timer !== undefined;
  }
}

/**
 * Create a BackupManager instance
 *
 * @param dbPath - Path to the SQLite database file
 * @param config - Optional backup configuration
 * @returns BackupManager instance
 */
export function createBackupManager(dbPath: string, config?: Partial<BackupConfig>): BackupManager {
  return new BackupManager(dbPath, config);
}
