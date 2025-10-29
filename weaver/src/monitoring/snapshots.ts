/**
 * State Snapshot System
 *
 * Captures system state before operations for rollback capability:
 * - Lightweight JSON snapshots
 * - Diff calculation between states
 * - Rollback to previous state
 * - Automatic cleanup policy
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import crypto from 'node:crypto';
import { logger } from '../utils/logger.js';

/**
 * State snapshot
 */
export interface StateSnapshot {
  id: string;
  operation: string;
  timestamp: Date;
  state: {
    files: Record<string, FileSnapshot>;
    environment: Record<string, string>;
    metadata: Record<string, unknown>;
  };
}

/**
 * File snapshot
 */
export interface FileSnapshot {
  path: string;
  exists: boolean;
  size?: number;
  checksum?: string;
  modified?: Date;
  content?: string; // Only for small files
}

/**
 * Snapshot diff
 */
export interface SnapshotDiff {
  filesAdded: string[];
  filesRemoved: string[];
  filesModified: string[];
  envChanged: string[];
}

/**
 * Snapshot options
 */
export interface SnapshotOptions {
  includeContent?: boolean;
  maxFileSize?: number;
  files?: string[];
  envVars?: string[];
}

/**
 * State Snapshot Manager
 */
export class SnapshotManager {
  private snapshots = new Map<string, StateSnapshot>();
  private readonly snapshotDir: string;
  private readonly maxSnapshots = 100;
  private readonly maxSnapshotAge = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(snapshotDir?: string) {
    this.snapshotDir = snapshotDir || path.join(process.cwd(), '.weaver', 'snapshots');
    this.ensureSnapshotDir();
  }

