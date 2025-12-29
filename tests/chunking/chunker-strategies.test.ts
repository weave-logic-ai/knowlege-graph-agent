/**
 * Chunker Strategy Tests - Sentence, Paragraph, Markdown, Code, Semantic
 *
 * Note: When using small chunkSize values, always set overlap < chunkSize.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Chunker } from '../../src/chunking/index';

// Helper functions to generate test data on demand
function getSampleParagraphText(): string {
  return [
    'This is the first paragraph. It contains multiple sentences. Each sentence adds meaning.',
    '',
    'This is the second paragraph. It provides more context. The content flows naturally.',
    '',
    'This is the third paragraph. It concludes our sample. The ending is near.',
  ].join('\n');
}

function getSampleMarkdown(): string {
  return [
    '# Main Title',
    '',
    'This is the introduction paragraph with some context.',
    '',
    '## Section One',
    '',
    'Content for section one goes here. It explains important concepts.',
    '',
    '### Subsection A',
    '',
    'Detailed information about subsection A. More details follow.',
    '',
    '## Section Two',
    '',
    'Content for section two. Different topic entirely.',
  ].join('\n');
}

function getSampleCodeDocument(): string {
  return [
    '# Code Example',
    '',
    'This is a tutorial about TypeScript functions.',
    '',
    '```typescript',
    'function greet(name: string): string {',
    '  return `Hello, ${name}!`;',
    '}',
    '',
    'const result = greet("World");',
    'console.log(result);',
    '```',
    '',
    'The above function demonstrates basic TypeScript syntax.',
    '',
    '```javascript',
    'const add = (a, b) => a + b;',
    '```',
    '',
    'JavaScript version for comparison.',
  ].join('\n');
}

// ============================================================================
// Sentence Strategy Tests
// ============================================================================

describe('Chunker - Sentence Strategy', () => {
  let chunker: Chunker;

  beforeEach(() => {
    chunker = new Chunker({ strategy: 'sentence', overlap: 0 });
  });

  it('should chunk by sentence boundaries', () => {
    const content = 'First sentence. Second sentence! Third sentence? Fourth one.';
    const result = chunker.chunk(content, 'test.txt', { strategy: 'sentence' });

    expect(result.strategy).toBe('sentence');
    expect(result.chunks.length).toBeGreaterThan(0);
  });

  it('should aggregate sentences to reach target size', () => {
    const content = 'Short. Very short. Also short.';
    const result = chunker.chunk(content, 'test.txt', {
      strategy: 'sentence',
      chunkSize: 100,
      overlap: 0,
    });

    expect(result.chunks.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// Paragraph Strategy Tests
// ============================================================================

describe('Chunker - Paragraph Strategy', () => {
  let chunker: Chunker;

  beforeEach(() => {
    chunker = new Chunker({ strategy: 'paragraph', overlap: 0 });
  });

  it('should chunk by paragraph boundaries', () => {
    const result = chunker.chunk(getSampleParagraphText(), 'test.txt', { strategy: 'paragraph' });

    expect(result.strategy).toBe('paragraph');
    expect(result.chunks.length).toBeGreaterThan(0);
  });

  it('should respect paragraph structure', () => {
    const result = chunker.chunk(getSampleParagraphText(), 'test.txt', {
      strategy: 'paragraph',
      chunkSize: 500,
      overlap: 0,
    });

    result.chunks.forEach((chunk) => {
      const trimmed = chunk.content.trim();
      expect(trimmed.length).toBeGreaterThan(0);
    });
  });

  it('should combine small paragraphs when under chunkSize', () => {
    const smallParagraphs = 'One.\n\nTwo.\n\nThree.';
    const result = chunker.chunk(smallParagraphs, 'test.txt', {
      strategy: 'paragraph',
      chunkSize: 1000,
      overlap: 0,
    });

    expect(result.chunks.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// Markdown Strategy Tests
// ============================================================================

describe('Chunker - Markdown Strategy', () => {
  let chunker: Chunker;

  beforeEach(() => {
    chunker = new Chunker({ strategy: 'markdown', overlap: 0 });
  });

  it('should chunk by markdown headers', () => {
    const result = chunker.chunk(getSampleMarkdown(), 'test.md', { strategy: 'markdown' });

    expect(result.strategy).toBe('markdown');
    expect(result.chunks.length).toBeGreaterThan(1);
  });

  it('should extract headings hierarchy', () => {
    const result = chunker.chunk(getSampleMarkdown(), 'test.md', { strategy: 'markdown' });

    const chunksWithHeadings = result.chunks.filter(
      (c) => c.metadata.headings && c.metadata.headings.length > 0
    );
    expect(chunksWithHeadings.length).toBeGreaterThan(0);
  });

  it('should handle markdown without headers', () => {
    const noHeaders = 'Just plain text.\n\nAnother paragraph.';
    const result = chunker.chunk(noHeaders, 'test.md', { strategy: 'markdown' });

    expect(result.chunks.length).toBeGreaterThan(0);
  });

  it('should handle nested headers', () => {
    const nestedHeaders = '# Level 1\nContent\n## Level 2\nMore content\n### Level 3\nEven more';

    const result = chunker.chunk(nestedHeaders, 'test.md', { strategy: 'markdown' });

    expect(result.chunks.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Code Strategy Tests
// ============================================================================

describe('Chunker - Code Strategy', () => {
  let chunker: Chunker;

  beforeEach(() => {
    chunker = new Chunker({ strategy: 'code', overlap: 0 });
  });

  it('should identify code blocks', () => {
    const result = chunker.chunk(getSampleCodeDocument(), 'test.md', { strategy: 'code' });

    const codeChunks = result.chunks.filter((c) => c.metadata.language);
    expect(codeChunks.length).toBeGreaterThan(0);
  });

  it('should extract language from code blocks', () => {
    const result = chunker.chunk(getSampleCodeDocument(), 'test.md', { strategy: 'code' });

    const codeChunks = result.chunks.filter((c) => c.metadata.language);

    const languages = codeChunks
      .map((c) => c.metadata.language)
      .filter(Boolean);
    expect(languages).toContain('typescript');
    expect(languages).toContain('javascript');
  });

  it('should chunk surrounding text separately', () => {
    const result = chunker.chunk(getSampleCodeDocument(), 'test.md', { strategy: 'code' });

    const textChunks = result.chunks.filter((c) => !c.metadata.language);
    expect(textChunks.length).toBeGreaterThan(0);
  });

  it('should handle document without code blocks', () => {
    const noCode = 'Just plain text without any code blocks.';
    const result = chunker.chunk(noCode, 'test.txt', { strategy: 'code' });

    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.chunks.every((c) => !c.metadata.language)).toBe(true);
  });

  it('should handle code blocks without language specifier', () => {
    const codeNoLang = 'Text\n\n```\nsome code\n```\n\nMore text';
    const result = chunker.chunk(codeNoLang, 'test.md', { strategy: 'code' });

    const codeChunks = result.chunks.filter((c) => c.metadata.language);
    expect(codeChunks.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Semantic Strategy Tests
// ============================================================================

describe('Chunker - Semantic Strategy', () => {
  let chunker: Chunker;

  beforeEach(() => {
    chunker = new Chunker({ strategy: 'semantic', overlap: 0 });
  });

  it('should chunk semantically (falls back to paragraph)', () => {
    const result = chunker.chunk(getSampleParagraphText(), 'test.txt', { strategy: 'semantic' });

    expect(result.strategy).toBe('semantic');
    expect(result.chunks.length).toBeGreaterThan(0);
  });

  it('should work with default options', () => {
    const result = chunker.chunk(getSampleParagraphText(), 'test.txt');

    expect(result.chunks.length).toBeGreaterThan(0);
  });
});
