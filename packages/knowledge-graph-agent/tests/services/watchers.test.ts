/**
 * Tests for FileWatcherService
 *
 * Comprehensive tests for file system watching capabilities including
 * start/stop lifecycle, path management, event handling, and metrics.
 *
 * @module tests/services/watchers
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { EventEmitter } from 'events';
import { FileWatcherService, createFileWatcher, type FileWatcherOptions } from '../../src/services/watchers.js';

/**
 * Mock FSWatcher implementation for testing
 */
class MockFSWatcher extends EventEmitter {
  closed = false;
  watchedPaths: Set<string> = new Set();

  constructor(paths: string | string[]) {
    super();
    const pathArray = Array.isArray(paths) ? paths : [paths];
    pathArray.forEach(p => this.watchedPaths.add(p));
  }

  add(paths: string | string[]): void {
    const pathArray = Array.isArray(paths) ? paths : [paths];
    pathArray.forEach(p => this.watchedPaths.add(p));
  }

  unwatch(paths: string | string[]): void {
    const pathArray = Array.isArray(paths) ? paths : [paths];
    pathArray.forEach(p => this.watchedPaths.delete(p));
  }

  getWatched(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    this.watchedPaths.forEach(p => {
      const dir = p.split('/').slice(0, -1).join('/') || '.';
      const file = p.split('/').pop() || p;
      if (!result[dir]) result[dir] = [];
      result[dir].push(file);
    });
    return result;
  }

  async close(): Promise<void> {
    this.closed = true;
    this.removeAllListeners();
  }
}

// Mock chokidar module
vi.mock('chokidar', () => ({
  watch: vi.fn((paths: string | string[], _options?: unknown) => {
    return new MockFSWatcher(paths);
  }),
}));