  /**
   * Create snapshot of current state
   */
  async createSnapshot(
    operation: string,
    options: SnapshotOptions = {}
  ): Promise<StateSnapshot> {
    const id = this.generateSnapshotId();
    const timestamp = new Date();

    logger.debug('Creating state snapshot', { id, operation });

    const files: Record<string, FileSnapshot> = {};
    const filesToSnapshot = options.files || [];

    // Snapshot files
    for (const filePath of filesToSnapshot) {
      try {
        files[filePath] = await this.snapshotFile(filePath, options);
      } catch (error) {
        logger.warn('Failed to snapshot file', {
          file: filePath,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Snapshot environment variables
    const environment: Record<string, string> = {};
    if (options.envVars && options.envVars.length > 0) {
      for (const envVar of options.envVars) {
        const value = process.env[envVar];
        if (value !== undefined) {
          environment[envVar] = value;
        }
      }
    }

    const snapshot: StateSnapshot = {
      id,
      operation,
      timestamp,
      state: {
        files,
        environment,
        metadata: {
          cwd: process.cwd(),
          nodeVersion: process.version,
        },
      },
    };

    // Store in memory
    this.snapshots.set(id, snapshot);

    // Persist to disk
    await this.persistSnapshot(snapshot);

    // Cleanup old snapshots
    await this.cleanup();

    logger.info('State snapshot created', {
      id,
      operation,
      fileCount: Object.keys(files).length,
    });

    return snapshot;
  }

  /**
   * Snapshot a single file
   */
  private async snapshotFile(
    filePath: string,
    options: SnapshotOptions
  ): Promise<FileSnapshot> {
    const exists = existsSync(filePath);

    if (!exists) {
      return { path: filePath, exists: false };
    }

    const stats = await fs.stat(filePath);
    const maxSize = options.maxFileSize || 1024 * 1024; // 1MB default

    const snapshot: FileSnapshot = {
      path: filePath,
      exists: true,
      size: stats.size,
      modified: stats.mtime,
    };

    // Calculate checksum
    if (stats.size < maxSize) {
      const content = await fs.readFile(filePath);
      snapshot.checksum = crypto.createHash('sha256').update(content).digest('hex');

      // Include content for small files if requested
      if (options.includeContent && stats.size < 100 * 1024) {
        // 100KB
        snapshot.content = content.toString('utf-8');
      }
    }

    return snapshot;
  }

  /**
   * Get snapshot by ID
   */
  getSnapshot(id: string): StateSnapshot | undefined {
    return this.snapshots.get(id);
  }

  /**
   * Calculate diff between snapshots
   */
  calculateDiff(beforeId: string, afterId: string): SnapshotDiff | null {
    const before = this.snapshots.get(beforeId);
    const after = this.snapshots.get(afterId);

    if (!before || !after) {
      return null;
    }

    const beforeFiles = new Set(Object.keys(before.state.files));
    const afterFiles = new Set(Object.keys(after.state.files));

    const filesAdded: string[] = [];
    const filesRemoved: string[] = [];
    const filesModified: string[] = [];

    // Find added files
    for (const file of afterFiles) {
      if (!beforeFiles.has(file)) {
        filesAdded.push(file);
      }
    }

    // Find removed files
    for (const file of beforeFiles) {
      if (!afterFiles.has(file)) {
        filesRemoved.push(file);
      }
    }

    // Find modified files
    for (const file of beforeFiles) {
      if (afterFiles.has(file)) {
        const beforeSnap = before.state.files[file];
        const afterSnap = after.state.files[file];

        if (beforeSnap && afterSnap && beforeSnap.checksum !== afterSnap.checksum) {
          filesModified.push(file);
        }
      }
    }

    // Environment changes
    const envChanged: string[] = [];
    for (const envVar of Object.keys(before.state.environment)) {
      if (before.state.environment[envVar] !== after.state.environment[envVar]) {
        envChanged.push(envVar);
      }
    }

    return {
      filesAdded,
      filesRemoved,
      filesModified,
      envChanged,
    };
  }

  /**
   * Rollback to snapshot
   */
  async rollback(snapshotId: string): Promise<void> {
    const snapshot = this.snapshots.get(snapshotId);

    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    logger.warn('Rolling back to snapshot', {
      id: snapshotId,
      operation: snapshot.operation,
      timestamp: snapshot.timestamp,
    });

    let restoredFiles = 0;
    let errors = 0;

    // Restore files
    for (const [filePath, fileSnapshot] of Object.entries(snapshot.state.files)) {
      try {
        if (fileSnapshot.exists && fileSnapshot.content) {
          // Restore from snapshot content
          await fs.writeFile(filePath, fileSnapshot.content, 'utf-8');
          restoredFiles++;
        } else if (!fileSnapshot.exists && existsSync(filePath)) {
          // Remove file that shouldn't exist
          await fs.unlink(filePath);
          restoredFiles++;
        }
      } catch (error) {
        logger.error('Failed to restore file during rollback', error as Error, { filePath });
        errors++;
      }
    }

    // Restore environment (note: this only affects current process)
    for (const [envVar, value] of Object.entries(snapshot.state.environment)) {
      process.env[envVar] = value;
    }

    logger.info('Rollback completed', {
      id: snapshotId,
      restoredFiles,
      errors,
    });

    if (errors > 0) {
      throw new Error(`Rollback completed with ${errors} errors`);
    }
  }

  /**
   * List all snapshots
   */
  listSnapshots(limit?: number): StateSnapshot[] {
    const snapshots = Array.from(this.snapshots.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    return limit ? snapshots.slice(0, limit) : snapshots;
  }

  /**
   * Delete snapshot
   */
  async deleteSnapshot(id: string): Promise<void> {
    this.snapshots.delete(id);

    const snapshotPath = path.join(this.snapshotDir, `${id}.json`);
    if (existsSync(snapshotPath)) {
      await fs.unlink(snapshotPath);
    }

    logger.debug('Snapshot deleted', { id });
  }

  /**
   * Cleanup old snapshots
   */
  private async cleanup(): Promise<void> {
    const snapshots = this.listSnapshots();

    // Remove oldest snapshots if exceeding max count
    if (snapshots.length > this.maxSnapshots) {
      const toRemove = snapshots.slice(this.maxSnapshots);
      for (const snapshot of toRemove) {
        await this.deleteSnapshot(snapshot.id);
      }
      logger.debug('Cleaned up old snapshots', { count: toRemove.length });
    }

    // Remove snapshots older than max age
    const cutoff = Date.now() - this.maxSnapshotAge;
    const oldSnapshots = snapshots.filter((s) => s.timestamp.getTime() < cutoff);

    for (const snapshot of oldSnapshots) {
      await this.deleteSnapshot(snapshot.id);
    }

    if (oldSnapshots.length > 0) {
      logger.debug('Cleaned up expired snapshots', { count: oldSnapshots.length });
    }
  }

  /**
   * Persist snapshot to disk
   */
  private async persistSnapshot(snapshot: StateSnapshot): Promise<void> {
    const snapshotPath = path.join(this.snapshotDir, `${snapshot.id}.json`);

    await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8');
  }

  /**
   * Load snapshots from disk
   */
  async loadSnapshots(): Promise<void> {
    if (!existsSync(this.snapshotDir)) {
      return;
    }

    const files = await fs.readdir(this.snapshotDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const snapshotPath = path.join(this.snapshotDir, file);
        const content = await fs.readFile(snapshotPath, 'utf-8');
        const snapshot = JSON.parse(content) as StateSnapshot;

        // Convert timestamp string back to Date
        snapshot.timestamp = new Date(snapshot.timestamp);

        this.snapshots.set(snapshot.id, snapshot);
      } catch (error) {
        logger.warn('Failed to load snapshot', {
          file,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('Snapshots loaded from disk', { count: this.snapshots.size });
  }

  /**
   * Ensure snapshot directory exists
   */
  private ensureSnapshotDir(): void {
    if (!existsSync(this.snapshotDir)) {
      fs.mkdir(this.snapshotDir, { recursive: true }).catch((error) => {
        logger.error('Failed to create snapshot directory', error as Error, {
          dir: this.snapshotDir,
        });
      });
    }
  }

  /**
   * Generate unique snapshot ID
   */
  private generateSnapshotId(): string {
    return `snap_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
}

/**
 * Global snapshot manager instance
 */
export const snapshotManager = new SnapshotManager();
