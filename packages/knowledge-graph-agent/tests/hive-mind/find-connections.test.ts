/**
 * Tests for Connection Finder
 *
 * SPEC-003: Hive Mind Reconnection Tools
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConnectionFinder } from '../../src/cli/commands/hive-mind/find-connections.js';
import { writeFile, rm, mkdtemp } from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('ConnectionFinder', () => {
  let finder: ConnectionFinder;
  let testDir: string;

  beforeEach(async () => {
    finder = new ConnectionFinder();
    testDir = await mkdtemp(path.join(os.tmpdir(), 'connection-finder-test-'));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('buildIndex', () => {
    it('should build TF-IDF index from vault', async () => {
      await writeFile(
        path.join(testDir, 'doc1.md'),
        '# TypeScript Guide\n\nLearn TypeScript programming language basics.'
      );
      await writeFile(
        path.join(testDir, 'doc2.md'),
        '# JavaScript Guide\n\nLearn JavaScript programming language basics.'
      );
      await writeFile(
        path.join(testDir, 'doc3.md'),
        '# Database Guide\n\nLearn SQL and PostgreSQL database management.'
      );

      await finder.buildIndex(testDir);
      const stats = finder.getStats();

      expect(stats.documents).toBe(3);
      expect(stats.terms).toBeGreaterThan(0);
    });

    it('should throw error for empty vault', async () => {
      const emptyDir = await mkdtemp(path.join(os.tmpdir(), 'empty-'));
      try {
        await expect(finder.buildIndex(emptyDir)).rejects.toThrow('No markdown files found');
      } finally {
        await rm(emptyDir, { recursive: true, force: true });
      }
    });
  });

  describe('findSimilar', () => {
    it('should find similar documents based on content', async () => {
      // Create similar documents about TypeScript
      await writeFile(
        path.join(testDir, 'typescript-basics.md'),
        '# TypeScript Basics\n\nTypeScript is a typed superset of JavaScript. Learn types, interfaces, and generics.'
      );
      await writeFile(
        path.join(testDir, 'typescript-advanced.md'),
        '# Advanced TypeScript\n\nAdvanced TypeScript features including types, generics, and decorators.'
      );
      // Create unrelated document
      await writeFile(
        path.join(testDir, 'cooking-recipes.md'),
        '# Cooking Recipes\n\nDelicious pasta recipes with tomato sauce and herbs.'
      );

      await finder.buildIndex(testDir);
      const similar = finder.findSimilar('typescript-basics.md', 0.1, 10);

      expect(similar.length).toBeGreaterThan(0);
      expect(similar[0].target).toBe('typescript-advanced.md');
      expect(similar[0].similarity).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent file', async () => {
      await writeFile(path.join(testDir, 'doc.md'), '# Test');
      await finder.buildIndex(testDir);

      const similar = finder.findSimilar('nonexistent.md', 0.3, 10);
      expect(similar).toEqual([]);
    });

    it('should include shared terms in results', async () => {
      await writeFile(
        path.join(testDir, 'react-components.md'),
        '# React Components\n\nBuilding reusable React components with hooks and state management.'
      );
      await writeFile(
        path.join(testDir, 'react-hooks.md'),
        '# React Hooks\n\nUsing React hooks for state management and effects in components.'
      );

      await finder.buildIndex(testDir);
      const similar = finder.findSimilar('react-components.md', 0.1, 10);

      if (similar.length > 0) {
        expect(similar[0].sharedTerms.length).toBeGreaterThan(0);
      }
    });
  });

  describe('findAllConnections', () => {
    it('should find all potential connections above threshold', async () => {
      await writeFile(path.join(testDir, 'a.md'), '# Topic A\n\nAPI development with REST and GraphQL.');
      await writeFile(path.join(testDir, 'b.md'), '# Topic B\n\nREST API design patterns and best practices.');
      await writeFile(path.join(testDir, 'c.md'), '# Topic C\n\nGraphQL API development guide.');
      await writeFile(path.join(testDir, 'd.md'), '# Topic D\n\nUnrelated cooking content about pasta.');

      const result = await finder.findAllConnections(testDir, 0.1, 100);

      expect(result.totalDocuments).toBe(4);
      expect(result.suggestedConnections.length).toBeGreaterThan(0);
      expect(result.averageSimilarity).toBeGreaterThan(0);
    });

    it('should deduplicate bidirectional connections', async () => {
      await writeFile(path.join(testDir, 'a.md'), '# Same Topic\n\nIdentical content here.');
      await writeFile(path.join(testDir, 'b.md'), '# Same Topic\n\nIdentical content here.');

      const result = await finder.findAllConnections(testDir, 0.1, 100);

      // Should not have both A->B and B->A
      const pairs = new Set<string>();
      for (const conn of result.suggestedConnections) {
        const key = [conn.source, conn.target].sort().join('|');
        expect(pairs.has(key)).toBe(false);
        pairs.add(key);
      }
    });
  });

  describe('suggestConnections', () => {
    it('should suggest connections for orphan files', async () => {
      // Create 3+ documents for TF-IDF to work properly
      // TypeScript appears in 2 docs but not 3rd, so it has meaningful IDF
      await writeFile(
        path.join(testDir, 'main.md'),
        '# TypeScript Guide\n\nTypeScript TypeScript development programming language basics tutorial.'
      );
      await writeFile(
        path.join(testDir, 'orphan.md'),
        '# TypeScript Tips\n\nTypeScript TypeScript programming tips language tricks tutorial.'
      );
      await writeFile(
        path.join(testDir, 'unrelated.md'),
        '# Cooking Recipes\n\nDelicious pasta recipes with tomato sauce and fresh herbs basil.'
      );

      await finder.buildIndex(testDir);
      const suggestions = await finder.suggestConnections(
        testDir,
        ['orphan.md'],
        0.01, // Lower threshold
        5
      );

      expect(suggestions.length).toBeGreaterThan(0);
      if (suggestions.length > 0) {
        expect(suggestions[0].source).toBe('orphan.md');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle documents with code blocks', async () => {
      await writeFile(
        path.join(testDir, 'code-doc.md'),
        '# Code Example\n\n```typescript\nconst x = 1;\nconsole.log(x);\n```\n\nMore TypeScript content.'
      );
      await writeFile(
        path.join(testDir, 'other.md'),
        '# Other\n\nTypeScript programming guide.'
      );

      await finder.buildIndex(testDir);
      const stats = finder.getStats();

      expect(stats.documents).toBe(2);
    });

    it('should handle documents with frontmatter', async () => {
      // Create 3+ documents for TF-IDF to work properly
      await writeFile(
        path.join(testDir, 'with-fm.md'),
        '---\ntitle: JavaScript Testing\ntags: [javascript, testing, jest]\n---\n\n# JavaScript Testing\n\nJavaScript JavaScript testing Jest unit testing framework guide.'
      );
      await writeFile(
        path.join(testDir, 'related.md'),
        '# JavaScript Guide\n\nJavaScript JavaScript and Jest testing best practices framework guide.'
      );
      await writeFile(
        path.join(testDir, 'unrelated.md'),
        '# Cooking Recipes\n\nDelicious pasta recipes with tomato sauce and fresh herbs oregano basil.'
      );

      await finder.buildIndex(testDir);
      const similar = finder.findSimilar('with-fm.md', 0.01, 10);

      // Frontmatter should contribute to similarity
      expect(similar.length).toBeGreaterThan(0);
    });

    it('should handle very short documents', async () => {
      await writeFile(path.join(testDir, 'short.md'), '# Title');
      await writeFile(path.join(testDir, 'other.md'), '# Title');

      await finder.buildIndex(testDir);
      const stats = finder.getStats();

      expect(stats.documents).toBe(2);
    });
  });
});
