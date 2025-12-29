/**
 * Chunker Edge Cases and Integration Tests
 *
 * Note: When using small chunkSize values, always set overlap < chunkSize.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Chunker, chunkDocument } from '../../src/chunking/index';

// Helper function to generate paragraph text
function getSampleParagraphText(): string {
  return [
    'This is the first paragraph. It contains multiple sentences. Each sentence adds meaning.',
    '',
    'This is the second paragraph. It provides more context. The content flows naturally.',
    '',
    'This is the third paragraph. It concludes our sample. The ending is near.',
  ].join('\n');
}

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('Chunker - Edge Cases', () => {
  let chunker: Chunker;

  beforeEach(() => {
    chunker = new Chunker({ overlap: 0 });
  });

  describe('empty content', () => {
    it('should handle empty string', () => {
      const result = chunker.chunk('', 'test.txt');

      expect(result.chunks.length).toBe(0);
      expect(result.originalLength).toBe(0);
    });

    it('should handle whitespace-only content', () => {
      const whitespace = '   \n\n   \t\t   ';
      const result = chunker.chunk(whitespace, 'test.txt');

      expect(result.originalLength).toBe(whitespace.length);
    });
  });

  describe('very small content', () => {
    it('should handle single character', () => {
      const result = chunker.chunk('A', 'test.txt');

      expect(result.chunks.length).toBe(1);
      expect(result.chunks[0].content).toBe('A');
    });

    it('should handle single word', () => {
      const result = chunker.chunk('Hello', 'test.txt');

      expect(result.chunks.length).toBe(1);
    });

    it('should handle content smaller than chunkSize', () => {
      const result = chunker.chunk('Short', 'test.txt', { chunkSize: 10000 });

      expect(result.chunks.length).toBe(1);
    });
  });

  describe('very large content', () => {
    it('should handle very large content', () => {
      const content = 'A'.repeat(5000) + '\n\n' + 'B'.repeat(5000);
      const result = chunker.chunk(content, 'test.txt', {
        strategy: 'fixed',
        chunkSize: 500,
        overlap: 0,
      });

      expect(result.chunks.length).toBeGreaterThan(10);
      expect(result.originalLength).toBe(10002);
    });

    it('should track processing time', () => {
      const content = 'A'.repeat(5000) + '\n\n' + 'B'.repeat(5000);
      const result = chunker.chunk(content, 'test.txt', { strategy: 'paragraph' });

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(typeof result.processingTime).toBe('number');
    });
  });

  describe('special characters', () => {
    it('should handle unicode content', () => {
      const unicode = 'Hello World\n\nBonjour le monde\n\nHello World';
      const result = chunker.chunk(unicode, 'test.txt', { strategy: 'paragraph' });

      expect(result.chunks.length).toBeGreaterThan(0);
      result.chunks.forEach((chunk) => {
        expect(chunk.content.length).toBeGreaterThan(0);
      });
    });

    it('should handle special markdown characters', () => {
      const special = '***Bold and italic*** and `code` and > quote';
      const result = chunker.chunk(special, 'test.txt', { strategy: 'fixed', overlap: 0 });

      expect(result.chunks.length).toBe(1);
      expect(result.chunks[0].content).toBe(special);
    });
  });

  describe('boundary conditions', () => {
    it('should handle content exactly at chunkSize', () => {
      const content = 'A'.repeat(100);
      const result = chunker.chunk(content, 'test.txt', {
        strategy: 'fixed',
        chunkSize: 100,
        overlap: 0,
      });

      expect(result.chunks.length).toBe(1);
    });

    it('should handle minChunkSize constraint', () => {
      const content = 'Short.\n\nAlso short.';
      const result = chunker.chunk(content, 'test.txt', {
        strategy: 'paragraph',
        chunkSize: 1000,
        minChunkSize: 5,
        overlap: 0,
      });

      expect(result.chunks.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Chunker - Integration Tests', () => {
  it('should handle real-world markdown document', () => {
    const realWorldDoc = [
      '# Project README',
      '',
      'Welcome to the project documentation.',
      '',
      '## Installation',
      '',
      'Run the following command:',
      '',
      '```bash',
      'npm install my-package',
      '```',
      '',
      '## Usage',
      '',
      'Here is how to use the package:',
      '',
      '```typescript',
      'import { myFunction } from "my-package";',
      '',
      'const result = myFunction();',
      'console.log(result);',
      '```',
      '',
      '## License',
      '',
      'MIT - See LICENSE for details.',
    ].join('\n');

    const chunker = new Chunker({ overlap: 0 });
    const result = chunker.chunk(realWorldDoc, 'README.md', { strategy: 'code' });

    expect(result.chunks.length).toBeGreaterThan(1);
    expect(result.originalLength).toBe(realWorldDoc.length);

    const codeChunks = result.chunks.filter((c) => c.metadata.language);
    expect(codeChunks.length).toBeGreaterThan(0);
  });

  it('should handle technical documentation', () => {
    const techDoc = [
      '## API Endpoints',
      '',
      '### GET /users',
      '',
      'Retrieves all users.',
      '',
      '```json',
      '{',
      '  "users": [',
      '    { "id": 1, "name": "Alice" }',
      '  ]',
      '}',
      '```',
      '',
      '### POST /users',
      '',
      'Creates a new user.',
    ].join('\n');

    const result = chunkDocument(techDoc, 'api.md', {
      strategy: 'code',
      chunkSize: 500,
      overlap: 0,
    });

    expect(result.chunks.length).toBeGreaterThan(0);

    const jsonChunks = result.chunks.filter(
      (c) => c.metadata.language === 'json'
    );
    expect(jsonChunks.length).toBeGreaterThan(0);
  });

  it('should preserve content integrity', () => {
    const originalContent = getSampleParagraphText();
    const chunker = new Chunker({ overlap: 0 });

    const result = chunker.chunk(originalContent, 'test.txt', {
      strategy: 'paragraph',
      chunkSize: 200,
    });

    result.chunks.forEach((chunk) => {
      expect(chunk.content.trim().length).toBeGreaterThan(0);
    });

    expect(result.originalLength).toBe(originalContent.length);
  });
});
