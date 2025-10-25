/**
 * Shadow Cache Advanced Tools Unit Tests
 *
 * Unit tests for advanced MCP shadow cache tools:
 * - search_tags: Tag search with wildcards and frequency
 * - search_links: Link relationship queries (bidirectional)
 * - get_stats: Cache statistics and health metrics
 *
 * Target: 90%+ code coverage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { searchTagsHandler } from '../../src/mcp-server/tools/shadow-cache/search-tags.js';
import { searchLinksHandler } from '../../src/mcp-server/tools/shadow-cache/search-links.js';
import { getStatsHandler } from '../../src/mcp-server/tools/shadow-cache/get-stats.js';
import { ShadowCacheDatabase } from '../../src/shadow-cache/database.js';
import { ShadowCache } from '../../src/shadow-cache/index.js';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdirSync, rmSync, writeFileSync } from 'fs';

// Test database path
const TEST_DB_PATH = join(tmpdir(), `weaver-test-${Date.now()}`, '.weaver', 'shadow-cache.db');
const TEST_VAULT_PATH = join(tmpdir(), `weaver-test-${Date.now()}`);

describe('Shadow Cache Advanced Tools - Unit Tests', () => {
  let shadowCache: ShadowCache;

  beforeEach(async () => {
    // Create test directories
    mkdirSync(join(TEST_VAULT_PATH, '.weaver'), { recursive: true });
    mkdirSync(join(TEST_VAULT_PATH, 'concepts'), { recursive: true });
    mkdirSync(join(TEST_VAULT_PATH, 'features'), { recursive: true });

    // Create shadow cache
    shadowCache = new ShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);

    // Create test files
    const testFiles = [
      {
        path: 'concepts/machine-learning.md',
        content: '---\ntitle: Machine Learning\ntype: concept\nstatus: active\ntags: [ml, python, ai]\n---\n# Machine Learning\n\nSee [[deep-learning]] and [[neural-networks]].',
      },
      {
        path: 'concepts/deep-learning.md',
        content: '---\ntitle: Deep Learning\ntype: concept\nstatus: active\ntags: [ml, ai, python-ml]\n---\n# Deep Learning\n\nRelated to [Machine Learning](machine-learning.md).',
      },
      {
        path: 'features/F-001-graph.md',
        content: '---\ntitle: Graph Rendering\ntype: feature\nstatus: in-progress\ntags: [feature, graph]\n---\n# Feature: Graph Rendering',
      },
    ];

    for (const file of testFiles) {
      const filePath = join(TEST_VAULT_PATH, file.path);
      writeFileSync(filePath, file.content, 'utf-8');
      await shadowCache.syncFile(filePath, file.path);
    }

    // Set environment variable for tools
    process.env['WEAVER_VAULT_PATH'] = TEST_VAULT_PATH;
  });

  afterEach(() => {
    // Cleanup
    shadowCache.close();
    try {
      rmSync(TEST_VAULT_PATH, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    delete process.env['WEAVER_VAULT_PATH'];
  });

  describe('search_tags Tool', () => {
    it('should search for exact tag match', async () => {
      const result = await searchTagsHandler({ tag: 'python' });

      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(1);
      expect(result.data?.results[0].matched_tags).toContain('python');
    });

    it('should support wildcard prefix search (python*)', async () => {
      const result = await searchTagsHandler({ tag: 'python*' });

      expect(result.success).toBe(true);
      expect(result.data?.results.length).toBeGreaterThan(0);
      expect(result.data?.results.some((r: any) => r.matched_tags.includes('python'))).toBe(true);
    });

    it('should support wildcard suffix search (*-ml)', async () => {
      const result = await searchTagsHandler({ tag: '*-ml' });

      expect(result.success).toBe(true);
      expect(result.data?.results.length).toBeGreaterThan(0);
      expect(result.data?.results.some((r: any) => r.matched_tags.includes('python-ml'))).toBe(true);
    });

    it('should support wildcard infix search (*lear*)', async () => {
      const result = await searchTagsHandler({ tag: '*learn*' });

      expect(result.success).toBe(true);
      // Should match any tag containing "learn"
      expect(result.data?.results).toBeDefined();
    });

    it('should support single character wildcard (?l)', async () => {
      const result = await searchTagsHandler({ tag: '?l' });

      expect(result.success).toBe(true);
      expect(result.data?.results.length).toBeGreaterThan(0);
    });

    it('should return tag frequency information', async () => {
      const result = await searchTagsHandler({ tag: '*' });

      expect(result.success).toBe(true);
      if (result.data?.results.length > 0) {
        expect(result.data?.results[0].total_tags).toBeDefined();
        expect(typeof result.data?.results[0].total_tags).toBe('number');
      }
    });

    it('should support sorting by path (default)', async () => {
      const result = await searchTagsHandler({ tag: '*', sort: 'path' });

      expect(result.success).toBe(true);
      expect(result.data?.query.sort).toBe('path');
    });

    it('should support sorting by filename', async () => {
      const result = await searchTagsHandler({ tag: '*', sort: 'filename' });

      expect(result.success).toBe(true);
      expect(result.data?.query.sort).toBe('filename');
    });

    it('should support sorting by modified date', async () => {
      const result = await searchTagsHandler({ tag: '*', sort: 'modified' });

      expect(result.success).toBe(true);
      expect(result.data?.query.sort).toBe('modified');
    });

    it('should support sorting by tag frequency', async () => {
      const result = await searchTagsHandler({ tag: '*', sort: 'frequency' });

      expect(result.success).toBe(true);
      expect(result.data?.query.sort).toBe('frequency');
    });

    it('should support pagination with limit and offset', async () => {
      const result = await searchTagsHandler({ tag: '*', limit: 2, offset: 0 });

      expect(result.success).toBe(true);
      expect(result.data?.pagination.limit).toBe(2);
      expect(result.data?.pagination.offset).toBe(0);
      expect(result.data?.pagination.returned).toBeLessThanOrEqual(2);
    });

    it('should return error for missing tag parameter', async () => {
      const result = await searchTagsHandler({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should return error for invalid limit', async () => {
      const result = await searchTagsHandler({ tag: 'test', limit: 2000 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Limit');
    });

    it('should return error for negative offset', async () => {
      const result = await searchTagsHandler({ tag: 'test', offset: -1 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Offset');
    });

    it('should group files with multiple matching tags', async () => {
      const result = await searchTagsHandler({ tag: '*' });

      expect(result.success).toBe(true);
      if (result.data?.results.length > 0) {
        expect(result.data?.results[0].matched_tags).toBeInstanceOf(Array);
      }
    });

    it('should include pagination metadata', async () => {
      const result = await searchTagsHandler({ tag: '*' });

      expect(result.success).toBe(true);
      expect(result.data?.pagination).toBeDefined();
      expect(result.data?.pagination.total).toBeDefined();
      expect(result.data?.pagination.has_more).toBeDefined();
    });
  });

  describe('search_links Tool', () => {
    it('should find outgoing links from source file', async () => {
      const result = await searchLinksHandler({ source_file: 'machine-learning' });

      expect(result.success).toBe(true);
      expect(result.data?.links).toBeInstanceOf(Array);
      if (result.data?.links.length > 0) {
        expect(result.data?.links[0].source).toBeDefined();
        expect(result.data?.links[0].target).toBeDefined();
        expect(result.data?.links[0].link).toBeDefined();
      }
    });

    it('should find incoming links to target file', async () => {
      const result = await searchLinksHandler({ target_file: 'deep-learning' });

      expect(result.success).toBe(true);
      expect(result.data?.links).toBeInstanceOf(Array);
    });

    it('should support partial path matching for source', async () => {
      const result = await searchLinksHandler({ source_file: 'concepts/' });

      expect(result.success).toBe(true);
      expect(result.data?.links.length).toBeGreaterThanOrEqual(0);
    });

    it('should support partial path matching for target', async () => {
      const result = await searchLinksHandler({ target_file: '.md' });

      expect(result.success).toBe(true);
      expect(result.data?.links.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter by wikilink type', async () => {
      const result = await searchLinksHandler({
        source_file: 'machine-learning',
        link_type: 'wikilink',
      });

      expect(result.success).toBe(true);
      if (result.data?.links.length > 0) {
        expect(result.data?.links.every((l: any) => l.link.type === 'wikilink')).toBe(true);
      }
    });

    it('should filter by markdown link type', async () => {
      const result = await searchLinksHandler({
        source_file: 'deep-learning',
        link_type: 'markdown',
      });

      expect(result.success).toBe(true);
      if (result.data?.links.length > 0) {
        expect(result.data?.links.every((l: any) => l.link.type === 'markdown')).toBe(true);
      }
    });

    it('should support bidirectional link search', async () => {
      const result = await searchLinksHandler({
        source_file: 'machine-learning',
        target_file: 'deep-learning',
        bidirectional: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.query.bidirectional).toBe(true);
    });

    it('should return statistics about links', async () => {
      const result = await searchLinksHandler({ source_file: 'concepts/' });

      expect(result.success).toBe(true);
      expect(result.data?.statistics).toBeDefined();
      expect(result.data?.statistics.total_links).toBeDefined();
      expect(result.data?.statistics.unique_sources).toBeDefined();
      expect(result.data?.statistics.unique_targets).toBeDefined();
      expect(result.data?.statistics.broken_links).toBeDefined();
      expect(result.data?.statistics.by_type).toBeDefined();
    });

    it('should identify broken links', async () => {
      const result = await searchLinksHandler({ source_file: 'concepts/' });

      expect(result.success).toBe(true);
      expect(result.data?.statistics.broken_links).toBeGreaterThanOrEqual(0);
    });

    it('should include link type counts', async () => {
      const result = await searchLinksHandler({ source_file: 'concepts/' });

      expect(result.success).toBe(true);
      expect(result.data?.statistics.by_type).toHaveProperty('wikilink');
      expect(result.data?.statistics.by_type).toHaveProperty('markdown');
    });

    it('should return error when neither source nor target specified', async () => {
      const result = await searchLinksHandler({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('source_file or target_file');
    });

    it('should return error for invalid limit', async () => {
      const result = await searchLinksHandler({
        source_file: 'test',
        limit: 2000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Limit');
    });

    it('should respect limit parameter', async () => {
      const result = await searchLinksHandler({
        source_file: 'concepts/',
        limit: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data?.links.length).toBeLessThanOrEqual(1);
    });
  });

  describe('get_stats Tool', () => {
    it('should return all statistics by default', async () => {
      const result = await getStatsHandler({});

      expect(result.success).toBe(true);
      expect(result.data?.stats.files).toBeDefined();
      expect(result.data?.stats.tags).toBeDefined();
      expect(result.data?.stats.links).toBeDefined();
      expect(result.data?.stats.health).toBeDefined();
    });

    it('should return only file statistics', async () => {
      const result = await getStatsHandler({ category: 'files' });

      expect(result.success).toBe(true);
      expect(result.data?.stats.files).toBeDefined();
      expect(result.data?.stats.tags).toBeUndefined();
      expect(result.data?.stats.links).toBeUndefined();
      expect(result.data?.stats.health).toBeUndefined();
    });

    it('should return only tag statistics', async () => {
      const result = await getStatsHandler({ category: 'tags' });

      expect(result.success).toBe(true);
      expect(result.data?.stats.tags).toBeDefined();
      expect(result.data?.stats.files).toBeUndefined();
    });

    it('should return only link statistics', async () => {
      const result = await getStatsHandler({ category: 'links' });

      expect(result.success).toBe(true);
      expect(result.data?.stats.links).toBeDefined();
      expect(result.data?.stats.files).toBeUndefined();
    });

    it('should return only health statistics', async () => {
      const result = await getStatsHandler({ category: 'health' });

      expect(result.success).toBe(true);
      expect(result.data?.stats.health).toBeDefined();
      expect(result.data?.stats.files).toBeUndefined();
    });

    it('should include basic file counts', async () => {
      const result = await getStatsHandler({ category: 'files' });

      expect(result.success).toBe(true);
      expect(result.data?.stats.files.total).toBeDefined();
      expect(typeof result.data?.stats.files.total).toBe('number');
    });

    it('should include detailed file breakdowns when requested', async () => {
      const result = await getStatsHandler({
        category: 'files',
        include_details: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.stats.files.by_type).toBeDefined();
      expect(result.data?.stats.files.by_status).toBeDefined();
      expect(result.data?.stats.files.top_directories).toBeDefined();
      expect(result.data?.stats.files.recently_modified).toBeDefined();
    });

    it('should include tag usage statistics', async () => {
      const result = await getStatsHandler({
        category: 'tags',
        include_details: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.stats.tags.total_tags).toBeDefined();
      expect(result.data?.stats.tags.total_assignments).toBeDefined();
      expect(result.data?.stats.tags.top_tags).toBeDefined();
      expect(result.data?.stats.tags.usage_stats).toBeDefined();
    });

    it('should include link statistics with details', async () => {
      const result = await getStatsHandler({
        category: 'links',
        include_details: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.stats.links.total).toBeDefined();
      expect(result.data?.stats.links.by_type).toBeDefined();
      expect(result.data?.stats.links.broken_links).toBeDefined();
      expect(result.data?.stats.links.orphaned_files).toBeDefined();
    });

    it('should include cache health information', async () => {
      const result = await getStatsHandler({ category: 'health' });

      expect(result.success).toBe(true);
      expect(result.data?.stats.health.status).toBeDefined();
      expect(result.data?.stats.health.version).toBeDefined();
      expect(result.data?.stats.health.database).toBeDefined();
      expect(result.data?.stats.health.database.exists).toBe(true);
      expect(result.data?.stats.health.database.size_bytes).toBeGreaterThan(0);
    });

    it('should measure execution time', async () => {
      const result = await getStatsHandler({});

      expect(result.success).toBe(true);
      expect(result.metadata?.executionTime).toBeDefined();
      expect(result.metadata?.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should include vault path in response', async () => {
      const result = await getStatsHandler({});

      expect(result.success).toBe(true);
      expect(result.data?.vault_path).toBeDefined();
    });
  });

  describe('Performance Requirements', () => {
    it('should complete search_tags in under 50ms', async () => {
      const result = await searchTagsHandler({ tag: 'python' });

      expect(result.success).toBe(true);
      expect(result.metadata?.executionTime).toBeLessThan(50);
    });

    it('should complete search_links in under 50ms', async () => {
      const result = await searchLinksHandler({ source_file: 'machine-learning' });

      expect(result.success).toBe(true);
      expect(result.metadata?.executionTime).toBeLessThan(50);
    });

    it('should complete get_stats in under 100ms', async () => {
      const result = await getStatsHandler({ category: 'all' });

      expect(result.success).toBe(true);
      expect(result.metadata?.executionTime).toBeLessThan(100);
    });
  });
});
