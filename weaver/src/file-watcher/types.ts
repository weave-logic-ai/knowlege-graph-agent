/**
 * File Watcher Types
 *
 * Type definitions for file system monitoring events and configuration.
 */

/**
 * File change event types
 */
export type FileEventType = 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';

/**
 * File change event data
 */
export interface FileEvent {
  /** Event type (add, change, unlink, etc.) */
  type: FileEventType;
  /** Absolute path to the file */
  path: string;
  /** Absolute path to the file (alias for compatibility) */
  absolutePath: string;
  /** Relative path from vault root */
  relativePath: string;
  /** File stats (if available) */
  stats?: {
    size: number;
    mtime: Date;
    ctime: Date;
  };
  /** Timestamp when event was detected */
  timestamp: Date;
}

/**
 * File watcher event handler
 */
export type FileEventHandler = (event: FileEvent) => void | Promise<void>;

/**
 * File watcher configuration
 */
export interface FileWatcherConfig {
  /** Path to watch */
  watchPath: string;
  /** Patterns to ignore (glob patterns) */
  ignored?: string[];
  /** Debounce delay in milliseconds */
  debounceDelay?: number;
  /** Whether to watch for file changes */
  enabled?: boolean;
}

/**
 * File watcher statistics
 */
export interface FileWatcherStats {
  /** Total events processed */
  totalEvents: number;
  /** Events by type */
  eventsByType: Record<FileEventType, number>;
  /** Number of active handlers */
  activeHandlers: number;
  /** Watcher start time */
  startTime: Date;
  /** Is watcher currently running */
  isRunning: boolean;
}
