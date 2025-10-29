/**
 * File Watcher Module
 *
 * Monitors the Obsidian vault for file changes using chokidar.
 * Implements debouncing, ignore patterns, and event handling.
 */

import chokidar, { type FSWatcher } from 'chokidar';
import { relative } from 'path';
import { logger } from '../utils/logger.js';
import type { FileEvent, FileEventHandler, FileEventType, FileWatcherConfig, FileWatcherStats } from './types.js';

export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private config: Required<FileWatcherConfig>;
  private handlers: Set<FileEventHandler> = new Set();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private stats: FileWatcherStats;

  constructor(config: FileWatcherConfig) {
    this.config = {
      watchPath: config.watchPath,
      ignored: config.ignored || ['.obsidian', '.git', 'node_modules', '.archive'],
      debounceDelay: config.debounceDelay || 1000,
      enabled: config.enabled ?? true,
    };

    this.stats = {
      totalEvents: 0,
      eventsByType: {
        add: 0,
        change: 0,
        unlink: 0,
        addDir: 0,
        unlinkDir: 0,
      },
      activeHandlers: 0,
      startTime: new Date(),
      isRunning: false,
    };
  }

  /**
   * Start watching for file changes
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      logger.info('File watcher disabled via configuration');
      return;
    }

    if (this.watcher) {
      logger.warn('File watcher already started');
      return;
    }

    try {
      logger.info('Starting file watcher', {
        path: this.config.watchPath,
        ignored: this.config.ignored,
        debounceDelay: this.config.debounceDelay,
      });

      this.watcher = chokidar.watch(this.config.watchPath, {
        ignored: this.config.ignored.map(pattern => `**/${pattern}/**`),
        persistent: true,
        ignoreInitial: true, // Don't fire events for existing files on startup
        awaitWriteFinish: {
          stabilityThreshold: 200, // Wait for file to stabilize
          pollInterval: 100,
        },
        depth: undefined, // Watch all subdirectories
      });

      // Register event handlers
      this.watcher
        .on('add', (path, stats) => this.handleEvent('add', path, stats))
        .on('change', (path, stats) => this.handleEvent('change', path, stats))
        .on('unlink', (path) => this.handleEvent('unlink', path))
        .on('addDir', (path, stats) => this.handleEvent('addDir', path, stats))
        .on('unlinkDir', (path) => this.handleEvent('unlinkDir', path))
        .on('error', (error) => {
          logger.error('File watcher error', error instanceof Error ? error : new Error(String(error)));
        })
        .on('ready', () => {
          this.stats.isRunning = true;
          logger.info('✅ File watcher ready', {
            watchPath: this.config.watchPath,
            handlers: this.handlers.size,
          });
        });

    } catch (error) {
      logger.error('Failed to start file watcher', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Stop watching for file changes
   */
  async stop(): Promise<void> {
    if (!this.watcher) {
      return;
    }

    try {
      logger.info('Stopping file watcher');

      // Clear all debounce timers
      for (const timer of this.debounceTimers.values()) {
        clearTimeout(timer);
      }
      this.debounceTimers.clear();

      await this.watcher.close();
      this.watcher = null;
      this.stats.isRunning = false;

      logger.info('✅ File watcher stopped', {
        totalEvents: this.stats.totalEvents,
        eventsByType: this.stats.eventsByType,
      });
    } catch (error) {
      logger.error('Failed to stop file watcher', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Register a file event handler
   */
  on(handler: FileEventHandler): void {
    this.handlers.add(handler);
    this.stats.activeHandlers = this.handlers.size;
    logger.debug('File event handler registered', { totalHandlers: this.handlers.size });
  }

  /**
   * Unregister a file event handler
   */
  off(handler: FileEventHandler): void {
    this.handlers.delete(handler);
    this.stats.activeHandlers = this.handlers.size;
    logger.debug('File event handler unregistered', { totalHandlers: this.handlers.size });
  }

  /**
   * Get watcher statistics
   */
  getStats(): FileWatcherStats {
    return { ...this.stats };
  }

  /**
   * Handle a file system event with debouncing
   */
  private handleEvent(type: FileEventType, path: string, stats?: { size: number; mtime: Date; ctime: Date }): void {
    // Only process markdown files for most events
    const isMarkdown = path.endsWith('.md');
    const isDirectory = type === 'addDir' || type === 'unlinkDir';

    if (!isMarkdown && !isDirectory) {
      return; // Ignore non-markdown files
    }

    // Get relative path from vault root
    const relativePath = relative(this.config.watchPath, path);

    // Debounce the event
    const debounceKey = `${type}:${path}`;

    // Clear existing timer for this path
    const existingTimer = this.debounceTimers.get(debounceKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.debounceTimers.delete(debounceKey);
      this.processEvent(type, path, relativePath, stats);
    }, this.config.debounceDelay);

    this.debounceTimers.set(debounceKey, timer);
  }

  /**
   * Process a debounced file event
   */
  private async processEvent(
    type: FileEventType,
    path: string,
    relativePath: string,
    stats?: { size: number; mtime: Date; ctime: Date }
  ): Promise<void> {
    const event: FileEvent = {
      type,
      path,
      absolutePath: path, // Alias for compatibility
      relativePath,
      stats,
      timestamp: new Date(),
    };

    // Update statistics
    this.stats.totalEvents++;
    this.stats.eventsByType[type]++;

    logger.debug('File event', {
      type,
      relativePath,
      handlers: this.handlers.size,
    });

    // Notify all handlers
    for (const handler of this.handlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error('File event handler error', error instanceof Error ? error : new Error(String(error)), {
          type,
          path: relativePath,
        });
      }
    }
  }
}

/**
 * Create a file watcher instance
 */
export function createFileWatcher(config: FileWatcherConfig): FileWatcher {
  return new FileWatcher(config);
}

// Re-export types
export type { FileEvent, FileEventHandler, FileEventType, FileWatcherConfig, FileWatcherStats } from './types.js';
