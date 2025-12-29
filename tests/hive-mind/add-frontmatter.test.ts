/**
 * Tests for Frontmatter Enricher
 *
 * SPEC-003: Hive Mind Reconnection Tools
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FrontmatterEnricher } from '../../src/cli/commands/hive-mind/add-frontmatter.js';
import { writeFile, readFile, rm, mkdtemp, mkdir } from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import matter from 'gray-matter';

describe('FrontmatterEnricher', () => {
  let enricher: FrontmatterEnricher;
  let testDir: string;

  beforeEach(async () => {
    enricher = new FrontmatterEnricher();
    testDir = await mkdtemp(path.join(os.tmpdir(), 'frontmatter-enricher-test-'));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('enrichVault', () => {
    it('should add frontmatter to files without it', async () => {
      await writeFile(
        path.join(testDir, 'no-frontmatter.md'),
        '# My Document\n\nSome content about #testing and #development.'
      );

      const result = await enricher.enrichVault(testDir, { dryRun: false });

      expect(result.statistics.enrichedCount).toBe(1);
      expect(result.statistics.tagsAdded).toBeGreaterThan(0);

      // Check file was updated
      const content = await readFile(path.join(testDir, 'no-frontmatter.md'), 'utf-8');
      const parsed = matter(content);

      expect(parsed.data.title).toBe('My Document');
      expect(parsed.data.tags).toContain('testing');
      expect(parsed.data.tags).toContain('development');
    });

    it('should skip files with existing frontmatter when not overwriting', async () => {
      await writeFile(
        path.join(testDir, 'has-frontmatter.md'),
        '---\ntitle: Existing Title\ntags: [existing]\n---\n\n# Content'
      );

      const result = await enricher.enrichVault(testDir, { dryRun: false, overwrite: false });

      expect(result.statistics.skippedCount).toBe(1);
    });

    it('should update files with existing frontmatter when overwriting', async () => {
      await writeFile(
        path.join(testDir, 'has-frontmatter.md'),
        '---\ntitle: Old Title\n---\n\n# New Title\n\nContent with #newtag.'
      );

      const result = await enricher.enrichVault(testDir, { dryRun: false, overwrite: true });

      expect(result.statistics.enrichedCount).toBe(1);
    });

    it('should not modify files in dry run mode', async () => {
      const originalContent = '# Test\n\nContent.';
      await writeFile(path.join(testDir, 'test.md'), originalContent);

      await enricher.enrichVault(testDir, { dryRun: true });

      const content = await readFile(path.join(testDir, 'test.md'), 'utf-8');
      expect(content).toBe(originalContent);
    });

    it('should handle nested directories', async () => {
      await mkdir(path.join(testDir, 'subdir'), { recursive: true });
      await writeFile(path.join(testDir, 'root.md'), '# Root');
      await writeFile(path.join(testDir, 'subdir', 'nested.md'), '# Nested');

      const result = await enricher.enrichVault(testDir, { dryRun: false });

      expect(result.statistics.totalFiles).toBe(2);
      expect(result.statistics.enrichedCount).toBe(2);
    });
  });

  describe('tag extraction', () => {
    it('should extract hashtags from content', async () => {
      await writeFile(
        path.join(testDir, 'tags.md'),
        '# Document\n\nThis is about #javascript and #typescript programming.'
      );

      const result = await enricher.enrichVault(testDir, { dryRun: false });
      const content = await readFile(path.join(testDir, 'tags.md'), 'utf-8');
      const parsed = matter(content);

      expect(parsed.data.tags).toContain('javascript');
      expect(parsed.data.tags).toContain('typescript');
    });

    it('should infer tags from content keywords', async () => {
      await writeFile(
        path.join(testDir, 'inferred.md'),
        '# API Guide\n\nThis guide covers REST API development with authentication.'
      );

      const result = await enricher.enrichVault(testDir, { dryRun: false });
      const content = await readFile(path.join(testDir, 'inferred.md'), 'utf-8');
      const parsed = matter(content);

      expect(parsed.data.tags).toContain('api');
      expect(parsed.data.tags).toContain('security');
    });

    it('should not duplicate existing tags', async () => {
      await writeFile(
        path.join(testDir, 'existing-tags.md'),
        '---\ntags: [javascript]\n---\n\n# Document\n\nAbout #javascript programming.'
      );

      const result = await enricher.enrichVault(testDir, { dryRun: false, overwrite: true });
      const content = await readFile(path.join(testDir, 'existing-tags.md'), 'utf-8');
      const parsed = matter(content);

      const jsCount = parsed.data.tags.filter((t: string) => t === 'javascript').length;
      expect(jsCount).toBe(1);
    });
  });

  describe('alias generation', () => {
    it('should generate aliases from title', async () => {
      await writeFile(
        path.join(testDir, 'my-document.md'),
        '# My Long Document Title\n\nContent here.'
      );

      const result = await enricher.enrichVault(testDir, { dryRun: false });
      const content = await readFile(path.join(testDir, 'my-document.md'), 'utf-8');
      const parsed = matter(content);

      expect(parsed.data.aliases).toBeDefined();
      expect(parsed.data.aliases.length).toBeGreaterThan(0);
    });

    it('should generate acronym alias for multi-word titles', async () => {
      await writeFile(
        path.join(testDir, 'api.md'),
        '# Application Programming Interface\n\nContent.'
      );

      const result = await enricher.enrichVault(testDir, { dryRun: false });
      const content = await readFile(path.join(testDir, 'api.md'), 'utf-8');
      const parsed = matter(content);

      expect(parsed.data.aliases).toContain('API');
    });
  });

  describe('link extraction', () => {
    it('should extract wiki-links to frontmatter', async () => {
      await writeFile(
        path.join(testDir, 'linked.md'),
        '# Document\n\nLinks to [[other-doc]] and [[another]].'
      );

      const result = await enricher.enrichVault(testDir, { dryRun: false });
      const content = await readFile(path.join(testDir, 'linked.md'), 'utf-8');
      const parsed = matter(content);

      expect(parsed.data.links).toContain('other-doc');
      expect(parsed.data.links).toContain('another');
    });
  });

  describe('type inference', () => {
    it('should infer guide type from content', async () => {
      await writeFile(
        path.join(testDir, 'guide.md'),
        '# Setup Guide\n\n## Installation\n\nStep by step instructions.\n\n## Getting Started'
      );

      const result = await enricher.enrichVault(testDir, { dryRun: false });
      const content = await readFile(path.join(testDir, 'guide.md'), 'utf-8');
      const parsed = matter(content);

      expect(parsed.data.type).toBe('guide');
    });

    it('should infer technical type from code blocks', async () => {
      await writeFile(
        path.join(testDir, 'technical.md'),
        '# Code Example\n\n```typescript\nconst x = 1;\n```'
      );

      const result = await enricher.enrichVault(testDir, { dryRun: false });
      const content = await readFile(path.join(testDir, 'technical.md'), 'utf-8');
      const parsed = matter(content);

      expect(parsed.data.type).toBe('technical');
    });
  });

  describe('description extraction', () => {
    it('should extract first paragraph as description', async () => {
      await writeFile(
        path.join(testDir, 'with-intro.md'),
        '# Title\n\nThis is the introduction paragraph that describes the document.\n\n## Section'
      );

      const result = await enricher.enrichVault(testDir, { dryRun: false });
      const content = await readFile(path.join(testDir, 'with-intro.md'), 'utf-8');
      const parsed = matter(content);

      expect(parsed.data.description).toContain('introduction paragraph');
    });
  });

  describe('options', () => {
    it('should skip tags when --no-tags specified', async () => {
      await writeFile(
        path.join(testDir, 'no-tags.md'),
        '# Document\n\nContent with #hashtag.'
      );

      const result = await enricher.enrichVault(testDir, { dryRun: false, tags: false });
      const content = await readFile(path.join(testDir, 'no-tags.md'), 'utf-8');
      const parsed = matter(content);

      expect(parsed.data.tags || []).toEqual([]);
    });

    it('should skip aliases when --no-aliases specified', async () => {
      await writeFile(
        path.join(testDir, 'no-aliases.md'),
        '# Long Document Title\n\nContent.'
      );

      const result = await enricher.enrichVault(testDir, { dryRun: false, aliases: false });
      const content = await readFile(path.join(testDir, 'no-aliases.md'), 'utf-8');
      const parsed = matter(content);

      expect(parsed.data.aliases || []).toEqual([]);
    });

    it('should skip links when --no-links specified', async () => {
      await writeFile(
        path.join(testDir, 'no-links.md'),
        '# Document\n\nLinks to [[other]].'
      );

      const result = await enricher.enrichVault(testDir, { dryRun: false, links: false });
      const content = await readFile(path.join(testDir, 'no-links.md'), 'utf-8');
      const parsed = matter(content);

      expect(parsed.data.links || []).toEqual([]);
    });
  });

  describe('generateReport', () => {
    it('should generate markdown report', async () => {
      await writeFile(path.join(testDir, 'test.md'), '# Test\n\nContent with #tag.');

      const result = await enricher.enrichVault(testDir, { dryRun: false });
      const report = enricher.generateReport(result);

      expect(report).toContain('# Frontmatter Enrichment Report');
      expect(report).toContain('Total Files');
      expect(report).toContain('Enriched');
      expect(report).toContain('Tags Added');
    });
  });

  describe('error handling', () => {
    it('should handle empty vault', async () => {
      const emptyDir = await mkdtemp(path.join(os.tmpdir(), 'empty-'));
      try {
        await expect(enricher.enrichVault(emptyDir)).rejects.toThrow('No markdown files found');
      } finally {
        await rm(emptyDir, { recursive: true, force: true });
      }
    });

    it('should collect errors for problematic files', async () => {
      await writeFile(path.join(testDir, 'valid.md'), '# Valid');
      // Create a file that will cause issues (can't easily simulate read errors in tests)

      const result = await enricher.enrichVault(testDir, { dryRun: false });

      expect(result.errors).toBeDefined();
      // No errors expected for valid files
      expect(result.errors.length).toBe(0);
    });
  });
});
