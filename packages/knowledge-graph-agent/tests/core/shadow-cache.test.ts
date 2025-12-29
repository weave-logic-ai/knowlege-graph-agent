/**
 * Tests for Shadow Cache
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ShadowCache, createShadowCache, loadShadowCache } from '../../src/core/cache.js';

describe('ShadowCache', () => {
  const testRoot = join('/tmp', `kg-cache-test-${Date.now()}`);
  const testFile = 'test.md';

  beforeEach(() => {
    mkdirSync(testRoot, { recursive: true });
    writeFileSync(join(testRoot, testFile), '# Test\n\nContent');
  });

  afterEach(() => {
    rmSync(testRoot, { recursive: true, force: true });
  });

  describe('constructor', () => {
    it('should create a ShadowCache instance', () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      expect(cache).toBeInstanceOf(ShadowCache);
    });

    it('should accept custom options', () => {
      const cache = new ShadowCache({
        projectRoot: testRoot,
        cacheDir: '.custom-cache',
        defaultTTL: 30000,
        maxEntries: 100,
        persist: false,
      });
      expect(cache).toBeInstanceOf(ShadowCache);
    });
  });

  describe('load and save', () => {
    it('should load empty cache on first run', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      const result = await cache.load();
      expect(result).toBe(false); // No existing cache
    });

    it('should save and load cache', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      // Add some entries
      cache.set(testFile, {});

      // Save
      const saved = await cache.save();
      expect(saved).toBe(true);

      // Check file exists
      expect(existsSync(join(testRoot, '.kg', 'shadow-cache.json'))).toBe(true);

      // Load in new instance
      const cache2 = new ShadowCache({ projectRoot: testRoot });
      const loaded = await cache2.load();
      expect(loaded).toBe(true);

      // Verify entry exists
      expect(cache2.has(testFile)).toBe(true);
    });

    it('should skip save if not dirty', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      // Don't modify anything
      const saved = await cache.save();
      expect(saved).toBe(true); // Returns true but does nothing
    });

    it('should work with persist=false', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot, persist: false });
      await cache.load();
      cache.set(testFile, {});
      await cache.save();

      // Should not create cache file
      expect(existsSync(join(testRoot, '.kg', 'shadow-cache.json'))).toBe(false);
    });
  });

  describe('get and set', () => {
    it('should cache file metadata', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      const entry = cache.set(testFile, {});

      expect(entry.path).toBe(testFile);
      expect(entry.type).toBe('markdown');
      expect(entry.size).toBeGreaterThan(0);
      expect(entry.hash).toBeDefined();
      expect(entry.mtime).toBeGreaterThan(0);
      expect(entry.cachedAt).toBeGreaterThan(0);
    });

    it('should retrieve cached metadata', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      cache.set(testFile, {});
      const entry = cache.get(testFile);

      expect(entry).toBeDefined();
      expect(entry?.path).toBe(testFile);
    });

    it('should return undefined for non-existent entry', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      const entry = cache.get('nonexistent.md');
      expect(entry).toBeUndefined();
    });

    it('should accept pre-computed metadata', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      const entry = cache.set(testFile, {
        size: 123,
        mtime: 1234567890,
        hash: 'abcdef123456',
        type: 'typescript',
      });

      expect(entry.size).toBe(123);
      expect(entry.mtime).toBe(1234567890);
      expect(entry.hash).toBe('abcdef123456');
      expect(entry.type).toBe('typescript');
    });
  });

  describe('has and delete', () => {
    it('should check if entry exists', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      expect(cache.has(testFile)).toBe(false);
      cache.set(testFile, {});
      expect(cache.has(testFile)).toBe(true);
    });

    it('should delete entries', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      cache.set(testFile, {});
      expect(cache.has(testFile)).toBe(true);

      const deleted = cache.delete(testFile);
      expect(deleted).toBe(true);
      expect(cache.has(testFile)).toBe(false);
    });

    it('should return false when deleting non-existent entry', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      const deleted = cache.delete('nonexistent.md');
      expect(deleted).toBe(false);
    });
  });

  describe('hasChanged', () => {
    it('should return true for uncached files', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      const changed = cache.hasChanged(testFile);
      expect(changed).toBe(true); // Not in cache = changed
    });

    it('should return false for unchanged cached files', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      cache.set(testFile, {});
      const changed = cache.hasChanged(testFile);
      expect(changed).toBe(false);
    });

    it('should return true for modified files', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      cache.set(testFile, {});

      // Modify file
      writeFileSync(join(testRoot, testFile), '# Updated Content');

      const changed = cache.hasChanged(testFile);
      expect(changed).toBe(true);
    });

    it('should return true for deleted files', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      cache.set(testFile, {});
      rmSync(join(testRoot, testFile));

      const changed = cache.hasChanged(testFile);
      expect(changed).toBe(true);
    });
  });

  describe('detectChanges', () => {
    it('should detect added files', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      const changes = await cache.detectChanges([testFile]);

      expect(changes.length).toBe(1);
      expect(changes[0].path).toBe(testFile);
      expect(changes[0].change).toBe('added');
      expect(changes[0].newMeta).toBeDefined();
    });

    it('should detect unchanged files', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      cache.set(testFile, {});

      const changes = await cache.detectChanges([testFile]);

      expect(changes.length).toBe(1);
      expect(changes[0].change).toBe('unchanged');
    });

    it('should detect modified files', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      cache.set(testFile, {});

      // Modify file
      writeFileSync(join(testRoot, testFile), '# Changed Content');

      const changes = await cache.detectChanges([testFile]);

      expect(changes.length).toBe(1);
      expect(changes[0].change).toBe('modified');
      expect(changes[0].oldMeta).toBeDefined();
      expect(changes[0].newMeta).toBeDefined();
    });

    it('should detect deleted files', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      cache.set(testFile, {});

      // Delete file - detect with files not including testFile
      const changes = await cache.detectChanges([]);

      const deleted = changes.find(c => c.path === testFile);
      expect(deleted).toBeDefined();
      expect(deleted?.change).toBe('deleted');
    });
  });

  describe('applyChanges', () => {
    it('should update cache from changes', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      const changes = await cache.detectChanges([testFile]);
      cache.applyChanges(changes);

      expect(cache.has(testFile)).toBe(true);
    });

    it('should remove deleted files', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();
      cache.set(testFile, {});

      cache.applyChanges([
        { path: testFile, change: 'deleted', oldMeta: cache.get(testFile) }
      ]);

      expect(cache.has(testFile)).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      cache.set(testFile, {});
      cache.get(testFile); // Hit
      cache.get('nonexistent.md'); // Miss

      const stats = cache.getStats();

      expect(stats.totalEntries).toBe(1);
      expect(stats.hitCount).toBe(1);
      expect(stats.missCount).toBe(1);
      expect(stats.hitRate).toBe(0.5);
      expect(stats.sizeBytes).toBeGreaterThan(0);
    });
  });

  describe('clear', () => {
    it('should clear all entries', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      cache.set(testFile, {});
      expect(cache.has(testFile)).toBe(true);

      cache.clear();
      expect(cache.has(testFile)).toBe(false);
    });
  });

  describe('prune', () => {
    it('should prune stale entries', async () => {
      const cache = new ShadowCache({
        projectRoot: testRoot,
        defaultTTL: 1, // 1ms TTL
      });
      await cache.load();

      cache.set(testFile, {});

      // Wait for TTL to expire
      await new Promise(r => setTimeout(r, 10));

      const pruned = await cache.prune();
      expect(pruned).toBe(1);
      expect(cache.has(testFile)).toBe(false);
    });

    it('should prune excess entries', async () => {
      const cache = new ShadowCache({
        projectRoot: testRoot,
        maxEntries: 1,
      });
      await cache.load();

      // Add two files
      writeFileSync(join(testRoot, 'file1.md'), 'Content 1');
      writeFileSync(join(testRoot, 'file2.md'), 'Content 2');

      cache.set('file1.md', {});
      await new Promise(r => setTimeout(r, 5)); // Small delay for ordering
      cache.set('file2.md', {});

      const pruned = await cache.prune();
      expect(pruned).toBe(1);

      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(1);
    });
  });

  describe('getByType', () => {
    it('should filter entries by type', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      writeFileSync(join(testRoot, 'app.ts'), 'export const x = 1;');
      writeFileSync(join(testRoot, 'style.css'), 'body {}');

      cache.set(testFile, {});
      cache.set('app.ts', {});
      cache.set('style.css', {});

      const markdown = cache.getByType('markdown');
      expect(markdown.length).toBe(1);
      expect(markdown[0].path).toBe(testFile);

      const ts = cache.getByType('typescript');
      expect(ts.length).toBe(1);
      expect(ts[0].path).toBe('app.ts');
    });
  });

  describe('invalidate', () => {
    it('should invalidate entries by pattern', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      writeFileSync(join(testRoot, 'doc1.md'), 'Doc 1');
      writeFileSync(join(testRoot, 'doc2.md'), 'Doc 2');
      writeFileSync(join(testRoot, 'app.ts'), 'code');

      cache.set('doc1.md', {});
      cache.set('doc2.md', {});
      cache.set('app.ts', {});

      const count = cache.invalidate(/\.md$/);
      expect(count).toBe(2);

      expect(cache.has('doc1.md')).toBe(false);
      expect(cache.has('doc2.md')).toBe(false);
      expect(cache.has('app.ts')).toBe(true);
    });
  });

  describe('getAllPaths', () => {
    it('should return all cached paths', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      writeFileSync(join(testRoot, 'file1.md'), 'Content 1');
      writeFileSync(join(testRoot, 'file2.md'), 'Content 2');

      cache.set('file1.md', {});
      cache.set('file2.md', {});

      const paths = cache.getAllPaths();
      expect(paths).toContain('file1.md');
      expect(paths).toContain('file2.md');
    });
  });

  describe('file type inference', () => {
    it('should infer file types correctly', async () => {
      const cache = new ShadowCache({ projectRoot: testRoot });
      await cache.load();

      const files = [
        { name: 'readme.md', expectedType: 'markdown' },
        { name: 'app.ts', expectedType: 'typescript' },
        { name: 'app.tsx', expectedType: 'typescript' },
        { name: 'app.js', expectedType: 'javascript' },
        { name: 'app.py', expectedType: 'python' },
        { name: 'main.rs', expectedType: 'rust' },
        { name: 'main.go', expectedType: 'go' },
        { name: 'App.java', expectedType: 'java' },
        { name: 'index.php', expectedType: 'php' },
        { name: 'app.rb', expectedType: 'ruby' },
        { name: 'config.yml', expectedType: 'yaml' },
        { name: 'package.json', expectedType: 'json' },
        { name: 'Cargo.toml', expectedType: 'toml' },
        { name: 'Dockerfile', expectedType: 'docker' },
        { name: 'docker-compose.yml', expectedType: 'docker' },
        { name: '.env', expectedType: 'config' },
      ];

      for (const { name, expectedType } of files) {
        writeFileSync(join(testRoot, name), 'content');
        const entry = cache.set(name, {});
        expect(entry.type).toBe(expectedType);
      }
    });
  });

  describe('helper functions', () => {
    it('should create cache with createShadowCache', () => {
      const cache = createShadowCache({ projectRoot: testRoot });
      expect(cache).toBeInstanceOf(ShadowCache);
    });

    it('should load cache with loadShadowCache', async () => {
      const cache = await loadShadowCache(testRoot);
      expect(cache).toBeInstanceOf(ShadowCache);
    });
  });
});
