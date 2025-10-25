/**
 * Shadow Cache Tools Unit Tests
 *
 * Comprehensive unit tests for MCP shadow cache tools:
 * - query_files: File querying with filters and pagination
 * - get_file: Get file metadata with tags and links
 * - get_file_content: Read file content with encoding detection
 *
 * Target: 90%+ code coverage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createQueryFilesHandler } from '../../src/mcp-server/tools/shadow-cache/query-files.js';
import { createGetFileHandler } from '../../src/mcp-server/tools/shadow-cache/get-file.js';
import { createGetFileContentHandler } from '../../src/mcp-server/tools/shadow-cache/get-file-content.js';
import { MockShadowCache, createMockTestData } from '../mocks/shadow-cache-mock.js';
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Create temporary test directory
const TEST_VAULT_PATH = join(tmpdir(), `weaver-test-${Date.now()}`);

describe('Shadow Cache Tools - Unit Tests', () => {
  let mockCache: MockShadowCache;

  beforeEach(() => {
    // Reset mock cache with test data
    const testData = createMockTestData();
    mockCache = new MockShadowCache(testData);

    // Create test vault directory
    mkdirSync(TEST_VAULT_PATH, { recursive: true });
    mkdirSync(join(TEST_VAULT_PATH, 'concepts'), { recursive: true });
    mkdirSync(join(TEST_VAULT_PATH, 'features'), { recursive: true });
    mkdirSync(join(TEST_VAULT_PATH, 'technical'), { recursive: true });

    // Create test files
    writeFileSync(
      join(TEST_VAULT_PATH, 'concepts/neural-networks.md'),
      '# Neural Networks\n\nTest content about neural networks.',
      'utf-8'
    );
    writeFileSync(
      join(TEST_VAULT_PATH, 'features/F-001-graph-rendering.md'),
      '# Graph Rendering\n\nFeature specification for graph rendering.',
      'utf-8'
    );
    writeFileSync(
      join(TEST_VAULT_PATH, 'technical/obsidian.md'),
      '# Obsidian Integration\n\nTechnical documentation for Obsidian.',
      'utf-8'
    );
  });

  afterEach(() => {
    // Cleanup test vault
    try {
      rmSync(TEST_VAULT_PATH, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('query_files Tool', () => {
    it('should return all files when no filters are provided', async () => {
      const handler = createQueryFilesHandler(mockCache as any);
      const result = await handler({});

      expect(result.success).toBe(true);
      expect(result.data?.files).toHaveLength(3);
      expect(result.data?.total).toBe(3);
      expect(result.data?.hasMore).toBe(false);
      expect(result.metadata?.executionTime).toBeDefined();
      expect(result.metadata?.cacheHit).toBe(true);
    });

    it('should filter files by directory', async () => {
      const handler = createQueryFilesHandler(mockCache as any);
      const result = await handler({ directory: 'concepts' });

      expect(result.success).toBe(true);
      expect(result.data?.files).toHaveLength(1);
      expect(result.data?.files[0].directory).toBe('concepts');
      expect(result.data?.files[0].path).toBe('concepts/neural-networks.md');
    });

    it('should filter files by type', async () => {
      const handler = createQueryFilesHandler(mockCache as any);
      const result = await handler({ type: 'feature' });

      expect(result.success).toBe(true);
      expect(result.data?.files).toHaveLength(1);
      expect(result.data?.files[0].type).toBe('feature');
      expect(result.data?.files[0].path).toBe('features/F-001-graph-rendering.md');
    });

    it('should filter files by status', async () => {
      const handler = createQueryFilesHandler(mockCache as any);
      const result = await handler({ status: 'active' });

      expect(result.success).toBe(true);
      expect(result.data?.files).toHaveLength(2);
      expect(result.data?.files.every((f: any) => f.status === 'active')).toBe(true);
    });

    it('should filter files by tag', async () => {
      const handler = createQueryFilesHandler(mockCache as any);
      const result = await handler({ tag: 'machine-learning' });

      expect(result.success).toBe(true);
      expect(result.data?.files).toHaveLength(1);
      expect(result.data?.files[0].path).toBe('concepts/neural-networks.md');
    });

    it('should support pagination with limit and offset', async () => {
      const handler = createQueryFilesHandler(mockCache as any);

      // First page
      const page1 = await handler({ limit: 2, offset: 0 });
      expect(page1.success).toBe(true);
      expect(page1.data?.files).toHaveLength(2);
      expect(page1.data?.hasMore).toBe(true);
      expect(page1.data?.total).toBe(3);

      // Second page
      const page2 = await handler({ limit: 2, offset: 2 });
      expect(page2.success).toBe(true);
      expect(page2.data?.files).toHaveLength(1);
      expect(page2.data?.hasMore).toBe(false);
    });

    it('should enforce maximum limit of 500', async () => {
      const handler = createQueryFilesHandler(mockCache as any);
      const result = await handler({ limit: 1000 });

      expect(result.success).toBe(true);
      expect(result.data?.limit).toBe(500);
    });

    it('should enforce minimum offset of 0', async () => {
      const handler = createQueryFilesHandler(mockCache as any);
      const result = await handler({ offset: -10 });

      expect(result.success).toBe(true);
      expect(result.data?.offset).toBe(0);
    });

    it('should parse frontmatter JSON for each file', async () => {
      const handler = createQueryFilesHandler(mockCache as any);
      const result = await handler({});

      expect(result.success).toBe(true);
      expect(result.data?.files[0].frontmatter).toBeDefined();
      expect(typeof result.data?.files[0].frontmatter).toBe('object');
      expect(result.data?.files[0].frontmatter.type).toBeDefined();
    });

    it('should combine multiple filters (directory + tag)', async () => {
      const handler = createQueryFilesHandler(mockCache as any);
      const result = await handler({
        directory: 'concepts',
        tag: 'machine-learning',
      });

      expect(result.success).toBe(true);
      expect(result.data?.files).toHaveLength(1);
      expect(result.data?.files[0].directory).toBe('concepts');
    });

    it('should combine type filter with other filters', async () => {
      const handler = createQueryFilesHandler(mockCache as any);
      const result = await handler({
        directory: 'concepts',
        type: 'concept',
      });

      expect(result.success).toBe(true);
      expect(result.data?.files).toHaveLength(1);
      expect(result.data?.files[0].type).toBe('concept');
    });

    it('should handle errors gracefully', async () => {
      // Create a mock that throws an error
      const brokenCache = {
        getAllFiles: () => {
          throw new Error('Database error');
        },
      };

      const handler = createQueryFilesHandler(brokenCache as any);
      const result = await handler({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.metadata?.executionTime).toBeDefined();
      expect(result.metadata?.cacheHit).toBe(false);
    });

    it('should return empty array when no files match filters', async () => {
      const handler = createQueryFilesHandler(mockCache as any);
      const result = await handler({ tag: 'nonexistent-tag' });

      expect(result.success).toBe(true);
      expect(result.data?.files).toHaveLength(0);
      expect(result.data?.total).toBe(0);
    });
  });

  describe('get_file Tool', () => {
    it('should return file metadata with tags and links', async () => {
      const handler = createGetFileHandler(mockCache as any, TEST_VAULT_PATH);
      const result = await handler({ path: 'concepts/neural-networks.md' });

      expect(result.success).toBe(true);
      expect(result.data?.path).toBe('concepts/neural-networks.md');
      expect(result.data?.title).toBe('Neural Networks');
      expect(result.data?.frontmatter).toBeDefined();
      expect(result.data?.tags).toBeInstanceOf(Array);
      expect(result.data?.outgoingLinks).toBeInstanceOf(Array);
      expect(result.data?.incomingLinks).toBeInstanceOf(Array);
      expect(result.metadata?.cacheHit).toBe(true);
    });

    it('should include file content when requested', async () => {
      const handler = createGetFileHandler(mockCache as any, TEST_VAULT_PATH);
      const result = await handler({
        path: 'concepts/neural-networks.md',
        includeContent: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.content).toBeDefined();
      expect(result.data?.content).toContain('Neural Networks');
    });

    it('should not include content by default', async () => {
      const handler = createGetFileHandler(mockCache as any, TEST_VAULT_PATH);
      const result = await handler({ path: 'concepts/neural-networks.md' });

      expect(result.success).toBe(true);
      expect(result.data?.content).toBeUndefined();
    });

    it('should return error for empty path', async () => {
      const handler = createGetFileHandler(mockCache as any, TEST_VAULT_PATH);
      const result = await handler({ path: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should return error for file not in cache', async () => {
      const handler = createGetFileHandler(mockCache as any, TEST_VAULT_PATH);
      const result = await handler({ path: 'nonexistent/file.md' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found in cache');
      expect(result.metadata?.cacheHit).toBe(false);
    });

    it('should handle missing file content gracefully', async () => {
      const handler = createGetFileHandler(mockCache as any, TEST_VAULT_PATH);
      const result = await handler({
        path: 'concepts/neural-networks.md',
        includeContent: true,
      });

      expect(result.success).toBe(true);
    });

    it('should parse frontmatter from JSON string', async () => {
      const handler = createGetFileHandler(mockCache as any, TEST_VAULT_PATH);
      const result = await handler({ path: 'concepts/neural-networks.md' });

      expect(result.success).toBe(true);
      expect(result.data?.frontmatter).toEqual({
        type: 'concept',
        status: 'active',
        title: 'Neural Networks',
      });
    });

    it('should format outgoing links correctly', async () => {
      const handler = createGetFileHandler(mockCache as any, TEST_VAULT_PATH);
      const result = await handler({ path: 'concepts/neural-networks.md' });

      expect(result.success).toBe(true);
      expect(result.data?.outgoingLinks).toHaveLength(1);
      expect(result.data?.outgoingLinks[0]).toHaveProperty('targetPath');
      expect(result.data?.outgoingLinks[0]).toHaveProperty('linkType');
      expect(result.data?.outgoingLinks[0]).toHaveProperty('linkText');
    });

    it('should format incoming links correctly', async () => {
      const handler = createGetFileHandler(mockCache as any, TEST_VAULT_PATH);
      const result = await handler({ path: 'technical/obsidian.md' });

      expect(result.success).toBe(true);
      expect(result.data?.incomingLinks).toHaveLength(1);
      expect(result.data?.incomingLinks[0]).toHaveProperty('sourceFileId');
      expect(result.data?.incomingLinks[0]).toHaveProperty('linkType');
    });

    it('should handle errors when accessing database', async () => {
      const brokenCache = {
        getFile: () => {
          throw new Error('Database error');
        },
      };

      const handler = createGetFileHandler(brokenCache as any, TEST_VAULT_PATH);
      const result = await handler({ path: 'concepts/neural-networks.md' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.metadata?.cacheHit).toBe(false);
    });
  });

  describe('get_file_content Tool', () => {
    it('should read UTF-8 text file content', async () => {
      const handler = createGetFileContentHandler(TEST_VAULT_PATH);
      const result = await handler({ path: 'concepts/neural-networks.md' });

      expect(result.success).toBe(true);
      expect(result.data?.content).toContain('Neural Networks');
      expect(result.data?.encoding).toBe('utf8');
      expect(result.data?.isBinary).toBe(false);
      expect(result.data?.size).toBeGreaterThan(0);
    });

    it('should explicitly use UTF-8 encoding when requested', async () => {
      const handler = createGetFileContentHandler(TEST_VAULT_PATH);
      const result = await handler({
        path: 'concepts/neural-networks.md',
        encoding: 'utf8',
      });

      expect(result.success).toBe(true);
      expect(result.data?.encoding).toBe('utf8');
      expect(result.data?.isBinary).toBe(false);
    });

    it('should use base64 encoding when requested', async () => {
      const handler = createGetFileContentHandler(TEST_VAULT_PATH);
      const result = await handler({
        path: 'concepts/neural-networks.md',
        encoding: 'base64',
      });

      expect(result.success).toBe(true);
      expect(result.data?.encoding).toBe('base64');
      expect(result.data?.isBinary).toBe(true);
      expect(result.data?.content).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('should auto-detect encoding for text files', async () => {
      const handler = createGetFileContentHandler(TEST_VAULT_PATH);
      const result = await handler({
        path: 'concepts/neural-networks.md',
        encoding: 'auto',
      });

      expect(result.success).toBe(true);
      expect(result.data?.encoding).toBe('utf8');
      expect(result.data?.isBinary).toBe(false);
    });

    it('should detect binary files and use base64', async () => {
      // Create a binary file with null bytes
      const binaryPath = join(TEST_VAULT_PATH, 'test-binary.bin');
      const binaryData = Buffer.from([0x00, 0x01, 0x02, 0xFF, 0xFE]);
      writeFileSync(binaryPath, binaryData);

      const handler = createGetFileContentHandler(TEST_VAULT_PATH);
      const result = await handler({
        path: 'test-binary.bin',
        encoding: 'auto',
      });

      expect(result.success).toBe(true);
      expect(result.data?.encoding).toBe('base64');
      expect(result.data?.isBinary).toBe(true);

      // Cleanup
      unlinkSync(binaryPath);
    });

    it('should return error for empty path', async () => {
      const handler = createGetFileContentHandler(TEST_VAULT_PATH);
      const result = await handler({ path: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should return error for nonexistent file', async () => {
      const handler = createGetFileContentHandler(TEST_VAULT_PATH);
      const result = await handler({ path: 'nonexistent/file.md' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should return file size in bytes', async () => {
      const handler = createGetFileContentHandler(TEST_VAULT_PATH);
      const result = await handler({ path: 'concepts/neural-networks.md' });

      expect(result.success).toBe(true);
      expect(result.data?.size).toBeGreaterThan(0);
      expect(typeof result.data?.size).toBe('number');
    });

    it('should include file path in response', async () => {
      const handler = createGetFileContentHandler(TEST_VAULT_PATH);
      const result = await handler({ path: 'concepts/neural-networks.md' });

      expect(result.success).toBe(true);
      expect(result.data?.path).toBe('concepts/neural-networks.md');
    });

    it('should measure execution time', async () => {
      const handler = createGetFileContentHandler(TEST_VAULT_PATH);
      const result = await handler({ path: 'concepts/neural-networks.md' });

      expect(result.success).toBe(true);
      expect(result.metadata?.executionTime).toBeDefined();
      expect(result.metadata?.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle read errors gracefully', async () => {
      const handler = createGetFileContentHandler('/nonexistent/vault');
      const result = await handler({ path: 'any-file.md' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle large files correctly', async () => {
      // Create a large file (> 8KB for binary detection)
      const largePath = join(TEST_VAULT_PATH, 'large-file.md');
      const largeContent = '# Large File\n\n' + 'Lorem ipsum '.repeat(1000);
      writeFileSync(largePath, largeContent, 'utf-8');

      const handler = createGetFileContentHandler(TEST_VAULT_PATH);
      const result = await handler({ path: 'large-file.md' });

      expect(result.success).toBe(true);
      expect(result.data?.content).toContain('Large File');
      expect(result.data?.size).toBeGreaterThan(8192);

      // Cleanup
      unlinkSync(largePath);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete query_files in under 10ms', async () => {
      const handler = createQueryFilesHandler(mockCache as any);
      const result = await handler({});

      expect(result.success).toBe(true);
      expect(result.metadata?.executionTime).toBeLessThan(10);
    });

    it('should complete get_file in under 10ms', async () => {
      const handler = createGetFileHandler(mockCache as any, TEST_VAULT_PATH);
      const result = await handler({ path: 'concepts/neural-networks.md' });

      expect(result.success).toBe(true);
      expect(result.metadata?.executionTime).toBeLessThan(10);
    });

    it('should complete get_file_content in under 50ms for small files', async () => {
      const handler = createGetFileContentHandler(TEST_VAULT_PATH);
      const result = await handler({ path: 'concepts/neural-networks.md' });

      expect(result.success).toBe(true);
      expect(result.metadata?.executionTime).toBeLessThan(50);
    });
  });
});
