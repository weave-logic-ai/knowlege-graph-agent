/**
 * Tests for Link Analyzer
 *
 * SPEC-003: Hive Mind Reconnection Tools
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LinkAnalyzer } from '../../src/cli/commands/hive-mind/analyze-links.js';
import { writeFile, rm, mkdtemp, mkdir } from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('LinkAnalyzer', () => {
  let analyzer: LinkAnalyzer;
  let testDir: string;

  beforeEach(async () => {
    analyzer = new LinkAnalyzer();
    // Create a temp directory for test files
    testDir = await mkdtemp(path.join(os.tmpdir(), 'link-analyzer-test-'));
  });

  afterEach(async () => {
    // Clean up temp directory
    await rm(testDir, { recursive: true, force: true });
  });

  describe('parseWikiLinks', () => {
    it('should parse simple wiki-links', () => {
      const content = 'This links to [[document-one]] and [[document-two]].';
      const links = analyzer.parseWikiLinks(content);
      expect(links).toEqual(['document-one', 'document-two']);
    });

    it('should parse wiki-links with aliases', () => {
      const content = 'See [[actual-doc|Display Name]] for more.';
      const links = analyzer.parseWikiLinks(content);
      expect(links).toEqual(['actual-doc']);
    });

    it('should parse wiki-links with headings', () => {
      const content = 'Jump to [[document#heading]] section.';
      const links = analyzer.parseWikiLinks(content);
      expect(links).toEqual(['document']);
    });

    it('should parse wiki-links with folders', () => {
      const content = 'See [[folder/subfolder/document]] for details.';
      const links = analyzer.parseWikiLinks(content);
      expect(links).toEqual(['folder/subfolder/document']);
    });

    it('should handle empty content', () => {
      const links = analyzer.parseWikiLinks('');
      expect(links).toEqual([]);
    });

    it('should not match malformed wiki-links', () => {
      const content = 'This is not a link: [[]]';
      const links = analyzer.parseWikiLinks(content);
      expect(links).toEqual([]);
    });
  });

  describe('parseMarkdownLinks', () => {
    it('should parse simple markdown links', () => {
      const content = 'Click [here](document.md) for more.';
      const links = analyzer.parseMarkdownLinks(content);
      expect(links).toEqual(['document.md']);
    });

    it('should parse relative path links', () => {
      const content = 'See [doc](./relative/path.md) and [other](../parent/doc.md).';
      const links = analyzer.parseMarkdownLinks(content);
      expect(links).toEqual(['./relative/path.md', '../parent/doc.md']);
    });

    it('should skip external links', () => {
      const content = 'Visit [Google](https://google.com) and [local](doc.md).';
      const links = analyzer.parseMarkdownLinks(content);
      expect(links).toEqual(['doc.md']);
    });

    it('should skip image links', () => {
      const content = '![alt text](image.png) and [link](doc.md)';
      const links = analyzer.parseMarkdownLinks(content);
      expect(links).toEqual(['doc.md']);
    });

    it('should skip anchor links', () => {
      const content = 'Jump to [section](#heading) and [doc](file.md).';
      const links = analyzer.parseMarkdownLinks(content);
      expect(links).toEqual(['file.md']);
    });
  });

  describe('analyzeVault', () => {
    it('should analyze a simple vault with links', async () => {
      // Create test files
      await writeFile(
        path.join(testDir, 'doc-a.md'),
        '# Doc A\n\nLinks to [[doc-b]] and [[doc-c]].'
      );
      await writeFile(
        path.join(testDir, 'doc-b.md'),
        '# Doc B\n\nLinks back to [[doc-a]].'
      );
      await writeFile(
        path.join(testDir, 'doc-c.md'),
        '# Doc C\n\nNo outgoing links.'
      );
      await writeFile(
        path.join(testDir, 'orphan.md'),
        '# Orphan\n\nNo links at all.'
      );

      const result = await analyzer.analyzeVault(testDir);

      expect(result.totalFiles).toBe(4);
      expect(result.filesWithLinks).toBe(3);
      expect(result.orphanFiles).toContain('orphan.md');
      expect(result.orphanRate).toBeGreaterThan(0);
      expect(result.statistics.wikiLinks).toBe(3);
    });

    it('should detect broken links', async () => {
      await writeFile(
        path.join(testDir, 'doc.md'),
        '# Doc\n\nLinks to [[nonexistent]] and [[also-missing]].'
      );

      const result = await analyzer.analyzeVault(testDir);

      expect(result.brokenLinks.length).toBe(2);
      expect(result.brokenLinks[0].target).toBe('nonexistent');
      expect(result.brokenLinks[1].target).toBe('also-missing');
    });

    it('should handle nested directories', async () => {
      await mkdir(path.join(testDir, 'subdir'), { recursive: true });
      await writeFile(
        path.join(testDir, 'root.md'),
        '# Root\n\nLinks to [[subdir/nested]].'
      );
      await writeFile(
        path.join(testDir, 'subdir', 'nested.md'),
        '# Nested\n\nLinks to [[root]].'
      );

      const result = await analyzer.analyzeVault(testDir);

      expect(result.totalFiles).toBe(2);
      expect(result.orphanFiles.length).toBe(0);
      expect(result.brokenLinks.length).toBe(0);
    });

    it('should throw error for non-existent path', async () => {
      await expect(analyzer.analyzeVault('/nonexistent/path')).rejects.toThrow();
    });

    it('should throw error for empty vault', async () => {
      const emptyDir = await mkdtemp(path.join(os.tmpdir(), 'empty-'));
      try {
        await expect(analyzer.analyzeVault(emptyDir)).rejects.toThrow('No markdown files found');
      } finally {
        await rm(emptyDir, { recursive: true, force: true });
      }
    });
  });

  describe('cluster detection', () => {
    it('should detect isolated clusters', async () => {
      // Create two separate clusters
      // Cluster 1: a <-> b
      await writeFile(path.join(testDir, 'cluster1-a.md'), '[[cluster1-b]]');
      await writeFile(path.join(testDir, 'cluster1-b.md'), '[[cluster1-a]]');

      // Cluster 2: c <-> d
      await writeFile(path.join(testDir, 'cluster2-c.md'), '[[cluster2-d]]');
      await writeFile(path.join(testDir, 'cluster2-d.md'), '[[cluster2-c]]');

      // Orphan (its own cluster)
      await writeFile(path.join(testDir, 'orphan.md'), 'No links');

      const result = await analyzer.analyzeVault(testDir);

      // Should have 3 clusters: cluster1, cluster2, orphan
      expect(result.statistics.isolatedClusters).toBe(3);
    });
  });

  describe('generateReport', () => {
    it('should generate a markdown report', async () => {
      await writeFile(path.join(testDir, 'doc.md'), '# Doc\n\nLinks to [[other]].');
      await writeFile(path.join(testDir, 'other.md'), '# Other');

      const result = await analyzer.analyzeVault(testDir);
      const report = analyzer.generateReport(result);

      expect(report).toContain('# Link Analysis Report');
      expect(report).toContain('Total Files');
      expect(report).toContain('Orphan Rate');
      expect(report).toContain('Link Density');
    });
  });
});
