/**
 * File Watcher Service
 *
 * Provides file system watching capabilities using chokidar.
 * Monitors files and directories for changes and emits events.
 *
 * @module services/watchers
 */
import { EventEmitter } from 'events';
import type { ServiceHandler, ServiceMetrics } from './types.js';
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
export declare class FileWatcherService extends EventEmitter implements ServiceHandler {
    private watcher?;
    private options;
    private metrics;
    private startTime?;
    private isRunning;
    constructor(options: FileWatcherOptions | string[]);
    /**
     * Start watching for file changes.
     */
    start(): Promise<void>;
    /**
     * Stop watching for file changes.
     */
    stop(): Promise<void>;
    /**
     * Check if the watcher is healthy.
     */
    healthCheck(): Promise<boolean>;
    /**
     * Get current metrics.
     */
    getMetrics(): ServiceMetrics;
    /**
     * Add paths to watch.
     *
     * @param paths - Paths to add
     */
    add(paths: string | string[]): void;
    /**
     * Remove paths from watching.
     *
     * @param paths - Paths to unwatch
     */
    unwatch(paths: string | string[]): void;
    /**
     * Get list of watched paths.
     */
    getWatched(): Record<string, string[]>;
}
/**
 * Create a file watcher service.
 *
 * @param options - Watcher options or array of paths
 * @returns Configured FileWatcherService
 */
export declare function createFileWatcher(options: FileWatcherOptions | string[]): FileWatcherService;
//# sourceMappingURL=watchers.d.ts.map