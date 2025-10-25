/**
 * Shadow Cache MCP Tools Tests
 *
 * Integration tests for shadow cache query tools.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createShadowCache } from '../src/shadow-cache/index.js';
import {
  createQueryFilesHandler,
  createGetFileHandler,
  createGetFileContentHandler,
} from '../src/mcp-server/tools/shadow-cache/index.js';
import { join } from 'path';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';

describe('Shadow Cache MCP Tools', () => {
  let testDir: string;
  let dbPath: string;
  let vaultPath: string;
  let shadowCache: any;
  let queryFilesHandler: any;
  let getFileHandler: any;
  let getFileContentHandler: any;

  beforeAll(async () => {
    // Create temporary test directory
    testDir = mkdtempSync(join(tmpdir(), 'weaver-test-'));
    dbPath = join(testDir, 'test-cache.db');
    vaultPath = join(testDir, 'vault');

    // Create test vault structure
    const fs = await import('fs');
    fs.mkdirSync(vaultPath, { recursive: true });
    fs.mkdirSync(join(vaultPath, 'concepts'), { recursive: true });
    fs.mkdirSync(join(vaultPath, 'technical'), { recursive: true });

    // Create test files
    writeFileSync(
      join(vaultPath, 'concepts', 'test-concept.md'),
      `---
type: concept
status: active
tags:
  - test
  - graph
---

# Test Concept

This is a test concept file.

Links: [[technical/test-tech]]
`
    );

    writeFileSync(
      join(vaultPath, 'technical', 'test-tech.md'),
      `---
type: technical
status: draft
tags:
  - test
  - implementation
---

# Test Technical

This is a test technical file.
`
    );

    // Initialize shadow cache and sync
    shadowCache = createShadowCache(dbPath, vaultPath);
    await shadowCache.syncVault();

    // Create tool handlers
    queryFilesHandler = createQueryFilesHandler(shadowCache);
    getFileHandler = createGetFileHandler(shadowCache, vaultPath);
    getFileContentHandler = createGetFileContentHandler(vaultPath);
  });

  afterAll(() => {
    // Cleanup
    if (shadowCache) {
      shadowCache.close();
    }
    if (testDir) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('query_files tool', () => {
    it('should query all files', async () => {
      const result = await queryFilesHandler({});

      expect(result.success).toBe(true);
      expect(result.data.files).toHaveLength(2);
      expect(result.data.total).toBe(2);
    });

    it('should filter by directory', async () => {
      const result = await queryFilesHandler({ directory: 'concepts' });

      expect(result.success).toBe(true);
      expect(result.data.files).toHaveLength(1);
      expect(result.data.files[0].directory).toBe('concepts');
    });

    it('should filter by type', async () => {
      const result = await queryFilesHandler({ type: 'technical' });

      expect(result.success).toBe(true);
      expect(result.data.files).toHaveLength(1);
      expect(result.data.files[0].type).toBe('technical');
    });

    it('should filter by status', async () => {
      const result = await queryFilesHandler({ status: 'active' });

      expect(result.success).toBe(true);
      expect(result.data.files).toHaveLength(1);
      expect(result.data.files[0].status).toBe('active');
    });

    it('should filter by tag', async () => {
      const result = await queryFilesHandler({ tag: 'graph' });

      expect(result.success).toBe(true);
      expect(result.data.files).toHaveLength(1);
    });

    it('should apply pagination', async () => {
      const result = await queryFilesHandler({ limit: 1, offset: 0 });

      expect(result.success).toBe(true);
      expect(result.data.files).toHaveLength(1);
      expect(result.data.hasMore).toBe(true);
    });

    it('should handle empty results', async () => {
      const result = await queryFilesHandler({ tag: 'nonexistent' });

      expect(result.success).toBe(true);
      expect(result.data.files).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });
  });

  describe('get_file tool', () => {
    it('should get file metadata', async () => {
      const result = await getFileHandler({ path: 'concepts/test-concept.md' });

      expect(result.success).toBe(true);
      expect(result.data.path).toBe('concepts/test-concept.md');
      expect(result.data.type).toBe('concept');
      expect(result.data.status).toBe('active');
      expect(result.data.tags).toContain('test');
      expect(result.data.tags).toContain('graph');
    });

    it('should include content when requested', async () => {
      const result = await getFileHandler({
        path: 'concepts/test-concept.md',
        includeContent: true,
      });

      expect(result.success).toBe(true);
      expect(result.data.content).toBeDefined();
      expect(result.data.content).toContain('Test Concept');
    });

    it('should return error for nonexistent file', async () => {
      const result = await getFileHandler({ path: 'nonexistent.md' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should validate path parameter', async () => {
      const result = await getFileHandler({ path: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('get_file_content tool', () => {
    it('should read file content', async () => {
      const result = await getFileContentHandler({
        path: 'concepts/test-concept.md',
      });

      expect(result.success).toBe(true);
      expect(result.data.content).toContain('Test Concept');
      expect(result.data.encoding).toBe('utf8');
      expect(result.data.isBinary).toBe(false);
    });

    it('should handle different encodings', async () => {
      const result = await getFileContentHandler({
        path: 'concepts/test-concept.md',
        encoding: 'base64',
      });

      expect(result.success).toBe(true);
      expect(result.data.encoding).toBe('base64');
      expect(result.data.isBinary).toBe(true);
    });

    it('should return error for nonexistent file', async () => {
      const result = await getFileContentHandler({
        path: 'nonexistent.md',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should validate path parameter', async () => {
      const result = await getFileContentHandler({ path: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });
});
