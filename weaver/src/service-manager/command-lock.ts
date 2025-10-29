/**
 * Command Lock System
 * Prevents race conditions in concurrent CLI operations
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * File-based lock manager for concurrent command execution
 */
export class CommandLock {
  private locks = new Map<string, Promise<void>>();
  private lockDir: string;

  constructor() {
    this.lockDir = path.join(os.tmpdir(), 'weaver-locks');
  }

  /**
   * Initialize lock directory
   */
  private async ensureLockDir(): Promise<void> {
    try {
      await fs.mkdir(this.lockDir, { recursive: true });
    } catch {
      // Directory already exists
    }
  }

  /**
   * Acquire lock for a service
   */
  async acquire(serviceName: string, timeout = 10000): Promise<() => Promise<void>> {
    await this.ensureLockDir();

    const lockFile = path.join(this.lockDir, `${serviceName}.lock`);
    const startTime = Date.now();

    // Wait for existing lock to release
    while (true) {
      try {
        // Try to create lock file atomically
        await fs.writeFile(lockFile, process.pid.toString(), { flag: 'wx' });

        // Lock acquired
        const release = async () => {
          try {
            await fs.unlink(lockFile);
          } catch {
            // Lock already released or doesn't exist
          }
        };

        return release;
      } catch (error: any) {
        // Lock file exists, check if process is still alive
        if (error.code === 'EEXIST') {
          try {
            const content = await fs.readFile(lockFile, 'utf-8');
            const pid = parseInt(content.trim(), 10);

            // Check if process is still running
            if (!this.isProcessAlive(pid)) {
              // Stale lock, remove it
              await fs.unlink(lockFile);
              continue;
            }

            // Lock is held by another process
            if (Date.now() - startTime > timeout) {
              throw new Error(`Lock timeout for service: ${serviceName}`);
            }

            // Wait and retry
            await new Promise((resolve) => setTimeout(resolve, 50));
          } catch (readError) {
            // Error reading lock file, try to remove it
            try {
              await fs.unlink(lockFile);
            } catch {
              // Ignore errors
            }
          }
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Execute function with lock
   */
  async withLock<T>(
    serviceName: string,
    fn: () => Promise<T>,
    timeout?: number
  ): Promise<T> {
    const release = await this.acquire(serviceName, timeout);

    try {
      return await fn();
    } finally {
      await release();
    }
  }

  /**
   * Check if process is alive
   */
  private isProcessAlive(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all locks (cleanup)
   */
  async clearAll(): Promise<void> {
    try {
      const files = await fs.readdir(this.lockDir);
      await Promise.all(
        files.map((file) =>
          fs.unlink(path.join(this.lockDir, file)).catch(() => {})
        )
      );
    } catch {
      // Lock directory doesn't exist
    }
  }

  /**
   * Clear stale locks
   */
  async clearStale(): Promise<void> {
    try {
      const files = await fs.readdir(this.lockDir);

      for (const file of files) {
        const lockFile = path.join(this.lockDir, file);
        try {
          const content = await fs.readFile(lockFile, 'utf-8');
          const pid = parseInt(content.trim(), 10);

          if (!this.isProcessAlive(pid)) {
            await fs.unlink(lockFile);
          }
        } catch {
          // Error reading file, skip
        }
      }
    } catch {
      // Lock directory doesn't exist
    }
  }
}

/**
 * Export singleton instance
 */
export const commandLock = new CommandLock();