// Mock the logger to avoid console output during tests
vi.mock('../../src/utils/index.js', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('FileWatcherService', () => {
  let watcher: FileWatcherService;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (watcher) {
      await watcher.stop();
    }
  });

  describe('constructor', () => {
    it('should create a service with array of paths', () => {
      watcher = new FileWatcherService(['/path/to/watch']);

      expect(watcher).toBeInstanceOf(FileWatcherService);
      expect(watcher).toBeInstanceOf(EventEmitter);
    });

    it('should create a service with options object', () => {
      const options: FileWatcherOptions = {
        paths: ['/path/to/watch'],
        ignored: /node_modules/,
        ignoreInitial: true,
      };

      watcher = new FileWatcherService(options);

      expect(watcher).toBeInstanceOf(FileWatcherService);
    });

    it('should create a service with multiple paths', () => {
      watcher = new FileWatcherService(['/path/one', '/path/two', '/path/three']);

      expect(watcher).toBeInstanceOf(FileWatcherService);
    });

    it('should accept string pattern for ignored files', () => {
      const options: FileWatcherOptions = {
        paths: ['/watch'],
        ignored: '*.log',
      };

      watcher = new FileWatcherService(options);

      expect(watcher).toBeInstanceOf(FileWatcherService);
    });

    it('should accept RegExp for ignored files', () => {
      const options: FileWatcherOptions = {
        paths: ['/watch'],
        ignored: /\.(log|tmp)$/,
      };

      watcher = new FileWatcherService(options);

      expect(watcher).toBeInstanceOf(FileWatcherService);
    });

    it('should accept array of patterns for ignored files', () => {
      const options: FileWatcherOptions = {
        paths: ['/watch'],
        ignored: ['*.log', /node_modules/, '.git'],
      };

      watcher = new FileWatcherService(options);

      expect(watcher).toBeInstanceOf(FileWatcherService);
    });

    it('should accept stability threshold option', () => {
      const options: FileWatcherOptions = {
        paths: ['/watch'],
        stabilityThreshold: 1000,
        pollInterval: 200,
      };

      watcher = new FileWatcherService(options);

      expect(watcher).toBeInstanceOf(FileWatcherService);
    });

    it('should accept polling option', () => {
      const options: FileWatcherOptions = {
        paths: ['/watch'],
        usePolling: true,
      };

      watcher = new FileWatcherService(options);

      expect(watcher).toBeInstanceOf(FileWatcherService);
    });

    it('should accept depth option', () => {
      const options: FileWatcherOptions = {
        paths: ['/watch'],
        depth: 3,
      };

      watcher = new FileWatcherService(options);

      expect(watcher).toBeInstanceOf(FileWatcherService);
    });

    it('should initialize with healthy status', () => {
      watcher = new FileWatcherService(['/watch']);

      const metrics = watcher.getMetrics();

      expect(metrics.healthStatus).toBe('healthy');
      expect(metrics.requests).toBe(0);
      expect(metrics.errors).toBe(0);
    });
  });

  describe('start()', () => {
    it('should start watching files', async () => {
      watcher = new FileWatcherService(['/path/to/watch']);

      await watcher.start();

      const healthy = await watcher.healthCheck();
      expect(healthy).toBe(true);
    });

    it('should emit ready event when watching is ready', async () => {
      watcher = new FileWatcherService(['/path/to/watch']);
      const readyHandler = vi.fn();
      watcher.on('ready', readyHandler);

      await watcher.start();

      // Simulate chokidar ready event
      watcher['watcher']?.emit('ready');

      expect(readyHandler).toHaveBeenCalledTimes(1);
    });

    it('should not start again if already running', async () => {
      watcher = new FileWatcherService(['/path/to/watch']);

      await watcher.start();
      await watcher.start(); // Should not throw or create new watcher

      const healthy = await watcher.healthCheck();
      expect(healthy).toBe(true);
    });

    it('should use default ignoreInitial of true', async () => {
      const { watch } = await import('chokidar');

      watcher = new FileWatcherService(['/path']);
      await watcher.start();

      expect(watch).toHaveBeenCalledWith(
        ['/path'],
        expect.objectContaining({
          ignoreInitial: true,
        })
      );
    });

    it('should respect ignoreInitial option when false', async () => {
      const { watch } = await import('chokidar');

      watcher = new FileWatcherService({
        paths: ['/path'],
        ignoreInitial: false,
      });
      await watcher.start();

      expect(watch).toHaveBeenCalledWith(
        ['/path'],
        expect.objectContaining({
          ignoreInitial: false,
        })
      );
    });

    it('should set persistent to true', async () => {
      const { watch } = await import('chokidar');

      watcher = new FileWatcherService(['/path']);
      await watcher.start();

      expect(watch).toHaveBeenCalledWith(
        ['/path'],
        expect.objectContaining({
          persistent: true,
        })
      );
    });

    it('should configure awaitWriteFinish with default thresholds', async () => {
      const { watch } = await import('chokidar');

      watcher = new FileWatcherService(['/path']);
      await watcher.start();

      expect(watch).toHaveBeenCalledWith(
        ['/path'],
        expect.objectContaining({
          awaitWriteFinish: {
            stabilityThreshold: 500,
            pollInterval: 100,
          },
        })
      );
    });

    it('should configure awaitWriteFinish with custom thresholds', async () => {
      const { watch } = await import('chokidar');

      watcher = new FileWatcherService({
        paths: ['/path'],
        stabilityThreshold: 1000,
        pollInterval: 250,
      });
      await watcher.start();

      expect(watch).toHaveBeenCalledWith(
        ['/path'],
        expect.objectContaining({
          awaitWriteFinish: {
            stabilityThreshold: 1000,
            pollInterval: 250,
          },
        })
      );
    });

    it('should pass ignored patterns to chokidar', async () => {
      const { watch } = await import('chokidar');
      const ignored = /node_modules/;

      watcher = new FileWatcherService({
        paths: ['/path'],
        ignored,
      });
      await watcher.start();

      expect(watch).toHaveBeenCalledWith(
        ['/path'],
        expect.objectContaining({
          ignored,
        })
      );
    });

    it('should pass depth option to chokidar', async () => {
      const { watch } = await import('chokidar');

      watcher = new FileWatcherService({
        paths: ['/path'],
        depth: 5,
      });
      await watcher.start();

      expect(watch).toHaveBeenCalledWith(
        ['/path'],
        expect.objectContaining({
          depth: 5,
        })
      );
    });

    it('should pass usePolling option to chokidar', async () => {
      const { watch } = await import('chokidar');

      watcher = new FileWatcherService({
        paths: ['/path'],
        usePolling: true,
      });
      await watcher.start();

      expect(watch).toHaveBeenCalledWith(
        ['/path'],
        expect.objectContaining({
          usePolling: true,
        })
      );
    });

    it('should set health status to healthy on start', async () => {
      watcher = new FileWatcherService(['/path']);

      await watcher.start();

      const metrics = watcher.getMetrics();
      expect(metrics.healthStatus).toBe('healthy');
    });
  });

  describe('stop()', () => {
    it('should stop watching files', async () => {
      watcher = new FileWatcherService(['/path/to/watch']);

      await watcher.start();
      await watcher.stop();

      const healthy = await watcher.healthCheck();
      expect(healthy).toBe(false);
    });

    it('should not throw if not running', async () => {
      watcher = new FileWatcherService(['/path/to/watch']);

      await expect(watcher.stop()).resolves.not.toThrow();
    });

    it('should close the underlying watcher', async () => {
      watcher = new FileWatcherService(['/path/to/watch']);

      await watcher.start();
      const mockWatcher = watcher['watcher'] as MockFSWatcher;

      await watcher.stop();

      expect(mockWatcher.closed).toBe(true);
    });

    it('should update uptime metrics on stop', async () => {
      watcher = new FileWatcherService(['/path/to/watch']);

      await watcher.start();
      await new Promise(resolve => setTimeout(resolve, 50)); // Wait a bit
      await watcher.stop();

      const metrics = watcher.getMetrics();
      expect(metrics.uptime).toBeGreaterThan(0);
    });

    it('should allow restart after stop', async () => {
      watcher = new FileWatcherService(['/path/to/watch']);

      await watcher.start();
      await watcher.stop();
      await watcher.start();

      const healthy = await watcher.healthCheck();
      expect(healthy).toBe(true);
    });

    it('should accumulate uptime across multiple start/stop cycles', async () => {
      watcher = new FileWatcherService(['/path/to/watch']);

      await watcher.start();
      await new Promise(resolve => setTimeout(resolve, 30));
      await watcher.stop();

      const uptime1 = watcher.getMetrics().uptime;

      await watcher.start();
      await new Promise(resolve => setTimeout(resolve, 30));
      await watcher.stop();

      const uptime2 = watcher.getMetrics().uptime;

      expect(uptime2).toBeGreaterThan(uptime1);
    });
  });

  describe('healthCheck()', () => {
    it('should return true when running', async () => {
      watcher = new FileWatcherService(['/path']);

      await watcher.start();

      const healthy = await watcher.healthCheck();
      expect(healthy).toBe(true);
    });

    it('should return false when not running', async () => {
      watcher = new FileWatcherService(['/path']);

      const healthy = await watcher.healthCheck();
      expect(healthy).toBe(false);
    });

    it('should return false after stop', async () => {
      watcher = new FileWatcherService(['/path']);

      await watcher.start();
      await watcher.stop();

      const healthy = await watcher.healthCheck();
      expect(healthy).toBe(false);
    });
  });

  describe('getMetrics()', () => {
    it('should return initial metrics', () => {
      watcher = new FileWatcherService(['/path']);

      const metrics = watcher.getMetrics();

      expect(metrics).toEqual({
        uptime: 0,
        requests: 0,
        errors: 0,
        healthStatus: 'healthy',
      });
    });

    it('should track uptime while running', async () => {
      watcher = new FileWatcherService(['/path']);

      await watcher.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics = watcher.getMetrics();
      expect(metrics.uptime).toBeGreaterThanOrEqual(90); // Allow some variance
    });

    it('should increment requests on file events', async () => {
      watcher = new FileWatcherService(['/path']);
      await watcher.start();

      // Simulate file events
      watcher['watcher']?.emit('add', '/path/file1.txt');
      watcher['watcher']?.emit('change', '/path/file2.txt');
      watcher['watcher']?.emit('unlink', '/path/file3.txt');

      const metrics = watcher.getMetrics();
      expect(metrics.requests).toBe(3);
    });

    it('should increment errors on error events', async () => {
      watcher = new FileWatcherService(['/path']);
      // Add error handler to prevent unhandled error throwing
      watcher.on('error', () => {});
      await watcher.start();

      // Simulate error event
      watcher['watcher']?.emit('error', new Error('Test error'));

      const metrics = watcher.getMetrics();
      expect(metrics.errors).toBe(1);
      expect(metrics.healthStatus).toBe('degraded');
    });

    it('should return stable uptime when stopped', async () => {
      watcher = new FileWatcherService(['/path']);

      await watcher.start();
      await new Promise(resolve => setTimeout(resolve, 50));
      await watcher.stop();

      const metrics1 = watcher.getMetrics();
      await new Promise(resolve => setTimeout(resolve, 50));
      const metrics2 = watcher.getMetrics();

      // Uptime should not increase when stopped
      expect(metrics1.uptime).toBe(metrics2.uptime);
    });
  });

  describe('add()', () => {
    it('should add paths to watch', async () => {
      watcher = new FileWatcherService(['/initial']);
      await watcher.start();

      watcher.add('/new/path');

      const mockWatcher = watcher['watcher'] as MockFSWatcher;
      expect(mockWatcher.watchedPaths.has('/new/path')).toBe(true);
    });

    it('should add multiple paths at once', async () => {
      watcher = new FileWatcherService(['/initial']);
      await watcher.start();

      watcher.add(['/path/one', '/path/two']);

      const mockWatcher = watcher['watcher'] as MockFSWatcher;
      expect(mockWatcher.watchedPaths.has('/path/one')).toBe(true);
      expect(mockWatcher.watchedPaths.has('/path/two')).toBe(true);
    });

    it('should do nothing if watcher not started', () => {
      watcher = new FileWatcherService(['/initial']);

      // Should not throw
      expect(() => watcher.add('/new/path')).not.toThrow();
    });
  });

  describe('unwatch()', () => {
    it('should remove paths from watching', async () => {
      watcher = new FileWatcherService(['/path/one', '/path/two']);
      await watcher.start();

      watcher.unwatch('/path/one');

      const mockWatcher = watcher['watcher'] as MockFSWatcher;
      expect(mockWatcher.watchedPaths.has('/path/one')).toBe(false);
      expect(mockWatcher.watchedPaths.has('/path/two')).toBe(true);
    });

    it('should remove multiple paths at once', async () => {
      watcher = new FileWatcherService(['/path/one', '/path/two', '/path/three']);
      await watcher.start();

      watcher.unwatch(['/path/one', '/path/two']);

      const mockWatcher = watcher['watcher'] as MockFSWatcher;
      expect(mockWatcher.watchedPaths.has('/path/one')).toBe(false);
      expect(mockWatcher.watchedPaths.has('/path/two')).toBe(false);
      expect(mockWatcher.watchedPaths.has('/path/three')).toBe(true);
    });

    it('should do nothing if watcher not started', () => {
      watcher = new FileWatcherService(['/initial']);

      // Should not throw
      expect(() => watcher.unwatch('/initial')).not.toThrow();
    });
  });

  describe('getWatched()', () => {
    it('should return watched paths', async () => {
      watcher = new FileWatcherService(['/path/to/file.txt']);
      await watcher.start();

      const watched = watcher.getWatched();

      expect(watched).toBeDefined();
      expect(typeof watched).toBe('object');
    });

    it('should return empty object if not started', () => {
      watcher = new FileWatcherService(['/path']);

      const watched = watcher.getWatched();

      expect(watched).toEqual({});
    });
  });

  describe('event handling', () => {
    describe('add event', () => {
      it('should emit add event when file is added', async () => {
        watcher = new FileWatcherService(['/watch']);
        const addHandler = vi.fn();
        watcher.on('add', addHandler);

        await watcher.start();
        watcher['watcher']?.emit('add', '/watch/new-file.txt');

        expect(addHandler).toHaveBeenCalledWith('/watch/new-file.txt');
      });

      it('should increment metrics on add event', async () => {
        watcher = new FileWatcherService(['/watch']);
        await watcher.start();

        watcher['watcher']?.emit('add', '/watch/file.txt');

        const metrics = watcher.getMetrics();
        expect(metrics.requests).toBe(1);
      });
    });

    describe('change event', () => {
      it('should emit change event when file is modified', async () => {
        watcher = new FileWatcherService(['/watch']);
        const changeHandler = vi.fn();
        watcher.on('change', changeHandler);

        await watcher.start();
        watcher['watcher']?.emit('change', '/watch/modified-file.txt');

        expect(changeHandler).toHaveBeenCalledWith('/watch/modified-file.txt');
      });

      it('should increment metrics on change event', async () => {
        watcher = new FileWatcherService(['/watch']);
        await watcher.start();

        watcher['watcher']?.emit('change', '/watch/file.txt');

        const metrics = watcher.getMetrics();
        expect(metrics.requests).toBe(1);
      });
    });

    describe('unlink event', () => {
      it('should emit unlink event when file is removed', async () => {
        watcher = new FileWatcherService(['/watch']);
        const unlinkHandler = vi.fn();
        watcher.on('unlink', unlinkHandler);

        await watcher.start();
        watcher['watcher']?.emit('unlink', '/watch/deleted-file.txt');

        expect(unlinkHandler).toHaveBeenCalledWith('/watch/deleted-file.txt');
      });

      it('should increment metrics on unlink event', async () => {
        watcher = new FileWatcherService(['/watch']);
        await watcher.start();

        watcher['watcher']?.emit('unlink', '/watch/file.txt');

        const metrics = watcher.getMetrics();
        expect(metrics.requests).toBe(1);
      });
    });

    describe('addDir event', () => {
      it('should emit addDir event when directory is added', async () => {
        watcher = new FileWatcherService(['/watch']);
        const addDirHandler = vi.fn();
        watcher.on('addDir', addDirHandler);

        await watcher.start();
        watcher['watcher']?.emit('addDir', '/watch/new-dir');

        expect(addDirHandler).toHaveBeenCalledWith('/watch/new-dir');
      });

      it('should increment metrics on addDir event', async () => {
        watcher = new FileWatcherService(['/watch']);
        await watcher.start();

        watcher['watcher']?.emit('addDir', '/watch/dir');

        const metrics = watcher.getMetrics();
        expect(metrics.requests).toBe(1);
      });
    });

    describe('unlinkDir event', () => {
      it('should emit unlinkDir event when directory is removed', async () => {
        watcher = new FileWatcherService(['/watch']);
        const unlinkDirHandler = vi.fn();
        watcher.on('unlinkDir', unlinkDirHandler);

        await watcher.start();
        watcher['watcher']?.emit('unlinkDir', '/watch/deleted-dir');

        expect(unlinkDirHandler).toHaveBeenCalledWith('/watch/deleted-dir');
      });

      it('should increment metrics on unlinkDir event', async () => {
        watcher = new FileWatcherService(['/watch']);
        await watcher.start();

        watcher['watcher']?.emit('unlinkDir', '/watch/dir');

        const metrics = watcher.getMetrics();
        expect(metrics.requests).toBe(1);
      });
    });

    describe('error event', () => {
      it('should emit error event on watcher error', async () => {
        watcher = new FileWatcherService(['/watch']);
        const errorHandler = vi.fn();
        watcher.on('error', errorHandler);

        await watcher.start();
        const testError = new Error('Watch error');
        watcher['watcher']?.emit('error', testError);

        expect(errorHandler).toHaveBeenCalledWith(testError);
      });

      it('should convert non-Error to Error', async () => {
        watcher = new FileWatcherService(['/watch']);
        const errorHandler = vi.fn();
        watcher.on('error', errorHandler);

        await watcher.start();
        watcher['watcher']?.emit('error', 'string error');

        expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
        expect(errorHandler.mock.calls[0][0].message).toBe('string error');
      });

      it('should increment error count on error event', async () => {
        watcher = new FileWatcherService(['/watch']);
        // Add error handler to prevent unhandled error throwing
        watcher.on('error', () => {});
        await watcher.start();

        watcher['watcher']?.emit('error', new Error('Test'));

        const metrics = watcher.getMetrics();
        expect(metrics.errors).toBe(1);
      });

      it('should set health status to degraded on error', async () => {
        watcher = new FileWatcherService(['/watch']);
        // Add error handler to prevent unhandled error throwing
        watcher.on('error', () => {});
        await watcher.start();

        watcher['watcher']?.emit('error', new Error('Test'));

        const metrics = watcher.getMetrics();
        expect(metrics.healthStatus).toBe('degraded');
      });
    });

    describe('ready event', () => {
      it('should emit ready event when watcher is ready', async () => {
        watcher = new FileWatcherService(['/watch']);
        const readyHandler = vi.fn();
        watcher.on('ready', readyHandler);

        await watcher.start();
        watcher['watcher']?.emit('ready');

        expect(readyHandler).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('pattern-based watching', () => {
    it('should pass ignored string pattern to chokidar', async () => {
      const { watch } = await import('chokidar');

      watcher = new FileWatcherService({
        paths: ['/watch'],
        ignored: '**/*.log',
      });
      await watcher.start();

      expect(watch).toHaveBeenCalledWith(
        ['/watch'],
        expect.objectContaining({
          ignored: '**/*.log',
        })
      );
    });

    it('should pass ignored regex pattern to chokidar', async () => {
      const { watch } = await import('chokidar');
      const pattern = /node_modules|\.git/;

      watcher = new FileWatcherService({
        paths: ['/watch'],
        ignored: pattern,
      });
      await watcher.start();

      expect(watch).toHaveBeenCalledWith(
        ['/watch'],
        expect.objectContaining({
          ignored: pattern,
        })
      );
    });

    it('should pass multiple ignored patterns to chokidar', async () => {
      const { watch } = await import('chokidar');
      const patterns = ['*.log', /node_modules/, '.git'];

      watcher = new FileWatcherService({
        paths: ['/watch'],
        ignored: patterns,
      });
      await watcher.start();

      expect(watch).toHaveBeenCalledWith(
        ['/watch'],
        expect.objectContaining({
          ignored: patterns,
        })
      );
    });
  });

  describe('debouncing via awaitWriteFinish', () => {
    it('should configure default debounce settings', async () => {
      const { watch } = await import('chokidar');

      watcher = new FileWatcherService(['/watch']);
      await watcher.start();

      expect(watch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          awaitWriteFinish: {
            stabilityThreshold: 500,
            pollInterval: 100,
          },
        })
      );
    });

    it('should configure custom stability threshold', async () => {
      const { watch } = await import('chokidar');

      watcher = new FileWatcherService({
        paths: ['/watch'],
        stabilityThreshold: 2000,
      });
      await watcher.start();

      expect(watch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          awaitWriteFinish: expect.objectContaining({
            stabilityThreshold: 2000,
          }),
        })
      );
    });

    it('should configure custom poll interval', async () => {
      const { watch } = await import('chokidar');

      watcher = new FileWatcherService({
        paths: ['/watch'],
        pollInterval: 500,
      });
      await watcher.start();

      expect(watch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          awaitWriteFinish: expect.objectContaining({
            pollInterval: 500,
          }),
        })
      );
    });

    it('should combine stability threshold and poll interval', async () => {
      const { watch } = await import('chokidar');

      watcher = new FileWatcherService({
        paths: ['/watch'],
        stabilityThreshold: 1500,
        pollInterval: 300,
      });
      await watcher.start();

      expect(watch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          awaitWriteFinish: {
            stabilityThreshold: 1500,
            pollInterval: 300,
          },
        })
      );
    });
  });

  describe('createFileWatcher factory function', () => {
    it('should create FileWatcherService with array of paths', () => {
      const service = createFileWatcher(['/path/to/watch']);

      expect(service).toBeInstanceOf(FileWatcherService);
    });

    it('should create FileWatcherService with options object', () => {
      const service = createFileWatcher({
        paths: ['/path/to/watch'],
        ignored: /node_modules/,
        ignoreInitial: false,
      });

      expect(service).toBeInstanceOf(FileWatcherService);
    });
  });

  describe('ServiceHandler interface', () => {
    it('should implement start method', () => {
      watcher = new FileWatcherService(['/path']);

      expect(typeof watcher.start).toBe('function');
    });

    it('should implement stop method', () => {
      watcher = new FileWatcherService(['/path']);

      expect(typeof watcher.stop).toBe('function');
    });

    it('should implement healthCheck method', () => {
      watcher = new FileWatcherService(['/path']);

      expect(typeof watcher.healthCheck).toBe('function');
    });

    it('should implement getMetrics method', () => {
      watcher = new FileWatcherService(['/path']);

      expect(typeof watcher.getMetrics).toBe('function');
    });

    it('should return ServiceMetrics from getMetrics', () => {
      watcher = new FileWatcherService(['/path']);

      const metrics = watcher.getMetrics();

      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('requests');
      expect(metrics).toHaveProperty('errors');
      expect(metrics).toHaveProperty('healthStatus');
    });
  });

  describe('edge cases', () => {
    it('should handle empty paths array', () => {
      watcher = new FileWatcherService([]);

      expect(watcher).toBeInstanceOf(FileWatcherService);
    });

    it('should handle paths with special characters', async () => {
      watcher = new FileWatcherService(['/path/with spaces/and (parentheses)']);
      await watcher.start();

      const healthy = await watcher.healthCheck();
      expect(healthy).toBe(true);
    });

    it('should handle rapid start/stop cycles', async () => {
      watcher = new FileWatcherService(['/path']);

      for (let i = 0; i < 5; i++) {
        await watcher.start();
        await watcher.stop();
      }

      // Should end up stopped
      const healthy = await watcher.healthCheck();
      expect(healthy).toBe(false);
    });

    it('should handle multiple event listeners', async () => {
      watcher = new FileWatcherService(['/watch']);
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      watcher.on('change', handler1);
      watcher.on('change', handler2);

      await watcher.start();
      watcher['watcher']?.emit('change', '/watch/file.txt');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should handle event listener removal', async () => {
      watcher = new FileWatcherService(['/watch']);
      const handler = vi.fn();

      watcher.on('change', handler);
      watcher.off('change', handler);

      await watcher.start();
      watcher['watcher']?.emit('change', '/watch/file.txt');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle concurrent add and unwatch operations', async () => {
      watcher = new FileWatcherService(['/initial']);
      await watcher.start();

      watcher.add('/path/one');
      watcher.add('/path/two');
      watcher.unwatch('/path/one');
      watcher.add('/path/three');

      const mockWatcher = watcher['watcher'] as MockFSWatcher;
      expect(mockWatcher.watchedPaths.has('/path/one')).toBe(false);
      expect(mockWatcher.watchedPaths.has('/path/two')).toBe(true);
      expect(mockWatcher.watchedPaths.has('/path/three')).toBe(true);
    });
  });
});
