/**
 * File Watcher Service
 *
 * Provides file system watching capabilities using chokidar.
 * Monitors files and directories for changes and emits events.
 *
 * @module services/watchers
 */

import { watch, type FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';
import { createLogger } from '../utils/index.js';
import type { ServiceHandler, ServiceMetrics } from './types.js';

const logger = createLogger('file-watcher');

/**
 * Chokidar watch options interface.
 */
interface ChokidarOptions {
  persistent?: boolean;
  ignoreInitial?: boolean;
  ignored?: string | RegExp | (string | RegExp)[];
  depth?: number;
  usePolling?: boolean;
  awaitWriteFinish?: boolean | {
    stabilityThreshold?: number;
    pollInterval?: number;
  };
}

/**
 * Configuration options for the file watcher.
 */
export interface FileWatcherOptions {
  /** Paths to watch (files or directories) */
  paths: string[];
  /** File patterns to ignore */
  ignored?: string | RegExp | (string | RegExp)[];
  /** Whether to emit events for initial files */
  ignoreInitial?: boolean;
  /** Stability threshold in ms before emitting file change */
  stabilityThreshold?: number;
  /** Poll interval for write finish detection */
  pollInterval?: number;
  /** Use polling instead of native events */
  usePolling?: boolean;
  /** Depth to traverse directories */
  depth?: number;
}

/**
 * File watcher service that monitors file system changes.
 *
 * @example
 * ```typescript
 * const watcher = new FileWatcherService({
 *   paths: ['/path/to/watch'],
 *   ignored: /node_modules/,
 *   ignoreInitial: true,
 * });
 *
 * watcher.on('change', (path) => console.log(`Changed: ${path}`));
 * watcher.on('add', (path) => console.log(`Added: ${path}`));
 * watcher.on('unlink', (path) => console.log(`Removed: ${path}`));
 *
 * await watcher.start();
 * ```
 */
export class FileWatcherService extends EventEmitter implements ServiceHandler {
  private watcher?: FSWatcher;
  private options: FileWatcherOptions;
  private metrics: ServiceMetrics = {
    uptime: 0,
    requests: 0,
    errors: 0,
    healthStatus: 'healthy',
  };
  private startTime?: Date;
  private isRunning = false;

  constructor(options: FileWatcherOptions | string[]) {
    super();

    if (Array.isArray(options)) {
      this.options = { paths: options };
    } else {
      this.options = options;
    }
  }

  /**
   * Start watching for file changes.
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.debug('File watcher already running');
      return;
    }

    const watchOptions: ChokidarOptions = {
      persistent: true,
      ignoreInitial: this.options.ignoreInitial ?? true,
      ignored: this.options.ignored,
      depth: this.options.depth,
      usePolling: this.options.usePolling ?? false,
      awaitWriteFinish: {
        stabilityThreshold: this.options.stabilityThreshold ?? 500,
        pollInterval: this.options.pollInterval ?? 100,
      },
    };

    this.watcher = watch(this.options.paths, watchOptions);

    // File added
    this.watcher.on('add', (path: string) => {
      this.metrics.requests++;
      logger.debug('File added', { path });
      this.emit('add', path);
    });

    // File changed
    this.watcher.on('change', (path: string) => {
      this.metrics.requests++;
      logger.debug('File changed', { path });
      this.emit('change', path);
    });

    // File removed
    this.watcher.on('unlink', (path: string) => {
      this.metrics.requests++;
      logger.debug('File removed', { path });
      this.emit('unlink', path);
    });

    // Directory added
    this.watcher.on('addDir', (path: string) => {
      this.metrics.requests++;
      logger.debug('Directory added', { path });
      this.emit('addDir', path);
    });

    // Directory removed
    this.watcher.on('unlinkDir', (path: string) => {
      this.metrics.requests++;
      logger.debug('Directory removed', { path });
      this.emit('unlinkDir', path);
    });

    // Error handling
    this.watcher.on('error', (error: unknown) => {
      this.metrics.errors++;
      this.metrics.healthStatus = 'degraded';
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('File watcher error', err);
      this.emit('error', err);
    });

    // Ready event
    this.watcher.on('ready', () => {
      logger.debug('File watcher ready');
      this.emit('ready');
    });

    this.startTime = new Date();
    this.isRunning = true;
    this.metrics.healthStatus = 'healthy';

    logger.info('File watcher started', {
      paths: this.options.paths,
      ignoreInitial: watchOptions.ignoreInitial,
    });
  }

  /**
   * Stop watching for file changes.
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.watcher) {
      logger.debug('File watcher not running');
      return;
    }

    await this.watcher.close();
    this.watcher = undefined;
    this.isRunning = false;

    // Update uptime
    if (this.startTime) {
      this.metrics.uptime += Date.now() - this.startTime.getTime();
    }

    logger.info('File watcher stopped');
  }

  /**
   * Check if the watcher is healthy.
   */
  async healthCheck(): Promise<boolean> {
    return this.isRunning && !!this.watcher;
  }

  /**
   * Get current metrics.
   */
  getMetrics(): ServiceMetrics {
    const currentUptime = this.startTime && this.isRunning
      ? this.metrics.uptime + (Date.now() - this.startTime.getTime())
      : this.metrics.uptime;

    return {
      ...this.metrics,
      uptime: currentUptime,
    };
  }

  /**
   * Add paths to watch.
   *
   * @param paths - Paths to add
   */
  add(paths: string | string[]): void {
    if (this.watcher) {
      this.watcher.add(paths);
      logger.debug('Added watch paths', { paths });
    }
  }

  /**
   * Remove paths from watching.
   *
   * @param paths - Paths to unwatch
   */
  unwatch(paths: string | string[]): void {
    if (this.watcher) {
      this.watcher.unwatch(paths);
      logger.debug('Removed watch paths', { paths });
    }
  }

  /**
   * Get list of watched paths.
   */
  getWatched(): Record<string, string[]> {
    if (this.watcher) {
      return this.watcher.getWatched();
    }
    return {};
  }
}

/**
 * Create a file watcher service.
 *
 * @param options - Watcher options or array of paths
 * @returns Configured FileWatcherService
 */
export function createFileWatcher(options: FileWatcherOptions | string[]): FileWatcherService {
  return new FileWatcherService(options);
}
