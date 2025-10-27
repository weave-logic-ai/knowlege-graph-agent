/**
 * Directory Scanner Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import {
  scanDirectory,
  scanDirectoryWithStats,
  scanDirectories,
  countFiles,
  type FileNode,
} from '../../src/vault-init/scanner/directory-scanner.js';

// Test fixture directory
const TEST_ROOT = path.join(process.cwd(), '.test-fixtures', 'scanner-test');

/**
 * Create test directory structure
 */
async function createTestStructure() {
  await fs.mkdir(TEST_ROOT, { recursive: true });

  // Create directory structure
  await fs.mkdir(path.join(TEST_ROOT, 'src'), { recursive: true });
  await fs.mkdir(path.join(TEST_ROOT, 'src', 'utils'), { recursive: true });
  await fs.mkdir(path.join(TEST_ROOT, 'tests'), { recursive: true });
  await fs.mkdir(path.join(TEST_ROOT, 'node_modules'), { recursive: true });
  await fs.mkdir(path.join(TEST_ROOT, '.git'), { recursive: true });
  await fs.mkdir(path.join(TEST_ROOT, 'dist'), { recursive: true });

  // Create files
  await fs.writeFile(path.join(TEST_ROOT, 'README.md'), '# Test Project');
  await fs.writeFile(path.join(TEST_ROOT, 'package.json'), '{}');
  await fs.writeFile(path.join(TEST_ROOT, 'src', 'index.ts'), 'export {}');
  await fs.writeFile(path.join(TEST_ROOT, 'src', 'utils', 'helper.ts'), 'export {}');
  await fs.writeFile(path.join(TEST_ROOT, 'tests', 'test.ts'), 'import {}');
  await fs.writeFile(path.join(TEST_ROOT, 'node_modules', 'package.json'), '{}');
  await fs.writeFile(path.join(TEST_ROOT, '.git', 'config'), '[core]');
  await fs.writeFile(path.join(TEST_ROOT, 'dist', 'index.js'), '');
  await fs.writeFile(path.join(TEST_ROOT, '.env'), 'SECRET=123');

  // Create .gitignore
  await fs.writeFile(
    path.join(TEST_ROOT, '.gitignore'),
    'node_modules/\n.env\ndist/\n.git/\n*.log\n'
  );
}

/**
 * Clean up test directory
 */
async function cleanupTestStructure() {
  if (existsSync(TEST_ROOT)) {
    await fs.rm(TEST_ROOT, { recursive: true, force: true });
  }
}

