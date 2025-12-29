/**
 * Database Backup Manager
 *
 * Provides backup creation, restore, and automatic backup scheduling
 * for SQLite databases with optional compression.
 *
 * @module recovery/backup
 */
import type { BackupConfig, BackupInfo } from './types.js';
/**
 * Manages database backups with compression and automatic scheduling
 */
export declare class BackupManager {
    private config;
    private timer?;
    private dbPath;
    /**
     * Create a new BackupManager
     *
     * @param dbPath - Path to the SQLite database file
     * @param config - Optional backup configuration
     */
    constructor(dbPath: string, config?: Partial<BackupConfig>);
    /**
     * Create a new backup of the database
     *
     * @returns Information about the created backup
     * @throws Error if backup creation fails
     */
    createBackup(): Promise<BackupInfo>;
    /**
     * Restore the database from a backup
     *
     * @param backupId - ID of the backup to restore
     * @throws Error if backup not found or restore fails
     */
    restore(backupId: string): Promise<void>;
    /**
     * List all available backups
     *
     * @returns Array of backup information, sorted by timestamp (newest first)
     */
    listBackups(): BackupInfo[];
    /**
     * Get a specific backup by ID
     *
     * @param id - Backup ID
     * @returns Backup information or undefined if not found
     */
    getBackup(id: string): BackupInfo | undefined;
    /**
     * Get the most recent backup
     *
     * @returns Most recent backup or undefined if no backups exist
     */
    getLatestBackup(): BackupInfo | undefined;
    /**
     * Delete a specific backup
     *
     * @param backupId - ID of the backup to delete
     * @returns True if deleted, false if not found
     */
    deleteBackup(backupId: string): boolean;
    /**
     * Verify a backup's integrity
     *
     * @param backupId - ID of the backup to verify
     * @returns True if backup is valid
     */
    verifyBackup(backupId: string): boolean;
    /**
     * Get backup configuration
     */
    getConfig(): BackupConfig;
    /**
     * Update backup configuration
     *
     * @param config - Partial configuration to update
     */
    updateConfig(config: Partial<BackupConfig>): void;
    /**
     * Remove old backups exceeding maxBackups
     */
    private cleanOldBackups;
    /**
     * Calculate SHA-256 checksum of a file
     */
    private calculateChecksum;
    /**
     * Start automatic backup scheduling
     */
    startAutoBackup(): void;
    /**
     * Stop automatic backup scheduling
     */
    stopAutoBackup(): void;
    /**
     * Check if auto backup is running
     */
    isAutoBackupRunning(): boolean;
}
/**
 * Create a BackupManager instance
 *
 * @param dbPath - Path to the SQLite database file
 * @param config - Optional backup configuration
 * @returns BackupManager instance
 */
export declare function createBackupManager(dbPath: string, config?: Partial<BackupConfig>): BackupManager;
//# sourceMappingURL=backup.d.ts.map