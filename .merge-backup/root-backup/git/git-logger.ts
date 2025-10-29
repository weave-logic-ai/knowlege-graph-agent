/**
 * Git Operation Logger - Structured logging for git operations
 *
 * Provides audit trail and debugging support for all git operations with:
 * - JSON structured logging (JSONL format)
 * - Operation tracking (commit, push, pull, etc.)
 * - Performance metrics (duration, file count)
 * - Success/failure status
 * - Daily log rotation
 *
 * @module git/git-logger
 */

import { appendFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';

export interface GitOperationLog {
  timestamp: string;
  operation: 'init' | 'commit' | 'push' | 'pull' | 'status' | 'diff' | 'log';
  status: 'success' | 'error' | 'warn';
  sha?: string;
  files?: string[];
  message?: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Git Logger for audit trail and debugging
 */
export class GitLogger {
  private logDir: string;
  private logFile: string;
  private maxLogAgeDays: number;

  constructor(logDir = './logs', maxLogAgeDays = 7) {
    this.logDir = logDir;
    this.maxLogAgeDays = maxLogAgeDays;

    // Create logs directory if it doesn't exist
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }

    // Set current log file (daily rotation)
    this.logFile = join(this.logDir, `git-operations-${this.getDateString()}.log`);

    // Rotate old logs
    this.rotateOldLogs();
  }

  /**
   * Log a git operation
   */
  log(operation: GitOperationLog): void {
    const logEntry: GitOperationLog = {
      ...operation,
      timestamp: operation.timestamp || new Date().toISOString(),
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    try {
      appendFileSync(this.logFile, logLine, 'utf-8');
    } catch (error) {
      console.error('[GitLogger] Failed to write log:', error);
    }
  }

  /**
   * Log successful operation
   */
  logSuccess(
    operation: GitOperationLog['operation'],
    details: Omit<GitOperationLog, 'timestamp' | 'operation' | 'status'>
  ): void {
    this.log({
      operation,
      status: 'success',
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  /**
   * Log failed operation
   */
  logError(
    operation: GitOperationLog['operation'],
    error: Error | string,
    details?: Omit<GitOperationLog, 'timestamp' | 'operation' | 'status' | 'error'>
  ): void {
    this.log({
      operation,
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : error,
      ...details,
    });
  }

  /**
   * Log warning
   */
  logWarn(
    operation: GitOperationLog['operation'],
    message: string,
    details?: Omit<GitOperationLog, 'timestamp' | 'operation' | 'status' | 'message'>
  ): void {
    this.log({
      operation,
      status: 'warn',
      timestamp: new Date().toISOString(),
      message,
      ...details,
    });
  }

  /**
   * Get date string for log file naming (YYYY-MM-DD)
   */
  private getDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Rotate old log files (delete logs older than maxLogAgeDays)
   */
  private rotateOldLogs(): void {
    try {
      if (!existsSync(this.logDir)) {
        return;
      }

      const files = readdirSync(this.logDir);
      const now = Date.now();
      const maxAge = this.maxLogAgeDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

      files.forEach(file => {
        if (file.startsWith('git-operations-') && file.endsWith('.log')) {
          const filePath = join(this.logDir, file);
          const stats = statSync(filePath);
          const fileAge = now - stats.mtimeMs;

          if (fileAge > maxAge) {
            unlinkSync(filePath);
            console.log(`[GitLogger] Rotated old log file: ${file}`);
          }
        }
      });
    } catch (error) {
      console.error('[GitLogger] Failed to rotate logs:', error);
    }
  }

  /**
   * Get log file path for a specific date
   */
  getLogFilePath(date?: Date): string {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      return join(this.logDir, `git-operations-${dateStr}.log`);
    }
    return this.logFile;
  }
}

/**
 * Singleton git logger instance
 */
export const gitLogger = new GitLogger();
