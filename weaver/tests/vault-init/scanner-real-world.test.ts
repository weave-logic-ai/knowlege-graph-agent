/**
 * Real-world tests for directory scanner
 * Tests against actual weaver project structure
 */

import { describe, it, expect } from 'vitest';
import path from 'node:path';
import {
  scanDirectory,
  scanDirectoryWithStats,
  countFiles,
} from '../../src/vault-init/scanner/directory-scanner.js';

// Use the actual weaver project directory
const WEAVER_ROOT = path.resolve(process.cwd());

describe('Directory Scanner - Real World Tests', () => {
  describe('Weaver Project Scan', () => {
    it('should scan weaver project efficiently', async () => {
      const startTime = Date.now();
      const { files, stats } = await scanDirectoryWithStats(WEAVER_ROOT, {
        respectGitignore: true,
      });
      const duration = Date.now() - startTime;

      console.log('\n📊 Weaver Project Scan Results:');
      console.log(`  Files: ${stats.totalFiles}`);
      console.log(`  Directories: ${stats.totalDirectories}`);
      console.log(`  Total Size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Duration: ${stats.duration}ms`);
      console.log(`  Real Duration: ${duration}ms`);

      expect(files.length).toBeGreaterThan(0);
      expect(stats.totalFiles).toBeGreaterThan(0);
      expect(stats.duration).toBeLessThan(5000); // Should be fast even for large projects
    });

    it('should respect .gitignore in weaver project', async () => {
      const files = await scanDirectory(WEAVER_ROOT, {
        respectGitignore: true,
      });

      // Should not include node_modules
      const nodeModules = files.filter(f =>
        f.relativePath.includes('node_modules')
      );
      expect(nodeModules.length).toBe(0);

      // Should not include dist
      const dist = files.filter(f =>
        f.relativePath.startsWith('dist/')
      );
      expect(dist.length).toBe(0);

      // Should include source files
      const sourceFiles = files.filter(f =>
        f.relativePath.startsWith('src/') && f.relativePath.endsWith('.ts')
      );
      expect(sourceFiles.length).toBeGreaterThan(0);
    });

    it('should find TypeScript files', async () => {
      const files = await scanDirectory(WEAVER_ROOT);

      const tsFiles = files.filter(f => f.relativePath.endsWith('.ts'));
      const testFiles = files.filter(f => f.relativePath.includes('.test.ts'));

      console.log(`\n📄 TypeScript Files: ${tsFiles.length}`);
      console.log(`🧪 Test Files: ${testFiles.length}`);

      expect(tsFiles.length).toBeGreaterThan(0);
      expect(testFiles.length).toBeGreaterThan(0);
    });

    it('should handle deep directory structures', async () => {
      const files = await scanDirectory(WEAVER_ROOT, {
        includeDirs: true,
      });

      const directories = files.filter(f => f.type === 'directory');
      const maxDepth = Math.max(
        ...files.map(f => f.relativePath.split(path.sep).length)
      );

      console.log(`\n📁 Directories: ${directories.length}`);
      console.log(`📏 Max Depth: ${maxDepth}`);

      expect(directories.length).toBeGreaterThan(0);
      expect(maxDepth).toBeGreaterThan(1);
    });

    it('should count files quickly', async () => {
      const startTime = Date.now();
      const count = await countFiles(WEAVER_ROOT);
      const duration = Date.now() - startTime;

      console.log(`\n⚡ Fast Count: ${count} files in ${duration}ms`);

      expect(count).toBeGreaterThan(0);
      expect(duration).toBeLessThan(2000);
    });

    it('should scan src directory only', async () => {
      const srcPath = path.join(WEAVER_ROOT, 'src');
      const { files, stats } = await scanDirectoryWithStats(srcPath);

      console.log(`\n📂 Src Directory:`);
      console.log(`  Files: ${stats.totalFiles}`);
      console.log(`  Size: ${(stats.totalSize / 1024).toFixed(2)} KB`);

      // All files should be under src
      const allUnderSrc = files.every(f => !f.relativePath.includes('..'));
      expect(allUnderSrc).toBe(true);
    });

    it('should provide file metadata', async () => {
      const files = await scanDirectory(WEAVER_ROOT);

      const filesWithSize = files.filter(f => f.size !== undefined);
      const filesWithDate = files.filter(f => f.modified !== undefined);

      expect(filesWithSize.length).toBeGreaterThan(0);
      expect(filesWithDate.length).toBeGreaterThan(0);

      // Check a specific file
      const pkgJson = files.find(f => f.relativePath === 'package.json');
      if (pkgJson) {
        expect(pkgJson.size).toBeGreaterThan(0);
        expect(pkgJson.modified).toBeInstanceOf(Date);
      }
    });
  });

  describe('Performance Benchmarks', () => {
    it('should handle multiple scans efficiently', async () => {
      const iterations = 5;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await scanDirectory(WEAVER_ROOT);
        durations.push(Date.now() - startTime);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / iterations;
      console.log(`\n⚡ Average scan time over ${iterations} runs: ${avgDuration.toFixed(2)}ms`);

      expect(avgDuration).toBeLessThan(5000);
    });
  });
});
