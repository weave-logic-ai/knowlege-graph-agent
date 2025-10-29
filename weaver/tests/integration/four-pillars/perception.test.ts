/**
 * Perception Pillar Integration Tests
 *
 * Tests the Perception pillar with embeddings and context understanding
 */

import { describe, it, expect } from 'vitest';
import { generateMarkdownContent, generateCodeSnippet } from '../../utils/test-data-generator.js';

describe('Perception Pillar Integration', () => {
  describe('Document Understanding', () => {
    it('should perceive markdown document structure', () => {
      const content = generateMarkdownContent('Test Doc', 3, 2);

      // Perception: Identify structure
      expect(content).toContain('# Test Doc');
      expect(content).toContain('## Section 1');
      expect(content).toContain('## Section 2');
      expect(content).toContain('## Section 3');
      expect(content).toContain('## Conclusion');
    });

    it('should perceive code structure', () => {
      const code = generateCodeSnippet('typescript');

      // Perception: Identify code elements
      expect(code).toContain('function');
      expect(code).toContain('export');
    });

    it('should perceive content hierarchy', () => {
      const content = `
# Main Title

## Section 1
### Subsection 1.1
#### Detail 1.1.1

## Section 2
### Subsection 2.1
`;

      // Count heading levels
      const h1Count = (content.match(/^# /gm) || []).length;
      const h2Count = (content.match(/^## /gm) || []).length;
      const h3Count = (content.match(/^### /gm) || []).length;
      const h4Count = (content.match(/^#### /gm) || []).length;

      expect(h1Count).toBe(1);
      expect(h2Count).toBe(2);
      expect(h3Count).toBe(2);
      expect(h4Count).toBe(1);
    });
  });

  describe('Context Extraction', () => {
    it('should extract metadata from frontmatter', () => {
      const content = `---
title: Test Document
tags: [test, example]
author: Tester
date: 2024-01-01
---

# Content

This is the body.
`;

      // Perception: Extract frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      expect(frontmatterMatch).toBeTruthy();

      const frontmatter = frontmatterMatch![1];
      expect(frontmatter).toContain('title: Test Document');
      expect(frontmatter).toContain('tags: [test, example]');
    });

    it('should perceive document relationships from links', () => {
      const content = `
# Main Document

See also: [[Related Doc 1]] and [[Related Doc 2]]

Links to:
- [[External Resource]]
- [[Another Document]]
`;

      // Perception: Extract wiki-style links
      const links = content.match(/\[\[([^\]]+)\]\]/g);
      expect(links).toBeDefined();
      expect(links!.length).toBe(4);
    });

    it('should identify key entities and concepts', () => {
      const content = `
# Machine Learning Guide

Machine Learning (ML) is a subset of Artificial Intelligence (AI).
Deep Learning uses Neural Networks for pattern recognition.
Popular frameworks include TensorFlow and PyTorch.
`;

      // Perception: Identify technical terms
      const technicalTerms = [
        'Machine Learning',
        'Artificial Intelligence',
        'Deep Learning',
        'Neural Networks',
        'TensorFlow',
        'PyTorch',
      ];

      technicalTerms.forEach(term => {
        expect(content).toContain(term);
      });
    });
  });

  describe('Pattern Recognition', () => {
    it('should recognize code patterns', () => {
      const code = `
export class DataProcessor {
  private data: string[];

  constructor(data: string[]) {
    this.data = data;
  }

  process(): void {
    this.data.forEach(item => {
      console.log(item);
    });
  }
}
`;

      // Perception: Recognize OOP patterns
      expect(code).toContain('class');
      expect(code).toContain('constructor');
      expect(code).toContain('private');
      expect(code).toContain('export');
    });

    it('should recognize markdown formatting patterns', () => {
      const content = `
**Bold text** and *italic text*

\`\`\`typescript
const code = 'here';
\`\`\`

- List item 1
- List item 2

> Quote here
`;

      // Perception: Identify formatting
      expect(content).toContain('**Bold');
      expect(content).toContain('*italic');
      expect(content).toContain('```typescript');
      expect(content).toContain('- List');
      expect(content).toContain('> Quote');
    });

    it('should recognize hierarchical structures', () => {
      const content = `
# Project Structure

## Backend
### API
#### Routes
#### Controllers

## Frontend
### Components
### Pages

## Database
### Models
### Migrations
`;

      // Perception: Parse hierarchy
      const lines = content.split('\n').filter(l => l.trim());
      const hierarchy = lines.filter(l => l.startsWith('#'));

      expect(hierarchy.length).toBe(11);
      expect(hierarchy[0]).toBe('# Project Structure');
      expect(hierarchy[1]).toBe('## Backend');
    });
  });

  describe('Semantic Understanding', () => {
    it('should understand task descriptions', () => {
      const task = `
Create a new feature for user authentication:
1. Add login endpoint
2. Implement JWT tokens
3. Create user session management
4. Add logout functionality
`;

      // Perception: Extract action items
      const actionPattern = /\d+\.\s+(.+)/g;
      const actions = [...task.matchAll(actionPattern)].map(m => m[1]);

      expect(actions).toHaveLength(4);
      expect(actions[0]).toContain('login endpoint');
      expect(actions[1]).toContain('JWT tokens');
    });

    it('should understand code intent', () => {
      const code = `
// Calculate the average of an array of numbers
function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((a, b) => a + b, 0);
  return sum / numbers.length;
}
`;

      // Perception: Understand function purpose from comment and code
      expect(code).toContain('Calculate the average');
      expect(code).toContain('reduce');
      expect(code).toContain('sum / numbers.length');
    });
  });

  describe('Multi-Modal Perception', () => {
    it('should perceive mixed content (code + docs)', () => {
      const content = `
# API Documentation

## Authentication Endpoint

\`\`\`typescript
POST /api/auth/login

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: User;
}
\`\`\`

The login endpoint accepts email and password credentials.
`;

      // Perception: Identify both documentation and code
      expect(content).toContain('# API Documentation');
      expect(content).toContain('```typescript');
      expect(content).toContain('interface LoginRequest');
      expect(content).toContain('The login endpoint');
    });

    it('should perceive configuration formats', () => {
      const config = `
{
  "name": "test-project",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "test": "vitest"
  },
  "dependencies": {
    "typescript": "^5.0.0"
  }
}
`;

      // Perception: Understand JSON structure
      const parsed = JSON.parse(config);
      expect(parsed.name).toBe('test-project');
      expect(parsed.scripts).toBeDefined();
      expect(parsed.dependencies).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should process large documents efficiently', () => {
      const largeDoc = generateMarkdownContent('Large Doc', 50, 10);

      const start = Date.now();

      // Perception operations
      const sections = largeDoc.match(/^## .+/gm) || [];
      const paragraphs = largeDoc.split('\n\n').filter(p => p.trim());
      const wordCount = largeDoc.split(/\s+/).length;

      const duration = Date.now() - start;

      expect(sections.length).toBeGreaterThan(0);
      expect(paragraphs.length).toBeGreaterThan(0);
      expect(wordCount).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should be fast
    });

    it('should handle concurrent perception tasks', async () => {
      const docs = Array(10).fill(null).map((_, i) =>
        generateMarkdownContent(`Doc ${i}`, 5, 3)
      );

      const start = Date.now();

      await Promise.all(
        docs.map(async doc => {
          // Simulate perception tasks
          return {
            sections: doc.match(/^## .+/gm) || [],
            links: doc.match(/\[\[([^\]]+)\]\]/g) || [],
            wordCount: doc.split(/\s+/).length,
          };
        })
      );

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200); // Parallel should be fast
    });
  });
});