describe('Directory Scanner', () => {
  beforeEach(async () => {
    await cleanupTestStructure();
    await createTestStructure();
  });

  afterEach(async () => {
    await cleanupTestStructure();
  });

  describe('scanDirectory', () => {
    it('should scan directory and return file nodes', async () => {
      const files = await scanDirectory(TEST_ROOT);

      expect(files).toBeDefined();
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);

      // Check file structure
      const file = files.find(f => f.relativePath === 'README.md');
      expect(file).toBeDefined();
      expect(file?.type).toBe('file');
      expect(file?.path).toContain('README.md');
      expect(file?.size).toBeGreaterThan(0);
      expect(file?.modified).toBeInstanceOf(Date);
    });

    it('should respect .gitignore patterns', async () => {
      const files = await scanDirectory(TEST_ROOT, {
        respectGitignore: true,
      });

      // Should not include .env (gitignored)
      const envFile = files.find(f => f.relativePath === '.env');
      expect(envFile).toBeUndefined();

      // Should include README.md (not gitignored)
      const readme = files.find(f => f.relativePath === 'README.md');
      expect(readme).toBeDefined();
    });

    it('should exclude default ignore patterns', async () => {
      const files = await scanDirectory(TEST_ROOT);

      // Should not include node_modules
      const nodeModules = files.filter(f => f.relativePath.startsWith('node_modules'));
      expect(nodeModules.length).toBe(0);

      // Should not include .git directory contents (but may include .gitignore file)
      const gitFiles = files.filter(f => f.relativePath.startsWith('.git/'));
      expect(gitFiles.length).toBe(0);

      // Should not include dist
      const dist = files.filter(f => f.relativePath.startsWith('dist'));
      expect(dist.length).toBe(0);
    });

    it('should apply custom ignore patterns', async () => {
      const files = await scanDirectory(TEST_ROOT, {
        customIgnore: ['tests/**', '*.md'],
      });

      // Should not include tests
      const tests = files.filter(f => f.relativePath.startsWith('tests'));
      expect(tests.length).toBe(0);

      // Should not include .md files
      const markdown = files.filter(f => f.relativePath.endsWith('.md'));
      expect(markdown.length).toBe(0);
    });

    it('should respect maxDepth option', async () => {
      const files = await scanDirectory(TEST_ROOT, {
        maxDepth: 1,
      });

      // With maxDepth: 1, we should get files at depth 1 (root level)
      // fast-glob's deep option controls the maximum depth to traverse
      const rootFiles = files.filter(f =>
        f.relativePath.split(path.sep).length === 1
      );
      expect(rootFiles.length).toBeGreaterThan(0);

      // Files deeper than maxDepth should be excluded
      const veryDeepFiles = files.filter(f =>
        f.relativePath.split(path.sep).length > 2
      );
      expect(veryDeepFiles.length).toBe(0);
    });

    it('should include directories when requested', async () => {
      const files = await scanDirectory(TEST_ROOT, {
        includeDirs: true,
      });

      const directories = files.filter(f => f.type === 'directory');
      expect(directories.length).toBeGreaterThan(0);

      // Should have src directory
      const srcDir = directories.find(f => f.relativePath === 'src');
      expect(srcDir).toBeDefined();
    });

    it('should handle non-existent directory', async () => {
      await expect(
        scanDirectory('/non/existent/path')
      ).rejects.toThrow('Path does not exist');
    });

    it('should handle file path instead of directory', async () => {
      const filePath = path.join(TEST_ROOT, 'README.md');
      await expect(
        scanDirectory(filePath)
      ).rejects.toThrow('Path is not a directory');
    });
  });

  describe('scanDirectoryWithStats', () => {
    it('should return files and statistics', async () => {
      const { files, stats } = await scanDirectoryWithStats(TEST_ROOT);

      expect(files).toBeDefined();
      expect(stats).toBeDefined();

      expect(stats.totalFiles).toBeGreaterThan(0);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.duration).toBeGreaterThanOrEqual(0);
      expect(stats.totalDirectories).toBe(0); // Since includeDirs is false by default
    });

    it('should count directories when included', async () => {
      const { files, stats } = await scanDirectoryWithStats(TEST_ROOT, {
        includeDirs: true,
      });

      expect(stats.totalDirectories).toBeGreaterThan(0);
    });
  });

  describe('scanDirectories', () => {
    it('should scan multiple directories in parallel', async () => {
      const srcPath = path.join(TEST_ROOT, 'src');
      const testsPath = path.join(TEST_ROOT, 'tests');

      const results = await scanDirectories([srcPath, testsPath]);

      expect(results.size).toBe(2);
      expect(results.has(srcPath)).toBe(true);
      expect(results.has(testsPath)).toBe(true);

      const srcFiles = results.get(srcPath)!;
      expect(srcFiles.length).toBeGreaterThan(0);
    });
  });

  describe('countFiles', () => {
    it('should count files quickly', async () => {
      const count = await countFiles(TEST_ROOT);

      expect(count).toBeGreaterThan(0);
      expect(typeof count).toBe('number');
    });
  });

  describe('Performance', () => {
    it('should scan directory in under 1 second for typical project', async () => {
      const startTime = Date.now();
      const { stats } = await scanDirectoryWithStats(TEST_ROOT);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
      expect(stats.duration).toBeLessThan(1000);
    });
  });

  describe('Symlinks', () => {
    it('should handle symlinks when followSymlinks is false', async () => {
      // Create a symlink
      const linkPath = path.join(TEST_ROOT, 'link-to-src');
      await fs.symlink(
        path.join(TEST_ROOT, 'src'),
        linkPath,
        'dir'
      );

      const files = await scanDirectory(TEST_ROOT, {
        followSymlinks: false,
      });

      // Symlink itself might or might not be included depending on fast-glob behavior
      // The important thing is it doesn't follow into src
      const linkedFiles = files.filter(f =>
        f.relativePath.startsWith('link-to-src')
      );

      // Should not traverse into symlinked directory
      expect(linkedFiles.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty directory', async () => {
      const emptyDir = path.join(TEST_ROOT, 'empty');
      await fs.mkdir(emptyDir);

      const files = await scanDirectory(emptyDir);
      expect(files.length).toBe(0);
    });

    it('should handle directory with only ignored files', async () => {
      const ignoredDir = path.join(TEST_ROOT, 'ignored');
      await fs.mkdir(ignoredDir);
      await fs.writeFile(path.join(ignoredDir, 'file.log'), 'log');

      const files = await scanDirectory(ignoredDir);
      expect(files.length).toBe(0);
    });

    it('should handle files with special characters', async () => {
      const specialName = 'file with spaces & special!.txt';
      await fs.writeFile(path.join(TEST_ROOT, specialName), 'content');

      const files = await scanDirectory(TEST_ROOT);
      const specialFile = files.find(f => f.relativePath === specialName);

      expect(specialFile).toBeDefined();
    });
  });
});

describe('Performance Benchmarks', () => {
  it('should benchmark scanning 100 files', async () => {
    // Create 100 files
    const benchDir = path.join(process.cwd(), '.test-fixtures', 'bench-100');
    await fs.mkdir(benchDir, { recursive: true });

    try {
      for (let i = 0; i < 100; i++) {
        await fs.writeFile(
          path.join(benchDir, `file-${i}.txt`),
          `Content ${i}`
        );
      }

      const startTime = Date.now();
      const files = await scanDirectory(benchDir);
      const duration = Date.now() - startTime;

      console.log(`Scanned 100 files in ${duration}ms`);
      expect(files.length).toBe(100);
      expect(duration).toBeLessThan(500);
    } finally {
      await fs.rm(benchDir, { recursive: true, force: true });
    }
  });

  it('should benchmark scanning 1000 files', async () => {
    // Create 1000 files in nested structure
    const benchDir = path.join(process.cwd(), '.test-fixtures', 'bench-1000');
    await fs.mkdir(benchDir, { recursive: true });

    try {
      for (let i = 0; i < 10; i++) {
        const subDir = path.join(benchDir, `dir-${i}`);
        await fs.mkdir(subDir);

        for (let j = 0; j < 100; j++) {
          await fs.writeFile(
            path.join(subDir, `file-${j}.txt`),
            `Content ${i}-${j}`
          );
        }
      }

      const startTime = Date.now();
      const files = await scanDirectory(benchDir);
      const duration = Date.now() - startTime;

      console.log(`Scanned 1000 files in ${duration}ms`);
      expect(files.length).toBe(1000);
      expect(duration).toBeLessThan(1000);
    } finally {
      await fs.rm(benchDir, { recursive: true, force: true });
    }
  });
});
