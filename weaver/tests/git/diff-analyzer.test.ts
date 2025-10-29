/**
 * Tests for Diff Analyzer
 */

import { describe, it, expect } from 'vitest';
import {
  parseDiff,
  calculateStats,
  inferCommitType,
  inferScope,
  detectBreakingChanges,
  analyzeDiff,
  type FileChange
} from '../../src/git/diff-analyzer.js';

describe('diff-analyzer', () => {
  describe('parseDiff', () => {
    it('should parse new file additions', () => {
      const diff = `diff --git a/src/new-file.ts b/src/new-file.ts
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/src/new-file.ts
@@ -0,0 +1,10 @@
+export function hello() {
+  console.log('Hello');
+}`;

      const files = parseDiff(diff);
      expect(files).toHaveLength(1);
      expect(files[0]).toMatchObject({
        path: 'src/new-file.ts',
        status: 'added',
        insertions: 3
      });
    });

    it('should parse deleted files', () => {
      const diff = `diff --git a/src/old-file.ts b/src/old-file.ts
deleted file mode 100644
index abc1234..0000000
--- a/src/old-file.ts
+++ /dev/null
@@ -1,5 +0,0 @@
-export function old() {
-  console.log('Old');
-}`;

      const files = parseDiff(diff);
      expect(files).toHaveLength(1);
      expect(files[0]).toMatchObject({
        path: 'src/old-file.ts',
        status: 'deleted',
        deletions: 3
      });
    });

    it('should parse renamed files', () => {
      const diff = `diff --git a/src/old-name.ts b/src/new-name.ts
similarity index 100%
rename from src/old-name.ts
rename to src/new-name.ts`;

      const files = parseDiff(diff);
      expect(files).toHaveLength(1);
      expect(files[0]).toMatchObject({
        path: 'src/new-name.ts',
        oldPath: 'src/old-name.ts',
        status: 'renamed'
      });
    });

    it('should parse modified files with insertions and deletions', () => {
      const diff = `diff --git a/src/file.ts b/src/file.ts
index abc1234..def5678 100644
--- a/src/file.ts
+++ b/src/file.ts
@@ -1,5 +1,8 @@
 export function test() {
-  console.log('old');
+  console.log('new');
+  console.log('added line');
 }`;

      const files = parseDiff(diff);
      expect(files).toHaveLength(1);
      expect(files[0]?.status).toBe('modified');
      expect(files[0]?.insertions).toBeGreaterThan(0);
      expect(files[0]?.deletions).toBeGreaterThan(0);
    });
  });

  describe('calculateStats', () => {
    it('should calculate total statistics', () => {
      const files: FileChange[] = [
        { path: 'file1.ts', status: 'modified', insertions: 10, deletions: 5 },
        { path: 'file2.ts', status: 'added', insertions: 20, deletions: 0 },
        { path: 'file3.ts', status: 'deleted', insertions: 0, deletions: 15 }
      ];

      const stats = calculateStats(files);
      expect(stats).toEqual({
        filesChanged: 3,
        insertions: 30,
        deletions: 20
      });
    });
  });

  describe('inferCommitType', () => {
    it('should infer "test" for test files', () => {
      const files: FileChange[] = [
        { path: 'src/utils.test.ts', status: 'modified', insertions: 5, deletions: 2 }
      ];

      expect(inferCommitType(files)).toBe('test');
    });

    it('should infer "docs" for markdown files', () => {
      const files: FileChange[] = [
        { path: 'README.md', status: 'modified', insertions: 10, deletions: 5 },
        { path: 'docs/guide.md', status: 'added', insertions: 50, deletions: 0 }
      ];

      expect(inferCommitType(files)).toBe('docs');
    });

    it('should infer "ci" for workflow files', () => {
      const files: FileChange[] = [
        { path: '.github/workflows/test.yml', status: 'modified', insertions: 3, deletions: 1 }
      ];

      expect(inferCommitType(files)).toBe('ci');
    });

    it('should infer "build" for package.json changes', () => {
      const files: FileChange[] = [
        { path: 'package.json', status: 'modified', insertions: 2, deletions: 1 }
      ];

      expect(inferCommitType(files)).toBe('build');
    });

    it('should infer "feat" for new files', () => {
      const files: FileChange[] = [
        { path: 'src/new-feature.ts', status: 'added', insertions: 100, deletions: 0 }
      ];

      expect(inferCommitType(files)).toBe('feat');
    });

    it('should infer "refactor" for large changes', () => {
      const files: FileChange[] = [
        { path: 'src/refactored.ts', status: 'modified', insertions: 150, deletions: 100 }
      ];

      expect(inferCommitType(files)).toBe('refactor');
    });

    it('should infer "fix" for small changes', () => {
      const files: FileChange[] = [
        { path: 'src/bugfix.ts', status: 'modified', insertions: 5, deletions: 3 }
      ];

      expect(inferCommitType(files)).toBe('fix');
    });
  });

  describe('inferScope', () => {
    it('should infer scope from common directory', () => {
      const files: FileChange[] = [
        { path: 'src/cli/command1.ts', status: 'modified', insertions: 5, deletions: 2 },
        { path: 'src/cli/command2.ts', status: 'modified', insertions: 10, deletions: 5 }
      ];

      expect(inferScope(files)).toBe('src');
    });

    it('should return undefined for scattered files', () => {
      const files: FileChange[] = [
        { path: 'src/file1.ts', status: 'modified', insertions: 5, deletions: 2 },
        { path: 'tests/file2.ts', status: 'modified', insertions: 10, deletions: 5 },
        { path: 'docs/file3.md', status: 'modified', insertions: 3, deletions: 1 }
      ];

      expect(inferScope(files)).toBeUndefined();
    });

    it('should clean up scope names', () => {
      const files: FileChange[] = [
        { path: 'src/my-feature/file1.ts', status: 'modified', insertions: 5, deletions: 2 },
        { path: 'src/my-feature/file2.ts', status: 'modified', insertions: 10, deletions: 5 }
      ];

      expect(inferScope(files)).toBe('src');
    });
  });

  describe('detectBreakingChanges', () => {
    it('should detect deleted files as breaking', () => {
      const files: FileChange[] = [
        { path: 'src/api.ts', status: 'deleted', insertions: 0, deletions: 50 }
      ];

      const { hasBreakingChanges, indicators } = detectBreakingChanges(files, '');
      expect(hasBreakingChanges).toBe(true);
      expect(indicators).toContain('Deleted 1 file(s)');
    });

    it('should detect renamed files as potentially breaking', () => {
      const files: FileChange[] = [
        {
          path: 'src/new-api.ts',
          oldPath: 'src/old-api.ts',
          status: 'renamed',
          insertions: 0,
          deletions: 0
        }
      ];

      const { hasBreakingChanges, indicators } = detectBreakingChanges(files, '');
      expect(hasBreakingChanges).toBe(true);
      expect(indicators).toContain('Renamed 1 file(s)');
    });

    it('should detect breaking change keywords in diff', () => {
      const files: FileChange[] = [];
      const diff = 'This is a BREAKING CHANGE: removed old API';

      const { hasBreakingChanges, indicators } = detectBreakingChanges(files, diff);
      expect(hasBreakingChanges).toBe(true);
      expect(indicators.some(i => i.includes('breaking change'))).toBe(true);
    });

    it('should not detect breaking changes in normal modifications', () => {
      const files: FileChange[] = [
        { path: 'src/file.ts', status: 'modified', insertions: 5, deletions: 3 }
      ];

      const { hasBreakingChanges } = detectBreakingChanges(files, 'normal changes');
      expect(hasBreakingChanges).toBe(false);
    });
  });

  describe('analyzeDiff', () => {
    it('should perform complete diff analysis', () => {
      const diff = `diff --git a/src/feature.ts b/src/feature.ts
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/src/feature.ts
@@ -0,0 +1,20 @@
+export function newFeature() {
+  console.log('New feature');
+}`;

      const analysis = analyzeDiff(diff);

      expect(analysis.files).toHaveLength(1);
      expect(analysis.stats.filesChanged).toBe(1);
      expect(analysis.suggestedType).toBe('feat');
      expect(analysis.hasBreakingChanges).toBe(false);
    });
  });
});
