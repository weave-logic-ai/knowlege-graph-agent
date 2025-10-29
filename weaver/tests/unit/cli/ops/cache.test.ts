/**
 * Cache Operations Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync, statSync, readdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Cache Operations', () => {
  let testCacheDir: string;

  beforeEach(() => {
    testCacheDir = join(tmpdir(), `weaver-cache-test-${Date.now()}`);
    mkdirSync(testCacheDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testCacheDir)) {
      rmSync(testCacheDir, { recursive: true, force: true });
    }
  });

  describe('Cache Directory Management', () => {
    it('should create cache subdirectories', () => {
      const subdirs = ['embeddings', 'perception', 'workflow', 'shadow'];

      for (const subdir of subdirs) {
        const dirPath = join(testCacheDir, subdir);
        mkdirSync(dirPath, { recursive: true });
        expect(existsSync(dirPath)).toBe(true);
      }
    });

    it('should calculate directory size', () => {
      const testFile = join(testCacheDir, 'test.txt');
      const content = 'x'.repeat(1024); // 1KB
      writeFileSync(testFile, content);

      const stats = statSync(testFile);
      expect(stats.size).toBe(1024);
    });

    it('should count files in directory', () => {
      const files = ['file1.txt', 'file2.txt', 'file3.txt'];

      for (const file of files) {
        writeFileSync(join(testCacheDir, file), 'test');
      }

      const entries = readdirSync(testCacheDir);
      expect(entries.length).toBe(files.length);
    });
  });

  describe('Cache Size Calculation', () => {
    it('should calculate nested directory sizes', () => {
      const subdir = join(testCacheDir, 'nested');
      mkdirSync(subdir);

      writeFileSync(join(testCacheDir, 'root.txt'), 'x'.repeat(100));
      writeFileSync(join(subdir, 'nested.txt'), 'x'.repeat(200));

      let totalSize = 0;

      function calculateSize(dir: string): void {
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const path = join(dir, entry.name);
          if (entry.isDirectory()) {
            calculateSize(path);
          } else {
            totalSize += statSync(path).size;
          }
        }
      }

      calculateSize(testCacheDir);
      expect(totalSize).toBe(300);
    });

    it('should handle empty directories', () => {
      const emptyDir = join(testCacheDir, 'empty');
      mkdirSync(emptyDir);

      const entries = readdirSync(emptyDir);
      expect(entries.length).toBe(0);
    });
  });

  describe('Cache Clearing', () => {
    it('should remove cache files', () => {
      const testFiles = ['cache1.dat', 'cache2.dat', 'cache3.dat'];

      for (const file of testFiles) {
        writeFileSync(join(testCacheDir, file), 'cached data');
      }

      // Clear cache
      rmSync(testCacheDir, { recursive: true, force: true });
      mkdirSync(testCacheDir, { recursive: true });

      const entries = readdirSync(testCacheDir);
      expect(entries.length).toBe(0);
    });

    it('should remove nested cache directories', () => {
      const subdirs = ['level1', 'level1/level2', 'level1/level2/level3'];

      for (const subdir of subdirs) {
        const dirPath = join(testCacheDir, subdir);
        mkdirSync(dirPath, { recursive: true });
        writeFileSync(join(dirPath, 'cache.dat'), 'data');
      }

      rmSync(testCacheDir, { recursive: true, force: true });
      expect(existsSync(testCacheDir)).toBe(false);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache before and after sizes', () => {
      const files = ['big.dat', 'medium.dat', 'small.dat'];
      const sizes = [10000, 5000, 1000];

      for (let i = 0; i < files.length; i++) {
        writeFileSync(join(testCacheDir, files[i]), 'x'.repeat(sizes[i]));
      }

      const beforeStats = readdirSync(testCacheDir).map(f => {
        const path = join(testCacheDir, f);
        return statSync(path).size;
      });

      const beforeTotal = beforeStats.reduce((sum, size) => sum + size, 0);
      expect(beforeTotal).toBe(16000);

      // Remove one file
      rmSync(join(testCacheDir, 'big.dat'));

      const afterStats = readdirSync(testCacheDir).map(f => {
        const path = join(testCacheDir, f);
        return statSync(path).size;
      });

      const afterTotal = afterStats.reduce((sum, size) => sum + size, 0);
      expect(afterTotal).toBe(6000);
    });
  });

  describe('File Type Filtering', () => {
    it('should filter cache by type', () => {
      const embeddingsDir = join(testCacheDir, 'embeddings');
      const perceptionDir = join(testCacheDir, 'perception');

      mkdirSync(embeddingsDir);
      mkdirSync(perceptionDir);

      writeFileSync(join(embeddingsDir, 'cache1.emb'), 'data');
      writeFileSync(join(embeddingsDir, 'cache2.emb'), 'data');
      writeFileSync(join(perceptionDir, 'cache1.per'), 'data');

      const embeddingsFiles = readdirSync(embeddingsDir);
      const perceptionFiles = readdirSync(perceptionDir);

      expect(embeddingsFiles.length).toBe(2);
      expect(perceptionFiles.length).toBe(1);
    });

    it('should clear specific cache type', () => {
      const types = ['embeddings', 'perception', 'workflow'];

      for (const type of types) {
        const typeDir = join(testCacheDir, type);
        mkdirSync(typeDir);
        writeFileSync(join(typeDir, 'cache.dat'), 'data');
      }

      // Clear only embeddings
      const embeddingsDir = join(testCacheDir, 'embeddings');
      rmSync(embeddingsDir, { recursive: true, force: true });

      expect(existsSync(embeddingsDir)).toBe(false);
      expect(existsSync(join(testCacheDir, 'perception'))).toBe(true);
      expect(existsSync(join(testCacheDir, 'workflow'))).toBe(true);
    });
  });
});
