/**
 * Shadow Cache Integration Tests
 *
 * Integration tests for Shadow Cache MCP tools against real vault data.
 * Tests against actual /home/aepod/dev/weave-nn/weave-nn vault.
 *
 * Tests:
 * - Real database queries with actual vault data
 * - Query performance (<10ms target)
 * - Response format validation
 * - Error handling with real scenarios
 * - End-to-end tool execution
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ShadowCache } from '../../src/shadow-cache/index.js';
import { createQueryFilesHandler } from '../../src/mcp-server/tools/shadow-cache/query-files.js';
import { createGetFileHandler } from '../../src/mcp-server/tools/shadow-cache/get-file.js';
import { createGetFileContentHandler } from '../../src/mcp-server/tools/shadow-cache/get-file-content.js';
import { searchTagsHandler } from '../../src/mcp-server/tools/shadow-cache/search-tags.js';
import { searchLinksHandler } from '../../src/mcp-server/tools/shadow-cache/search-links.js';
import { getStatsHandler } from '../../src/mcp-server/tools/shadow-cache/get-stats.js';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';

// Real vault path
const VAULT_PATH = '/home/aepod/dev/weave-nn/weave-nn';
const TEST_DB_PATH = join(tmpdir(), `weaver-integration-test-${Date.now()}`, '.weaver', 'shadow-cache.db');

describe('Shadow Cache Integration Tests', () => {
  let shadowCache: ShadowCache;

  beforeAll(async () => {
    // Skip tests if vault doesn't exist
    if (!existsSync(VAULT_PATH)) {
      console.warn(`Skipping integration tests: Vault not found at ${VAULT_PATH}`);
      return;
    }

    // Create test database directory
    const dbDir = join(tmpdir(), `weaver-integration-test-${Date.now()}`, '.weaver');
    mkdirSync(dbDir, { recursive: true });

    // Initialize shadow cache with real vault
    shadowCache = new ShadowCache(TEST_DB_PATH, VAULT_PATH);

    // Sync vault (this may take a few seconds)
    console.log('Syncing vault for integration tests...');
    await shadowCache.syncVault();
    console.log('Vault sync complete');

    // Set environment variable for handlers
    process.env['WEAVER_VAULT_PATH'] = VAULT_PATH;
  }, 60000); // 60 second timeout for vault sync

  afterAll(() => {
    if (shadowCache) {
      shadowCache.close();
    }
    delete process.env['WEAVER_VAULT_PATH'];
  });

  describe('query_files Integration', () => {
    it('should query real vault files', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const handler = createQueryFilesHandler(shadowCache);
      const result = await handler({ limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data?.files).toBeInstanceOf(Array);
      expect(result.data?.total).toBeGreaterThan(0);
      expect(result.metadata?.executionTime).toBeLessThan(10);
    });

    it('should filter by directory', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const handler = createQueryFilesHandler(shadowCache);
      const result = await handler({ directory: 'concepts', limit: 5 });

      expect(result.success).toBe(true);
      if (result.data?.files.length > 0) {
        expect(result.data?.files.every((f: any) => f.directory === 'concepts')).toBe(true);
      }
    });

    it('should filter by type', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const handler = createQueryFilesHandler(shadowCache);
      const result = await handler({ type: 'concept', limit: 5 });

      expect(result.success).toBe(true);
      if (result.data?.files.length > 0) {
        expect(result.data?.files.every((f: any) => f.type === 'concept')).toBe(true);
      }
    });

    it('should validate response format', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const handler = createQueryFilesHandler(shadowCache);
      const result = await handler({ limit: 1 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('files');
      expect(result.data).toHaveProperty('total');
      expect(result.data).toHaveProperty('limit');
      expect(result.data).toHaveProperty('offset');
      expect(result.data).toHaveProperty('hasMore');
      expect(result.metadata).toHaveProperty('executionTime');
      expect(result.metadata).toHaveProperty('cacheHit');
    });
  });

  describe('get_file Integration', () => {
    it('should retrieve real file metadata', async () => {
      if (!existsSync(VAULT_PATH)) return;

      // Get first file from cache
      const allFiles = shadowCache.getAllFiles();
      if (allFiles.length === 0) return;

      const testFile = allFiles[0];
      const handler = createGetFileHandler(shadowCache, VAULT_PATH);
      const result = await handler({ path: testFile.path });

      expect(result.success).toBe(true);
      expect(result.data?.path).toBe(testFile.path);
      expect(result.data?.tags).toBeInstanceOf(Array);
      expect(result.data?.outgoingLinks).toBeInstanceOf(Array);
      expect(result.data?.incomingLinks).toBeInstanceOf(Array);
      expect(result.metadata?.executionTime).toBeLessThan(10);
    });

    it('should retrieve file with content', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const allFiles = shadowCache.getAllFiles();
      if (allFiles.length === 0) return;

      const testFile = allFiles[0];
      const handler = createGetFileHandler(shadowCache, VAULT_PATH);
      const result = await handler({ path: testFile.path, includeContent: true });

      expect(result.success).toBe(true);
      expect(result.data?.content).toBeDefined();
      expect(typeof result.data?.content).toBe('string');
      expect(result.data?.content.length).toBeGreaterThan(0);
    });

    it('should validate response format', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const allFiles = shadowCache.getAllFiles();
      if (allFiles.length === 0) return;

      const testFile = allFiles[0];
      const handler = createGetFileHandler(shadowCache, VAULT_PATH);
      const result = await handler({ path: testFile.path });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('path');
      expect(result.data).toHaveProperty('filename');
      expect(result.data).toHaveProperty('title');
      expect(result.data).toHaveProperty('tags');
      expect(result.data).toHaveProperty('outgoingLinks');
      expect(result.data).toHaveProperty('incomingLinks');
    });
  });

  describe('get_file_content Integration', () => {
    it('should read real file content', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const allFiles = shadowCache.getAllFiles();
      if (allFiles.length === 0) return;

      const testFile = allFiles[0];
      const handler = createGetFileContentHandler(VAULT_PATH);
      const result = await handler({ path: testFile.path });

      expect(result.success).toBe(true);
      expect(result.data?.content).toBeDefined();
      expect(result.data?.encoding).toBe('utf8');
      expect(result.data?.size).toBeGreaterThan(0);
    });

    it('should validate response format', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const allFiles = shadowCache.getAllFiles();
      if (allFiles.length === 0) return;

      const testFile = allFiles[0];
      const handler = createGetFileContentHandler(VAULT_PATH);
      const result = await handler({ path: testFile.path });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('path');
      expect(result.data).toHaveProperty('content');
      expect(result.data).toHaveProperty('encoding');
      expect(result.data).toHaveProperty('isBinary');
      expect(result.data).toHaveProperty('size');
    });
  });

  describe('search_tags Integration', () => {
    it('should search real vault tags', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const result = await searchTagsHandler({ tag: '*', limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data?.results).toBeInstanceOf(Array);
      expect(result.metadata?.executionTime).toBeLessThan(50);
    });

    it('should validate response format', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const result = await searchTagsHandler({ tag: 'concept*', limit: 5 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('query');
      expect(result.data).toHaveProperty('results');
      expect(result.data).toHaveProperty('pagination');
      expect(result.data?.pagination).toHaveProperty('total');
      expect(result.data?.pagination).toHaveProperty('has_more');
    });
  });

  describe('search_links Integration', () => {
    it('should search real vault links', async () => {
      if (!existsSync(VAULT_PATH)) return;

      // Get a file with outgoing links
      const allFiles = shadowCache.getAllFiles();
      if (allFiles.length === 0) return;

      const result = await searchLinksHandler({ source_file: allFiles[0].path, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data?.links).toBeInstanceOf(Array);
      expect(result.data?.statistics).toBeDefined();
      expect(result.metadata?.executionTime).toBeLessThan(50);
    });

    it('should validate response format', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const result = await searchLinksHandler({ source_file: 'concepts/', limit: 5 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('query');
      expect(result.data).toHaveProperty('links');
      expect(result.data).toHaveProperty('statistics');
      expect(result.data?.statistics).toHaveProperty('total_links');
      expect(result.data?.statistics).toHaveProperty('broken_links');
      expect(result.data?.statistics).toHaveProperty('by_type');
    });
  });

  describe('get_stats Integration', () => {
    it('should retrieve real cache statistics', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const result = await getStatsHandler({ category: 'all' });

      expect(result.success).toBe(true);
      expect(result.data?.stats.files).toBeDefined();
      expect(result.data?.stats.tags).toBeDefined();
      expect(result.data?.stats.links).toBeDefined();
      expect(result.data?.stats.health).toBeDefined();
      expect(result.metadata?.executionTime).toBeLessThan(100);
    });

    it('should validate response format', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const result = await getStatsHandler({ category: 'all', include_details: true });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('category');
      expect(result.data).toHaveProperty('vault_path');
      expect(result.data).toHaveProperty('stats');
      expect(result.data?.stats.files).toHaveProperty('total');
      expect(result.data?.stats.tags).toHaveProperty('total_tags');
      expect(result.data?.stats.links).toHaveProperty('total');
      expect(result.data?.stats.health).toHaveProperty('status');
    });

    it('should report healthy cache', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const result = await getStatsHandler({ category: 'health' });

      expect(result.success).toBe(true);
      expect(result.data?.stats.health.status).toMatch(/healthy|warning/);
      expect(result.data?.stats.health.database.exists).toBe(true);
      expect(result.data?.stats.health.database.size_bytes).toBeGreaterThan(0);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle nonexistent file gracefully', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const handler = createGetFileHandler(shadowCache, VAULT_PATH);
      const result = await handler({ path: 'nonexistent/file.md' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle invalid directory filter', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const handler = createQueryFilesHandler(shadowCache);
      const result = await handler({ directory: 'nonexistent-dir' });

      expect(result.success).toBe(true);
      expect(result.data?.files).toHaveLength(0);
    });

    it('should handle missing file content', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const handler = createGetFileContentHandler(VAULT_PATH);
      const result = await handler({ path: 'totally-fake-file.md' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete 10 sequential queries in under 100ms', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const handler = createQueryFilesHandler(shadowCache);
      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        await handler({ limit: 10, offset: i * 10 });
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(100);
    });

    it('should complete 5 file retrievals in under 50ms', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const allFiles = shadowCache.getAllFiles().slice(0, 5);
      if (allFiles.length === 0) return;

      const handler = createGetFileHandler(shadowCache, VAULT_PATH);
      const startTime = Date.now();

      for (const file of allFiles) {
        await handler({ path: file.path });
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(50);
    });

    it('should handle large result sets efficiently', async () => {
      if (!existsSync(VAULT_PATH)) return;

      const handler = createQueryFilesHandler(shadowCache);
      const result = await handler({ limit: 500 });

      expect(result.success).toBe(true);
      expect(result.metadata?.executionTime).toBeLessThan(20);
    });
  });
});
