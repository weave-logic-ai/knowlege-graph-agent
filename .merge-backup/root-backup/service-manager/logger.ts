/**
 * Service Logger
 * Centralized logging for service management
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import type { LogEntry, LogLevel, LogOptions } from './types.js';

/**
 * Service logging system
 */
export class ServiceLogger {
  private logDir: string;

  constructor(logDir: string = './logs') {
    this.logDir = logDir;
  }

  /**
   * Initialize logger (create log directory)
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  /**
   * Write log entry
   */
  async log(
    service: string,
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      service,
      process_id: process.pid,
      metadata,
    };

    const logLine = this.formatLogEntry(entry);
    const logFile = path.join(this.logDir, `${service}.log`);

    try {
      await fs.appendFile(logFile, logLine + '\n');
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  /**
   * Read logs for a service
   */
  async readLogs(service: string, options: LogOptions = {}): Promise<LogEntry[]> {
    const logFile = path.join(this.logDir, `${service}.log`);

    try {
      const content = await fs.readFile(logFile, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      // Parse log entries
      let entries = lines.map((line) => this.parseLogEntry(line)).filter(Boolean) as LogEntry[];

      // Apply filters
      if (options.level) {
        entries = entries.filter((e) => e.level === options.level);
      }

      if (options.since) {
        entries = entries.filter((e) => e.timestamp >= options.since!);
      }

      if (options.grep) {
        const pattern = new RegExp(options.grep, 'i');
        entries = entries.filter((e) => pattern.test(e.message));
      }

      // Apply line limit
      if (options.lines) {
        entries = entries.slice(-options.lines);
      }

      return entries;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Tail logs (watch for new entries)
   */
  async *tailLogs(service: string, options: LogOptions = {}): AsyncGenerator<LogEntry> {
    const logFile = path.join(this.logDir, `${service}.log`);
    let lastPosition = 0;

    // Get initial file size
    try {
      const stats = await fs.stat(logFile);
      lastPosition = stats.size;
    } catch {
      // File doesn't exist yet
    }

    while (true) {
      try {
        const stats = await fs.stat(logFile);

        // File has new content
        if (stats.size > lastPosition) {
          const handle = await fs.open(logFile, 'r');
          const buffer = Buffer.alloc(stats.size - lastPosition);

          await handle.read(buffer, 0, buffer.length, lastPosition);
          await handle.close();

          const newContent = buffer.toString('utf-8');
          const lines = newContent.trim().split('\n').filter(Boolean);

          for (const line of lines) {
            const entry = this.parseLogEntry(line);
            if (entry) {
              // Apply filters
              if (options.level && entry.level !== options.level) continue;
              if (options.grep && !new RegExp(options.grep, 'i').test(entry.message)) continue;

              yield entry;
            }
          }

          lastPosition = stats.size;
        }
      } catch {
        // File might not exist yet, continue waiting
      }

      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  /**
   * Rotate logs for a service
   */
  async rotateLogs(service: string, maxFiles: number = 5): Promise<void> {
    const logFile = path.join(this.logDir, `${service}.log`);

    try {
      const stats = await fs.stat(logFile);

      // Check if rotation is needed (e.g., file > 10MB)
      if (stats.size < 10 * 1024 * 1024) {
        return;
      }

      // Rotate existing backups
      for (let i = maxFiles - 1; i >= 1; i--) {
        const oldFile = `${logFile}.${i}`;
        const newFile = `${logFile}.${i + 1}`;

        try {
          await fs.rename(oldFile, newFile);
        } catch {
          // File doesn't exist, skip
        }
      }

      // Move current log to .1
      await fs.rename(logFile, `${logFile}.1`);
    } catch {
      // Log file doesn't exist, no rotation needed
    }
  }

  /**
   * Clear logs for a service
   */
  async clearLogs(service: string): Promise<void> {
    const logFile = path.join(this.logDir, `${service}.log`);

    try {
      await fs.unlink(logFile);
    } catch {
      // File doesn't exist, nothing to clear
    }
  }

  /**
   * Format log entry for writing
   */
  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const service = entry.service.padEnd(20);
    const message = entry.message;

    let line = `[${timestamp}] [${level}] [${service}] ${message}`;

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      line += ` ${JSON.stringify(entry.metadata)}`;
    }

    return line;
  }

  /**
   * Parse log entry from line
   */
  private parseLogEntry(line: string): LogEntry | null {
    // Match format: [timestamp] [level] [service] message [metadata]
    const match = line.match(/^\[([^\]]+)\] \[([^\]]+)\] \[([^\]]+)\] (.+?)(?:\s+(\{.+\}))?$/);

    if (!match) {
      return null;
    }

    const [, timestamp, level, service, message, metadataStr] = match;

    if (!timestamp || !level || !service || !message) {
      return null;
    }

    return {
      timestamp: new Date(timestamp),
      level: level.trim().toLowerCase() as LogLevel,
      service: service.trim(),
      message: message.trim(),
      metadata: metadataStr ? JSON.parse(metadataStr) : undefined,
    };
  }
}

/**
 * Create and export singleton instance
 */
export const logger = new ServiceLogger('./logs');
