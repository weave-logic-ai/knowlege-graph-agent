/**
 * Database Recovery Service
 * Handles database corruption detection and restoration
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';

/**
 * Database recovery configuration
 */
export interface DatabaseRecoveryConfig {
  dbPath: string;
  autoRestore?: boolean;
  createIfMissing?: boolean;
  backupRotation?: number;
}

/**
 * Database recovery result
 */
export interface RecoveryResult {
  success: boolean;
  action: 'validated' | 'restored' | 'created' | 'failed';
  message: string;
  backupUsed?: string;
}

/**
 * Database recovery service
 */
export class DatabaseRecoveryService {
  /**
   * Check if database is valid
   */
  async validateDatabase(dbPath: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      await fs.access(dbPath);
      const content = await fs.readFile(dbPath, 'utf-8');

      // Try to parse as JSON
      try {
        JSON.parse(content);
        return { valid: true };
      } catch (parseError) {
        return {
          valid: false,
          error: 'Database file contains invalid JSON',
        };
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return { valid: false, error: 'Database file does not exist' };
      }
      return { valid: false, error: error.message };
    }
  }

  /**
   * Recover database from corruption
   */
  async recoverDatabase(
    config: DatabaseRecoveryConfig
  ): Promise<RecoveryResult> {
    const { dbPath, autoRestore = false, createIfMissing = false } = config;

    // Check if database exists and is valid
    const validation = await this.validateDatabase(dbPath);

    if (validation.valid) {
      return {
        success: true,
        action: 'validated',
        message: 'Database is valid',
      };
    }

    logger.warn(`Database validation failed: ${validation.error}`);

    // Try to restore from backup
    if (autoRestore) {
      const backupResult = await this.restoreFromBackup(dbPath);
      if (backupResult.success) {
        return backupResult;
      }
    }

    // Create new database if allowed
    if (createIfMissing) {
      const createResult = await this.createNewDatabase(dbPath);
      return createResult;
    }

    return {
      success: false,
      action: 'failed',
      message: validation.error || 'Database recovery failed',
    };
  }

  /**
   * Restore database from backup
   */
  private async restoreFromBackup(
    dbPath: string
  ): Promise<RecoveryResult> {
    const backupPath = `${dbPath}.backup`;

    try {
      // Check if backup exists and is valid
      const backupValidation = await this.validateDatabase(backupPath);

      if (!backupValidation.valid) {
        logger.warn('Backup file is also corrupted or missing');
        return {
          success: false,
          action: 'failed',
          message: 'Backup file is invalid',
        };
      }

      // Restore from backup
      await fs.copyFile(backupPath, dbPath);

      logger.info(`Restored database from backup: ${backupPath}`);

      return {
        success: true,
        action: 'restored',
        message: 'Database restored from backup',
        backupUsed: backupPath,
      };
    } catch (error: any) {
      logger.error('Failed to restore from backup', error);
      return {
        success: false,
        action: 'failed',
        message: `Backup restoration failed: ${error.message}`,
      };
    }
  }

  /**
   * Create new database with default structure
   */
  private async createNewDatabase(
    dbPath: string
  ): Promise<RecoveryResult> {
    try {
      // Ensure parent directory exists
      const dir = path.dirname(dbPath);
      await fs.mkdir(dir, { recursive: true });

      // Create default database structure
      const defaultData = {
        version: 1,
        created_at: new Date().toISOString(),
        data: {},
      };

      await fs.writeFile(dbPath, JSON.stringify(defaultData, null, 2));

      logger.info(`Created new database: ${dbPath}`);

      return {
        success: true,
        action: 'created',
        message: 'New database created',
      };
    } catch (error: any) {
      logger.error('Failed to create new database', error);
      return {
        success: false,
        action: 'failed',
        message: `Database creation failed: ${error.message}`,
      };
    }
  }

  /**
   * Create database backup
   */
  async createBackup(dbPath: string, rotation: number = 3): Promise<void> {
    try {
      const validation = await this.validateDatabase(dbPath);
      if (!validation.valid) {
        logger.warn('Skipping backup of invalid database');
        return;
      }

      // Rotate existing backups
      await this.rotateBackups(dbPath, rotation);

      // Create new backup
      const backupPath = `${dbPath}.backup`;
      await fs.copyFile(dbPath, backupPath);

      logger.debug(`Created database backup: ${backupPath}`);
    } catch (error) {
      logger.error('Failed to create backup', error);
    }
  }

  /**
   * Rotate backup files
   */
  private async rotateBackups(
    dbPath: string,
    maxBackups: number
  ): Promise<void> {
    try {
      // Shift existing backups
      for (let i = maxBackups - 1; i > 0; i--) {
        const oldPath = `${dbPath}.backup${i > 1 ? `.${i - 1}` : ''}`;
        const newPath = `${dbPath}.backup.${i}`;

        try {
          await fs.access(oldPath);
          await fs.rename(oldPath, newPath);
        } catch {
          // Backup doesn't exist, skip
        }
      }
    } catch (error) {
      logger.debug('Error rotating backups', error);
    }
  }

  /**
   * Clean old backups
   */
  async cleanOldBackups(dbPath: string, keepCount: number = 3): Promise<void> {
    try {
      const dir = path.dirname(dbPath);
      const baseName = path.basename(dbPath);
      const files = await fs.readdir(dir);

      // Find backup files
      const backups = files
        .filter((f) => f.startsWith(`${baseName}.backup`))
        .map((f) => path.join(dir, f));

      // Sort by modification time (newest first)
      const backupsWithStats = await Promise.all(
        backups.map(async (f) => ({
          path: f,
          mtime: (await fs.stat(f)).mtime,
        }))
      );

      backupsWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Delete old backups
      for (let i = keepCount; i < backupsWithStats.length; i++) {
        await fs.unlink(backupsWithStats[i].path);
        logger.debug(`Deleted old backup: ${backupsWithStats[i].path}`);
      }
    } catch (error) {
      logger.debug('Error cleaning old backups', error);
    }
  }
}

/**
 * Singleton instance
 */
export const databaseRecovery = new DatabaseRecoveryService();
