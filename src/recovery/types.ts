/**
 * Database Recovery Types
 *
 * Type definitions for backup, restore, and integrity checking operations.
 *
 * @module recovery/types
 */

/**
 * Configuration for automatic backup scheduling
 */
export interface BackupConfig {
  /** Whether automatic backups are enabled */
  enabled: boolean;
  /** Interval between backups in milliseconds */
  interval: number;
  /** Maximum number of backups to retain */
  maxBackups: number;
  /** Directory path for storing backups */
  backupPath: string;
  /** Whether to compress backups using gzip */
  compress: boolean;
}

/**
 * Information about a single backup
 */
export interface BackupInfo {
  /** Unique identifier for the backup */
  id: string;
  /** Full path to the backup file */
  path: string;
  /** When the backup was created */
  timestamp: Date;
  /** Size of the backup file in bytes */
  size: number;
  /** SHA-256 checksum for integrity verification */
  checksum: string;
  /** Whether the backup is gzip compressed */
  compressed: boolean;
}

/**
 * Result of a restore operation
 */
export interface RestoreResult {
  /** Whether the restore was successful */
  success: boolean;
  /** Backup ID or path that was restored from */
  restoredFrom: string;
  /** When the restore was performed */
  timestamp: Date;
  /** Number of records restored */
  recordsRestored: number;
  /** Non-fatal issues encountered during restore */
  warnings: string[];
  /** Fatal errors that occurred (empty if success is true) */
  errors: string[];
}

/**
 * Options for restore operations
 */
export interface RecoveryOptions {
  /** Verify backup integrity before restoring */
  verifyIntegrity?: boolean;
  /** Force restore even if integrity check fails */
  force?: boolean;
  /** Specific backup ID to restore from */
  targetBackup?: string;
}

/**
 * Result of a database integrity check
 */
export interface IntegrityCheckResult {
  /** Whether the database passed all integrity checks */
  valid: boolean;
  /** Critical errors found */
  errors: string[];
  /** Non-critical warnings */
  warnings: string[];
  /** Per-table integrity information */
  tables: TableIntegrity[];
}

/**
 * Integrity information for a single table
 */
export interface TableIntegrity {
  /** Table name */
  name: string;
  /** Number of rows in the table */
  rowCount: number;
  /** Whether the table passed integrity checks */
  valid: boolean;
  /** List of issues found in the table */
  issues: string[];
}
